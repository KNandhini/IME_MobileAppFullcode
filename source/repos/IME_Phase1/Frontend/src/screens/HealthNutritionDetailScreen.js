import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Dimensions, Linking, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, Audio } from 'expo-av';
import { WebView } from 'react-native-webview';
import { healthNutritionService } from '../services/healthNutritionService';
import { HealthNutritionDetailScreenStyles as styles } from './screenStyles';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const MEDIA_WIDTH = screenWidth - 40; // matches body padding (20 * 2)

const ATTACHMENT_META = {
  image: { icon: 'image-outline', label: 'Image' },
  audio: { icon: 'music-circle-outline', label: 'Audio' },
  video: { icon: 'video-outline', label: 'Video' },
  pdf: { icon: 'file-pdf-box', label: 'PDF' },
  other: { icon: 'file-download-outline', label: 'File' },
};

function ImagePreview({ uri }) {
  return (
    <Image
      source={{ uri }}
      style={{ width: MEDIA_WIDTH, height: MEDIA_WIDTH * 0.65, borderRadius: 12, backgroundColor: '#F1F5F9' }}
      resizeMode="cover"
    />
  );
}

// Simple, self-contained Play/Pause card — no default/native audio player UI,
// no extra transport controls. Always starts (and resets to) 0:00.
// Uses the shared styles.audioCard / styles.audioButton / styles.audioHint
// from screenStyles.js instead of a local StyleSheet.
function AudioPreview({ uri }) {
  const soundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync?.();
    };
  }, []);

  const resetToStart = async () => {
    setIsPlaying(false);
    try {
      await soundRef.current?.setPositionAsync(0);
    } catch (e) {
      // ignore — sound may already be unloaded
    }
  };

  const toggle = async () => {
    if (isPlaying) {
      await soundRef.current?.pauseAsync();
      setIsPlaying(false);
      return;
    }
    setLoading(true);
    try {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true, positionMillis: 0 },
          (status) => {
            if (status.didJustFinish) resetToStart();
          }
        );
        soundRef.current = sound;
      } else {
        await soundRef.current.playAsync();
      }
      setIsPlaying(true);
    } catch (e) {
      console.log('Audio playback error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.audioCard}>
      <TouchableOpacity
        style={styles.audioButton}
        onPress={toggle}
        activeOpacity={0.85}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <MaterialCommunityIcons
            name={isPlaying ? 'pause' : 'play'}
            size={28}
            color="#fff"
            style={!isPlaying ? { marginLeft: 3 } : undefined}
          />
        )}
      </TouchableOpacity>
      <Text style={styles.audioHint}>{isPlaying ? 'Playing…' : 'Tap to play'}</Text>
    </View>
  );
}

// Preserves the uploaded video's real aspect ratio instead of forcing a fixed
// box — landscape videos display landscape, portrait videos display portrait.
function VideoPreview({ uri }) {
  const [aspectRatio, setAspectRatio] = useState(16 / 9);
  const maxHeight = screenHeight * 0.6;
  const computedHeight = Math.min(MEDIA_WIDTH / aspectRatio, maxHeight);

  return (
    <Video
      source={{ uri }}
      style={{ width: MEDIA_WIDTH, height: computedHeight, borderRadius: 12, backgroundColor: '#000' }}
      useNativeControls
      resizeMode="contain"
      isLooping={false}
      onReadyForDisplay={(event) => {
        const naturalSize = event?.naturalSize;
        if (naturalSize?.width && naturalSize?.height) {
          setAspectRatio(naturalSize.width / naturalSize.height);
        }
      }}
    />
  );
}

function PdfPreview({ uri }) {
  return (
    <View style={{ width: MEDIA_WIDTH, height: 480, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F1F5F9' }}>
      <WebView source={{ uri }} style={{ flex: 1 }} />
    </View>
  );
}

function OtherFilePreview({ fileName }) {
  return (
    <View style={styles.mediaBox}>
      <MaterialCommunityIcons name="file-outline" size={48} color="#64748B" />
      <Text style={styles.mediaHint} numberOfLines={1}>{fileName || 'Attached file'}</Text>
    </View>
  );
}

const HealthNutritionDetailScreen = ({ route, navigation }) => {
  const { id } = route.params || {};
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadItem(); }, [id]);

  const loadItem = async () => {
    setLoading(true);
    try {
      const res = await healthNutritionService.getById(id);
      if (res?.success) setItem(res.data);
    } catch (e) {
      console.log("Status:", e.response?.status);
      console.log("BaseURL:", e.config?.baseURL);
      console.log("URL:", e.config?.url);
      console.log("Full URL:", e.config?.baseURL + e.config?.url);
      console.log("Response:", e.response?.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !item) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={NAVY} />
      </View>
    );
  }

  const handleDownload = () => {
    if (item.attachmentPath) Linking.openURL(item.attachmentPath);
  };

  const renderAttachment = () => {
    switch (item.attachmentType) {
      case 'image': return <ImagePreview uri={item.attachmentPath} />;
      case 'audio': return <AudioPreview uri={item.attachmentPath} />;
      case 'video': return <VideoPreview uri={item.attachmentPath} />;
      case 'pdf': return <PdfPreview uri={item.attachmentPath} />;
      default: return <OtherFilePreview fileName={item.attachmentFileName} />;
    }
  };

  const meta = ATTACHMENT_META[item.attachmentType] || ATTACHMENT_META.other;
  const postedDate = item.postedBy
    ? new Date(item.postedBy).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Podcasts</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        <View style={styles.badge}>
          <MaterialCommunityIcons name={meta.icon} size={14} color={GOLD} />
          <Text style={styles.badgeText}>{meta.label}</Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>

        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="account-outline" size={15} color={GOLD} />
          <Text style={styles.metaText}>{item.postedUser}</Text>
          <Text style={styles.metaDot}>•</Text>
          <MaterialCommunityIcons name="calendar-outline" size={15} color={GOLD} />
          <Text style={styles.metaText}>{postedDate}</Text>
        </View>
        <View style={styles.goldDivider} />

        {item.description ? (
          <View style={styles.descCard}>
            <Text style={styles.descLabel}>About this post</Text>
            <Text style={styles.descText}>{item.description}</Text>
          </View>
        ) : (
          <Text style={styles.noDesc}>No additional details provided.</Text>
        )}

        <View style={styles.attachSection}>
          <Text style={styles.attachLabel}>Attachment</Text>
          {renderAttachment()}
        </View>

        <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload} activeOpacity={0.85}>
          <MaterialCommunityIcons name="download-outline" size={18} color="#fff" />
          <Text style={styles.downloadText}>Download</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default HealthNutritionDetailScreen;