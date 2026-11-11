import React, { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppText as Text } from '../components/IMEText';

import institutionTree from '../data/institutionTree.json';
import MEMBER_PHOTOS from '../assets/memberPhotos';

const C = {
  navy: '#1E3A5F',
  gold: '#D4A017',
  background: '#F4F7FB',
  white: '#FFFFFF',
  text: '#172033',
  secondary: '#667085',
  border: '#E5EAF1',
};

/* =========================================================
   REGIONAL DATA
========================================================= */

const ZONES = [
  { name: 'North Zone', districts: '8 Districts', color: '#E74C3C' },
  { name: 'East Zone', districts: '7 Districts', color: '#3498DB' },
  { name: 'Central Zone', districts: '7 Districts', color: '#F1C40F' },
  { name: 'West Zone', districts: '8 Districts', color: '#70BF57' },
  { name: 'South Zone', districts: '8 Districts', color: '#8850A5' },
];

const CONVENERS = [
  { zone: 'North Zone', name: 'Er V Hemalatha', designation: 'EE GCC' },
  { zone: 'South Zone', name: 'Er Srinivasan', designation: 'REE Madurai' },
  { zone: 'East Zone', name: 'Er Pradhan Babu', designation: 'AE Thanjavur Corporation' },
  { zone: 'West Zone', name: 'Er K Boopathi', designation: 'Retd SE Coimbatore Corp' },
  { zone: 'Central Zone', name: 'Er J Subramanian', designation: 'EE Planning Trichy Corp' },
];

/* =========================================================
   GET MEMBERS
   Do NOT depend on type === 'member'
========================================================= */

const getMembers = committee =>
  Array.isArray(committee?.children)
    ? committee.children
    : [];

/* =========================================================
   COMMITTEE NAME
========================================================= */

const getCommitteeName = committee =>
  committee?.name || 'Committee';

/* =========================================================
   INITIALS
========================================================= */

