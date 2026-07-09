import React, { useRef, useEffect } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity, Animated, Platform } from 'react-native';
import { fundraiseService } from '../services/fundraiseService';
import { FundraiseViewScreenStyles as styles, FundraiseViewScreenSc as sc, FundraiseViewScreenIr as ir, FundraiseViewScreenPb as pb } from './screenStyles';

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
        {/*<View style={styles.actionsCard}>
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
        </View>*/}

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
};

export default FundraiseViewScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────


// ─── Section card styles ──────────────────────────────────────────────────────


// ─── Info row styles ──────────────────────────────────────────────────────────


// ─── Progress bar styles ──────────────────────────────────────────────────────
