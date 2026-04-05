import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Title } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

const AdminDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();

  const adminMenuItems = [
    { title: 'Manage Activities', route: 'ManageActivities', icon: '📅', description: 'Create, edit, and manage activities' },
    { title: 'Manage News', route: 'ManageNews', icon: '📰', description: 'Create and manage news articles' },
    { title: 'Manage Media', route: 'ManageMedia', icon: '📸', description: 'Upload and manage photos/videos' },
    { title: 'Manage Podcasts', route: 'ManagePodcasts', icon: '🎙️', description: 'Create and manage podcasts' },
    { title: 'Member Management', route: 'MemberManagement', icon: '👥', description: 'Approve, reject, and manage members' },
    { title: 'Manage Support', route: 'ManageSupport', icon: '🤝', description: 'Manage support services' },
    { title: 'Manage Circulars', route: 'ManageCirculars', icon: '📋', description: 'Create and manage circulars' },
    { title: 'Manage Achievements', route: 'ManageAchievements', icon: '🏆', description: 'Add member achievements' },
    { title: 'Manage Organisation', route: 'ManageOrganisation', icon: '🏢', description: 'Manage office bearers' },
    { title: 'Set Annual Fee', route: 'SetFee', icon: '💰', description: 'Set membership fee for the year' },
    { title: 'Payment Reports', route: 'PaymentReports', icon: '📊', description: 'View all payment transactions' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Admin Dashboard</Text>
        <Text style={styles.userText}>Welcome, {user?.fullName}</Text>
      </View>

      <View style={styles.grid}>
        {adminMenuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => {
              // For now, show alert that feature is under construction
              // In production, navigate to respective screens
              if (item.route === 'ActivityForm') {
                navigation.navigate(item.route);
              } else {
                alert(`${item.title} feature coming soon!`);
              }
            }}
          >
            <Card style={styles.cardContent}>
              <Card.Content>
                <Text style={styles.icon}>{item.icon}</Text>
                <Title style={styles.cardTitle}>{item.title}</Title>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
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
    backgroundColor: '#FF5722',
    padding: 20,
    paddingTop: 30,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  grid: {
    padding: 10,
  },
  card: {
    marginBottom: 15,
  },
  cardContent: {
    elevation: 2,
  },
  icon: {
    fontSize: 40,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 12,
    color: '#666',
  },
});

export default AdminDashboardScreen;
