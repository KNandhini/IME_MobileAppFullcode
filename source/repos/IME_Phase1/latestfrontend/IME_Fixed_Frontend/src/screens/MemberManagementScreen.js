import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { Card, Button, Searchbar, Chip, IconButton } from 'react-native-paper';
import { memberService } from '../services/memberService';

const MemberManagementScreen = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // All, Pending, Approved, Rejected

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [searchQuery, filterStatus, members]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const response = await memberService.getAllMembers();
      if (response.success) {
        setMembers(response.data);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
      Alert.alert('Error', 'Failed to load members');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterMembers = () => {
    let filtered = members;

    // Filter by status
    if (filterStatus !== 'All') {
      filtered = filtered.filter((m) => m.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.fullName?.toLowerCase().includes(query) ||
          m.email?.toLowerCase().includes(query) ||
          m.phoneNumber?.includes(query)
      );
    }

    setFilteredMembers(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMembers();
  };

  const handleApproveMember = (memberId, memberName) => {
    Alert.alert(
      'Approve Member',
      `Are you sure you want to approve ${memberName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              const response = await memberService.approveMember(memberId);
              if (response.success) {
                Alert.alert('Success', 'Member approved successfully');
                loadMembers();
              } else {
                Alert.alert('Error', response.message || 'Failed to approve member');
              }
            } catch (error) {
              console.error('Approve error:', error);
              Alert.alert('Error', 'Failed to approve member');
            }
          },
        },
      ]
    );
  };

  const handleRejectMember = (memberId, memberName) => {
    Alert.prompt(
      'Reject Member',
      `Enter reason for rejecting ${memberName}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: async (reason) => {
            if (!reason || !reason.trim()) {
              Alert.alert('Error', 'Please provide a reason');
              return;
            }

            try {
              const response = await memberService.rejectMember(memberId, reason);
              if (response.success) {
                Alert.alert('Success', 'Member rejected');
                loadMembers();
              } else {
                Alert.alert('Error', response.message || 'Failed to reject member');
              }
            } catch (error) {
              console.error('Reject error:', error);
              Alert.alert('Error', 'Failed to reject member');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleDeleteMember = (memberId, memberName) => {
    Alert.alert(
      'Delete Member',
      `Are you sure you want to permanently delete ${memberName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await memberService.deleteMember(memberId);
              if (response.success) {
                Alert.alert('Success', 'Member deleted');
                loadMembers();
              } else {
                Alert.alert('Error', response.message || 'Failed to delete member');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete member');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return '#4CAF50';
      case 'Pending':
        return '#FF9800';
      case 'Rejected':
        return '#F44336';
      default:
        return '#999';
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
                {item.fullName ? item.fullName.charAt(0) : '?'}
              </Text>
            </View>
          )}
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{item.fullName}</Text>
            <Text style={styles.memberEmail}>{item.email}</Text>
            <Text style={styles.memberPhone}>{item.phoneNumber}</Text>
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(item.status) + '20' },
              ]}
              textStyle={[styles.statusText, { color: getStatusColor(item.status) }]}
            >
              {item.status}
            </Chip>
          </View>
        </View>

        {item.designation && (
          <Text style={styles.designation}>{item.designation}</Text>
        )}

        {item.status === 'Pending' && (
          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={() => handleApproveMember(item.memberId, item.fullName)}
              style={styles.approveButton}
              buttonColor="#4CAF50"
            >
              Approve
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleRejectMember(item.memberId, item.fullName)}
              style={styles.rejectButton}
              textColor="#F44336"
            >
              Reject
            </Button>
          </View>
        )}

        {item.status !== 'Pending' && (
          <View style={styles.actions}>
            <IconButton
              icon="delete"
              iconColor="#F44336"
              onPress={() => handleDeleteMember(item.memberId, item.fullName)}
            />
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search members..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <View style={styles.filters}>
        {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: 15,
    elevation: 2,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  filterChip: {
    marginRight: 8,
  },
  list: {
    padding: 15,
    paddingTop: 0,
  },
  card: {
    marginBottom: 15,
    elevation: 2,
  },
  memberHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  photoPlaceholderText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  memberPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    height: 24,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  designation: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  approveButton: {
    marginRight: 8,
  },
  rejectButton: {
    borderColor: '#F44336',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default MemberManagementScreen;
