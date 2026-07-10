import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, StatusBar, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { achievementService } from '../services/achievementService';
import { memberService } from '../services/memberService';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';  // ← ADD
import { BASE_URL } from '../utils/api';                                // ← ADD
import { AchievementsScreenS as s } from './screenStyles';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';
const AVATAR_COLORS = ['#1E3A5F', '#D4A017', '#27AE60', '#8E44AD', '#E67E22', '#2980B9'];

const blobToDataUri = (blob) => {
  if (!blob) return null;
  if (typeof blob === 'string' && blob.startsWith('data:')) return blob;
  return `data:image/jpeg;base64,${blob}`;
};

// ── Achievement Card ──────────────────────────────────────────────────────────
const AchievementCard = ({ item, onPress, onDelete, onEdit, index, photoMap, userRole }) => {  // ← ADD userRole
  const [imgError, setImgError] = useState(false);
  const bg = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initials = (item.memberName || 'M')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const dateStr = item.achievementDate
    ? new Date(item.achievementDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    : '';

  const memberId = item.memberId ?? item.MemberId ?? null;
  const photoUri = memberId ? (photoMap[memberId] ?? null) : null;
  const showPhoto = photoUri && !imgError;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      {/* ── TOP ROW: badge + actions ── */}
      <View style={s.cardTopRow}>
        <View style={s.badge}>
          <Text style={s.badgeText}>🏆 Achievement</Text>
        </View>

        {/* ── HIDE Edit/Delete for Member role ── */}
        {userRole === 'Admin' && (
          <View style={s.cardActions}>
            <TouchableOpacity
              onPress={() => onEdit(item)}
              style={s.iconBotton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={22}
                color="#1E3A5F"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onDelete(item.achievementId)}
              style={s.iconBotton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name="delete-outline"
                size={22}
                color="#D9534F"
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── CONTENT ROW ── */}
      <View style={s.cardRow}>
        {showPhoto ? (
          <Image
            source={{ uri: photoUri }}
            style={s.photo}
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={[s.photoPlaceholder, { backgroundColor: bg }]}>
            <Text style={s.photoPlaceholderText}>{initials}</Text>
          </View>
        )}
        <View style={s.textContainer}>
          <Text style={s.memberName} numberOfLines={1}>
            {item.memberName || 'Member'}
          </Text>
          <Text style={s.achTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {!!item.description && (
            <Text style={s.description} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          {!!dateStr && (
            <View style={s.metaRow}>
              <Text style={s.date}>{dateStr}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const AchievementsScreen = ({ navigation }) => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [photoMap, setPhotoMap] = useState({});
  const [userRole, setUserRole] = useState(null);  // ← ADD
  const { user } = useAuth();

  // ── Load role once on mount ───────────────────────────────────────────────
  useEffect(() => {                                                     // ← ADD
    const loadRole = async () => {
      const raw = await AsyncStorage.getItem('userData');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const role = (parsed.roleName || parsed.role || '').trim().toLowerCase();
      setUserRole(role === 'admin' ? 'Admin' : 'Member');
    };
    loadRole();
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const load = async () => {
    try {
      // Step 1: load achievements
      const achRes = await achievementService.getAll();
      const achList = achRes?.success ? (achRes.data ?? []) : [];
      if (achRes?.success) setAchievements(achList);

      // Step 2: extract unique memberIds from achievements
      const uniqueMemberIds = [
        ...new Set(
          achList
            .map(a => a.memberId ?? a.MemberId)
            .filter(Boolean)
        )
      ];

      if (uniqueMemberIds.length === 0) return;

      // Step 3: fetch ONLY those member photos
      const photoRes = await memberService.getMemberPhotosByIds(uniqueMemberIds);
      if (photoRes?.success && photoRes?.data?.length > 0) {
        const map = {};
        photoRes.data.forEach((p) => {
          const id = p.memberId ?? p.MemberId;
          if (!id) return;
          if (p.profilePhotoPath) {
            map[id] = p.profilePhotoPath.startsWith('http')
              ? p.profilePhotoPath
              : `${BASE_URL}/Uploads/${p.profilePhotoPath.replace(/\\/g, '/').replace(/^Uploads\/?/i, '')}`;
          } else if (p.profilePhotoBase64) {
            map[id] = `data:image/jpeg;base64,${p.profilePhotoBase64}`;
          }
        });
        setPhotoMap(map);
      }
    } catch (e) {
      console.error('Achievements load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Achievement',
      'Are you sure you want to delete this achievement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await achievementService.delete(id);
              load();
            } catch {
              Alert.alert('Error', 'Failed to delete.');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (item) => {
    navigation.navigate('AchievementForm', { item });
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={s.loadingText}>Loading achievements...</Text>
        </View>
      ) : achievements.length === 0 && !refreshing ? (
        <View style={s.centered}>
          <MaterialCommunityIcons name="trophy-outline" size={56} color="#CBD5E1" />
          <Text style={s.emptyTitle}>No achievements yet</Text>
          <Text style={s.emptyText}>Tap + to add one!</Text>
        </View>
      ) : (
        <FlatList
          data={achievements}
          renderItem={({ item, index }) => (
            <AchievementCard
              item={item}
              index={index}
              photoMap={photoMap}
              userRole={userRole}   // ← ADD
              onPress={() =>
                navigation.navigate('AchievementDetail', {
                  item,
                  memberPhoto: item.memberId
                    ? (photoMap[item.memberId] ?? null)
                    : null,
                })
              }
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          )}
          keyExtractor={(item) => item.achievementId.toString()}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[NAVY]}
            />
          }
        />
      )}

      {/* FAB — Admin only */}
      {userRole === 'Admin' && (                        // ← ADD
        <TouchableOpacity
          style={s.fab}
          onPress={() => navigation.navigate('AchievementForm')}
          activeOpacity={0.85}
        >
          <Text style={s.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};



export default AchievementsScreen;
