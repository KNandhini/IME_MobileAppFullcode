import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Linking, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../utils/api';
import { localBodyService } from '../services/localBodyService';
import { CorpDetailsScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

const NAVY = COLORS.primary;
const GOLD = COLORS.accent;
const BG = COLORS.bg;
const GREEN = '#2D9B6F';
const CRIMSON = '#C0392B';

const TABS = [
  { key: 'about', label: 'About', icon: 'information-outline' },
];

// Module-level cache: corpKey → { pageText, sourceUrl }
const _scrapeCache = {};

async function scrapeCorpPage(corpName, stateName) {
  const key = `${corpName}__${stateName}`.toLowerCase();
  if (_scrapeCache[key] !== undefined) return _scrapeCache[key];

  try {
    const res = await api.get(
      `/MunicipalCorp/scrape/${encodeURIComponent(corpName)}`,
      { params: { state: stateName }, timeout: 80000 }
    );
    const data = res.data?.data;

    // Log every URL result
    (data?.urlResults || []).forEach((r, i) => {
      console.log(`[Scrape URL ${i}] ${r.success ? '✓' : '✗'} ${r.url}`,
        r.success ? `(${r.pageText?.length ?? 0} chars)` : '');
    });

    // Use the backend's combined pageText — it already merges ALL successful URLs
    // (Wikipedia + tnurbantree) and is capped at 14 000 chars for optimal AI use.
    const result = data?.pageText
      ? { pageText: data.pageText, sourceUrl: data?.sourceUrl, urlResults: data?.urlResults, officers: data?.officers || [] }
      : null;

    _scrapeCache[key] = result;
    return result;
  } catch (err) {
    console.warn('[Scrape] request failed:', err.message);
    _scrapeCache[key] = null;
    return null;
  }
}
 
async function fetchAI(systemPrompt, userPrompt) {
  const res = await api.post(
    '/MunicipalCorp/ai-detail',
    { systemPrompt, userPrompt },
    { timeout: 60000 }
  );
  if (!res.data?.success) throw new Error(res.data?.message || 'AI request failed');
  const content = res.data.data;
  if (!content) throw new Error('Empty response from AI');
  console.log('[AI raw]', content.slice(0, 300));
  return cleanJSON(content);
}
 
function cleanJSON(raw) {
  if (!raw) throw new Error('Empty AI response');

  let s = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/g, '')
    .trim();

  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a === -1 || b === -1) throw new Error('No JSON in AI response');
  s = s.slice(a, b + 1);

  // ❌ REMOVE THIS LINE — it destroys https:// URLs inside JSON strings:
  // s = s.replace(/\/\/[^\n\r"]*/g, '');

  s = s.replace(/(\d)_(\d)/g, '$1$2');
  s = s.replace(/,+\s*([}\]])/g, '$1');
  s = s.replace(/,(\s*,)+/g, ',');

  return s;
}
function sysPrompt(corpName, districtName, stateName, sourceUrl, pageText) {
  let prompt = `You are a civic data extractor for Indian municipal bodies.
Extract structured data for "${corpName}, ${districtName}, ${stateName}".

The content below has TWO blocks — they have DIFFERENT priorities:

BLOCK 1 — "KEY OFFICERS" (from the official government website tnurbantree):
  - Format: "ROLE: Name"  e.g. "COMMISSIONER: Thiru.ARPIT JAIN, I.A.S"
  - This is the OFFICIAL and MOST CURRENT data. Always prefer this for person names.

BLOCK 2 — "KEY INFORMATION" (from Wikipedia infobox):
  - Format: "Role: Name"  e.g. "Commissioner: V. Sivakrishnamoorthy IAS"
  - Wikipedia is often OUTDATED for officer appointments. Use it only as fallback when KEY OFFICERS does not have the name.

Rules:
1. For ALL person names (Commissioner, Mayor, officers): use KEY OFFICERS block first. If not found there, use KEY INFORMATION as fallback.
2. NEVER prefer Wikipedia name over KEY OFFICERS name for the same role — government website is more current.
3. For static facts (area, year, wards, population, schemes, places): use KEY INFORMATION or training knowledge.
4. If a name is not found in either block, use training knowledge — do NOT write "Not available".
5. Return ONLY a raw JSON object — start with { end with }.
6. No markdown, no explanation, no code fences.
7. Plain numbers only — no underscores.
8. Official website: ${sourceUrl ?? 'unknown'}`;

  if (pageText) {
    prompt += `\n\n=== OFFICIAL WEBSITE CONTENT (use this first) ===\n${pageText}\n=== END ===`;
  } else {
    prompt += `\n\n(Website could not be fetched — use your training knowledge for this corporation.)`;
  }
  return prompt;
}
 
