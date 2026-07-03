import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Image, Alert, ActivityIndicator,
  StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { feedService } from '../services/feedService';

const MAX_MEDIA = 10;

// ── Visibility options ────────────────────────────────────────────────────────
const VISIBILITY_OPTIONS = [
  { value: 'public',  label: 'Public',       sub: 'Visible to all members',    icon: '🌐' },
  { value: 'private', label: 'My Club Only',  sub: 'Visible only to your club', icon: '🔒' },
];

const CreatePostScreen = ({ navigation }) => {
  const [content,    setContent]    = useState('');
  const [mediaItems, setMediaItems] = useState([]);
  const [posting,    setPosting]    = useState(false);
  const [visibility, setVisibility] = useState('public'); // 'public' | 'private'

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
      const newItems = result.assets.map(asset => ({
        uri:      asset.uri,
        type:     asset.type === 'video' ? 'video' : 'image',
        fileName: asset.fileName || asset.uri.split('/').pop(),
        mimeType: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
      }));
      setMediaItems(prev => [...prev, ...newItems].slice(0, MAX_MEDIA));
    }
  }, [mediaItems.length]);

  // ── Remove one media item ─────────────────────────────────
  const handleRemoveMedia = useCallback((index) => {
    setMediaItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ── Submit post ───────────────────────────────────────────
  const handlePost = useCallback(async () => {
    if (!content.trim() && mediaItems.length === 0) {
      Alert.alert('Empty post', 'Write something or add a photo/video.');
      return;
    }

    setPosting(true);
    try {
      debugger;
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
        Alert.alert('Failed', res.message || 'Could not create post. Please try again.');
      }
    } catch (e) {
      debugger;
      const status    = e?.response?.status;
      const serverMsg = e?.response?.data?.message
                     || e?.response?.data?.title
                     || (typeof e?.response?.data === 'string' ? e.response.data : null)
                     || e?.message
                     || 'Unknown error';
      const detail = e?.response?.data?.errors
        ? '\n' + JSON.stringify(e.response.data.errors, null, 2)
        : '';
      Alert.alert(
        `Error${status ? ` (${status})` : ''}`,
        (typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg)) + detail,
      );
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
      <StatusBar backgroundColor="#1E3A5F" barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
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
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.postBtnText}>Post</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">

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

        {/* ── Media grid ── */}
        {mediaItems.length > 0 && (
          <View style={styles.mediaGrid}>
            {mediaItems.map((item, index) => (
              <View key={index} style={styles.mediaTile}>
                <Image source={{ uri: item.uri }} style={styles.mediaTileImg} resizeMode="cover" />
                {item.type === 'video' && (
                  <View style={styles.videoOverlay}>
                    <Text style={styles.videoIcon}>▶</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemoveMedia(index)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ── Add media button ── */}
        <TouchableOpacity style={styles.addMediaBtn} onPress={handlePickMedia} activeOpacity={0.7}>
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

const BLUE  = '#1E3A5F';
const BLUE2 = '#2C5F8A';
const LIGHT = '#EAF1FA';

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },

  // Header
  header: {
    backgroundColor: BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 44,
    paddingBottom: 12,
  },
  cancelBtn:    { paddingVertical: 6, paddingHorizontal: 4, minWidth: 60 },
  cancelText:   { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
  headerTitle:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  postBtn: {
    backgroundColor: '#D4A017',
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  postBtnDisabled: { backgroundColor: 'rgba(212,160,23,0.45)' },
  postBtnText:     { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Text input
  textInput: {
    minHeight: 120,
    fontSize: 16,
    color: '#222',
    lineHeight: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    textAlignVertical: 'top',
  },

  // Media grid
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 6,
  },
  mediaTile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  mediaTileImg: { width: '100%', height: '100%' },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoIcon: { color: '#fff', fontSize: 28 },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Add media
  addMediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: BLUE,
    borderStyle: 'dashed',
  },
  addMediaIcon: { fontSize: 20, marginRight: 10 },
  addMediaText: { fontSize: 14, color: BLUE, fontWeight: '600' },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#eef0f4',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
  },

  // Visibility section
  visibilitySection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  visibilityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8a96a8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  // Radio buttons
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e4e8ee',
    marginBottom: 10,
    backgroundColor: '#fafbfc',
  },
  radioOptionSelected: {
    borderColor: BLUE,
    backgroundColor: LIGHT,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#b0bfcf',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioCircleSelected: { borderColor: BLUE },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BLUE,
  },
  radioTextWrap:      { flex: 1 },
  radioLabel:         { fontSize: 15, fontWeight: '600', color: '#2a3545' },
  radioLabelSelected: { color: BLUE },
  radioSub:           { fontSize: 12, color: '#8a96a8', marginTop: 2 },
  radioSubSelected:   { color: BLUE2 },
  radioIcon:          { fontSize: 20, marginLeft: 8 },

  // Private hint banner
  privateHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  privateHintIcon: { fontSize: 14, marginRight: 8, marginTop: 1 },
  privateHintText: { flex: 1, fontSize: 13, color: '#78620A', lineHeight: 18 },

  // Hint
  hintRow:  { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  hintText: { fontSize: 11, color: '#bbb', lineHeight: 16 },
});

export default CreatePostScreen;