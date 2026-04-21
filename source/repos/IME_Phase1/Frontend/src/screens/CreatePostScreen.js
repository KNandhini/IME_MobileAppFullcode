import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Image, Alert, ActivityIndicator,
  StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { feedService } from '../services/feedService';

const MAX_MEDIA = 10;

const CreatePostScreen = ({ navigation }) => {
  const [content,     setContent]     = useState('');
  const [mediaItems,  setMediaItems]  = useState([]);
  const [posting,     setPosting]     = useState(false);

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
debugger;
    if (!content.trim() && mediaItems.length === 0) {
      Alert.alert('Empty post', 'Write something or add a photo/video.');
      return;
    }

    setPosting(true);
    try {
      const res = await feedService.createPost(content.trim(), mediaItems);
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
        (typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg)) + detail
      );
    } finally {
      setPosting(false);
    }
  }, [content, mediaItems, navigation]);

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

        <View style={styles.hintRow}>
          <Text style={styles.hintText}>Supported: JPG, PNG, GIF, WEBP, MP4, MOV, AVI, MKV · Max 50 MB each</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },

  // Header
  header: {
    backgroundColor: '#1E3A5F',
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
    borderColor: '#1E3A5F',
    borderStyle: 'dashed',
  },
  addMediaIcon: { fontSize: 20, marginRight: 10 },
  addMediaText: { fontSize: 14, color: '#1E3A5F', fontWeight: '600' },

  // Hint
  hintRow:  { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  hintText: { fontSize: 11, color: '#bbb', lineHeight: 16 },
});

export default CreatePostScreen;
