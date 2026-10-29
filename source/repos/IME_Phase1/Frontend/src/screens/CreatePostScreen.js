import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { feedService } from '../services/feedService';
import { CreatePostScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';
import * as FileSystem from 'expo-file-system/legacy';

const MAX_MEDIA = 10;

// Attachment size cap — matches the "Max 50 MB each" hint shown to the user.
const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024; // 50 MB

// ── Media grid layout ─────────────────────────────────────────────────────────
// Tiles are sized from the REAL measured width of the grid, so they are always
// square, evenly spaced, and the grid's height always matches its content —
// which is what stops the tiles from overlapping the "Add More" button below.
const GRID_GAP = 8;
const WIDE_SCREEN_BREAKPOINT = 700; // 4 columns on wide grids, 3 otherwise

// ── Visibility options ────────────────────────────────────────────────────────
const VISIBILITY_OPTIONS = [
  { value: 'public',  label: 'Public',       sub: 'Visible to all members',    icon: '🌐' },
  { value: 'private', label: 'My Club Only', sub: 'Visible only to your club', icon: '🔒' },
];

const formatMB = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

// Resolve a picked asset's size in bytes, whichever field the picker
// happened to populate — fall back to the filesystem if neither is present.
const getAssetSize = async (asset) => {
  if (typeof asset.size === 'number') return asset.size;
  if (typeof asset.fileSize === 'number') return asset.fileSize;
  try {
    const info = await FileSystem.getInfoAsync(asset.uri, { size: true });
    if (info?.exists && typeof info.size === 'number') return info.size;
  } catch (e) {
    console.warn('Could not determine file size for', asset?.uri, e);
  }
  return null; // unknown — let it through rather than block a valid pick
};

// Splits picked assets into { accepted, rejected }, checking each one's
// real size against MAX_ATTACHMENT_BYTES. Videos especially can exceed 50MB.
const partitionBySize = async (assets) => {
  const accepted = [];
  const rejected = [];
  for (const asset of assets) {
    const size = await getAssetSize(asset);
    if (size != null && size > MAX_ATTACHMENT_BYTES) {
      rejected.push({ name: asset.fileName || asset.name || 'file', size });
    } else {
      accepted.push(asset);
    }
  }
  return { accepted, rejected };
};

const warnIfRejected = (rejected) => {
  if (rejected.length === 0) return;
  const list = rejected.map((r) => `• ${r.name} (${formatMB(r.size)})`).join('\n');
  Alert.alert(
    'File too large',
    `The following file${rejected.length > 1 ? 's' : ''} exceed${rejected.length > 1 ? '' : 's'} the 50 MB limit and ${rejected.length > 1 ? 'were' : 'was'} not added:\n\n${list}`
  );
};

const CreatePostScreen = ({ navigation }) => {
  const [content,    setContent]    = useState('');
  const [mediaItems, setMediaItems] = useState([]);
  const [posting,    setPosting]    = useState(false);
  const [visibility, setVisibility] = useState('public'); // 'public' | 'private'
  const [gridWidth,  setGridWidth]  = useState(0);        // measured width of the media grid

  // ── Tile size derived from the measured grid width ────────
  const columns  = gridWidth >= WIDE_SCREEN_BREAKPOINT ? 4 : 3;
  const tileSize = gridWidth > 0
    ? Math.floor((gridWidth - GRID_GAP * (columns - 1)) / columns)
    : 0;

  // ── Pick media ────────────────────────────────────────────
  const handlePickMedia = useCallback(async () => {
    const remaining = MAX_MEDIA - mediaItems.length;
    if (remaining <= 0) {
      Alert.alert('Limit reached', `You can add up to ${MAX_MEDIA} media files per post.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library to add media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets?.length > 0) {
      // Check size before slicing to the remaining slots
      const { accepted, rejected } = await partitionBySize(result.assets);
      warnIfRejected(rejected);

      const newItems = accepted.map((asset) => ({
        uri:      asset.uri,
        type:     asset.type === 'video' ? 'video' : 'image',
        fileName: asset.fileName || asset.uri.split('/').pop(),
        mimeType: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
      }));
      setMediaItems((prev) => [...prev, ...newItems].slice(0, MAX_MEDIA));

      if (accepted.length > remaining) {
        Alert.alert('Limit applied', `Only ${remaining} file(s) added. Max ${MAX_MEDIA} total.`);
      }
    }
  }, [mediaItems.length]);

  // ── Remove one media item ─────────────────────────────────
  const handleRemoveMedia = useCallback((index) => {
    setMediaItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Submit post ───────────────────────────────────────────
  const handlePost = useCallback(async () => {
    if (!content.trim() && mediaItems.length === 0) {
      Alert.alert('Empty post', 'Write something or add a photo/video.');
      return;
    }

    setPosting(true);
    try {
      // Read clubId from AsyncStorage; 0 = public, >0 = private (club only)
      const raw      = await AsyncStorage.getItem('userData');
      const userData = raw ? JSON.parse(raw) : {};
      const clubId   = visibility === 'private' && userData.clubId
                         ? Number(userData.clubId)
                         : 0;

      const res = await feedService.createPost(content.trim(), mediaItems, clubId);
      if (res.success) {
        navigation.goBack();
      } else {
        Alert.alert('Failed', getSafeErrorMessage(res));
      }
    } catch (e) {
      Alert.alert('Error', getSafeErrorMessage(e));
    } finally {
      setPosting(false);
    }
  }, [content, mediaItems, navigation, visibility]);

  const canPost = (content.trim().length > 0 || mediaItems.length > 0) && !posting;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />

      {/* ── Header ── */}
      <GradientHeader style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          onPress={handlePost}
          style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
          disabled={!canPost}
          activeOpacity={0.8}
        >
          {posting
            ? <ActivityIndicator size="small" color={COLORS.white} />
            : <Text style={styles.postBtnText}>Post</Text>
          }
        </TouchableOpacity>
      </GradientHeader>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Text input ── */}
        <TextInput
          style={styles.textInput}
          placeholder="What's on your mind?"
          placeholderTextColor="#AAA"
          multiline
          value={content}
          onChangeText={setContent}
          maxLength={2000}
          autoFocus
          scrollEnabled={false}
        />

        {/* ── Media grid ──
            All layout-critical props are set inline (not from screenStyles) so
            nothing in the shared stylesheet can make the tiles overflow the
            grid and sit on top of the "Add More" button. */}
        {mediaItems.length > 0 && (
          <View
            onLayout={(e) => setGridWidth(Math.floor(e.nativeEvent.layout.width))}
            style={[
              styles.mediaGrid,
              {
                alignSelf: 'stretch',
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
                height: undefined,        // let content decide the height
                marginBottom: 12,
              },
            ]}
          >
            {tileSize > 0 &&
              mediaItems.map((item, index) => {
                const isLastInRow = (index + 1) % columns === 0;
                return (
                  <View
                    key={`${item.uri}-${index}`}
                    style={[
                      styles.mediaTile,
                      {
                        width: tileSize,
                        height: tileSize,
                        marginRight: isLastInRow ? 0 : GRID_GAP,
                        marginBottom: GRID_GAP,
                        margin: undefined,
                        borderRadius: 10,
                        overflow: 'hidden',
                        backgroundColor: '#000',
                      },
                      // re-apply the margins after the style spread above
                      { marginRight: isLastInRow ? 0 : GRID_GAP, marginBottom: GRID_GAP },
                    ]}
                  >
                    <Image
                      source={{ uri: item.uri }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />

                    {item.type === 'video' && (
                      <View
                        pointerEvents="none"
                        style={[
                          StyleSheet.absoluteFill,
                          { justifyContent: 'center', alignItems: 'center' },
                        ]}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: '#fff', fontSize: 18, marginLeft: 2 }}>▶</Text>
                        </View>
                      </View>
                    )}

                    <TouchableOpacity
                      onPress={() => handleRemoveMedia(index)}
                      activeOpacity={0.8}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: 'rgba(0,0,0,0.65)',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
          </View>
        )}

        {/* ── Add media button ── */}
        <TouchableOpacity
          style={[styles.addMediaBtn, { alignSelf: 'stretch' }]}
          onPress={handlePickMedia}
          activeOpacity={0.7}
        >
          <Text style={styles.addMediaIcon}>📷</Text>
          <Text style={styles.addMediaText}>
            {mediaItems.length === 0
              ? 'Add Photos / Videos'
              : `Add More  (${mediaItems.length}/${MAX_MEDIA})`}
          </Text>
        </TouchableOpacity>

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ── Visibility ── */}
        <View style={styles.visibilitySection}>
          <Text style={styles.visibilityLabel}>Who can see this?</Text>

          {VISIBILITY_OPTIONS.map((opt) => {
            const selected = visibility === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.radioOption, selected && styles.radioOptionSelected]}
                onPress={() => setVisibility(opt.value)}
                activeOpacity={0.8}
              >
                {/* Radio circle */}
                <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
                  {selected && <View style={styles.radioInner} />}
                </View>

                {/* Text */}
                <View style={styles.radioTextWrap}>
                  <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.radioSub, selected && styles.radioSubSelected]}>
                    {opt.sub}
                  </Text>
                </View>

                {/* Icon */}
                <Text style={styles.radioIcon}>{opt.icon}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Private hint banner */}
          {visibility === 'private' && (
            <View style={styles.privateHint}>
              <Text style={styles.privateHintIcon}>ℹ️</Text>
              <Text style={styles.privateHintText}>
                Only members of your club will see this post.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.hintRow}>
          <Text style={styles.hintText}>
            Supported: JPG, PNG, GIF, WEBP, MP4, MOV, AVI, MKV · Max 50 MB each
          </Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreatePostScreen;