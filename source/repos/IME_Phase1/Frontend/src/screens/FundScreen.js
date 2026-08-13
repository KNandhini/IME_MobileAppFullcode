import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { FundScreenStyles as styles } from './screenStyles';

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
        <Text style={styles.cardDesc}>Pay your one-time membership fee to stay active and access all IME benefits.</Text>
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



export default FundScreen;
