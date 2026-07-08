import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ObjectivesdetailsscreenStyles as styles } from './screenStyles';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';
const LIGHT = '#F0F4F8';
const WHITE = '#FFFFFF';
const GREY = '#6B7A8D';

const OBJECTIVES = [
    'To upskill existing engineers',
    'To develop talent to meet engineering challenges in local institutions',
    'To create opportunities for higher studies in specialised subjects like town planning and infrastructure, and to develop innovative ideas for local-body-specific challenges',
    'To initiate exchange visits and study tours abroad to interact with similar institutes',
    'To create a pool of technicians and senior technicians to handle operation and maintenance of infrastructure projects across various sectors',
    'To explore the possibility of creating an all-India municipal service in the long run, imbibing technical, management, and administrative capabilities in young engineers',
    'To conduct international, national, and regional conferences and exhibitions introducing advanced technologies and AI systems into maintenance and knowledge interfaces',
    'To bring out e-magazines and other technical reading materials for the benefit of members',
    'To render support to state and local-body governments through arbitration, adjudication, and technical audits on request',
    'To initiate welfare schemes for the municipal engineering community, covering language proficiency, health awareness, food & nutrition, guidance for higher learning, and economic matters',
];

const ObjectivesDetailsScreen = ({ navigation }) => (
    <View style={styles.root}>
        <View style={styles.header}>
            <StatusBar barStyle="light-content" backgroundColor={NAVY} />

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

                <Text style={styles.headerTitle}>Our Objectives</Text>
            </View>




        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.introText}>

                What the proposed institution sets out to do..

            </Text>
            {OBJECTIVES.map((obj, i) => (
                <View key={i} style={styles.row}>
                    <View style={styles.numWrap}>
                        <Text style={styles.numText}>{String(i + 1).padStart(2, '0')}</Text>
                    </View>
                    <Text style={styles.objText}>{obj}</Text>
                </View>
            ))}
        </ScrollView>
    </View>
);



export default ObjectivesDetailsScreen;