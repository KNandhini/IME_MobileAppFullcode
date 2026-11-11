import { COLORS } from './theme';
import React, { useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, TouchableOpacity, StatusBar, Pressable, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { AppText as Text } from '../components/IMEText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { magazineService } from '../services/magazineService';
import { MagazinesScreenS as s } from './screenStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ListSearchBar from '../components/ListSearchBar';
const NAVY = COLORS.dark;
const PRIMARY = COLORS.primary;
const GOLD = COLORS.accent;

// ── Magazine Card ─────────────────────────────────────────────────────────
const MagazineCard = ({ item, onPress, onDelete, onEdit, index, userRole, isStudent }) => {
  const dateStr = item.publishedDate
    ? new Date(item.publishedDate).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '';

  const isPdf = item.attachmentPath?.toLowerCase().endsWith('.pdf');

  return (
    <View style={[s.card, cardStyles.card]}>
      <View style={[s.cardTopRow, { paddingHorizontal: 16 }]}>
        <View style={s.badge}>
          <MaterialCommunityIcons name="book-open-page-variant-outline" size={16} color={PRIMARY} />
          <Text style={[s.badgeText, cardStyles.label]}>MAGAZINE</Text>
        </View>
        {!isStudent && (
          <View style={s.actionContainer}>
            <TouchableOpacity
              onPress={() => onEdit(item)}
              style={s.iconButton}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${item.title}`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={22}
                color={COLORS.dark}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onDelete(item.magazineId)}
              style={s.iconButton}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.title}`}
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

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`View ${item.title}`}
        style={({ pressed }) => [cardStyles.content, pressed && cardStyles.pressed]}
      >
      <View style={[s.cardRow, cardStyles.body]}>
        <View style={cardStyles.cover} accessible={false}>
          <View style={cardStyles.spine} />
          <MaterialCommunityIcons name="book-open-page-variant-outline" size={32} color={COLORS.white} />
          <Text style={cardStyles.coverLabel}>IUE</Text>
        </View>
        {/*{item.attachmentPath && !isPdf ? (
          <Image source={{ uri: item.attachmentPath }} style={s.cover} />
        ) : (
          <View style={s.coverPlaceholder}>
            <MaterialCommunityIcons name="file-pdf-box" size={28} color={COLORS.white} />
          </View>
        )}*/}
        <View style={s.textContainer}>
          <Text style={[s.title, cardStyles.title]} numberOfLines={3}>{item.title}</Text>
          {!!item.issueNumber && <Text style={[s.issue, cardStyles.issue]}>{item.issueNumber}</Text>}
          {!!item.authorName && <Text style={s.author} numberOfLines={1}>By {item.authorName}</Text>}
          <View style={[s.metaRow, { flexWrap: 'wrap' }]}>
              {!!item.category && (
                <View style={s.categoryPill}><Text style={s.categoryText}>{item.category}</Text></View>
              )}
              {!!dateStr && <Text style={cardStyles.date}>{dateStr}</Text>}
          </View>
        </View>
      </View>
      <View style={cardStyles.footer}>
        <Text style={cardStyles.viewText}>Tap to view ›</Text>
      </View>
      </Pressable>
    </View>
  );
};

const cardStyles = StyleSheet.create({
  card: { padding: 0, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, paddingTop: 14 },
  label: { color: PRIMARY, fontSize: 11, letterSpacing: 1.2, marginLeft: 6 },
  content: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: 'hidden' },
  pressed: { backgroundColor: COLORS.bgAlt, opacity: 0.8, transform: [{ scale: 0.985 }] },
  body: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 18, alignItems: 'center' },
  cover: { width: 72, minHeight: 106, marginRight: 14, borderRadius: 10, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', gap: 10, overflow: 'hidden' },
  spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: COLORS.secondary },
  coverLabel: { color: GOLD, fontSize: 11, fontWeight: '700', letterSpacing: 3 },
  title: { color: NAVY, fontSize: 18, lineHeight: 24, marginBottom: 5 },
  issue: { color: PRIMARY, marginBottom: 5 },
  date: { color: COLORS.textSecondary, fontSize: 12 },
  footer: { alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 14 },
  viewText: { color: '#3B82F6', fontSize: 12, fontWeight: '600' },
});

// ── Main Screen ──────────────────────────────────────────────────────────
const MagazinesScreen = ({ navigation }) => {
  const [magazines, setMagazines] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [isStudent, setIsStudent] = useState(false);
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();

  const query = search.trim().toLowerCase();
  const filteredMagazines = query
    ? magazines.filter((item) => [item.title, item.issueNumber, item.authorName, item.category]
        .some((value) => String(value ?? '').toLowerCase().includes(query)))
    : magazines;

  useFocusEffect(
    useCallback(() => {
      loadRole();
      load();
    }, [])
  );

  const loadRole = async () => {
    const raw = await AsyncStorage.getItem('userData');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const role = (parsed.roleName || parsed.role || '').trim().toLowerCase();
    setUserRole(role === 'admin' ? 'Admin' : 'Member');
    setIsStudent(role === 'student');
  };

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await magazineService.getAll();
      if (res?.success) setMagazines(res.data ?? []);
    } catch (e) {
      console.error('Magazines load error:', e);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const onRefresh = () => {
    load(true);
  };

  const handleEdit = (item) => {
    navigation.navigate('MagazineForm', { item });
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Magazine',
      'Are you sure you want to delete this magazine?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await magazineService.delete(id);
              load();
            } catch {
              Alert.alert('Error', 'Failed to delete.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['left', 'right', 'bottom']}>
      <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
      <ListSearchBar value={search} onChangeText={setSearch} placeholder="Search magazines..." />

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      ) : filteredMagazines.length === 0 && !refreshing ? (
        <View style={s.centered}>
          <MaterialCommunityIcons name="book-open-page-variant-outline" size={56} color="#A0C878" />
          <Text style={s.emptyTitle}>No magazines yet</Text>
          <Text style={s.emptyText}>{isStudent ? 'Check back later!' : 'Tap + to add one!'}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMagazines}
          renderItem={({ item, index }) => (
            <MagazineCard
              item={item}
              index={index}
              userRole={userRole}
              isStudent={isStudent}
              onPress={() => navigation.navigate('MagazineDetail', { item })}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          )}
          keyExtractor={(item) => item.magazineId.toString()}
          contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} />
          }
        />
      )}

      {!isStudent && (
        <TouchableOpacity
          style={[s.fab, { bottom: 0 + insets.bottom }]}
          onPress={() => navigation.navigate('MagazineForm')}
          activeOpacity={0.85}
        >
          <Text style={s.fabText}>+</Text>
        </TouchableOpacity>
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default MagazinesScreen;
