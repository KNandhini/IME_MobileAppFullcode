import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, StatusBar, Image } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { memberService } from '../services/memberService';
import api from '../utils/api';
import { ProfileScreenStyles as styles } from './screenStyles';


const NAVY = '#1E3A5F';
const GOLD = '#D4A017';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [profilePhoto, setProfilePhoto] = useState(null);

  // ── Load photo on mount ───────────────────────────────────────────────────
  useEffect(() => {
    loadPhoto();
  }, []);

  // ── Reload photo when screen comes back into focus (after edit) ───────────
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadPhoto);
    return unsubscribe;
  }, [navigation]);

  const loadPhoto = async () => {
    try {
      const userStr = await AsyncStorage.getItem('userData');
      if (!userStr) return;
      const userData = JSON.parse(userStr);
      const id = userData.memberId;
      if (!id) return;

      const res = await memberService.getProfile(id);
      if (res.success && res.data) {
        const d = res.data;
        const baseUrl = api.defaults.baseURL.replace('/api', '');

        if (d.profilePhotoPath) {
          // ── Use URL path ──
          const path = d.profilePhotoPath;
          const photoUrl = path.startsWith('http')
            ? path
            : `${baseUrl}/Uploads/${path.replace(/\\/g, '/').replace(/^Uploads\/?/i, '')}`;
          setProfilePhoto(photoUrl);
        } else if (d.profilePhoto) {
          // ── Use base64 blob ──
          const photo = d.profilePhoto;
          setProfilePhoto(
            photo.startsWith('data:')
              ? photo
              : `data:image/jpeg;base64,${photo}`
          );
        }
      }
    } catch (e) {
      console.warn('Load photo error:', e);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: async () => { await logout(); } },
    ]);
  };

  const initials = user?.fullName?.[0]?.toUpperCase() || 'U';

  return (
    <ScrollView style={styles.container}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>

        {/* ── Profile Photo ── */}
        {profilePhoto ? (
          <Image
            source={{ uri: profilePhoto }}
            style={styles.avatar}
            onError={() => setProfilePhoto(null)}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{initials}</Text>
          </View>
        )}

        <Text style={styles.name}>{user?.fullName || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* ── Account Info ── */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Role:</Text>
            <Text style={styles.value}>{user?.roleName || 'Member'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Member ID:</Text>
            <Text style={styles.value}>{user?.memberId || 'N/A'}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* ── Actions ── */}
      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('ProfileEdit')}
          style={styles.button}
          buttonColor={NAVY}
           textColor={GOLD}
        >
          Edit Profile
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('PaymentHistory')}
          style={styles.button}
           textColor={GOLD}
        >
          Payment History
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('ChangePassword')}
          style={styles.button}
           textColor={GOLD}

        >
          Change Password
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('MyPost')}
          style={styles.button}
           textColor={GOLD}
        >
          My Post
        </Button>
        <Button
          mode="contained"
          onPress={handleLogout}
          style={[styles.button, styles.logoutButton]}
          buttonColor="#f80511"
          textColor={"#fff"}
        >
          Logout
        </Button>
      </View>
    </ScrollView>
  );
};



export default ProfileScreen;