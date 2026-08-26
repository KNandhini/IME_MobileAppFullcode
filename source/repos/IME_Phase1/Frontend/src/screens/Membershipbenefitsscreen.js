
import { COLORS } from './theme';
import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Animated,
    StatusBar,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    Modal,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Checkbox } from 'react-native-paper';
import IMELogo from '../components/IMELogo';
import { MembershipBenefitsScreenStyles as styles } from './screenStyles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const NAVY = COLORS.primary;
const NAVY_DEEP = COLORS.headerEnd;
const GOLD = COLORS.accent;
const BG = COLORS.bg;
const INK = COLORS.secondary;
const MUTED = '#64748B';

// ─────────────────────────────────────────────────────────────────────────
// Content model — each benefit is a { icon, title, blurb } triple.
// Kept as data (not hard-coded JSX) so the list can be reordered or
// extended later without touching layout code.
// ─────────────────────────────────────────────────────────────────────────
const BENEFITS = [
    {
        icon: 'shield-check-outline',
        title: 'Professional Recognition',
        blurb:
            'Stand out as a certified member of India’s premier municipal engineering body.',
    },
    {
        icon: 'certificate-outline',
        title: 'Official Membership Certificate',
        blurb:
            'A formal certificate acknowledging your grade and standing within IME.',
    },
    {
        icon: 'card-account-details-outline',
        title: 'Digital & Physical Member ID Card',
        blurb:
            'Carry your credentials everywhere — in your wallet and on your phone.',
    },
    {
        icon: 'account-group-outline',
        title: 'National Networking Opportunities',
        blurb:
            'Connect with municipal engineers and administrators across every State.',
    },
    {
        icon: 'school-outline',
        title: 'Technical Seminars & Workshops',
        blurb:
            'Hands-on sessions on roads, water, waste, and urban planning practice.',
    },
    {
        icon: 'office-building-outline',
        title: 'Conferences & Annual Conventions',
        blurb:
            'Attend the flagship All-India gathering of the municipal engineering fraternity.',
    },
    {
        icon: 'lightbulb-on-outline',
        title: 'Continuous Professional Development',
        blurb:
            'Structured CPD credits to keep your skills current and recognised.',
    },
    {
        icon: 'book-open-page-variant-outline',
        title: 'Technical Journals & Publications',
        blurb:
            'Regular access to IME research, case studies, and best-practice manuals.',
    },
    {
        icon: 'briefcase-outline',
        title: 'Leadership & Committee Opportunities',
        blurb:
            'Serve on State Chapters and National Council committees that shape policy.',
    },
    {
        icon: 'trending-up',
        title: 'Career Enhancement & Growth',
        blurb:
            'Build a track record that supports promotions, tenders, and postings.',
    },
    {
        icon: 'medal-outline',
        title: 'Recognition Across India',
        blurb:
            'Be known among peers through awards and featured project showcases.',
    },
    {
        icon: 'lock-check-outline',
        title: 'Exclusive Member Resources',
        blurb:
            'Private access to DPRs, drawings, SOPs, and the members-only library.',
    },
];

const MembershipBenefitsScreen = ({ navigation }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(24)).current;

    // Single combined acceptance for Welcome Message + Membership Benefits +
    // Terms & Conditions, all of which are now rendered inline on this page.
    const [accepted, setAccepted] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
