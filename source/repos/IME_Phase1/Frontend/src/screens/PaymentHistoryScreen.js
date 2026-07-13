import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Card, Chip, Searchbar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { paymentService } from '../services/paymentService';
import { PaymentHistoryScreenStyles as styles } from './screenStyles';

const PaymentHistoryScreen = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [memberId, setMemberId] = useState(null);

  useEffect(() => {
    loadMemberAndPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [searchQuery, payments]);

  const loadMemberAndPayments = async () => {
    setLoading(true);
    try {
      const userStr = await AsyncStorage.getItem('userData');
      if (userStr) {
        const user = JSON.parse(userStr);
        setMemberId(user.memberId);
        await loadPayments(user.memberId);
      }
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadPayments = async (mId) => {
    try {
      const response = await paymentService.getPaymentHistory(mId);
      if (response.success) {
        setPayments(response.data);
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMemberAndPayments();
  };

  const filterPayments = () => {
    if (!searchQuery.trim()) {
      setFilteredPayments(payments);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = payments.filter(
      (payment) =>
        payment.transactionId?.toLowerCase().includes(query) ||
        payment.paymentMethod?.toLowerCase().includes(query) ||
        payment.status?.toLowerCase().includes(query) ||
        payment.year?.toString().includes(query)
    );
    setFilteredPayments(filtered);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'failed':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed':
        return 'check-circle';
      case 'pending':
        return 'clock-outline';
      case 'failed':
        return 'close-circle';
      default:
        return 'information';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderPayment = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.year}>FY {item.year}</Text>
            <Text style={styles.date}>{formatDate(item.paymentDate)}</Text>
          </View>
          <Chip
            icon={getStatusIcon(item.status)}
            style={[
              styles.statusChip,
              { backgroundColor: getStatusColor(item.status) + '20' },
            ]}
            textStyle={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Chip>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount Paid</Text>
          <Text style={styles.amount}>
            ₹{item.amount?.toLocaleString('en-IN') || '0'}
          </Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Method:</Text>
            <Text style={styles.detailValue}>
              {item.paymentMethod || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID:</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {item.transactionId || 'N/A'}
            </Text>
          </View>
          {item.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer,{ backgroundColor: '#fff' }]}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search payments..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar,{ backgroundColor: '#fff' }]}

      />

      {filteredPayments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💳</Text>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No matching payments found' : 'No payment history'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPayments}
          renderItem={renderPayment}
          keyExtractor={(item) => item.paymentId.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};



export default PaymentHistoryScreen;
