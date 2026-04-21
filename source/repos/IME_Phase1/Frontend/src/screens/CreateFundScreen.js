import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, ScrollView,
  StyleSheet, TouchableOpacity, Alert, Modal,
  FlatList, Image, Platform, ActivityIndicator
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { fundraiseService } from "../services/fundraiseService";

// ─── API Base ─────────────────────────────────────────────────────────────────
const API_BASE_URL = "http://10.0.2.2:51150/api";

/**
 * Parse comma-separated DB string into raw path array.
 * Keeps original paths exactly as stored (e.g. "Fundraise-5\\abc.png").
 */
const parseServerPaths = (raw) => {
  if (!raw) return [];
  return raw.split(",").map(p => p.trim()).filter(Boolean);
};

/** "Fundraise-5\\abc.png" → "Fundraise-5/abc.png" for the API ?path= param */
const toApiPath = (storedPath) => storedPath.replace(/\\/g, "/");

// ─── AuthImage ────────────────────────────────────────────────────────────────
/**
 * Fetches an image from the authenticated endpoint:
 *   GET /api/Fundraise/file?path=Fundraise-5/abc.png
 * Attaches the JWT Bearer token, converts blob → base64 data URI, then renders.
 */
function AuthImage({ path, style, resizeMode = "cover" }) {
  const [uri,   setUri]   = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const token   = await AsyncStorage.getItem("authToken");
        const apiPath = toApiPath(path);
        const url     = `${API_BASE_URL}/Fundraise/file?path=${encodeURIComponent(apiPath)}`;

        const res = await fetch(url, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const blob   = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => { if (!cancelled) setUri(reader.result); };
        reader.onerror   = () => { if (!cancelled) setError(true); };
        reader.readAsDataURL(blob);
      } catch (e) {
        console.warn("AuthImage failed:", path, e.message);
        if (!cancelled) setError(true);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [path]);

  if (error) {
    return (
      <View style={[style, { backgroundColor: "#E2E8F0", alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ fontSize: 22 }}>🖼️</Text>
      </View>
    );
  }
  if (!uri) {
    return (
      <View style={[style, { backgroundColor: "#E2E8F0", alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="small" color="#0D8A6E" />
      </View>
    );
  }
  return <Image source={{ uri }} style={style} resizeMode={resizeMode} />;
}

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:        "#F7F8FC",
  card:      "#FFFFFF",
  navy:      "#1A2E4A",
  teal:      "#0D8A6E",
  tealLight: "#E6F5F1",
  amber:     "#F59E0B",
  red:       "#E53E3E",
  border:    "#E2E8F0",
  muted:     "#94A3B8",
  text:      "#1E293B",
  sub:       "#64748B",
};

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function Dropdown({ label, options, value, onChange }) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch]   = useState("");
  const filtered = options.filter(o =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View>
      <TouchableOpacity
        style={s.dropTrigger}
        onPress={() => setVisible(true)}
      >
        <Text style={value ? s.dropValue : s.dropPlaceholder}>
          {value || label}
        </Text>
        <Text style={s.dropArrow}>▾</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <TouchableOpacity
          style={s.backdrop}
          activeOpacity={1}
          onPress={() => { setVisible(false); setSearch(""); }}
        />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>{label}</Text>
          <View style={s.searchBox}>
            <Text style={{ fontSize: 14 }}>🔍</Text>
            <TextInput
              style={s.searchInput}
              placeholder="Search…"
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={i => i}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.sheetItem, item === value && s.sheetItemActive]}
                onPress={() => {
                  onChange(item);
                  setVisible(false);
                  setSearch("");
                }}
              >
                <Text
                  style={[
                    s.sheetItemText,
                    item === value && s.sheetItemTextActive,
                  ]}
                >
                  {item}
                </Text>
                {item === value && (
                  <Text style={{ color: C.teal, fontWeight: "700" }}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={s.emptyHint}>No results</Text>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionIconWrap}>
        <Text style={s.sectionIcon}>{icon}</Text>
      </View>
      <View>
        <Text style={s.sectionTitle}>{title}</Text>
        {subtitle ? (
          <Text style={s.sectionSub}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>
        {label}
        {required ? <Text style={{ color: C.red }}> *</Text> : null}
      </Text>
      {children}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CreateFundScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { data }   = route.params || {};
  const isEdit     = !!data;

  // ── Local new files (not yet uploaded) ───────────────────────────────────
  const [photoFiles, setPhotoFiles] = useState([]); // [{ uri, name, type }]
  const [docFiles,   setDocFiles]   = useState([]); // [{ uri, name, type }]

  // ── Existing server paths (parsed from comma-separated DB string) ─────────
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [existingDocs,   setExistingDocs]   = useState([]);

  // ── Form ──────────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    fullName:            "",
    age:                 "",
    gender:              "",
    place:               "",
    address:             "",
    contactNumber:       "",
    relationToCommunity: "",
    fundTitle:           "",
    fundCategory:        "",
    description:         "",
    targetAmount:        "",
    balanceAmount:       "",
    minimumAmount:       "",
    collectedAmount:     "0",
    urgencyLevel:        "",
    startDate:           new Date(),
    endDate:             new Date(),
    status:              "Active",
  });

  const [bank, setBank] = useState({
    accountHolderName: "",
    bankAccountNumber: "",
    ifscCode:          "",
    upiId:             "",
  });

  const [showStart,  setShowStart]  = useState(false);
  const [showEnd,    setShowEnd]    = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Populate on edit ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isEdit || !data) return;
    setForm({
      fullName:            data.fullName            || "",
      age:                 data.age?.toString()     || "",
      gender:              data.gender              || "",
      place:               data.place               || "",
      address:             data.address             || "",
      contactNumber:       data.contactNumber       || "",
      relationToCommunity: data.relationToCommunity || "",
      fundTitle:           data.fundTitle           || "",
      fundCategory:        data.fundCategory        || "",
      description:         data.description         || "",
      targetAmount:        data.targetAmount?.toString()    || "",
      balanceAmount:       data.targetAmount?.toString()    || "",
      minimumAmount:       data.minimumAmount?.toString()   || "",
      collectedAmount:     data.collectedAmount?.toString() || "0",
      urgencyLevel:        data.urgencyLevel        || "",
      startDate:           new Date(data.startDate),
      endDate:             new Date(data.endDate),
      status:              data.status              || "Active",
    });
    setBank({
      accountHolderName: data.accountHolderName || "",
      bankAccountNumber: data.bankAccountNumber || "",
      ifscCode:          data.ifscCode          || "",
      upiId:             data.upiId             || "",
    });
    if (data.beneficiaryPhotoUrl) {
      // parseServerPaths handles backslashes + builds full URLs
      setExistingPhotos(parseServerPaths(data.beneficiaryPhotoUrl));
    }
    if (data.supportingDocumentUrl) {
      setExistingDocs(parseServerPaths(data.supportingDocumentUrl));
    }
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const set = (key, value) =>
    setForm(prev => {
      const u = { ...prev, [key]: value };
      if (key === "targetAmount") u.balanceAmount = value;
      return u;
    });

  // ── Pick multiple photos ──────────────────────────────────────────────────
  const pickPhotos = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Gallery access is required.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        // ✅ Fixed: MediaTypeOptions deprecated → use MediaType
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.length) {
        const picked = result.assets.map(a => ({
          uri:  a.uri,
          name: a.fileName || a.uri.split("/").pop() || `photo_${Date.now()}.jpg`,
          type: a.mimeType || "image/jpeg",
        }));
        setPhotoFiles(prev => [...prev, ...picked]);
      }
    } catch (e) {
      console.warn("pickPhotos error:", e);
      Alert.alert("Error", "Could not open photo gallery.");
    }
  };

  // ── Pick multiple PDFs ────────────────────────────────────────────────────
  const pickDocs = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length) {
        const picked = result.assets.map(a => ({
          uri:  a.uri,
          name: a.name || `document_${Date.now()}.pdf`,
          type: a.mimeType || "application/pdf",
        }));
        setDocFiles(prev => [...prev, ...picked]);
      }
    } catch (e) {
      console.warn("pickDocs error:", e);
      Alert.alert("Error", "Could not open document picker.");
    }
  };

  const removeNewPhoto      = idx => setPhotoFiles(prev => prev.filter((_, i) => i !== idx));
  const removeNewDoc        = idx => setDocFiles(prev => prev.filter((_, i) => i !== idx));
  const removeExistingPhoto = idx => setExistingPhotos(prev => prev.filter((_, i) => i !== idx));
  const removeExistingDoc   = idx => setExistingDocs(prev => prev.filter((_, i) => i !== idx));

  // ── Upload files via fetch (fixes axios multipart boundary bug) ───────────
  const uploadFiles = async (id) => {
    const allFiles = [...photoFiles, ...docFiles];
    if (allFiles.length === 0) return;

    console.log(
      "📤 Uploading",
      allFiles.length,
      "file(s):",
      allFiles.map(f => f.name)
    );

    // Build FormData
    const formData = new FormData();
    allFiles.forEach(file => {
      formData.append("files", {
        uri:  Platform.OS === "android"
                ? file.uri
                : file.uri.replace("file://", ""),
        name: file.name,
        type: file.type,
      });
    });

    // ✅ Use fetch instead of axios — axios corrupts multipart boundary in RN
    const token = await AsyncStorage.getItem("authToken");

    const response = await fetch(
      `${API_BASE_URL}/Fundraise/${id}/attachments`,
      {
        method:  "POST",
        // ⚠️ Do NOT set Content-Type — fetch adds it automatically with boundary
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log("❌ Upload server error:", response.status, errorText);
      throw new Error(`Upload failed (${response.status}): ${errorText}`);
    }

    const result = await response.json().catch(() => ({}));
    console.log("✅ Upload success:", result);
    return result;
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    if (!form.fullName.trim())          return "Full Name is required";
    if (!form.fundTitle.trim())         return "Fund Title is required";
    if (!form.targetAmount)             return "Target Amount is required";
    if (
      form.minimumAmount &&
      Number(form.minimumAmount) > Number(form.targetAmount)
    )                                   return "Minimum Amount cannot exceed Target Amount";
    if (!bank.accountHolderName.trim()) return "Account Holder Name is required";
    return null;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validate();
    if (err) return Alert.alert("Validation", err);

    setSubmitting(true);
    try {
      const payload = {
        fullName:            form.fullName,
        age:                 Number(form.age) || null,
        gender:              form.gender,
        place:               form.place,
        address:             form.address,
        contactNumber:       form.contactNumber,
        relationToCommunity: form.relationToCommunity,
        fundTitle:           form.fundTitle,
        fundCategory:        form.fundCategory,
        description:         form.description,
        targetAmount:        Number(form.targetAmount),
        balanceAmount:       Number(form.balanceAmount || form.targetAmount || 0),
        minimumAmount:       Number(form.minimumAmount || 0),
        collectedAmount:     Number(form.collectedAmount || 0),
        urgencyLevel:        form.urgencyLevel,
        startDate:           form.startDate.toISOString().slice(0, 19),
        endDate:             form.endDate.toISOString().slice(0, 19),
        // existingPhotos/Docs store raw server paths — join directly
        beneficiaryPhotoUrl:   existingPhotos.length ? existingPhotos.join(",") : null,
        supportingDocumentUrl: existingDocs.length   ? existingDocs.join(",")   : null,
        ...bank,
        status:     form.status,
        createdBy:  isEdit ? data.createdBy : "Admin",
        modifiedBy: isEdit ? "Admin" : null,
      };

      let fundId;
      if (isEdit) {
        await fundraiseService.update(data.id, payload);
        fundId = data.id;
      } else {
        const created = await fundraiseService.create(payload);
        fundId = created?.data?.id ?? created?.id ?? created;
      }

      // Upload new files if any
      if (photoFiles.length > 0 || docFiles.length > 0) {
        try {
          await uploadFiles(fundId);
        } catch (uploadErr) {
          console.warn(
            "Upload error:",
            uploadErr?.message ?? uploadErr
          );
          Alert.alert(
            "Partial Success",
            "Fund saved, but some files failed to upload.\nYou can retry from the edit screen."
          );
          setSubmitting(false);
          return;
        }
      }

      Alert.alert("Success", isEdit ? "Fund updated!" : "Fund created!");
      navigation.goBack();
    } catch (ex) {
      console.log("Submit error:", ex?.response?.data ?? ex.message);
      Alert.alert(
        "Error",
        JSON.stringify(ex?.response?.data ?? ex.message)
      );
    } finally {
      setSubmitting(false);
    }
  };

  const urgencyColor = {
    Normal:   C.teal,
    Urgent:   C.amber,
    Critical: C.red,
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={s.root}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Top Bar ── */}


      {/* ══ BASIC INFO ══════════════════════════════════════════════════════ */}
      <View style={s.card}>
        <SectionHeader
          icon="👤"
          title="Beneficiary Info"
          subtitle="Who needs support?"
        />

        <Field label="Full Name" required>
          <TextInput
            style={s.input}
            placeholder="Enter full name"
            value={form.fullName}
            onChangeText={v => set("fullName", v)}
          />
        </Field>

        <View style={s.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Field label="Age">
              <TextInput
                style={s.input}
                placeholder="Years"
                keyboardType="numeric"
                value={form.age}
                onChangeText={v => set("age", v)}
              />
            </Field>
          </View>
          <View style={{ flex: 1.6 }}>
            <Field label="Gender">
              <Dropdown
                label="Select Gender"
                options={["Male", "Female", "Transgender"]}
                value={form.gender}
                onChange={v => set("gender", v)}
              />
            </Field>
          </View>
        </View>

        <Field label="Place">
          <TextInput
            style={s.input}
            placeholder="City / Town"
            value={form.place}
            onChangeText={v => set("place", v)}
          />
        </Field>

        <Field label="Address">
          <TextInput
            style={[s.input, s.multiline]}
            placeholder="Full address"
            multiline
            value={form.address}
            onChangeText={v => set("address", v)}
          />
        </Field>

        <Field label="Contact Number">
          <TextInput
            style={s.input}
            placeholder="+91 XXXXX XXXXX"
            keyboardType="phone-pad"
            value={form.contactNumber}
            onChangeText={v => set("contactNumber", v)}
          />
        </Field>

        <Field label="Relation to Community">
          <TextInput
            style={s.input}
            placeholder="e.g. Resident, Volunteer"
            value={form.relationToCommunity}
            onChangeText={v => set("relationToCommunity", v)}
          />
        </Field>
      </View>

      {/* ══ FUND DETAILS ════════════════════════════════════════════════════ */}
      <View style={s.card}>
        <SectionHeader
          icon="💰"
          title="Fund Details"
          subtitle="Campaign information"
        />

        <Field label="Fund Title" required>
          <TextInput
            style={s.input}
            placeholder="Give your fund a clear title"
            value={form.fundTitle}
            onChangeText={v => set("fundTitle", v)}
          />
        </Field>

        <Field label="Category">
          <Dropdown
            label="Select Category"
            options={[
              "Medical",
              "Education",
              "Natural Disaster",
              "Business Loss",
              "Death / Funeral",
              "Other",
            ]}
            value={form.fundCategory}
            onChange={v => set("fundCategory", v)}
          />
        </Field>

        <Field label="Description">
          <TextInput
            style={[s.input, s.multilineTall]}
            placeholder="Describe the need in detail…"
            multiline
            value={form.description}
            onChangeText={v => set("description", v)}
          />
        </Field>

        <Field label="Target Amount (₹)" required>
          <TextInput
            style={s.input}
            placeholder="0.00"
            keyboardType="numeric"
            value={form.targetAmount}
            onChangeText={v => set("targetAmount", v)}
          />
        </Field>

        <View style={s.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Field label="Balance Amount">
              <View style={s.readOnly}>
                <Text style={s.readOnlyText}>
                  {form.balanceAmount || "—"}
                </Text>
                <Text style={s.autoBadge}>Auto</Text>
              </View>
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Minimum (₹)">
              <TextInput
                style={s.input}
                placeholder="0.00"
                keyboardType="numeric"
                value={form.minimumAmount}
                onChangeText={v => set("minimumAmount", v)}
              />
            </Field>
          </View>
        </View>

        <Field label="Urgency Level">
          <Dropdown
            label="Select Urgency"
            options={["Normal", "Urgent", "Critical"]}
            value={form.urgencyLevel}
            onChange={v => set("urgencyLevel", v)}
          />
        </Field>
      </View>

      {/* ══ DATES ═══════════════════════════════════════════════════════════ */}
      <View style={s.card}>
        <SectionHeader icon="📅" title="Campaign Dates" />
        <View style={s.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Field label="Start Date">
              <TouchableOpacity
                style={s.datePill}
                onPress={() => setShowStart(true)}
              >
                <Text style={s.datePillIcon}>📆</Text>
                <Text style={s.datePillText}>
                  {form.startDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="End Date">
              <TouchableOpacity
                style={s.datePill}
                onPress={() => setShowEnd(true)}
              >
                <Text style={s.datePillIcon}>📆</Text>
                <Text style={s.datePillText}>
                  {form.endDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </Field>
          </View>
        </View>

        {showStart && (
          <DateTimePicker
            value={form.startDate}
            mode="date"
            onChange={(_, d) => {
              setShowStart(false);
              if (d) set("startDate", d);
            }}
          />
        )}
        {showEnd && (
          <DateTimePicker
            value={form.endDate}
            mode="date"
            onChange={(_, d) => {
              setShowEnd(false);
              if (d) set("endDate", d);
            }}
          />
        )}
      </View>

      {/* ══ PHOTOS ══════════════════════════════════════════════════════════ */}
      <View style={s.card}>
        <SectionHeader
          icon="🖼️"
          title="Beneficiary Photos"
          subtitle="JPG / PNG — select multiple"
        />

        <TouchableOpacity style={s.addZone} onPress={pickPhotos}>
          <Text style={s.addZoneIcon}>＋</Text>
          <Text style={s.addZoneText}>Add Photos from Gallery</Text>
          <Text style={s.addZoneSub}>Tap to select one or more images</Text>
        </TouchableOpacity>

        {/* ── Server photos ── */}
        {existingPhotos.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={s.groupLabel}>
              Saved on server ({existingPhotos.length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {existingPhotos.map((path, idx) => (
                <View key={`ep-${idx}`} style={s.thumbWrap}>
                  <AuthImage
                    path={path}
                    style={s.thumb}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={s.thumbRemove}
                    onPress={() => removeExistingPhoto(idx)}
                  >
                    <Text style={s.thumbRemoveText}>✕</Text>
                  </TouchableOpacity>
                  <View style={s.serverBadge}>
                    <Text style={s.serverBadgeText}>Server</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── New local photos ── */}
        {photoFiles.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={s.groupLabel}>
              Ready to upload ({photoFiles.length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {photoFiles.map((f, idx) => (
                <View key={`np-${idx}`} style={s.thumbWrap}>
                  <Image
                    source={{ uri: f.uri }}
                    style={s.thumb}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={s.thumbRemove}
                    onPress={() => removeNewPhoto(idx)}
                  >
                    <Text style={s.thumbRemoveText}>✕</Text>
                  </TouchableOpacity>
                  <View style={[s.serverBadge, { backgroundColor: C.amber }]}>
                    <Text style={s.serverBadgeText}>New</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {existingPhotos.length === 0 && photoFiles.length === 0 && (
          <Text style={s.emptyHint}>No photos added yet</Text>
        )}
      </View>

      {/* ══ DOCUMENTS ═══════════════════════════════════════════════════════ */}
      <View style={s.card}>
        <SectionHeader
          icon="📎"
          title="Supporting Documents"
          subtitle="PDF files — select multiple"
        />

        <TouchableOpacity style={s.addZone} onPress={pickDocs}>
          <Text style={s.addZoneIcon}>＋</Text>
          <Text style={s.addZoneText}>Add PDF Documents</Text>
          <Text style={s.addZoneSub}>Tap to select one or more PDFs</Text>
        </TouchableOpacity>

        {/* ── Server docs ── */}
        {existingDocs.map((path, idx) => (
          <View key={`ed-${idx}`} style={s.docRow}>
            <View style={s.docIconWrap}>
              <Text style={{ fontSize: 18 }}>📄</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.docName} numberOfLines={1}>
                {path.split("/").pop()}
              </Text>
              <Text style={[s.docSub, { color: C.teal }]}>
                Saved on server
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => removeExistingDoc(idx)}
              style={{ padding: 6 }}
            >
              <Text style={{ color: C.red, fontSize: 18, fontWeight: "700" }}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* ── New local docs ── */}
        {docFiles.map((f, idx) => (
          <View
            key={`nd-${idx}`}
            style={[s.docRow, { borderColor: C.amber + "99" }]}
          >
            <View
              style={[s.docIconWrap, { backgroundColor: C.amber + "22" }]}
            >
              <Text style={{ fontSize: 18 }}>📄</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.docName} numberOfLines={1}>
                {f.name}
              </Text>
              <Text style={[s.docSub, { color: C.amber }]}>
                Ready to upload
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => removeNewDoc(idx)}
              style={{ padding: 6 }}
            >
              <Text style={{ color: C.red, fontSize: 18, fontWeight: "700" }}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {existingDocs.length === 0 && docFiles.length === 0 && (
          <Text style={s.emptyHint}>No documents added yet</Text>
        )}
      </View>

      {/* ══ BANK DETAILS ════════════════════════════════════════════════════ */}
      <View style={s.card}>
        <SectionHeader
          icon="🏦"
          title="Bank Details"
          subtitle="For fund transfer"
        />

        <Field label="Account Holder Name" required>
          <TextInput
            style={s.input}
            placeholder="Name as per bank"
            value={bank.accountHolderName}
            onChangeText={v => setBank(p => ({ ...p, accountHolderName: v }))}
          />
        </Field>

        <Field label="Account Number">
          <TextInput
            style={s.input}
            placeholder="Enter account number"
            keyboardType="numeric"
            value={bank.bankAccountNumber}
            onChangeText={v => setBank(p => ({ ...p, bankAccountNumber: v }))}
          />
        </Field>

        <View style={s.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Field label="IFSC Code">
              <TextInput
                style={s.input}
                placeholder="SBIN0001234"
                autoCapitalize="characters"
                value={bank.ifscCode}
                onChangeText={v => setBank(p => ({ ...p, ifscCode: v }))}
              />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="UPI ID">
              <TextInput
                style={s.input}
                placeholder="name@upi"
                value={bank.upiId}
                onChangeText={v => setBank(p => ({ ...p, upiId: v }))}
              />
            </Field>
          </View>
        </View>
      </View>

      {/* ══ SUBMIT ══════════════════════════════════════════════════════════ */}
      <View style={s.submitWrap}>
        {(photoFiles.length > 0 || docFiles.length > 0) && (
          <View style={s.uploadSummary}>
            <Text style={s.uploadSummaryText}>
              📤 {photoFiles.length} photo(s) + {docFiles.length} document(s) will upload on save
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[s.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.submitText}>
              {isEdit ? "Update Fund" : "Create Fund"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Top bar
  topBar: {
    backgroundColor:  C.navy,
    paddingTop:       Platform.OS === "ios" ? 56 : 36,
    paddingBottom:    20,
    paddingHorizontal: 16,
    flexDirection:    "row",
    alignItems:       "center",
    gap:              12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  backArrow:       { color: "#fff", fontSize: 20 },
  topTitle:        { color: "#fff", fontSize: 20, fontWeight: "700" },
  topSub:          { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  urgencyPill:     { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  urgencyPillText: { fontSize: 11, fontWeight: "700" },

  // Card
  card: {
    backgroundColor:  C.card,
    marginHorizontal: 14,
    marginTop:        14,
    borderRadius:     16,
    padding:          16,
    shadowColor:      "#000",
    shadowOpacity:    0.06,
    shadowRadius:     8,
    shadowOffset:     { width: 0, height: 2 },
    elevation:        3,
  },

  // Section header
  sectionHeader:   { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 10 },
  sectionIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.tealLight,
    alignItems: "center", justifyContent: "center",
  },
  sectionIcon:  { fontSize: 18 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: C.navy },
  sectionSub:   { fontSize: 11, color: C.muted, marginTop: 1 },

  // Field
  field:      { marginBottom: 12 },
  fieldLabel: {
    fontSize: 12, fontWeight: "600", color: C.sub,
    marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4,
  },

  // Input
  input: {
    borderWidth:      1.5,
    borderColor:      C.border,
    borderRadius:     10,
    paddingHorizontal: 13,
    paddingVertical:  Platform.OS === "ios" ? 12 : 10,
    fontSize:         15,
    color:            C.text,
    backgroundColor:  "#FAFBFD",
  },
  multiline:     { height: 70,  textAlignVertical: "top", paddingTop: 10 },
  multilineTall: { height: 90,  textAlignVertical: "top", paddingTop: 10 },

  // Row
  row: { flexDirection: "row" },

  // Read-only
  readOnly: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    backgroundColor: "#F0F4FA",
  },
  readOnlyText: { flex: 1, fontSize: 15, color: "#444", fontWeight: "600" },
  autoBadge:    {
    fontSize: 10, color: C.teal, fontWeight: "700",
    backgroundColor: C.tealLight,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
  },

  // Date
  datePill: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    padding: 11, backgroundColor: "#FAFBFD",
  },
  datePillIcon: { fontSize: 15, marginRight: 7 },
  datePillText: { fontSize: 14, color: C.text },

  // Upload zone
  addZone: {
    borderWidth: 1.5, borderColor: C.teal, borderStyle: "dashed",
    borderRadius: 12, padding: 18, alignItems: "center",
    backgroundColor: C.tealLight, marginBottom: 4,
  },
  addZoneIcon: { fontSize: 28, color: C.teal },
  addZoneText: { fontSize: 14, fontWeight: "600", color: C.teal, marginTop: 4 },
  addZoneSub:  { fontSize: 11, color: C.muted, marginTop: 2 },

  // Group label
  groupLabel: {
    fontSize: 11, fontWeight: "700", color: C.muted,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8,
  },

  // Thumbnails
  thumbWrap: { marginRight: 10, position: "relative", marginBottom: 4 },
  thumb:     {
    width: 90, height: 90, borderRadius: 10, backgroundColor: C.border,
  },
  thumbRemove: {
    position: "absolute", top: 4, right: 4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.red, alignItems: "center", justifyContent: "center",
  },
  thumbRemoveText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  serverBadge: {
    position: "absolute", bottom: 4, left: 4,
    backgroundColor: C.teal, borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  serverBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },

  // Doc rows
  docRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    padding: 12, marginTop: 8, backgroundColor: "#FAFBFD",
  },
  docIconWrap: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: C.tealLight,
    alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  docName: { fontSize: 13, fontWeight: "600", color: C.text },
  docSub:  { fontSize: 11, color: C.muted, marginTop: 2 },

  // Empty
  emptyHint: {
    textAlign: "center", color: C.muted, fontSize: 13, paddingVertical: 12,
  },

  // Dropdown
  dropTrigger: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    backgroundColor: "#FAFBFD",
  },
  dropValue:           { fontSize: 15, color: C.text },
  dropPlaceholder:     { fontSize: 15, color: C.muted },
  dropArrow:           { fontSize: 12, color: C.muted },
  backdrop: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: "65%",
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.border, alignSelf: "center", marginBottom: 14,
  },
  sheetTitle:          { fontSize: 16, fontWeight: "700", color: C.navy, marginBottom: 12 },
  searchBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F4F6FA", borderRadius: 10,
    paddingHorizontal: 12, marginBottom: 10, gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: C.text },
  sheetItem: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 13, borderBottomWidth: 1, borderColor: "#F0F2F7",
  },
  sheetItemActive:     {
    backgroundColor: C.tealLight, borderRadius: 8, paddingHorizontal: 8,
  },
  sheetItemText:       { fontSize: 15, color: "#333" },
  sheetItemTextActive: { color: C.teal, fontWeight: "600" },

  // Submit
  submitWrap:        { marginHorizontal: 14, marginTop: 14 },
  uploadSummary: {
    backgroundColor: C.amber + "22", borderRadius: 10,
    padding: 10, marginBottom: 10, alignItems: "center",
  },
  uploadSummaryText: { color: C.amber, fontSize: 12, fontWeight: "600" },
  submitBtn: {
    backgroundColor: C.navy, borderRadius: 14, padding: 17, alignItems: "center",
    shadowColor: C.navy, shadowOpacity: 0.35, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
});