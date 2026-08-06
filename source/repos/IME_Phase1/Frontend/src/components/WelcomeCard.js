import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Dimensions,
    Modal,
    ScrollView,
   // SafeAreaView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NumberedItem, BulletItem } from './Accordion';
import { COLORS, RADIUS, SHADOW, SPACING } from '../screens/theme';

const NAVY = COLORS.primary;
const ROYAL = COLORS.dark;
const GOLD = COLORS.accent;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Matches the parent ScrollView's horizontal padding (16 on each side, see
// LoginScreen's `scrollContent` style) so the carousel exactly fills the card.
const CARD_WIDTH = SCREEN_WIDTH - 32;

// Single shared gradient so Vision, Mission, and Core Objectives modal headers
// all look consistent with the rest of the app's header chrome.
const HEADER_COLORS = [NAVY, ROYAL];

const SLIDES = [
    {
        key: 'vision',
        icon: 'visibility',
        label: 'Vision',
        colors: HEADER_COLORS,
        body:
            'To be the apex professional body for Municipal Engineers in India, ' +
            'fostering excellence, innovation, and sustainability in urban ' +
            'infrastructure to engineer livable, resilient, and inclusive cities ' +
            'across the nation.',
        // Vision is short enough to always show in full — no truncation, no button.
        truncate: false,
        showButton: false,
        buttonLabel: null,
    },
    {
        key: 'mission',
        icon: 'flag',
        label: 'Mission',
        colors: HEADER_COLORS,
        body:
            'Upgrade the skills of municipal engineers nationwide, serve as a ' +
            'technical think-tank for urban infrastructure policy, disseminate ' +
            'best practices through journals and conferences, promote ' +
            'professional ethics, and connect engineers pan-India with ' +
            'academia and global bodies.',
        truncate: true,
        showButton: true,
        buttonLabel: 'Show More',
        // Full detail shown in the modal — mirrors the Mission accordion on the About screen.
        detailItems: [
            { number: '1', text: 'Professional Development — Upgrade skills of municipal engineers across all States/UTs in roads, water supply, sewerage, street lighting, solid waste, survey & planning, and urban greenery through training, certification, and knowledge exchange.' },
            { number: '2', text: 'Policy Advocacy — Serve as a technical think-tank to MoHUA, State Governments, and ULBs on urban infrastructure norms, service standards, and municipal reforms.' },
            { number: '3', text: 'Knowledge Hub — Disseminate best practices, research, and technology solutions for Indian cities through journals, conferences, and digital platforms.' },
            { number: '4', text: 'Ethics & Standards — Promote professional ethics, safety, and citizen-centric engineering practices in municipal governance.' },
            { number: '5', text: 'Networking — Connect municipal engineers pan-India and foster collaboration with CPWD, PWD, smart city SPVs, academia, and global bodies.' },
        ],
    },
    {
        key: 'objectives',
        icon: 'track-changes',
        label: 'Core Objectives',
        colors: HEADER_COLORS,
        body:
            'Integrated planning across roads, water, waste water, lighting, ' +
            'solid waste and green spaces — backed by technical manuals, new ' +
            'technology adoption, State Chapters in every State/UT, national ' +
            'awards, and capacity-building conferences with CPHEEO and NIUA.',
        truncate: true,
        showButton: true,
        buttonLabel: 'Show More',
        // Full detail shown in the modal — mirrors the Core Objectives accordion on the About screen.
        detailGroups: [
            {
                title: 'Technical',
                bullets: [
                    'Promote integrated planning and execution of roads, water supply, waste water, street lighting, solid waste management, survey & planning, and urban parks/green spaces.',
                    'Develop and publish technical manuals, SOPs, and model by-laws suited to Indian ULBs.',
                    'Facilitate adoption of new technologies: GIS, SCADA, IoT for utilities, C&D waste recycling, energy-efficient lighting.',
                ],
            },
            {
                title: 'Institutional',
                bullets: [
                    'Represent municipal engineering cadre in national forums; work for cadre strengthening and service conditions.',
                    'Establish State Chapters in all States/UTs under IME (India).',
                    'Institute national awards for excellence in municipal engineering projects.',
                ],
            },
            {
                title: 'Capacity Building',
                bullets: [
                    'Conduct All-India conferences, workshops, and certification programs in partnership with CPHEEO, NIUA, and engineering colleges.',
                    'Create a digital repository of DPRs, drawings, and case studies from Indian cities.',
                ],
            },
        ],
    },
];

