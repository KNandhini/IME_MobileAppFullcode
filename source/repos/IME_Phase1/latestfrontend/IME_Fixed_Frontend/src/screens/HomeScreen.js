import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();

  const menuItems = [
    { title: 'Activities', route: 'Activities', icon: '📅' },
    { title: 'News', route: 'News', icon: '📰' },
    { title: 'Pay Fee', route: 'Payment', icon: '💳' },
    { title: 'Payment History', route: 'PaymentHistory', icon: '📊' },
    { title: 'Support', route: 'Support', icon: '🤝' },
    { title: 'GO & Circular', route: 'Circular', icon: '📋' },
    { title: 'Achievements', route: 'Achievements', icon: '🏆' },
    { title: 'Organisation', route: 'Organisation', icon: '🏢' },
    { title: 'About', route: 'ContentViewer', icon: '📖', params: { pageKey: 'about', title: 'About Institution' } },
    { title: 'History', route: 'ContentViewer', icon: '📜', params: { pageKey: 'history', title: 'History' } },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome to IME</Text>
        <Text style={styles.userText}>{user?.fullName || user?.email}</Text>
        {user?.roleName === 'Admin' && (
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => navigation.navigate('AdminDashboard')}
          >
            <Text style={styles.adminButtonText}>⚙️ Admin Dashboard</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => navigation.navigate(item.route, item.params)}
          >
            <Card style={styles.cardContent}>
              <Card.Content style={styles.cardInner}>
                <Text style={styles.icon}>{item.icon}</Text>
                <Title style={styles.cardTitle}>{item.title}</Title>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoSection}>
        <Card style={styles.infoCard}>
          <Card.Content>
            <Title>About IME</Title>
            <Paragraph>
              The Institution of Municipal Engineering (IME) is a professional
              body dedicated to advancing the practice of municipal engineering.
            </Paragraph>
          </Card.Content>
        </Card>
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
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
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
  adminButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
    alignSelf: 'center',
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    marginBottom: 15,
  },
  cardContent: {
    elevation: 2,
  },
  cardInner: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  icon: {
    fontSize: 40,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  infoSection: {
    padding: 15,
    marginBottom: 20,
  },
  infoCard: {
    elevation: 2,
  },
});

export default HomeScreen;
