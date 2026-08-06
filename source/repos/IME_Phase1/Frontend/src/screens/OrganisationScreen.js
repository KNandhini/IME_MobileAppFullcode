import { COLORS } from './theme';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Image, ActivityIndicator } from 'react-native';
import { Card } from 'react-native-paper';
import { organisationService } from '../services/organisationService';
import api from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { OrganisationScreenStyles as styles } from './screenStyles';
// ─── CONFIG ───────────────────────────────────────────────────────────────────
//const CLUB_ID = 1; // replace with your actual clubId or read from auth context

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fetchPhotosMap = async (memberIds) => {
  if (!memberIds.length) return new Map();
  try {
    const ids = memberIds.join(',');
    const response = await api.get(`/Member/photos-by-ids?memberIds=${ids}`);
    const json = response.data;
    const map = new Map();
    if (json.success && Array.isArray(json.data)) {
      json.data.forEach((p) => {
        map.set(p.memberId, p.profilePhotoBase64 || p.profilePhotoPath || null);
      });
    }
    return map;
  } catch (e) {
    console.warn('Failed to fetch photos:', e);
    return new Map();
  }
};

// ─── AVATAR ───────────────────────────────────────────────────────────────────
const Avatar = ({ photoData, name }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  if (photoData) {
    const uri = photoData.startsWith('data:')
      ? photoData
      : photoData.startsWith('http')
      ? photoData
      : `data:image/jpeg;base64,${photoData}`;

    return <Image source={{ uri }} style={styles.photo} />;
  }

  return (
    <View style={styles.photoPlaceholder}>
      <Text style={styles.photoPlaceholderText}>{initial}</Text>
    </View>
  );
};

// ─── CARD ─────────────────────────────────────────────────────────────────────
const toTitleCase = (text) => {
  if (!text) return '';

  return text
    .toLowerCase()
    .split(' ')
    .map(
      word => word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
};

const MemberCard = ({ item, photoData }) => (
  <Card style={styles.card}>
    <View style={styles.cardContent}>
      <Avatar
        photoData={photoData}
        name={item.fullName}
      />

      <View style={styles.textContainer}>
      <Text style={styles.name}>
  {toTitleCase(item.fullName)}
</Text>

<View style={styles.row}>
  <Icon name="office-building" size={16} color="#666" />
  <Text style={styles.infoText}>
    {toTitleCase(item.clubName)}
  </Text>
</View>

<View style={styles.row}>
  <Icon name="account-tie" size={16} color={COLORS.primary} />
  <Text style={styles.role}>
     {toTitleCase(item.roleName)}
  </Text>
</View>

<View style={styles.row}>
  <Icon name="email-outline" size={16} color="#666" />
  <Text style={styles.detail}>
    {item.email?.toLowerCase()}
  </Text>
</View>

<View style={styles.row}>
  <Icon name="phone-outline" size={16} color="#666" />
  <Text style={styles.detail}>
    {item.contactNumber}
  </Text>
</View>
      
      </View>
    </View>
  </Card>
);

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
const OrganisationScreen = () => {
  const [members, setMembers]       = useState([]);
  const [photosMap, setPhotosMap]   = useState(new Map());
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadAdmins = useCallback(async () => {
  setLoading(true);

  try {
    debugger;
    // Read userData from AsyncStorage
    const userDataString = await AsyncStorage.getItem('userData');

    if (!userDataString) {
      console.warn('No userData found in storage');
      return;
    }

    const userData = JSON.parse(userDataString);

    const clubId = userData.clubId;

    console.log('ClubId from storage:', clubId);

    const response = await organisationService.getAdminsByClub(clubId);

    console.log(
      'getAdminsByClub raw response:',
      JSON.stringify(response)
    );

    if (!response?.success) {
      console.warn('API returned success=false:', response);
      return;
    }

    const adminList = response.data ?? [];
    setMembers(adminList);

    const ids = adminList
      .map((m) => m.memberId)
      .filter(Boolean);

    if (ids.length > 0) {
      const map = await fetchPhotosMap(ids);
      setPhotosMap(map);
    }
  } catch (error) {
    debugger;
    console.error(
      'Failed to load club admins:',
      error?.response?.data ?? error
    );
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, []);
  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAdmins();
  };

  const renderMember = ({ item }) => (
    <MemberCard
      item={item}
      photoData={photosMap.get(item.memberId) ?? null}
    />
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.centered,{ backgroundColor: COLORS.white }]}>
        <ActivityIndicator size="large" color={COLORS.dark} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {members.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No admin members found</Text>
        </View>
      ) : (
        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={(item) => item.memberId.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────


export default OrganisationScreen;