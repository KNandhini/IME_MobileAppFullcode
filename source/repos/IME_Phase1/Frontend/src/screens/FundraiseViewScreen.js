import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Alert, ScrollView,
  TouchableOpacity, Animated, Platform
} from 'react-native';
import { fundraiseService } from '../services/fundraiseService';

// ─── Constants ────────────────────────────────────────────────────────────────
const PRIMARY = '#1E3A5F';
const ACCENT  = '#2E86DE';
const SUCCESS = '#27AE60';
const DANGER  = '#E74C3C';
const BG      = '#F0F4FA';

const URGENCY = {
  Critical: { bg: '#FDE8E8', text: '#C0392B', dot: '#E74C3C' },
  Urgent:   { bg: '#FEF3E2', text: '#D35400', dot: '#F39C12' },
  Normal:   { bg: '#E8F8F0', text: '#1E8449', dot: '#27AE60' },
};

// ─── Animated Progress Bar ────────────────────────────────────────────────────
function ProgressBar({ collected, target }) {
  const anim = useRef(new Animated.Value(0)).current;
  const pct  = target > 0 ? Math.min((collected / target) * 100, 100) : 0;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  const color = pct >= 75 ? SUCCESS : pct >= 40 ? ACCENT : '#F39C12';

  return (
    <View>
      <View style={pb.track}>
        <Animated.View style={[pb.fill, { width, backgroundColor: color }]} />
      </View>
      <View style={pb.labels}>
        <Text style={pb.labelText}>₹{collected.toLocaleString('en-IN')} raised</Text>
        <Text style={[pb.labelText, { color: PRIMARY, fontWeight: '700' }]}>
          {Math.round(pct)}%
        </Text>
        <Text style={pb.labelText}>of ₹{target.toLocaleString('en-IN')}</Text>
      </View>
    </View>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={ir.row}>
      <View style={ir.iconWrap}>
        <Text style={ir.icon}>{icon}</Text>
      </View>
      <View style={ir.content}>
        <Text style={ir.label}>{label}</Text>
        <Text style={ir.value}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children }) {
  return (
    <View style={sc.card}>
      <Text style={sc.title}>{title}</Text>
      {children}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
const FundraiseViewScreen = ({ route, navigation }) => {
  const { data } = route.params;

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const target    = Number(data.targetAmount)    || 0;
  const collected = Number(data.collectedAmount) || 0;
  const balance   = Number(data.balanceAmount)   || target;
  const urgency   = URGENCY[data.urgencyLevel]   || URGENCY.Normal;

  const handleDelete = () => {
    Alert.alert('Delete Fund', 'Are you sure you want to delete this fund?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await fundraiseService.delete(data.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>

      

      <Animated.ScrollView
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero card ── */}
        <View style={styles.heroCard}>
          {/* Category + urgency */}
          <View style={styles.heroMeta}>
            {data.fundCategory ? (
              <View style={styles.categoryChip}>
                <Text style={styles.categoryText}>{data.fundCategory}</Text>
              </View>
            ) : null}
            {data.urgencyLevel ? (
              <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg }]}>
                <View style={[styles.urgencyDot, { backgroundColor: urgency.dot }]} />
                <Text style={[styles.urgencyText, { color: urgency.text }]}>
                  {data.urgencyLevel}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.fundTitle}>{data.fundTitle || 'Untitled Fund'}</Text>

          {data.description ? (
            <Text style={styles.description}>{data.description}</Text>
          ) : null}

          {/* Progress */}
          <View style={styles.progressWrap}>
            <ProgressBar collected={collected} target={target} />
          </View>

          {/* Amount tiles */}
          <View style={styles.amountGrid}>
            <View style={[styles.amountTile, { backgroundColor: '#E8F8F0' }]}>
              <Text style={styles.amountTileVal}>₹{collected.toLocaleString('en-IN')}</Text>
              <Text style={[styles.amountTileLabel, { color: SUCCESS }]}>Collected</Text>
            </View>
            <View style={[styles.amountTile, { backgroundColor: '#EEF5FF' }]}>
              <Text style={[styles.amountTileVal, { color: PRIMARY }]}>
                ₹{target.toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.amountTileLabel, { color: ACCENT }]}>Target</Text>
            </View>
            <View style={[styles.amountTile, { backgroundColor: '#FEF3E2' }]}>
              <Text style={[styles.amountTileVal, { color: '#D35400' }]}>
                ₹{balance.toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.amountTileLabel, { color: '#D35400' }]}>Balance</Text>
            </View>
          </View>
        </View>

        {/* ── Beneficiary ── */}
        <SectionCard title="👤  Beneficiary Info">
          <InfoRow icon="🙍" label="Full Name"          value={data.fullName} />
          <InfoRow icon="🎂" label="Age"                value={data.age?.toString()} />
          <InfoRow icon="⚧️" label="Gender"             value={data.gender} />
          <InfoRow icon="📍" label="Place"              value={data.place} />
          <InfoRow icon="🏠" label="Address"            value={data.address} />
          <InfoRow icon="📞" label="Contact"            value={data.contactNumber} />
          <InfoRow icon="🤝" label="Relation"           value={data.relationToCommunity} />
        </SectionCard>

        {/* ── Campaign ── */}
        <SectionCard title="📅  Campaign Info">
          <InfoRow icon="🗓️" label="Start Date"  value={formatDate(data.startDate)} />
          <InfoRow icon="🏁" label="End Date"    value={formatDate(data.endDate)} />
          <InfoRow icon="🔖" label="Status"      value={data.status} />
          <InfoRow icon="👷" label="Created By"  value={data.createdBy} />
          <InfoRow icon="✏️" label="Modified By" value={data.modifiedBy} />
        </SectionCard>

        {/* ── Bank ── */}
        <SectionCard title="🏦  Bank Details">
          <InfoRow icon="👤" label="Account Holder" value={data.accountHolderName} />
          <InfoRow icon="🏧" label="Account Number" value={data.bankAccountNumber} />
          <InfoRow icon="🔢" label="IFSC Code"      value={data.ifscCode} />
          <InfoRow icon="📲" label="UPI ID"         value={data.upiId} />
        </SectionCard>

        {/* ── Documents ── */}
        {(data.supportingDocumentUrl || data.beneficiaryPhotoUrl) ? (
          <SectionCard title="📎  Documents">
            <InfoRow icon="📄" label="Supporting Doc" value={data.supportingDocumentUrl} />
            <InfoRow icon="🖼️" label="Photo URL"      value={data.beneficiaryPhotoUrl} />
          </SectionCard>
        ) : null}

        {/* ── Actions ── */}
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('CreateFund', { data })}
          >
            <Text style={styles.editBtnIcon}>✏️</Text>
            <Text style={styles.editBtnText}>Edit Fund</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnIcon}>🗑️</Text>
            <Text style={styles.deleteBtnText}>Delete Fund</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
};

