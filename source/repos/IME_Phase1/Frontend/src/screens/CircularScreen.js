import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { circularService } from '../services/circularService';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { CircularScreenStyles as styles } from './screenStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ListSearchBar from '../components/ListSearchBar';
const NAVY = '#1E3A5F';
const GOLD = '#D4A017';

const CircularScreen = ({ navigation }) => {
  const [circulars,  setCirculars]  = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const isAdmin = user?.roleName === 'Admin';
const insets = useSafeAreaInsets();
  const query = search.trim().toLowerCase();
  const filteredCirculars = query
    ? circulars.filter((item) => [item.circularNumber, item.title, item.description, item.visibility]
        .some((value) => String(value ?? '').toLowerCase().includes(query)))
    : circulars;
  const loadCirculars = async () => {
    setLoading(true);
    try {
      const response = isAdmin
        ? await circularService.getByClub()
        : await circularService.getAll();
      if (response.success) setCirculars(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadCirculars(); }, []);
  useFocusEffect(useCallback(() => { loadCirculars(); }, []));

  const onRefresh = () => { setRefreshing(true); loadCirculars(); };

  const deleteCircular = (id) => {
    Alert.alert('Delete Circular', 'Are you sure you want to delete this circular?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await circularService.delete(id); loadCirculars(); },
      },
    ]);
  };

 const renderCircular = ({ item }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={() => navigation.navigate('CircularDetail', { item })}
    activeOpacity={0.85}
  >
    {/* ── Top row: chip + Edit/Delete ── */}
    <View style={styles.cardHeader}>

      {/* LEFT: circular number chip only */}
      <View style={styles.leftBadges}>
        {item.circularNumber ? (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{item.circularNumber}</Text>
          </View>
        ) : null}
      </View>

      {/* RIGHT: admin actions */}
      {isAdmin && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); navigation.navigate('AddCircular', { item }); }}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="pencil-outline" size={22} color={NAVY} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); deleteCircular(item.circularId); }}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="delete-outline" size={22} color="#D9534F" />
          </TouchableOpacity>
        </View>
      )}
    </View>

    {/* ✅ Visibility badge — below chip, left-aligned */}
    <View style={[
      styles.visBadge,
      item.visibility === 'Club' ? styles.visBadgeClub : styles.visBadgeAll,
    ]}>
      <Text style={styles.visText}>
        {item.visibility === 'Club' ? 'My Club' : 'All Members'}
      </Text>
    </View>

    {/* Title */}
    <Text style={styles.title}>{item.title}</Text>

    {/* Description */}
    {item.description ? (
      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
    ) : null}

    {/* Date row */}
    <View style={styles.dateRow}>
      <Text style={styles.date}>
        {item.publishDate
          ? new Date(item.publishDate).toLocaleDateString('en-IN')
          : ''}
      </Text>
      <Text style={styles.viewHint}>Tap to view ›</Text>
    </View>
  </TouchableOpacity>
);

  return (
  <View style={styles.container}>
    <ListSearchBar value={search} onChangeText={setSearch} placeholder="Search circulars..." />
    {loading && circulars.length === 0 ? (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color={NAVY} />
      </View>
    ) : filteredCirculars.length === 0 ? (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No circulars available</Text>
      </View>
    ) : (
      <FlatList
        data={filteredCirculars}
        renderItem={renderCircular}
        keyExtractor={(item) => item.circularId.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    )}

      {isAdmin && (
        <TouchableOpacity
          style={[styles.fab, { bottom: 24 + insets.bottom }]}
          onPress={() => navigation.navigate('AddCircular')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default CircularScreen;

