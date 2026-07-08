import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Animated,
    StatusBar, TouchableOpacity, SafeAreaView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Checkbox } from 'react-native-paper';
import IMELogo from '../components/IMELogo';

const { width } = Dimensions.get('window');

const NAVY = '#1E3A5F';
const NAVY_DEEP = '#12253D';
const GOLD = '#D4A017';
const BG = '#F5F7FA';
const INK = '#334155';
const MUTED = '#64748B';

// ─────────────────────────────────────────────────────────────────────────
// Content model — each benefit is a { icon, title, blurb } triple. Kept as
// data (not hard-coded JSX) so the list can be reordered or extended later
// without touching layout code.
// ─────────────────────────────────────────────────────────────────────────
const BENEFITS = [
    { icon: 'shield-check-outline', title: 'Professional Recognition', blurb: 'Stand out as a certified member of India\u2019s premier municipal engineering body.' },
    { icon: 'certificate-outline', title: 'Official Membership Certificate', blurb: 'A formal certificate acknowledging your grade and standing within IME.' },
    { icon: 'card-account-details-outline', title: 'Digital & Physical Member ID Card', blurb: 'Carry your credentials everywhere \u2014 in your wallet and on your phone.' },
    { icon: 'account-group-outline', title: 'National Networking Opportunities', blurb: 'Connect with municipal engineers and administrators across every State.' },
    { icon: 'school-outline', title: 'Technical Seminars & Workshops', blurb: 'Hands-on sessions on roads, water, waste, and urban planning practice.' },
    { icon: 'office-building-outline', title: 'Conferences & Annual Conventions', blurb: 'Attend the flagship All-India gathering of the municipal engineering fraternity.' },
    { icon: 'lightbulb-on-outline', title: 'Continuous Professional Development', blurb: 'Structured CPD credits to keep your skills current and recognised.' },
    { icon: 'book-open-page-variant-outline', title: 'Technical Journals & Publications', blurb: 'Regular access to IME research, case studies, and best-practice manuals.' },
    { icon: 'briefcase-outline', title: 'Leadership & Committee Opportunities', blurb: 'Serve on State Chapters and National Council committees that shape policy.' },
    { icon: 'trending-up', title: 'Career Enhancement & Growth', blurb: 'Build a track record that supports promotions, tenders, and postings.' },
    { icon: 'medal-outline', title: 'Recognition Across India', blurb: 'Be known among peers through awards and featured project showcases.' },
    { icon: 'lock-check-outline', title: 'Exclusive Member Resources', blurb: 'Private access to DPRs, drawings, SOPs, and the members-only library.' },
];