function userPrompt(tab, corpName, districtName, stateName) {
  const name = `${corpName}, ${districtName}, ${stateName}`;

  if (tab === 'about') return `Extract general information for "${name}". Return ONLY valid JSON with real values — never return template placeholders:
{"type":"Municipality","established":"1985","mayor_or_chairman":"Full Name","commissioner":"Full Name","headquarters":"Municipal Office, City - 636001","wards":24,"area_sqkm":15.5,"overview":"2-3 sentence description of the place.","key_facts":["Fact about history","Fact about economy","Fact about features"],"source":"https://official-url"}
Rules:
- "type" must be exactly one of: Municipal Corporation, Municipality, Town Panchayat, Village Panchayat
- Use null (not the word "unknown") for person names you do not know
- "established" must be a 4-digit year number or null — never the word "unknown"
- All values must be real data, never the words "string", "unknown", "name", "url", "fact"
- Return ONLY the JSON object, no markdown`;

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
  // Master data from the LocalBodies DB — loaded once on mount, shown instantly
  const [masterData, setMasterData] = useState(null);
  const [masterLoading, setMasterLoading] = useState(true);
 
  if (!corp?.corpName) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={52} color={CRIMSON} />
        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.dark, marginTop: 14 }}>
          Corporation data missing
        </Text>
        <TouchableOpacity style={{ marginTop: 20, backgroundColor: NAVY, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 28 }}
          onPress={() => navigation.goBack()}>
          <Text style={{ color: COLORS.white, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
 
  const fetchTab = useCallback(async (tab, force = false) => {
    if (!force && tabData[tab] !== undefined) return;
    setTabLoading(p => ({ ...p, [tab]: true }));
    setTabError(p => ({ ...p, [tab]: null }));
    try {
      const scraped = await scrapeCorpPage(corp.corpName, stateName || 'Tamil Nadu');
      console.log(`[FetchTab:${tab}] scraped=`, scraped ? `✓ ${scraped.sourceUrl}` : '✗ null');
      const sys  = sysPrompt(corp.corpName, districtName, stateName, scraped?.sourceUrl, scraped?.pageText);
      const user = userPrompt(tab, corp.corpName, districtName, stateName || 'Tamil Nadu');
      const raw  = await fetchAI(sys, user);
      let obj;
      try {
        obj = JSON.parse(raw);
      } catch (e) {
        debugger;
        throw new Error('Could not load data for this local body. Please retry.');
      }
      if (scraped?.sourceUrl) obj._sourceUrl = scraped.sourceUrl;
      setTabData(p => ({ ...p, [tab]: obj }));
    } catch (err) {
      console.error(`[Detail] ${tab}:`, err.message);
      setTabError(p => ({ ...p, [tab]: getSafeErrorMessage(err) }));
    } finally {
      setTabLoading(p => ({ ...p, [tab]: false }));
    }
  }, [tabData, corp.corpName, districtName, stateName]);
 
  useEffect(() => { fetchTab(activeTab); }, [activeTab]);

  // Load master data once on mount — instant display, no AI needed for basic info
  useEffect(() => {
    let active = true;
    (async () => {
      setMasterLoading(true);
      const data = await localBodyService.searchLocalBody(corp.corpName, districtName || null);
      if (active) { setMasterData(data); setMasterLoading(false); }
    })();
    return () => { active = false; };
  }, [corp.corpName, districtName]);
 
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTabData({});
    setTabError({});
    setMasterData(null);
    const cacheKey = `${corp.corpName}__${stateName || 'Tamil Nadu'}`.toLowerCase();
    delete _scrapeCache[cacheKey];
    localBodyService.clearCache();
    const fresh = await localBodyService.searchLocalBody(corp.corpName, districtName || null);
    setMasterData(fresh);
    await fetchTab(activeTab, true);
    setRefreshing(false);
  }, [activeTab, fetchTab, corp.corpName, stateName, districtName]);
 
  const retryTab = () => {
    const cacheKey = `${corp.corpName}__${stateName || 'Tamil Nadu'}`.toLowerCase();
    delete _scrapeCache[cacheKey];
    setTabData(p => { const n = { ...p }; delete n[activeTab]; return n; });
    setTabError(p => { const n = { ...p }; delete n[activeTab]; return n; });
  };
  useEffect(() => {
    if (!tabData[activeTab] && !tabLoading[activeTab] && !tabError[activeTab])
      fetchTab(activeTab);
  }, [tabData, activeTab]);
 
  const openMap = () => Linking.openURL(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${corp.corpName}, ${districtName}, ${stateName}`)}`
  );
 
  const d = tabData[activeTab];
  const L = tabLoading[activeTab];
  const E = tabError[activeTab];
 
  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />
 
      <GradientHeader style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.white} />
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
      </GradientHeader>
 
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
        {corp.website ? (
          <TouchableOpacity style={styles.stripItem} onPress={() => Linking.openURL(corp.website)}>
            <MaterialCommunityIcons name="web" size={13} color={GOLD} />
            <Text style={[styles.stripText, { textDecorationLine: 'underline' }]} numberOfLines={1}>
              {corp.website.replace(/^https?:\/\/(www\.)?/, '')}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.stripItem}>
            <MaterialCommunityIcons name="web" size={13} color={GOLD} />
            <Text style={styles.stripText}>Live • Official sites</Text>
          </View>
        )}
      </View>
 
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarInner}>
          {TABS.map(t => (
            <TouchableOpacity key={t.key}
              style={[styles.pill, activeTab === t.key && styles.pillActive]}
              onPress={() => setActiveTab(t.key)}>
              <MaterialCommunityIcons name={t.icon} size={14}
                color={activeTab === t.key ? COLORS.white : NAVY} />
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
            <Text style={styles.loadSub}>Fetching from official website…</Text>
          </View>
        )}
 
        {E && !L && (
          <View style={styles.errBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={32} color={CRIMSON} />
            <Text style={styles.errTitle}>Could not fetch data</Text>
            <View style={styles.errMsg}><Text style={styles.errMsgText} selectable>{E}</Text></View>
            <TouchableOpacity style={styles.retryBtn} onPress={retryTab}>
              <MaterialCommunityIcons name="refresh" size={16} color={COLORS.white} />
              <Text style={styles.retryText}> Retry</Text>
            </TouchableOpacity>
          </View>
        )}
 
        {d && !L && (
          <>
            {d.source && (
              <TouchableOpacity style={styles.srcBadge} onPress={() => Linking.openURL(d.source)}>
                <MaterialCommunityIcons name="check-circle" size={12} color={GREEN} />
                <Text style={styles.srcText} numberOfLines={1}> {d.source}</Text>
                <MaterialCommunityIcons name="open-in-new" size={12} color={GREEN} />
              </TouchableOpacity>
            )}
            {activeTab === 'about' && <AboutTab data={d} corpWebsite={corp.website} masterData={masterData} masterLoading={masterLoading} />}
          </>
        )}
      </ScrollView>
    </View>
  );
};
 
