import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  Image, TouchableOpacity, ScrollView, ActivityIndicator,
  Modal, TextInput, Platform,
  KeyboardAvoidingView, Animated, Alert, StatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supportService } from '../services/supportService';
import { memberService } from '../services/memberService';
import { feedService } from '../services/feedService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
// At the top of AddSupportScreen, import:
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
// ── Constants ─────────────────────────────────────────────────────────────────
// Categories are loaded from API (tbl_SupportCategory). These are fallbacks only.
const FALLBACK_CATEGORIES = [
  { label: 'Technical',  value: 1 },
  { label: 'Legal',      value: 2 },
  { label: 'Health',     value: 3 },
  { label: 'Financial',  value: 4 },
  { label: 'Education',  value: 5 },
];
const getUserId = async () => {
  const userData = await AsyncStorage.getItem('userData');

  if (!userData) return null;

  const parsed = JSON.parse(userData);

  return parsed.userId || parsed.memberId || null;
};
const getUserRole = async () => {
  const userData = await AsyncStorage.getItem('userData');
  if (!userData) return null;

  const parsed = JSON.parse(userData);

  // adjust based on your API response
  return parsed.roleName || parsed.role || null;
};

const TITLE_ALLOWED = /^[a-zA-Z0-9 \-.,]*$/;

