import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';
const LIGHT = '#F0F4F8';
const WHITE = '#FFFFFF';
const GREY = '#6B7A8D';

const TIMELINE = [
    { year: '1688', text: 'First Municipal Institution established at Madras, the origin of local body governance in India.' },
    { year: '1726', text: 'Municipal institutions extended to Bombay and Calcutta.' },
    { year: '1850', text: "Towns Improvement Act gives municipal engineering a formal structural shape in Madras." },
    { year: '1876–1899', text: "Municipal acts restructure Calcutta's water and drainage networks." },
    { year: '1907', text: 'Royal Commission on Decentralisation appointed; report submitted in 1909.' },
    { year: '1919', text: 'Government of India Act makes local self-government a transferred subject. Institution of Engineers, India is formed by Royal Charter.' },
    { year: '1935', text: 'Government of India Act brings local government under provincial legislatures.' },
    { year: '1950', text: 'Constitution places local government in the State List; Municipal Engineering Service comes into effect.' },
    { year: '1957', text: 'Balwant Rai Mehta Committee shifts focus to grassroots democratic decentralisation.' },
    { year: '1972', text: 'Chennai Metropolitan Water Supply & Sewerage Board and TWAD Board formed to drive infrastructure investment.' },
    { year: '1992', text: '74th Constitutional Amendment Act (Nagarpalika Act) grants constitutional status to urban local bodies.' },
    { year: '1993', text: 'Amendment comes into force — Part IX-A and the 12th Schedule (18 municipal functions) added to the Constitution.' },
    { year: '1998', text: 'Municipal Engineers secure independent service rules after years of being sidelined under board rules.' },
    { year: '2004–2011', text: 'World Bank and external agencies fund higher education, training, and international exchange for municipal engineers.' },
    { year: '2025', text: 'Common service rules issued for all municipal engineers, paving the way for Chief Engineer positions in corporations and local bodies.' },
];

const HistoryDetailsScreen = ({ navigation }) => {
    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor={NAVY} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color={WHITE} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>History & Evolution</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <Text style={styles.introText}>
                    From the first municipal institution at Madras in 1688 to the constitutional recognition
                    of urban local bodies — a journey of over three centuries.
                </Text>

                <View style={styles.timeline}>
                    {TIMELINE.map((item, i) => (
                        <View key={i} style={styles.timelineRow}>
                            <View style={styles.timelineMarkerCol}>
                                <View style={styles.timelineDot} />
                                {i < TIMELINE.length - 1 && <View style={styles.timelineLine} />}
                            </View>
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineYear}>{item.year}</Text>
                                <Text style={styles.timelineText}>{item.text}</Text>
                            </View>
                        </View>
                    ))}
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
    headerTitle: { color: WHITE, fontSize: 18, fontWeight: '800' },
    scroll: { padding: 16, paddingBottom: 40 },
    introText: { fontSize: 14, lineHeight: 21, color: GREY, marginBottom: 20 },
    timeline: { paddingLeft: 4 },
    timelineRow: { flexDirection: 'row' },
    timelineMarkerCol: { width: 24, alignItems: 'center' },
    timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: GOLD, marginTop: 4 },
    timelineLine: { width: 2, flex: 1, backgroundColor: '#D8DEE6', marginVertical: 2 },
    timelineContent: { flex: 1, paddingLeft: 14, paddingBottom: 20 },
    timelineYear: { fontSize: 14, fontWeight: '800', color: NAVY, marginBottom: 4 },
    timelineText: { fontSize: 13, lineHeight: 19, color: '#444' },
});

export default HistoryDetailsScreen;