const WelcomeCard = ({ onViewMore }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [modalItem, setModalItem] = useState(null); // holds the slide whose full content is shown
    const listRef = useRef(null);

    const handleScroll = (e) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
        setActiveIndex(idx);
    };

    const goToSlide = (idx) => {
        listRef.current?.scrollToOffset({ offset: idx * CARD_WIDTH, animated: true });
        setActiveIndex(idx);
    };

    // Auto-play: advance to the next slide every 4s, looping back to the first.
    // Restarts whenever activeIndex changes, so a manual swipe/dot-tap doesn't
    // get immediately overridden by a stale timer.
    useEffect(() => {
        const timer = setInterval(() => {
            const nextIndex = (activeIndex + 1) % SLIDES.length;
            listRef.current?.scrollToOffset({ offset: nextIndex * CARD_WIDTH, animated: true });
            setActiveIndex(nextIndex);
        }, 4000);
        return () => clearInterval(timer);
    }, [activeIndex]);

    const openDetail = (item) => {
        // Only opens the local modal for THIS slide's content — does not navigate
        // to the full About IME screen. `onViewMore` is intentionally not called
        // here so tapping "View More" / "Show More" never triggers navigation.
        setModalItem(item);
    };

    const closeDetail = () => setModalItem(null);

    return (
        <View style={styles.card}>
            

            <FlatList
                ref={listRef}
                data={SLIDES}
                keyExtractor={(item) => item.key}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH}
                decelerationRate="fast"
                onScroll={handleScroll}
                scrollEventThrottle={16}
                getItemLayout={(_, i) => ({ length: CARD_WIDTH, offset: CARD_WIDTH * i, index: i })}
                style={styles.carousel}
                renderItem={({ item }) => (
                    <View style={[styles.slide, { width: CARD_WIDTH }]}>
                        {/* Badge: tags/badges use the brand lime-green fill per the design system */}
                        <View style={styles.slideHeader}>
                            <View style={styles.iconBadge}>
                                <MaterialIcons name={item.icon} size={18} color={ROYAL} />
                            </View>
                            <Text style={styles.slideLabel}>{item.label}</Text>
                        </View>

                        <Text
                            style={styles.desc}
                            numberOfLines={item.truncate ? 4 : undefined}
                        >
                            {item.body}
                        </Text>

                        {item.showButton && (
                            <TouchableOpacity
                                style={styles.btn}
                                onPress={() => openDetail(item)}
                                activeOpacity={0.6}
                            >
                                <Text style={styles.btnText}>{item.buttonLabel}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            />

            {/* Pagination dots */}
            <View style={styles.dotsRow}>
                {SLIDES.map((_, i) => (
                    <TouchableOpacity
                        key={i}
                        onPress={() => goToSlide(i)}
                        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    >
                        <View style={[styles.dot, i === activeIndex && styles.dotActive]} />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Full-content modal — shows ONLY the tapped slide's content, nothing else */}
            <Modal
                visible={!!modalItem}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={closeDetail}
            >
                <View style={styles.modalOverlay}>
                    <SafeAreaView style={styles.modalSheet} edges={['top']}>
                        {modalItem && (
                            <>
                                <LinearGradient
                                    colors={modalItem.colors}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.modalHeader}
                                >
                                    <TouchableOpacity
                                        onPress={closeDetail}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <MaterialIcons name="arrow-back" size={22} color={COLORS.white} />
                                    </TouchableOpacity>
                                    <View style={styles.modalHeaderLeft}>
                                        <View style={styles.iconBadgeLg}>
                                            <MaterialIcons name={modalItem.icon} size={20} color={COLORS.white} />
                                        </View>
                                        <Text style={styles.modalTitle}>{modalItem.label}</Text>
                                    </View>
                                </LinearGradient>

                                <ScrollView
                                    style={styles.modalBody}
                                    contentContainerStyle={styles.modalBodyContent}
                                    showsVerticalScrollIndicator={false}
                                    alwaysBounceVertical
                                >
                                    {/* Mission: numbered list, same as the About screen's Mission accordion */}
                                    {modalItem.detailItems && modalItem.detailItems.map((it) => (
                                        <NumberedItem key={it.number} number={it.number} text={it.text} />
                                    ))}

                                    {/* Core Objectives: Technical / Institutional / Capacity Building
                                        sections — plain headers, always expanded, no collapse icon */}
                                    {modalItem.detailGroups && modalItem.detailGroups.map((group) => (
                                        <View key={group.title} style={styles.groupBlock}>
                                            <Text style={styles.groupTitle}>{group.title}</Text>
                                            {group.bullets.map((b, idx) => (
                                                <BulletItem key={idx} text={b} />
                                            ))}
                                        </View>
                                    ))}

                                    {/* Fallback: plain paragraph if a slide has neither structure */}
                                    {!modalItem.detailItems && !modalItem.detailGroups && (
                                        <Text style={styles.modalText}>{modalItem.body}</Text>
                                    )}
                                </ScrollView>
                            </>
                        )}
                    </SafeAreaView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        paddingTop: SPACING.xl,
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.md,
        marginBottom: SPACING.lg,
        ...SHADOW.lg,
        overflow: 'hidden',
    },
    welcome: { fontSize: 15, fontWeight: '800', color: ROYAL, marginBottom: 4 },
    tagline: { fontSize: 12, fontWeight: '600', color: COLORS.accent, marginBottom: SPACING.lg },

    // Carousel sits edge-to-edge by cancelling out the card's own horizontal padding
    carousel: { marginHorizontal: -18 },
    slide: { paddingHorizontal: 18 },

    // Badge behind the "Vision" / "Mission" / "Core Objectives" label —
    // uses the brand lime-green (tags/badges/light fills) per the design system.
    slideHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: GOLD,
        borderRadius: RADIUS.pill,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.md,
        gap: SPACING.sm,
    },
    iconBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(37,41,67,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Dark navy text/icon for contrast against the light lime-green badge.
    slideLabel: { color: ROYAL, fontWeight: '800', fontSize: 13, letterSpacing: 0.3 },

    desc: { fontSize: 13, color: COLORS.text, lineHeight: 20, marginBottom: SPACING.lg, minHeight: 80 },

    btn: {
        alignSelf: 'flex-start',
    },
    btnText: { color: ROYAL, fontWeight: '700', fontSize: 12.5 },

    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
    },
    dot: { width: 6, height: 6, borderRadius: RADIUS.xs, backgroundColor: COLORS.border },
    dotActive: { backgroundColor: COLORS.primary, width: 18, borderRadius: 3 },

    // Full-screen detail view (for Mission / Core Objectives) — keeps the
    // app-wide vivid-blue → dark-navy header gradient for consistency.
    modalOverlay: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    modalSheet: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        gap: 14,
    },
    modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconBadgeLg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.glass,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: { color: COLORS.white, fontWeight: '800', fontSize: 17, letterSpacing: 0.3 },
    modalBody: { flex: 1, paddingHorizontal: 20 },
    modalBodyContent: { paddingVertical: 20, paddingBottom: 32 },
    modalText: { fontSize: 15, lineHeight: 23, color: COLORS.textPrimary },

    groupBlock: {
        backgroundColor: COLORS.bg,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
    },
    groupTitle: { fontSize: 15, fontWeight: '800', color: ROYAL, marginBottom: 10 },
});

export default WelcomeCard;