import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Modal, FlatList, Switch, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { clubService } from '../services/clubService';
import { memberService } from '../services/memberService';

const CLUB_TYPES = ['Lions', 'Rotary', 'NGO', 'Professional', 'Sports', 'Cultural', 'Educational', 'Other'];

export default function ClubFormScreen({ route, navigation }) {
  const { clubId } = route.params || {};
  const isEditMode = !!clubId;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);

  // ── Lookup data ──────────────────────────────────────────────────────────
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [members, setMembers] = useState([]);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [countryModal, setCountryModal] = useState(false);
  const [stateModal, setStateModal] = useState(false);
  const [typeModal, setTypeModal] = useState(false);
  const [memberModal, setMemberModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  // ── Form fields ───────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    clubName: '',
    clubCode: '',
    description: '',
    countryId: null,
    countryName: '',
    stateId: null,
    stateName: '',
    city: '',
    district: '',
    addressLine1: '',
    addressLine2: '',
    pincode: '',
    contactPersonName: '',
    contactNumber: '',
    alternateNumber: '',
    email: '',
    website: '',
    clubType: '',
    establishedDate: '',
    totalMembers: '',
    adminMemberId: null,
    adminMemberName: '',
    registrationNumber: '',
    isActive: true,
  });

  useEffect(() => {
    loadLookups();
    if (isEditMode) loadClub();
  }, []);

  const loadLookups = async () => {
    const [cRes, mRes] = await Promise.all([
      clubService.getCountries(),
      memberService.getAllMembers(1, 500),
    ]);
    if (cRes.success) setCountries(cRes.data || []);
    if (mRes.success) setMembers((mRes.data || []).filter(m => m.membershipStatus === 'Active'));
  };

  const loadClub = async () => {
    const res = await clubService.getById(clubId);
    if (res.success && res.data) {
      const d = res.data;
      setForm({
        clubName:           d.clubName || '',
        clubCode:           d.clubCode || '',
        description:        d.description || '',
        countryId:          d.countryId || null,
        countryName:        d.countryName || '',
        stateId:            d.stateId || null,
        stateName:          d.stateName || '',
        city:               d.city || '',
        district:           d.district || '',
        addressLine1:       d.addressLine1 || '',
        addressLine2:       d.addressLine2 || '',
        pincode:            d.pincode || '',
        contactPersonName:  d.contactPersonName || '',
        contactNumber:      d.contactNumber || '',
        alternateNumber:    d.alternateNumber || '',
        email:              d.email || '',
        website:            d.website || '',
        clubType:           d.clubType || '',
        establishedDate:    d.establishedDate ? d.establishedDate.split('T')[0] : '',
        totalMembers:       d.totalMembers != null ? String(d.totalMembers) : '',
        adminMemberId:      d.adminMemberId || null,
        adminMemberName:    d.adminMemberName || '',
        registrationNumber: d.registrationNumber || '',
        isActive:           d.isActive !== false,
      });
      if (d.countryId) loadStates(d.countryId);
    }
    setLoading(false);
  };

  const loadStates = async (countryId) => {
    const res = await clubService.getStatesByCountry(countryId);
    if (res.success) setStates(res.data || []);
  };

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const selectCountry = async (country) => {
    set('countryId', country.countryId);
    set('countryName', country.countryName);
    set('stateId', null);
    set('stateName', '');
    setStates([]);
    setCountryModal(false);
    await loadStates(country.countryId);
  };

  const selectState = (state) => {
    set('stateId', state.stateId);
    set('stateName', state.stateName);
    setStateModal(false);
  };

  const selectMember = (member) => {
    set('adminMemberId', member.memberId);
    set('adminMemberName', member.fullName);
    setMemberModal(false);
    setMemberSearch('');
  };

  const filteredMembers = members.filter(m =>
    m.fullName?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.clubName.trim()) {
      Alert.alert('Validation', 'Club Name is required.');
      return;
    }

    setSaving(true);
    const payload = {
      clubName:           form.clubName.trim(),
      clubCode:           form.clubCode.trim() || null,
      description:        form.description.trim() || null,
      countryId:          form.countryId,
      stateId:            form.stateId,
      city:               form.city.trim() || null,
      district:           form.district.trim() || null,
      addressLine1:       form.addressLine1.trim() || null,
      addressLine2:       form.addressLine2.trim() || null,
      pincode:            form.pincode.trim() || null,
      contactPersonName:  form.contactPersonName.trim() || null,
      contactNumber:      form.contactNumber.trim() || null,
      alternateNumber:    form.alternateNumber.trim() || null,
      email:              form.email.trim() || null,
      website:            form.website.trim() || null,
      clubType:           form.clubType || null,
      establishedDate:    form.establishedDate || null,
      totalMembers:       form.totalMembers ? parseInt(form.totalMembers, 10) : 0,
      adminMemberId:      form.adminMemberId,
      registrationNumber: form.registrationNumber.trim() || null,
      isActive:           form.isActive,
    };

    const res = isEditMode
      ? await clubService.update(clubId, payload)
      : await clubService.create(payload);

    setSaving(false);

    if (res.success) {
      Alert.alert('Success', isEditMode ? 'Club updated.' : 'Club created.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Error', res.message || 'Something went wrong.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit Club' : 'Add Club'}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerBtn} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color="#D4A017" />
            : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Basic Details ── */}
        <SectionHeader title="Basic Details" />
        <Field label="Club Name *">
          <TextInput style={styles.input} value={form.clubName} onChangeText={v => set('clubName', v)} placeholder="Enter club name" placeholderTextColor="#bbb" />
        </Field>
        <Field label="Club Code">
          <TextInput style={styles.input} value={form.clubCode} onChangeText={v => set('clubCode', v)} placeholder="e.g. IME001" placeholderTextColor="#bbb" />
        </Field>
        <Field label="Description">
          <TextInput style={[styles.input, styles.textarea]} value={form.description} onChangeText={v => set('description', v)} placeholder="Brief description" placeholderTextColor="#bbb" multiline numberOfLines={3} textAlignVertical="top" />
        </Field>

        {/* ── Location Details ── */}
        <SectionHeader title="Location Details" />
        <Field label="Country">
          <TouchableOpacity style={styles.selector} onPress={() => setCountryModal(true)}>
            <Text style={form.countryName ? styles.selectorValue : styles.selectorPlaceholder}>
              {form.countryName || 'Select country'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#888" />
          </TouchableOpacity>
        </Field>
        <Field label="State">
          <TouchableOpacity
            style={[styles.selector, !form.countryId && styles.selectorDisabled]}
            onPress={() => form.countryId && setStateModal(true)}
          >
            <Text style={form.stateName ? styles.selectorValue : styles.selectorPlaceholder}>
              {form.stateName || (form.countryId ? 'Select state' : 'Select country first')}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#888" />
          </TouchableOpacity>
        </Field>
        <Row>
          <Field label="City" flex>
            <TextInput style={styles.input} value={form.city} onChangeText={v => set('city', v)} placeholder="City" placeholderTextColor="#bbb" />
          </Field>
          <Field label="District" flex>
            <TextInput style={styles.input} value={form.district} onChangeText={v => set('district', v)} placeholder="District" placeholderTextColor="#bbb" />
          </Field>
        </Row>
        <Field label="Address Line 1">
          <TextInput style={styles.input} value={form.addressLine1} onChangeText={v => set('addressLine1', v)} placeholder="Street / Building" placeholderTextColor="#bbb" />
        </Field>
        <Field label="Address Line 2">
          <TextInput style={styles.input} value={form.addressLine2} onChangeText={v => set('addressLine2', v)} placeholder="Area / Landmark" placeholderTextColor="#bbb" />
        </Field>
        <Field label="Pincode">
          <TextInput style={styles.input} value={form.pincode} onChangeText={v => set('pincode', v)} placeholder="6-digit pincode" placeholderTextColor="#bbb" keyboardType="number-pad" maxLength={10} />
        </Field>

        {/* ── Contact Details ── */}
        <SectionHeader title="Contact Details" />
        <Field label="Contact Person">
          <TextInput style={styles.input} value={form.contactPersonName} onChangeText={v => set('contactPersonName', v)} placeholder="Contact person name" placeholderTextColor="#bbb" />
        </Field>
        <Row>
          <Field label="Phone" flex>
            <TextInput style={styles.input} value={form.contactNumber} onChangeText={v => set('contactNumber', v)} placeholder="+91 XXXXXXXXXX" placeholderTextColor="#bbb" keyboardType="phone-pad" />
          </Field>
          <Field label="Alternate" flex>
            <TextInput style={styles.input} value={form.alternateNumber} onChangeText={v => set('alternateNumber', v)} placeholder="Alternate no." placeholderTextColor="#bbb" keyboardType="phone-pad" />
          </Field>
        </Row>
        <Field label="Email">
          <TextInput style={styles.input} value={form.email} onChangeText={v => set('email', v)} placeholder="club@example.com" placeholderTextColor="#bbb" keyboardType="email-address" autoCapitalize="none" />
        </Field>
        <Field label="Website">
          <TextInput style={styles.input} value={form.website} onChangeText={v => set('website', v)} placeholder="https://..." placeholderTextColor="#bbb" keyboardType="url" autoCapitalize="none" />
        </Field>

        {/* ── Club Info ── */}
        <SectionHeader title="Club Info" />
        <Field label="Club Type">
          <TouchableOpacity style={styles.selector} onPress={() => setTypeModal(true)}>
            <Text style={form.clubType ? styles.selectorValue : styles.selectorPlaceholder}>
              {form.clubType || 'Select club type'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#888" />
          </TouchableOpacity>
        </Field>
        <Field label="Established Date (YYYY-MM-DD)">
          <TextInput
            style={styles.input}
            value={form.establishedDate}
            onChangeText={v => set('establishedDate', v)}
            placeholder="e.g. 1995-06-15"
            placeholderTextColor="#bbb"
            maxLength={10}
            keyboardType="numbers-and-punctuation"
          />
        </Field>
        <Row>
          <Field label="Total Members" flex>
            <TextInput style={styles.input} value={form.totalMembers} onChangeText={v => set('totalMembers', v)} placeholder="0" placeholderTextColor="#bbb" keyboardType="number-pad" />
          </Field>
          <Field label="Reg. Number" flex>
            <TextInput style={styles.input} value={form.registrationNumber} onChangeText={v => set('registrationNumber', v)} placeholder="Registration no." placeholderTextColor="#bbb" />
          </Field>
        </Row>
        <Field label="Admin Member">
          <TouchableOpacity style={styles.selector} onPress={() => setMemberModal(true)}>
            <Text style={form.adminMemberName ? styles.selectorValue : styles.selectorPlaceholder}>
              {form.adminMemberName || 'Select admin member'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#888" />
          </TouchableOpacity>
        </Field>

        {/* ── Status ── */}
        <SectionHeader title="Status" />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Active</Text>
          <Switch
            value={form.isActive}
            onValueChange={v => set('isActive', v)}
            trackColor={{ false: '#ddd', true: '#1E3A5F' }}
            thumbColor={form.isActive ? '#D4A017' : '#f4f3f4'}
          />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Country Modal ── */}
      <PickerModal
        visible={countryModal}
        title="Select Country"
        items={countries}
        keyProp="countryId"
        labelProp="countryName"
        onSelect={selectCountry}
        onClose={() => setCountryModal(false)}
      />

      {/* ── State Modal ── */}
      <PickerModal
        visible={stateModal}
        title="Select State"
        items={states}
        keyProp="stateId"
        labelProp="stateName"
        onSelect={selectState}
        onClose={() => setStateModal(false)}
      />

      {/* ── Club Type Modal ── */}
      <PickerModal
        visible={typeModal}
        title="Select Club Type"
        items={CLUB_TYPES.map(t => ({ id: t, label: t }))}
        keyProp="id"
        labelProp="label"
        onSelect={item => { set('clubType', item.label); setTypeModal(false); }}
        onClose={() => setTypeModal(false)}
      />

      {/* ── Member Picker Modal ── */}
      <Modal visible={memberModal} animationType="slide" transparent onRequestClose={() => setMemberModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Admin Member</Text>
            <TextInput
              style={styles.modalSearch}
              value={memberSearch}
              onChangeText={setMemberSearch}
              placeholder="Search member..."
              placeholderTextColor="#bbb"
            />
            <FlatList
              data={filteredMembers}
              keyExtractor={m => String(m.memberId)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => selectMember(item)}>
                  <Text style={styles.modalItemText}>{item.fullName}</Text>
                  {item.email ? <Text style={styles.modalItemSub}>{item.email}</Text> : null}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.modalEmpty}>No active members found</Text>}
            />
            <TouchableOpacity style={styles.modalCancel} onPress={() => { setMemberModal(false); setMemberSearch(''); }}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ title }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function Field({ label, children, flex }) {
  return (
    <View style={[styles.field, flex && styles.fieldFlex]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Row({ children }) {
  return <View style={styles.row}>{children}</View>;
}

function PickerModal({ visible, title, items, keyProp, labelProp, onSelect, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{title}</Text>
          <FlatList
            data={items}
            keyExtractor={item => String(item[keyProp])}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => onSelect(item)}>
                <Text style={styles.modalItemText}>{item[labelProp]}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.modalEmpty}>No options available</Text>}
          />
          <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F0F2F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:      { backgroundColor: '#1E3A5F', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 44 : 54, paddingBottom: 14 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerBtn:   { padding: 4, minWidth: 48 },
  saveText:    { color: '#D4A017', fontSize: 16, fontWeight: '700', textAlign: 'right' },

  scroll: { paddingBottom: 40 },

  sectionHeader: { backgroundColor: '#E8EDF5', paddingHorizontal: 16, paddingVertical: 8, marginTop: 8 },
  sectionTitle:  { fontSize: 12, fontWeight: '700', color: '#1E3A5F', textTransform: 'uppercase', letterSpacing: 0.6 },

  field:     { paddingHorizontal: 16, paddingTop: 12 },
  fieldFlex: { flex: 1 },
  fieldLabel: { fontSize: 12, color: '#666', marginBottom: 4, fontWeight: '600' },

  input:    { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111' },
  textarea: { minHeight: 80 },

  selector:            { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectorDisabled:    { backgroundColor: '#F5F5F5', borderColor: '#E8E8E8' },
  selectorValue:       { fontSize: 14, color: '#111' },
  selectorPlaceholder: { fontSize: 14, color: '#bbb' },

  row: { flexDirection: 'row', gap: 0 },

  switchRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', marginTop: 2 },
  switchLabel: { fontSize: 15, color: '#333', fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', padding: 20 },
  modalTitle:   { fontSize: 17, fontWeight: '700', color: '#1E3A5F', marginBottom: 12 },
  modalSearch:  { backgroundColor: '#F0F2F5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, fontSize: 14, color: '#111' },
  modalItem:    { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalItemText: { fontSize: 15, color: '#111' },
  modalItemSub:  { fontSize: 12, color: '#888', marginTop: 2 },
  modalEmpty:   { textAlign: 'center', color: '#888', paddingVertical: 24 },
  modalCancel:  { marginTop: 12, backgroundColor: '#F0F2F5', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 15, color: '#1E3A5F', fontWeight: '600' },
});
