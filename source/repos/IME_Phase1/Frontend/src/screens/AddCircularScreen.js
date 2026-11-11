import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  Linking,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  AppText as Text,
  AppTextInput as TextInput,
} from '../components/IMEText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { circularService } from '../services/circularService';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import api from '../utils/api';
import { AddCircularScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';
import DOBField from '../components/DOBField';
import * as FileSystem from 'expo-file-system/legacy';
import AttachmentPickerModal from '../components/AttachmentPickerModal';

const NAVY = COLORS.primary;
const GOLD = COLORS.accent;

// Validation and sanitization
const MAX_TITLE = 150;
const MAX_DESCRIPTION = 500;
const MAX_CIRCULAR_NUMBER = 20;
const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024;
const CIRCULAR_DOCUMENT_EXTENSIONS = new Set([
  'pdf',
  'doc',
  'docx',
]);

const TITLE_REGEX = /^[A-Za-z0-9\s.,-]*$/;
const CIRCULAR_NUMBER_REGEX = /^[A-Za-z0-9\s/\-]*$/;

const sanitizeTitle = (v) =>
  v.replace(/[^A-Za-z0-9\s.,-]/g, '').slice(0, MAX_TITLE);

const sanitizeDescription = (v) =>
  v.slice(0, MAX_DESCRIPTION);

const sanitizeCircularNumber = (v) =>
  v.replace(/[^A-Za-z0-9\s/\-]/g, '')
    .slice(0, MAX_CIRCULAR_NUMBER);

const API_BASE = (api.defaults.baseURL || '')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

const toPublicUrl = (filePath) => {
  if (!filePath) return null;

  if (/^https?:\/\//i.test(filePath)) {
    return filePath;
  }

  const idx = filePath.search(/uploads[\\/]/i);

  if (idx === -1) return filePath;

  return `${API_BASE}/${filePath
    .substring(idx)
    .replace(/\\/g, '/')}`;
};

// FIX: copy the picked file into our own cache folder under a clean,
// URL-safe name so the upload task can always read it.
const stageFile = async (asset, fileName, index) => {
  const safeName = fileName.replace(/[^A-Za-z0-9._-]/g, '_');
  const dest = `${FileSystem.cacheDirectory}circular-${Date.now()}-${index}-${safeName}`;

  try {
    // copyAsync accepts both file:// and content:// sources
    await FileSystem.copyAsync({ from: asset.uri, to: dest });

    const info = await FileSystem.getInfoAsync(dest);

    if (info.exists) {
      return dest;
    }
  } catch (error) {
    console.warn('stageFile copy failed:', asset.uri, error.message);

    // A content:// URI can still be uploaded directly with FormData
    if (asset.uri.startsWith('content://')) {
      return asset.uri;
    }

    throw error;
  }

  throw new Error('Could not prepare the file. Please try again.');
};

const VISIBILITY_OPTIONS = [
  {
    value: 'Public(All Clubs)',
    label: 'Public',
    sub: 'All Clubs',
  },
  {
    value: 'Private(This Club Only)',
    label: 'Private',
    sub: 'This Club Only',
  },
];

// Field wrapper
function Field({
  label,
  required,
  children,
  error,
  hint,
  charCount,
  maxChars,
}) {
  const over =
    maxChars != null && charCount > maxChars;

  return (
    <View style={styles.field.wrapper}>
      <View style={styles.field.labelRow}>
        <Text style={styles.field.label}>
          {label}
          {required && (
            <Text style={styles.field.req}> *</Text>
          )}
        </Text>

        {maxChars != null && (
          <Text
            style={[
              styles.field.counter,
              over && styles.field.counterOver,
            ]}
          >
            {charCount ?? 0}/{maxChars}
          </Text>
        )}
      </View>

      {children}

      {!!hint && !error && (
        <Text style={styles.field.hint}>
          {hint}
        </Text>
      )}

      {!!error && (
        <Text style={styles.field.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

// Styled input
function StyledInput({
  hasError,
  multiline,
  style,
  ...props
}) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      style={[
        styles.styledInput.base,
        multiline && styles.styledInput.multiline,
        focused && styles.styledInput.focused,
        hasError && styles.styledInput.errored,
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

const AddCircularScreen = ({ route, navigation }) => {
  const editData = route?.params?.item;
  const isEditMode = !!editData;

  const [saving, setSaving] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const documentPickerBusy = useRef(false);

  const [
    existingAttachments,
    setExistingAttachments,
  ] = useState([]);

  const [
    attachmentPickerVisible,
    setAttachmentPickerVisible,
  ] = useState(false);

  const [
    attachmentPickerOptions,
    setAttachmentPickerOptions,
  ] = useState([]);

  const [fileViewer, setFileViewer] = useState({
    visible: false,
    uri: null,
  });

  const [formData, setFormData] = useState({
    title: editData?.title || '',
    description: editData?.description || '',
    circularNumber: editData?.circularNumber || '',
    visibility:
      editData?.visibility || 'Public(All Clubs)',
  });

  const [publishDate, setPublishDate] = useState(
    editData?.publishDate
      ? new Date(editData.publishDate)
      : null
  );

  const [errors, setErrors] = useState({});

  const today = new Date();

  const publishMinDate = new Date(
    today.getFullYear() - 100,
    0,
    1
  );

  const publishMaxDate = new Date(
    today.getFullYear() + 80,
    11,
    31
  );

  const formatDate = (date) => {
    const d = new Date(date);

    return (
      `${d.getFullYear()}-` +
      `${String(d.getMonth() + 1).padStart(2, '0')}-` +
      `${String(d.getDate()).padStart(2, '0')}`
    );
  };

  const formatMB = (bytes) =>
    `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const getAssetSize = async (asset) => {
    if (typeof asset.size === 'number') {
      return asset.size;
    }

    if (typeof asset.fileSize === 'number') {
      return asset.fileSize;
    }

    try {
      const info = await FileSystem.getInfoAsync(
        asset.uri,
        { size: true }
      );

      if (
        info?.exists &&
        typeof info.size === 'number'
      ) {
        return info.size;
      }
    } catch (error) {
      console.warn(
        'Could not determine file size:',
        error
      );
    }

    return null;
  };

  const partitionBySize = async (assets) => {
    const accepted = [];
    const rejected = [];

    for (const asset of assets) {
      const size = await getAssetSize(asset);

      if (
        size != null &&
        size > MAX_ATTACHMENT_BYTES
      ) {
        rejected.push({
          name:
            asset.fileName ||
            asset.name ||
            'file',
          size,
        });
      } else {
        accepted.push(asset);
      }
    }

    return { accepted, rejected };
  };

  const warnIfRejected = (rejected) => {
    if (rejected.length === 0) return;

    const list = rejected
      .map(
        (r) =>
          `• ${r.name} (${formatMB(r.size)})`
      )
      .join('\n');

    Alert.alert(
      'File too large',
      `The following files exceed the 50 MB limit:\n\n${list}`
    );
  };

  useEffect(() => {
    if (editData) {
      loadExisting();
    }
  }, [editData]);

  const loadExisting = async () => {
    try {
      const res = await circularService.getById(
        editData.circularId
      );

      if (res?.success) {
        const raw = res.data?.attachments || [];

        const mapped = raw.map((a) => ({
          ...a,
          filePath: a.filePath
            ? toPublicUrl(a.filePath)
            : circularService.getAttachmentUrl(
                a.attachmentId
              ),
        }));

        setExistingAttachments(mapped);

        if (res.data?.visibility) {
          update(
            'visibility',
            res.data.visibility
          );
        }
      }
    } catch (error) {
      console.error(
        'Load attachments error:',
        error
      );
    }
  };

  const update = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) =>
      previous[field]
        ? { ...previous, [field]: null }
        : previous
    );
  };

  // ANDROID DOCUMENT PICKER FIX
  // Copy the picked file into our own cache folder with a clean name
  // (see stageFile above) so the upload can always read it.

  const addPickedAssets = async (
    assets,
    fallbackMimeType
  ) => {
    const { accepted, rejected } =
      await partitionBySize(assets);

    warnIfRejected(rejected);

    const slots = Math.max(
      0,
      5 -
        existingAttachments.length -
        attachments.length
    );

    const staged = [];

    for (const [index, asset] of accepted
      .slice(0, slots)
      .entries()) {
      const fileName =
        asset.name ||
        asset.fileName ||
        `attachment-${Date.now()}-${index}`;

      const mimeType =
        asset.mimeType ||
        fallbackMimeType ||
        'application/octet-stream';

      try {
        if (!asset.uri) {
          throw new Error(
            'No file URI was returned. Please select the file again.'
          );
        }

        const stagedUri = await stageFile(
          asset,
          fileName,
          index
        );

        staged.push({
          uri: stagedUri,
          name: fileName,
          fileName,
          mimeType,
          type: mimeType.startsWith('image/')
            ? 'image'
            : mimeType.startsWith('video/')
            ? 'video'
            : 'file',
        });

        console.log(
          'Circular attachment ready:',
          fileName,
          stagedUri
        );
      } catch (error) {
        console.error(
          'Circular file preparation failed:',
          {
            sourceUri: asset.uri,
            reason: error.message,
          }
        );

        Alert.alert(
          'Cannot read attachment',
          `${fileName}: ${error.message}`
        );
      }
    }

    setAttachments((current) => [
      ...current,
      ...staged.slice(
        0,
        Math.max(
          0,
          5 -
            existingAttachments.length -
            current.length
        )
      ),
    ]);
  };

  // PDF, DOC and VIDEO selection

  const pickDocuments = async (types) => {
    if (documentPickerBusy.current || saving) {
      return;
    }

    documentPickerBusy.current = true;
    setSelecting(true);
    setAttachmentPickerVisible(false);

    try {
      const isDocumentSelection = Array.isArray(types);
      const result =
        await DocumentPicker.getDocumentAsync({
          // Some Android document providers fail on multiple MIME filters.
          type: isDocumentSelection ? '*/*' : types,

          // The picker's own cache copy is the file Android says
          // "isn't readable", so get the original content:// URI instead
          // and let stageFile copy it into our own cache.
          copyToCacheDirectory: false,

          multiple: true,
        });

      if (
        result.canceled ||
        !result.assets?.length
      ) {
        return;
      }

      const selectedAssets = isDocumentSelection
        ? result.assets.filter((asset) => {
            const fileName = asset.name || asset.fileName || '';
            const extension = fileName
              .split('.')
              .pop()
              .toLowerCase();

            return CIRCULAR_DOCUMENT_EXTENSIONS.has(extension);
          })
        : result.assets;

      if (selectedAssets.length === 0) {
        Alert.alert(
          'Unsupported file',
          'Select a PDF, DOC, or DOCX file.'
        );
        return;
      }

      if (selectedAssets.length < result.assets.length) {
        Alert.alert(
          'Unsupported files skipped',
          'Only PDF, DOC, and DOCX files can be attached as documents.'
        );
      }

      await addPickedAssets(selectedAssets);
    } catch (error) {
      console.error(
        'Circular document selection failed:',
        error
      );

      Alert.alert(
        'File selection failed',
        error.message || 'Please try again.'
      );
    } finally {
      documentPickerBusy.current = false;
      setSelecting(false);
    }
  };

  // Photo selection

  const pickPhotos = async () => {
    if (documentPickerBusy.current || saving) {
      return;
    }

    documentPickerBusy.current = true;
    setSelecting(true);
    setAttachmentPickerVisible(false);

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          'Allow photo library access.'
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsMultipleSelection: true,
          selectionLimit: Math.max(
            1,
            5 -
              existingAttachments.length -
              attachments.length
          ),
          quality: 0.85,
        });

      if (
        !result.canceled &&
        result.assets?.length
      ) {
        await addPickedAssets(
          result.assets,
          'image/jpeg'
        );
      }
    } catch (error) {
      console.error(
        'Circular photo selection failed:',
        error
      );

      Alert.alert(
        'Photo selection failed',
        error.message || 'Please try again.'
      );
    } finally {
      documentPickerBusy.current = false;
      setSelecting(false);
    }
  };

  const handlePickAttachment = () => {
    if (
      saving ||
      selecting ||
      documentPickerBusy.current
    ) {
      return;
    }

    if (
      existingAttachments.length +
        attachments.length >=
      5
    ) {
      Alert.alert(
        'Limit reached',
        'Max 5 attachments.'
      );
      return;
    }

    setAttachmentPickerOptions([
      {
        text: 'PDF / Document',
        onPress: () =>
          pickDocuments([
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ]),
      },
      {
        text: 'Photo',
        onPress: pickPhotos,
      },
      {
        text: 'Video',
        onPress: () =>
          pickDocuments('video/*'),
      },
    ]);

    setAttachmentPickerVisible(true);
  };

  const openFile = (uri, type) => {
    if (!uri) {
      Alert.alert(
        'Error',
        'File URL is unavailable.'
      );
      return;
    }

    if (type === 'image') {
      setFileViewer({
        visible: true,
        uri,
      });
    } else {
      Linking.openURL(uri).catch(() => {
        Alert.alert(
          'Error',
          'Cannot open this file.'
        );
      });
    }
  };

  const deleteExisting = (
    attachmentId,
    fileName
  ) => {
    Alert.alert(
      'Delete',
      `Delete "${fileName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await circularService.deleteAttachment(
                attachmentId
              );

              setExistingAttachments((p) =>
                p.filter(
                  (a) =>
                    a.attachmentId !== attachmentId
                )
              );
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to delete.'
              );
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (
      saving ||
      selecting ||
      documentPickerBusy.current
    ) {
      return;
    }

    const e = {};

    if (
      !publishDate ||
      Number.isNaN(
        new Date(publishDate).getTime()
      )
    ) {
      e.publishDate =
        'Please select a publish date.';
    }

    if (!formData.title.trim()) {
      e.title = 'Title is required.';
    } else if (
      formData.title.trim().length > MAX_TITLE
    ) {
      e.title =
        `Title must be ${MAX_TITLE} characters or fewer.`;
    } else if (
      !TITLE_REGEX.test(formData.title.trim())
    ) {
      e.title =
        'Only letters, numbers, spaces, "." "," and "-" are allowed.';
    }

    if (
      formData.description.trim().length >
      MAX_DESCRIPTION
    ) {
      e.description =
        `Description must be ${MAX_DESCRIPTION} characters or fewer.`;
    }

    if (
      formData.circularNumber.trim() &&
      !CIRCULAR_NUMBER_REGEX.test(
        formData.circularNumber.trim()
      )
    ) {
      e.circularNumber =
        'Only letters, numbers, "-" and "/" are allowed.';
    } else if (
      formData.circularNumber.trim().length >
      MAX_CIRCULAR_NUMBER
    ) {
      e.circularNumber =
        `Circular number must be ${MAX_CIRCULAR_NUMBER} characters or fewer.`;
    }

    setErrors(e);

    if (Object.keys(e).length > 0) {
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: formData.title.trim(),
        description:
          formData.description.trim(),
        circularNumber:
          formData.circularNumber.trim(),
        publishDate: formatDate(publishDate),
        visibility: formData.visibility,
      };

      const response = isEditMode
        ? await circularService.update(
            editData.circularId,
            payload
          )
        : await circularService.create(payload);

      if (response?.success) {
        const circularId = isEditMode
          ? editData.circularId
          : response.data?.circularId ??
            response.data?.CircularId;

        if (attachments.length > 0) {
          if (!circularId) {
            Alert.alert(
              'Circular Saved',
              'The circular was saved, but its ID was not returned, so the attachments could not be uploaded.',
              [
                {
                  text: 'OK',
                  onPress: () =>
                    navigation.goBack(),
                },
              ]
            );
            return;
          }

          try {
            console.log(
              'Uploading circular attachments:',
              circularId,
              attachments.length
            );

            await circularService.uploadAttachments(
              circularId,
              attachments
            );
          } catch (uploadError) {
            console.error(
              'Circular attachment upload error:',
              uploadError
            );

            Alert.alert(
              'Circular Saved',
              `The circular was saved, but attachment upload failed: ${uploadError.message}`,
              [
                {
                  text: 'OK',
                  onPress: () =>
                    navigation.goBack(),
                },
              ]
            );
            return;
          }
        }

        Alert.alert(
          'Success',
          isEditMode
            ? 'Updated successfully.'
            : 'Created successfully.',
          [
            {
              text: 'OK',
              onPress: () =>
                navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          getSafeErrorMessage(response)
        );
      }
    } catch (error) {
      console.error('Save error:', error);

      Alert.alert(
        'Error',
        'Something went wrong.'
      );
    } finally {
      setSaving(false);
    }
  };

  const totalAttachments =
    existingAttachments.length +
    attachments.length;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[
          COLORS.headerStart,
          COLORS.headerEnd,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView
          edges={['top']}
          style={styles.headerSafeArea}
        >
          <GradientHeader style={styles.navbar}>
            <TouchableOpacity
              onPress={() =>
                navigation.goBack()
              }
              style={styles.navSide}
              disabled={saving || selecting}
            >
              <Text style={styles.cancelText}>
                Cancel
              </Text>
            </TouchableOpacity>

            <Text style={styles.navTitle}>
              {isEditMode
                ? 'Edit Circular'
                : 'New Circular'}
            </Text>

            <TouchableOpacity
              onPress={handleSave}
              style={styles.navSide}
              disabled={saving || selecting}
            >
              {saving || selecting ? (
                <ActivityIndicator
                  size="small"
                  color={GOLD}
                />
              ) : (
                <Text style={styles.saveText}>
                  {isEditMode
                    ? 'Update'
                    : 'Save'}
                </Text>
              )}
            </TouchableOpacity>
          </GradientHeader>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
        >
          <Field
            label="Title"
            required
            error={errors.title}
            charCount={
              formData.title.length
            }
            maxChars={MAX_TITLE}
          >
            <StyledInput
              placeholder="Enter title"
              value={formData.title}
              maxLength={MAX_TITLE}
              onChangeText={(v) =>
                update(
                  'title',
                  sanitizeTitle(v)
                )
              }
              hasError={!!errors.title}
              returnKeyType="next"
            />
          </Field>

          <Field
            label="Description"
            error={errors.description}
            charCount={
              formData.description.length
            }
            maxChars={MAX_DESCRIPTION}
          >
            <StyledInput
              placeholder="Enter description"
              value={formData.description}
              maxLength={MAX_DESCRIPTION}
              onChangeText={(v) =>
                update(
                  'description',
                  sanitizeDescription(v)
                )
              }
              hasError={
                !!errors.description
              }
              multiline
            />
          </Field>

          <Field
            label="Circular Number"
            error={errors.circularNumber}
            hint="e.g. C-2024/001"
          >
            <StyledInput
              placeholder="e.g. C-2024/001"
              value={
                formData.circularNumber
              }
              autoCapitalize="characters"
              maxLength={
                MAX_CIRCULAR_NUMBER
              }
              onChangeText={(v) =>
                update(
                  'circularNumber',
                  sanitizeCircularNumber(v)
                )
              }
              hasError={
                !!errors.circularNumber
              }
              returnKeyType="done"
            />
          </Field>

          <DOBField
            label="Publish Date"
            error={errors.publishDate}
            value={publishDate}
            minDate={publishMinDate}
            maxDate={publishMaxDate}
            FieldComponent={Field}
            InputComponent={StyledInput}
            onChange={(date) => {
              setPublishDate(date);

              setErrors((current) => ({
                ...current,
                publishDate: null,
              }));
            }}
          />

          <Text style={styles.label}>
            Visibility
          </Text>

          <View style={styles.radioGroup}>
            {VISIBILITY_OPTIONS.map(
              (opt) => {
                const selected =
                  formData.visibility ===
                  opt.value;

                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.radioOption,
                      selected &&
                        styles.radioOptionSelected,
                    ]}
                    onPress={() =>
                      update(
                        'visibility',
                        opt.value
                      )
                    }
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        selected &&
                          styles.radioCircleSelected,
                      ]}
                    >
                      {selected && (
                        <View
                          style={
                            styles.radioInner
                          }
                        />
                      )}
                    </View>

                    <View
                      style={
                        styles.radioTextWrap
                      }
                    >
                      <Text
                        style={[
                          styles.radioLabel,
                          selected &&
                            styles.radioLabelSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>

                      <Text
                        style={[
                          styles.radioSub,
                          selected &&
                            styles.radioSubSelected,
                        ]}
                      >
                        {opt.sub}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.radioIcon
                      }
                    >
                      {opt.value ===
                      'Public(All Clubs)'
                        ? '🌐'
                        : '🔒'}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>

          <Text style={styles.label}>
            Attachments
          </Text>

          <View style={styles.attachGrid}>
            {existingAttachments.map(
              (a) => {
                const uri = a.filePath;

                const isImage =
                  /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(
                    a.fileName || ''
                  ) ||
                  /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(
                    a.filePath || ''
                  );

                return (
                  <View
                    key={`ex-${a.attachmentId}`}
                    style={styles.thumb}
                  >
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() =>
                        openFile(
                          uri,
                          isImage
                            ? 'image'
                            : 'file'
                        )
                      }
                    >
                      {isImage ? (
                        <Image
                          source={{ uri }}
                          style={
                            styles.thumbImg
                          }
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={
                            styles.thumbDoc
                          }
                        >
                          <Text
                            style={
                              styles.thumbIcon
                            }
                          >
                            📄
                          </Text>

                          <Text
                            style={
                              styles.thumbName
                            }
                            numberOfLines={2}
                          >
                            {a.fileName}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={
                        styles.thumbRemove
                      }
                      onPress={() =>
                        deleteExisting(
                          a.attachmentId,
                          a.fileName
                        )
                      }
                    >
                      <Text
                        style={
                          styles.thumbRemoveText
                        }
                      >
                        ✕
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }
            )}

            {attachments.map((a, i) => (
              <View
                key={`new-${i}`}
                style={styles.thumb}
              >
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() =>
                    openFile(
                      a.uri,
                      a.type
                    )
                  }
                >
                  {a.type === 'image' ? (
                    <Image
                      source={{
                        uri: a.uri,
                      }}
                      style={
                        styles.thumbImg
                      }
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={
                        styles.thumbDoc
                      }
                    >
                      <Text
                        style={
                          styles.thumbIcon
                        }
                      >
                        {a.type === 'video'
                          ? '🎬'
                          : '📄'}
                      </Text>

                      <Text
                        style={
                          styles.thumbName
                        }
                        numberOfLines={2}
                      >
                        {a.fileName}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.thumbRemove
                  }
                  onPress={() =>
                    setAttachments(
                      (p) =>
                        p.filter(
                          (_, idx) =>
                            idx !== i
                        )
                    )
                  }
                >
                  <Text
                    style={
                      styles.thumbRemoveText
                    }
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>
            ))}

            {totalAttachments < 5 && (
              <TouchableOpacity
                style={
                  styles.thumbAdd
                }
                onPress={
                  handlePickAttachment
                }
                activeOpacity={0.8}
              >
                <Text
                  style={
                    styles.thumbAddIcon
                  }
                >
                  📷
                </Text>

                <Text
                  style={
                    styles.thumbAddText
                  }
                >
                  Add ({totalAttachments}/5)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text
            style={
              styles.attachHint
            }
          >
            JPG, PNG, PDF, DOC, MP4 · Max 50 MB each
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={
          fileViewer.visible
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setFileViewer({
            visible: false,
            uri: null,
          })
        }
      >
        <View
          style={
            styles.viewerOverlay
          }
        >
          <TouchableOpacity
            style={
              styles.viewerClose
            }
            onPress={() =>
              setFileViewer({
                visible: false,
                uri: null,
              })
            }
          >
            <Text
              style={
                styles.viewerCloseText
              }
            >
              ✕
            </Text>
          </TouchableOpacity>

          {fileViewer.uri && (
            <Image
              source={{
                uri: fileViewer.uri,
              }}
              style={
                styles.viewerImage
              }
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      <AttachmentPickerModal
        visible={
          attachmentPickerVisible
        }
        options={
          attachmentPickerOptions
        }
        onClose={() =>
          setAttachmentPickerVisible(
            false
          )
        }
      />
    </View>
  );
};

export default AddCircularScreen;