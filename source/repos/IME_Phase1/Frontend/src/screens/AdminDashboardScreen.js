import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar } from 'react-native';
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
  { title: 'Set Annual Fee',    route: 'SetAnnualFee',     icon: '💰', params: {} },
  { title: 'Fund Raise', route: 'FundraiseList',           icon: '💸', params: {} },
  { title: 'Club List',  route: 'ClubList',               icon: '🏢', params: {} },
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
    <View style={styles.container}>
      <StatusBar backgroundColor="#1E3A5F" barStyle="light-content" />

      {/* ── IME Header (same as HomeScreen) ── */}
      <View style={styles.appHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>IME</Text>
          </View>
          <View>
            <Text style={styles.appName}>Indian Mechanical Engineers</Text>
            <Text style={styles.appTagline}>Connect · Grow · Achieve</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeStrip}>
          <Text style={styles.welcomeTitle}>Admin Dashboard</Text>
          <Text style={styles.welcomeSub}>Welcome, {user?.fullName || 'Admin'}</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F0F2F5' },
  scrollContent: { paddingBottom: 24 },

  // IME header
  appHeader: {
    backgroundColor: '#1E3A5F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 44,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#D4A017',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText:   { color: '#1E3A5F', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  appName:    { color: '#fff', fontSize: 13, fontWeight: '700' },
  appTagline: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },
  backBtn:    { padding: 8 },
  backIcon:   { color: '#fff', fontSize: 22, fontWeight: '700' },

  // Welcome strip
  welcomeStrip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    elevation: 1,
  },
  welcomeTitle: { fontSize: 18, fontWeight: '800', color: '#1E3A5F' },
  welcomeSub:   { fontSize: 13, color: '#888', marginTop: 2 },

  // Grid
  grid:       { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, paddingTop: 4, justifyContent: 'space-between' },
  card:       { width: '48%', marginBottom: 14 },
  cardInner:  { elevation: 2 },
  cardContent:{ alignItems: 'center', paddingVertical: 20 },
  icon:       { fontSize: 36, marginBottom: 8 },
  cardTitle:  { fontSize: 13, textAlign: 'center', color: '#1E3A5F' },
});

export default AdminDashboardScreen;
