import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, Modal, FlatList, Image, Platform, ActivityIndicator, StatusBar, useWindowDimensions } from 'react-native';import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { fundraiseService } from "../services/fundraiseService";
import { CreateFundScreenS as s } from './screenStyles';
import * as FileSystem from "expo-file-system/legacy";
import DOBField from '../components/DOBField';

// ─── API Base ─────────────────────────────────────────────────────────────────
//const API_BASE_URL = "http://10.0.2.2:51150/api";
const API_BASE_URL = 'https://imei.co.in/api';

// Static file host (same host as API, but WITHOUT the /api segment) — used to
// build direct image URLs. Fixed: previously this still had "/api" in it,
// which produced broken image URLs like ".../api/Uploads/...".
//const STATIC_BASE_URL = "http://10.0.2.2:51150";
const STATIC_BASE_URL = "https://imei.co.in";
//const API_BASE_URL_PROD = "https://prasath-001-site1.ftempurl.com/api";

/**
 * Parse comma-separated DB string into raw path array.
 * Keeps original paths exactly as stored (e.g. "\\Uploads\\Fundraise-5\\abc.png").
 */
const parseServerPaths = (raw) => {
  if (!raw) return [];
  return raw.split(",").map(p => p.trim()).filter(Boolean);
};

/** "\\Uploads\\Fundraise-5\\abc.png" → "Uploads/Fundraise-5/abc.png" for the API ?path= param */
const toApiPath = (storedPath) => {
  if (!storedPath) return "";
  const normalized = storedPath.replace(/\\/g, "/");
  const idx = normalized.search(/uploads\//i);
  return idx === -1 ? normalized.replace(/^\/+/, "") : normalized.substring(idx);
};

/**
 * Builds a direct, unauthenticated image URL from a stored server path.
 * Handles paths in ANY of these shapes (server has been inconsistent):
 *   "Fundraise-5\\abc.png"
 *   "\\Uploads\\Fundraise-5\\abc.png"
 *   "C:\\inetpub\\wwwroot\\Uploads\\Fundraise-5\\abc.png"
 * by locating "Uploads/" (or "Uploads\") anywhere in the string and slicing
 * from there — same approach as the working toPublicUrl() in
 * FundraiseViewScreen / MagazineFormScreen.
 *   → "https://imei.co.in/Uploads/Fundraise-5/abc.png"
 */
const buildPhotoUrl = (photoPath) => {
  if (!photoPath) return null;
  if (photoPath.startsWith("http")) return photoPath;

  const normalized = photoPath.replace(/\\/g, "/");
  const uploadsIdx = normalized.toLowerCase().indexOf("uploads/");

  const relative = uploadsIdx === -1
    ? `Uploads/${normalized.replace(/^\/+/, "")}`
    : normalized.substring(uploadsIdx);

  return `${STATIC_BASE_URL}/${relative}`;
};

// For displaying just the filename in lists (doc rows, alt text, etc.)
const getDisplayName = (path) => {
  if (!path) return "";
  return path.replace(/\\/g, "/").split("/").pop();
};
// Attachment size cap — 50 MB per file.
const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_PHOTOS = 5;
const MAX_DOCS = 5;

const formatMB = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

// Resolve a picked asset's size in bytes, whichever field the picker
// happened to populate — fall back to the filesystem if neither is present.
const getAssetSize = async (asset) => {
  if (typeof asset.size === "number") return asset.size;
  if (typeof asset.fileSize === "number") return asset.fileSize;
  try {
    const info = await FileSystem.getInfoAsync(asset.uri, { size: true });
    if (info?.exists && typeof info.size === "number") return info.size;
  } catch (e) {
    console.warn("Could not determine file size for", asset?.uri, e);
  }
  return null; // unknown — let it through rather than block a valid pick
};

// Splits picked assets into { accepted, rejected }, checking each one's
// real size against MAX_ATTACHMENT_BYTES.
const partitionBySize = async (assets) => {
  const accepted = [];
  const rejected = [];
  for (const asset of assets) {
    const size = await getAssetSize(asset);
    if (size != null && size > MAX_ATTACHMENT_BYTES) {
      rejected.push({ name: asset.fileName || asset.name || "file", size });
    } else {
      accepted.push(asset);
    }
  }
  return { accepted, rejected };
};

const warnIfRejected = (rejected) => {
  if (rejected.length === 0) return;
  const list = rejected.map((r) => `• ${r.name} (${formatMB(r.size)})`).join("\n");
  Alert.alert(
    "File too large",
    `The following file${rejected.length > 1 ? "s" : ""} exceed${rejected.length > 1 ? "" : "s"} the 50 MB limit and ${rejected.length > 1 ? "were" : "was"} not added:\n\n${list}`
  );
};
// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#F7F8FC",
  card: COLORS.white,
  navy: "#1A2E4A",
  teal: "#0D8A6E",
  tealLight: "#E6F5F1",
  amber: COLORS.accent,
  red: "#E53E3E",
  border: "#E2E8F0",
  muted: COLORS.placeholder,
  text: COLORS.dark,
  sub: "#64748B",
};

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function Dropdown({ label, options, value, onChange }) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");
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
function Field({ label, required, children, error }) {
  // Match AddAdminScreen: no wrapping box — the red border/tint goes directly
  // on the input itself (like styledInput.errored), error text sits below.
  const styledChild =
    error && React.isValidElement(children)
      ? React.cloneElement(children, {
        style: [
          children.props.style,
          { borderWidth: 1.5, borderColor: "#EF4444", backgroundColor: "#FFF5F5" },
        ],
      })
      : children;

  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>
        {label}
        {required ? <Text style={{ color: C.red }}> *</Text> : null}
      </Text>
      {styledChild}
      {error ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 5,
          }}
        >
          <Text style={{ color: "#EF4444", fontSize: 12, fontWeight: "500" }}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── StyledInput — thin wrapper so DOBField can drive it (hasError, style) ───
