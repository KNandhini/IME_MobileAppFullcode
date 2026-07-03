import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const NAVY = '#003366';
const GOLD = '#D4AF37';

const WelcomeCard = ({ onViewMore }) => (
    <View style={styles.card}>
        <Text style={styles.welcome}>
            Welcome to Institution of Municipal Engineers, India (IME India)
        </Text>
        <Text style={styles.tagline}>Engineering Better Cities for Tomorrow</Text>

        <Text style={styles.desc} numberOfLines={4}>
            IME (India) is the national professional body dedicated to strengthening
            municipal engineering and promoting sustainable urban infrastructure
            across India.
        </Text>

        <TouchableOpacity style={styles.btn} onPress={onViewMore} activeOpacity={0.85}>
            <Text style={styles.btnText}>View More</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    welcome: { fontSize: 15, fontWeight: '800', color: NAVY, marginBottom: 4 },
    tagline: { fontSize: 12, fontWeight: '600', color: GOLD, marginBottom: 10 },
    desc: { fontSize: 13, color: '#4A5568', lineHeight: 19, marginBottom: 14 },
    btn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        alignSelf: 'flex-start', backgroundColor: NAVY,
        borderRadius: 10, paddingVertical: 9, paddingHorizontal: 18,
    },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 13, marginRight: 6 },
});

export default WelcomeCard;