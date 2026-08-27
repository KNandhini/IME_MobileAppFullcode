import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { Card, Title, Menu } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
// Reuses the Member dashboard's stylesheet — same visual language, just a
// different (smaller) menu. If you'd rather have a dedicated stylesheet,
// duplicate MemberDashboardScreenStyles under a StudentDashboardScreenStyles
// name in screenStyles.js and swap the import below.
import { MemberDashboardScreenStyles as styles } from './screenStyles.js';
import GradientHeader from '../components/GradientHeader.js';

// Students only get these three — no fund/support/organisation/etc.
const STUDENT_MENU = [
  { title: 'Activity',      route: 'Activities',     icon: '📅', params: {} },
  { title: 'Job Postings',  route: 'JobPostingList',  icon: '💼', params: {} },
  { title: 'Magazine',      route: 'Magazines',       icon: '📰', params: {} },
   { title: 'Support Services',  route: 'Support',           icon: '🤝', params: {} },
];

const StudentDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const paymentPopupShown = useRef(false);

  // ── Payment pending popup (once per session, driven by server roleId/membershipStatus/graceExpiryDate) ──
  useEffect(() => {
    if (paymentPopupShown.current) return;
    checkPaymentGrace();
  }, [user]);

  const checkPaymentGrace = async () => {
    try {
      if (user?.roleId === 1) return;
      if (user?.roleId !== 2) return;
      if (user?.membershipStatus !== 'Pending') return;
      if (!user?.graceExpiryDate) return;

      const expiry = new Date(user.graceExpiryDate).getTime();
      const msLeft = expiry - Date.now();
      if (msLeft <= 0) return;

      const GRACE_DAYS = 3;
      const daysLeft = Math.min(GRACE_DAYS, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
      paymentPopupShown.current = true;

      Alert.alert(
        '⚠️ Payment Pending',
        `Your membership registration payment is pending.\n\nYou have ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining to complete payment before your account expires.`,
        [
          {
            text: 'Pay Now',
            onPress: async () => {
              try {
                const stored = await AsyncStorage.getItem('paymentGrace');

                if (!stored) {
                  Alert.alert(
                    'Payment Details Missing',
                    'Unable to find your pending membership payment details.'
                  );
                  return;
                }

                const graceData = JSON.parse(stored);

                navigation.navigate(
                  'RegistrationPayment',
                  graceData.paymentParams
                );

              } catch (error) {
                console.error(
                  'Failed to load pending payment:',
                  error
                );

                Alert.alert(
                  'Error',
                  'Unable to load your pending payment.'
                );
              }
            },
          },
          { text: 'Remind Me Later', style: 'cancel' },
        ],
      );
    } catch (_) { }
  };

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
      <StatusBar backgroundColor="#252943" barStyle="light-content" />

      {/* ── IME Header (same as HomeScreen/AdminDashboard/MemberDashboard) ── */}
      <GradientHeader style={styles.appHeader}>
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
      </GradientHeader>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeStrip}>
          <Text style={styles.welcomeTitle}>Welcome, {user?.fullName || 'Student'}</Text>
          <Text style={styles.welcomeSub}>Student Dashboard</Text>
        </View>

        

        <View style={styles.grid}>
          {STUDENT_MENU.map((item, index) => (
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

export default StudentDashboardScreen;