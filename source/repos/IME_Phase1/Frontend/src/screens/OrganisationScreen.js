import React, { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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

              {/*  {member.designation ? (
                  <Text
                    style={styles.memberDesignation}
                    numberOfLines={2}
                  >
                    {member.designation}
                  </Text>
                ) : null}  */}
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
          Explore our committees and meet their members.
        </Text>
      </View>

      <View style={styles.committeeSection}>
        <Text style={styles.eyebrow}>
          OUR COMMITTEES
        </Text>

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

  /* =======================================================
     NAVIGATION
  ======================================================= */

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

  /* =======================================================
     ORGANISATION HEADER
  ======================================================= */

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

  /* =======================================================
     COMMITTEE LIST
  ======================================================= */

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

  /* =======================================================
     MEMBER PAGE
  ======================================================= */

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
    marginTop: 3,
    color: C.secondary,
    fontSize: 12,
    lineHeight: 17,
  },

  memberDesignation: {
    marginTop: 2,
    color: C.navy,
    fontSize: 11,
    lineHeight: 15,
  },

  memberArrow: {
    color: C.gold,
    fontSize: 25,
    paddingHorizontal: 3,
  },

  /* =======================================================
     PROFILE
  ======================================================= */

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
memberRole: {
  marginTop: 4,
  color: '#8B5E34',
  fontSize: 12,
  lineHeight: 17,
  fontWeight: '700',
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
});