const getInitial = (name) => (name || '?').charAt(0).toUpperCase();

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// ── Scrollable Dropdown ───────────────────────────────────────────────────────
// Uses a full-screen Modal so the list is always scrollable regardless of
// position in the form.
function Dropdown({ label, options, value, onChange, placeholder = 'Select…', error, loading }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={dd.wrapper}>
      <Text style={dd.label}>{label}</Text>

      <TouchableOpacity
        style={[dd.trigger, !!error && dd.triggerError]}
        onPress={() => !loading && setOpen(true)}
        activeOpacity={0.8}
      >
        {loading ? <ActivityIndicator size="small" color="#3B82F6" /> : null}

        <Text style={[dd.triggerText, !selected && dd.placeholder]}>
          {loading ? 'Loading…' : selected ? selected.label : placeholder}
        </Text>

        <Text style={dd.chevron}>▼</Text>
      </TouchableOpacity>

      {!!error && <Text style={dd.errorText}>{error}</Text>}

      {/* FULL SCREEN MODAL */}
      <Modal visible={open} transparent animationType="slide">
        <TouchableOpacity style={dd.overlay} onPress={() => setOpen(false)} />

        <View style={dd.sheet}>
          <View style={dd.sheetHeader}>
            <Text style={dd.sheetTitle}>{label}</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Text style={dd.sheetClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={options}
            keyExtractor={(o) => String(o.value)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[dd.option, item.value === value && dd.optionActive]}
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
              >
                <Text style={[dd.optionText, item.value === value && dd.optionTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
            style={{ flexGrow: 1 }}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={20}
            maxToRenderPerBatch={20}
          />
        </View>
      </Modal>
    </View>
  );
}

const dd = StyleSheet.create({
  wrapper         : { marginBottom: 20 },
  label           : { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.6 },
  trigger         : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1.5, borderColor: '#E2E8F0' },
  triggerError    : { borderColor: '#EF4444' },
  triggerText     : { flex: 1, fontSize: 15, color: '#1E293B', fontWeight: '500' },
  placeholder     : { color: '#CBD5E1' },
  chevron         : { fontSize: 10, color: '#94A3B8', marginLeft: 8 },
  errorText       : { fontSize: 11, color: '#EF4444', marginTop: 4 },

  // Sheet modal
  overlay         : { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet           : { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,   height: '65%', paddingBottom: 30 },
  sheetHeader     : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sheetTitle      : { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  sheetClose      : { fontSize: 18, color: '#94A3B8', fontWeight: '700' },
  option          : { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  optionActive    : { backgroundColor: '#EFF6FF' },
  optionText      : { flex: 1, fontSize: 15, color: '#334155' },
  optionTextActive: { color: '#1D4ED8', fontWeight: '600' },
  tick            : { fontSize: 14, color: '#1D4ED8', fontWeight: '700' },
});

// ── Date Picker Field ─────────────────────────────────────────────────────────
function DatePickerField({ label, required, value, onChange, error }) {
  const [show, setShow] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 80);

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  return (
    <View style={dp.wrapper}>
      <Text style={dp.label}>
        {label}{required && <Text style={dp.req}> *</Text>}
      </Text>

      {/* INPUT LIKE YOUR SIGNUP */}
      <TouchableOpacity onPress={() => setShow(true)}>
        <View pointerEvents="none">
          <TextInput
            value={value}
            placeholder="YYYY-MM-DD"
            style={[dp.input, !!error && dp.triggerError]}
            editable={false}
          />
        </View>
      </TouchableOpacity>

      {!!error && <Text style={dp.errorText}>{error}</Text>}

      {/* DATE PICKER */}
      {show && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"   // ✅ IMPORTANT
          minimumDate={minDate}
          maximumDate={today}
          onChange={(event, date) => {
            setShow(false);   // ✅ always close

            if (event.type === 'set' && date) {
              setSelectedDate(date);
              onChange(formatDate(date));
            }
          }}
        />
      )}
    </View>
  );
}

const dp = StyleSheet.create({
  wrapper      : { marginBottom: 20 },
  label        : { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.6 },
  req          : { color: '#EF4444' },
  trigger      : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1.5, borderColor: '#E2E8F0' },
  triggerError : { borderColor: '#EF4444' },
  triggerText  : { flex: 1, fontSize: 15, color: '#1E293B', fontWeight: '500' },
  placeholder  : { color: '#CBD5E1' },
  icon         : { fontSize: 16 },
  errorText    : { fontSize: 11, color: '#EF4444', marginTop: 4 },
  overlay      : { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet        : { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 30 },
  sheetHeader  : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sheetTitle   : { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  sheetDone    : { fontSize: 15, color: '#2563EB', fontWeight: '700' },
  input: {
  backgroundColor: '#F8FAFC',
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 15,
  color: '#1E293B',
  borderWidth: 1.5,
  borderColor: '#E2E8F0',
},
});

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, required, children, error, hint, charCount, maxChars }) {
  const over = maxChars != null && charCount > maxChars;
  return (
    <View style={fld.wrapper}>
      <View style={fld.labelRow}>
        <Text style={fld.label}>
          {label}{required && <Text style={fld.req}> *</Text>}
        </Text>
        {maxChars != null && (
          <Text style={[fld.counter, over && fld.counterOver]}>
            {charCount ?? 0}/{maxChars}
          </Text>
        )}
      </View>
      {children}
      {!!hint  && !error && <Text style={fld.hint}>{hint}</Text>}
      {!!error && <Text style={fld.error}>{error}</Text>}
    </View>
  );
}
const fld = StyleSheet.create({
  wrapper     : { marginBottom: 20 },
  labelRow    : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  label       : { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.6 },
  req         : { color: '#EF4444' },
  counter     : { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  counterOver : { color: '#EF4444' },
  hint        : { fontSize: 11, color: '#94A3B8', marginTop: 5 },
  error       : { fontSize: 11, color: '#EF4444', marginTop: 5, fontWeight: '500' },
});

// ── Styled TextInput ──────────────────────────────────────────────────────────
function StyledInput({ hasError, multiline, style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      style={[
        inp.base,
        multiline && inp.multiline,
        focused   && inp.focused,
        hasError  && inp.errored,
        style,
      ]}
      placeholderTextColor="#CBD5E1"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      {...props}
    />
  );
}
const inp = StyleSheet.create({
  base     : { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1E293B', borderWidth: 1.5, borderColor: '#E2E8F0', fontWeight: '500' },
  focused  : { borderColor: '#3B82F6', backgroundColor: '#fff' },
  errored  : { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
  multiline: { height: 130, paddingTop: 14 },
});

// ── Attachment pill ───────────────────────────────────────────────────────────
function AttachmentPill({ name, onRemove }) {
  const isPdf = name?.toLowerCase().endsWith('.pdf');
  return (
    <View style={att.pill}>
      <Text style={att.icon}>{isPdf ? '📄' : '🎬'}</Text>
      <Text style={att.name} numberOfLines={1}>{name}</Text>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={att.remove}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}
const att = StyleSheet.create({
  pill  : { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, marginRight: 8, marginBottom: 8, maxWidth: 170, borderWidth: 1, borderColor: '#BFDBFE' },
  icon  : { fontSize: 14, marginRight: 5 },
  name  : { flex: 1, fontSize: 12, color: '#1D4ED8', fontWeight: '500' },
  remove: { fontSize: 12, color: '#EF4444', marginLeft: 6, fontWeight: '800' },
});

// ── Full-screen Add Support Form ──────────────────────────────────────────────
function AddSupportScreen({ visible, onClose, onSubmit, editItem, preloadedMembers = [], preloadedMembersLoading = false }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const [members,           setMembers]           = useState(preloadedMembers);
  const [membersLoading,    setMembersLoading]     = useState(preloadedMembersLoading);
  const [categories,        setCategories]         = useState([]);
  const [categoriesLoading, setCategoriesLoading]  = useState(false);
  const [attachments,       setAttachments]        = useState([]);
  const [errors,            setErrors]             = useState({});
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [fileViewer, setFileViewer] = useState({ visible: false, uri: null, type: null });
//const [imgError, setImgError] = useState(false);
  // Form state uses DB column names directly
  const [form, setForm] = useState({
    personName            : null,   // FK → member
    title               : '',     // Title  nvarchar(400)
    amount              : '',     // Amount (extra column)
    description         : '',     // Description nvarchar(max)
    categoryId          : null,   // CategoryId int → tbl_SupportCategory
    supportDate         : '',     // SupportDate date
    
    companyOrIndividual : null,   // CompanyOrIndividual nvarchar(400) — driven by category type
    // companyName is only used when category type = Company; stored into companyOrIndividual
    companyName         : '',
    createdBy:0,
  });

  const loadMembers = async () => {
    setMembersLoading(true);
    try {
      const res = await memberService.getAllMembers(1, 100);
      if (res?.success) {
        setMembers(
          (res.data ?? []).map((m) => ({
            label: m.fullName ?? '',
            value: m.memberId,
          }))
        );
      }
    } catch (e) {
      console.error('Load members error:', e);
    } finally {
      setMembersLoading(false);
    }
  };

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await supportService.getCategories();
      if (res?.success || res?.length) {
        setCategories(
          (res ?? [])
            .filter((c) => c.isActive)
            .map((c) => ({
              label    : c.categoryName,
              value    : c.categoryId,
              isCompany: c.categoryType?.toLowerCase() === 'company',
            }))
        );
      } else {
        setCategories(FALLBACK_CATEGORIES.map((c) => ({ ...c, isCompany: false })));
      }
    } catch (e) {
      console.error('Load categories error:', e);
      setCategories(FALLBACK_CATEGORIES.map((c) => ({ ...c, isCompany: false })));
    } finally {
      setCategoriesLoading(false);
    }
  };

  const setField = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  // Keep local members in sync with parent's preloaded list
  useEffect(() => {
    if (preloadedMembers.length > 0) {
      setMembers(preloadedMembers);
      setMembersLoading(false);
    }
  }, [preloadedMembers]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
      ]).start();
      if (preloadedMembers.length === 0) loadMembers();
      loadCategories();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 40, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    if (editItem && visible && members.length && categories.length) {
      const loadDetail = async () => {
        try {
          const detail = await supportService.getById(editItem.supportId);
          const data = detail?.data ?? detail;
          setForm({
            personName: data.personName || '',
            title: data.title || '',
            amount: data.amount != null ? String(data.amount) : '',
            description: data.description || '',
            categoryId: categories.find(c => c.label === data.categoryName)?.value || null,
            supportDate: data.supportDate ? data.supportDate.substring(0, 10) : '',
            companyOrIndividual: data.companyOrIndividual === 'Individual' ? 'Individual' : 'Company',
            companyName: data.companyOrIndividual !== 'Individual' ? (data.companyName || '') : '',
            createdBy: 0,
          });
          setExistingAttachments(data.attachments || []);
        } catch (e) {
          console.error('Load detail error:', e);
        }
      };
      loadDetail();
    }
  }, [editItem, visible, members, categories]);

  const handleTitleChange = (val) => {
    if (!TITLE_ALLOWED.test(val)) return;
    if (val.length > 50) return;
    setField('title', val);
  };

  const handleDescriptionChange = (val) => {
    if (val.length > 500) return;
    setField('description', val);
  };

  const handleCompanyNameChange = (val) => {
    if (val.length > 150) return;
    setField('companyName', val);
  };

  // Derived: is selected category a "Company" type?
  const selectedCategory = categories.find((c) => c.value === form.categoryId);
  const isCompanyType    = selectedCategory?.isCompany ?? false;

  const validate = () => {
    const e = {};
    if (!form.personName)                                       e.memberId    = 'Please select a person';
    if (!form.title.trim())                                   e.title       = 'Title is required';
    if (!form.categoryId)                                     e.categoryId  = 'Please select a category';
    if (!form.supportDate)                                    e.supportDate = 'Date is required';
  // ✅ ADD THIS
  if (!form.companyOrIndividual)
    e.companyOrIndividual = 'Please select type';
    if (form.companyOrIndividual === 'Company' && !form.companyName.trim())
  e.companyName = 'Company name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const payload = {
      ...form,
      supportId: editItem?.supportId || null,
    };
    handleClose();
    await onSubmit(payload, attachments);
  };

  const handleClose = () => {
    setForm({ personName: null, title: '', amount: '', description: '', categoryId: null, supportDate: '', companyOrIndividual: null, companyName: '' });
    setAttachments([]);
    setErrors({});
      setExistingAttachments([]);
    onClose();
  };