const [selectedCategory, setSelectedCategory] = useState(null);


   useEffect(() => {
    Animated.parallel([
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 550,
            useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 550,
            useNativeDriver: true,
        }),
    ]).start();
}, []);

    
    // No signup API call happens here — the form fields don't exist yet at
    // this stage. We just carry the acceptance + fee forward as route params
    // so SignupScreen can trust that terms were already accepted, then show
    // the payment screen once registration itself succeeds.
  const handleContinue = () => {
    if (!accepted) return;

    setShowCategoryModal(true);
};



    return (
        <SafeAreaView style={styles.root}>
            <StatusBar
                backgroundColor={COLORS.headerStart}
                barStyle="light-content"
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* ── Hero ── */}
                <LinearGradient
                    colors={[COLORS.headerStart, NAVY_DEEP]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.hero}
                >
                    {navigation?.canGoBack?.() && (
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => navigation.goBack()}
                        >
                            <MaterialCommunityIcons
                                name="arrow-left"
                                size={20}
                                color={COLORS.white}
                            />
                        </TouchableOpacity>
                    )}

                    <View style={styles.heroRing1} />
                    <View style={styles.heroRing2} />

                    <IMELogo size="medium" animated={false} />

                    <Text style={styles.heroTitle}>
                        Become an IME Member
                    </Text>

                    <Text style={styles.heroSubtitle}>
                        Join India’s premier professional institution dedicated
                        to Municipal Engineering excellence, innovation, and
                        sustainable urban development.
                    </Text>

                    {/* Decorative gold divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <View style={styles.dividerDiamond} />
                        <View style={styles.dividerLine} />
                    </View>
                </LinearGradient>

                {/* Seal badge — overlaps the hero/body seam */}
                <View style={styles.sealWrap}>
                    <View style={styles.seal}>
                        <MaterialCommunityIcons
                            name="certificate"
                            size={26}
                            color={NAVY}
                        />
                    </View>

                    <Text style={styles.sealText}>
                        Nationally Recognised Institution
                    </Text>
                </View>

                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }}
                >
                    {/* ── Benefits ── */}
                    <View style={styles.section}>
                        <Text style={styles.eyebrow}>
                            WHAT YOU RECEIVE
                        </Text>

                        <Text style={styles.sectionTitle}>
                            Membership Benefits
                        </Text>

                        <View style={styles.benefitsList}>
                            {BENEFITS.map((b) => (
                                <View
                                    key={b.title}
                                    style={styles.benefitCard}
                                >
                                    <View style={styles.benefitIconWrap}>
                                        <MaterialCommunityIcons
                                            name={b.icon}
                                            size={22}
                                            color={GOLD}
                                        />
                                    </View>

                                    <View style={styles.benefitTextWrap}>
                                        <Text style={styles.benefitTitle}>
                                            {b.title}
                                        </Text>

                                        <Text style={styles.benefitBlurb}>
                                            {b.blurb}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* ── Terms & Conditions ── */}
                    <View style={styles.section}>
                        <Text style={styles.eyebrow}>
                            BEFORE YOU CONTINUE
                        </Text>

                        <Text style={styles.sectionTitle}>
                            Terms & Conditions
                        </Text>

                        <View style={styles.termsCard}>
                            <Text style={styles.termsText}>
                                By continuing, you confirm that the details
                                submitted during registration are accurate and
                                belong to you.
                            </Text>

                            <Text style={styles.termsText}>
                                Membership activation is subject to successful
                                payment verification and approval by the IME
                                administration.
                            </Text>

                            <Text style={styles.termsText}>
                                The  membership fee is non-transferable.
                                Payment status and receipts will be maintained
                                in your member account.
                            </Text>

                            <Text
                                style={[
                                    styles.termsText,
                                    { marginBottom: 0 },
                                ]}
                            >
                                You agree to follow IME member guidelines and
                                understand that misuse of the account may lead
                                to restricted access.
                            </Text>
                        </View>
                    </View>

                    {/* ── Registration Fee ── */}
                    <View style={styles.section}>
                        <Text
                            style={[
                                styles.eyebrow,
                                { marginBottom: 12 },
                            ]}
                        >
                            REGISTRATION FEE
                        </Text>

                        {/* Membership Category Fees */}
                        <View style={styles.membershipFeeInfoCard}>
                            <View style={styles.membershipFeeHeader}>
                                <MaterialCommunityIcons
                                    name="account-group-outline"
                                    size={22}
                                    color={NAVY}
                                />

                                <Text style={styles.membershipFeeTitle}>
                                    Membership Fee Details
                                </Text>
                            </View>

                            <View style={styles.membershipFeeRow}>
                                <Text style={styles.membershipFeeCategory}>
                                    Serving / Retired Engineers
                                </Text>

                                <Text style={styles.membershipFeeAmount}>
                                    ₹1,000/-
                                </Text>
                            </View>

                            <View style={styles.membershipFeeDivider} />

                            <View style={styles.membershipFeeRow}>
                                <Text style={styles.membershipFeeCategory}>
                                    Engineering Students
                                </Text>

                                <Text style={styles.membershipFeeAmount}>
                                    ₹500/-
                                </Text>
                            </View>

                            <View style={styles.membershipFeeDivider} />

                            <View style={styles.membershipFeeRow}>
                                <Text style={styles.membershipFeeCategory}>
                                    Organisations / Others
                                </Text>

                                <Text style={styles.membershipFeeAmount}>
                                    ₹5,000/-
                                </Text>
                            </View>
                        </View>

                       
                    </View>

                    {/* ── Acceptance ── */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.commitCard}
                            activeOpacity={0.85}
                            onPress={() => setAccepted((v) => !v)}
                        >
                            <View pointerEvents="none">
                                <Checkbox
                                    status={
                                        accepted
                                            ? 'checked'
                                            : 'unchecked'
                                    }
                                    color={NAVY}
                                />
                            </View>

                            <Text style={styles.commitText}>
                                I have read and agree to the Membership
                                Benefits and Terms & Conditions.
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.continueBtn,
                                !accepted &&
                                    styles.continueBtnDisabled,
                            ]}
                            activeOpacity={0.85}
                            disabled={!accepted}
                            onPress={handleContinue}
                        >
                            <Text style={styles.continueBtnText}>
                                Continue to Registration
                            </Text>

                            <MaterialCommunityIcons
                                name="arrow-right"
                                size={18}
                                color={COLORS.white}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.backLink}>
                                Already a member? Login
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.footerNote}>
                        Membership is subject to eligibility review and
                        approval by the National Council.
                    </Text>
                </Animated.View>
                <Modal
    visible={showCategoryModal}
    transparent
    animationType="fade"
    onRequestClose={() => setShowCategoryModal(false)}
