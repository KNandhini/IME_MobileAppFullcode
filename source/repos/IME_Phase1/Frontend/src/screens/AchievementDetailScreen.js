import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Linking, Modal, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BASE_URL } from '../utils/api';
import api from '../utils/api';
import { achievementService } from '../services/achievementService';
import { AchievementDetailScreenStyles as styles } from './screenStyles';
const NAVY = '#252943';
const GOLD = '#A0C878';
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
  const [attachmentsError, setAttachmentsError] = useState(null); // ← ADD: track load failures

  useEffect(() => {
    loadAttachments();
  }, [item?.achievementId]);

  const loadAttachments = async () => {
    setLoading(true);
    setAttachmentsError(null); // ← ADD: reset error on each attempt
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
      // ← ADD: surface a friendly message instead of failing silently
      setAttachmentsError(
        err?.message === 'Network Error' || !err?.response
          ? 'Could not connect to the server. Check your internet connection and try again.'
          : 'Something went wrong while loading attachments.'
      );
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

  const handleDownload = (url) => {
    if (!url) return;
    Linking.openURL(url);
  };

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

          {/* ← ADD: attachment load error + retry, shown instead of a blank/empty section */}
          {attachmentsError ? (
            <View style={styles.attachSection}>
              <Text style={styles.attachLabel}>Attachments</Text>
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <MaterialCommunityIcons name="wifi-off" size={28} color="#D9534F" />
                <Text style={{ color: '#D9534F', textAlign: 'center', marginTop: 6, marginBottom: 10 }}>
                  {attachmentsError}
                </Text>
                <TouchableOpacity
                  style={[styles.downloadBtn, { backgroundColor: NAVY }]}
                  onPress={loadAttachments}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="reload" size={18} color="#fff" />
                  <Text style={styles.downloadText}>Retry</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : attachments.length > 0 && (
            <View style={styles.attachSection}>
              <Text style={styles.attachLabel}>Attachments</Text>

              {attachments.map((attachment, index) => {
                const filePath = attachment.filePath;
                const url = toPublicUrl(filePath);

                return isImage(filePath) ? (
                  <View key={attachment.attachmentId || index} style={{ marginBottom: 14 }}>
                    (
                    <View
                      key={attachment.attachmentId || index}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 12,
                        padding: 15,
                        marginBottom: 14,
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <View
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginRight: 10,
                          }}
                        >
                          <MaterialCommunityIcons
                            name="file-pdf-box"
                            size={36}
                            color="#D32F2F"
                          />

                          <Text
                            numberOfLines={1}
                            style={{
                              marginLeft: 10,
                              flex: 1,
                              fontSize: 14,
                              color: '#334155',
                              fontWeight: '600',
                            }}
                          >
                            {filePath.split('/').pop().split('\\').pop()}
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => handleDownload(url)}
                          activeOpacity={0.8}
                          style={{
                            backgroundColor: NAVY,
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: '#FFFFFF',
                              fontWeight: '700',
                              fontSize: 13,
                            }}
                          >
                            Download
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    )


                  </View>
                ) : (
                  <TouchableOpacity
                    key={attachment.attachmentId || index}
                    style={[styles.downloadBtn, { marginBottom: 14 }]}
                    onPress={() => handleDownload(url)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="download-outline" size={18} color="#fff" />
                    <Text style={styles.downloadText}>Download Attachment</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
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