const handlePickAttachment = async () => {
  // ✅ Calculate how many more slots are available
  const totalExisting = existingAttachments.length;
  const totalNew      = attachments.length;
  const totalUsed     = totalExisting + totalNew;
  const slotsLeft     = 5 - totalUsed;

  if (slotsLeft <= 0) {
    Alert.alert('Limit reached', 'Max 5 attachments per support entry.');
    return;
  }

  Alert.alert('Attach File', 'Choose file type', [
    {
      text: 'PDF / Document',
      onPress: async () => {
        const result = await DocumentPicker.getDocumentAsync({
          type: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ],
          copyToCacheDirectory: true,
          multiple: true,   // ✅ allow multiple docs
        });

        if (!result.canceled && result.assets?.length > 0) {
          // ✅ Slice to only take as many as slots allow
          const picked = result.assets.slice(0, slotsLeft).map(asset => ({
            uri:      asset.uri,
            fileName: asset.name,
            mimeType: asset.mimeType || 'application/pdf',
            type:     'document',
          }));
          setAttachments(prev => [...prev, ...picked]);

          if (result.assets.length > slotsLeft) {
            Alert.alert('Limit applied', `Only ${slotsLeft} file(s) added. Max 5 total.`);
          }
        }
      },
    },
    {
      text: 'Photo / Video',
      onPress: async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Allow access to your photo library.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images', 'videos'],
          allowsMultipleSelection: true,   // ✅ allow multiple images/videos
          selectionLimit: slotsLeft,        // ✅ cap at available slots
          quality: 0.85,
        });

        if (!result.canceled && result.assets?.length > 0) {
          const picked = result.assets.slice(0, slotsLeft).map(asset => ({
            uri:      asset.uri,
            fileName: asset.fileName || `media_${Date.now()}`,
            mimeType: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
            type:     asset.type === 'video' ? 'video' : 'image',
          }));
          setAttachments(prev => [...prev, ...picked]);

          if (result.assets.length > slotsLeft) {
            Alert.alert('Limit applied', `Only ${slotsLeft} file(s) added. Max 5 total.`);
          }
        }
      },
    },
    { text: 'Cancel', style: 'cancel' },
  ]);
};

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="none" transparent={false} statusBarTranslucent onRequestClose={handleClose}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A5F" />
      <SafeAreaView style={fs.safe}>
        <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* ── Navigation Bar with Cancel / Add buttons ── */}
          <View style={fs.navbar}>
            <TouchableOpacity onPress={handleClose} style={fs.navSideBtn}>
              <Text style={fs.navCancelText}>Cancel</Text>
            </TouchableOpacity>
            <View style={fs.navCenter}>
              <Text style={fs.navTitle}>{editItem ? 'Edit Support' : 'New Support'}</Text>
            </View>
            <TouchableOpacity onPress={handleSubmit} style={fs.navSideBtn}>
              <Text style={fs.navSubmitText}>{editItem ? 'Update' : 'Add'}</Text>
            </TouchableOpacity>
          </View>
          <View style={fs.accentBar} />

          {/* ── Form Body ── */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={fs.scroll}
              contentContainerStyle={fs.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >

              {/* MEMBER — scrollable dropdown */}
           {/*   <Dropdown
  label="Person Name *"
  options={members}
  value={form.personName}
  onChange={(v) => {
    const selected = members.find(m => m.value === v);
    setField('personName', selected?.label || '');
  }}

                placeholder="Select member…"
                error={errors.memberId}
                loading={membersLoading}
              />*/}
              <Dropdown
  label="Support Person *"
  options={members}
  value={
    members.find(m => m.label === form.personName)?.value || null
  }
  onChange={(v) => {
    const selected = members.find(m => m.value === v);
    setField('personName', selected?.label || '');
  }}
  placeholder="Select member…"
  error={errors.memberId}
  loading={membersLoading}
/>

              {/* TITLE */}
              <Field
                label="Title"
                required
                error={errors.title}
                hint="Only letters, digits and  –  .  ,  allowed"
                charCount={form.title.length}
                maxChars={50}
              >
                <StyledInput
                  placeholder="Enter a short title"
                  value={form.title}
                  onChangeText={handleTitleChange}
                  hasError={!!errors.title}
                  maxLength={50}
                  returnKeyType="next"
                />
              </Field>

              {/* AMOUNT */}
              <Field label="Amount">
                <StyledInput
                  placeholder="0"
                  value={form.amount ? Number(form.amount.replace(/,/g, '')).toLocaleString('en-IN') : ''}
                  onChangeText={(v) => {
                    const raw = v.replace(/,/g, '').replace(/[^0-9]/g, '');
                    setField('amount', raw);
                  }}
                  keyboardType="number-pad"
                  returnKeyType="next"
                />
              </Field>

              {/* DESCRIPTION */}
              <Field
                label="Description"
                error={errors.description}
                charCount={form.description.length}
                maxChars={500}
              >
                <StyledInput
                  placeholder="Describe the support in detail…"
                  value={form.description}
                  onChangeText={handleDescriptionChange}
                  hasError={!!errors.description}
                  multiline
                  maxLength={500}
                />
              </Field>

              {/* CATEGORY — fetched from API (tbl_SupportCategory) */}
              <Dropdown
                label="Support Category *"
                options={categories}
                value={form.categoryId}
                onChange={(v) => {
                  setField('categoryId', v);
                  // Reset company name when category changes
                  setField('companyName', '');
                }}
                placeholder="Select category…"
                error={errors.categoryId}
                loading={categoriesLoading}
              />

              {/* SUPPORT DATE — date picker */}
              <DatePickerField
                label="Support Date"
                required
                value={form.supportDate}
                onChange={(v) => setField('supportDate', v)}
                error={errors.supportDate}
              />
<Dropdown
  label="Type *"
  options={[
    { label: 'Individual', value: 'Individual' },
    { label: 'Company', value: 'Company' }
  ]}
  value={form.companyOrIndividual}
  onChange={(v) => setField('companyOrIndividual', v)}
  error={errors.companyOrIndividual}
/>

{/* COMPANY NAME — shown only when user selects Company */}
{form.companyOrIndividual === 'Company' && (
  <Field
    label="Company Name"
    required
    error={errors.companyName}
    charCount={form.companyName.length}
    maxChars={400}
  >
    <StyledInput
      placeholder="Enter company name"
      value={form.companyName}
      onChangeText={handleCompanyNameChange}
      hasError={!!errors.companyName}
      maxLength={400}
      returnKeyType="next"
    />
  </Field>
)}

              {/* ATTACHMENTS */}
              <Field label="Attachments">
                <View style={fs.attachGrid}>

                  {/* EXISTING attachments */}
                  {existingAttachments.map((a) => {
                    const uri = supportService.getAttachmentUrl(a.attachmentId);
                    const type = a.mediaType?.trim();
                    return (
                      <View key={`ex-${a.attachmentId}`} style={fs.gridThumb}>
                        <TouchableOpacity style={{ flex: 1 }} onPress={() => {
                          if (type === 'image') setFileViewer({ visible: true, uri, type });
                          else Linking.openURL(uri);
                        }}>
                          {type === 'image' ? (
                            <Image source={{ uri }} style={fs.gridImg} resizeMode="cover" />
                          ) : (
                            <View style={fs.gridDoc}>
                              <Text style={fs.gridDocIcon}>{type === 'video' ? '🎬' : '📄'}</Text>
                              <Text style={fs.gridDocName} numberOfLines={2}>{a.fileName}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity style={fs.gridRemove} onPress={() => {
                          Alert.alert('Delete', `Delete "${a.fileName}"?`, [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: async () => {
                              try {
                                await supportService.deleteAttachment(a.attachmentId);
                                setExistingAttachments(prev => prev.filter(x => x.attachmentId !== a.attachmentId));
                              } catch { Alert.alert('Error', 'Failed to delete'); }
                            }},
                          ]);
                        }}>
                          <Text style={fs.gridRemoveText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                  {/* NEW attachments */}
                  {attachments.map((a, i) => (
                    <View key={i} style={fs.gridThumb}>
                      <TouchableOpacity style={{ flex: 1 }} onPress={() => {
                        if (a.type === 'image') setFileViewer({ visible: true, uri: a.uri, type: 'image' });
                        else Linking.openURL(a.uri);
                      }}>
                        {a.type === 'image' ? (
                          <Image source={{ uri: a.uri }} style={fs.gridImg} resizeMode="cover" />
                        ) : (
                          <View style={fs.gridDoc}>
                            <Text style={fs.gridDocIcon}>{a.type === 'video' ? '🎬' : '📄'}</Text>
                            <Text style={fs.gridDocName} numberOfLines={2}>{a.fileName}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity style={fs.gridRemove} onPress={() => setAttachments(p => p.filter((_, idx) => idx !== i))}>
                        <Text style={fs.gridRemoveText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Add More button */}
                  {(existingAttachments.length + attachments.length) < 10 && (
                    <TouchableOpacity style={fs.gridAddBtn} onPress={handlePickAttachment} activeOpacity={0.8}>
                      <Text style={fs.gridAddIcon}>📷</Text>
                      <Text style={fs.gridAddText}>Add More ({existingAttachments.length + attachments.length}/10)</Text>
                    </TouchableOpacity>
                  )}

                </View>
                <Text style={fs.attachHint}>JPG, PNG, GIF, WEBP, MP4, MOV, AVI, MKV · Max 50 MB each</Text>
              </Field>

            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </SafeAreaView>

      {/* Image viewer Modal */}
      <Modal visible={fileViewer.visible} transparent animationType="fade" onRequestClose={() => setFileViewer({ visible: false, uri: null, type: null })}>
        <View style={fs.viewerOverlay}>
          <TouchableOpacity style={fs.viewerClose} onPress={() => setFileViewer({ visible: false, uri: null, type: null })}>
            <Text style={fs.viewerCloseText}>✕</Text>
          </TouchableOpacity>
          {fileViewer.uri && (
            <Image source={{ uri: fileViewer.uri }} style={fs.viewerImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </Modal>
  );
}

const fs = StyleSheet.create({
  safe          : { flex: 1, backgroundColor: '#1E3A5F' },
  navbar        : { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, paddingTop: (StatusBar.currentHeight ?? 0) + 12, backgroundColor: '#1E3A5F' },
  navSideBtn    : { minWidth: 64, paddingHorizontal: 4, paddingVertical: 4 },
  navCenter     : { flex: 1, alignItems: 'center' },
  navTitle      : { fontSize: 16, fontWeight: '700', color: '#fff' },
  navCancelText : { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  navSubmitText : { fontSize: 15, color: '#D4A017', fontWeight: '700', textAlign: 'right' },
  accentBar     : { height: 3, backgroundColor: '#D4A017', opacity: 0.3 },
  scroll        : { flex: 1, backgroundColor: '#FAFBFC' },
  scrollContent : { paddingHorizontal: 20, paddingTop: 26, paddingBottom: 52 },
  attachHint    : { fontSize: 11, color: '#94A3B8', marginTop: 6 },

  // Grid-style attachment area
  attachGrid    : { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, borderStyle: 'dashed', padding: 8, minHeight: 80, alignItems: 'center' },
  gridThumb     : { width: 80, height: 80, borderRadius: 10, margin: 4, overflow: 'hidden', backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  gridImg       : { width: '100%', height: '100%' },
  gridDoc       : { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 4 },
  gridDocIcon   : { fontSize: 24 },
  gridDocName   : { fontSize: 9, color: '#64748B', textAlign: 'center', marginTop: 2 },
  gridRemove    : { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  gridRemoveText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  gridAddBtn    : { width: 80, height: 80, borderRadius: 10, margin: 4, borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  gridAddIcon   : { fontSize: 22, marginBottom: 2 },
  gridAddText   : { fontSize: 9, color: '#64748B', textAlign: 'center', fontWeight: '500' },

  // File viewer
  viewerOverlay  : { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  viewerImage    : { width: '100%', height: '80%' },
  viewerClose    : { position: 'absolute', top: 48, right: 20, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  viewerCloseText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

// ── Support Card ──────────────────────────────────────────────────────────────
function SupportCard({ item, userRole, onEdit, onDelete }) {
  const [imgError, setImgError] = useState(false);
  return (
    <View style={s.card}>

      {/* ── TOP ROW: badge + action buttons ── */}
      <View style={s.cardTopRow}>
        <View style={s.badge}>
          <Text style={s.badgeText}>{item.categoryName}</Text>
        </View>

        {userRole === 'Admin' && (
          <View style={s.cardActions}>
            <TouchableOpacity onPress={() => onEdit(item)} style={s.editBtn}>
              <Text style={s.editText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(item)} style={s.deleteBtn}>
              <Text style={s.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── CONTENT ROW: photo + text ── */}
      <View style={s.cardRow}>
       {item.image && !imgError ? (
  <Image
    source={{ uri: item.image }}
    style={s.photo}
    onError={() => setImgError(true)}
  />
) : (
  <View
    style={[
      s.photoPlaceholder,
      { backgroundColor: categoryColor(item.categoryId) }
    ]}
  >
    <Text style={s.photoPlaceholderText}>
      {getInitial(item.personName)}
    </Text>
  </View>
)}

        <View style={s.textContainer}>
          <Text style={s.title} numberOfLines={1}>{item.title}</Text>
          <Text style={s.personName}>{item.personName}</Text>
          <Text style={s.description} numberOfLines={2}>{item.description}</Text>

          <View style={s.metaRow}>
            {item.amount != null && (
              <Text style={s.amount}>₹{Number(item.amount).toLocaleString('en-IN')}</Text>
            )}
            {!!item.companyOrIndividual && (
              <Text style={s.company}>{item.companyOrIndividual}</Text>
            )}
            {!!item.supportDate && (
              <Text style={s.date}>{item.supportDate?.substring(0, 10)}</Text>
            )}
          </View>
        </View>
      </View>

    </View>
  );
}
function categoryColor(id) {
  const map = { 1: '#3182CE', 2: '#805AD5', 3: '#38A169', 4: '#D97706', 5: '#DD6B20' };
  return map[id] ?? '#718096';
}

// ── Tab Content ───────────────────────────────────────────────────────────────
function SupportTabContent({ categoryId, isActive, refresh, userRole, setRefreshSignal, onEdit }) {
  const [supportList, setSupportList] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);

  useEffect(() => {
    if (isActive) loadSupport();
  }, [isActive, categoryId]);

  useEffect(() => {
    if (refresh > 0 && isActive) loadSupport();
  }, [refresh]);

 /* const loadSupport = async () => {
    setLoading(true);
    try {
      const response = await supportService.getByCategory(categoryId);
      if (Array.isArray(response))      setSupportList(response);
      else if (response?.data)          setSupportList(response.data);
      else                              setSupportList([]);
    } catch (error) {
      console.error('Failed to load support:', error);
      setSupportList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };*/
  const loadSupport = async () => {
  setLoading(true);
  try {
   
    // ✅ Fetch BOTH APIs in parallel
    const [response, membersRes] = await Promise.all([
      supportService.getByCategory(categoryId),
      memberService.getAllMembers(1, 100),
    ]);

    // ✅ Build image map
    const imageMap = {};

    if (membersRes?.success) {
      (membersRes.data ?? []).forEach((m) => {
        if (m.profilePhoto) {
          imageMap[m.fullName] = `data:image/jpeg;base64,${m.profilePhoto}`;
        }
      });
    }

    // ✅ Normalize support list
    const list = Array.isArray(response)
      ? response
      : response?.data ?? [];

    // ✅ Merge image into each item
    const enrichedList = list.map((item) => ({
      ...item,
      image: imageMap[item.personName] ?? null,
    }));

    // ✅ SET FINAL DATA
    setSupportList(enrichedList);

  } catch (error) {
    console.error('Failed to load support:', error);
    setSupportList([]);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  // ✅ Delete with confirmation + refresh
  const handleDelete = (item) => {
    Alert.alert(
      'Confirm Delete',
      `Delete "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await supportService.delete(item.supportId);
              setRefreshSignal((prev) => prev + 1); // ✅ refresh list
            } catch (e) {
              Alert.alert('Error', 'Delete failed. Please try again.');
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => { setRefreshing(true); loadSupport(); };

  if (loading && !refreshing) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={s.loadingText}>Loading…</Text>
      </View>
    );
  }

  if (supportList.length === 0) {
    return (
      <View style={s.centered}>
        <Text style={s.emptyIcon}>📂</Text>
        <Text style={s.emptyTitle}>Nothing here yet</Text>
        <Text style={s.emptyText}>Tap + to add a support entry</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={supportList}
      renderItem={({ item }) => (
        <SupportCard
          item={item}
          userRole={userRole}
          onEdit={onEdit}           // ✅ passed from parent
          onDelete={handleDelete}   // ✅ local handler
        />
      )}
      keyExtractor={(item) => item.supportId?.toString() ?? Math.random().toString()}
      contentContainerStyle={s.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
      }
    />
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function SupportScreen() {
  const [categories,    setCategories]    = useState([]);
  const [tabsLoaded,    setTabsLoaded]    = useState(false);
  const [activeIndex,   setActiveIndex]   = useState(0);
  const [formVisible,    setFormVisible]   = useState(false);
  const [refreshSignal,  setRefreshSignal] = useState(0);
  const [editItem,       setEditItem]      = useState(null);
  const [userRole,       setUserRole]      = useState(null);
  const [submitting,     setSubmitting]    = useState(false);
  const [memberList,     setMemberList]    = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const loadUserRole = async () => {
    const role = await getUserRole();
    setUserRole(role);
  };

  const loadMemberList = async () => {
    setMembersLoading(true);
    try {
      const res = await memberService.getAllMembers(1, 100);
      if (res?.success) {
        setMemberList(
          (res.data ?? []).map((m) => ({ label: m.fullName ?? '', value: m.memberId }))
        );
      }
    } catch (e) {
      console.error('Load members error:', e);
    } finally {
      setMembersLoading(false);
    }
  };

  const loadTabs = async () => {
    try {
      const res = await supportService.getCategories();
      if (res?.success || res?.length) {
        setCategories(res?.filter((c) => c.isActive));
      } else {
        setCategories(FALLBACK_CATEGORIES.map((c) => ({ categoryId: c.value, categoryName: c.label, isActive: true })));
      }
    } catch {
      setCategories(FALLBACK_CATEGORIES.map((c) => ({ categoryId: c.value, categoryName: c.label, isActive: true })));
    } finally {
      setTabsLoaded(true);
    }
  };

  useEffect(() => {
    loadTabs();
    loadUserRole();
    loadMemberList();
  }, []);

  const handleSubmit = async (formData, attachments = []) => {
    setSubmitting(true);
    try {
      const userId = await getUserId();
      const payload = {
        personName          : formData.personName,
        title               : formData.title,
        amount              : parseFloat(formData.amount) || 0,
        description         : formData.description,
        categoryId          : formData.categoryId,
        supportDate         : formData.supportDate,
        companyOrIndividual : formData.companyOrIndividual,
        companyName         : formData.companyOrIndividual === 'Company' ? formData.companyName : null,
        createdBy           : userId,
      };

      let res;
      if (formData.supportId) {
        res = await supportService.update(formData.supportId, payload, attachments);
      } else {
        res = await supportService.create(payload, attachments);
      }

      if (res?.success || res?.supportId || res?.data) {
        const tabIndex = categories.findIndex((c) => c.categoryId === formData.categoryId);
        if (tabIndex !== -1) setActiveIndex(tabIndex);
        setRefreshSignal((prev) => prev + 1);

        // Post to home feed (fire-and-forget)
        const feedContent = `Support: ${formData.title}${formData.personName ? ` – ${formData.personName}` : ''}${formData.description ? `\n${formData.description}` : ''}`;
        feedService.createPost(feedContent).catch((e) => console.error('Feed post failed:', e));
      } else {
        Alert.alert('Error', res?.message ?? 'Failed to save support.');
      }
    } catch (e) {
      console.error('Submit error:', e);
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };
  if (!tabsLoaded) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor="#1E3A5F" barStyle="light-content" />

      {/* ── Tab Bar — driven by tbl_SupportCategory ── */}
      <View style={s.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabBarContent}>
          {categories.map((cat, index) => {
            const isActive = activeIndex === index;
            return (
              <TouchableOpacity
                key={cat.categoryId}
                style={[s.tab, isActive && s.tabActive]}
                onPress={() => setActiveIndex(index)}
                activeOpacity={0.7}
              >
                <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{cat.categoryName}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Content ── */}
      <View style={s.content}>
        {categories.map((cat, index) => (
          <View key={cat.categoryId} style={[s.tabPanel, { display: activeIndex === index ? 'flex' : 'none' }]}>
            <SupportTabContent
              categoryId={cat.categoryId}
              isActive={activeIndex === index}
              refresh={activeIndex === index ? refreshSignal : 0}
              userRole={userRole}
              setRefreshSignal={setRefreshSignal}
              onEdit={(item) => {
                setEditItem(item);
                setFormVisible(true);
              }}
            />
          </View>
        ))}
      </View>

      {/* ── Full-screen Form Modal ── */}
      <AddSupportScreen
        visible={formVisible}
        onClose={() => {
          setFormVisible(false);
          setEditItem(null);
        }}
        onSubmit={handleSubmit}
        editItem={editItem}
        preloadedMembers={memberList}
        preloadedMembersLoading={membersLoading}
      />

      {/* ── FAB — Material Design bottom-right ── */}
      {userRole === 'Admin' && (
        <TouchableOpacity style={s.fab} onPress={() => setFormVisible(true)} activeOpacity={0.85}>
          <Text style={s.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* ── Saving overlay ── */}
      {submitting && (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={s.loadingOverlayText}>Saving…</Text>
        </View>
      )}

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F9FC' },

  headerBar        : { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
  headerTitle      : { fontSize: 20, fontWeight: '700', color: '#1E3A5F' },
  fab              : { position: 'absolute', bottom: 24, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center', elevation: 4, zIndex: 100 },
  fabText          : { color: '#D4A017', fontSize: 24, fontWeight: '700', lineHeight: 28 },
  loadingOverlay   : { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  loadingOverlayText: { color: '#fff', marginTop: 12, fontSize: 15, fontWeight: '600' },

  tabBar        : { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
  tabBarContent : { paddingHorizontal: 10 },
  tab           : { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  tabActive     : { borderBottomColor: '#2563EB' },
  tabLabel      : { fontSize: 13, fontWeight: '500', color: '#A0AEC0' },
  tabLabelActive: { color: '#2563EB', fontWeight: '700' },

  content : { flex: 1 },
  tabPanel: { flex: 1 },
  list    : { padding: 16, paddingBottom: 40 },

  card                : { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, padding: 16, shadowColor: '#1A202C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardRow             : { flexDirection: 'row', alignItems: 'flex-start' },
  photo               : { width: 52, height: 52, borderRadius: 26, marginRight: 14 },
  photoPlaceholder    : { width: 52, height: 52, borderRadius: 26, marginRight: 14, alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  textContainer       : { flex: 1 },
  titleRow            : { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  title               : { fontSize: 15, fontWeight: '700', color: '#1A202C', flex: 1 },
  badge               : { backgroundColor: '#EBF4FF', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, marginLeft: 6 },
  badgeText           : { fontSize: 10, color: '#2B6CB0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  personName          : { fontSize: 13, fontWeight: '500', color: '#4A5568', marginBottom: 4 },
  description         : { fontSize: 13, color: '#718096', lineHeight: 18 },
  metaRow             : { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  amount              : { fontSize: 13, fontWeight: '700', color: '#276749' },
  company             : { fontSize: 11, color: '#A0AEC0', backgroundColor: '#F7FAFC', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  date                : { fontSize: 11, color: '#A0AEC0' },

  centered    : { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyIcon   : { fontSize: 40, marginBottom: 12 },
  emptyTitle  : { fontSize: 16, fontWeight: '700', color: '#2D3748', marginBottom: 4 },
  emptyText   : { fontSize: 14, color: '#A0AEC0' },
  loadingText : { color: '#718096', marginTop: 10, fontSize: 14 },
  cardActions : { flexDirection: 'row', gap: 8 },
editBtn     : { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5, borderColor: '#BFDBFE' },
deleteBtn   : { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5, borderColor: '#FECACA' },
editText    : { fontSize: 12, color: '#2563EB', fontWeight: '600' },
deleteText  : { fontSize: 12, color: '#EF4444', fontWeight: '600' },

// Add this new one:
cardTopRow  : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
});