export default FundraiseViewScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    backgroundColor: PRIMARY,
    paddingTop: Platform.OS === 'ios' ? 52 : 18,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn:        { padding: 6 },
  backArrow:      { color: '#fff', fontSize: 22, fontWeight: '300' },
  headerLabel:    { color: '#fff', fontSize: 17, fontWeight: '700' },
  editHeaderBtn:  { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  editHeaderText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  scroll: { padding: 14 },

  // Hero card
  heroCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18,
    marginBottom: 14,
    elevation: 4, shadowColor: '#1E3A5F',
    shadowOpacity: 0.09, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  heroMeta: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  categoryChip: {
    backgroundColor: '#EEF2FF', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  categoryText:  { fontSize: 12, color: '#4361EE', fontWeight: '700' },
  urgencyBadge: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  urgencyDot:  { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  urgencyText: { fontSize: 12, fontWeight: '700' },

  fundTitle: {
    fontSize: 22, fontWeight: '800', color: '#1A2540',
    lineHeight: 28, marginBottom: 8,
  },
  description: {
    fontSize: 14, color: '#666', lineHeight: 21, marginBottom: 16,
  },
  progressWrap: { marginBottom: 16 },

  // Amount tiles
  amountGrid: { flexDirection: 'row', gap: 8 },
  amountTile: {
    flex: 1, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center',
  },
  amountTileVal:   { fontSize: 14, fontWeight: '800', color: SUCCESS, marginBottom: 3 },
  amountTileLabel: { fontSize: 11, fontWeight: '600' },

  // Action buttons
  actionsCard: { gap: 10 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: PRIMARY, borderRadius: 14,
    paddingVertical: 15, gap: 8,
    elevation: 3, shadowColor: PRIMARY,
    shadowOpacity: 0.25, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  editBtnIcon: { fontSize: 16 },
  editBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 15, gap: 8,
    borderWidth: 1.5, borderColor: '#F5C6C6',
  },
  deleteBtnIcon: { fontSize: 16 },
  deleteBtnText: { color: DANGER, fontSize: 16, fontWeight: '700' },
});

// ─── Section card styles ──────────────────────────────────────────────────────
const sc = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 14,
    elevation: 2, shadowColor: '#000',
    shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  title: { fontSize: 13, fontWeight: '800', color: PRIMARY, marginBottom: 12, letterSpacing: 0.3 },
});

// ─── Info row styles ──────────────────────────────────────────────────────────
const ir = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 9, borderBottomWidth: 1, borderColor: '#F3F5FB',
  },
  iconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F3F6FC', alignItems: 'center',
    justifyContent: 'center', marginRight: 12,
  },
  icon:    { fontSize: 15 },
  content: { flex: 1, justifyContent: 'center' },
  label:   { fontSize: 11, color: '#999', fontWeight: '500', marginBottom: 2 },
  value:   { fontSize: 14, color: '#1A2540', fontWeight: '600' },
});

// ─── Progress bar styles ──────────────────────────────────────────────────────
const pb = StyleSheet.create({
  track: {
    height: 8, backgroundColor: '#EEF2F8',
    borderRadius: 99, overflow: 'hidden',
  },
  fill:   { height: '100%', borderRadius: 99 },
  labels: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 8,
  },
  labelText: { fontSize: 12, color: '#888' },
});