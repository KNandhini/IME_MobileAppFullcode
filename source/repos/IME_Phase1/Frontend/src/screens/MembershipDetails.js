import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MembershipDetailsStyles as styles } from './screenStyles';

const NAVY = COLORS.dark;
const GOLD = COLORS.accent;
const LIGHT = COLORS.bg;
const WHITE = COLORS.white;
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
            <StatusBar barStyle="light-content" backgroundColor={COLORS.headerStart} />
            <GradientHeader style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color={WHITE} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Membership</Text>
            </GradientHeader>

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



export default MembershipDetailsScreen;