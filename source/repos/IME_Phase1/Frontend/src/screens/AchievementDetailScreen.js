import React, { useEffect,useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Linking, Modal, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BASE_URL } from '../utils/api';
import api from '../utils/api';
import { achievementService } from '../services/achievementService';
import { AchievementDetailScreenStyles as styles } from './screenStyles';
const NAVY = '#1E3A5F';
const GOLD = '#D4A017';
const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
// filePath from the server is a raw disk path like "Uploads\achievements\xyz.jpg" —
// convert it into a URL the app can actually load/display/download.
const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const idx = filePath.indexOf('Uploads\\');
  if (idx === -1) return filePath;
  const relative = filePath.substring(idx).replace(/\\/g, '/');
  return `${API_BASE}/${relative}`;
};
const AchievementDetailScreen = ({ route, navigation }) => {
 // const { item } = route.params || {};
 const { item, memberPhoto } = route.params || {};
  const [imgViewer, setImgViewer] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttachments();
  }, [item?.achievementId]);

const loadAttachments = async () => {
  setLoading(true);
  try {
    const res = await achievementService.getAttachments(
      item.achievementId
    );

    console.log('ATTACHMENTS API:', res);

    if (res?.data) {
      setAttachments(res.data);
    }
  } catch (err) {
    console.log('ATTACHMENT ERROR', err);
  } finally {
    setLoading(false);
  }
};

  if (!item) return null;

  const dateStr = item.achievementDate
    ? new Date(item.achievementDate).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '';

  const isImage = (path = '') => /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(path);

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Achievement</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={styles.loadingText}>Loading achievement...</Text>
        </View>
      ) : (
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Member circular photo */}
        <View style={styles.heroSection}>
          {/*{item.memberPhotoPath ? (
            <Image source={{ uri: item.memberPhotoPath }} style={styles.heroAvatar} />
          ) : (*/}
         {memberPhoto ? (
    <Image
      source={{ uri: memberPhoto }}
      style={styles.heroAvatar}
    />
  ) : (
    <View style={[styles.heroAvatar, styles.heroAvatarFallback]}>
      <Text style={styles.heroInitials}>
        {(item.memberName || 'M')
          .split(' ')
          .map(w => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()}
      </Text>
    </View>
  )}
          <View style={styles.trophyCircle}>
            <Text style={{ fontSize: 18 }}>🏆</Text>
          </View>
        </View>

        {/* Member name */}
        <Text style={styles.memberName}>{item.memberName || 'Member'}</Text>

        {/* Gold divider */}
        <View style={styles.goldDivider} />

        {/* Achievement title */}
        <Text style={styles.achTitle}>{item.title}</Text>

        {/* Date */}
        {dateStr ? (
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="calendar-check-outline" size={16} color={GOLD} />
            <Text style={styles.metaText}>{dateStr}</Text>
          </View>
        ) : null}

        {/* Description */}
        {item.description ? (
          <View style={styles.descCard}>
            <Text style={styles.descLabel}>About this achievement</Text>
            <Text style={styles.descText}>{item.description}</Text>
          </View>
        ) : null}

        {/* Attachment */}
        {/*{item.attachmentPath ? (
          <View style={styles.attachSection}>
            <Text style={styles.attachLabel}>Attachment</Text>
            {isImage(item.attachmentPath) ? (
              <TouchableOpacity onPress={() => setImgViewer(true)} activeOpacity={0.85}>
                <Image source={{ uri: item.attachmentPath }} style={styles.attachImage} resizeMode="cover" />
                <Text style={styles.attachHint}>Tap to enlarge</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={() => Linking.openURL(item.attachmentPath)}
                activeOpacity={0.8}>
                <MaterialCommunityIcons name="download-outline" size={18} color="#fff" />
                <Text style={styles.downloadText}>Download Attachment</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}*/}
   <View style={styles.attachSection}>
  <Text style={styles.attachLabel}>Attachments</Text>

  {attachments.map((attachment, index) => {
    const filePath = attachment.filePath;
    const url = toPublicUrl(filePath);

    return isImage(filePath) ? (
      <TouchableOpacity
        key={attachment.attachmentId || index}
        onPress={() => setImgViewer(url)}
        activeOpacity={0.85}
        style={{ marginBottom: 14 }}
      >
        <Image
          source={{ uri: url }}
          style={styles.attachImage}
          resizeMode="contain"
        />

        <Text style={styles.attachHint}>
          Tap to enlarge
        </Text>
      </TouchableOpacity>
    ) : null;
  })}
</View>
      </ScrollView>
      )}

      {/* Image viewer modal */}
      <Modal visible={!!imgViewer} transparent animationType="fade" onRequestClose={() => setImgViewer(null)}>
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setImgViewer(null)}>
            <MaterialCommunityIcons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Image
           // source={{ uri: item.attachmentPath }}
           source={{ uri: imgViewer }}
            style={styles.viewerImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
};



export default AchievementDetailScreen;