>
    <View style={styles.modalOverlay}>
        <View style={styles.categoryModal}>
            
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                    Select Membership Category
                </Text>

                <TouchableOpacity
                    onPress={() => setShowCategoryModal(false)}
                >
                    <MaterialCommunityIcons
                        name="close"
                        size={24}
                        color={MUTED}
                    />
                </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
                Please select your membership category to continue.
            </Text>

            {/* Serving / Retired Engineers */}
            <TouchableOpacity
                style={[
                    styles.categoryOption,
                    selectedCategory === 'Serving / Retired Engineers' &&
                        styles.categoryOptionSelected,
                ]}
                onPress={() =>
                    setSelectedCategory('Serving / Retired Engineers')
                }
                activeOpacity={0.8}
            >
                <MaterialCommunityIcons
                    name="account-hard-hat-outline"
                    size={24}
                    color={NAVY}
                />

                <Text style={styles.categoryOptionText}>
                    Serving / Retired Engineers
                </Text>

                {selectedCategory === 'Serving / Retired Engineers' && (
                    <MaterialCommunityIcons
                        name="check-circle"
                        size={22}
                        color={NAVY}
                    />
                )}
            </TouchableOpacity>

            {/* Engineering Students */}
            <TouchableOpacity
                style={[
                    styles.categoryOption,
                    selectedCategory === 'Engineering Students' &&
                        styles.categoryOptionSelected,
                ]}
                onPress={() =>
                    setSelectedCategory('Engineering Students')
                }
                activeOpacity={0.8}
            >
                <MaterialCommunityIcons
                    name="school-outline"
                    size={24}
                    color={NAVY}
                />

                <Text style={styles.categoryOptionText}>
                    Engineering Students
                </Text>

                {selectedCategory === 'Engineering Students' && (
                    <MaterialCommunityIcons
                        name="check-circle"
                        size={22}
                        color={NAVY}
                    />
                )}
            </TouchableOpacity>

            {/* Organisations / Others */}
            <TouchableOpacity
                style={[
                    styles.categoryOption,
                    selectedCategory === 'Organisations / Others' &&
                        styles.categoryOptionSelected,
                ]}
                onPress={() =>
                    setSelectedCategory('Organisations / Others')
                }
                activeOpacity={0.8}
            >
                <MaterialCommunityIcons
                    name="office-building-outline"
                    size={24}
                    color={NAVY}
                />

                <Text style={styles.categoryOptionText}>
                    Organisations / Others
                </Text>

                {selectedCategory === 'Organisations / Others' && (
                    <MaterialCommunityIcons
                        name="check-circle"
                        size={22}
                        color={NAVY}
                    />
                )}
            </TouchableOpacity>

            {/* Continue */}
            <TouchableOpacity
                style={[
                    styles.modalContinueBtn,
                    !selectedCategory &&
                        styles.modalContinueBtnDisabled,
                ]}
                disabled={!selectedCategory}
                onPress={() => {
                    setShowCategoryModal(false);

                    navigation.navigate('Signup', {
                        termsAccepted: true,
                        membershipCategory: selectedCategory,
                    });
                }}
            >
                <Text style={styles.modalContinueText}>
                    Proceed to Registration
                </Text>

                <MaterialCommunityIcons
                    name="arrow-right"
                    size={18}
                    color={COLORS.white}
                />
            </TouchableOpacity>

        </View>
    </View>
</Modal>

            </ScrollView>
        </SafeAreaView>
    );
};

export default MembershipBenefitsScreen;

