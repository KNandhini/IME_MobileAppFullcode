import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { achievementService } from '../services/achievementService';
import { memberService } from '../services/memberService';
import { useAuth } from '../context/AuthContext';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';
const AVATAR_COLORS = ['#1E3A5F', '#D4A017', '#27AE60', '#8E44AD', '#E67E22', '#2980B9'];

const blobToDataUri = (blob) => {
  if (!blob) return null;
  if (typeof blob === 'string' && blob.startsWith('data:')) return blob;
  return `data:image/jpeg;base64,${blob}`;
};

// ── Achievement Card ──────────────────────────────────────────────────────────
const AchievementCard = ({ item, onPress, onDelete, onEdit, index, photoMap }) => {
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
        <View style={s.cardActions}>
          <TouchableOpacity
            onPress={() => onEdit(item)}
            style={s.editBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={s.editText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(item.achievementId)}
            style={s.deleteBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={s.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
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
  const [refreshing, setRefreshing] = useState(false);
  const [photoMap, setPhotoMap] = useState({});
  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const load = async () => {
    try {
      // ── Step 1: load achievements ───────────────────────────────────────────
      const achRes = await achievementService.getAll();
      const achList = achRes?.success ? (achRes.data ?? []) : [];
      if (achRes?.success) setAchievements(achList);

      // ── Step 2: fetch ALL members once (not per-member) ─────────────────────
      const membersRes = await memberService.getAllMembers(1, 200);
      const members = membersRes?.success ? (membersRes.data ?? []) : [];
      if (members.length === 0) return;

      // ── Step 3: build memberId → data-URI map from profilePhoto blob ─────────
      const map = {};
      members.forEach((m) => {
        const id = m.memberId ?? m.MemberId;
        const blob =
          m.profilePhoto ?? m.ProfilePhoto ?? m.photo ?? m.Photo ?? null;
        if (id && blob) {
          const uri = blobToDataUri(blob);
          if (uri) map[id] = uri;
        }
      });

      console.log('[AchievementsScreen] photoMap keys:', Object.keys(map));
      setPhotoMap(map);
    } catch (e) {
      console.error('Achievements load error:', e);
    } finally {
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

      {achievements.length === 0 && !refreshing ? (
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
           //   onPress={() => navigation.navigate('AchievementDetail', { item })}
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

      {/* FAB */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => navigation.navigate('AchievementForm')}
        activeOpacity={0.85}
      >
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F9FC' },
  list: { padding: 16, paddingBottom: 90 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    backgroundColor: '#FEF9EC',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    color: '#B7791F',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardActions: { flexDirection: 'row', gap: 8 },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#BFDBFE',
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#FECACA',
  },
  editText: { fontSize: 12, color: '#2563EB', fontWeight: '600' },
  deleteText: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  photo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
    borderWidth: 2,
    borderColor: GOLD,
  },
  photoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: GOLD,
  },
  photoPlaceholderText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  textContainer: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '700', color: '#1A202C', marginBottom: 2 },
  achTitle: { fontSize: 13, fontWeight: '600', color: '#4A5568', marginBottom: 4 },
  description: { fontSize: 13, color: '#718096', lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  date: { fontSize: 11, color: '#A0AEC0' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#2D3748', marginTop: 12, marginBottom: 4 },
  emptyText: { fontSize: 14, color: '#A0AEC0' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    zIndex: 100,
  },
  fabText: { color: GOLD, fontSize: 24, fontWeight: '700', lineHeight: 28 },
});

export default AchievementsScreen;