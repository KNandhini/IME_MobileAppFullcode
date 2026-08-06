import { COLORS, RADIUS, SHADOW, SPACING } from '../screens/theme';
import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const NAVY = COLORS.primary;
const GOLD = COLORS.accent;

export const Accordion = ({ title, icon, children, defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpen(!open);
    };

    return (
        <View style={styles.card}>
            <TouchableOpacity style={styles.header} onPress={toggle} activeOpacity={0.7}>
                <View style={styles.headerLeft}>
                    <View style={styles.iconWrap}>
                        <MaterialIcons name={icon} size={20} color={COLORS.white} />
                    </View>
                    <Text style={styles.title}>{title}</Text>
                </View>
                <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={26} color={NAVY} />
            </TouchableOpacity>
            {open && <View style={styles.body}>{children}</View>}
        </View>
    );
};

// Smaller nested accordion, used inside a parent Accordion (e.g. MoA fields)
export const SubAccordion = ({ title, children, defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpen(!open);
    };

    return (
        <View style={subStyles.card}>
            <TouchableOpacity style={subStyles.header} onPress={toggle} activeOpacity={0.7}>
                <Text style={subStyles.title}>{title}</Text>
                <MaterialIcons name={open ? 'remove' : 'add'} size={18} color={NAVY} />
            </TouchableOpacity>
            {open && <View style={subStyles.body}>{children}</View>}
        </View>
    );
};

export const NumberedItem = ({ number, text }) => (
    <View style={itemStyles.row}>
        <View style={itemStyles.numBadge}>
            <Text style={itemStyles.numText}>{number}</Text>
        </View>
        <Text style={itemStyles.text}>{text}</Text>
    </View>
);

export const BulletItem = ({ text }) => (
    <View style={itemStyles.bulletRow}>
        <View style={itemStyles.bullet} />
        <Text style={itemStyles.text}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.xl,
        marginBottom: SPACING.md,
        ...SHADOW.md,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 14, paddingHorizontal: 16,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconWrap: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    title: { fontSize: 15, fontWeight: '700', color: NAVY, flex: 1 },
    body: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 2 },
});

const subStyles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.bg,
        borderRadius: RADIUS.md,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 11, paddingHorizontal: 14,
    },
    title: { fontSize: 13.5, fontWeight: '700', color: COLORS.primary, flex: 1 },
    body: { paddingHorizontal: 14, paddingBottom: 12 },
});

const itemStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    numBadge: {
        width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 1,
    },
    numText: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    bullet: {
        width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD,
        marginRight: 10, marginTop: 7,
    },
    text: { flex: 1, fontSize: 13.5, color: COLORS.text, lineHeight: 20 },
});
