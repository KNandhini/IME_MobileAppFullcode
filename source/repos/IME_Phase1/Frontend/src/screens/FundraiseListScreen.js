import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Alert, Animated, Platform, Image
} from 'react-native';
import { fundraiseService } from '../services/fundraiseService';
const FILE_BASE_URL = "http://10.0.2.2:51150/uploads/";
// ─── Constants ────────────────────────────────────────────────────────────────
const PRIMARY = '#1E3A5F';
const ACCENT  = '#2E86DE';
const SUCCESS = '#27AE60';
const DANGER  = '#E74C3C';
const BG      = '#F0F4FA';
const CARD_BG = '#FFFFFF';

const URGENCY = {
  Critical: { bg: '#FDE8E8', text: '#C0392B', dot: '#E74C3C' },
  Urgent:   { bg: '#FEF3E2', text: '#D35400', dot: '#F39C12' },
  Normal:   { bg: '#E8F8F0', text: '#1E8449', dot: '#27AE60' },
};

// ─── Progress bar ─────────────────────────────────────────────────────────────
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

// ─── Beneficiary Avatar ───────────────────────────────────────────────────────
function BeneficiaryAvatar({ uri, name }) {
  const [error, setError] = useState(false);

  // Derive initials from name for fallback
  const initials = (name || '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  if (uri && !error) {
    return (
      <Image
        source={{ uri }}
        style={av.img}
        resizeMode="cover"
        onError={() => setError(true)}
      />
    );
  }

  // Fallback: initials circle
  return (
    <View style={av.fallback}>
      <Text style={av.initials}>{initials}</Text>
    </View>
  );
}

// ─── Fund Card ────────────────────────────────────────────────────────────────
function FundCard({ item, onPress, onEdit, onDelete }) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  const target    = Number(item.targetAmount)    || 0;
  const collected = Number(item.collectedAmount) || 0;
  const pct       = target > 0 ? Math.min(Math.round((collected / target) * 100), 100) : 0;
  const urgency   = URGENCY[item.urgencyLevel] || URGENCY.Normal;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.card}>

          {/* ── Top row: photo + title block + urgency badge ── */}
          <View style={styles.cardTop}>
            {/* Beneficiary photo / avatar */}
           <BeneficiaryAvatar
  uri={
    item.beneficiaryPhotoUrl
      ? FILE_BASE_URL + item.beneficiaryPhotoUrl
      : null
  }
  name={item.fullName}
/>

            {/* Title + meta */}
            <View style={styles.cardTopInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.fundTitle} numberOfLines={1}>
                  {item.fundTitle || 'Untitled Fund'}
                </Text>
                {item.urgencyLevel ? (
                  <View style={[styles.badge, { backgroundColor: urgency.bg }]}>
                    <View style={[styles.badgeDot, { backgroundColor: urgency.dot }]} />
                    <Text style={[styles.badgeText, { color: urgency.text }]}>
                      {item.urgencyLevel}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Name + category */}
              <View style={styles.metaRow}>
                {item.fullName ? (
                  <Text style={styles.metaName} numberOfLines={1}>
                    👤 {item.fullName}
                  </Text>
                ) : null}
                {item.fundCategory ? (
                  <View style={styles.categoryChip}>
                    <Text style={styles.categoryText}>{item.fundCategory}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* ── Progress bar ── */}
          <ProgressBar collected={collected} target={target} />

          {/* ── Amount row ── */}
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

          {/* ── Divider ── */}
          <View style={styles.divider} />

          {/* ── Action row ── */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
              <Text style={styles.actionView}>👁  View</Text>
            </TouchableOpacity>

            <View style={styles.actionRight}>
              <TouchableOpacity style={[styles.iconBtn, styles.editBtn]} onPress={onEdit}>
                <Text style={styles.editIcon}>✏️</Text>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, styles.deleteBtn]} onPress={onDelete}>
                <Text style={styles.deleteIcon}>🗑️</Text>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyIcon}>🤝</Text>
      <Text style={styles.emptyTitle}>No Funds Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first fundraising campaign to get started.
      </Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onAdd}>
        <Text style={styles.emptyBtnText}>+ Create Fund</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
