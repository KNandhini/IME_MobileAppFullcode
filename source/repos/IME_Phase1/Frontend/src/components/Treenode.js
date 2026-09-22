import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SHADOW } from '../screens/theme';
import MEMBER_PHOTOS from '../assets/memberPhotos';

/* ---------------------------------------------------------
   Colors

   ROOT   -> dark teal / blue-green (institution)
   GREEN  -> Green Committee (data supplied today)
   PINK   -> Pink Committee (reserved for future data)

   A new committee only needs a new "color" key in the JSON
   data + an entry in COMMITTEE_PALETTES below.
--------------------------------------------------------- */

const C = {
  white: COLORS?.white || '#FFFFFF',
  background: COLORS?.background || '#F4F7FB',
  text: COLORS?.textPrimary || '#172033',
  muted: COLORS?.textSecondary || '#667085',
  border: COLORS?.borderSoft || '#E2E8F0',
  rootDark: COLORS?.tealDark || '#0B3B36',
  rootAccent: COLORS?.tealAccent || '#2FBF9A',
};

const COMMITTEE_PALETTES = {
  green: {
    solid: '#12886B',
    dark: '#0C6350',
    light: '#E4F7F1',
    border: '#12886B',
    text: '#0C6350',
    chip: '#D6F1E8',
  },
  pink: {
    solid: '#C24B87',
    dark: '#9B3B6C',
    light: '#FCEAF3',
    border: '#C24B87',
    text: '#9B3B6C',
    chip: '#F8D9E9',
  },
  default: {
    solid: COLORS?.primary || '#12345B',
    dark: COLORS?.dark || '#0B2545',
    light: '#EEF2F8',
    border: COLORS?.primary || '#12345B',
    text: COLORS?.primary || '#12345B',
    chip: '#E4E9F3',
  },
};

function getPalette(color) {
  return COMMITTEE_PALETTES[color] || COMMITTEE_PALETTES.default;
}

/* ---------------------------------------------------------
   Role classification (drives which section a member lands in)

   This is intentionally data-driven: a future committee with
   unfamiliar role names will simply fall into the generic
   "Members" section instead of breaking anything.

   IMPORTANT: "Deputy Director" (and similar) is a PROFESSIONAL
   DESIGNATION, not a committee position. It is folded straight
   into the 'ec' bucket here — it never gets its own section,
   and getEffectiveRole() below overrides its on-screen title
   to "EC Member" everywhere (card, head badge, profile sheet).
   To handle a similar case in the future, just add the phrase
   to NON_COMMITTEE_DESIGNATIONS.
--------------------------------------------------------- */

const HEAD_ROLES = ['president'];

const OFFICE_ROLES = [
  'vice president',
  'secretary general',
  'general secretary',
  'secretary',
  'treasurer general',
  'general treasurer',
  'treasurer',
  'joint secretary',
];

const EC_MEMBER_ROLES = [
  'ec member',
  'executive committee member',
  'executive member',
];

// Designations that sometimes get mistakenly entered as a "role" —
// treat them as EC members and relabel them, never as their own branch.
const NON_COMMITTEE_DESIGNATIONS = ['deputy director'];

const SECTION_DEFINITIONS = [
  { key: 'office', label: 'Office Bearers' },
  { key: 'ec', label: 'EC Members' },
  { key: 'other', label: 'Members' },
];

function clean(value) {
  return String(value || '')
    .replace(/^\d+\.\s*/, '')
    .trim();
}

function matchesRole(role, list) {
  return list.some(item => role === item || role.includes(item));
}

function classifyMember(member) {
  const role = clean(getRole(member)).toLowerCase();

  // Exact match ONLY for the head role. Titles like "Vice President"
  // contain the substring "president", so a broader/includes match
  // here (like matchesRole uses for every other bucket) would wrongly
  // classify Vice President as the head too, and it would then be
  // excluded from every section and never rendered at all.
  if (HEAD_ROLES.includes(role)) return 'head';

  if (matchesRole(role, OFFICE_ROLES)) return 'office';
  if (matchesRole(role, EC_MEMBER_ROLES) || matchesRole(role, NON_COMMITTEE_DESIGNATIONS)) {
    return 'ec';
  }
  return 'other';
}

/*
 * Splits a committee's flat member list into:
 *  - head: the single President-type figure shown above the branch
 *  - sections: an ordered list of { label, members } groups shown
 *    stacked vertically (President -> Office Bearers -> EC Members),
 *    each rendered as its own horizontally-scrollable row of cards.
 */