const MembershipBenefitsScreen = ({ navigation }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(24)).current;
    const [agreed, setAgreed] = useState(false);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 550, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 550, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleContinue = () => {
        if (!agreed) return;
        navigation.navigate('Signup');
    };

    return (
        <SafeAreaView style={styles.root}>
            <StatusBar backgroundColor={NAVY_DEEP} barStyle="light-content" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* ── Hero ── */}
                <LinearGradient colors={[NAVY_DEEP, NAVY]} style={styles.hero}>
                    {navigation?.canGoBack?.() && (
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
                        </TouchableOpacity>
                    )}

                    <View style={styles.heroRing1} />
                    <View style={styles.heroRing2} />

                    <IMELogo size="medium" animated={false} />

                    <Text style={styles.heroTitle}>Become an IME Member</Text>
                    <Text style={styles.heroSubtitle}>
                        Join India&rsquo;s premier professional institution dedicated to
                        Municipal Engineering excellence, innovation, and sustainable
                        urban development.
                    </Text>

                    {/* Decorative gold divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <View style={styles.dividerDiamond} />
                        <View style={styles.dividerLine} />
                    </View>
                </LinearGradient>

                {/* Seal badge — overlaps the hero/body seam, the certificate motif this
                    screen is built around */}
                <View style={styles.sealWrap}>
                    <View style={styles.seal}>
                        <MaterialCommunityIcons name="certificate" size={26} color={NAVY} />
                    </View>
                    <Text style={styles.sealText}>Nationally Recognised Institution</Text>
                </View>

                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

                    {/* ── Benefits ── */}
                    <View style={styles.section}>
                        <Text style={styles.eyebrow}>WHAT YOU RECEIVE</Text>
                        <Text style={styles.sectionTitle}>Membership Benefits</Text>

                        <View style={styles.benefitsList}>
                            {BENEFITS.map((b, i) => (
                                <View key={b.title} style={styles.benefitCard}>
                                    <View style={styles.benefitIconWrap}>
                                        <MaterialCommunityIcons name={b.icon} size={22} color={NAVY} />
                                    </View>
                                    <View style={styles.benefitTextWrap}>
                                        <Text style={styles.benefitTitle}>{b.title}</Text>
                                        <Text style={styles.benefitBlurb}>{b.blurb}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* ── Why Join IME ── */}
                    <View style={styles.whySection}>
                        <View style={styles.whyCard}>
                            <View style={styles.whyQuoteMark}>
                                <MaterialCommunityIcons name="format-quote-open" size={22} color={GOLD} />
                            </View>
                            <Text style={styles.whyText}>
                                IME connects municipal engineers, promotes technical
                                excellence, supports lifelong learning, and contributes to
                                building smarter, sustainable cities across India.
                            </Text>
                            <View style={styles.whyGoldRule} />
                            <Text style={styles.whyAttribution}>Institution of Municipal Engineers, India</Text>
                        </View>
                    </View>

                    {/* ── Commitment ── */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.commitCard}
                            activeOpacity={0.85}
                            onPress={() => setAgreed((v) => !v)}>
                            <View pointerEvents="none">
                                <Checkbox status={agreed ? 'checked' : 'unchecked'} color={NAVY} />
                            </View>
                            <Text style={styles.commitText}>
                                I have read and understood the membership benefits and wish
                                to continue with my membership registration.
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.continueBtn, !agreed && styles.continueBtnDisabled]}
                            activeOpacity={0.85}
                            disabled={!agreed}
                            onPress={handleContinue}>
                            <Text style={styles.continueBtnText}>Continue to Registration</Text>
                            <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.footerNote}>
                        Membership is subject to eligibility review and approval by the
                        National Council.
                    </Text>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    scrollContent: { paddingBottom: 36 },

    // Hero
    hero: {
        alignItems: 'center',
        paddingTop: 22,
        paddingBottom: 46,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        overflow: 'hidden',
    },
    backBtn: {
        position: 'absolute', top: 18, left: 18, zIndex: 10,
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.14)',
        alignItems: 'center', justifyContent: 'center',
    },
    heroRing1: {
        position: 'absolute', top: -60, right: -50,
        width: 180, height: 180, borderRadius: 90,
        borderWidth: 1, borderColor: 'rgba(212,160,23,0.18)',
    },
    heroRing2: {
        position: 'absolute', bottom: -70, left: -60,
        width: 200, height: 200, borderRadius: 100,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    heroTitle: {
        color: '#fff', fontSize: 22, fontWeight: '800',
        marginTop: 16, textAlign: 'center', letterSpacing: 0.2,
    },
    heroSubtitle: {
        color: 'rgba(255,255,255,0.78)', fontSize: 13, lineHeight: 20,
        textAlign: 'center', marginTop: 10, maxWidth: width - 80,
    },
    divider: {
        flexDirection: 'row', alignItems: 'center', marginTop: 18, gap: 8,
    },
    dividerLine: { width: 44, height: 1, backgroundColor: 'rgba(212,160,23,0.55)' },
    dividerDiamond: {
        width: 7, height: 7, backgroundColor: GOLD,
        transform: [{ rotate: '45deg' }], borderRadius: 1,
    },

    // Seal badge
    sealWrap: { alignItems: 'center', marginTop: -34, marginBottom: 8 },
    seal: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: GOLD,
        shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
        elevation: 5,
    },
    sealText: {
        marginTop: 8, fontSize: 11.5, fontWeight: '700', color: NAVY,
        letterSpacing: 0.3,
    },

    // Sections
    section: { paddingHorizontal: 20, marginTop: 22 },
    eyebrow: { fontSize: 11, fontWeight: '800', color: GOLD, letterSpacing: 1.4 },
    sectionTitle: { fontSize: 19, fontWeight: '800', color: NAVY, marginTop: 4, marginBottom: 14 },

    benefitsList: { gap: 12 },
    benefitCard: {
        flexDirection: 'row', backgroundColor: '#fff', borderRadius: 18,
        padding: 14, alignItems: 'flex-start', gap: 12,
        shadowColor: '#0F2A4A', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
        elevation: 2, borderWidth: 1, borderColor: '#EEF1F6',
    },
    benefitIconWrap: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: '#EAF0F8', alignItems: 'center', justifyContent: 'center',
    },
    benefitTextWrap: { flex: 1 },
    benefitTitle: { fontSize: 14, fontWeight: '700', color: NAVY, marginBottom: 3 },
    benefitBlurb: { fontSize: 12.5, color: MUTED, lineHeight: 18 },

    // Why Join IME
    whySection: { paddingHorizontal: 20, marginTop: 26 },
    whyCard: {
        backgroundColor: NAVY_DEEP, borderRadius: 20, padding: 22,
        borderLeftWidth: 4, borderLeftColor: GOLD,
    },
    whyQuoteMark: { marginBottom: 8 },
    whyText: { color: '#F1F5F9', fontSize: 14.5, lineHeight: 23, fontWeight: '500' },
    whyGoldRule: { width: 36, height: 2, backgroundColor: GOLD, marginTop: 16, marginBottom: 8 },
    whyAttribution: { color: 'rgba(255,255,255,0.6)', fontSize: 11.5, fontWeight: '600' },

    // Commitment
    commitCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E2E8F0',
        marginBottom: 14,
    },
    commitText: { flex: 1, fontSize: 13, color: INK, lineHeight: 19, fontWeight: '500' },

    continueBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: NAVY, borderRadius: 14, paddingVertical: 15,
        shadowColor: NAVY, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 5 },
        elevation: 3,
    },
    continueBtnDisabled: { backgroundColor: '#9CA9B8', shadowOpacity: 0 },
    continueBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    footerNote: {
        textAlign: 'center', fontSize: 11.5, color: '#94A3B8',
        marginTop: 18, paddingHorizontal: 40, lineHeight: 17,
    },
});

export default MembershipBenefitsScreen;