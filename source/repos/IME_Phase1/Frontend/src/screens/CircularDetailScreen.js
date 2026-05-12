import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Linking, Share, Image, Modal, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { circularService } from '../services/circularService';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';

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
              return isImage(filePath) ? (
                <TouchableOpacity
                  key={att.attachmentId ?? index}
                  onPress={() => setImgViewer(filePath)}
                  activeOpacity={0.85}
                  style={{ marginBottom: 14 }}
                >
                  <Image
                    source={{ uri: filePath }}
                    style={styles.attachImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.attachHint}>Tap to enlarge</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  key={att.attachmentId ?? index}
                  style={styles.downloadBtn}
                  onPress={() => Linking.openURL(filePath)}
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: NAVY,
    paddingTop: (StatusBar.currentHeight || 0) + 6,
    paddingBottom: 12, paddingHorizontal: 12,
  },
  headerBtn:   { padding: 6, borderRadius: 20 },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: '700' },

  body: { padding: 20, paddingBottom: 40 },

  chipWrap: { marginBottom: 14 },
  chip: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  chipText: { color: NAVY, fontSize: 12, fontWeight: '700', marginLeft: 5, letterSpacing: 0.3 },

  title:       { fontSize: 22, fontWeight: '800', color: '#0F172A', lineHeight: 30, marginBottom: 14 },
  metaRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  metaText:    { color: '#64748B', fontSize: 13, fontWeight: '500', marginLeft: 6 },
  goldDivider: { height: 3, width: 48, backgroundColor: GOLD, borderRadius: 2, marginBottom: 20 },
  description: { fontSize: 15, color: '#334155', lineHeight: 24, marginBottom: 24 },
  noDesc:      { fontSize: 14, color: '#94A3B8', fontStyle: 'italic' },

  attachSection: { width: '100%', marginTop: 8 },
  attachLabel:   { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  noAttach:      { fontSize: 13, color: '#94A3B8', fontStyle: 'italic' },
  attachImage:   { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#fff' },
  attachHint:    { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 6 },
  downloadBtn:   { flexDirection: 'row', alignItems: 'center', backgroundColor: NAVY, borderRadius: 10, padding: 14, marginBottom: 10 },
  downloadText:  { color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 8, flex: 1 },

  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  viewerClose:   { position: 'absolute', top: 40, right: 20, padding: 8 },
  viewerImage:   { width: '100%', height: '80%' },
});

export default CircularDetailScreen;