import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FeesDetailsStyles as styles } from './screenStyles';

const NAVY = COLORS.primary;
const GOLD = COLORS.accent;
const LIGHT = COLORS.bg;
const WHITE = COLORS.white;
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
            <StatusBar barStyle="light-content" backgroundColor={COLORS.headerStart} />
            <GradientHeader style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color={WHITE} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Fee Structure</Text>
            </GradientHeader>

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



export default FeesDetailsScreen;