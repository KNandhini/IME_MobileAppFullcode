import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';
const LIGHT = '#F0F4F8';
const WHITE = '#FFFFFF';
const GREY = '#6B7A8D';

const OFFICE_BEARERS = [
    {
        title: 'President',
        icon: 'account-star-outline',
        desc: 'Honorary position with no remuneration (travel costs reimbursed). Conducts the AGM, heads all committees and disciplinary matters, and represents the institution at state, national and international forums.',
    },
    {
        title: 'Vice President',
        icon: 'account-star-outline',
        desc: "Performs the President's roles and responsibilities in their absence.",
    },
    {
        title: 'Secretary General',
        icon: 'briefcase-outline',
        desc: 'Administrative head responsible for the day-to-day running of the institution.',
    },
    {
        title: 'Treasurer General',
        icon: 'cash-check',
        desc: 'In charge of receipts and expenditure; maintains accounts as per audit requirements.',
    },
    {
        title: 'Secretary / Education',
        icon: 'school-outline',
        desc: 'In charge of education, training and research activities of the institution.',
    },
    {
        title: 'Secretary / Publication',
        icon: 'book-open-outline',
        desc: 'Responsible for designing and bringing out reading materials for members periodically.',
    },
    {
        title: 'Secretary / Welfare',
        icon: 'hand-heart-outline',
        desc: 'Develops welfare measures, manages a separate welfare budget, and handles related legal formalities.',
    },
];

const GovernanceDetailsScreen = ({ navigation }) => {
    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor={NAVY} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color={WHITE} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Governance</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <View style={styles.advisoryCard}>
                    <View style={styles.cardHeadRow}>
                        <MaterialCommunityIcons name="account-supervisor-outline" size={20} color={GOLD} />
                        <Text style={styles.advisoryTitle}>Central Advisory Body</Text>
                    </View>
                    <Text style={styles.advisoryText}>
                        Elite engineers, planners, senior technicians and computer officials retired from
                        service form the Central Advisory Body — not more than 7 members, with no voting
                        rights.
                    </Text>
                </View>

                <Text style={styles.sectionLabel}>Office Bearers</Text>
                {OFFICE_BEARERS.map((role, i) => (
                    <View key={i} style={styles.card}>
                        <View style={styles.cardHead}>
                            <View style={styles.iconWrap}>
                                <MaterialCommunityIcons name={role.icon} size={20} color={GOLD} />
                            </View>
                            <Text style={styles.cardTitle}>{role.title}</Text>
                        </View>
                        <Text style={styles.cardBody}>{role.desc}</Text>
                    </View>
                ))}

                <View style={styles.meetingsCard}>
                    <Text style={styles.meetingsTitle}>Management Meetings</Text>
                    <Text style={styles.cardBody}>
                        Three meetings are held per year, one of which is the Annual General Meeting (AGM).
                        Sub-committee meetings are convened as needed, at the President's discretion.
                    </Text>
                </View>

                <View style={styles.officeCard}>
                    <MaterialCommunityIcons name="map-marker-outline" size={20} color={GOLD} />
                    <Text style={styles.officeText}>
                        Registered office: <Text style={{ fontWeight: '700', color: NAVY }}>Chennai</Text>
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
    advisoryCard: {
        backgroundColor: NAVY, borderRadius: 12, padding: 16, marginBottom: 18,
    },
    cardHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    advisoryTitle: { color: WHITE, fontSize: 15, fontWeight: '700' },
    advisoryText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 19 },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: GREY, letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
    card: {
        backgroundColor: WHITE, borderRadius: 12, padding: 16, marginBottom: 10,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, borderLeftWidth: 4, borderLeftColor: GOLD,
    },
    cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    iconWrap: {
        width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(212,160,23,0.12)',
        alignItems: 'center', justifyContent: 'center', marginRight: 10,
    },
    cardTitle: { fontSize: 14, fontWeight: '700', color: NAVY },
    cardBody: { fontSize: 13, lineHeight: 19, color: '#444' },
    meetingsCard: {
        backgroundColor: WHITE, borderRadius: 12, padding: 16, marginTop: 8, marginBottom: 12,
    },
    meetingsTitle: { fontSize: 14, fontWeight: '700', color: NAVY, marginBottom: 6 },
    officeCard: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(212,160,23,0.12)', borderRadius: 10, padding: 14,
    },
    officeText: { fontSize: 13, color: '#444' },
});

export default GovernanceDetailsScreen;