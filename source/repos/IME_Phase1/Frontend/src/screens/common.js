// common.js
// Reusable style fragments shared by many screens. Import what you need and
// spread it into a screen's StyleSheet instead of re-typing the same
// header / card / FAB / lightbox / attachment-grid markup in every file.
//
//   import { COLORS } from './theme';
//   import * as Common from './common';
//
//   export const MyScreenStyles = createScreenStyles({
//     ...Common.detailHeader,          // header / headerBtn / headerTitle
//     fab: Common.fab(),
//     fabText: Common.fabText,
//     ...Common.lightbox,              // viewerOverlay/viewerImage/viewerClose/viewerCloseText
//     card: Common.card(),
//     myOwnUniqueStyle: { ... },
//   });

import { Platform, StatusBar } from 'react-native';
import { COLORS, RADIUS, SHADOW } from './theme';

/* ---------------------------------------------------------------------- */
/* Navy "detail" header: back button + centered title                     */
/* Used by: AchievementDetailScreen, ActivityDetailScreen,                */
/* CircularDetailScreen, JobPostingDetailScreen, MagazineDetailScreen...  */
/* ---------------------------------------------------------------------- */
export const detailHeader = {
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.navy,
    paddingTop: (StatusBar.currentHeight || 0) + 6,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  headerBtn: { padding: 6, borderRadius: 20 },
  headerTitle: { flex: 1, textAlign: 'center', color: COLORS.white, fontSize: 16, fontWeight: '700' },
};

/* ---------------------------------------------------------------------- */
/* Form navbar: Cancel ... Title ... Save                                 */
/* Used by: ActivityFormScreen, ChangePasswordScreen, AddCircularScreen,  */
/* CreateFundScreen, ProfileEditScreen, SupportScreenFs...                */
/* ---------------------------------------------------------------------- */
export const formNavbar = {
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingTop: (StatusBar.currentHeight ?? 0) + 12,
    backgroundColor: COLORS.navy,
  },
  navSide: { minWidth: 72, paddingHorizontal: 4 },
  navTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.white, textAlign: 'center' },
  navCancel: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  navSave: { fontSize: 15, color: COLORS.gold, fontWeight: '700', textAlign: 'right' },
};

/* ---------------------------------------------------------------------- */
/* Floating action button (36x36 navy circle, gold "+")                   */
/* ---------------------------------------------------------------------- */
// in common.js — accept a bottom inset param
export function fab(extra = {}, bottomInset = 0) {
  return {
    position: 'absolute',
    right: 20,
    bottom: 24 + bottomInset,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    ...extra,
  };
}
export const fabText = { color: COLORS.gold, fontSize: 24, fontWeight: '700', lineHeight: 28 };

/* ---------------------------------------------------------------------- */
/* Full-screen image lightbox / viewer                                    */
/* Variant with a circular close button (most detail screens)             */
/* ---------------------------------------------------------------------- */
export const lightbox = {
  viewerOverlay: { flex: 1, backgroundColor: COLORS.lightboxBg, justifyContent: 'center', alignItems: 'center' },
  viewerImage: { width: '100%', height: '80%' },
  viewerClose: {
    position: 'absolute', top: 48, right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  viewerCloseText: { color: '#fff', fontSize: 18, fontWeight: '700' },
};

/* Variant with a plain padded close icon (no background pill) */
export function lightboxSimple(extra = {}) {
  return {
    viewerOverlay: { flex: 1, backgroundColor: COLORS.lightboxBg, alignItems: 'center', justifyContent: 'center' },
    viewerClose: { position: 'absolute', top: 40, right: 20, padding: 8, ...extra },
    viewerImage: { width: '100%', height: '80%' },
  };
}

/* ---------------------------------------------------------------------- */
/* Attachment picker grid (image/doc thumbnails + dashed "add" tile)      */
/* Used by: AchievementFormScreen, ActivityFormScreen, AddCircularScreen, */
/* JobPostingFormScreen, MagazineFormScreen, SupportScreenFs...           */
/* Screens historically used two different key-naming schemes            */
/* ("thumb*" vs "grid*"); both map onto this same shared shape below.     */
/* ---------------------------------------------------------------------- */
export const attachmentGrid = {
  wrap: {
    flexDirection: 'row', flexWrap: 'wrap',
    borderWidth: 1.5, borderColor: '#CBD5E1',
    borderRadius: 12, borderStyle: 'dashed',
    padding: 8, minHeight: 80, alignItems: 'center',
  },
  thumb: {
    width: 80, height: 80, borderRadius: 10, margin: 4,
    overflow: 'hidden', backgroundColor: '#F1F5F9',
    borderWidth: 1, borderColor: COLORS.border,
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbDoc: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 4 },
  thumbIcon: { fontSize: 24 },
  thumbName: { fontSize: 9, color: COLORS.textMuted, textAlign: 'center', marginTop: 2 },
  thumbRemove: {
    position: 'absolute', top: 2, right: 2,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8,
    width: 18, height: 18, alignItems: 'center', justifyContent: 'center',
  },
  thumbRemoveText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  thumbAdd: {
    width: 80, height: 80, borderRadius: 10, margin: 4,
    borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC',
  },
  thumbAddIcon: { fontSize: 22, marginBottom: 2 },
  thumbAddText: { fontSize: 9, color: COLORS.textMuted, textAlign: 'center', fontWeight: '500' },
  hint: { fontSize: 11, color: COLORS.placeholder, marginTop: 6 },
};

/* ---------------------------------------------------------------------- */
/* Radio-style option list ("Public" / "Club members only", etc.)         */
/* Used by: ActivityFormScreen, AddCircularScreen, CreatePostScreen...    */
/* ---------------------------------------------------------------------- */
export const radioOption = {
  radioOption: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 10,
    padding: 14, backgroundColor: '#fff',
  },
  radioOptionSelected: { borderColor: COLORS.navy, backgroundColor: '#EFF6FF' },
  radioCircle: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#9CA3AF',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  radioCircleSelected: { borderColor: COLORS.navy },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.navy },
  radioTextWrap: { flex: 1 },
  radioLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
  radioLabelSelected: { color: COLORS.navy },
  radioSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  radioSubSelected: { color: '#6B9CC7' },
  radioIcon: { fontSize: 20, marginLeft: 8 },
};

/* ---------------------------------------------------------------------- */
/* White elevated card                                                    */
/* ---------------------------------------------------------------------- */
export function card(extra = {}) {
  return {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    ...SHADOW.md,
    ...extra,
  };
}

/* ---------------------------------------------------------------------- */
/* Small rounded status/category badge                                    */
/* ---------------------------------------------------------------------- */
export function badge({ bg = '#FEF9EC', color = '#B7791F' } = {}) {
  return {
    badge: { backgroundColor: bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontSize: 10, color, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  };
}

/* ---------------------------------------------------------------------- */
/* Empty-state block (icon + title + subtitle), used on most list screens */
/* ---------------------------------------------------------------------- */
export const emptyState = {
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#2D3748', marginTop: 12, marginBottom: 4 },
  emptyText: { fontSize: 14, color: COLORS.placeholder },
};

/* ---------------------------------------------------------------------- */
/* Standard text input                                                    */
/* ---------------------------------------------------------------------- */
export function input(extra = {}) {
  return {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...extra,
  };
}