function buildOrgChart(members) {
  const head = members.find(member => classifyMember(member) === 'head') || null;

  const sections = SECTION_DEFINITIONS.map(def => ({
    label: def.label,
    members: members.filter(member => classifyMember(member) === def.key),
  })).filter(section => section.members.length > 0);

  return { head, sections };
}

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */

function getInitials(name) {
  const words = clean(name)
    .replace(/^(er|dr|mr|mrs|ms)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function getMemberPhoto(member) {
  // Local photo (from the id-keyed map) takes priority. A required
  // local asset is a number in React Native, not a string — that's
  // how MemberAvatar below tells it apart from a remote URL.
  const localPhoto = member?.id ? MEMBER_PHOTOS[member.id] : undefined;
  if (localPhoto) return localPhoto;

  return member?.photo || member?.image || member?.imageUrl;
}

function isRemotePhoto(photo) {
  return typeof photo === 'string' && /^https?:\/\//i.test(photo);
}

function isLocalPhoto(photo) {
  // require('./x.png') resolves to a number (an asset id) in RN.
  return typeof photo === 'number';
}

function getRole(member) {
  return clean(member?.role || member?.position) || 'Committee Member';
}

// The role actually SHOWN in the UI. Never shows a professional
// designation (e.g. "Deputy Director") as a hierarchy title —
// those are relabeled to their real committee position.
function getEffectiveRole(member) {
  const role = clean(getRole(member)).toLowerCase();
  if (matchesRole(role, NON_COMMITTEE_DESIGNATIONS)) return 'EC Member';
  return clean(getRole(member));
}

function getKey(item, index) {
  return item?.id || `${clean(item?.name)}-${index}`;
}

/* ---------------------------------------------------------
   Member Avatar
--------------------------------------------------------- */

function MemberAvatar({ member, size = 64, palette }) {
  const photo = getMemberPhoto(member);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.solid,
          borderColor: palette.light,
        },
      ]}
    >
      {isLocalPhoto(photo) ? (
        <Image
          source={photo}
          resizeMode="cover"
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : isRemotePhoto(photo) ? (
        <Image
          source={{ uri: photo }}
          resizeMode="cover"
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <Text style={[styles.avatarText, { fontSize: size * 0.3 }]}>
          {getInitials(member?.name)}
        </Text>
      )}
    </View>
  );
}

/* ---------------------------------------------------------
   Connector lines
--------------------------------------------------------- */

function VerticalConnector({ height = 18, color = C.border, thickness = 2 }) {
  return (
    <View style={styles.connectorWrap}>
      <View
        style={[
          styles.connectorLine,
          { height, width: thickness, backgroundColor: color },
        ]}
      />
    </View>
  );
}

/* ---------------------------------------------------------
   Member card — ORGANISATION PAGE ONLY shows photo + posting.
   The name is intentionally NOT rendered here (it still lives
   in accessibilityLabel for screen readers) — it only appears
   once the card is tapped and the profile bottom sheet opens.
--------------------------------------------------------- */

function MemberCard({ member, palette, onPress, size = 64 }) {
  const role = getEffectiveRole(member);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`View details for ${role}, ${clean(member?.name)}`}
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.memberCard}
    >
      <MemberAvatar member={member} size={size} palette={palette} />

      <Text
        style={[styles.memberCardRole, { color: palette.text }]}
        numberOfLines={2}
      >
        {role}
      </Text>
    </TouchableOpacity>
  );
}

/* ---------------------------------------------------------
   Head node (President) — same photo + posting only rule
   applies here too; name appears only in the bottom sheet.
--------------------------------------------------------- */

