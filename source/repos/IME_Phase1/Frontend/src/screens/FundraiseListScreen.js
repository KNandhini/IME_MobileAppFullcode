import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, Animated, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fundraiseService } from '../services/fundraiseService';
import api from '../utils/api'; // ✅ ADDED — needed to build API_BASE like AchievementDetailScreen

const API_BASE_URL = 'http://10.0.2.2:51150/api';
 //const API_BASE_URL = 'https://prasath-001-site1.ftempurl.com/api';

// ✅ ADDED — same pattern as AchievementDetailScreen: derive the file-server
// base (without "/api") so raw "Uploads\..." paths can be turned into a
// directly-loadable static URL.
const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

const PRIMARY  = '#1E3A5F';
const ACCENT   = '#2E86DE';
const SUCCESS  = '#27AE60';
const DANGER   = '#E74C3C';
const BG       = '#F0F4FA';
const CARD_BG  = '#FFFFFF';
const PAGE_SIZE = 10;

const URGENCY = {
  Critical: { bg: '#FDE8E8', text: '#C0392B', dot: '#E74C3C' },
  Urgent:   { bg: '#FEF3E2', text: '#D35400', dot: '#F39C12' },
  Normal:   { bg: '#E8F8F0', text: '#1E8449', dot: '#27AE60' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toApiPath  = (p = '') => p.replace(/\\/g, '/');
const firstPath  = (raw)    => {
  if (!raw) return null;
  return raw.split(',')[0].trim() || null;
};

// ✅ ADDED — same toPublicUrl helper used in AchievementDetailScreen.
// Converts a raw disk path like "Uploads\Fundraise-27\xyz.jpg" into a URL
// the app can load directly via <Image>, no auth/blob fetch needed.
const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const idx = filePath.indexOf('Uploads\\');
  if (idx === -1) return filePath;
  const relative = filePath.substring(idx).replace(/\\/g, '/');
  return `${API_BASE}/${relative}`;
};

// ─── BeneficiaryAvatar ────────────────────────────────────────────────────────
// ✅ CHANGED — replaced AuthImage (token-fetch + blob->dataURI) with a plain
// <Image> bound to toPublicUrl(photoPath), same pattern as
// AchievementDetailScreen's attachment images. Falls back to initials on error.
function BeneficiaryAvatar({ photoPath, name }) {
  const [error, setError] = useState(false);
  const initials = (name || '?')
    .split(' ').slice(0, 2)
    .map(w => w[0]?.toUpperCase()).join('');

  const uri = toPublicUrl(photoPath);

  if (uri && !error) {
    return (
      <Image
        source={{ uri }}
        style={av.img}
        resizeMode="cover"
        onError={(e) => {
          console.warn('BeneficiaryAvatar failed to load:', uri, e.nativeEvent?.error);
          setError(true);
        }}
      />
    );
  }
  return (
    <View style={av.fallback}>
      <Text style={av.initials}>{initials}</Text>
    </View>
  );
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
function ProgressBar({ collected, target }) {
  const pct  = target > 0 ? Math.min((collected / target) * 100, 100) : 0;
  const anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 700, useNativeDriver: false }).start();
  }, [pct]);

  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  const color = pct >= 75 ? SUCCESS : pct >= 40 ? ACCENT : '#F39C12';

  return (
    <View style={pb.track}>
      <Animated.View style={[pb.fill, { width, backgroundColor: color }]} />
    </View>
  );
}

