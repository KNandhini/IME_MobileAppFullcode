import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  Alert, Image,
} from 'react-native';
import { Card, IconButton, Searchbar, Chip } from 'react-native-paper';
import { memberService } from '../services/memberService';

const MemberManagementScreen = ({ navigation }) => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => { loadMembers(); }, []);
  useEffect(() => { filterMembers(); }, [searchQuery, filterStatus, members]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const response = await memberService.getAllMembers();
      if (response.success) setMembers(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load members');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterMembers = () => {
    let filtered = members;
    if (filterStatus !== 'All') {
      filtered = filtered.filter((m) => m.membershipStatus === filterStatus);
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

  const renderMember = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.memberHeader}>
          {item.photoPath ? (
            <Image source={{ uri: item.photoPath }} style={styles.photo} />
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
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.membershipStatus) }]}>
              <Text style={[styles.statusBadgeText, { color: getStatusTextColor(item.membershipStatus) }]}>
                {item.membershipStatus || 'Unknown'}
              </Text>
            </View>
          </View>
        </View>
        {item.designation && <Text style={styles.designation}>{item.designation}</Text>}
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

  return (
    <View style={styles.container}>
      <Searchbar placeholder="Search members..." onChangeText={setSearchQuery}
        value={searchQuery} style={styles.searchBar} />

      <View style={styles.filters}>
        {['All', 'Active', 'Pending', 'Inactive'].map((status) => (
          <Chip key={status} selected={filterStatus === status}
            onPress={() => setFilterStatus(status)} style={styles.filterChip}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: '#f5f5f5' },
  searchBar:           { margin: 15, elevation: 2 },
  filters:             { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 10 },
  filterChip:          { marginRight: 8 },
  list:                { padding: 15, paddingTop: 0 },
  card:                { marginBottom: 15, borderRadius: 16, backgroundColor: '#fff', elevation: 4 },
  memberHeader:        { flexDirection: 'row', alignItems: 'center' },
  photo:               { width: 60, height: 60, borderRadius: 30, marginRight: 12 },
  photoPlaceholder:    { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1976D2', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  photoPlaceholderText:{ fontSize: 22, color: '#fff', fontWeight: 'bold' },
  memberInfo:          { flex: 1 },
  memberName:          { fontSize: 18, fontWeight: 'bold', color: '#222' },
  memberEmail:         { fontSize: 13, color: '#777', marginTop: 2 },
  memberPhone:         { fontSize: 13, color: '#777' },
  statusBadge:         { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 6 },
  statusBadgeText:     { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  designation:         { fontSize: 13, color: '#999', fontStyle: 'italic', marginTop: 8 },
  actions:             { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  emptyContainer:      { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  emptyText:           { fontSize: 16, color: '#999' },
});

export default MemberManagementScreen;
