import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
// Place in: src/screens/JobPostingListScreen.js

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StatusBar, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { jobPostingService } from '../services/jobpostingService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';
import { JobPostingListScreenStyles as styles } from './screenStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ListSearchBar from '../components/ListSearchBar';
const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const idx = filePath.indexOf('Uploads\\');
  if (idx === -1) return filePath;
  const relative = filePath.substring(idx).replace(/\\/g, '/');
  return `${API_BASE}/${relative}`;
};
const NAVY = COLORS.dark;
const GOLD = COLORS.accent;

const JobPostingListScreen = ({ navigation }) => {
  const { user } = useAuth();
const insets = useSafeAreaInsets();
  const [jobs,       setJobs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clubId,     setClubId]     = useState(null);
  const [clubName,   setClubName]   = useState('');
const [currentUserName, setCurrentUserName] = useState('');
const [isUnemployed, setIsUnemployed] = useState(false);
const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const filteredJobs = query
    ? jobs.filter((item) => [item.jobTitle, item.companyName, item.location, item.employmentType, item.workMode, item.salaryPackage]
        .some((value) => String(value ?? '').toLowerCase().includes(query)))
    : jobs;

  // ── Bootstrap club info from AsyncStorage (same pattern as AchievementFormScreen) ──
  const getClubId = async () => {
  const raw = await AsyncStorage.getItem('userData');
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  setClubName(parsed.clubName || '');
  setCurrentUserName(parsed.fullName || parsed.name || '');
  setIsUnemployed(parsed?.occupation?.toLowerCase() === 'unemployed');
  return parsed.clubId || null;
};

  const loadJobs = useCallback(async () => {
    try {
      const id = clubId || await getClubId();
      if (!id) return;
      setClubId(id);
      const res = await jobPostingService.getAll(id);
      if (res?.data) setJobs(res.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load job postings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clubId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadJobs();
    }, [loadJobs])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadJobs();
  };

  const handleAdd = () => {
    navigation.navigate('JobPostingForm', { item: null });
  };

  const handleEdit = (job) => {
    navigation.navigate('JobPostingForm', { item: job });
  };

  const handleDetail = (job) => {
    navigation.navigate('JobPostingDetail', { item: job });
  };

  const handleDelete = (job) => {
    Alert.alert(
      'Delete Job Posting',
      `Delete "${job.jobTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
await jobPostingService.delete(job.jobPostingId, currentUserName);      
        setJobs((prev) => prev.filter((j) => j.jobPostingId !== job.jobPostingId));
            } catch {
              Alert.alert('Error', 'Failed to delete job posting.');
            }
          },
        },
      ]
    );
  };

  const isClosed = (closingDate) =>
    closingDate ? new Date(closingDate) < new Date() : false;

  const isImage = (path = '') => /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(path);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleDetail(item)}
      activeOpacity={0.85}
    >
      {/* Thumbnail — same as AchievementListScreen pattern */}
     {/* {item.attachmentPath && isImage(item.attachmentPath) ? (
  <Image source={{ uri: toPublicUrl(item.attachmentPath) }} style={styles.cardThumb} />
) : (
  <View style={[styles.cardThumb, styles.cardThumbFallback]}>
    <Text style={{ fontSize: 28 }}>💼</Text>
  </View>
)}*/}

      <View style={styles.cardBody}>
        <View style={styles.cardHeaderRow}>
  <Text style={styles.cardTitle} numberOfLines={1}>{item.jobTitle}</Text>
  {!isUnemployed && (
    <View style={styles.actionRow}>
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={(e) => { e.stopPropagation(); handleEdit(item); }}
      >
        <MaterialCommunityIcons name="pencil-outline" size={18} color={NAVY} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={(e) => { e.stopPropagation(); handleDelete(item); }}
      >
        <MaterialCommunityIcons name="delete-outline" size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  )}
</View>

        <Text style={styles.cardCompany}>{item.companyName}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <MaterialCommunityIcons name="map-marker-outline" size={11} color="#64748B" />
            <Text style={styles.metaText}>{item.location}</Text>
          </View>
          <View style={styles.metaChip}>
            <MaterialCommunityIcons name="briefcase-outline" size={11} color="#64748B" />
            <Text style={styles.metaText}>{item.employmentType}</Text>
          </View>
          <View style={styles.metaChip}>
            <MaterialCommunityIcons name="home-outline" size={11} color="#64748B" />
            <Text style={styles.metaText}>{item.workMode}</Text>
          </View>
        </View>

        {item.salaryPackage ? (
          <Text style={styles.salaryText}>💰 {item.salaryPackage}</Text>
        ) : null}

        <View style={[styles.cardFooter, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <Text style={[styles.closingText, isClosed(item.vacancyClosingDate) && styles.closedText]}>
  {isClosed(item.vacancyClosingDate) ? '⛔ Closed ' : '📅 Closes '}
  {item.vacancyClosingDate
    ? new Date(item.vacancyClosingDate).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : ''}
</Text>
          <Text style={styles.viewHint || { color: '#3B82F6', fontSize: 12, fontWeight: '600' }}>
            Tap to view ›
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />

      <GradientHeader style={styles.appHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Job Postings</Text>
          {clubName ? <Text style={styles.headerSub}>{clubName}</Text> : null}
        </View>
      </GradientHeader>

      <ListSearchBar value={search} onChangeText={setSearch} placeholder="Search job postings..." />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={NAVY} />
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => String(item.jobPostingId)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[NAVY]} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>💼</Text>
              <Text style={styles.emptyText}>No job postings yet.</Text>
              <Text style={styles.emptySubText}>Tap + to add your first one.</Text>
            </View>
          }
        />
      )}

      {/* Floating add button */}
      {!isUnemployed && (
  <TouchableOpacity style={[styles.fab,{ bottom: 24 + insets.bottom }]} onPress={handleAdd} activeOpacity={0.85}>
    <MaterialCommunityIcons name="plus" size={30} color={GOLD} />
  </TouchableOpacity>
)}
    </View>
  );
};



export default JobPostingListScreen;
