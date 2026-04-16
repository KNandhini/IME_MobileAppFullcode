import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, ScrollView,
  StyleSheet, TouchableOpacity, Alert, Modal,
  FlatList, Image, Platform, ActivityIndicator
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { fundraiseService } from "../services/fundraiseService";

// ─── Reusable Dropdown ───────────────────────────────────────────────────────
function Dropdown({ label, options, value, onChange }) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={dd.wrapper}>
      <TouchableOpacity style={dd.trigger} onPress={() => setVisible(true)}>
        <Text style={value ? dd.triggerText : dd.placeholder}>
          {value || label}
        </Text>
        <Text style={dd.arrow}>▾</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={dd.backdrop}
          activeOpacity={1}
          onPress={() => { setVisible(false); setSearch(""); }}
        />
        <View style={dd.sheet}>
          <Text style={dd.sheetTitle}>{label}</Text>

          <View style={dd.searchRow}>
            <Text style={dd.searchIcon}>🔍</Text>
            <TextInput
              style={dd.searchInput}
              placeholder="Search..."
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[dd.option, item === value && dd.optionActive]}
                onPress={() => {
                  onChange(item);
                  setVisible(false);
                  setSearch("");
                }}
              >
                <Text style={[dd.optionText, item === value && dd.optionTextActive]}>
                  {item}
                </Text>
                {item === value && <Text style={dd.check}>✓</Text>}
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={dd.empty}>No results found</Text>}
          />
        </View>
      </Modal>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function CreateFundScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { data } = route.params || {};
  const isEdit = !!data;

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

    // URL strings returned from API after upload
    supportingDocumentUrl: "",
    beneficiaryPhotoUrl: "",

    // Local file objects (pre-upload)
    supportingDocumentFile: null,  // { name, uri, mimeType }
    beneficiaryPhotoFile: null,    // { uri, name, mimeType }
  });

  const [showStart, setShowStart]       = useState(false);
  const [showEnd, setShowEnd]           = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Bank details
  const [bank, setBank] = useState({
    accountHolderName: "",
    bankAccountNumber: "",
    ifscCode: "",
    upiId: "",
  });

  useEffect(() => {
    if (isEdit) {
      setForm({
        ...data,
        age: data.age?.toString(),
        targetAmount: data.targetAmount?.toString(),
        balanceAmount: data.targetAmount?.toString(),
        minimumAmount: data.minimumAmount?.toString() || "",
        collectedAmount: data.collectedAmount?.toString(),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        supportingDocumentFile: null,
        beneficiaryPhotoFile: null,
        supportingDocumentUrl: data.supportingDocumentUrl || "",
        beneficiaryPhotoUrl: data.beneficiaryPhotoUrl || "",
      });
      setBank({
        accountHolderName: data.accountHolderName || "",
        bankAccountNumber: data.bankAccountNumber || "",
        ifscCode: data.ifscCode || "",
        upiId: data.upiId || "",
      });
    }
  }, []);

  const handleChange = (key, value) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === "targetAmount") updated.balanceAmount = value;
      return updated;
    });
  };

  const handleBankChange = (key, value) =>
    setBank((prev) => ({ ...prev, [key]: value }));

  // ─── File Pickers ────────────────────────────────────────────────────────

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        handleChange("supportingDocumentFile", {
          uri: asset.uri,
          name: asset.name || "document",
          mimeType: asset.mimeType || "application/octet-stream",
        });
        // Clear any previously stored URL so the UI reflects the new local file
        handleChange("supportingDocumentUrl", "");
      }
    } catch {
      Alert.alert("Error", "Could not pick document");
    }
  };

  const pickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Gallery access is required.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        const name = asset.uri.split("/").pop() || "photo.jpg";
        handleChange("beneficiaryPhotoFile", {
          uri: asset.uri,
          name,
          mimeType: asset.mimeType || "image/jpeg",
        });
        handleChange("beneficiaryPhotoUrl", "");
      }
    } catch {
      Alert.alert("Error", "Could not pick photo");
    }
  };

  // ─── Upload attachments to API after fund is created/updated ─────────────

  /**
   * Uploads any pending local files to POST /api/Fundraise/{id}/attachments
   * and returns { docUrl, photoUrl } with whatever the API gives back.
   */
  const uploadPendingAttachments = async (fundId) => {
    const filesToUpload = [];

    if (form.supportingDocumentFile) {
      filesToUpload.push({
        ...form.supportingDocumentFile,
        fieldTag: "document", // used to identify which slot the file belongs to
      });
    }
    if (form.beneficiaryPhotoFile) {
      filesToUpload.push({
        ...form.beneficiaryPhotoFile,
        fieldTag: "photo",
      });
    }

    if (filesToUpload.length === 0) return null;

    const uploadResult = await fundraiseService.uploadAttachments(fundId, filesToUpload);
    return uploadResult; // adjust parsing below to your API's response shape
  };

  // ─── Validation ──────────────────────────────────────────────────────────

  const validate = () => {
    if (!form.fullName.trim())             return "Full Name is required";
    if (!form.fundTitle.trim())            return "Fund Title is required";
    if (!form.targetAmount)                return "Target Amount is required";
    if (
      form.minimumAmount &&
      Number(form.minimumAmount) > Number(form.targetAmount)
    )                                      return "Minimum Amount cannot exceed Target Amount";
    if (!bank.accountHolderName.trim())    return "Account Holder is required";
    return null;
  };

  // ─── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const error = validate();
    if (error) return Alert.alert("Validation Error", error);

    setSubmitting(true);
    try {
      const payload = {
        // Beneficiary
        fullName: form.fullName,
        age: Number(form.age),
        gender: form.gender,
        place: form.place,
        address: form.address,
        contactNumber: form.contactNumber,
        relationToCommunity: form.relationToCommunity,

        // Fund
        fundTitle: form.fundTitle,
        fundCategory: form.fundCategory,
        description: form.description,
        targetAmount: Number(form.targetAmount),
        balanceAmount: Number(form.balanceAmount || form.targetAmount || 0),
        minimumAmount: Number(form.minimumAmount || 0),
        collectedAmount: Number(form.collectedAmount || 0),
        urgencyLevel: form.urgencyLevel,

        // Dates
        startDate: form.startDate.toISOString().slice(0, 19),
        endDate: form.endDate.toISOString().slice(0, 19),

        // Document URLs (may be updated after upload below)
        supportingDocumentUrl: form.supportingDocumentUrl,
        beneficiaryPhotoUrl: form.beneficiaryPhotoUrl,

        // Bank
        ...bank,

        // Meta
        status: "Active",
        createdBy: isEdit ? data.createdBy : "Admin",
        modifiedBy: isEdit ? "Admin" : null,
      };

      let fundId;

      if (isEdit) {
        await fundraiseService.update(data.id, payload);
        fundId = data.id;
      } else {
        const created = await fundraiseService.create(payload);
        // Adjust to your API's response shape — common patterns:
        // created.id | created.data.id | created.data
        fundId = created?.id ?? created?.data?.id ?? created;
      }

      // ── Upload any pending local files ──────────────────────────────────
      if (form.supportingDocumentFile || form.beneficiaryPhotoFile) {
        try {
          await uploadPendingAttachments(fundId);
        } catch (uploadErr) {
          // Non-fatal: fund was saved, just warn about the file upload
          console.warn("Attachment upload failed:", uploadErr);
          Alert.alert(
            "Warning",
            "Fund saved, but file upload failed. You can re-upload from the edit screen."
          );
        }
      }

      Alert.alert("Success", isEdit ? "Fund updated successfully" : "Fund created successfully");
      navigation.goBack();
    } catch (err) {
      console.log(err.response?.data);
      Alert.alert("Error", JSON.stringify(err.response?.data ?? err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>
          {isEdit ? "Edit Fund" : "Create Fund"}
        </Text>
      </View>

      {/* ══ BASIC INFO ══════════════════════════════════════════════════════ */}
      <View style={s.card}>
        <Text style={s.section}>👤  Basic Info</Text>

        <Text style={s.label}>Full Name *</Text>
        <TextInput
          placeholder="Enter full name"
          style={s.input}
          value={form.fullName}
          onChangeText={(v) => handleChange("fullName", v)}
        />

        <Text style={s.label}>Age</Text>
        <TextInput
          placeholder="Enter age"
          style={s.input}
          keyboardType="numeric"
          value={form.age}
          onChangeText={(v) => handleChange("age", v)}
        />

        <Text style={s.label}>Gender</Text>
        <Dropdown
          label="Select Gender"
          options={["Male", "Female", "Transgender"]}
          value={form.gender}
          onChange={(v) => handleChange("gender", v)}
        />

        <Text style={s.label}>Place</Text>
        <TextInput
          placeholder="City / Town"
          style={s.input}
          value={form.place}
          onChangeText={(v) => handleChange("place", v)}
        />

        <Text style={s.label}>Address</Text>
        <TextInput
          placeholder="Full address"
          style={[s.input, { height: 70, textAlignVertical: "top" }]}
          multiline
          value={form.address}
          onChangeText={(v) => handleChange("address", v)}
        />

        <Text style={s.label}>Contact Number</Text>
        <TextInput
          placeholder="+91 XXXXX XXXXX"
          style={s.input}
          keyboardType="phone-pad"
          value={form.contactNumber}
          onChangeText={(v) => handleChange("contactNumber", v)}
        />

        <Text style={s.label}>Relation to Community</Text>
        <TextInput
          placeholder="e.g. Resident, Volunteer"
          style={s.input}
          value={form.relationToCommunity}
          onChangeText={(v) => handleChange("relationToCommunity", v)}
        />
      </View>

      {/* ══ FUND DETAILS ════════════════════════════════════════════════════ */}
      <View style={s.card}>
        <Text style={s.section}>💰  Fund Details</Text>

        <Text style={s.label}>Fund Title *</Text>
        <TextInput
          placeholder="Give your fund a clear title"
          style={s.input}
          value={form.fundTitle}
          onChangeText={(v) => handleChange("fundTitle", v)}
        />

        <Text style={s.label}>Category</Text>
        <Dropdown
          label="Select Category"
          options={["Medical", "Education", "Natural Disaster", "Business Loss", "Death / Funeral", "Other"]}
          value={form.fundCategory}
          onChange={(v) => handleChange("fundCategory", v)}
        />

        <Text style={s.label}>Description</Text>
        <TextInput
          placeholder="Describe the need in detail..."
          style={[s.input, { height: 90, textAlignVertical: "top" }]}
          multiline
          value={form.description}
          onChangeText={(v) => handleChange("description", v)}
        />

        <Text style={s.label}>Target Amount (₹) *</Text>
        <TextInput
          placeholder="0.00"
          style={s.input}
          keyboardType="numeric"
          value={form.targetAmount}
          onChangeText={(v) => handleChange("targetAmount", v)}
        />

        {/* Balance Amount — auto-filled, read-only */}
        <Text style={s.label}>Balance Amount (₹)</Text>
        <View style={s.readOnlyWrapper}>
          <Text style={s.readOnlyText}>
            {form.balanceAmount !== "" ? form.balanceAmount : "—"}
          </Text>
          <View style={s.readOnlyBadge}>
            <Text style={s.readOnlyBadgeText}>Auto</Text>
          </View>
        </View>

        {/* Minimum Amount */}
        <Text style={s.label}>Minimum Amount (₹)</Text>
        <View style={s.minimumWrapper}>
          <Text style={s.minimumPrefix}>₹</Text>
          <TextInput
            placeholder="0.00"
            style={s.minimumInput}
            keyboardType="numeric"
            value={form.minimumAmount}
            onChangeText={(v) => handleChange("minimumAmount", v)}
          />
        </View>
        <Text style={s.minimumHint}>Minimum donation amount per contributor</Text>

        <Text style={s.label}>Urgency Level</Text>
        <Dropdown
          label="Select Urgency"
          options={["Normal", "Urgent", "Critical"]}
          value={form.urgencyLevel}
          onChange={(v) => handleChange("urgencyLevel", v)}
        />
      </View>

      {/* ══ DATES ═══════════════════════════════════════════════════════════ */}
      <View style={s.card}>
        <Text style={s.section}>📅  Campaign Dates</Text>

        <Text style={s.label}>Start Date</Text>
        <TouchableOpacity style={s.datePill} onPress={() => setShowStart(true)}>
          <Text style={s.datePillIcon}>📆</Text>
          <Text style={s.datePillText}>{form.startDate.toDateString()}</Text>
        </TouchableOpacity>
        {showStart && (
          <DateTimePicker
            value={form.startDate}
            mode="date"
            onChange={(e, d) => { setShowStart(false); if (d) handleChange("startDate", d); }}
          />
        )}

        <Text style={s.label}>End Date</Text>
        <TouchableOpacity style={s.datePill} onPress={() => setShowEnd(true)}>
          <Text style={s.datePillIcon}>📆</Text>
          <Text style={s.datePillText}>{form.endDate.toDateString()}</Text>
        </TouchableOpacity>
        {showEnd && (
          <DateTimePicker
            value={form.endDate}
            mode="date"
            onChange={(e, d) => { setShowEnd(false); if (d) handleChange("endDate", d); }}
          />
        )}
      </View>

      {/* ══ DOCUMENTS ═══════════════════════════════════════════════════════ */}
      <View style={s.card}>
        <Text style={s.section}>📎  Documents</Text>
        <Text style={s.sectionHint}>
          Files are uploaded to the server after the fund is saved.
        </Text>

        {/* Supporting Document */}
        <Text style={s.label}>Supporting Document (PDF / Image)</Text>
        <TouchableOpacity style={s.uploadBtn} onPress={pickDocument}>
          <Text style={s.uploadIcon}>📄</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.uploadText} numberOfLines={1}>
              {form.supportingDocumentFile
                ? form.supportingDocumentFile.name
                : form.supportingDocumentUrl
                ? "Existing file on server ✓"
                : "Tap to upload PDF or Image"}
            </Text>
            {form.supportingDocumentFile && (
              <Text style={s.uploadSubText}>Ready to upload on save</Text>
            )}
            {form.supportingDocumentUrl && !form.supportingDocumentFile && (
              <Text style={s.uploadSubText} numberOfLines={1}>
                {form.supportingDocumentUrl}
              </Text>
            )}
          </View>
          {(form.supportingDocumentFile || form.supportingDocumentUrl) && (
            <Text style={s.uploadCheck}>✓</Text>
          )}
        </TouchableOpacity>
        {/* Fallback URL input */}
        {!form.supportingDocumentFile && (
          <TextInput
            placeholder="Or paste document URL"
            style={[s.input, { marginTop: 6 }]}
            value={form.supportingDocumentUrl}
            onChangeText={(v) => handleChange("supportingDocumentUrl", v)}
          />
        )}
        {/* Clear button */}
        {form.supportingDocumentFile && (
          <TouchableOpacity
            style={s.clearFileBtn}
            onPress={() => handleChange("supportingDocumentFile", null)}
          >
            <Text style={s.clearFileBtnText}>✕  Remove selected file</Text>
          </TouchableOpacity>
        )}

        {/* Beneficiary Photo */}
        <Text style={[s.label, { marginTop: 14 }]}>Beneficiary Photo</Text>
        <TouchableOpacity style={s.uploadBtn} onPress={pickPhoto}>
          <Text style={s.uploadIcon}>🖼️</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.uploadText}>
              {form.beneficiaryPhotoFile
                ? "Photo selected"
                : form.beneficiaryPhotoUrl
                ? "Existing photo on server ✓"
                : "Tap to choose photo"}
            </Text>
            {form.beneficiaryPhotoFile && (
              <Text style={s.uploadSubText}>Ready to upload on save</Text>
            )}
          </View>
          {(form.beneficiaryPhotoFile || form.beneficiaryPhotoUrl) && (
            <Text style={s.uploadCheck}>✓</Text>
          )}
        </TouchableOpacity>

        {/* Photo preview */}
        {form.beneficiaryPhotoFile ? (
          <Image
            source={{ uri: form.beneficiaryPhotoFile.uri }}
            style={s.photoPreview}
            resizeMode="cover"
          />
        ) : form.beneficiaryPhotoUrl ? (
          <Image
            source={{ uri: form.beneficiaryPhotoUrl }}
            style={s.photoPreview}
            resizeMode="cover"
          />
        ) : null}

        {/* Fallback URL / clear */}
        {!form.beneficiaryPhotoFile && (
          <TextInput
            placeholder="Or paste photo URL"
            style={[s.input, { marginTop: 6 }]}
            value={form.beneficiaryPhotoUrl}
            onChangeText={(v) => handleChange("beneficiaryPhotoUrl", v)}
          />
        )}
        {form.beneficiaryPhotoFile && (
          <TouchableOpacity
            style={s.clearFileBtn}
            onPress={() => handleChange("beneficiaryPhotoFile", null)}
          >
            <Text style={s.clearFileBtnText}>✕  Remove selected photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ══ BANK DETAILS ════════════════════════════════════════════════════ */}
      <View style={s.card}>
        <Text style={s.section}>🏦  Bank Details</Text>

        <Text style={s.label}>Account Holder Name *</Text>
        <TextInput
          placeholder="Name as per bank"
          style={s.input}
          value={bank.accountHolderName}
          onChangeText={(v) => handleBankChange("accountHolderName", v)}
        />

        <Text style={s.label}>Account Number</Text>
        <TextInput
          placeholder="Enter account number"
          style={s.input}
          keyboardType="numeric"
          value={bank.bankAccountNumber}
          onChangeText={(v) => handleBankChange("bankAccountNumber", v)}
        />

        <Text style={s.label}>IFSC Code</Text>
        <TextInput
          placeholder="e.g. SBIN0001234"
          style={s.input}
          autoCapitalize="characters"
          value={bank.ifscCode}
          onChangeText={(v) => handleBankChange("ifscCode", v)}
        />

        <Text style={s.label}>UPI ID</Text>
        <TextInput
          placeholder="name@upi"
          style={s.input}
          value={bank.upiId}
          onChangeText={(v) => handleBankChange("upiId", v)}
        />
      </View>

      {/* ══ SUBMIT ══════════════════════════════════════════════════════════ */}
      <TouchableOpacity
        style={[s.submitBtn, submitting && s.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.submitText}>{isEdit ? "Update Fund" : "Create Fund"}</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const PRIMARY = "#1E3A5F";
const ACCENT  = "#2E86DE";

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#F4F6FA" },
  header:      { backgroundColor: PRIMARY, padding: 18, paddingTop: 50 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },

  card: {
    backgroundColor: "#fff", marginHorizontal: 12,
    marginBottom: 12, borderRadius: 12, padding: 16,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.06,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  section:     { fontSize: 15, fontWeight: "700", color: PRIMARY, marginBottom: 4 },
  sectionHint: { fontSize: 11, color: "#AAB0C0", marginBottom: 10 },

  label: { fontSize: 13, color: "#555", marginTop: 10, marginBottom: 4, fontWeight: "500" },
  input: {
    borderWidth: 1, borderColor: "#DDE3EF",
    borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 9,
    fontSize: 15, color: "#222", backgroundColor: "#FAFBFD",
  },

  // Read-only balance
  readOnlyWrapper: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#DDE3EF",
    borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    backgroundColor: "#F0F4FA",
  },
  readOnlyText:      { flex: 1, fontSize: 15, color: "#444", fontWeight: "600" },
  readOnlyBadge:     { backgroundColor: "#DDE8F8", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  readOnlyBadgeText: { fontSize: 11, color: ACCENT, fontWeight: "700" },

  // Minimum Amount
  minimumWrapper: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#DDE3EF",
    borderRadius: 8, backgroundColor: "#FAFBFD", overflow: "hidden",
  },
  minimumPrefix: {
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 9,
    fontSize: 15, color: "#888", fontWeight: "600",
    backgroundColor: "#F0F4FA",
    borderRightWidth: 1, borderRightColor: "#DDE3EF",
  },
  minimumInput: {
    flex: 1, paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 9,
    fontSize: 15, color: "#222",
  },
  minimumHint: { fontSize: 11, color: "#AAB0C0", marginTop: 4, marginLeft: 2 },

  // Dates
  datePill: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#DDE3EF",
    borderRadius: 8, padding: 12, backgroundColor: "#FAFBFD",
  },
  datePillIcon: { fontSize: 16, marginRight: 8 },
  datePillText: { fontSize: 15, color: "#222" },

  // Upload
  uploadBtn: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: ACCENT, borderStyle: "dashed",
    borderRadius: 8, padding: 14, backgroundColor: "#EEF5FF",
  },
  uploadIcon:    { fontSize: 20, marginRight: 10 },
  uploadText:    { color: ACCENT, fontSize: 14, fontWeight: "500" },
  uploadSubText: { color: "#888", fontSize: 11, marginTop: 2 },
  uploadCheck:   { fontSize: 16, color: "#27AE60", marginLeft: 8 },

  clearFileBtn: {
    marginTop: 6, paddingVertical: 6, alignItems: "center",
  },
  clearFileBtnText: { fontSize: 12, color: "#E74C3C", fontWeight: "600" },

  photoPreview: {
    width: "100%", height: 180, borderRadius: 10,
    marginTop: 10, backgroundColor: "#eee",
  },

  // Submit
  submitBtn: {
    backgroundColor: PRIMARY, margin: 12,
    borderRadius: 10, padding: 16, alignItems: "center", elevation: 3,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText:        { color: "#fff", fontSize: 16, fontWeight: "700" },
});