const FundraiseListScreen = ({ navigation }) => {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await fundraiseService.getAll();
      setData(res.data || []);
    } catch {
      Alert.alert('Error', 'Failed to load funds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  const handleDelete = (id) => {
    Alert.alert('Delete Fund', 'Are you sure you want to delete this fund?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await fundraiseService.delete(id);
          loadData();
        },
      },
    ]);
  };

  const totalTarget    = data.reduce((s, i) => s + (Number(i.targetAmount)    || 0), 0);
  const totalCollected = data.reduce((s, i) => s + (Number(i.collectedAmount) || 0), 0);

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Fundraise</Text>
          <Text style={styles.headerSub}>
            {data.length} active campaign{data.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* ── Summary strip ── */}
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

      {/* ── List ── */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={[
          styles.listContent,
          data.length === 0 && { flex: 1 },
        ]}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState onAdd={() => navigation.navigate('CreateFund')} />
          )
        }
        renderItem={({ item }) => (
          <FundCard
            item={item}
            onPress={() => navigation.navigate('FundraiseView', { data: item })}
            onEdit={() => navigation.navigate('CreateFund', { data: item })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
      />

      {/* ── FAB ── */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateFund')} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default FundraiseListScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    backgroundColor: PRIMARY,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 18, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: 0.3 },
  headerSub:   { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 },

  summaryStrip: {
    flexDirection: 'row', backgroundColor: '#fff',
    marginHorizontal: 14, marginTop: -1, borderRadius: 14, padding: 14,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.08,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, marginBottom: 6,
  },
  summaryItem:    { flex: 1, alignItems: 'center' },
  summaryVal:     { fontSize: 15, fontWeight: '800', color: PRIMARY },
  summaryLabel:   { fontSize: 11, color: '#888', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: '#E8ECF4' },

  listContent: { padding: 14, paddingBottom: 90 },

  // Card
  card: {
    backgroundColor: CARD_BG, borderRadius: 16,
    marginBottom: 14, padding: 16,
    elevation: 3, shadowColor: '#1E3A5F',
    shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },

  // Top section with photo
  cardTop: {
    flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12,
  },
  cardTopInfo: { flex: 1, marginLeft: 12 },

  titleRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 6,
  },
  fundTitle: {
    flex: 1, fontSize: 15, fontWeight: '700',
    color: '#1A2540', marginRight: 8,
  },

  badge: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4,
  },
  badgeDot:  { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  metaRow: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6,
  },
  metaName: { fontSize: 12, color: '#888' },

  categoryChip: {
    backgroundColor: '#EEF2FF', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  categoryText: { fontSize: 11, color: '#4361EE', fontWeight: '600' },

  amountRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 10,
  },
  amountLabel: { fontSize: 11, color: '#999', marginBottom: 2 },
  amountValue: { fontSize: 15, fontWeight: '700', color: SUCCESS },
  pctBubble: {
    backgroundColor: '#EEF5FF', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  pctText: { fontSize: 13, fontWeight: '800', color: ACCENT },

  divider: { height: 1, backgroundColor: '#F0F3FA', marginVertical: 12 },

  actionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  actionBtn:  { padding: 4 },
  actionView: { fontSize: 13, color: '#888', fontWeight: '500' },
  actionRight: { flexDirection: 'row', gap: 8 },

  iconBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7,
  },
  editBtn:    { backgroundColor: '#EEF5FF' },
  deleteBtn:  { backgroundColor: '#FEE8E8' },
  editIcon:   { fontSize: 12, marginRight: 4 },
  editText:   { fontSize: 13, color: ACCENT, fontWeight: '600' },
  deleteIcon: { fontSize: 12, marginRight: 4 },
  deleteText: { fontSize: 13, color: DANGER, fontWeight: '600' },

  emptyWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40,
  },
  emptyIcon:     { fontSize: 52, marginBottom: 16 },
  emptyTitle:    { fontSize: 20, fontWeight: '700', color: PRIMARY, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 21 },
  emptyBtn: {
    marginTop: 24, backgroundColor: PRIMARY,
    borderRadius: 12, paddingHorizontal: 28, paddingVertical: 13,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  fab:     { position: 'absolute', right: 20, bottom: 24, width: 36, height: 36, borderRadius: 18, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText: { color: '#D4A017', fontSize: 24, fontWeight: '700', lineHeight: 28 },
});

// ─── Avatar styles ────────────────────────────────────────────────────────────
const av = StyleSheet.create({
  img: {
    width: 58, height: 58, borderRadius: 14,
    backgroundColor: '#E8ECF4',
    borderWidth: 1.5, borderColor: '#DDE3EF',
  },
  fallback: {
    width: 58, height: 58, borderRadius: 14,
    backgroundColor: '#D6E4F7',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#B8CEE8',
  },
  initials: {
    fontSize: 20, fontWeight: '800', color: PRIMARY,
  },
});

// ─── Progress bar styles ──────────────────────────────────────────────────────
const pb = StyleSheet.create({
  track: {
    height: 7, backgroundColor: '#EEF2F8',
    borderRadius: 99, overflow: 'hidden', marginTop: 8,
  },
  fill: { height: '100%', borderRadius: 99 },
});