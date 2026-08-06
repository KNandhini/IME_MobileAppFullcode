import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { Card, Title, Menu } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { MemberDashboardScreenStyles as styles } from './screenStyles.js';

const MEMBER_MENU = [
  { title: 'Support Services',   route: 'Support',        icon: '🤝', params: {} },
  { title: 'Fund Raise',         route: 'FundScreen',  icon: '💸', params: {} },
  { title: 'Organisation',       route: 'Organisation',   icon: '🏢', params: {} },
  { title: 'Achievements',       route: 'Achievements',   icon: '🏆', params: {} },
  { title: 'Magazine',           route: 'Magazines',      icon: '📰', params: {} },
  { title: 'Job Postings',       route: 'JobPostingList', icon: '💼', params: {} },
  { title: 'Health & Nutrition', route: 'HealthNutrition',icon: '🥗', params: {} },
];

const MemberDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  const handlePress = (item) => {
    if (!item.route) {
      Alert.alert('Coming Soon', `${item.title} will be available in the next update.`);
      return;
    }
    navigation.navigate(item.route, item.params);
  };

  const handleLogout = async () => {
    setMenuVisible(false);
    await logout();
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1E3A5F" barStyle="light-content" />

      {/* ── IME Header (same as HomeScreen/AdminDashboard) ── */}
      <View style={styles.appHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>IME</Text>
          </View>
          <View>
            <Text style={styles.appName}>Institution of Municipal Engineers</Text>
            <Text style={styles.appTagline}>Connect · Grow · Achieve</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')} activeOpacity={0.75}>
            <Text style={styles.iconBtnText}>🔔</Text>
          </TouchableOpacity>

          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            contentStyle={styles.menuContent}
            anchor={
              <TouchableOpacity style={styles.iconBtn} onPress={() => setMenuVisible(true)} activeOpacity={0.75}>
                <Text style={styles.kebabIcon}>⋮</Text>
              </TouchableOpacity>
            }
          >
            <Menu.Item title="👤  My Profile" titleStyle={styles.menuItemText} onPress={() => { setMenuVisible(false); navigation.navigate('Profile'); }} />
            <View style={styles.menuSep} />
            <Menu.Item title="🚪  Logout" titleStyle={[styles.menuItemText, { color: '#C0392B' }]} onPress={handleLogout} />
          </Menu>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeStrip}>
        <Text style={styles.welcomeTitle}>Welcome, {user?.fullName || 'Member'}</Text>
          <Text style={styles.welcomeSub}>Member Dashboard</Text>
          
        </View>

        {/* Law Bot card */}
        <TouchableOpacity
          style={styles.lawBotCard}
          onPress={() => navigation.navigate('LawBot')}
          activeOpacity={0.85}
        >
          <Text style={styles.lawBotTitle}>⚖️ Law Assistant</Text>
          <Text style={styles.lawBotSubtitle}>
            Ask questions about the 74th Amendment Act
          </Text>
        </TouchableOpacity>

        <View style={styles.grid}>
          {MEMBER_MENU.map((item, index) => (
            <TouchableOpacity key={index} style={styles.card} onPress={() => handlePress(item)} activeOpacity={0.75}>
              <Card style={styles.cardInner}>
                <Card.Content style={styles.cardContent}>
                  <Text style={styles.icon}>{item.icon}</Text>
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

export default MemberDashboardScreen;