// ─── Dropdown styles ─────────────────────────────────────────────────────────
const PRIMARY_DD = "#1E3A5F";
const ACCENT_DD  = "#2E86DE";

const dd = StyleSheet.create({
  wrapper:  { marginBottom: 4 },
  trigger: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderWidth: 1, borderColor: "#DDE3EF", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 12, backgroundColor: "#FAFBFD",
  },
  triggerText: { fontSize: 15, color: "#222" },
  placeholder: { fontSize: 15, color: "#aaa" },
  arrow:       { fontSize: 12, color: "#888" },
  backdrop: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff", borderTopLeftRadius: 20,
    borderTopRightRadius: 20, padding: 20, maxHeight: "60%",
  },
  sheetTitle: { fontWeight: "700", fontSize: 16, color: PRIMARY_DD, marginBottom: 12 },
  searchRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F4F6FA", borderRadius: 8,
    paddingHorizontal: 10, marginBottom: 10,
  },
  searchIcon:  { fontSize: 14, marginRight: 6, color: "#888" },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: "#222" },
  option: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 13, borderBottomWidth: 1, borderColor: "#F0F2F7",
  },
  optionActive:     { backgroundColor: "#EEF5FF", borderRadius: 8, paddingHorizontal: 8 },
  optionText:       { fontSize: 15, color: "#333" },
  optionTextActive: { color: ACCENT_DD, fontWeight: "600" },
  check:            { color: ACCENT_DD, fontWeight: "700" },
  empty:            { textAlign: "center", color: "#aaa", padding: 20 },
});