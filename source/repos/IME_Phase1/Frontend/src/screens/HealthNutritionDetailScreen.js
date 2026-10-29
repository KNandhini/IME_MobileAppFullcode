import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Dimensions, Linking, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { healthNutritionService } from '../services/healthNutritionService';
import { HealthNutritionDetailScreenStyles as styles } from './screenStyles';
import Slider from '@react-native-community/slider';
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
//

// and the time labels below are all in seconds.
function AudioPreview({ uri }) {
  const player = useAudioPlayer(uri, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);

  const [wantsPlay, setWantsPlay] = useState(false); // user pressed play at least once
  const [seeking, setSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  // Let audio play even when the iPhone silent switch is on.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  // Audio finished: go back to 0:00 and show the play icon again.
  useEffect(() => {
    if (status.didJustFinish) {
      player.pause();
      player.seekTo(0).catch(() => {});
    }
  }, [status.didJustFinish, player]);

  const isPlaying = !!status.playing;
  const loading = wantsPlay && !status.isLoaded;
  const duration = status.duration || 0;
  const position = seeking ? seekValue : (status.currentTime || 0);

  const formatTime = (seconds) => {
    const totalSeconds = Math.floor(seconds || 0);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    try {
      setWantsPlay(true);
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch (error) {
      console.log('Audio playback error:', error);
    }
  };

  const handleSeek = async (value) => {
    try {
      await player.seekTo(value);
    } catch (error) {
      console.log('Audio seek error:', error);
    } finally {
      setSeeking(false);
    }
  };

  return (
    <View
      style={[
        styles.audioCard,
        {
          paddingHorizontal: 12,
          paddingVertical: 12,
        },
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
        }}
      >

        {/* PLAY / PAUSE */}
        <TouchableOpacity
          onPress={togglePlay}
          activeOpacity={0.8}
          disabled={loading}
          style={[
            styles.audioButton,
            {
              width: 48,
              height: 48,
              borderRadius: 24,
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <MaterialCommunityIcons
              name={isPlaying ? 'pause' : 'play'}
              size={25}
              color="#fff"
              style={!isPlaying ? { marginLeft: 3 } : undefined}
            />
          )}
        </TouchableOpacity>

        {/* PROGRESS LINE */}
        <View
          style={{
            flex: 1,
            marginLeft: 10,
          }}
        >
          <Slider
            style={{
              width: '100%',
              height: 35,
            }}
            minimumValue={0}
            maximumValue={duration || 1}
            value={position}
            onSlidingStart={() => setSeeking(true)}
            onValueChange={(value) => {
              setSeekValue(value);
            }}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor={GOLD}
            maximumTrackTintColor="#CBD5E1"
            thumbTintColor={GOLD}
          />

          {/* TIME */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: -5,
            }}
          >
            <Text style={styles.audioHint}>
              {formatTime(position)}
            </Text>

            <Text style={styles.audioHint}>
              {formatTime(duration)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// Preserves the uploaded video's real aspect ratio instead of forcing a fixed
// box — landscape videos display landscape, portrait videos display portrait.
function VideoPreview({ uri }) {
  const [aspectRatio, setAspectRatio] = useState(16 / 9);
  const maxHeight = screenHeight * 0.6;
  const computedHeight = Math.min(MEDIA_WIDTH / aspectRatio, maxHeight);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  // expo-video has no onReadyForDisplay/naturalSize; read the size from the
  // video track instead.
  useEffect(() => {
    const applySize = (track) => {
      const size = track?.size;
      if (size?.width && size?.height) {
        setAspectRatio(size.width / size.height);
      }
    };

    const subs = [
      player.addListener('sourceLoad', ({ availableVideoTracks }) =>
        applySize(availableVideoTracks?.[0])
      ),
      player.addListener('videoTrackChange', ({ videoTrack }) => applySize(videoTrack)),
    ];
    return () => subs.forEach((s) => s.remove());
  }, [player]);

  return (
    <VideoView
      player={player}
      style={{ width: MEDIA_WIDTH, height: computedHeight, borderRadius: 12, backgroundColor: '#000' }}
      nativeControls
      contentFit="contain"
    />
  );
}

// Compact PDF card — no inline PDF viewer / big empty box.
// Shows the PDF icon; if the file has a name, it is shown next to the icon.
// The Download button below the attachment section opens the file.
function PdfPreview({ fileName }) {
  const hasName = !!(fileName && String(fileName).trim());

  return (
    <View
      style={{
        width: MEDIA_WIDTH,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: hasName ? 'flex-start' : 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
      }}
    >
      <MaterialCommunityIcons name="file-pdf-box" size={44} color="#DC2626" />
      {hasName ? (
        <Text
          style={{ flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600', color: NAVY }}
          numberOfLines={2}
        >
          {fileName}
        </Text>
      ) : null}
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
      case 'pdf': return <PdfPreview fileName={item.attachmentFileName} />;
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