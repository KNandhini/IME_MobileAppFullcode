import React, { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  Alert, Image,
} from 'react-native';
import { Card, IconButton, Searchbar, Chip, FAB } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { memberService } from '../services/memberService';

// ── same helper used in AchievementsScreen ────────────────────────────────────
const blobToDataUri = (blob) => {
  if (!blob) return null;
  if (typeof blob === 'string' && blob.startsWith('data:')) return blob;
  return `data:image/jpeg;base64,${blob}`;
};

const MemberManagementScreen = ({ navigation }) => {
  const [members, setMembers]                 = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [refreshing, setRefreshing]           = useState(false);
  const [searchQuery, setSearchQuery]         = useState('');
  const [filterStatus, setFilterStatus]       = useState('All');

  // ── photoMap: memberId → data-URI (same pattern as AchievementsScreen) ──────
  const [photoMap, setPhotoMap] = useState({});

 useFocusEffect(
  useCallback(() => {
    loadMembers();
  }, [navigation])
);
  useEffect(() => { filterMembers(); }, [searchQuery, filterStatus, members]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      debugger;
      // Step 1: Get userData from AsyncStorage
      const userDataStr = await AsyncStorage.getItem('userData');
      if (!userDataStr) {
        Alert.alert('Error', 'User session not found. Please login again.');
        return;
      }
debugger;
      // Step 2: Parse and extract memberId
      const userData = JSON.parse(userDataStr);
      const memberId = userData?.memberId ?? userData?.MemberId;
      if (!memberId) {
        Alert.alert('Error', 'Member information not found. Please login again.');
        return;
      }

      // Step 3: Call profile API to get clubId
      const profileResponse = await memberService.getProfile(memberId);
      if (!profileResponse.success) {
        Alert.alert('Error', profileResponse.message || 'Failed to get member profile');
        return;
      }
debugger;
      const clubId = profileResponse.data?.clubId ?? profileResponse.data?.ClubId;
      if (!clubId) {
        Alert.alert('Error', 'Club not assigned to this member.');
        return;
      }

      // Step 4: Load members by clubId
const response = await memberService.getMembersByClub(clubId);
if (response.success) {
  const memberList = response.data ?? [];
 debugger;
  // ── Step 5: Fetch photos via /api/Member/photos-by-ids ──────────────────
  const map = {};
  try {
   const memberIds = [
        ...new Set(
          memberList
            .map(a => a.memberId ?? a.MemberId)
            .filter(Boolean)
        )
      ];
       if (memberIds.length === 0) return;
    if (memberIds) {
      const photosResponse = await memberService.
getMemberPhotosByIds
(memberIds);
      if (photosResponse.success && Array.isArray(photosResponse.data)) {
        photosResponse.data.forEach((p) => {
          const id = p.memberId ?? p.MemberId;
          // Prefer base64 blob, fall back to URL path
          const uri = p.profilePhotoBase64
            ? blobToDataUri(p.profilePhotoBase64)
            : p.profilePhotoPath
            ? p.profilePhotoPath
            : null;
          if (id && uri) map[id] = uri;
        });
      }
    }
  } catch (photoErr) {
    console.warn('[MemberManagementScreen] Failed to load photos:', photoErr?.message);
  }
 
  console.log('[MemberManagementScreen] photoMap keys:', Object.keys(map));
  setPhotoMap(map);
  setMembers(memberList);
} else {
  Alert.alert('Error', response.message || 'Failed to load members');
}
    } catch (error) {
      Alert.alert('Error', 'Failed to load members: ' + (error?.message || ''));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── effective status (unchanged) ─────────────────────────────────────────────
  const getEffectiveStatus = (member) => {
    if (member.membershipStatus === 'Active') return 'Active';
    if (member.membershipStatus === 'Pending') {
      if (!member.graceExpiryDate) return 'Pending';
      return new Date(member.graceExpiryDate) >= new Date() ? 'Pending' : 'Inactive';
    }
    return member.membershipStatus || 'Unknown';
  };

  const filterMembers = () => {
    let filtered = members.map((m) => ({
      ...m,
      effectiveStatus: getEffectiveStatus(m),
    }));

    if (filterStatus !== 'All') {
      filtered = filtered.filter((m) => m.effectiveStatus === filterStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.fullName?.toLowerCase().includes(query) ||
          m.email?.toLowerCase().includes(query) ||
          m.contactNumber?.includes(query)
      );
    }
    setFilteredMembers(filtered);
  };

  const onRefresh = () => { setRefreshing(true); loadMembers(); };

  const handleDeleteMember = (memberId, memberName) => {
    Alert.alert(
      'Delete Member',
      `Are you sure you want to permanently delete ${memberName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              const response = await memberService.deleteMember(memberId);
              if (response.success) {
                Alert.alert('Success', 'Member deleted');
                loadMembers();
              } else {
                Alert.alert('Error', response.message || 'Failed to delete member');
              }
            } catch {
              Alert.alert('Error', 'Failed to delete member');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':   return '#E8F5E9';
      case 'Pending':  return '#FFF3E0';
      case 'Inactive': return '#FFEBEE';
      default:         return '#EEEEEE';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'Active':   return '#2E7D32';
      case 'Pending':  return '#EF6C00';
      case 'Inactive': return '#C62828';
      default:         return '#424242';
    }
  };

  const renderMember = ({ item }) => {
    // ── Resolve photo: blob map first, then profilePhotoPath URL ─────────────
    const id = item.memberId ?? item.MemberId;
    const photoUri = id ? (photoMap[id] ?? null) : null;

    // If no blob in map, fall back to profilePhotoPath (URL) like before
    const fallbackUri = item.profilePhotoPath
      ? { uri: item.profilePhotoPath }
      : null;

    const photoSource = photoUri ? { uri: photoUri } : fallbackUri;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.memberHeader}>
            {photoSource ? (
              <Image source={photoSource} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>
                  {item.fullName ? item.fullName.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{item.fullName}</Text>
              <Text style={styles.memberEmail}>{item.email}</Text>
              <Text style={styles.memberPhone}>{item.contactNumber}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.effectiveStatus) }]}>
                <Text style={[styles.statusBadgeText, { color: getStatusTextColor(item.effectiveStatus) }]}>
                  {item.effectiveStatus || 'Unknown'}
                </Text>
              </View>
            </View>
          </View>
          {item.designationName && (
            <Text style={styles.designation}>{item.designationName}</Text>
          )}
          <View style={styles.actions}>
            <IconButton
              icon="pencil"
              iconColor="#1E3A5F"
              onPress={() => navigation.navigate('MemberEdit', { memberId: item.memberId })}
            />
            <IconButton
              icon="delete"
              iconColor="#F44336"
              onPress={() => handleDeleteMember(item.memberId, item.fullName)}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search members..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <View style={styles.filters}>
        {['All', 'Active', 'Pending', 'Inactive'].map((status) => (
          <Chip
            key={status}
            selected={filterStatus === status}
            onPress={() => setFilterStatus(status)}
            style={styles.filterChip}
          >
            {status}
          </Chip>
        ))}
      </View>

      <FlatList
        data={filteredMembers}
        renderItem={renderMember}
        keyExtractor={(item) => item.memberId.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No members found</Text>
          </View>
        }
      />

      {/* ── Add Admin ── opens AdminSignupScreen (register this route in your navigator) */}
      <FAB
        icon="account-plus"
        label="Add Admin"
        style={styles.fab}
        color="#fff"
        onPress={() => navigation.navigate('AdminSignup')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#f5f5f5' },
  searchBar:            { margin: 15, elevation: 2 },
  filters:              { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 10 },
  filterChip:           { marginRight: 8 },
  list:                 { padding: 15, paddingTop: 0, paddingBottom: 90 },
  card:                 { marginBottom: 15, borderRadius: 16, backgroundColor: '#fff', elevation: 4 },
  memberHeader:         { flexDirection: 'row', alignItems: 'center' },
  photo:                { width: 60, height: 60, borderRadius: 30, marginRight: 12 },
  photoPlaceholder:     { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1976D2', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  photoPlaceholderText: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
  memberInfo:           { flex: 1 },
  memberName:           { fontSize: 18, fontWeight: 'bold', color: '#222' },
  memberEmail:          { fontSize: 13, color: '#777', marginTop: 2 },
  memberPhone:          { fontSize: 13, color: '#777' },
  statusBadge:          { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 6 },
  statusBadgeText:      { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  designation:          { fontSize: 13, color: '#999', fontStyle: 'italic', marginTop: 8 },
  actions:              { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  emptyContainer:       { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  emptyText:            { fontSize: 16, color: '#999' },
  fab:                  { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#1E3A5F' },
});

export default MemberManagementScreen;