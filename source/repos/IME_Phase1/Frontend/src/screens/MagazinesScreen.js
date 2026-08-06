import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, StatusBar, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { magazineService } from '../services/magazineService';
import { MagazinesScreenS as s } from './screenStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ListSearchBar from '../components/ListSearchBar';
const NAVY = '#1E3A5F';
const GOLD = '#D4A017';

// ── Magazine Card ─────────────────────────────────────────────────────────
const MagazineCard = ({ item, onPress, onDelete, onEdit,index, userRole }) => {
  const dateStr = item.publishedDate
    ? new Date(item.publishedDate).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '';

  const isPdf = item.attachmentPath?.toLowerCase().endsWith('.pdf');

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <View style={s.cardTopRow}>
        <View style={s.badge}>
          <Text style={s.badgeText}>📖 Magazine</Text>
        </View>
        {userRole === 'Admin' && (
 <View style={s.actionContainer}>
  <TouchableOpacity
    onPress={() => onEdit(item)}
    style={s.iconButton}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
  >
    <MaterialCommunityIcons
      name="pencil-outline"
      size={22}
      color="#1E3A5F"
    />
  </TouchableOpacity>

  <TouchableOpacity
    onPress={() => onDelete(item.magazineId)}
    style={s.iconButton}
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

      <View style={s.cardRow}>
        {/*{item.attachmentPath && !isPdf ? (
          <Image source={{ uri: item.attachmentPath }} style={s.cover} />
        ) : (
          <View style={s.coverPlaceholder}>
            <MaterialCommunityIcons name="file-pdf-box" size={28} color="#fff" />
          </View>
        )}*/}
        <View style={s.textContainer}>
          <Text style={s.title} numberOfLines={2}>{item.title}</Text>
          {!!item.issueNumber && <Text style={s.issue}>{item.issueNumber}</Text>}
          {!!item.authorName && <Text style={s.author} numberOfLines={1}>By {item.authorName}</Text>}
          <View style={[s.metaRow, { justifyContent: 'space-between', alignItems: 'center' }]}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
              {!!item.category && (
                <View style={s.categoryPill}><Text style={s.categoryText}>{item.category}</Text></View>
              )}
              {!!dateStr && <Text style={s.date}>📅 {dateStr}</Text>}
            </View>
            <Text style={s.viewHint || { color: '#3B82F6', fontSize: 12, fontWeight: '600' }}>
              Tap to view ›
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Main Screen ──────────────────────────────────────────────────────────
const MagazinesScreen = ({ navigation }) => {
  const [magazines, setMagazines] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState(null);
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
  };

  const load = async () => {
    try {
      const res = await magazineService.getAll();
      if (res?.success) setMagazines(res.data ?? []);
    } catch (e) {
      console.error('Magazines load error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    load();
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
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      <ListSearchBar value={search} onChangeText={setSearch} placeholder="Search magazines..." />

      {filteredMagazines.length === 0 && !refreshing ? (
        <View style={s.centered}>
          <MaterialCommunityIcons name="book-open-page-variant-outline" size={56} color="#CBD5E1" />
          <Text style={s.emptyTitle}>No magazines yet</Text>
          <Text style={s.emptyText}>Tap + to add one!</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMagazines}
          renderItem={({ item, index }) => (
           <MagazineCard
  item={item}
  index={index}
  userRole={userRole}
  onPress={() => navigation.navigate('MagazineDetail', { item })}
  onDelete={handleDelete}
  onEdit={handleEdit}   // ← ADD
/>
          )}
          keyExtractor={(item) => item.magazineId.toString()}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[NAVY]} />
          }
        />
      )}

    
        <TouchableOpacity
          style={[s.fab,{ bottom: 24 + insets.bottom }]}
          onPress={() => navigation.navigate('MagazineForm')}
          activeOpacity={0.85}
        >
          <Text style={s.fabText}>+</Text>
        </TouchableOpacity>
      
    </SafeAreaView>
  );
};



export default MagazinesScreen;
