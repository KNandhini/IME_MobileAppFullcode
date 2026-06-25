import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';
const LIGHT = '#F0F4F8';
const WHITE = '#FFFFFF';
const GREY = '#6B7A8D';

const MEMBERSHIP_TIERS = [
    {
        title: 'Life Members',
        icon: 'crown-outline',
        eligibility: 'Doctorate in engineering with minimum 15 years of engineering experience in local body institutions.',
    },
    {
        title: 'Members',
        icon: 'account-tie-outline',
        eligibility: 'Post graduate in engineering with minimum 20 years of experience in local institutions, OR Graduate in engineering with 25 years of experience in local institutions.',
    },
    {
        title: 'Associate Members',
        icon: 'account-outline',
        eligibility: 'Graduate in Engineering with minimum 3 years experience, OR Graduate in ECE/Computer Engineering with 5 years experience in local institutions.',
    },
    {
        title: 'Senior Technicians',
        icon: 'tools',
        eligibility: 'Diploma in engineering with minimum 3 years experience in local institutions.',
    },
    {
        title: 'Technicians',
        icon: 'wrench-outline',
        eligibility: 'ITI certificate with minimum 5 years experience in local institutions.',
    },
    {
        title: 'Institutional Members',
        icon: 'office-building-outline',
        eligibility: 'Engineering companies, product developers, infrastructure firms, R&D institutions, consultancy firms, and engineering colleges. No voting rights.',
    },
];

const MembershipDetailsScreen = ({ navigation }) => {
    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor={NAVY} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color={WHITE} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Membership</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <Text style={styles.introText}>
                    Membership is structured across six categories, recognising both qualification and
                    field experience in local body engineering.
                </Text>

                {MEMBERSHIP_TIERS.map((tier, i) => (
                    <View key={i} style={styles.card}>
                        <View style={styles.cardHead}>
                            <View style={styles.iconWrap}>
                                <MaterialCommunityIcons name={tier.icon} size={22} color={GOLD} />
                            </View>
                            <Text style={styles.cardTitle}>{tier.title}</Text>
                        </View>
                        <Text style={styles.cardBody}>{tier.eligibility}</Text>
                    </View>
                ))}

                <View style={styles.benefitsCard}>
                    <Text style={styles.benefitsTitle}>Member Benefits</Text>
                    {[
                        'Access to technical conferences, exhibitions and seminars',
                        'E-magazines and technical publications',
                        'Opportunities for higher studies and exchange visits abroad',
                        'Welfare schemes: health awareness, language proficiency, guidance for higher learning',
                        'Eligibility for institutional support — arbitration, adjudication, technical audit',
                    ].map((b, i) => (
                        <View key={i} style={styles.benefitRow}>
                            <MaterialCommunityIcons name="check-circle" size={16} color={GOLD} style={{ marginTop: 1 }} />
                            <Text style={styles.benefitText}>{b}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: LIGHT },
    header: {
        backgroundColor: NAVY,
        paddingTop: 48,
        paddingBottom: 18,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: { marginRight: 14, padding: 4 },
    headerTitle: { color: WHITE, fontSize: 19, fontWeight: '800' },
    scroll: { padding: 16, paddingBottom: 40 },
    introText: { fontSize: 14, lineHeight: 21, color: GREY, marginBottom: 16 },
    card: {
        backgroundColor: WHITE,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: GOLD,
    },
    cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    iconWrap: {
        width: 38, height: 38, borderRadius: 9,
        backgroundColor: 'rgba(212,160,23,0.12)',
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    cardTitle: { fontSize: 15, fontWeight: '700', color: NAVY },
    cardBody: { fontSize: 13, lineHeight: 19, color: '#444' },
    benefitsCard: {
        backgroundColor: NAVY,
        borderRadius: 12,
        padding: 18,
        marginTop: 8,
    },
    benefitsTitle: { color: WHITE, fontSize: 16, fontWeight: '700', marginBottom: 12 },
    benefitRow: { flexDirection: 'row', marginBottom: 10, gap: 8 },
    benefitText: { flex: 1, fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.85)' },
});

export default MembershipDetailsScreen;