import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GovernanceDetailsStyles as styles } from './screenStyles';

const NAVY = COLORS.dark;
const GOLD = COLORS.accent;
const LIGHT = COLORS.bg;
const WHITE = COLORS.white;
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
          
            
                <GradientHeader style={styles.header}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.headerStart} />
            
                        <View style={styles.headerRow}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={styles.backBtn}
                            >
                                <MaterialCommunityIcons
                                    name="arrow-left"
                                    size={22}
                                    color={WHITE}
                                />
                            </TouchableOpacity>
            
                            <Text style={styles.headerTitle}>Governance</Text>
                        </View>
            
            
            
            
                    </GradientHeader>

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



export default GovernanceDetailsScreen;