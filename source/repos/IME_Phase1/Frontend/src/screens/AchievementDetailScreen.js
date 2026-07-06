import React, { useEffect,useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Image, Linking, Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BASE_URL } from '../utils/api';
import api from '../utils/api';
import { achievementService } from '../services/achievementService';
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
  if (!item) return null;
  useEffect(() => {
  loadAttachments();
}, []);

const loadAttachments = async () => {
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
  }
};

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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4F8' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: NAVY,
    paddingTop: (StatusBar.currentHeight || 0) + 6,
    paddingBottom: 12, paddingHorizontal: 12,
  },
  headerBtn:   { padding: 6, borderRadius: 20 },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: '700' },

  body: { padding: 20, paddingBottom: 40, alignItems: 'center' },

  heroSection: { position: 'relative', marginBottom: 14, marginTop: 8 },
  heroAvatar: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 4, borderColor: GOLD,
  },
  heroAvatarFallback: {
    backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center',
  },
  heroInitials: { color: '#fff', fontSize: 36, fontWeight: '800' },
  trophyCircle: {
    position: 'absolute', bottom: 0, right: 0,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    elevation: 4, borderWidth: 2, borderColor: GOLD,
  },

  memberName: {
    fontSize: 20, fontWeight: '800', color: NAVY,
    textAlign: 'center', marginBottom: 12,
  },
  goldDivider: {
    width: 56, height: 3, backgroundColor: GOLD,
    borderRadius: 2, marginBottom: 16,
  },

  achTitle: {
    fontSize: 18, fontWeight: '700', color: '#0F172A',
    textAlign: 'center', lineHeight: 26, marginBottom: 12,
  },

  metaRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 20,
  },
  metaText: { color: '#64748B', fontSize: 13, marginLeft: 6, fontWeight: '500' },

  descCard: {
    width: '100%', backgroundColor: '#fff',
    borderRadius: 12, padding: 16, marginBottom: 20,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  descLabel: { fontSize: 11, fontWeight: '700', color: GOLD, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  descText:  { fontSize: 14, color: '#334155', lineHeight: 22 },

  attachSection: { width: '100%', marginBottom: 20 },
  attachLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
attachImage: {
  width: '100%',
  height: 220,
  borderRadius: 12,
  resizeMode: 'contain',
  backgroundColor: '#fff',
},
  attachHint:  { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 6 },
  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: NAVY, borderRadius: 10, padding: 14, marginBottom: 14,
  },
  downloadText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  viewerOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
  viewerClose: { position: 'absolute', top: 40, right: 20, padding: 8 },
  viewerImage: { width: '100%', height: '80%' },
});

export default AchievementDetailScreen;