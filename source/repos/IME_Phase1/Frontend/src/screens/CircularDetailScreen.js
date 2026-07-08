import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Linking, Share, Image, Modal, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { circularService } from '../services/circularService';
import api from '../utils/api';
import { CircularDetailScreenStyles as styles } from './screenStyles';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';

// api.defaults.baseURL is usually something like "http://host:port/api"
// strip the trailing "/api" so we get the plain server root to prefix
// the raw disk-style paths ("Uploads\circulars\xyz.jpg") that come back
// from the backend.
const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

// filePath from the server can be a raw disk path like "Uploads\circulars\xyz.jpg"
// (or "uploads/circulars/xyz.jpg") — convert it into a URL the app can load/display/download.
const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const idx = filePath.search(/uploads[\\/]/i);
  if (idx === -1) return filePath;
  const relative = filePath.substring(idx).replace(/\\/g, '/');
  return `${API_BASE}/${relative}`;
};

const CircularDetailScreen = ({ route, navigation }) => {
  const { item } = route.params || {};
  const [attachments, setAttachments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [imgViewer,   setImgViewer]   = useState(null);

  if (!item) return null;

  useEffect(() => { loadAttachments(); }, []);

  const loadAttachments = async () => {
    try {
      const res = await circularService.getById(item.circularId);
      if (res?.success) setAttachments(res.data?.attachments ?? []);
    } catch (e) {
      console.error('Load attachments error:', e);
    } finally {
      setLoading(false);
    }
  };

  const isImage = (path = '') => /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(path);

  const publishDate = item.publishDate
    ? new Date(item.publishDate).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '';

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${item.title}\n\n${item.description || ''}\n\nPublished: ${publishDate}`,
        title: item.title,
      });
    } catch {}
  };

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Circular</Text>
        <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
          <MaterialCommunityIcons name="share-variant-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Circular number chip */}
        {item.circularNumber ? (
          <View style={styles.chipWrap}>
            <View style={styles.chip}>
              <MaterialCommunityIcons name="file-document-outline" size={14} color={NAVY} />
              <Text style={styles.chipText}>{item.circularNumber}</Text>
            </View>
          </View>
        ) : null}

        {/* Title */}
        <Text style={styles.title}>{item.title}</Text>

        {/* Date + gold bar */}
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="calendar-outline" size={15} color={GOLD} />
          <Text style={styles.metaText}>{publishDate || 'Date not specified'}</Text>
        </View>
        <View style={styles.goldDivider} />

        {/* Description */}
        {item.description ? (
          <Text style={styles.description}>{item.description}</Text>
        ) : (
          <Text style={styles.noDesc}>No additional details provided.</Text>
        )}

        {/* ── Attachments ── */}
        <View style={styles.attachSection}>
          <Text style={styles.attachLabel}>Attachments</Text>

          {loading ? (
            <ActivityIndicator size="small" color={NAVY} style={{ marginTop: 10 }} />
          ) : attachments.length === 0 ? (
            <Text style={styles.noAttach}>No attachments.</Text>
          ) : (
            attachments.map((att, index) => {
              const filePath = att.filePath ?? att.FilePath ?? '';
              const url = toPublicUrl(filePath);
              return isImage(filePath) ? (
                <TouchableOpacity
                  key={att.attachmentId ?? index}
                  onPress={() => setImgViewer(url)}
                  activeOpacity={0.85}
                  style={{ marginBottom: 14 }}
                >
                  <Image
                    source={{ uri: url }}
                    style={styles.attachImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.attachHint}>Tap to enlarge</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  key={att.attachmentId ?? index}
                  style={styles.downloadBtn}
                  onPress={() => Linking.openURL(url)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="download-outline" size={18} color="#fff" />
                  <Text style={styles.downloadText}>
                    {att.fileName ?? 'Download Attachment'}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

      </ScrollView>

      {/* Image viewer modal */}
      <Modal
        visible={!!imgViewer}
        transparent
        animationType="fade"
        onRequestClose={() => setImgViewer(null)}
      >
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setImgViewer(null)}>
            <MaterialCommunityIcons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          {imgViewer && (
            <Image
              source={{ uri: imgViewer }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
};



export default CircularDetailScreen;