import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Modal, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { activityService } from '../services/activityService';
import api from '../utils/api';
import { ActivityDetailScreenStyles as styles } from './screenStyles';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';

const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
// Some endpoints return a raw disk path like "Uploads\activities\xyz.jpg"
// instead of a loadable URL — normalize it so <Image> can actually fetch it.
const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const idx = filePath.indexOf('Uploads\\');
  if (idx === -1) return filePath;
  const relative = filePath.substring(idx).replace(/\\/g, '/');
  return `${API_BASE}/${relative}`;
};

const isImage = (fileName = '') => /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(fileName);

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const ActivityDetailScreen = ({ route, navigation }) => {
  const { activityId } = route.params;

  const [activity,    setActivity]    = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [imgViewer,   setImgViewer]   = useState(null);

  useEffect(() => {
    init();
  }, [activityId]);

  const init = async () => {
    setLoading(true);
    try {
      await Promise.all([loadActivity(), loadAttachments()]);
    } finally {
      setLoading(false);
    }
  };

  const loadActivity = async () => {
    try {
      const res = await activityService.getById(activityId);
      if (res.success) setActivity(res.data);
    } catch (e) {
      console.error('loadActivity error:', e);
    }
  };

  const loadAttachments = useCallback(async () => {
    try {
      const res = await activityService.getAttachments(activityId);
      if (res.success) setAttachments(res.data || []);
    } catch (e) {
      console.error('loadAttachments error:', e);
    }
  }, [activityId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={NAVY} />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Activity not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      {/* Header */}
      
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🗓️ Activity</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{activity.activityName}</Text>

        {/* Gold divider */}
   

        {/* Meta rows */}
        <View style={styles.metaWrap}>
          {activity.activityDate ? (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="calendar-check-outline" size={16} color={GOLD} />
              <Text style={styles.metaText}>{formatDate(activity.activityDate)}</Text>
            </View>
          ) : null}
          {activity.time ? (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={GOLD} />
              <Text style={styles.metaText}>{activity.time}</Text>
            </View>
          ) : null}
          {activity.venue ? (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color={GOLD} />
              <Text style={styles.metaText}>{activity.venue}</Text>
            </View>
          ) : null}
          {activity.chiefGuest ? (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="account-star-outline" size={16} color={GOLD} />
              <Text style={styles.metaText}>{activity.chiefGuest}</Text>
            </View>
          ) : null}
        </View>

        {/* Description */}
        {activity.description ? (
          <View style={styles.descCard}>
            <Text style={styles.descLabel}>About this activity</Text>
            <Text style={styles.descText}>{activity.description}</Text>
          </View>
        ) : null}

        {/* Attachments */}
        <View style={styles.attachSection}>
          <Text style={styles.attachLabel}>
            Attachments{attachments.length > 0 ? ` (${attachments.length})` : ''}
          </Text>

          {attachments.length === 0 ? (
            <Text style={styles.noAttach}>No attachments yet.</Text>
          ) : (
            attachments.map((attachment, index) => {
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
            })
          )}
        </View>

      </ScrollView>

      {/* Image viewer modal */}
      <Modal visible={!!imgViewer} transparent animationType="fade" onRequestClose={() => setImgViewer(null)}>
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setImgViewer(null)}>
            <MaterialCommunityIcons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: imgViewer }} style={styles.viewerImage} resizeMode="contain" />
        </View>
      </Modal>
    </View>
  );
};



export default ActivityDetailScreen;