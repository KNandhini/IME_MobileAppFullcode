// Place in: src/screens/ClubDetailScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { clubService } from '../services/clubService';
import api from '../utils/api';
import { ClubDetailScreenStyles as styles } from './screenStyles';

const NAVY = '#252943';
const GOLD = '#A0C878';

const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const idx = filePath.search(/uploads[\\/]/i);
  if (idx === -1) return filePath;
  const relative = filePath.substring(idx).replace(/\\/g, '/');
  return `${API_BASE}/${relative}`;
};

const formatDate = (str) => {
  if (!str) return '';
  return str.substring(0, 10);
};

const ClubDetailScreen = ({ navigation, route }) => {
  const { clubId, item: preloadedItem } = route.params || {};

  const [detail, setDetail] = useState(preloadedItem ?? null);
  const [loading, setLoading] = useState(!preloadedItem);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    loadDetail();
  }, [clubId]);

  const loadDetail = async () => {
    const id = clubId ?? preloadedItem?.clubId;
    if (!id) return;
    try {
      setLoading(true);
      const res = await clubService.getById(id);
      const data = res?.data ?? res;
      if (data) setDetail(data);
    } catch (e) {
      console.error('ClubDetail load error:', e);
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.fullCenter}>
        <StatusBar backgroundColor={NAVY} barStyle="light-content" />
        <ActivityIndicator size="large" color={NAVY} />
      </View>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (!detail) {
    return (
      <View style={styles.fullCenter}>
        <StatusBar backgroundColor={NAVY} barStyle="light-content" />
        <Text style={styles.errorText}>Unable to load club details.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const logoUri = toPublicUrl(detail.logoPath);
  const initial = (detail.clubName || '?').charAt(0).toUpperCase();
  const locationLine = [detail.city, detail.district, detail.stateName, detail.countryName]
    .filter(Boolean)
    .join(', ');
  const addressLine = [detail.addressLine1, detail.addressLine2, detail.pincode]
    .filter(Boolean)
    .join(', ');

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Club Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Status badge ── */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, detail.isActive ? styles.badgeActive : styles.badgeInactive]}>
            <Text style={[styles.badgeText, detail.isActive ? styles.badgeTextActive : styles.badgeTextInactive]}>
              {detail.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
          {!!detail.clubType && (
            <View style={styles.typePill}>
              <Text style={styles.typePillText}>{detail.clubType}</Text>
            </View>
          )}
        </View>

        {/* ── Avatar + title block ── */}
        <View style={styles.titleBlock}>
          {logoUri && !imgError ? (
            <Image
              source={{ uri: logoUri }}
              style={styles.avatar}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>{initial}</Text>
            </View>
          )}

          <View style={styles.titleMeta}>
            <Text style={styles.title}>{detail.clubName}</Text>
            {!!detail.clubCode && (
              <Text style={styles.clubCode}>Code: {detail.clubCode}</Text>
            )}
          </View>
        </View>

        {/* ── Key stats row ── */}
        <View style={styles.statsRow}>
          {detail.totalMembers != null && (
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Members</Text>
              <Text style={styles.statValue}>{detail.totalMembers}</Text>
            </View>
          )}
          {!!detail.establishedDate && (
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Established</Text>
              <Text style={styles.statValue}>{formatDate(detail.establishedDate)}</Text>
            </View>
          )}
          {!!detail.registrationNumber && (
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Reg. No.</Text>
              <Text style={styles.statValue}>{detail.registrationNumber}</Text>
            </View>
          )}
        </View>

        {/* ── Description ── */}
        {!!detail.description && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DESCRIPTION</Text>
            <Text style={styles.descriptionText}>{detail.description}</Text>
          </View>
        )}

        {/* ── Location ── */}
        {(locationLine || addressLine) && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>LOCATION</Text>
            {!!addressLine && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={16} color={GOLD} />
                <Text style={styles.infoText}>{addressLine}</Text>
              </View>
            )}
            {!!locationLine && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="earth" size={16} color={GOLD} />
                <Text style={styles.infoText}>{locationLine}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Contact ── */}
        {(detail.contactPersonName || detail.contactNumber || detail.alternateNumber || detail.email || detail.website) && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CONTACT</Text>
            {!!detail.contactPersonName && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="account-outline" size={16} color={GOLD} />
                <Text style={styles.infoText}>{detail.contactPersonName}</Text>
              </View>
            )}
            {!!detail.contactNumber && (
              <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`tel:${detail.contactNumber}`)}>
                <MaterialCommunityIcons name="phone-outline" size={16} color={GOLD} />
                <Text style={[styles.infoText, styles.linkText]}>{detail.contactNumber}</Text>
              </TouchableOpacity>
            )}
            {!!detail.alternateNumber && (
              <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`tel:${detail.alternateNumber}`)}>
                <MaterialCommunityIcons name="phone-plus-outline" size={16} color={GOLD} />
                <Text style={[styles.infoText, styles.linkText]}>{detail.alternateNumber}</Text>
              </TouchableOpacity>
            )}
            {!!detail.email && (
              <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`mailto:${detail.email}`)}>
                <MaterialCommunityIcons name="email-outline" size={16} color={GOLD} />
                <Text style={[styles.infoText, styles.linkText]}>{detail.email}</Text>
              </TouchableOpacity>
            )}
            {!!detail.website && (
              <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(detail.website)}>
                <MaterialCommunityIcons name="web" size={16} color={GOLD} />
                <Text style={[styles.infoText, styles.linkText]} numberOfLines={1}>{detail.website}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Admin members ── */}
        {!!detail.adminMemberNames && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ADMIN MEMBERS</Text>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account-multiple-outline" size={16} color={GOLD} />
              <Text style={styles.infoText}>{detail.adminMemberNames}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ClubDetailScreen;