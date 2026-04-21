import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, StatusBar } from 'react-native';
import { Button, Card, Avatar } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar backgroundColor="#1E3A5F" barStyle="light-content" />
      <View style={styles.header}>
        <Avatar.Text size={80} label={user?.fullName?.[0] || 'U'} />
        <Text style={styles.name}>{user?.fullName || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

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

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('ProfileEdit')}
          style={styles.button}
        >
          Edit Profile
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('PaymentHistory')}
          style={styles.button}
        >
          Payment History
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('ChangePassword')}
          style={styles.button}
        >
          Change Password
        </Button>
        <Button
          mode="contained"
          onPress={handleLogout}
          style={[styles.button, styles.logoutButton]}
          buttonColor="#f44336"
        >
          Logout
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1E3A5F',
    padding: 30,
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15,
  },
  email: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 5,
  },
  card: {
    margin: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    padding: 15,
  },
  button: {
    marginBottom: 10,
  },
  logoutButton: {
    marginTop: 20,
  },
});

export default ProfileScreen;
