import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Linking, Share,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';

const CircularDetailScreen = ({ route, navigation }) => {
  const { item } = route.params || {};
  if (!item) return null;

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

        {/* Attachment link */}
        {item.attachmentUrl ? (
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={() => Linking.openURL(item.attachmentUrl)}
            activeOpacity={0.8}>
            <MaterialCommunityIcons name="paperclip" size={18} color={NAVY} />
            <Text style={styles.attachText}>View Attachment</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NAVY,
    paddingTop: (StatusBar.currentHeight || 0) + 6,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  headerBtn: { padding: 6, borderRadius: 20 },
  headerTitle: {
    flex: 1, textAlign: 'center',
    color: '#fff', fontSize: 16, fontWeight: '700',
  },

  body: { padding: 20, paddingBottom: 40 },

  chipWrap: { marginBottom: 14 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: {
    color: NAVY, fontSize: 12, fontWeight: '700',
    marginLeft: 5, letterSpacing: 0.3,
  },

  title: {
    fontSize: 22, fontWeight: '800',
    color: '#0F172A', lineHeight: 30, marginBottom: 14,
  },

  metaRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
  },
  metaText: { color: '#64748B', fontSize: 13, fontWeight: '500', marginLeft: 6 },

  goldDivider: {
    height: 3, width: 48, backgroundColor: GOLD,
    borderRadius: 2, marginBottom: 20,
  },

  description: {
    fontSize: 15, color: '#334155',
    lineHeight: 24, marginBottom: 24,
  },
  noDesc: { fontSize: 14, color: '#94A3B8', fontStyle: 'italic' },

  attachBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: NAVY,
    borderRadius: 10, padding: 14, marginTop: 8,
  },
  attachText: {
    color: NAVY, fontSize: 14, fontWeight: '700', marginLeft: 10,
  },
});

export default CircularDetailScreen;