// ── Shared primitives ──────────────────────────────────────────────────────────

// AI sometimes returns objects instead of strings (e.g. {name:"..."} instead of "...").
// safeStr converts any value to a display string safely.
const safeStr = v => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object') return v.name || v.value || v.text || v.description || JSON.stringify(v);
  return String(v);
};

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
  const display = safeStr(value);
  if (!display || display === 'Not available on official website') return null;
  return (
    <View style={styles.field}>
      <MaterialCommunityIcons name={icon} size={14} color={NAVY} style={{ marginRight: 6, marginTop: 1 }} />
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{display}</Text>
    </View>
  );
};

const Chip = ({ label, color = NAVY }) => (
  <View style={[styles.chip, { backgroundColor: `${color}14` }]}>
    <Text style={[styles.chipText, { color }]}>{safeStr(label)}</Text>
  </View>
);
 
const Bullet = ({ text }) => (
  <View style={styles.bullet}>
    <Text style={styles.bulletDot}>•</Text>
    <Text style={styles.bulletText}>{safeStr(text)}</Text>
  </View>
);

// ── Tab components ────────────────────────────────────────────────────────────
// ── Master Data Card ─────────────────────────────────────────────────────────
// Shows official address / contact / officials from the LocalBodies database.
// Appears instantly (no AI wait). Nil when corp is not yet in master data.
const MasterDataCard = ({ m }) => {
  if (!m) return null;
  const website = m.officialWebsiteUrl || m.tnurbantreeUrl;
  return (
    <>
      {/* Type + quick chips */}
      <Card>
        <SecTitle icon="office-building" title="Local Body Information" color={NAVY} />
        <View style={styles.chipRow}>
          {m.localBodyType && <Chip label={m.localBodyType} color={GREEN} />}
          {m.districtName  && <Chip label={`${m.districtName} Dist.`} color={NAVY} />}
          {m.wardCount     && <Chip label={`${m.wardCount} Wards`} />}
          {m.population    && <Chip label={`Pop. ${Number(m.population).toLocaleString('en-IN')}`} color={GOLD} />}
          {m.establishedYear && <Chip label={`Est. ${m.establishedYear}`} color={GOLD} />}
        </View>
        {m.aboutDescription ? (
          <Text style={styles.overview}>{m.aboutDescription}</Text>
        ) : null}
      </Card>

      {/* Contact & Address */}
      <Card>
        <SecTitle icon="card-account-details-outline" title="Contact & Address" color={GREEN} />
        {m.address       && <Field icon="map-marker"      label="Address"  value={m.address} />}
        {m.contactNumber && <Field icon="phone"           label="Phone"    value={m.contactNumber} />}
        {m.email         && <Field icon="email-outline"   label="Email"    value={m.email} />}
        {m.pincode       && <Field icon="mailbox-outline" label="Pincode"  value={m.pincode} />}
      </Card>

      {/* Official website deep link */}
      {website && (
        <Card>
          <SecTitle icon="web" title="Official Website" color={NAVY} />
          <TouchableOpacity style={styles.websiteRow} onPress={() => Linking.openURL(website)}>
            <MaterialCommunityIcons name="link-variant" size={14} color={NAVY} style={{ marginRight: 6 }} />
            <Text style={styles.websiteLink} numberOfLines={2}>{website}</Text>
            <MaterialCommunityIcons name="open-in-new" size={16} color={GREEN} />
          </TouchableOpacity>
        </Card>
      )}
    </>
  );
};

