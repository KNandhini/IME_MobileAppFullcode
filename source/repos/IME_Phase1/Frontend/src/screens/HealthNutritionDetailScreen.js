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

function AudioPreview({ uri }) {
  const soundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => () => { soundRef.current?.unloadAsync?.(); }, []);

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
          { shouldPlay: true },
          (status) => { if (status.didJustFinish) setIsPlaying(false); }
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
    <View style={styles.mediaBox}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.8} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="large" color={GOLD} />
        ) : (
          <MaterialCommunityIcons
            name={isPlaying ? 'pause-circle' : 'play-circle'}
            size={56}
            color={NAVY}
          />
        )}
      </TouchableOpacity>
      <Text style={styles.mediaHint}>{isPlaying ? 'Playing…' : 'Tap to play audio'}</Text>
    </View>
  );
}

function VideoPreview({ uri }) {
  return (
    <Video
      source={{ uri }}
      style={{ width: MEDIA_WIDTH, height: MEDIA_WIDTH * 0.56, borderRadius: 12, backgroundColor: '#F1F5F9' }}
      useNativeControls
      resizeMode="contain"
      isLooping={false}
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
      console.log('HealthNutrition detail load error:', e);
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
      case 'pdf':   return <PdfPreview uri={item.attachmentPath} />;
      default:      return <OtherFilePreview fileName={item.attachmentFileName} />;
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
        <Text style={styles.headerTitle} numberOfLines={1}>Health & Nutrition</Text>
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