// ─── FundCard ─────────────────────────────────────────────────────────────────
function FundCard({ item, onPress, onEdit, onDelete }) {
  const scale     = React.useRef(new Animated.Value(1)).current;
  const target    = Number(item.targetAmount)    || 0;
  const collected = Number(item.collectedAmount) || 0;
  const pct       = target > 0 ? Math.min(Math.round((collected / target) * 100), 100) : 0;
  const urgency   = URGENCY[item.urgencyLevel]   || URGENCY.Normal;
  const photoPath = firstPath(item.beneficiaryPhotoUrl);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={()  => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start()}
      >
        <View style={styles.card}>

          {/* Top row */}
          <View style={styles.cardTop}>
            <BeneficiaryAvatar photoPath={photoPath} name={item.fullName} />

            <View style={styles.cardTopInfo}>
              <View style={styles.titleRow}>
  <Text style={styles.fundTitle} numberOfLines={1}>
    {item.fundTitle || 'Untitled Fund'}
  </Text>
  {item.status ? (
    <View style={[
      styles.statusBadge,
      { backgroundColor: item.status === 'Active' ? '#E8F8F0' : '#F1F1F1' },
    ]}>
      <View style={[
        styles.badgeDot,
        { backgroundColor: item.status === 'Active' ? SUCCESS : '#9AA5B1' },
      ]} />
      <Text style={[
        styles.badgeText,
        { color: item.status === 'Active' ? '#1E8449' : '#6B7280' },
      ]}>
        {item.status}
      </Text>
    </View>
  ) : null}
  {item.urgencyLevel ? (
    <View style={[styles.badge, { backgroundColor: urgency.bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: urgency.dot }]} />
      <Text style={[styles.badgeText, { color: urgency.text }]}>
        {item.urgencyLevel}
      </Text>
    </View>
  ) : null}
</View>

              <View style={styles.metaRow}>
                {item.fullName ? (
                  <Text style={styles.metaName} numberOfLines={1}>👤 {item.fullName}</Text>
                ) : null}
                {item.fundCategory ? (
                  <View style={styles.categoryChip}>
                    <Text style={styles.categoryText}>{item.fundCategory}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Progress */}
          <ProgressBar collected={collected} target={target} />

          {/* Amount row */}
          <View style={styles.amountRow}>
            <View>
              <Text style={styles.amountLabel}>Collected</Text>
              <Text style={styles.amountValue}>₹{collected.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.pctBubble}>
              <Text style={styles.pctText}>{pct}%</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.amountLabel}>Target</Text>
              <Text style={[styles.amountValue, { color: PRIMARY }]}>
                ₹{target.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Action row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
              <Text style={styles.actionView}>👁  View</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity style={{ padding: 4, marginRight: 2 }} onPress={onEdit}>
                <MaterialCommunityIcons name="pencil-outline" size={22} color={PRIMARY} />
              </TouchableOpacity>
              <TouchableOpacity style={{ padding: 4 }} onPress={onDelete}>
                <MaterialCommunityIcons name="delete-outline" size={22} color={DANGER} />
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyIcon}>🤝</Text>
      <Text style={styles.emptyTitle}>No Funds Yet</Text>
      <Text style={styles.emptySubtitle}>Create your first fundraising campaign.</Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onAdd}>
        <Text style={styles.emptyBtnText}>+ Create Fund</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── FundraiseListScreen ──────────────────────────────────────────────────────
