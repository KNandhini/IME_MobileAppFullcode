import React, { useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Animated,
    StatusBar, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Accordion, SubAccordion, NumberedItem, BulletItem } from '../components/Accordion';
import IMELogo from '../components/IMELogo';


const NAVY = '#003366';
const ROYAL = '#0055AA';
const GOLD = '#D4AF37';
const BG = '#F5F7FA';

const AboutIMEScreen = ({ navigation }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    return (
        <SafeAreaView style={styles.root}>
            <StatusBar backgroundColor={NAVY} barStyle="light-content" />

            {/* Top banner */}
            <LinearGradient colors={[NAVY, ROYAL]} style={styles.banner}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <IMELogo size="small" animated={false} />
                <Text style={styles.bannerTitle}>Institutional Profile (India)</Text>
            </LinearGradient>

            <Animated.ScrollView
                style={{ opacity: fadeAnim }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}>

                {/* 1. Vision */}
                <Accordion title="Vision" icon="visibility" defaultOpen>
                    <Text style={styles.paragraph}>
                        To be the apex professional body for Municipal Engineers in India,
                        fostering excellence, innovation, and sustainability in urban
                        infrastructure to engineer livable, resilient, and inclusive
                        cities across the nation.
                    </Text>
                </Accordion>

                {/* 2. Mission */}
                <Accordion title="Mission" icon="flag">
                    <NumberedItem number="1" text="Professional Development — Upgrade skills of municipal engineers across all States/UTs in roads, water supply, sewerage, street lighting, solid waste, survey & planning, and urban greenery through training, certification, and knowledge exchange." />
                    <NumberedItem number="2" text="Policy Advocacy — Serve as a technical think-tank to MoHUA, State Governments, and ULBs on urban infrastructure norms, service standards, and municipal reforms." />
                    <NumberedItem number="3" text="Knowledge Hub — Disseminate best practices, research, and technology solutions for Indian cities through journals, conferences, and digital platforms." />
                    <NumberedItem number="4" text="Ethics & Standards — Promote professional ethics, safety, and citizen-centric engineering practices in municipal governance." />
                    <NumberedItem number="5" text="Networking — Connect municipal engineers pan-India and foster collaboration with CPWD, PWD, smart city SPVs, academia, and global bodies." />
                </Accordion>

                {/* 3. Core Objectives */}
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

                {/* 4. MoU */}
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

                {/* 5. MoA */}
                <Accordion title="Memorandum of Association (MoA)" icon="description">
                    <SubAccordion title="Name">
                        <Text style={styles.paragraph}>
                            The name of the Society shall be "Institution of Municipal
                            Engineers, India".
                        </Text>
                    </SubAccordion>
                    <SubAccordion title="Registered Office">
                        <Text style={styles.paragraph}>Chennai, Tamil Nadu.</Text>
                    </SubAccordion>
                    <SubAccordion title="Temporary Address">
                        <Text style={styles.paragraph}>
                            C/o State Institute of Rural Development, Maraimalai Nagar,
                            Chengalpattu, Tamil Nadu.
                        </Text>
                    </SubAccordion>
                    <SubAccordion title="Jurisdiction">
                        <Text style={styles.paragraph}>
                            The area of operation shall extend to the whole of India.
                        </Text>
                    </SubAccordion>
                    <SubAccordion title="Updated Affidavit">
                        <Text style={styles.paragraph}>
                            That the Registered Office of the said Society shall be
                            situated at Chennai, Tamil Nadu. The temporary address for
                            communication shall be: IME (India), C/o State Institute of
                            Rural Development, Maraimalai Nagar, Chengalpattu, Tamil Nadu.
                        </Text>
                    </SubAccordion>
                    <SubAccordion title="Bank Account">
                        <Text style={styles.paragraph}>
                            State Bank of India, PWD Complex, Chepauk, Chennai – 600005.
                        </Text>
                    </SubAccordion>
                    <SubAccordion title="Signatory Page">
                        <Text style={styles.paragraph}>
                            We, the several persons whose names and addresses are given
                            below, having associated ourselves for the purposes described
                            in this Memorandum of Association, do hereby subscribe our
                            names to this Memorandum and set our several and respective
                            hands hereunto.
                        </Text>
                    </SubAccordion>
                </Accordion>

                {/* 6. Aims & Objects */}
                <Accordion title="Aims & Objects" icon="assignment">
                    <SubAccordion title="A. Technical Objects" defaultOpen>
                        <NumberedItem number="1" text="To promote integrated planning, design, execution, and O&M of municipal infrastructure across 7 core domains: Roads & Urban Transport, Water Supply & Distribution, Waste Water & Sewerage, Street Lighting & Energy Efficiency, Solid Waste Management, Survey, GIS & Town Planning, Urban Parks, Greenery & Public Spaces." />
                        <NumberedItem number="2" text="To develop technical standards, manuals, SOPs, and model bye-laws for Indian ULBs." />
                        <NumberedItem number="3" text="To promote adoption of new technologies in municipal services: GIS, SCADA, IoT, C&D waste recycling, smart lighting." />
                        <NumberedItem number="4" text="To undertake research, pilot projects, and documentation of best practices from Indian cities." />
                    </SubAccordion>
                    <SubAccordion title="B. Professional Objects">
                        <NumberedItem number="5" text="To represent municipal engineers at national level with MoHUA, CPHEEO, NIUA, State Governments, and ULBs." />
                        <NumberedItem number="6" text="To work for cadre strengthening, service conditions, and professional recognition of municipal engineers." />
                        <NumberedItem number="7" text="To conduct training, workshops, certification programs, and All-India conferences." />
                        <NumberedItem number="8" text="To publish journals, newsletters, and technical papers." />
                        <NumberedItem number="9" text="To institute National Awards for Excellence in Municipal Engineering." />
                        <NumberedItem number="10" text="To establish State Chapters in all States/UTs and Student Chapters in engineering colleges." />
                    </SubAccordion>
                    <SubAccordion title="C. General Objects">
                        <NumberedItem number="11" text="To collaborate with national/international bodies in the urban sector." />
                        <NumberedItem number="12" text="Income shall be applied solely towards promotion of objects. No profit distribution." />
                    </SubAccordion>
                </Accordion>

                {/* 7. Bye-Laws */}
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
        paddingBottom: 20,
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
        color: '#fff', fontSize: 18, fontWeight: '800',
        marginTop: 8, letterSpacing: 0.3,
    },

    scrollContent: { padding: 16, paddingBottom: 30 },

    paragraph: { fontSize: 13.5, color: '#334155', lineHeight: 21 },
    docCard: {
        backgroundColor: BG, borderRadius: 10, padding: 14,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    docLabel: { fontSize: 12, fontWeight: '800', color: ROYAL, marginBottom: 4, letterSpacing: 0.5 },

    footer: { alignItems: 'center', marginTop: 20, paddingHorizontal: 10 },
    footerTitle: { color: NAVY, fontSize: 13, fontWeight: '800', textAlign: 'center' },
    footerTagline: { color: GOLD, fontSize: 12, fontWeight: '600', marginTop: 4, textAlign: 'center' },
    footerCopy: { color: '#94A3B8', fontSize: 11, marginTop: 8 },
});

export default AboutIMEScreen;