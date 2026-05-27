import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, Linking, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';
const BG = '#F0F4F8';
const GREEN = '#2D9B6F';
const CRIMSON = '#C0392B';
 
const TABS = [
  { key: 'about', label: 'About', icon: 'information-outline' },
  { key: 'org', label: 'Organisation', icon: 'sitemap' },
  { key: 'schemes', label: 'Schemes', icon: 'clipboard-list-outline' },
  { key: 'pop', label: 'Population', icon: 'account-group-outline' },
  { key: 'places', label: 'Places', icon: 'map-marker-star-outline' },
];
 
function officialSite(corpName) {
  const n = (corpName || '').toLowerCase();
  if (n.includes('chennai')) return 'https://chennaicorporation.gov.in';
  if (n.includes('coimbatore')) return 'https://ccmc.gov.in';
  if (n.includes('madurai')) return 'https://maduraicorporation.gov.in';
  if (n.includes('trichy') || n.includes('tiruchirappalli')) return 'https://www.tmc.tn.gov.in';
  return 'https://www.tnurbantree.tn.gov.in';
}
 
async function fetchAI(systemPrompt, userPrompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0,
      max_tokens: 2000,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI ${response.status}: ${body.slice(0, 120)}`);
  }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');
  return cleanJSON(content);
}
 
function cleanJSON(raw) {
  if (!raw) throw new Error('Empty AI response');
  let s = raw
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/g, '').trim();
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a === -1 || b === -1) throw new Error('No JSON in AI response');
  return s.slice(a, b + 1)
    .replace(/(\d)_(\d)/g, '$1$2')
    .replace(/,\s*([}\]])/g, '$1');
}
 
function sysPrompt(corpName, districtName) {
  const site = officialSite(corpName);
  return `You are a civic data assistant for Tamil Nadu, India.
 
SEARCH these official government sources for "${corpName}, ${districtName}, Tamil Nadu":
- ${site}
- https://www.tnurbantree.tn.gov.in
- https://tnmaws.gov.in
- https://www.tn.gov.in
- https://censusindia.gov.in
- Wikipedia: "${corpName} Tamil Nadu"
 
Rules:
1. Use ONLY real data found on these websites. Do NOT invent data.
2. If a field is not found write: "Not available on official website".
3. Return ONLY a raw JSON object — start with { end with }.
4. No markdown, no explanation, no code fences.
5. Plain numbers only — no underscores (8653949 not 8_653_949).`;
}
 
function userPrompt(tab, corpName, districtName) {
  const name = `${corpName}, ${districtName}, Tamil Nadu`;
 
  if (tab === 'about') return `Search official website and Wikipedia for "${name}". Return:
{
  "type": "Corporation or Municipality or Town Panchayat",
  "established": "year",
  "mayor_or_chairman": "current name",
  "commissioner": "current name",
  "headquarters": "full address",
  "wards": number,
  "area_sqkm": number,
  "overview": "2-3 sentences from official site",
  "key_facts": ["fact1","fact2","fact3","fact4"],
  "source": "URL used"
}`;
 
  if (tab === 'org') return `Search official website and tnmaws.gov.in for "${name}". Return:
{
  "elected_body": [
    { "role": "Mayor / Chairman", "description": "current name and role" },
    { "role": "Deputy Mayor", "description": "current name" },
    { "role": "Ward Councillors", "description": "count and election year" }
  ],
  "administrative": [
    { "role": "Commissioner", "description": "current name and responsibilities" },
    { "role": "Additional Commissioner", "description": "responsibilities" },
    { "role": "Revenue Officer", "description": "responsibilities" },
    { "role": "Health Officer", "description": "responsibilities" },
    { "role": "City Engineer", "description": "responsibilities" },
    { "role": "Town Planning Officer", "description": "responsibilities" }
  ],
  "departments": ["dept1","dept2","dept3"],
  "source": "URL used"
}`;
 
  if (tab === 'schemes') return `Search tnurbantree.tn.gov.in, tn.gov.in for ACTIVE schemes in "${name}". Include PMAY, AMRUT, SBM, Smart Cities, TNSCB. Return:
{
  "central_schemes": [
    { "name": "scheme", "ministry": "ministry", "benefit": "benefit", "eligibility": "who", "how_to_apply": "where" }
  ],
  "state_schemes": [
    { "name": "scheme", "department": "dept", "benefit": "benefit", "eligibility": "who", "how_to_apply": "where" }
  ],
  "corporation_schemes": [
    { "name": "local scheme", "benefit": "benefit", "eligibility": "who" }
  ],
  "source": "URLs used"
}`;
 
  if (tab === 'pop') return `Search censusindia.gov.in for 2011 Census data for "${name}". Return:
{
  "total_population": number,
  "population_year": "Census 2011 (Official)",
  "male": number,
  "female": number,
  "sex_ratio": number,
  "literacy_rate": "percentage",
  "population_density": "per sq km",
  "sc_population": number or "Not available",
  "st_population": number or "Not available",
  "household_count": number or "Not available",
  "growth_rate": "2001 to 2011 %",
  "languages": ["Tamil","others"],
  "source": "census URL"
}`;
 
  if (tab === 'places') return `Search tamilnadutourism.tn.gov.in and Wikipedia for real places in "${name}". Return:
{
  "tourist_spots": [
    { "name": "place", "type": "Temple|Fort|Lake|Park|Museum|Monument|Beach|Dam", "description": "2 sentences", "distance_from_center": "X km", "entry_fee": "free or Rs amount" }
  ],
  "religious_places": [
    { "name": "place", "deity_or_faith": "deity/faith", "significance": "why important", "location": "area" }
  ],
  "nature_spots": [
    { "name": "place", "description": "what it is", "best_time": "season" }
  ],
  "local_attractions": [
    { "name": "place", "why_visit": "reason", "location": "area" }
  ],
  "source": "URLs used"
}`;
 
  return '{}';
}
 
// ─────────────────────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
const CorpDetailScreen = ({ route, navigation }) => {
  const { corp, districtName = '', stateName = '' } = route?.params || {};
 
  const [activeTab, setActiveTab] = useState('about');
  const [tabData, setTabData] = useState({});
  const [tabLoading, setTabLoading] = useState({});
  const [tabError, setTabError] = useState({});
  const [refreshing, setRefreshing] = useState(false);
 
  if (!corp?.corpName) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={52} color={CRIMSON} />
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#2D3748', marginTop: 14 }}>
          Corporation data missing
        </Text>
        <TouchableOpacity style={{ marginTop: 20, backgroundColor: NAVY, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 28 }}
          onPress={() => navigation.goBack()}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
 
  const fetchTab = useCallback(async (tab, force = false) => {
    if (!force && tabData[tab] !== undefined) return;
    setTabLoading(p => ({ ...p, [tab]: true }));
    setTabError(p => ({ ...p, [tab]: null }));
    try {
      const sys = sysPrompt(corp.corpName, districtName);
      const user = userPrompt(tab, corp.corpName, districtName);
      const raw = await fetchAI(sys, user);
      const obj = JSON.parse(raw);
      setTabData(p => ({ ...p, [tab]: obj }));
    } catch (err) {
      console.error(`[Detail] ${tab}:`, err.message);
      setTabError(p => ({ ...p, [tab]: err.message }));
    } finally {
      setTabLoading(p => ({ ...p, [tab]: false }));
    }
  }, [tabData, corp.corpName, districtName]);
 
  useEffect(() => { fetchTab(activeTab); }, [activeTab]);
 
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTabData({});
    setTabError({});
    await fetchTab(activeTab, true);
    setRefreshing(false);
  }, [activeTab, fetchTab]);
 
  const retryTab = () => {
    setTabData(p => { const n = { ...p }; delete n[activeTab]; return n; });
    setTabError(p => { const n = { ...p }; delete n[activeTab]; return n; });
  };
  useEffect(() => {
    if (!tabData[activeTab] && !tabLoading[activeTab] && !tabError[activeTab])
      fetchTab(activeTab);
  }, [tabData, activeTab]);
 
  const openMap = () => Linking.openURL(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${corp.corpName}, ${districtName}, Tamil Nadu`)}`
  );
 
  const d = tabData[activeTab];
  const L = tabLoading[activeTab];
  const E = tabError[activeTab];
 
  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />
 
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{corp.corpName}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {[districtName, stateName].filter(Boolean).join(' › ')}
          </Text>
        </View>
        <TouchableOpacity style={styles.mapBtn} onPress={openMap}>
          <MaterialCommunityIcons name="google-maps" size={20} color={GOLD} />
        </TouchableOpacity>
      </View>
 
      <View style={styles.strip}>
        {corp.wardCount != null && (
          <View style={styles.stripItem}>
            <MaterialCommunityIcons name="grid" size={13} color={GOLD} />
            <Text style={styles.stripText}>{corp.wardCount} Wards</Text>
          </View>
        )}
        {corp.population && (
          <View style={styles.stripItem}>
            <MaterialCommunityIcons name="account-group" size={13} color={GOLD} />
            <Text style={styles.stripText}>{corp.population}</Text>
          </View>
        )}
        <View style={styles.stripItem}>
          <MaterialCommunityIcons name="web" size={13} color={GOLD} />
          <Text style={styles.stripText}>Live • Official sites</Text>
        </View>
      </View>
 
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarInner}>
          {TABS.map(t => (
            <TouchableOpacity key={t.key}
              style={[styles.pill, activeTab === t.key && styles.pillActive]}
              onPress={() => setActiveTab(t.key)}>
              <MaterialCommunityIcons name={t.icon} size={14}
                color={activeTab === t.key ? '#fff' : NAVY} />
              <Text style={[styles.pillText, activeTab === t.key && styles.pillTextActive]}>
                {t.label}
              </Text>
              {tabData[t.key] && activeTab !== t.key && <View style={styles.dot} />}
              {tabLoading[t.key] && activeTab !== t.key &&
                <ActivityIndicator size={8} color={GOLD} style={{ marginLeft: 4 }} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
 
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            colors={[NAVY]} tintColor={NAVY}
            title="Fetching from official sites…" titleColor="#6B7A8D" />
        }>
 
        {L && (
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <ActivityIndicator size="large" color={GOLD} />
            <Text style={styles.loadTitle}>Searching official website…</Text>
            <Text style={styles.loadSub}>{officialSite(corp.corpName).replace('https://', '')}</Text>
          </View>
        )}
 
        {E && !L && (
          <View style={styles.errBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={32} color={CRIMSON} />
            <Text style={styles.errTitle}>Could not fetch data</Text>
            <View style={styles.errMsg}><Text style={styles.errMsgText} selectable>{E}</Text></View>
            <TouchableOpacity style={styles.retryBtn} onPress={retryTab}>
              <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
              <Text style={styles.retryText}> Retry</Text>
            </TouchableOpacity>
          </View>
        )}
 
        {d && !L && (
          <>
            {d.source && (
              <View style={styles.srcBadge}>
                <MaterialCommunityIcons name="check-circle" size={12} color={GREEN} />
                <Text style={styles.srcText} numberOfLines={1}> Source: {d.source}</Text>
              </View>
            )}
            {activeTab === 'about' && <AboutTab data={d} />}
            {activeTab === 'org' && <OrgTab data={d} />}
            {activeTab === 'schemes' && <SchemesTab data={d} />}
            {activeTab === 'pop' && <PopTab data={d} />}
            {activeTab === 'places' && <PlacesTab data={d} />}
          </>
        )}
      </ScrollView>
    </View>
  );
};
 
// ── Shared primitives ──────────────────────────────────────────────────────────
const Card = ({ children }) => <View style={styles.card}>{children}</View>;
 
const SecTitle = ({ icon, title, color = NAVY }) => (
  <View style={styles.secRow}>
    <View style={[styles.secIcon, { backgroundColor: `${color}18` }]}>
      <MaterialCommunityIcons name={icon} size={14} color={color} />
    </View>
    <Text style={styles.secTitle}>{title}</Text>
  </View>
);
 
const Field = ({ icon, label, value }) => {
  if (!value || value === 'Not available on official website') return null;
  return (
    <View style={styles.field}>
      <MaterialCommunityIcons name={icon} size={14} color={NAVY} style={{ marginRight: 6, marginTop: 1 }} />
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
};
 
const Chip = ({ label, color = NAVY }) => (
  <View style={[styles.chip, { backgroundColor: `${color}14` }]}>
    <Text style={[styles.chipText, { color }]}>{label}</Text>
  </View>
);
 
const Bullet = ({ text }) => (
  <View style={styles.bullet}>
    <Text style={styles.bulletDot}>•</Text>
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);
 
const HItem = ({ item, color }) => (
  <View style={[styles.hItem, { borderLeftColor: `${color}60` }]}>
    <Text style={styles.hRole}>{item.role}</Text>
    <Text style={styles.hDesc}>{item.description}</Text>
  </View>
);
 
// ── Tab components ────────────────────────────────────────────────────────────
const AboutTab = ({ data }) => (
  <>
    <Card>
      <SecTitle icon="information" title="Overview" />
      <View style={styles.chipRow}>
        {data.type && <Chip label={data.type} color={GREEN} />}
        {data.established && data.established !== 'Not available on official website' &&
          <Chip label={`Est. ${data.established}`} color={GOLD} />}
        {data.wards > 0 && <Chip label={`${data.wards} Wards`} />}
        {data.area_sqkm > 0 && <Chip label={`${data.area_sqkm} km²`} />}
      </View>
      <Text style={styles.overview}>{data.overview}</Text>
    </Card>
    <Card>
      <SecTitle icon="account-tie" title="Current Leadership" />
      <Field icon="crown" label="Mayor/Chair" value={data.mayor_or_chairman} />
      <Field icon="briefcase" label="Commissioner" value={data.commissioner} />
      <Field icon="map-marker" label="Headquarters" value={data.headquarters} />
    </Card>
    {data.key_facts?.length > 0 && (
      <Card>
        <SecTitle icon="lightbulb-outline" title="Key Facts" color={GOLD} />
        {data.key_facts.map((f, i) => <Bullet key={i} text={f} />)}
      </Card>
    )}
  </>
);
 
const OrgTab = ({ data }) => (
  <>
    <Card>
      <SecTitle icon="account-multiple" title="Elected Body" color={GREEN} />
      {(data.elected_body || []).map((r, i) => <HItem key={i} item={r} color={GREEN} />)}
    </Card>
    <Card>
      <SecTitle icon="sitemap" title="Administrative Officers" color={NAVY} />
      {(data.administrative || []).map((r, i) => <HItem key={i} item={r} color={NAVY} />)}
    </Card>
    {data.departments?.length > 0 && (
      <Card>
        <SecTitle icon="office-building-cog" title="Departments" color={GOLD} />
        <View style={styles.chipRow}>
          {data.departments.map((d, i) => <Chip key={i} label={d} color={NAVY} />)}
        </View>
      </Card>
    )}
  </>
);
 
const SchemeCard = ({ scheme, color }) => (
  <View style={[styles.schemeCard, { borderLeftColor: color, backgroundColor: `${color}08` }]}>
    <Text style={styles.schemeName}>{scheme.name}</Text>
    <Text style={[styles.schemeDept, { color }]}>{scheme.ministry || scheme.department}</Text>
    <Text style={styles.schemeBenefit}>{scheme.benefit}</Text>
    {scheme.eligibility && (
      <View style={styles.schemeRow}>
        <MaterialCommunityIcons name="account-check" size={11} color={GREEN} />
        <Text style={[styles.schemeRowText, { color: GREEN }]}> {scheme.eligibility}</Text>
      </View>
    )}
    {scheme.how_to_apply && (
      <View style={styles.schemeRow}>
        <MaterialCommunityIcons name="information" size={11} color={NAVY} />
        <Text style={[styles.schemeRowText, { color: NAVY }]}> {scheme.how_to_apply}</Text>
      </View>
    )}
  </View>
);
 
const SchemesTab = ({ data }) => (
  <>
    {data.central_schemes?.length > 0 && (
      <Card>
        <SecTitle icon="flag-outline" title="Central Government Schemes" color={GREEN} />
        {data.central_schemes.map((s, i) => <SchemeCard key={i} scheme={s} color={GREEN} />)}
      </Card>
    )}
    {data.state_schemes?.length > 0 && (
      <Card>
        <SecTitle icon="domain" title="Tamil Nadu State Schemes" color={NAVY} />
        {data.state_schemes.map((s, i) => <SchemeCard key={i} scheme={s} color={NAVY} />)}
      </Card>
    )}
    {data.corporation_schemes?.length > 0 && (
      <Card>
        <SecTitle icon="office-building" title="Corporation / Local Schemes" color={GOLD} />
        {data.corporation_schemes.map((s, i) => <SchemeCard key={i} scheme={s} color={GOLD} />)}
      </Card>
    )}
  </>
);
 
const StatBox = ({ label, value, color }) => (
  <View style={[styles.statBox, { backgroundColor: `${color}0E` }]}>
    <Text style={[styles.statVal, { color }]}>
      {typeof value === 'number' ? value.toLocaleString('en-IN') : (value || 'N/A')}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);
 
const PopTab = ({ data }) => (
  <>
    <Card>
      <SecTitle icon="account-group" title="Population — 2011 Census (Official)" />
      <View style={styles.statGrid}>
        <StatBox label="Total" value={data.total_population} color={NAVY} />
        <StatBox label="Male" value={data.male} color={GREEN} />
        <StatBox label="Female" value={data.female} color={CRIMSON} />
        <StatBox label="Sex Ratio" value={data.sex_ratio != null ? String(data.sex_ratio) : null} color={GOLD} />
      </View>
      <Text style={styles.cenNote}>{data.population_year}</Text>
    </Card>
    <Card>
      <SecTitle icon="chart-bar" title="Demographics" color={GREEN} />
      <Field icon="book-open-outline" label="Literacy" value={data.literacy_rate} />
      <Field icon="ruler-square" label="Density" value={data.population_density} />
      <Field icon="trending-up" label="Growth" value={data.growth_rate} />
      <Field icon="home-outline" label="Households" value={data.household_count != null ? String(data.household_count) : null} />
    </Card>
    {data.languages?.length > 0 && (
      <Card>
        <SecTitle icon="translate" title="Languages" color={GOLD} />
        <View style={styles.chipRow}>
          {data.languages.map((l, i) => <Chip key={i} label={l} color={NAVY} />)}
        </View>
      </Card>
    )}
  </>
);
 
const PlaceItem = ({ place, icon, color }) => (
  <View style={[styles.placeItem, { borderLeftColor: `${color}60` }]}>
    <View style={styles.placeRow}>
      <MaterialCommunityIcons name={icon} size={13} color={color} />
      <Text style={styles.placeName} numberOfLines={1}> {place.name}</Text>
      {(place.type || place.deity_or_faith) && (
        <View style={[styles.typeTag, { backgroundColor: `${color}16` }]}>
          <Text style={[styles.typeTagText, { color }]}>{place.type || place.deity_or_faith}</Text>
        </View>
      )}
    </View>
    <Text style={styles.placeDesc}>{place.description || place.significance || place.why_visit}</Text>
    <View style={styles.placeMeta}>
      {place.distance_from_center && <Text style={styles.placeDist}>{place.distance_from_center}</Text>}
      {place.best_time && <Text style={styles.placeBest}>Best: {place.best_time}</Text>}
      {place.entry_fee && <Text style={styles.placeFee}>{place.entry_fee}</Text>}
    </View>
    {place.location && <Text style={styles.placeLoc}>{place.location}</Text>}
  </View>
);
 
const PlacesTab = ({ data }) => (
  <>
    {data.tourist_spots?.length > 0 && (
      <Card>
        <SecTitle icon="camera-outline" title="Tourist Spots" color={GREEN} />
        {data.tourist_spots.map((p, i) => <PlaceItem key={i} place={p} icon="camera" color={GREEN} />)}
      </Card>
    )}
    {data.religious_places?.length > 0 && (
      <Card>
        <SecTitle icon="church" title="Religious Places" color={GOLD} />
        {data.religious_places.map((p, i) => <PlaceItem key={i} place={p} icon="star-david" color={GOLD} />)}
      </Card>
    )}
    {data.nature_spots?.length > 0 && (
      <Card>
        <SecTitle icon="tree-outline" title="Nature & Parks" color={GREEN} />
        {data.nature_spots.map((p, i) => <PlaceItem key={i} place={p} icon="tree" color={GREEN} />)}
      </Card>
    )}
    {data.local_attractions?.length > 0 && (
      <Card>
        <SecTitle icon="map-marker-star" title="Local Attractions" color={NAVY} />
        {data.local_attractions.map((p, i) => <PlaceItem key={i} place={p} icon="storefront-outline" color={NAVY} />)}
      </Card>
    )}
  </>
);
 
// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
 
  header: {
    backgroundColor: NAVY, flexDirection: 'row', alignItems: 'center',
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 48,
    paddingBottom: 14, paddingHorizontal: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  mapBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
 
  strip: {
    backgroundColor: NAVY, flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, paddingBottom: 12, gap: 12,
  },
  stripItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stripText: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '500', maxWidth: 180 },
 
  tabBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabBarInner: { paddingHorizontal: 10, paddingVertical: 8, gap: 6 },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#F0F4F8',
  },
  pillActive: { backgroundColor: NAVY },
  pillText: { fontSize: 12, fontWeight: '600', color: NAVY, marginLeft: 4 },
  pillTextActive: { color: '#fff' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: GREEN, marginLeft: 5 },
 
  content: { padding: 12, paddingBottom: 40 },
 
  srcBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: `${GREEN}12`, borderRadius: 8,
    paddingVertical: 5, paddingHorizontal: 10, marginBottom: 10,
  },
  srcText: { fontSize: 11, color: GREEN, fontWeight: '500', flex: 1 },
 
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
 
  secRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  secIcon: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  secTitle: { fontSize: 14, fontWeight: '700', color: NAVY },
 
  field: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  fieldLabel: { fontSize: 12, color: '#6B7A8D', width: 90, fontWeight: '600' },
  fieldValue: { fontSize: 13, color: '#2D3748', fontWeight: '500', flex: 1 },
 
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: { borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  chipText: { fontSize: 11, fontWeight: '600' },
 
  bullet: { flexDirection: 'row', marginBottom: 7 },
  bulletDot: { color: GOLD, fontWeight: '700', marginRight: 7, fontSize: 14 },
  bulletText: { fontSize: 13, color: '#4A5568', flex: 1, lineHeight: 19 },
 
  overview: { fontSize: 13, color: '#4A5568', lineHeight: 20 },
 
  hItem: { marginBottom: 10, paddingLeft: 10, borderLeftWidth: 3 },
  hRole: { fontSize: 13, fontWeight: '700', color: NAVY },
  hDesc: { fontSize: 12, color: '#6B7A8D', marginTop: 2, lineHeight: 18 },
 
  schemeCard: { marginBottom: 12, padding: 11, borderRadius: 10, borderLeftWidth: 3 },
  schemeName: { fontSize: 13, fontWeight: '700', color: NAVY },
  schemeDept: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  schemeBenefit: { fontSize: 12, color: '#4A5568', marginTop: 4, lineHeight: 18 },
  schemeRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 5 },
  schemeRowText: { fontSize: 11, fontWeight: '500', flex: 1, lineHeight: 16 },
 
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  statBox: { width: '48%', borderRadius: 10, padding: 12, alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#6B7A8D', marginTop: 3, textAlign: 'center' },
  cenNote: { fontSize: 11, color: '#8090A0', textAlign: 'center' },
 
  placeItem: { marginBottom: 12, paddingLeft: 10, borderLeftWidth: 3 },
  placeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  placeName: { fontSize: 13, fontWeight: '700', color: NAVY, flex: 1 },
  typeTag: { borderRadius: 8, paddingVertical: 2, paddingHorizontal: 7 },
  typeTagText: { fontSize: 10, fontWeight: '600' },
  placeDesc: { fontSize: 12, color: '#6B7A8D', lineHeight: 17 },
  placeMeta: { flexDirection: 'row', gap: 10, marginTop: 4, flexWrap: 'wrap' },
  placeDist: { fontSize: 11, color: GOLD, fontWeight: '600' },
  placeBest: { fontSize: 11, color: GREEN, fontWeight: '500' },
  placeFee: { fontSize: 11, color: NAVY, fontWeight: '500' },
  placeLoc: { fontSize: 11, color: '#8090A0', marginTop: 2 },
 
  loadTitle: { color: '#2D3748', marginTop: 14, fontSize: 15, fontWeight: '600' },
  loadSub: { color: '#6B7A8D', marginTop: 4, fontSize: 12, textAlign: 'center' },
 
  errBox: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  errTitle: { fontSize: 15, fontWeight: '700', color: CRIMSON, marginTop: 10 },
  errMsg: { marginTop: 10, padding: 12, backgroundColor: '#FFF0F0', borderRadius: 8, width: '100%' },
  errMsgText: { fontSize: 12, color: CRIMSON, lineHeight: 18 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingVertical: 10, paddingHorizontal: 24, backgroundColor: NAVY, borderRadius: 24 },
  retryText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
 
export default CorpDetailScreen;
 
 