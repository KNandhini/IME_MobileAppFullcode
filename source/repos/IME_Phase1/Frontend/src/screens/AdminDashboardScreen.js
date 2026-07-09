import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { Card, Title } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { AdminDashboardScreenStyles as styles } from './screenStyles.js';

const ADMIN_MENU = [
  { title: 'Activity',           route: 'Activities',        icon: '📅', params: {} },
  { title: 'Member Management', route: 'MemberManagement', icon: '👥', params: {} },
  { title: 'Payment Reports',   route: null,               icon: '📊', params: {} },
  { title: 'GO & Circulars',    route: 'Circular',         icon: '📋', params: {} },
  { title: 'Achievements',      route: 'Achievements',     icon: '🏆', params: {} },
  { title: 'Organisation',      route: 'Organisation',     icon: '🏢', params: {} },
  { title: 'Support Services',  route: 'Support',          icon: '🤝', params: {} },
  { title: 'Set Annual Fee',    route: 'SetAnnualFee',     icon: '💰', params: {} },
  { title: 'Fund Raise', route: 'FundraiseList',           icon: '💸', params: {} },
  { title: 'Club List',  route: 'ClubList',               icon: '🏢', params: {} },
  { title: 'Job Postings',      route: 'JobPostingList',   icon: '💼', params: {} },
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
            <Text style={styles.appName}>Institute of Municipal Engineers</Text>
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
                 {/* <Title style={styles.cardTitle}>{item.title}</Title>*/}
                 <Title style={styles.cardTitle} numberOfLines={2} allowFontScaling={false}>
  {item.title}
</Title>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};



export default AdminDashboardScreen;
