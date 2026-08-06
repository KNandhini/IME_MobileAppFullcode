import { COLORS } from './theme';
import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Animated,
    StatusBar, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Accordion, SubAccordion, NumberedItem, BulletItem } from '../components/Accordion';
import IMELogo from '../components/IMELogo';

const NAVY = COLORS.dark;
const ROYAL = COLORS.primary;
const GOLD = COLORS.accent;
const BG = COLORS.bg;

// ─────────────────────────────────────────────────────────────────────────
// Section registry — drives both the quick-nav chips and the scroll targets.
// Keeping this in one place makes it easy to reorder or add sections later
// without touching the chip bar and the accordions separately.
// ─────────────────────────────────────────────────────────────────────────
const SECTIONS = [
    { key: 'vision', label: 'Vision', icon: 'visibility' },
    { key: 'mission', label: 'Mission', icon: 'flag' },
    { key: 'objectives', label: 'Objectives', icon: 'track-changes' },
    { key: 'aims', label: 'Aims & Objects', icon: 'assignment' },
    { key: 'moa', label: 'Association', icon: 'description' },
    { key: 'mou', label: 'MoU', icon: 'handshake' },
    { key: 'byelaws', label: 'Bye-Laws', icon: 'gavel' },
];

const AboutIMEScreen = ({ navigation }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scrollRef = useRef(null);
    const sectionY = useRef({});
    const [activeSection, setActiveSection] = useState('vision');

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const scrollToSection = (key) => {
        setActiveSection(key);
        const y = sectionY.current[key];
        if (scrollRef.current && typeof y === 'number') {
            scrollRef.current.scrollTo({ y: Math.max(y - 12, 0), animated: true });
        }
    };

    const registerY = (key) => (e) => {
        sectionY.current[key] = e.nativeEvent.layout.y;
    };

    return (
        <SafeAreaView style={styles.root}>
            <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />

            {/* Top banner */}
            <LinearGradient
                colors={[COLORS.headerStart, COLORS.headerEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.banner}>
                {/*<TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={22} color={COLORS.white} />
                </TouchableOpacity>*/}
                <IMELogo size="small" animated={false} />
                <Text style={styles.bannerTitle}>Institutional Profile (India)</Text>
            </LinearGradient>

            {/* Quick-nav chip bar */}
            <View style={styles.navWrap}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.navContent}>
                    {SECTIONS.map((s) => {
                        const active = activeSection === s.key;
                        return (
                            <TouchableOpacity
                                key={s.key}
                                style={[styles.navChip, active && styles.navChipActive]}
                                onPress={() => scrollToSection(s.key)}
                                activeOpacity={0.8}>
                                <MaterialIcons
                                    name={s.icon}
                                    size={15}
                                    color={active ? COLORS.white : ROYAL}
                                />
                                <Text style={[styles.navChipText, active && styles.navChipTextActive]}>
                                    {s.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <Animated.ScrollView
                ref={scrollRef}
                style={{ opacity: fadeAnim }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}>

                {/* Quick facts strip — the details people look up most, at a glance */}
                <View style={styles.factsCard}>
                    <View style={styles.factRow}>
                        <MaterialIcons name="place" size={16} color={ROYAL} />
                        <Text style={styles.factLabel}>Registered Office</Text>
                        <Text style={styles.factValue}>Chennai, Tamil Nadu</Text>
                    </View>
                    <View style={styles.factDivider} />
                    <View style={styles.factRow}>
                        <MaterialIcons name="public" size={16} color={ROYAL} />
                        <Text style={styles.factLabel}>Jurisdiction</Text>
                        <Text style={styles.factValue}>All-India</Text>
                    </View>
                    <View style={styles.factDivider} />
                    <View style={styles.factRow}>
                        <MaterialIcons name="star" size={16} color={ROYAL} />
                        <Text style={styles.factLabel}>Founding Chapter</Text>
                        <Text style={styles.factValue}>Tamil Nadu (Chennai)</Text>
                    </View>
                </View>

                {/* 1. Vision */}
                <View onLayout={registerY('vision')}>
                    <Accordion title="Vision" icon="visibility" defaultOpen>
                        <Text style={styles.paragraph}>
                            To be the apex professional body for Municipal Engineers in India,
                            fostering excellence, innovation, and sustainability in urban
                            infrastructure to engineer livable, resilient, and inclusive
                            cities across the nation.
                        </Text>
                    </Accordion>
                </View>

                {/* 2. Mission */}
                <View onLayout={registerY('mission')}>
                    <Accordion title="Mission" icon="flag">
                        <NumberedItem number="1" text="Professional Development — Upgrade skills of municipal engineers across all States/UTs in roads, water supply, sewerage, street lighting, solid waste, survey & planning, and urban greenery through training, certification, and knowledge exchange." />
                        <NumberedItem number="2" text="Policy Advocacy — Serve as a technical think-tank to MoHUA, State Governments, and ULBs on urban infrastructure norms, service standards, and municipal reforms." />
                        <NumberedItem number="3" text="Knowledge Hub — Disseminate best practices, research, and technology solutions for Indian cities through journals, conferences, and digital platforms." />
                        <NumberedItem number="4" text="Ethics & Standards — Promote professional ethics, safety, and citizen-centric engineering practices in municipal governance." />
                        <NumberedItem number="5" text="Networking — Connect municipal engineers pan-India and foster collaboration with CPWD, PWD, smart city SPVs, academia, and global bodies." />
                    </Accordion>
                </View>

                {/* 3. Core Objectives */}
                <View onLayout={registerY('objectives')}>
                    <Accordion title="Core Objectives" icon="track-changes">
                        <SubAccordion title="Technical">
                            <BulletItem text="Promote integrated planning and execution of roads, water supply, waste water, street lighting, solid waste management, survey & planning, and urban parks/green spaces." />
                            <BulletItem text="Develop and publish technical manuals, SOPs, and model by-laws suited to Indian ULBs." />
                            <BulletItem text="Facilitate adoption of new technologies: GIS, SCADA, IoT for utilities, C&D waste recycling, energy-efficient lighting." />
                        </SubAccordion>
                        <SubAccordion title="Institutional">
                            <BulletItem text="Represent municipal engineering cadre in national forums; work for cadre strengthening and service conditions." />
                            <BulletItem text="Establish State Chapters in all States/UTs under IME (India)." />
                            <BulletItem text="Institute national awards for excellence in municipal engineering projects." />
                        </SubAccordion>
                        <SubAccordion title="Capacity Building">
                            <BulletItem text="Conduct All-India conferences, workshops, and certification programs in partnership with CPHEEO, NIUA, and engineering colleges." />
                            <BulletItem text="Create a digital repository of DPRs, drawings, and case studies from Indian cities." />
                        </SubAccordion>
                    </Accordion>
                </View>

                {/* 4. Aims & Objects (moved up next to Objectives — reads better right after Core Objectives) */}
                <View onLayout={registerY('aims')}>
                    <Accordion title="Aims & Objects" icon="assignment">
                        <SubAccordion title="A. Technical Objects" defaultOpen>
                            <NumberedItem number="1" text="To promote integrated planning, design, execution, and O&M of municipal infrastructure across 7 core domains: Roads & Urban Transport, Water Supply & Distribution, Waste Water & Sewerage, Street Lighting & Energy Efficiency, Solid Waste Management, Survey, GIS & Town Planning, Urban Parks, Greenery & Public Spaces." />
                            <NumberedItem number="2" text="To develop technical standards, manuals, SOPs, and model bye-laws for Indian ULBs." />
                            <NumberedItem number="3" text="To promote adoption of new technologies in municipal services: GIS, SCADA, IoT, C&D waste recycling, smart lighting." />
                            <NumberedItem number="4" text="To undertake research, pilot projects, and documentation of best practices from Indian cities." />
                        </SubAccordion>
                        <SubAccordion title="B. Professional Objects">
                            <NumberedItem number="1" text="To represent municipal engineers at national level with MoHUA, CPHEEO, NIUA, State Governments, and ULBs." />
                            <NumberedItem number="2" text="To work for cadre strengthening, service conditions, and professional recognition of municipal engineers." />
                            <NumberedItem number="3" text="To conduct training, workshops, certification programs, and All-India conferences." />
                            <NumberedItem number="4" text="To publish journals, newsletters, and technical papers." />
                            <NumberedItem number="5" text="To institute National Awards for Excellence in Municipal Engineering." />
                            <NumberedItem number="6" text="To establish State Chapters in all States/UTs and Student Chapters in engineering colleges." />
                        </SubAccordion>
                        <SubAccordion title="C. General Objects">
                            <NumberedItem number="1" text="To collaborate with national/international bodies in the urban sector." />
                            <NumberedItem number="2" text="Income shall be applied solely towards promotion of objects. No profit distribution." />
                        </SubAccordion>
                    </Accordion>
                </View>

                {/* 5. Memorandum of Association — signature/witness content removed */}
                <View onLayout={registerY('moa')}>
                    <Accordion title="Memorandum of Association (MoA)" icon="description">
                        <View style={styles.docCard}>
                            <Text style={styles.docLabel}>Name</Text>
                            <Text style={styles.paragraph}>
                                The name of the Society shall be "Institution of Municipal
                                Engineers, India", hereinafter referred to as "IME (India)".
                            </Text>

                            <Text style={[styles.docLabel, { marginTop: 12 }]}>Registered Office</Text>
                            <Text style={styles.paragraph}>Chennai, Tamil Nadu.</Text>

                            <Text style={[styles.docLabel, { marginTop: 12 }]}>Temporary Address</Text>
                            <Text style={styles.paragraph}>
                                C/o State Institute of Rural Development, Maraimalai Nagar,
                                Chengalpattu, Tamil Nadu.
                            </Text>

                            <Text style={[styles.docLabel, { marginTop: 12 }]}>Jurisdiction</Text>
                            <Text style={styles.paragraph}>
                                The area of operation shall extend to the whole of India.
                            </Text>

                            <Text style={[styles.docLabel, { marginTop: 12 }]}>Bank Account</Text>
                            <Text style={styles.paragraph}>
                                State Bank of India, PWD Complex, Chepauk, Chennai – 600005.
                            </Text>
                        </View>
                    </Accordion>
                </View>

                {/* 6. MoU */}
                <View onLayout={registerY('mou')}>
                    <Accordion title="Memorandum of Understanding (MoU)" icon="handshake">
                        <View style={styles.docCard}>
                            <Text style={styles.docLabel}>Between</Text>
                            <Text style={styles.paragraph}>
                                Institution of Municipal Engineers, India, a national
                                professional body, Registered Office at Chennai AND [Partner
                                Institution / State Govt / ULB].
                            </Text>

                            <Text style={[styles.docLabel, { marginTop: 12 }]}>Scope</Text>
                            <Text style={styles.paragraph}>
                                Jointly work towards strengthening municipal engineering
                                capacity across India in the 7 core domains: roads, water
                                supply, waste water, street lighting, solid waste, survey &
                                planning, and urban greenery.
                            </Text>

                            <Text style={[styles.docLabel, { marginTop: 12 }]}>Activities</Text>
                            <Text style={styles.paragraph}>
                                National conferences, joint research, training of ULB
                                engineers, policy papers to MoHUA, student chapters in
                                engineering colleges.
                            </Text>
                        </View>
                    </Accordion>
                </View>

                {/* 7. Bye-Laws */}
                <View onLayout={registerY('byelaws')}>
                    <Accordion title="Bye-Laws" icon="gavel">
                        <SubAccordion title="1. Membership">
                            <Text style={styles.paragraph}>
                                Grades: Fellow, Member, Associate Member, Student Member,
                                Institutional Member, Honorary Fellow.{'\n\n'}
                                Eligibility: Engineers serving/served in ULBs, Municipal
                                Corporations, Municipalities, Town Panchayats, or urban
                                parastatals in India. BE/B.Tech in Civil/Mechanical/Electrical/
                                Environmental minimum.{'\n\n'}
                                Admission: By application to National Council.
                            </Text>
                        </SubAccordion>

                        <SubAccordion title="2. Management">
                            <Text style={styles.paragraph}>
                                National Council — Supreme governing body.{'\n'}
                                Composition: President, 4 Vice-Presidents (North/South/East/
                                West), Secretary General, Treasurer, Joint Secretary, 20
                                Council Members representing States. Term: 2 years.{'\n\n'}
                                Executive Committee — President, Secretary General, Treasurer
                                + 5 Council Members for day-to-day management.
                            </Text>
                        </SubAccordion>

                        <SubAccordion title="3. State Chapters">
                            <Text style={styles.paragraph}>
                                IME (India) may establish State Chapters in any State/UT with
                                minimum 20 members.{'\n\n'}
                                Each Chapter shall have own Executive Committee: Chairman,
                                Secretary, Treasurer.{'\n\n'}
                                Chapters shall function under bye-laws framed by National
                                Council and submit annual report.{'\n\n'}
                                First Chapter: Tamil Nadu Chapter at Chennai shall be the
                                founding Chapter.
                            </Text>
                        </SubAccordion>

                        <SubAccordion title="4. Meetings">
                            <Text style={styles.paragraph}>
                                Annual General Meeting: Once every year, preferably in
                                September. Venue to rotate across States.{'\n\n'}
                                National Council: Meet at least twice a year. Quorum: 1/3rd or
                                8 members.{'\n\n'}
                                General Body: All members. Voting: 1 member = 1 vote.
                            </Text>
                        </SubAccordion>

                        <SubAccordion title="5. Funds">
                            <Text style={styles.paragraph}>
                                Bank Account: State Bank of India, PWD Complex, Chepauk,
                                Chennai – 600005.{'\n\n'}
                                Sources: Admission fee, subscription, grants, donations,
                                conference surplus.{'\n\n'}
                                Operation: Jointly by President/Secretary General and
                                Treasurer.{'\n\n'}
                                Audit: Annual audit by Chartered Accountant.
                            </Text>
                        </SubAccordion>

                        <SubAccordion title="6. Amendments">
                            <Text style={styles.paragraph}>
                                By 2/3rd majority of members present at General Body, with
                                prior approval of Registrar if required under the Act.
                            </Text>
                        </SubAccordion>

                        <SubAccordion title="7. Dissolution">
                            <Text style={styles.paragraph}>
                                Per Section 41 of Tamil Nadu Societies Registration Act, 1975.
                                Assets to a similar body, not to members.
                            </Text>
                        </SubAccordion>
                    </Accordion>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerTitle}>
                        Institution of Municipal Engineers, India (IME India)
                    </Text>
                    <Text style={styles.footerTagline}>
                        "Engineering Better Cities for Tomorrow"
                    </Text>
                    <Text style={styles.footerCopy}>© IME (India)</Text>
                </View>
            </Animated.ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },

    banner: {
        alignItems: 'center',
        paddingTop: 14,
        paddingBottom: 18,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backBtn: {
        position: 'absolute', top: 14, left: 14, zIndex: 10,
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    bannerTitle: {
        color: COLORS.white, fontSize: 18, fontWeight: '800',
        marginTop: 8, letterSpacing: 0.3,
    },

    // Quick-nav chip bar
    navWrap: {
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingVertical: 10,
    },
    navContent: { paddingHorizontal: 14, gap: 8 },
    navChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingVertical: 7, paddingHorizontal: 12,
        borderRadius: 20, backgroundColor: '#EEF3FA',
        marginRight: 8,
    },
    navChipActive: { backgroundColor: ROYAL },
    navChipText: { fontSize: 12.5, fontWeight: '700', color: ROYAL },
    navChipTextActive: { color: COLORS.white },

    scrollContent: { padding: 16, paddingBottom: 30 },

    // Quick facts strip
    factsCard: {
        backgroundColor: COLORS.white, borderRadius: 14, padding: 14,
        marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0',
    },
    factRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
    factLabel: { fontSize: 12.5, color: '#64748B', flex: 1 },
    factValue: { fontSize: 12.5, fontWeight: '700', color: NAVY },
    factDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },

    paragraph: { fontSize: 13.5, color: COLORS.secondary, lineHeight: 21 },
    docCard: {
        backgroundColor: BG, borderRadius: 10, padding: 14,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    docLabel: { fontSize: 12, fontWeight: '800', color: ROYAL, marginBottom: 4, letterSpacing: 0.5 },

    footer: { alignItems: 'center', marginTop: 20, paddingHorizontal: 10 },
    footerTitle: { color: NAVY, fontSize: 13, fontWeight: '800', textAlign: 'center' },
    footerTagline: { color: GOLD, fontSize: 12, fontWeight: '600', marginTop: 4, textAlign: 'center' },
    footerCopy: { color: COLORS.placeholder, fontSize: 11, marginTop: 8 },
});

export default AboutIMEScreen;