function getInitials(name) {
  const words = (name || '')
    .replace(/^(Er|Dr|Mr|Mrs|Ms)\.?\s+/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return (
    words
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('') || 'IUE'
  );
}

/* =========================================================
   MEMBER PHOTO
========================================================= */

function MemberPhoto({ member, size = 54 }) {
  const [failed, setFailed] = useState(false);

  const source = MEMBER_PHOTOS?.[member?.id];

  useEffect(() => {
    setFailed(false);
  }, [member?.id]);

  return (
    <View
      style={[
        styles.photoFrame,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {source && !failed ? (
        <Image
          source={source}
          onError={() => setFailed(true)}
          resizeMode="cover"
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            { fontSize: size * 0.28 },
          ]}
        >
          {getInitials(member?.name)}
        </Text>
      )}
    </View>
  );
}

/* =========================================================
   BACK BUTTON
========================================================= */

function BackButton({ onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.backButton}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Text style={styles.backArrow}>‹</Text>
    </Pressable>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({ label, value }) {
  if (!value) return null;

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>
        {label}
      </Text>

      <Text style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

/* =========================================================
   REGIONAL MAP (fits screen + tap to enlarge and drag)
========================================================= */

const MAP_SOURCE = require('../assets/tn-regional-division.jpeg');
const MAP_RATIO = 1098 / 978;

function RegionalMap() {
  const { width, height } = useWindowDimensions();
  const [open, setOpen] = useState(false);

  // card margin (12 * 2) + card padding (5 * 2) + border (2)
  const fitWidth = Math.max(width - 36, 200);
  const fitHeight = fitWidth / MAP_RATIO;

  // enlarged map is 2.4x the screen width, scrollable both ways
  const bigWidth = width * 2.4;
  const bigHeight = bigWidth / MAP_RATIO;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={styles.regionalMapCard}
        accessibilityRole="button"
        accessibilityLabel="Enlarge Tamil Nadu regional map"
      >
        <Image
          source={MAP_SOURCE}
          resizeMode="contain"
          style={{ width: fitWidth, height: fitHeight }}
        />

        <Text style={styles.mapHint}>
          Tap to enlarge • drag to move
        </Text>
      </Pressable>

      <Modal
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.mapModal}>
          <View style={styles.navigationBar}>
            <BackButton onPress={() => setOpen(false)} />

            <Text style={styles.navigationTitle}>
              TN Regional Map
            </Text>

            <View style={styles.navigationSpacer} />
          </View>

          <ScrollView
            style={styles.mapScrollY}
            maximumZoomScale={3}
            minimumZoomScale={1}
            bouncesZoom
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator
            >
              <Image
                source={MAP_SOURCE}
                resizeMode="contain"
                style={{ width: bigWidth, height: bigHeight }}
              />
            </ScrollView>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

/* =========================================================
   ORGANISATION SCREEN
========================================================= */

export default function OrganisationScreen() {
  const [page, setPage] = useState('organisation');

  const [selectedCommittee, setSelectedCommittee] =
    useState(null);

  const [selectedMember, setSelectedMember] =
    useState(null);

  const committees = Array.isArray(
    institutionTree?.children
  )
    ? institutionTree.children.filter(
      item => item?.type === 'committee'
    )
    : [];

  const members = getMembers(selectedCommittee);

  /* =======================================================
     BACK HANDLING
  ======================================================= */

  const goBack = useCallback(() => {
    if (page === 'regional') {
      setPage('organisation');
      return true;
    }

    if (page === 'details') {
      setSelectedMember(null);
      setPage('members');
      return true;
    }

    if (page === 'members') {
      setSelectedCommittee(null);
      setPage('organisation');
      return true;
    }

    return false;
  }, [page]);

  useEffect(() => {
    const subscription =
      BackHandler.addEventListener(
        'hardwareBackPress',
        goBack
      );

    return () => subscription.remove();
  }, [goBack]);

  /* =======================================================
     OPEN COMMITTEE
  ======================================================= */

  const openCommittee = committee => {
    const committeeMembers = getMembers(committee);

    if (!committeeMembers.length) {
      return;
    }

    setSelectedCommittee(committee);
    setPage('members');
  };

  /* =======================================================
     TN REGIONAL DIVISION PAGE
  ======================================================= */

  if (page === 'regional') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentBottom}
        showsVerticalScrollIndicator={false}
      >
        {/* NAVIGATION */}
        <View style={styles.navigationBar}>
          <BackButton onPress={goBack} />

          <Text style={styles.navigationTitle}>
            TN Regional Division
          </Text>

          <View style={styles.navigationSpacer} />
        </View>

        {/* PAGE HEADING */}
        <View style={styles.regionalHeader}>
          <Text style={styles.regionalTitle}>
            TN REGIONAL DIVISION
          </Text>

          <Text style={styles.regionalSubtitle}>
            Tamil Nadu Regional Zones
          </Text>

          <Text style={styles.regionalCount}>
            5 Regional Zones • 38 Districts
          </Text>
        </View>

        {/* TAMIL NADU MAP */}
        <RegionalMap />

        {/* REGIONAL ZONES */}
        <View style={styles.regionalSection}>
          <Text style={styles.sectionTitle}>
            Regional Zones
          </Text>

          <View style={styles.zoneGrid}>
            {ZONES.map(zone => (
              <View
                key={zone.name}
                style={styles.zoneCard}
              >
                <View
                  style={[
                    styles.zoneColorBar,
                    { backgroundColor: zone.color },
                  ]}
                />

                <Text style={styles.zoneName}>
                  {zone.name}
                </Text>

                <Text style={styles.zoneDistricts}>
                  {zone.districts}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* REGIONAL CONVENERS */}
        <View style={styles.regionalSection}>
          <Text style={styles.sectionTitle}>
            Regional Conveners
          </Text>

          {CONVENERS.map(person => (
            <View
              key={person.zone}
              style={styles.convenerCard}
            >
              <Text style={styles.convenerZone}>
                {person.zone}
              </Text>

              <Text style={styles.convenerName}>
                {person.name}
              </Text>

              <Text style={styles.convenerDesignation}>
                {person.designation}
              </Text>
            </View>
          ))}
        </View>

        {/* STATE COORDINATOR */}
        <View style={styles.coordinatorCard}>
          <Text style={styles.coordinatorHeading}>
            STATE COORDINATOR – DMA AND DTP
          </Text>

          <Text style={styles.coordinatorName}>
            Er Nalini – AEE
          </Text>
        </View>
      </ScrollView>
    );
  }

  /* =======================================================
     MEMBER DETAILS PAGE
  ======================================================= */

  if (page === 'details' && selectedMember) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentBottom}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.navigationBar}>
          <BackButton onPress={goBack} />

          <Text style={styles.navigationTitle}>
            Member Profile
          </Text>

          <View style={styles.navigationSpacer} />
        </View>

        <View style={styles.profileCard}>
          <MemberPhoto
            member={selectedMember}
            size={112}
          />

          <Text style={styles.profileName}>
            {selectedMember.name}
          </Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {selectedMember.role?.toUpperCase()}
            </Text>
          </View>

          <Text style={styles.profileDesignation}>
            {selectedMember.designation}
            {selectedMember.departmentShortName
              ? ` - ${selectedMember.departmentShortName}`
              : ''}
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsHeading}>
            PROFILE DETAILS
          </Text>

          <DetailRow
            label="Committee"
            value={getCommitteeName(
              selectedCommittee
            )}
          />

          <DetailRow
            label="Role"
            value={selectedMember.role}
          />

          <DetailRow
            label="Designation"
            value={selectedMember.designation}
          />

          <DetailRow
            label="Department"
            value={selectedMember.department}
          />

          <DetailRow
            label="Organization"
            value={selectedMember.organization}
          />

          <DetailRow
            label="Office"
            value={selectedMember.office}
          />
        </View>
      </ScrollView>
    );
  }

  /* =======================================================
     COMMITTEE MEMBERS PAGE
  ======================================================= */

  if (page === 'members' && selectedCommittee) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentBottom}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.navigationBar}>
          <BackButton onPress={goBack} />

          <Text style={styles.navigationTitle}>
            IUE
          </Text>

          <View style={styles.navigationSpacer} />
        </View>

        <View style={styles.pageHeading}>
          <Text style={styles.eyebrow}>
            COMMITTEE MEMBERS
          </Text>

          <Text style={styles.pageTitle}>
            {getCommitteeName(selectedCommittee)}
          </Text>

          <Text style={styles.pageSubtitle}>
            {members.length}{' '}
            {members.length === 1
              ? 'Member'
              : 'Members'}
          </Text>
        </View>

        <View style={styles.memberList}>
          {members.map(member => (
            <Pressable
              key={member.id}
              onPress={() => {
                setSelectedMember(member);
                setPage('details');
              }}
              style={({ pressed }) => [
                styles.memberCard,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`View profile of ${member.name}, ${member.role}`}
            >
              <MemberPhoto
                member={member}
                size={54}
              />

              <View style={styles.memberText}>
                <Text style={styles.memberName}>
                  {member.name}
                </Text>

                <Text style={styles.memberRole}>
                  {member.role}
                </Text>
              </View>

              <Text style={styles.memberArrow}>
                ›
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    );
  }

  /* =======================================================
     ORGANISATION PAGE
  ======================================================= */

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentBottom}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.organisationHeader}>
        <Text style={styles.headerEyebrow}>
          ORGANISATION
        </Text>

        <Text style={styles.institutionName}>
          {institutionTree.name}
        </Text>

        <Text style={styles.headerDescription}>
          Explore our committees,reginal division and meet their members.
        </Text>
      </View>

      <View style={styles.committeeSection}>
        <Text style={styles.sectionTitle}>
          Committees
        </Text>

        {committees.map(committee => {
          const count =
            getMembers(committee).length;

          const available = count > 0;

          return (
            <Pressable
              key={committee.id}
              disabled={!available}
              onPress={() =>
                openCommittee(committee)
              }
              style={({ pressed }) => [
                styles.committeeCard,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{
                disabled: !available,
              }}
            >
              <View style={styles.committeeIcon}>
                <Text style={styles.committeeIconText}>
                  IUE
                </Text>
              </View>

              <View style={styles.committeeText}>
                <Text style={styles.committeeName}>
                  {getCommitteeName(committee)}
                </Text>

                <Text style={styles.committeeCount}>
                  {available
                    ? `${count} ${count === 1
                      ? 'Member'
                      : 'Members'
                    }`
                    : 'Coming Soon'}
                </Text>

                {available && (
                  <Text
                    style={styles.committeeAction}
                  >
                    View Members →
                  </Text>
                )}
              </View>

              {available && (
                <Text style={styles.committeeArrow}>
                  ›
                </Text>
              )}
            </Pressable>
          );
        })}

        {/* REGIONAL DIVISION HEADING */}
        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
          Regional Division
        </Text>

        {/* TN REGIONAL DIVISION */}
        <Pressable
          onPress={() => setPage('regional')}
          style={({ pressed }) => [
            styles.committeeCard,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
        >
          <View style={styles.committeeIcon}>
            <Text style={styles.committeeIconText}>TN</Text>
          </View>

          <View style={styles.committeeText}>
            <Text style={styles.committeeName}>
              TN Regional Division with Conveners
            </Text>

            <Text style={styles.committeeCount}>
              5 Regional Zones • 38 Districts
            </Text>

            <Text style={styles.committeeAction}>
              View Regional Division →
            </Text>
          </View>

          <Text style={styles.committeeArrow}>›</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },

  contentBottom: {
    paddingBottom: 36,
  },

  pressed: {
    opacity: 0.78,
  },

  /* NAVIGATION */

  navigationBar: {
    minHeight: 66,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backArrow: {
    color: C.navy,
    fontSize: 38,
    lineHeight: 42,
  },

  navigationTitle: {
    flex: 1,
    textAlign: 'center',
    color: C.navy,
    fontSize: 16,
    fontWeight: '800',
  },

  navigationSpacer: {
    width: 42,
  },

  /* ORGANISATION HEADER */

  organisationHeader: {
    backgroundColor: C.navy,
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 40,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },

  headerEyebrow: {
    color: C.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.7,
  },

  institutionName: {
    marginTop: 13,
    color: C.white,
    fontSize: 27,
    lineHeight: 35,
    fontWeight: '800',
  },

  headerDescription: {
    marginTop: 10,
    color: '#D6E2EF',
    fontSize: 14,
    lineHeight: 21,
  },

  /* COMMITTEE LIST */

  committeeSection: {
    paddingHorizontal: 18,
    paddingTop: 26,
  },

  eyebrow: {
    color: C.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  sectionTitle: {
    marginTop: 6,
    marginBottom: 17,
    color: C.text,
    fontSize: 23,
    fontWeight: '800',
  },

  sectionTitleSpaced: {
    marginTop: 14,
  },

  committeeCard: {
    minHeight: 140,
    marginBottom: 15,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 4,
    borderLeftColor: C.gold,
    backgroundColor: C.white,
    elevation: 3,
    shadowColor: C.navy,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.09,
    shadowRadius: 10,
  },

  committeeIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.navy,
  },

  committeeIconText: {
    color: C.gold,
    fontSize: 12,
    fontWeight: '900',
  },

  committeeText: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 13,
  },

  committeeName: {
    color: C.text,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
  },

  committeeCount: {
    marginTop: 6,
    color: C.secondary,
    fontSize: 13,
  },

  committeeAction: {
    marginTop: 15,
    color: C.navy,
    fontSize: 13,
    fontWeight: '800',
  },

  committeeArrow: {
    marginLeft: 4,
    color: C.gold,
    fontSize: 27,
    lineHeight: 30,
  },

  /* MEMBER PAGE */

  pageHeading: {
    paddingHorizontal: 18,
    paddingTop: 25,
    paddingBottom: 17,
  },

  pageTitle: {
    marginTop: 7,
    color: C.navy,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '800',
  },

  pageSubtitle: {
    marginTop: 5,
    color: C.secondary,
    fontSize: 13,
  },

  memberList: {
    paddingHorizontal: 13,
  },

  memberCard: {
    minHeight: 82,
    marginBottom: 15,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderBottomWidth: 3,
    borderBottomColor: C.gold,
    backgroundColor: C.white,
    elevation: 3,
    shadowColor: C.navy,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  photoFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E8D49A',
    backgroundColor: '#EAF0F7',
  },

  initials: {
    color: C.navy,
    fontWeight: '800',
  },

  memberText: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
  },

  memberName: {
    color: C.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },

  memberRole: {
    marginTop: 4,
    color: '#8B5E34',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },

  memberArrow: {
    color: C.gold,
    fontSize: 25,
    paddingHorizontal: 3,
  },

  /* PROFILE */

  profileCard: {
    marginHorizontal: 18,
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 34,
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    borderTopWidth: 4,
    borderTopColor: C.gold,
    backgroundColor: C.white,
    elevation: 3,
    shadowColor: C.navy,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 11,
  },

  profileName: {
    marginTop: 18,
    color: C.text,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '800',
    textAlign: 'center',
  },

  roleBadge: {
    marginTop: 12,
    maxWidth: '100%',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF6DC',
  },

  roleBadgeText: {
    color: '#8C6810',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },

  profileDesignation: {
    marginTop: 15,
    color: C.secondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },

  detailsCard: {
    marginHorizontal: 18,
    marginTop: 18,
    paddingHorizontal: 19,
    paddingTop: 21,
    paddingBottom: 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
  },

  detailsHeading: {
    color: C.gold,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  detailRow: {
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },

  detailLabel: {
    marginBottom: 5,
    color: C.secondary,
    fontSize: 12,
    fontWeight: '700',
  },

  detailValue: {
    color: C.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },

  /* TN REGIONAL DIVISION */

  regionalHeader: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 12,
  },

  regionalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.navy,
  },

  regionalSubtitle: {
    fontSize: 13,
    color: C.secondary,
    marginTop: 5,
  },

  regionalCount: {
    marginTop: 12,
    color: '#A47A13',
    fontSize: 13,
    fontWeight: '800',
  },

  regionalMapCard: {
    marginHorizontal: 12,
    marginTop: 8,
    padding: 5,
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
  },

  mapHint: {
    marginTop: 6,
    marginBottom: 2,
    textAlign: 'center',
    color: C.secondary,
    fontSize: 12,
    fontWeight: '600',
  },

  mapModal: {
    flex: 1,
    backgroundColor: C.background,
  },

  mapScrollY: {
    flex: 1,
  },

  regionalSection: {
    paddingHorizontal: 16,
    paddingTop: 22,
  },

  zoneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  zoneCard: {
    width: '48%',
    minHeight: 100,
    marginBottom: 12,
    padding: 13,
    borderRadius: 14,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    elevation: 2,
  },

  zoneColorBar: {
    height: 5,
    width: '100%',
    borderRadius: 5,
    marginBottom: 12,
  },

  zoneName: {
    fontSize: 14,
    fontWeight: '800',
    color: C.navy,
  },

  zoneDistricts: {
    marginTop: 6,
    fontSize: 12,
    color: C.secondary,
  },

  convenerCard: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 4,
    borderLeftColor: C.gold,
    elevation: 2,
  },

  convenerZone: {
    fontSize: 12,
    fontWeight: '800',
    color: '#A47A13',
    marginBottom: 7,
  },

  convenerName: {
    fontSize: 16,
    fontWeight: '800',
    color: C.navy,
  },

  convenerDesignation: {
    marginTop: 5,
    fontSize: 13,
    color: C.secondary,
    lineHeight: 19,
  },

  coordinatorCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 25,
    padding: 18,
    backgroundColor: C.navy,
    borderRadius: 15,
  },

  coordinatorHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: '#F8E7A1',
    letterSpacing: 0.5,
  },

  coordinatorName: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '800',
    color: C.white,
  },
});