const FundraiseListScreen = ({ navigation, route }) => {
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore,    setHasMore]    = useState(true);
  const pageRef = useRef(1);

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadData = async (reset = false) => {
    try {
      if (reset) {
        pageRef.current = 1;
        setHasMore(true);
        setLoading(true);
      }
      const res   = await fundraiseService.getAll(pageRef.current, PAGE_SIZE,'list');
      const items = res.data || [];
      setData(reset ? items : prev => [...prev, ...items]);
      setHasMore(items.length === PAGE_SIZE);
    } catch {
      Alert.alert('Error', 'Failed to load funds');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(true); }, []);

  // ── Pull to refresh → next page ───────────────────────────────────────────
  const onRefresh = () => {
    if (!hasMore || refreshing) return;
    setRefreshing(true);
    pageRef.current += 1;
    loadData();
  };

  // ── In-place update from CreateFund ──────────────────────────────────────
  useEffect(() => {
    const changedItem = route.params?.changedItem;
    const isEdit      = route.params?.isEdit;
    if (!changedItem) return;
    if (isEdit) {
      setData(prev => prev.map(d => d.id === changedItem.id ? changedItem : d));
    } else {
      setData(prev => [changedItem, ...prev]);
    }
    navigation.setParams({ changedItem: undefined, isEdit: undefined });
  }, [route.params?.changedItem]);

  // ── Delete ────────────────────────────────────────────────────────────────
 // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = (id) => {
    Alert.alert('Delete Fund', 'Are you sure you want to delete this fund?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const res = await fundraiseService.delete(id);
            if (res?.success) {
              Alert.alert('Success', res?.message || 'Deleted successfully.');
              loadData(true);
            } else {
              Alert.alert('Error', res?.message || 'Failed to delete fund.');
            }
          } catch (e) {
            const apiMessage =
              e?.response?.data?.message ||
              e?.response?.data?.title ||
              e?.message ||
              'Failed to delete fund.';
            Alert.alert('Error', apiMessage);
          }
        },
      },
    ]);
  };

  const totalTarget    = data.reduce((s, i) => s + (Number(i.targetAmount)    || 0), 0);
  const totalCollected = data.reduce((s, i) => s + (Number(i.collectedAmount) || 0), 0);

  // ── Footer ────────────────────────────────────────────────────────────────
  const ListFooter = () => {
    if (data.length === 0) return null;
    if (refreshing) return (
      <View style={styles.footerWrap}>
        <ActivityIndicator size="small" color={PRIMARY} />
        <Text style={styles.footerText}>Loading next {PAGE_SIZE} records…</Text>
      </View>
    );
    if (!hasMore) return (
      <View style={styles.footerWrap}>
        <Text style={styles.footerText}>✓ All {data.length} records loaded</Text>
      </View>
    );
    return (
      <View style={styles.footerWrap}>
        <Text style={styles.footerText}>↓ Pull down to load more ({data.length} loaded)</Text>
      </View>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Summary strip */}
      {data.length > 0 && (
        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>₹{totalCollected.toLocaleString('en-IN')}</Text>
            <Text style={styles.summaryLabel}>Total Collected</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>₹{totalTarget.toLocaleString('en-IN')}</Text>
            <Text style={styles.summaryLabel}>Total Target</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{data.length}</Text>
            <Text style={styles.summaryLabel}>Campaigns</Text>
          </View>
        </View>
      )}

      <FlatList
        data={data}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={[styles.listContent, data.length === 0 && { flex: 1 }]}

        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY]}
            tintColor={PRIMARY}
            title={
              !hasMore
                ? 'No more records'
                : `Pull for next ${PAGE_SIZE} records`
            }
            titleColor="#888"
          />
        }

        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyWrap}>
              <ActivityIndicator size="large" color={PRIMARY} />
            </View>
          ) : (
            <EmptyState onAdd={() => navigation.navigate('CreateFund')} />
          )
        }

        ListFooterComponent={<ListFooter />}

        renderItem={({ item }) => (
          <FundCard
            item={item}
            onPress={() => navigation.navigate('FundraiseView', { data: item })}
            onEdit={()  => navigation.navigate('CreateFund',   { data: item })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateFund')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

    </View>
  );
};

export default FundraiseListScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: BG },
  listContent:    { padding: 14, paddingBottom: 90 },

  summaryStrip:   { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 14, marginTop: 8, borderRadius: 14, padding: 14, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, marginBottom: 6 },
  summaryItem:    { flex: 1, alignItems: 'center' },
  summaryVal:     { fontSize: 15, fontWeight: '800', color: PRIMARY },
  summaryLabel:   { fontSize: 11, color: '#888', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: '#E8ECF4' },

  card:           { backgroundColor: CARD_BG, borderRadius: 16, marginBottom: 14, padding: 16, elevation: 3, shadowColor: '#1E3A5F', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  cardTop:        { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  cardTopInfo:    { flex: 1, marginLeft: 12 },
  titleRow:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
  fundTitle:      { flex: 1, fontSize: 15, fontWeight: '700', color: '#1A2540', marginRight: 8 },
  badge:          { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  badgeDot:       { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  badgeText:      { fontSize: 11, fontWeight: '700' },
  metaRow:        { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  metaName:       { fontSize: 12, color: '#888' },
  categoryChip:   { backgroundColor: '#EEF2FF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  categoryText:   { fontSize: 11, color: '#4361EE', fontWeight: '600' },

  amountRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  amountLabel:    { fontSize: 11, color: '#999', marginBottom: 2 },
  amountValue:    { fontSize: 15, fontWeight: '700', color: SUCCESS },
  pctBubble:      { backgroundColor: '#EEF5FF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pctText:        { fontSize: 13, fontWeight: '800', color: ACCENT },

  divider:        { height: 1, backgroundColor: '#F0F3FA', marginVertical: 12 },
  actionRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionBtn:      { padding: 4 },
  actionView:     { fontSize: 13, color: '#888', fontWeight: '500' },

  footerWrap:     { paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  footerText:     { fontSize: 12, color: '#aaa' },

  emptyWrap:      { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon:      { fontSize: 52, marginBottom: 16 },
  emptyTitle:     { fontSize: 20, fontWeight: '700', color: PRIMARY, marginBottom: 8 },
  emptySubtitle:  { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 21 },
  emptyBtn:       { marginTop: 24, backgroundColor: PRIMARY, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 13 },
  emptyBtnText:   { color: '#fff', fontWeight: '700', fontSize: 15 },

  fab:            { position: 'absolute', right: 20, bottom: 24, width: 36, height: 36, borderRadius: 18, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText:        { color: '#D4A017', fontSize: 24, fontWeight: '700', lineHeight: 28 },
statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, marginRight: 6 },
});

const av = StyleSheet.create({
  img:      { width: 58, height: 58, borderRadius: 14, backgroundColor: '#E8ECF4', borderWidth: 1.5, borderColor: '#DDE3EF' },
  fallback: { width: 58, height: 58, borderRadius: 14, backgroundColor: '#D6E4F7', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#B8CEE8' },
  initials: { fontSize: 20, fontWeight: '800', color: PRIMARY },
});

const pb = StyleSheet.create({
  track: { height: 7, backgroundColor: '#EEF2F8', borderRadius: 99, overflow: 'hidden', marginTop: 8 },
  fill:  { height: '100%', borderRadius: 99 },
});