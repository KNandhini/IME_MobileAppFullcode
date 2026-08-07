import { COLORS } from './theme';
import React, { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, FlatList, RefreshControl, Alert, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card, IconButton, Searchbar, Chip, FAB } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { memberService } from '../services/memberService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MemberManagementScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── same helper used in AchievementsScreen ────────────────────────────────────
const blobToDataUri = (blob) => {
  if (!blob) return null;
  if (typeof blob === 'string' && blob.startsWith('data:')) return blob;
  return `data:image/jpeg;base64,${blob}`;
};

const FILTER_STATUSES = ['All', 'Active', 'Pending', 'Inactive'];

const MemberManagementScreen = ({ navigation }) => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const insets = useSafeAreaInsets();
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
      // Step 1: Get userData from AsyncStorage
      const userDataStr = await AsyncStorage.getItem('userData');
      if (!userDataStr) {
        Alert.alert('Error', 'User session not found. Please login again.');
        return;
      }
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
        Alert.alert('Error', getSafeErrorMessage(profileResponse));
        return;
      }
      const clubId = profileResponse.data?.clubId ?? profileResponse.data?.ClubId;
      if (!clubId) {
        Alert.alert('Error', 'Club not assigned to this member.');
        return;
      }

      // Step 4: Load members by clubId
      const response = await memberService.getMembersByClub(clubId);
      if (response.success) {
        const memberList = response.data ?? [];
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
            const photosResponse = await memberService.getMemberPhotosByIds(memberIds);
            if (photosResponse.success && Array.isArray(photosResponse.data)) {
              photosResponse.data.forEach((p) => {
                const id = p.memberId ?? p.MemberId;
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

        setPhotoMap(map);
        setMembers(memberList);
      } else {
        Alert.alert('Error', getSafeErrorMessage(response));
      }
    } catch (error) {
      Alert.alert('Error', getSafeErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── effective status ─────────────────────────────────────────────
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
                Alert.alert('Error', getSafeErrorMessage(response));
              }
            } catch {
              Alert.alert('Error', 'Failed to delete member');
            }
          },
        },
      ]
    );
  };

  // ── Active = green, Inactive = red, Pending/Unknown stay light ──
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#2E7D32';     // green
      case 'Pending': return '#FFF3E0';    // light amber
      case 'Inactive': return '#D32F2F';   // red
      default: return '#EEEEEE';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'Active': return COLORS.white;     // white on green
      case 'Pending': return '#EF6C00';
      case 'Inactive': return COLORS.white;   // white on red
      default: return '#424242';
    }
  };

  const renderMember = ({ item }) => {
    // ── Resolve photo: blob map first, then profilePhotoPath URL ─────────────
    const id = item.memberId ?? item.MemberId;
    const photoUri = id ? (photoMap[id] ?? null) : null;

    const fallbackUri = item.profilePhotoPath
      ? { uri: item.profilePhotoPath }
      : null;

    const photoSource = photoUri ? { uri: photoUri } : fallbackUri;

    return (
      <Card style={[styles.card, { position: 'relative' }]}>
        <Card.Content>

          {/* ── TOP ROW: status badge (left) — Edit/Delete (right) ── */}
          <View style={styles.cardTopRow}>
            <View
              style={[
                styles.cornerBadge,
                { backgroundColor: getStatusColor(item.effectiveStatus) },
              ]}
            >
              <Text style={[styles.cornerBadgeText, { color: getStatusTextColor(item.effectiveStatus) }]}>
                {item.effectiveStatus || 'Unknown'}
              </Text>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={async () => {
    const res = await memberService.getProfile(item.memberId);

    if (res.success) {
        navigation.navigate('MemberEdit', {
            member: res.data,
        });
    }
}}
                style={styles.iconBotton}
                hitSlop={{ top: 8, bottom: 6, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={22}
                  color={COLORS.dark}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  handleDeleteMember(item.memberId, item.fullName)
                }
                style={styles.iconBotton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons
                  name="delete-outline"
                  size={22}
                  color="#F44336"
                />
              </TouchableOpacity>
            </View>
          </View>

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
            </View>
          </View>

          {item.designationName && (
            <Text style={styles.designation}>{item.designationName}</Text>
          )}
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
        style={[styles.searchBar, { backgroundColor: COLORS.white }]}
      />

      <View style={styles.filters}>
  {FILTER_STATUSES.map((status) => (
    <TouchableOpacity key={status} onPress={() => setFilterStatus(status)}>
      <Chip
        selected={filterStatus === status}
        style={[styles.chip, filterStatus === status && styles.chipSelected]}
        textStyle={[
          styles.chipText,
          filterStatus === status && styles.chipTextSelected,
        ]}
        selectedColor={filterStatus === status ? '#FFFFFF' : undefined}
      >
        {status}
      </Chip>
    </TouchableOpacity>
  ))}
</View>

      {loading && filteredMembers.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <FlatList
          data={filteredMembers}
          renderItem={renderMember}
          keyExtractor={(item) => item.memberId.toString()}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No members found</Text>
              </View>
            )
          }
        />
      )}

      {/* ── Add Admin ── */}
      <FAB
        icon="account-plus"
        label="Add Admin"
        style={[styles.fab, { bottom: 24 + insets.bottom }]}
        color={COLORS.fabIcon}
        onPress={() => navigation.navigate('AdminSignup')}
      />
    </View>
  );
};

export default MemberManagementScreen;