function StyledInput({ hasError, style, ...props }) {
  return (
    <TextInput
      style={[
        s.input,
        hasError && { borderWidth: 1.5, borderColor: "#EF4444", backgroundColor: "#FFF5F5" },
        style,
      ]}
      placeholderTextColor={C.muted}
      {...props}
    />
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CreateFundScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { data } = route.params || {};
  const isEdit = !!data;
  const { width: screenWidth } = useWindowDimensions();
  const isLargeScreen = screenWidth >= 600; // tablet / web breakpoint
  // ── Local new files (not yet uploaded) ───────────────────────────────────
  const [photoFiles, setPhotoFiles] = useState([]); // [{ uri, name, type }]
  const [docFiles, setDocFiles] = useState([]); // [{ uri, name, type }]

  // ── Existing server paths (parsed from comma-separated DB string) ─────────
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [existingDocs, setExistingDocs] = useState([]);

  // ── Form ──────────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    fullName: "",
    age: "",
    gender: "",
    place: "",
    address: "",
    contactNumber: "",
    relationToCommunity: "",
    fundTitle: "",
    fundCategory: "",
    description: "",
    targetAmount: "",
    balanceAmount: "",
    minimumAmount: "",
    collectedAmount: "0",
    urgencyLevel: "",
    startDate: new Date(),
    endDate: new Date(),
    status: "Active",
  });

  const [bank, setBank] = useState({
    accountHolderName: "",
    bankAccountNumber: "",
    ifscCode: "",
    upiId: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Campaign date bounds — open range; DOBField just needs a min/max.
  const today = new Date();
  const campaignMinDate = new Date(today.getFullYear() - 100, 0, 1);
  const campaignMaxDate =  new Date(today.getFullYear() + 80, 11, 31);

  // ── Populate on edit ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isEdit || !data) return;
    setForm({
      fullName: data.fullName || "",
      age: data.age?.toString() || "",
      gender: data.gender || "",
      place: data.place || "",
      address: data.address || "",
      contactNumber: data.contactNumber || "",
      relationToCommunity: data.relationToCommunity || "",
      fundTitle: data.fundTitle || "",
      fundCategory: data.fundCategory || "",
      description: data.description || "",
      targetAmount: data.targetAmount?.toString() || "",
      balanceAmount: data.targetAmount?.toString() || "",
      minimumAmount: data.minimumAmount?.toString() || "",
      collectedAmount: data.collectedAmount?.toString() || "0",
      urgencyLevel: data.urgencyLevel || "",
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: data.status || "Active",
    });
    setBank({
      accountHolderName: data.accountHolderName || "",
      bankAccountNumber: data.bankAccountNumber || "",
      ifscCode: data.ifscCode || "",
      upiId: data.upiId || "",
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
  const set = (key, value) => {
    setForm(prev => {
      const u = { ...prev, [key]: value };
      if (key === "targetAmount") u.balanceAmount = value;
      return u;
    });
    setErrors(prev => (prev[key] ? { ...prev, [key]: null } : prev));
  };

  // ── Pick multiple photos ──────────────────────────────────────────────────
  const pickPhotos = async () => {
  try {
    const totalUsed = existingPhotos.length + photoFiles.length;
    const slotsLeft = MAX_PHOTOS - totalUsed;
    if (slotsLeft <= 0) {
      Alert.alert("Limit reached", `Max ${MAX_PHOTOS} photos per fund.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Gallery access is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: slotsLeft,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.length) {
      const { accepted, rejected } = await partitionBySize(result.assets);
      warnIfRejected(rejected);

      const picked = accepted.slice(0, slotsLeft).map((a) => ({
        uri: a.uri,
        name: a.fileName || a.uri.split("/").pop() || `photo_${Date.now()}.jpg`,
        type: a.mimeType || "image/jpeg",
      }));
      setPhotoFiles((prev) => [...prev, ...picked]);

      if (accepted.length > slotsLeft) {
        Alert.alert("Limit applied", `Only ${slotsLeft} photo(s) added. Max ${MAX_PHOTOS} total.`);
      }
    }
  } catch (e) {
    console.warn("pickPhotos error:", e);
    Alert.alert("Error", "Could not open photo gallery.");
  }
};

  // ── Pick multiple PDFs ────────────────────────────────────────────────────
  const pickDocs = async () => {
  try {
    const totalUsed = existingDocs.length + docFiles.length;
    const slotsLeft = MAX_DOCS - totalUsed;
    if (slotsLeft <= 0) {
      Alert.alert("Limit reached", `Max ${MAX_DOCS} documents per fund.`);
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.length) {
      const { accepted, rejected } = await partitionBySize(result.assets);
      warnIfRejected(rejected);

      const picked = accepted.slice(0, slotsLeft).map((a) => ({
        uri: a.uri,
        name: a.name || `document_${Date.now()}.pdf`,
        type: a.mimeType || "application/pdf",
      }));
      setDocFiles((prev) => [...prev, ...picked]);

      if (accepted.length > slotsLeft) {
        Alert.alert("Limit applied", `Only ${slotsLeft} document(s) added. Max ${MAX_DOCS} total.`);
      }
    }
  } catch (e) {
    console.warn("pickDocs error:", e);
    Alert.alert("Error", "Could not open document picker.");
  }
};

  const removeNewPhoto = idx => setPhotoFiles(prev => prev.filter((_, i) => i !== idx));
  const removeNewDoc = idx => setDocFiles(prev => prev.filter((_, i) => i !== idx));
  const removeExistingPhoto = (idx) => {
    const path = existingPhotos[idx];

    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this photo?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fundraiseService.deleteFile(
                data.id,
                path
              );

              if (!response?.success) {
                Alert.alert(
                  "Error",
                  response?.message || "Failed to delete photo."
                );
                return;
              }

              setExistingPhotos((prev) =>
                prev.filter((_, index) => index !== idx)
              );

              Alert.alert("Success", "Photo deleted successfully.");
            } catch (error) {
              console.log(
                "Delete photo error:",
                error?.response?.data || error?.message
              );

              Alert.alert(
                "Error",
                error?.response?.data?.message ||
                  "Failed to delete photo."
              );
            }
          },
        },
      ]
    );
  };


  const removeExistingDoc = (idx) => {
    const path = existingDocs[idx];

    Alert.alert(
      "Delete Document",
      "Are you sure you want to delete this document?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fundraiseService.deleteFile(
                data.id,
                path
              );

              if (!response?.success) {
                Alert.alert(
                  "Error",
                  response?.message || "Failed to delete document."
                );
                return;
              }

              setExistingDocs((prev) =>
                prev.filter((_, index) => index !== idx)
              );

              Alert.alert("Success", "Document deleted successfully.");
            } catch (error) {
              console.log(
                "Delete document error:",
                error?.response?.data || error?.message
              );

              Alert.alert(
                "Error",
                error?.response?.data?.message ||
                  "Failed to delete document."
              );
            }
          },
        },
      ]
    );
  };

  // ── Upload files via fetch (fixes axios multipart boundary bug) ───────────
  // ✅ FIX: now RETURNS the parsed server response (previously discarded).
  // The response contains the FINAL, server-authoritative comma-joined
  // Photos/Documents lists (existing + newly uploaded), which is the only
  // reliable source of truth right after an upload — existingPhotos/
  // existingDocs in local state were captured BEFORE this upload ran, so
  // they never include the file(s) just picked in this session.
  const uploadFiles = async (id) => {
    const allFiles = [...photoFiles, ...docFiles];
    if (allFiles.length === 0) return null;

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
        uri: Platform.OS === "android"
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
        method: "POST",
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
    return result; // ✅ now returned to the caller
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full Name is required";
    if (!form.fundTitle.trim()) e.fundTitle = "Fund Title is required";
    if (!form.targetAmount) e.targetAmount = "Target Amount is required";
    if (
      form.minimumAmount &&
      Number(form.minimumAmount) > Number(form.targetAmount)
    ) e.minimumAmount = "Minimum Amount cannot exceed Target Amount";
    if (!bank.accountHolderName.trim()) e.accountHolderName = "Account Holder Name is required";
    return e;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validate();
    setErrors(err);
    if (Object.keys(err).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        fullName: form.fullName,
        age: Number(form.age) || null,
        gender: form.gender,
        place: form.place,
        address: form.address,
        contactNumber: form.contactNumber,
        relationToCommunity: form.relationToCommunity,
        fundTitle: form.fundTitle,
        fundCategory: form.fundCategory,
        description: form.description,
        targetAmount: Number(form.targetAmount),
        balanceAmount: Number(form.balanceAmount || form.targetAmount || 0),
        minimumAmount: Number(form.minimumAmount || 0),
        collectedAmount: Number(form.collectedAmount || 0),
        urgencyLevel: form.urgencyLevel,
        startDate: form.startDate.toISOString().slice(0, 19),
        endDate: form.endDate.toISOString().slice(0, 19),
        // existingPhotos/Docs store raw server paths — join directly.
        // NOTE: these reflect only what was already saved BEFORE this submit
        // (i.e. after any deletions above), and do NOT yet include files
        // picked in photoFiles/docFiles — those get merged in below from the
        // upload response once the upload completes.
        beneficiaryPhotoUrl: existingPhotos.length ? existingPhotos.join(",") : null,
        supportingDocumentUrl: existingDocs.length ? existingDocs.join(",") : null,
        ...bank,
        status: form.status,
        createdBy: isEdit ? data.createdBy : "Admin",
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
      let uploadResult = null;
      if (photoFiles.length > 0 || docFiles.length > 0) {
        try {
          uploadResult = await uploadFiles(fundId);
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

      // ✅ FIX: pull the server's authoritative, fully-merged file lists out
      // of the upload response (existing + newly uploaded) instead of
      // trusting the pre-upload `payload` values, which never include files
      // picked in this session. Handles both camelCase (ASP.NET Core's
      // default JSON casing) and PascalCase (the raw anonymous object shape
      // from FundraiseController.UploadFiles) just in case.
      const finalPhotos =
        uploadResult?.data?.photos ?? uploadResult?.data?.Photos ?? null;
      const finalDocs =
        uploadResult?.data?.documents ?? uploadResult?.data?.Documents ?? null;

      const finalPhotoUrl = finalPhotos?.length
        ? finalPhotos.join(",")
        : payload.beneficiaryPhotoUrl;
      const finalDocUrl = finalDocs?.length
        ? finalDocs.join(",")
        : payload.supportingDocumentUrl;

      const updatedItem = isEdit
        ? {
            ...data,
            ...payload,
            id: fundId,
            beneficiaryPhotoUrl: finalPhotoUrl,
            supportingDocumentUrl: finalDocUrl,
          }
        : {
            ...payload,
            id: fundId,
            beneficiaryPhotoUrl: finalPhotoUrl,
            supportingDocumentUrl: finalDocUrl,
          };

      Alert.alert("Success", isEdit ? "Fund updated!" : "Fund created!");
      navigation.navigate('FundraiseList', { changedItem: updatedItem, isEdit });
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
    Normal: C.teal,
    Urgent: C.amber,
    Critical: C.red,
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      {/* ── Top Navbar ── */}
      <GradientHeader style={s.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.navSide}>
          <Text style={s.navCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={s.navTitle}>{isEdit ? 'Edit Fund' : 'Create Fund'}</Text>
        <TouchableOpacity onPress={handleSubmit} style={s.navSide} disabled={submitting}>
          {submitting
            ? <ActivityIndicator size="small" color={COLORS.accent} />
            : <Text style={s.navSave}>{isEdit ? 'Update' : 'Save'}</Text>}
        </TouchableOpacity>
      </GradientHeader>

      <ScrollView
        style={s.root}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ══ BASIC INFO ══════════════════════════════════════════════════════ */}
        <View style={s.card}>
          <SectionHeader
            icon="👤"
            title="Beneficiary Info"
            subtitle="Who needs support?"
          />

          <Field label="Full Name" required error={errors.fullName}>
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

          <Field label="Fund Title" required error={errors.fundTitle}>
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

          <Field label="Target Amount (₹)" required error={errors.targetAmount}>
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
              <Field label="Minimum (₹)" error={errors.minimumAmount}>
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
       {/* ══ DATES ═══════════════════════════════════════════════════════════ */}
<View style={s.card}>
  <SectionHeader icon="📅" title="Campaign Dates" />
  <View style={{ flexDirection: isLargeScreen ? 'row' : 'column' }}>
    <View style={isLargeScreen ? { flex: 1, marginRight: 8 } : { marginBottom: 4 }}>
      <DOBField
        label="Start Date"
        value={form.startDate}
        minDate={campaignMinDate}
        maxDate={campaignMaxDate}
        FieldComponent={Field}
        InputComponent={StyledInput}
        onChange={(d) => set("startDate", d)}
      />
    </View>
    <View style={isLargeScreen ? { flex: 1 } : undefined}>
      <DOBField
        label="End Date"
        value={form.endDate}
        minDate={campaignMinDate}
        maxDate={campaignMaxDate}
        FieldComponent={Field}
        InputComponent={StyledInput}
        onChange={(d) => set("endDate", d)}
      />
    </View>
  </View>
</View>

        {/* ══ PHOTOS ══════════════════════════════════════════════════════════ */}
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

          {/* ── All photos in ONE row: server photos first, then new local ones ── */}
          {(existingPhotos.length > 0 || photoFiles.length > 0) && (
            <View style={{ marginTop: 12 }}>
              <Text style={s.groupLabel}>
                {existingPhotos.length + photoFiles.length} photo(s) total
                {photoFiles.length > 0 ? ` · ${photoFiles.length} ready to upload` : ''}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {existingPhotos.map((path, idx) => (
                  <View key={`ep-${idx}`} style={s.thumbWrap}>
                    <Image
                      source={{ uri: buildPhotoUrl(path) }}
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
                  {getDisplayName(path)}
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

          <Field label="Account Holder Name" required error={errors.accountHolderName}>
            <TextInput
              style={s.input}
              placeholder="Name as per bank"
              value={bank.accountHolderName}
              onChangeText={v => { setBank(p => ({ ...p, accountHolderName: v })); setErrors(p => (p.accountHolderName ? { ...p, accountHolderName: null } : p)); }}
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

        {(photoFiles.length > 0 || docFiles.length > 0) && (
          <View style={s.uploadSummary}>
            <Text style={s.uploadSummaryText}>
              📤 {photoFiles.length} photo(s) + {docFiles.length} document(s) will upload on save
            </Text>
          </View>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}