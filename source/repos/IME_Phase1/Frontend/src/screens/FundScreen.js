import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';

const FundScreen = ({ navigation }) => {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroBanner}>
        <Text style={styles.heroIcon}>💰</Text>
        <Text style={styles.heroTitle}>IME Fund</Text>
        <Text style={styles.heroSubtitle}>Support & Contribute to IME Initiatives</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Membership Fee</Text>
        <Text style={styles.cardDesc}>Pay your annual membership fee to stay active and access all IME benefits.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Payment')}>
          <Text style={styles.btnText}>Pay Fee →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment History</Text>
        <Text style={styles.cardDesc}>View all your past payments and transaction references.</Text>
        <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => navigation.navigate('PaymentHistory')}>
          <Text style={styles.btnOutlineText}>View History →</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, styles.comingSoonCard]}>
        <Text style={styles.comingSoonBadge}>Coming Soon</Text>
        <Text style={styles.cardTitle}>Donate to IME</Text>
        <Text style={styles.cardDesc}>Contribute to special projects and events organised by IME.</Text>
      </View>

      <View style={[styles.card, styles.comingSoonCard]}>
        <Text style={styles.comingSoonBadge}>Coming Soon</Text>
        <Text style={styles.cardTitle}>IME Welfare Fund</Text>
        <Text style={styles.cardDesc}>Support fellow members in times of need through the IME Welfare Fund.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F4F6F9' },
  content:         { padding: 16, paddingBottom: 32 },

  heroBanner: {
    backgroundColor: '#1E3A5F',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIcon:     { fontSize: 48, marginBottom: 8 },
  heroTitle:    { fontSize: 26, fontWeight: '800', color: '#D4A017', marginBottom: 4 },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  comingSoonCard: { opacity: 0.65 },
  comingSoonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D4A017',
    color: '#1E3A5F',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    marginBottom: 8,
    overflow: 'hidden',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1E3A5F', marginBottom: 6 },
  cardDesc:  { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 14 },

  btn: {
    backgroundColor: '#1E3A5F',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  btnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#1E3A5F' },
  btnOutlineText: { color: '#1E3A5F', fontWeight: '700', fontSize: 14 },
});

export default FundScreen;
