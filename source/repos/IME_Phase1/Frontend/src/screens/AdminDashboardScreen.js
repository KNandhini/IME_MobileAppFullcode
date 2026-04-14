import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Card, Title } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

const ADMIN_MENU = [
  { title: 'Add Activity',      route: 'ActivityForm',     icon: '📅', params: {} },
  { title: 'Member Management', route: 'MemberManagement', icon: '👥', params: {} },
  { title: 'Payment Reports',   route: null,               icon: '📊', params: {} },
  { title: 'GO & Circulars',    route: 'Circular',         icon: '📋', params: {} },
  { title: 'Achievements',      route: 'Achievements',     icon: '🏆', params: {} },
  { title: 'Organisation',      route: 'Organisation',     icon: '🏢', params: {} },
  { title: 'Support Services',  route: 'Support',          icon: '🤝', params: {} },
  { title: 'Set Annual Fee',    route: null,               icon: '💰', params: {} },
  { title: 'Fund Raise', route: 'FundraiseList',           icon: '💸', params: {} }
];

const AdminDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();

  const handlePress = (item) => {
    if (!item.route) {
      Alert.alert('Coming Soon', `${item.title} will be available in the next update.`);
      return;
    }
    navigation.navigate(item.route, item.params);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Welcome, {user?.fullName || 'Admin'}</Text>
      </View>

      <View style={styles.grid}>
        {ADMIN_MENU.map((item, index) => (
          <TouchableOpacity key={index} style={styles.card} onPress={() => handlePress(item)} activeOpacity={0.75}>
            <Card style={styles.cardInner}>
              <Card.Content style={styles.cardContent}>
                <Text style={styles.icon}>{item.icon}</Text>
                <Title style={styles.cardTitle}>{item.title}</Title>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header:    { backgroundColor: '#1E3A5F', padding: 24, paddingTop: 40 },
  title:     { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle:  { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  grid:      { flexDirection: 'row', flexWrap: 'wrap', padding: 10, justifyContent: 'space-between' },
  card:      { width: '48%', marginBottom: 14 },
  cardInner: { elevation: 2 },
  cardContent: { alignItems: 'center', paddingVertical: 20 },
  icon:      { fontSize: 36, marginBottom: 8 },
  cardTitle: { fontSize: 13, textAlign: 'center', color: '#1E3A5F' },
});

export default AdminDashboardScreen;
