import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';
const LIGHT = '#F0F4F8';
const WHITE = '#FFFFFF';
const GREY = '#6B7A8D';

const FEES = [
    { category: 'Life Members', inr: '₹10,000', usd: '$100' },
    { category: 'Members', inr: '₹5,000', usd: '$50' },
    { category: 'Associate Members', inr: '₹2,000', usd: '$20' },
    { category: 'Senior Technicians', inr: '₹1,000', usd: '$10' },
    { category: 'Technicians', inr: '₹500', usd: '$5' },
    { category: 'Educational Institutions', inr: '₹20,000', usd: '$200' },
    { category: 'R&D Units', inr: '₹10,000', usd: '$100' },
    { category: 'Consulting Agencies', inr: '₹10,000', usd: '$100' },
    { category: 'Execution Agencies', inr: '₹50,000', usd: '$500' },
];

const FeesDetailsScreen = ({ navigation }) => {
    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor={NAVY} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color={WHITE} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Fee Structure</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <Text style={styles.introText}>
                    One-time membership fee, payable at the time of enrolment based on category.
                </Text>

                <View style={styles.table}>
                    <View style={[styles.row, styles.tableHead]}>
                        <Text style={[styles.cellCategory, styles.headText]}>Category</Text>
                        <Text style={[styles.cellAmount, styles.headText]}>INR</Text>
                        <Text style={[styles.cellAmount, styles.headText]}>USD</Text>
                    </View>
                    {FEES.map((f, i) => (
                        <View key={i} style={[styles.row, i % 2 === 1 && styles.rowAlt]}>
                            <Text style={styles.cellCategory}>{f.category}</Text>
                            <Text style={styles.cellAmount}>{f.inr}</Text>
                            <Text style={styles.cellAmount}>{f.usd}</Text>
                        </View>
                    ))}
                </View>

                <Text style={styles.note}>
                    Categories not covered above will be determined by the advisory body.
                </Text>

                <View style={styles.paymentCard}>
                    <View style={styles.cardHead}>
                        <MaterialCommunityIcons name="bank-transfer" size={20} color={GOLD} />
                        <Text style={styles.paymentTitle}>Payment Details</Text>
                    </View>
                    <Text style={styles.cardBody}>
                        Payments are processed through the institution's official bank account, operated by
                        the Secretary General and Treasurer General as authorised by the President. Full
                        account details will be shared upon successful registration of your application.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: LIGHT },
    header: {
        backgroundColor: NAVY, paddingTop: 48, paddingBottom: 18, paddingHorizontal: 16,
        flexDirection: 'row', alignItems: 'center',
    },
    backBtn: { marginRight: 14, padding: 4 },
    headerTitle: { color: WHITE, fontSize: 19, fontWeight: '800' },
    scroll: { padding: 16, paddingBottom: 40 },
    introText: { fontSize: 14, lineHeight: 21, color: GREY, marginBottom: 16 },
    table: {
        backgroundColor: WHITE, borderRadius: 12, overflow: 'hidden',
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4,
    },
    row: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center' },
    tableHead: { backgroundColor: NAVY },
    rowAlt: { backgroundColor: '#F7F9FB' },
    headText: { color: WHITE, fontWeight: '700', fontSize: 12 },
    cellCategory: { flex: 2, fontSize: 13, color: '#333', fontWeight: '600' },
    cellAmount: { flex: 1, fontSize: 13, color: NAVY, fontWeight: '700', textAlign: 'right' },
    note: { fontSize: 12, color: GREY, marginTop: 12, fontStyle: 'italic', lineHeight: 18 },
    paymentCard: {
        backgroundColor: WHITE, borderRadius: 12, padding: 16, marginTop: 18,
        borderLeftWidth: 4, borderLeftColor: GOLD,
    },
    cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    paymentTitle: { fontSize: 15, fontWeight: '700', color: NAVY },
    cardBody: { fontSize: 13, lineHeight: 19, color: '#444' },
});

export default FeesDetailsScreen;