const AboutTab = ({ data, corpWebsite, masterData, masterLoading }) => {
  const websiteUrl = corpWebsite || data?._sourceUrl || data?.source;
  return (
    <>
      {/* ── Master data section (instant, from DB) ── */}
      {masterLoading && (
        <View style={styles.masterLoadRow}>
          <ActivityIndicator size={12} color={GOLD} />
          <Text style={styles.masterLoadText}> Loading official records…</Text>
        </View>
      )}
      {masterData && <MasterDataCard m={masterData} />}

      {/* ── AI-enriched section (loaded after scraping) ── */}
      {data && (
        <>
          {!masterData && (
            // Only show AI overview card when master data is absent
            <Card>
              <SecTitle icon="information" title="Overview" />
              <View style={styles.chipRow}>
                {data.type && !['string','unknown','null','type'].includes(String(data.type).toLowerCase().trim()) &&
                  <Chip label={data.type} color={GREEN} />}
                {data.established && !isNaN(Number(data.established)) && Number(data.established) > 1800 &&
                  <Chip label={`Est. ${data.established}`} color={GOLD} />}
                {data.wards > 0 && <Chip label={`${data.wards} Wards`} />}
                {data.area_sqkm > 0 && <Chip label={`${data.area_sqkm} km²`} />}
              </View>
              <Text style={styles.overview}>{data.overview}</Text>
            </Card>
          )}
          {data.key_facts?.length > 0 && (
            <Card>
              <SecTitle icon="lightbulb-outline" title="Key Facts" color={GOLD} />
              {data.key_facts.map((f, i) => <Bullet key={i} text={f} />)}
            </Card>
          )}
          {!masterData && websiteUrl && (
            <Card>
              <SecTitle icon="web" title="Official Website" color={NAVY} />
              <TouchableOpacity style={styles.websiteRow} onPress={() => Linking.openURL(websiteUrl)}>
                <MaterialCommunityIcons name="link-variant" size={14} color={NAVY} style={{ marginRight: 6 }} />
                <Text style={styles.websiteLink} numberOfLines={2}>{websiteUrl}</Text>
                <MaterialCommunityIcons name="open-in-new" size={16} color={GREEN} />
              </TouchableOpacity>
            </Card>
          )}
        </>
      )}
    </>
  );
};
 
// ── Styles ────────────────────────────────────────────────────────────────────

 
export default CorpDetailScreen;
 
 