function HeadNode({ member, palette, onPress }) {
  return (
    <View style={styles.headWrap}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`View details for ${getEffectiveRole(member)}, ${clean(member?.name)}`}
        activeOpacity={0.85}
        onPress={onPress}
        style={[styles.headCard, { borderColor: palette.border }]}
      >
        <MemberAvatar member={member} size={84} palette={palette} />

        <View style={[styles.headRoleBadge, { backgroundColor: palette.solid }]}>
          <Text style={styles.headRoleText}>{getEffectiveRole(member)}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

/* ---------------------------------------------------------
   One section of the branch (e.g. "Office Bearers" or
   "EC Members") — a clearly labeled, horizontally-scrollable
   row of member cards. Sections stack vertically in OrgBranch.

   NOTE: the row is LEFT-ALIGNED, not centered. Centering a
   ScrollView's contentContainerStyle when the content is wider
   than the viewport shifts the initial scroll offset so the
   first card can start partially or fully off-screen. Left
   alignment guarantees the first card is always visible on
   load, with the rest reachable by scrolling right.
--------------------------------------------------------- */

function OrgSection({ section, palette, onMemberPress }) {
  return (
    <View style={styles.orgSection}>
      <VerticalConnector color={palette.border} height={16} />

      <Text style={[styles.sectionLabel, { color: palette.text }]} numberOfLines={1}>
        {section.label}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sectionRow}
      >
        {section.members.map((member, index) => (
          <View key={getKey(member, index)} style={styles.sectionCardWrap}>
            <MemberCard
              member={member}
              palette={palette}
              size={62}
              onPress={() => onMemberPress(member)}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/* ---------------------------------------------------------
   The branch: President's sections stacked one below another
   — Office Bearers, then EC Members — the classic
   "manager -> direct reports, grouped by tier" org-chart shape.
--------------------------------------------------------- */

function OrgBranch({ sections, palette, onMemberPress }) {
  if (!sections.length) return null;

  return (
    <View style={styles.branchOuter}>
      {sections.map((section, index) => (
        <OrgSection
          key={`${section.label}-${index}`}
          section={section}
          palette={palette}
          onMemberPress={onMemberPress}
        />
      ))}
    </View>
  );
}

/* ---------------------------------------------------------
   Empty state (for a committee with no data yet)
--------------------------------------------------------- */

function EmptyCommitteeState({ palette, message }) {
  return (
    <View style={[styles.emptyState, { borderColor: palette.border }]}>
      <MaterialIcons name="hourglass-empty" size={32} color={palette.solid} />
      <Text style={[styles.emptyTitle, { color: palette.text }]}>
        No members yet
      </Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

/* ---------------------------------------------------------
   Committee box (tappable, expands/collapses)
--------------------------------------------------------- */

function CommitteeBox({ committee, expanded, onToggle }) {
  const palette = getPalette(committee.color);
  const memberCount = Array.isArray(committee?.children)
    ? committee.children.length
    : 0;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ expanded: !!expanded }}
      accessibilityLabel={`${committee.name}. ${
        expanded ? 'Collapse' : 'Expand'
      } members`}
      activeOpacity={0.85}
      onPress={onToggle}
      style={[
        styles.committeeBox,
        { backgroundColor: palette.light, borderColor: palette.border },
        expanded && styles.committeeBoxExpanded,
      ]}
    >
      <View style={[styles.committeeIconWrap, { backgroundColor: palette.solid }]}>
        <MaterialIcons name="groups" size={22} color={C.white} />
      </View>

      <View style={styles.committeeBoxText}>
        <Text style={[styles.committeeBoxName, { color: palette.dark }]}>
          {committee.name}
        </Text>

        {!!committee.title && (
          <Text style={[styles.committeeBoxTitle, { color: palette.text }]}>
            {committee.title}
          </Text>
        )}

        <Text style={styles.committeeBoxCount}>
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </Text>
      </View>

      <MaterialIcons
        name={expanded ? 'expand-less' : 'expand-more'}
        size={26}
        color={palette.solid}
      />
    </TouchableOpacity>
  );
}

/* ---------------------------------------------------------
   Member detail bottom sheet

   Deliberately NOT built on React Native's <Modal>. RN's
   <Modal> is presented as a separate full-screen native layer
   that sits above the ENTIRE app, including a bottom tab bar —
   there is no way to keep a tab bar visible underneath it.

   Instead this is a plain absolutely-positioned overlay that
   lives inside TreeNode's own component tree. Because it never
   escapes this component's parent view (the Organisation
   screen's content area, which already sits above the tab bar
   in a standard tab navigator), it can only ever cover this
   screen's own content — never the tab bar outside it.

   Behavior:
   - Slides up from the bottom with a spring animation.
   - Dims the content behind it (not the tab bar, since the
     dim overlay is confined the same way the sheet is).
   - Closes on: tapping the backdrop, the ✕ button, or a
     swipe-down gesture on the sheet.
--------------------------------------------------------- */

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_CLOSE_DISTANCE = 120;
const SWIPE_CLOSE_VELOCITY = 1.1;

const DETAIL_FIELDS = [
  { key: 'designation', label: 'Designation', icon: 'badge' },
  { key: 'department', label: 'Department', icon: 'business' },
  { key: 'organization', label: 'Organization', icon: 'account-balance' },
  { key: 'office', label: 'Office', icon: 'apartment' },
];

function ProfileDetail({ icon, label, value }) {
  if (!value) return null;

  return (
    <View style={styles.profileDetail}>
      <View style={styles.profileDetailIcon}>
        <MaterialIcons name={icon} size={18} color={C.rootDark} />
      </View>

      <View style={styles.profileDetailContent}>
        <Text style={styles.profileDetailLabel}>{label}</Text>
        <Text style={styles.profileDetailValue}>{value}</Text>
      </View>
    </View>
  );
}

function ProfileBottomSheet({ visible, member, palette, onClose }) {
  // Kept mounted slightly past `visible=false` so the close
  // animation can finish before the sheet actually unmounts.
  const [isMounted, setIsMounted] = useState(false);

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      translateY.setValue(SCREEN_HEIGHT);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          bounciness: 4,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (isMounted) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => setIsMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > SWIPE_CLOSE_DISTANCE || gesture.vy > SWIPE_CLOSE_VELOCITY) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            bounciness: 4,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!isMounted || !member) return null;

  const role = getEffectiveRole(member);

  return (
    <View style={styles.sheetOverlay} pointerEvents="box-none">
      <Animated.View
        style={[styles.sheetBackdrop, { opacity: backdropOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.profileSheet,
          { transform: [{ translateY }] },
        ]}
      >
        <View {...panResponder.panHandlers} style={styles.sheetDragArea}>
          <View style={styles.modalHandle} />
        </View>

        <TouchableOpacity
          accessibilityLabel="Close profile"
          activeOpacity={0.8}
          onPress={onClose}
          style={styles.profileCloseButton}
        >
          <MaterialIcons name="close" size={22} color={C.text} />
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.profileContent}
        >
          <MemberAvatar member={member} size={112} palette={palette} />

          <Text style={styles.profileName}>{member.name}</Text>

          <View style={[styles.profileRoleBadge, { backgroundColor: palette.chip }]}>
            <Text style={[styles.profileRoleText, { color: palette.text }]}>
              {role}
            </Text>
          </View>

          <View style={styles.profileDivider} />

          <View style={styles.profileDetailsCard}>
            <ProfileDetail icon="person" label="Name" value={member.name} />
            <ProfileDetail icon="work" label="Position" value={role} />

            {DETAIL_FIELDS.map(field => (
              <ProfileDetail
                key={field.key}
                icon={field.icon}
                label={field.label}
                value={member[field.key]}
              />
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/* ---------------------------------------------------------
   Main Component
--------------------------------------------------------- */

export default function TreeNode({ node }) {
  const committees = useMemo(
    () => (Array.isArray(node?.children) ? node.children : []),
    [node]
  );

  const [expandedId, setExpandedId] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedPalette, setSelectedPalette] = useState(COMMITTEE_PALETTES.default);
  const [sheetVisible, setSheetVisible] = useState(false);

  const toggleCommittee = committee => {
    setExpandedId(current => (current === committee.id ? null : committee.id));
  };

  const openMember = (member, palette) => {
    setSelectedMember(member);
    setSelectedPalette(palette);
    setSheetVisible(true);
  };

  const closeMember = () => {
    setSheetVisible(false);
    // selectedMember/selectedPalette are cleared once the sheet's
    // own close animation finishes unmounting it, so content
    // doesn't blank out mid-animation. See ProfileBottomSheet.
  };

  if (!node) return null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent}>
        {/* Root institution */}

        <View style={styles.rootBox}>
          <View style={styles.rootIcon}>
            <MaterialIcons name="account-balance" size={24} color={C.rootAccent} />
          </View>

          <Text style={styles.rootName}>{node.name}</Text>
        </View>

        {!!committees.length && <VerticalConnector color={C.rootAccent} height={22} />}

        {/* Committees, one below another */}

        {committees.map((committee, index) => {
          const palette = getPalette(committee.color);
          const expanded = expandedId === committee.id;
          const members = Array.isArray(committee.children) ? committee.children : [];
          const { head, sections } = buildOrgChart(members);

          return (
            <View key={getKey(committee, index)} style={styles.committeeBlock}>
              <CommitteeBox
                committee={committee}
                expanded={expanded}
                onToggle={() => toggleCommittee(committee)}
              />

              {expanded && (
                <View style={styles.chartArea}>
                  {!members.length && (
                    <>
                      <VerticalConnector color={palette.border} />
                      <EmptyCommitteeState
                        palette={palette}
                        message="This committee's members have not been added yet. They will appear here once provided."
                      />
                    </>
                  )}

                  {!!head && (
                    <>
                      <VerticalConnector color={palette.border} />
                      <HeadNode
                        member={head}
                        palette={palette}
                        onPress={() => openMember(head, palette)}
                      />
                    </>
                  )}

                  {!!sections.length && (
                    <OrgBranch
                      sections={sections}
                      palette={palette}
                      onMemberPress={member => openMember(member, palette)}
                    />
                  )}
                </View>
              )}

              {index < committees.length - 1 && (
                <VerticalConnector color={C.border} height={20} />
              )}
            </View>
          );
        })}

        {!committees.length && (
          <EmptyCommitteeState
            palette={COMMITTEE_PALETTES.default}
            message="Committees will appear here after they are added."
          />
        )}
      </ScrollView>

      <ProfileBottomSheet
        visible={sheetVisible}
        member={selectedMember}
        palette={selectedPalette}
        onClose={closeMember}
      />
    </View>
  );
}

/* ---------------------------------------------------------
   Styles
--------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },

  pageContent: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'stretch',
  },

  /* Root */

  rootBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.rootDark,
    borderRadius: 18,
    padding: 16,
    ...(SHADOW?.md || {}),
  },

  rootIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: 'rgba(47,191,154,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  rootName: {
    flex: 1,
    color: C.white,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    lineHeight: 22,
  },

  /* Connectors */

  connectorWrap: {
    alignItems: 'center',
  },

  connectorLine: {
    width: 2,
  },

  /* Committee block */

  committeeBlock: {
    width: '100%',
  },

  committeeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 14,
    ...(SHADOW?.sm || {}),
  },

  committeeBoxExpanded: {
    borderWidth: 2,
  },

  committeeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  committeeBoxText: {
    flex: 1,
    paddingRight: 8,
  },

  committeeBoxName: {
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 21,
  },

  committeeBoxTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 17,
  },

  committeeBoxCount: {
    fontSize: 11.5,
    color: C.muted,
    marginTop: 4,
  },

  /* Chart area (head + branch) */

  chartArea: {
    width: '100%',
    alignItems: 'center',
  },

  /* Head node (President) */

  headWrap: {
    alignItems: 'center',
  },

  headCard: {
    alignItems: 'center',
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 22,
    ...(SHADOW?.md || {}),
  },

  headRoleBadge: {
    marginTop: 10,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },

  headRoleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* Branch (sections stacked vertically) */

  branchOuter: {
    width: '100%',
    marginTop: 4,
  },

  orgSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 6,
  },

  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 10,
  },

  /*
   * No justifyContent: 'center' here. When a horizontal
   * ScrollView's content is wider than the viewport, centering
   * the content offsets the initial scroll position so the first
   * card can render partially or fully outside the visible
   * viewport. Left/start alignment keeps card 1 pinned at the
   * visible starting edge on load, every time.
   */
  sectionRow: {
    flexGrow: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
  },

  sectionCardWrap: {
    width: 112,
    marginHorizontal: 6,
  },

  /* Member card (photo + posting only) */

  memberCard: {
    alignItems: 'center',
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    ...(SHADOW?.sm || {}),
  },

  memberCardRole: {
    marginTop: 7,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    lineHeight: 14,
  },

  /* Avatar */

  avatar: {
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: C.white,
    fontWeight: '900',
  },

  /* Empty state */

  emptyState: {
    width: '100%',
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 18,
    alignItems: 'center',
    padding: 26,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 8,
  },

  emptyMessage: {
    marginTop: 5,
    fontSize: 12.5,
    lineHeight: 18,
    color: C.muted,
    textAlign: 'center',
  },

  /* Profile bottom sheet */

  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 20,
    elevation: 20,
  },

  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,18,35,0.56)',
  },

  sheetDragArea: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },

  modalHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },

  profileSheet: {
    maxHeight: '80%',
    backgroundColor: C.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    ...(SHADOW?.md || {}),
  },

  profileCloseButton: {
    position: 'absolute',
    right: 16,
    top: 12,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDF3F8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 36,
  },

  profileName: {
    color: C.text,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    textAlign: 'center',
    marginTop: 14,
  },

  profileRoleBadge: {
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 6,
    marginTop: 8,
  },

  profileRoleText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  profileDivider: {
    width: '100%',
    height: 1,
    backgroundColor: C.border,
    marginVertical: 20,
  },

  profileDetailsCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
  },

  profileDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },

  profileDetailIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#EDF3F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  profileDetailContent: {
    flex: 1,
    paddingTop: 1,
  },

  profileDetailLabel: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  profileDetailValue: {
    color: C.text,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginTop: 3,
  },
});