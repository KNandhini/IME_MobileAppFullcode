import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Image,
  Modal,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Card, Button, Searchbar, Chip, IconButton } from 'react-native-paper';
import { memberService } from '../services/memberService';

const MemberManagementScreen = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // ✅ NEW: Reject modal state
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

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

    if (filterStatus !== 'All') {
      filtered = filtered.filter((m) => {
        const status =
          m.membershipStatus === 'Active' ? 'Approved' : m.membershipStatus;
        return status === filterStatus;
      });
    }

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

  // ✅ UPDATED: Opens custom modal instead of Alert
  const handleRejectMember = (memberId, memberName) => {
    setSelectedMember({ memberId, memberName });
    setRejectReason('');
    setRejectModalVisible(true);
  };

  // ✅ NEW: Called when user taps OK in the reject modal
  const confirmReject = async () => {
    debugger;
    if (!rejectReason.trim()) {
      Alert.alert('Validation', 'Please provide a reason for rejection.');
      return;
    }

    try {
      const response = await memberService.rejectMember(
        selectedMember.memberId,
        rejectReason.trim()
      );
      if (response.success) {
        setRejectModalVisible(false);
        Alert.alert('Success', 'Member rejected');
        loadMembers();
      } else {
        Alert.alert('Error', response.message || 'Failed to reject member');
      }
    } catch (error) {
      console.error('Reject error:', error);
      Alert.alert('Error', 'Failed to reject member');
    }
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
      case 'Approved': return '#E8F5E9';
      case 'Pending':  return '#FFF3E0';
      case 'Rejected': return '#FFEBEE';
      default:         return '#EEEEEE';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'Approved': return '#2E7D32';
      case 'Pending':  return '#EF6C00';
      case 'Rejected': return '#C62828';
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

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.membershipStatus) },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: getStatusTextColor(item.membershipStatus) },
                ]}
              >
                {item.membershipStatus || 'Unknown'}
              </Text>
            </View>
          </View>
        </View>

        {item.designation && (
          <Text style={styles.designation}>{item.designation}</Text>
        )}

        {item.membershipStatus === 'Pending' ? (
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
        ) : (
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

      {/* ✅ REJECT REASON MODAL */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>

            <Text style={styles.modalTitle}>Reject Member</Text>

            <Text style={styles.modalSubtitle}>
              {selectedMember?.memberName}
            </Text>

            <Text style={styles.modalLabel}>Reason</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter reason for rejection..."
              placeholderTextColor="#aaa"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOkBtn}
                onPress={confirmReject}
              >
                <Text style={styles.modalOkText}>OK</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchBar: { margin: 15, elevation: 2 },
  filters: { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 10 },
  filterChip: { marginRight: 8 },
  list: { padding: 15, paddingTop: 0 },

  card: { marginBottom: 15, borderRadius: 16, backgroundColor: '#fff', elevation: 4 },
  memberHeader: { flexDirection: 'row', alignItems: 'center' },
  photo: { width: 60, height: 60, borderRadius: 30, marginRight: 12 },
  photoPlaceholder: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#1976D2', justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  photoPlaceholderText: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  memberEmail: { fontSize: 13, color: '#777', marginTop: 2 },
  memberPhone: { fontSize: 13, color: '#777' },
  statusBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 20, marginTop: 6,
  },
  statusBadgeText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  designation: { fontSize: 13, color: '#999', fontStyle: 'italic', marginTop: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  approveButton: { marginRight: 8, borderRadius: 10 },
  rejectButton: { borderColor: '#F44336', borderRadius: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  emptyText: { fontSize: 16, color: '#999' },

  // ✅ Modal styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalBox: {
    width: '88%', backgroundColor: '#fff',
    borderRadius: 16, padding: 24, elevation: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: '#888', marginBottom: 16 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 6 },
  modalInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 10, fontSize: 14, color: '#333',
    minHeight: 80, backgroundColor: '#fafafa',
  },
  modalActions: {
    flexDirection: 'row', justifyContent: 'flex-end',
    marginTop: 20, gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 8, borderWidth: 1, borderColor: '#ccc',
  },
  modalCancelText: { fontSize: 14, color: '#666' },
  modalOkBtn: {
    paddingVertical: 10, paddingHorizontal: 24,
    borderRadius: 8, backgroundColor: '#F44336',
  },
  modalOkText: { fontSize: 14, color: '#fff', fontWeight: 'bold' },
});

export default MemberManagementScreen;