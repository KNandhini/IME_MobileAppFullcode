import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, Linking, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { clubService } from '../services/clubService';
import { municipalCorpService } from '../services/municipalCorpService';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';
const BG   = '#F0F4F8';

// Level constants
const LEVEL_COUNTRY  = 0;
const LEVEL_STATE    = 1;
const LEVEL_DISTRICT = 2;
const LEVEL_CORP     = 3;

const LEVEL_LABELS = ['Countries', 'States', 'Districts', 'Corporations'];
const LEVEL_ICONS  = ['earth', 'map-marker-radius', 'city', 'office-building'];

const MunicipalMapScreen = ({ navigation }) => {
  const [level,    setLevel]    = useState(LEVEL_COUNTRY);
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [crumbs,   setCrumbs]   = useState([]);           // [{label, id}]
  const [selCountry, setSelCountry] = useState(null);
  const [selState,   setSelState]   = useState(null);
  const [selDistrict, setSelDistrict] = useState(null);

  useEffect(() => { loadCountries(); }, []);

  const loadCountries = async () => {
    setLoading(true);
    const res = await clubService.getCountries();
    setItems(res.success ? res.data || [] : []);
    setLoading(false);
  };

  const drillInto = useCallback(async (item) => {
    if (level === LEVEL_COUNTRY) {
      setLoading(true);
      setSelCountry(item);
      setCrumbs([{ label: item.countryName, id: item.countryId }]);
      const res = await clubService.getStatesByCountry(item.countryId);
      setItems(res.success ? res.data || [] : []);
      setLevel(LEVEL_STATE);
      setLoading(false);

    } else if (level === LEVEL_STATE) {
      setLoading(true);
      setSelState(item);
      setCrumbs(prev => [...prev, { label: item.stateName, id: item.stateId }]);
      const res = await municipalCorpService.getDistricts(item.stateId);
      setItems(res.success ? res.data || [] : []);
      setLevel(LEVEL_DISTRICT);
      setLoading(false);

    } else if (level === LEVEL_DISTRICT) {
      setLoading(true);
      setSelDistrict(item);
      setCrumbs(prev => [...prev, { label: item.districtName, id: item.districtId }]);
      const res = await municipalCorpService.getCorpsByDistrict(item.districtId);
      setItems(res.success ? res.data || [] : []);
      setLevel(LEVEL_CORP);
      setLoading(false);
    }
    // LEVEL_CORP handled inline via card actions
  }, [level]);

  const goBack = () => {
    if (level === LEVEL_COUNTRY) { navigation.goBack(); return; }

    const newLevel = level - 1;
    setLevel(newLevel);
    setCrumbs(prev => prev.slice(0, -1));

    if (newLevel === LEVEL_COUNTRY) { loadCountries(); return; }
    if (newLevel === LEVEL_STATE) {
      setLoading(true);
      clubService.getStatesByCountry(selCountry.countryId)
        .then(res => { setItems(res.success ? res.data || [] : []); setLoading(false); });
    }
    if (newLevel === LEVEL_DISTRICT) {
      setLoading(true);
      municipalCorpService.getDistricts(selState.stateId)
        .then(res => { setItems(res.success ? res.data || [] : []); setLoading(false); });
    }
  };

  const openMap = (corp) => {
    const query = encodeURIComponent(`${corp.corpName}, ${corp.districtName}, ${corp.stateName}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const callCorp = (corp) => {
    if (corp.contactNumber) Linking.openURL(`tel:${corp.contactNumber}`);
  };

  const emailCorp = (corp) => {
    if (corp.email) Linking.openURL(`mailto:${corp.email}`);
  };

  // ── Render helpers ────────────────────────────────────────────
  const renderCountry = ({ item }) => (
    <TouchableOpacity style={styles.listItem} onPress={() => drillInto(item)}>
      <View style={styles.listIcon}>
        <MaterialCommunityIcons name="earth" size={22} color={GOLD} />
      </View>
      <View style={styles.listTextBlock}>
        <Text style={styles.listTitle}>{item.countryName}</Text>
        <Text style={styles.listSub}>Tap to explore states</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#BCC5CF" />
    </TouchableOpacity>
  );

  const renderState = ({ item }) => (
    <TouchableOpacity style={styles.listItem} onPress={() => drillInto(item)}>
      <View style={styles.listIcon}>
        <MaterialCommunityIcons name="map-marker-radius" size={22} color={GOLD} />
      </View>
      <View style={styles.listTextBlock}>
        <Text style={styles.listTitle}>{item.stateName}</Text>
        <Text style={styles.listSub}>Tap to view districts</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#BCC5CF" />
    </TouchableOpacity>
  );

  const renderDistrict = ({ item }) => (
    <TouchableOpacity style={styles.listItem} onPress={() => drillInto(item)}>
      <View style={styles.listIcon}>
        <MaterialCommunityIcons name="city" size={22} color={GOLD} />
      </View>
      <View style={styles.listTextBlock}>
        <Text style={styles.listTitle}>{item.districtName}</Text>
        <Text style={styles.listSub}>Tap to view corporations</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#BCC5CF" />
    </TouchableOpacity>
  );

  const renderCorp = ({ item }) => (
    <View style={styles.corpCard}>
      {/* Header */}
      <View style={styles.corpCardHeader}>
        <View style={[styles.corpIconBadge, { marginRight: 12 }]}>
          <MaterialCommunityIcons name="office-building" size={22} color={NAVY} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.corpName}>{item.corpName}</Text>
          {item.corpCode && <Text style={styles.corpCode}>{item.corpCode}</Text>}
        </View>
      </View>

      {/* Info grid */}
      <View style={styles.infoGrid}>
        {item.mayorName && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account-tie" size={14} color={NAVY} style={styles.infoRowIcon} />
            <Text style={styles.infoLabel}>Mayor</Text>
            <Text style={styles.infoValue}>{item.mayorName}</Text>
          </View>
        )}
        {item.population && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account-group" size={14} color={NAVY} style={styles.infoRowIcon} />
            <Text style={styles.infoLabel}>Population</Text>
            <Text style={styles.infoValue}>{item.population}</Text>
          </View>
        )}
        {item.area && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-outline" size={14} color={NAVY} style={styles.infoRowIcon} />
            <Text style={styles.infoLabel}>Area</Text>
            <Text style={styles.infoValue}>{item.area}</Text>
          </View>
        )}
        {item.wardCount != null && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="grid" size={14} color={NAVY} style={styles.infoRowIcon} />
            <Text style={styles.infoLabel}>Wards</Text>
            <Text style={styles.infoValue}>{item.wardCount}</Text>
          </View>
        )}
        {item.establishedYear && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar" size={14} color={NAVY} style={styles.infoRowIcon} />
            <Text style={styles.infoLabel}>Est.</Text>
            <Text style={styles.infoValue}>{item.establishedYear}</Text>
          </View>
        )}
        {item.address && (
          <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
            <MaterialCommunityIcons name="map-marker" size={14} color={NAVY} style={{ marginTop: 2 }} />
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={[styles.infoValue, { flex: 1 }]}>{item.address}</Text>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.corpActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openMap(item)}>
          <MaterialCommunityIcons name="google-maps" size={16} color={NAVY} style={styles.actionBtnIcon} />
          <Text style={styles.actionBtnText}>Map</Text>
        </TouchableOpacity>
        {item.contactNumber && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => callCorp(item)}>
            <MaterialCommunityIcons name="phone" size={16} color={NAVY} style={styles.actionBtnIcon} />
            <Text style={styles.actionBtnText}>Call</Text>
          </TouchableOpacity>
        )}
        {item.email && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => emailCorp(item)}>
            <MaterialCommunityIcons name="email" size={16} color={NAVY} style={styles.actionBtnIcon} />
            <Text style={styles.actionBtnText}>Email</Text>
          </TouchableOpacity>
        )}
        {item.website && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={() => Linking.openURL(`https://${item.website.replace(/^https?:\/\//, '')}`)}>
            <MaterialCommunityIcons name="web" size={16} color="#fff" style={styles.actionBtnIcon} />
            <Text style={[styles.actionBtnText, { color: '#fff' }]}>Website</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderItem = level === LEVEL_COUNTRY  ? renderCountry
                   : level === LEVEL_STATE    ? renderState
                   : level === LEVEL_DISTRICT ? renderDistrict
                   : renderCorp;

  const keyExtractor = (item) =>
    level === LEVEL_COUNTRY  ? String(item.countryId)
    : level === LEVEL_STATE  ? String(item.stateId)
    : level === LEVEL_DISTRICT ? String(item.districtId)
    : String(item.corpId);

  const empty = !loading && items.length === 0;

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { marginRight: 10 }]} onPress={goBack}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{LEVEL_LABELS[level]}</Text>
          {crumbs.length > 0 && (
            <Text style={styles.breadcrumb} numberOfLines={1}>
              {crumbs.map(c => c.label).join(' › ')}
            </Text>
          )}
        </View>
        <MaterialCommunityIcons name={LEVEL_ICONS[level]} size={22} color={GOLD} style={{ marginLeft: 10 }} />
      </View>

      {/* Level pills */}
      <View style={styles.levelRow}>
        {LEVEL_LABELS.map((lbl, i) => (
          <View key={i} style={[styles.levelPill, i === level && styles.levelPillActive, i > 0 && { marginLeft: 6 }]}>
            <Text style={[styles.levelPillText, i === level && styles.levelPillTextActive]}>
              {lbl}
            </Text>
          </View>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={NAVY} />
          <Text style={styles.loadingText}>Loading {LEVEL_LABELS[level].toLowerCase()}…</Text>
        </View>
      ) : empty ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="database-off" size={52} color="#BCC5CF" />
          <Text style={styles.emptyText}>No {LEVEL_LABELS[level].toLowerCase()} found</Text>
          <Text style={styles.emptySub}>
            {level === LEVEL_CORP
              ? 'No corporations registered in this district yet.'
              : 'Data will appear here once available.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={level < LEVEL_CORP ? () => <View style={styles.sep} /> : null}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  // Header
  header: {
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  breadcrumb: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },

  // Level pills
  levelRow: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  levelPillWrap: { flex: 1, marginHorizontal: 3 },
  levelPill: {
    flex: 1, paddingVertical: 5, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  levelPillActive: { backgroundColor: GOLD },
  levelPillText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600' },
  levelPillTextActive: { color: NAVY },

  // List
  listContent: { padding: 12, paddingBottom: 30 },
  sep: { height: 1, backgroundColor: '#E2E8F0', marginHorizontal: 16 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 2,
    elevation: 1,
  },
  listIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(30,58,95,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  listTextBlock: { flex: 1 },
  listTitle: { fontSize: 15, fontWeight: '600', color: '#1A202C' },
  listSub:   { fontSize: 12, color: '#8090A0', marginTop: 2 },

  // Corp card
  corpCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  corpCardHeader: {
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  corpIconBadgeWrap: { marginRight: 12 },
  corpIconBadge: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
  corpName: { color: '#fff', fontSize: 15, fontWeight: '700', lineHeight: 20 },
  corpCode: { color: GOLD, fontSize: 11, fontWeight: '700', marginTop: 2, letterSpacing: 1 },

  infoGrid: { padding: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoRowIcon: { marginRight: 6 },
  infoLabel: { fontSize: 12, color: '#6B7A8D', width: 72, fontWeight: '600' },
  infoValue: { fontSize: 13, color: '#2D3748', fontWeight: '500', flexShrink: 1 },

  corpActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#EEF2F8',
    marginRight: 8,
    marginBottom: 6,
  },
  actionBtnIcon: { marginRight: 4 },
  actionBtnPrimary: { backgroundColor: NAVY },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: NAVY },

  // Empty / loading
  loadingText: { color: '#6B7A8D', marginTop: 12, fontSize: 14 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#4A5568', marginTop: 14, textAlign: 'center' },
  emptySub:  { fontSize: 13, color: '#8090A0', marginTop: 6, textAlign: 'center', lineHeight: 20 },
});

export default MunicipalMapScreen;
