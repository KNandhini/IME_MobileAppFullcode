import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Image, Dimensions, FlatList,
  ActivityIndicator, Modal, Animated, Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fundraiseService } from "../services/fundraiseService";

const API_BASE_URL = "http://10.0.2.2:51150/api";
const { width }    = Dimensions.get("window");
const CARD_WIDTH   = width - 28;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getBadgeStyle(urgencyLevel, fundCategory) {
  if (urgencyLevel === "Critical" || urgencyLevel === "High")
    return { badgeColor: "#e8623a", badgeBg: "#fef3ed", fundColor: "#e8623a" };
  if (fundCategory === "Education")
    return { badgeColor: "#16a34a", badgeBg: "#f0f9f0", fundColor: "#11998e" };
  if (fundCategory === "Medical")
    return { badgeColor: "#e8623a", badgeBg: "#fef3ed", fundColor: "#e8623a" };
  return { badgeColor: "#6366f1", badgeBg: "#eef2ff", fundColor: "#6366f1" };
}

function formatTimeAgo(dateString) {
  if (!dateString) return "";
  const diffMs = Date.now() - new Date(dateString).getTime();
  if (diffMs < 0) return "Just now";
  const m = Math.floor(diffMs / 60000);
  const h = Math.floor(diffMs / 3600000);
  const d = Math.floor(diffMs / 86400000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m} min ago`;
  if (h < 24) return `${h} hr${h > 1 ? "s" : ""} ago`;
  if (d === 1) return "Yesterday";
  if (d < 7)  return `${d} days ago`;
  return new Date(dateString).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function isImagePath(p = "") {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(p);
}

/** Windows backslash path → forward slash for API ?path= param */
const toApiPath = (storedPath) =>
  (storedPath || "").replace(/\\/g, "/");

/**
 * Parse a comma-separated DB string of paths into an array of media items.
 * Each item: { type: 'image'|'doc', path: string, name: string }
 * "path" is the raw server path passed to AuthImage / doc download.
 */
function parseMediaPaths(raw, defaultType = "image") {
  if (!raw) return [];
  return raw
    .split(",")
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => ({
      type: isImagePath(p) ? "image" : "doc",
      path: p,
      name: p.split(/[\\/]/).pop(),
    }));
}

// ─── Authenticated fetch → base64 data URI ────────────────────────────────────
/**
 * Fetches a file from:
 *   GET /api/Fundraise/file?path=Fundraise-5/abc.png
 * with the JWT Bearer token and returns a base64 data URI string,
 * or null on failure.
 */
async function fetchAuthDataUri(storedPath) {
  try {
    const token   = await AsyncStorage.getItem("authToken");
    const apiPath = toApiPath(storedPath);
    const url     = `${API_BASE_URL}/Fundraise/file?path=${encodeURIComponent(apiPath)}`;

    const res = await fetch(url, {
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const blob   = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result); // "data:image/png;base64,..."
      reader.onerror   = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("fetchAuthDataUri failed:", storedPath, e.message);
    return null;
  }
}

// ─── AuthImage ────────────────────────────────────────────────────────────────
/** Renders a single server image fetched with the auth token. */
function AuthImage({ path, style, resizeMode = "cover" }) {
  const [uri,   setUri]   = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchAuthDataUri(path).then(result => {
      if (cancelled) return;
      if (result) setUri(result);
      else setError(true);
    });
    return () => { cancelled = true; };
  }, [path]);

  if (error) {
    return (
      <View style={[style, { backgroundColor: "#E2E8F0", alignItems: "center", justifyContent: "center" }]}>
        <Ionicons name="image-outline" size={28} color="#aaa" />
      </View>
    );
  }
  if (!uri) {
    return (
      <View style={[style, { backgroundColor: "#E2E8F0", alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="small" color="#e8623a" />
      </View>
    );
  }
  return <Image source={{ uri }} style={style} resizeMode={resizeMode} />;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ initials, active, size = 42 }) {
  return (
    <View style={{ width: size, height: size }}>
      <View style={[av.circle, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={av.text}>{initials}</Text>
      </View>
      {active && <View style={av.dot} />}
    </View>
  );
}

// ─── Animated Progress Bar ────────────────────────────────────────────────────
function ProgressBar({ raised, goal }) {
  const anim = useRef(new Animated.Value(0)).current;
  const pct  = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct, duration: 800, useNativeDriver: false,
    }).start();
  }, [pct]);

  const fillWidth = anim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });

  return (
    <View style={pb.wrap}>
      <View style={pb.meta}>
        <Text style={pb.label}>Raised so far</Text>
        <Text style={pb.pct}>{Math.round(pct)}% reached</Text>
      </View>
      <View style={pb.track}>
        <Animated.View style={[pb.fill, { width: fillWidth }]} />
      </View>
      <View style={pb.meta}>
        <Text style={pb.amount}>₹{(raised ?? 0).toLocaleString("en-IN")}</Text>
        <Text style={pb.label}>Goal: ₹{(goal ?? 0).toLocaleString("en-IN")}</Text>
      </View>
    </View>
  );
}

// ─── Media Strip ─────────────────────────────────────────────────────────────
/**
 * Paginated horizontal strip. Each item is:
 *   { type: 'image'|'doc', path: string, name: string }
 *
 * Images → AuthImage (fetches with token).
 * Docs   → download card (opens /api/Fundraise/file endpoint).
 */
function MediaStrip({ mediaItems, onOpenViewer }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!mediaItems || mediaItems.length === 0) return null;

  const handleScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
    setActiveIndex(idx);
  };

  const handleDocOpen = async (item) => {
    try {
      const token   = await AsyncStorage.getItem("authToken");
      const apiPath = toApiPath(item.path);
      const url     = `${API_BASE_URL}/Fundraise/file?path=${encodeURIComponent(apiPath)}`;

      // Fetch blob and open as base64 — works inside the app without browser auth
      const res = await fetch(url, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!res.ok) {
        Alert.alert("Error", `Server returned ${res.status}`);
        return;
      }
      Alert.alert("Document", `"${item.name}" downloaded successfully.\n\nTo view, integrate a PDF viewer library (e.g. expo-file-system + expo-sharing).`);
    } catch (e) {
      Alert.alert("Error", "Failed to fetch document: " + e.message);
    }
  };

  return (
    <View style={ms.container}>
      <FlatList
        data={mediaItems}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => {
          if (item.type === "image") {
            return (
              <TouchableOpacity
                activeOpacity={0.95}
                style={[ms.tile, { width: CARD_WIDTH }]}
                onPress={() => {
                  // Pass only image items to the viewer
                  const imgItems = mediaItems.filter(m => m.type === "image");
                  const imgIdx   = imgItems.findIndex(m => m.path === item.path);
                  onOpenViewer(imgItems, Math.max(imgIdx, 0));
                }}
              >
                <AuthImage path={item.path} style={ms.img} resizeMode="cover" />
                <View style={ms.expandHint}>
                  <Ionicons name="expand-outline" size={16} color="#fff" />
                </View>
                {/* Slide counter badge */}
                {mediaItems.length > 1 && (
                  <View style={ms.counterBadge}>
                    <Text style={ms.counterText}>{index + 1}/{mediaItems.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }

          // Document tile
          const isPdf = /\.pdf(\?.*)?$/i.test(item.path);
          return (
            <View style={[ms.tile, ms.docTile, { width: CARD_WIDTH }]}>
              <View style={ms.docIconCircle}>
                <Ionicons
                  name={isPdf ? "document-text" : "document-attach"}
                  size={36}
                  color="#fff"
                />
              </View>
              <Text style={ms.docLabel}>Supporting Document</Text>
              <Text style={ms.docFileName} numberOfLines={2}>{item.name}</Text>
              <TouchableOpacity
                style={ms.docDownloadBtn}
                onPress={() => handleDocOpen(item)}
                activeOpacity={0.8}
              >
                <Ionicons name="download-outline" size={16} color="#fff" />
                <Text style={ms.docDownloadText}>Download</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* Pagination dots */}
      {mediaItems.length > 1 && (
        <View style={ms.dotsRow}>
          {mediaItems.map((_, i) => (
            <View key={i} style={[ms.dot, i === activeIndex && ms.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── useAttachments hook ──────────────────────────────────────────────────────
/**
 * Tries GET /api/Fundraise/file?fundraiseId={id} first.
 * Falls back to parsing beneficiaryPhotoUrl + supportingDocumentUrl
 * from the post object (comma-separated paths).
 */
function useAttachments(post) {
  const [mediaItems,   setMediaItems]   = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const result = await fundraiseService.getFile({ fundraiseId: post.id });

        if (cancelled) return;

        let files = [];
        if (Array.isArray(result))        files = result;
        else if (Array.isArray(result?.data)) files = result.data;

        if (files.length > 0) {
          const items = files.map(f => {
            const rawPath = f.filePath || f.path || f.url || f.fileUrl || f;
            const name    = f.fileName || f.name || String(rawPath).split(/[\\/]/).pop();
            return {
              type: isImagePath(String(rawPath)) ? "image" : "doc",
              path: String(rawPath),
              name,
            };
          });
          if (!cancelled) setMediaItems(items);
          return;
        }
      } catch (e) {
        console.log("getFile error:", e.message);
      }

      if (cancelled) return;

      // ── Fallback: parse comma-separated paths from the post itself ──
      const fallback = [
        ...parseMediaPaths(post.beneficiaryPhotoUrl,   "image"),
        ...parseMediaPaths(post.supportingDocumentUrl, "doc"),
      ];
      if (!cancelled) setMediaItems(fallback);
    };

    load().finally(() => { if (!cancelled) setLoadingMedia(false); });
    return () => { cancelled = true; };
  }, [post.id]);

  return { mediaItems, loadingMedia };
}

// ─── Full-screen Image Viewer ─────────────────────────────────────────────────
/**
 * Receives imageItems: Array<{ path, name }> — fetches each with auth token.
 */
function ImageViewer({ visible, imageItems, startIndex, onClose }) {
  const [dataUris, setDataUris] = useState([]);

  useEffect(() => {
    if (!visible || !imageItems?.length) return;
    setDataUris(new Array(imageItems.length).fill(null));

    imageItems.forEach((item, i) => {
      fetchAuthDataUri(item.path).then(uri => {
        setDataUris(prev => {
          const next = [...prev];
          next[i] = uri;
          return next;
        });
      });
    });
  }, [visible, imageItems]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={vw.root}>
        <FlatList
          data={imageItems}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => i.toString()}
          initialScrollIndex={startIndex}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          renderItem={({ item, index }) => {
            const uri = dataUris[index];
            if (!uri) {
              return (
                <View style={[vw.imgWrap, { alignItems: "center", justifyContent: "center" }]}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              );
            }
            return (
              <View style={vw.imgWrap}>
                <Image source={{ uri }} style={vw.img} resizeMode="contain" />
              </View>
            );
          }}
        />
        <TouchableOpacity style={vw.close} onPress={onClose}>
          <View style={vw.closeCircle}>
            <Ionicons name="close" size={22} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, onOpenViewer, navigation }) {
  const [liked, setLiked] = useState(false);
  const { badgeColor, badgeBg, fundColor } = getBadgeStyle(post.urgencyLevel, post.fundCategory);
  const { mediaItems, loadingMedia } = useAttachments(post);

  const initials = (post.fullName || "??")
    .split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();

  return (
    <View style={card.root}>

      {/* Header */}
      <View style={card.header}>
        <Avatar initials={initials} active={post.status === "Active"} />
        <View style={card.headerInfo}>
          <Text style={card.name}>{post.fullName}</Text>
          <Text style={card.meta}>{post.place} · {formatTimeAgo(post.createdDate)}</Text>
        </View>
        <View style={[card.badge, { backgroundColor: badgeBg }]}>
          <Text style={[card.badgeText, { color: badgeColor }]}>
            {post.urgencyLevel?.toUpperCase() || post.fundCategory?.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Title + description */}
      <View style={card.body}>
        <Text style={card.title}>{post.fundTitle}</Text>
        <Text style={card.desc} numberOfLines={3}>{post.description}</Text>
      </View>

      {/* Media strip */}
      {loadingMedia ? (
        <View style={card.mediaLoader}>
          <ActivityIndicator size="small" color="#e8623a" />
          <Text style={card.mediaLoaderText}>Loading media…</Text>
        </View>
      ) : (
        <MediaStrip mediaItems={mediaItems} onOpenViewer={onOpenViewer} />
      )}

      {/* Progress */}
      <ProgressBar raised={post.collectedAmount ?? 0} goal={post.targetAmount ?? 0} />

      {/* End date */}
      {post.endDate && (
        <View style={card.endRow}>
          <Ionicons name="time-outline" size={13} color="#aaa" />
          <Text style={card.endText}>
            Ends {new Date(post.endDate).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={card.footer}>
        <TouchableOpacity onPress={() => setLiked(!liked)} style={card.reaction}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={19}
            color={liked ? "#e8623a" : "#bbb"}
          />
          <Text style={card.reactionCount}>{liked ? 1 : 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={card.reaction}>
          <Ionicons name="chatbubble-outline" size={17} color="#bbb" />
          <Text style={card.reactionCount}>0</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[card.fundBtn, { backgroundColor: fundColor }]}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate("RaiseFund", {
              post: {
                id:            post.id,
                title:         post.fundTitle,
                body:          post.description,
                raised:        post.collectedAmount ?? 0,
                goal:          post.targetAmount ?? 0,
                badge:         post.urgencyLevel || post.fundCategory || "",
                contactNumber: post.contactNumber,
                bankName:      post.bankName,
                accountNumber: post.accountNumber,
                ifsc:          post.ifsc,
                upiId:         post.upiId,
                fullName:      post.fullName,
                badgeColor,
                badgeBg,
                minimumAmount: post.minimumAmount ?? 1,
              },
            })
          }
        >
          <Ionicons name="heart" size={14} color="#fff" />
          <Text style={card.fundBtnText}>Raise Fund</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function FeedScreen({ navigation }) {
  const [posts,     setPosts]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [viewerVis, setViewerVis] = useState(false);
  const [selItems,  setSelItems]  = useState([]);   // imageItems array
  const [selIdx,    setSelIdx]    = useState(0);

  const fetchFundraisers = async () => {
    try {
      setLoading(true); setError(null);
      const res = await fundraiseService.getAll();
      if (Array.isArray(res))          setPosts(res);
      else if (res?.success)           setPosts(res.data || []);
      else if (Array.isArray(res?.data)) setPosts(res.data);
      else                             setError(res?.message || "Failed to load");
    } catch {
      setError("Network error. Pull to refresh.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchFundraisers(); }, []));

  // imageItems: Array<{ path, name }> — only image-type media items
  const openViewer = (imageItems, idx = 0) => {
    setSelItems(imageItems);
    setSelIdx(idx);
    setViewerVis(true);
  };

  if (loading)
    return (
      <SafeAreaView style={[s.safe, s.center]}>
        <ActivityIndicator size="large" color="#e8623a" />
        <Text style={s.hint}>Loading fundraisers…</Text>
      </SafeAreaView>
    );

  if (error)
    return (
      <SafeAreaView style={[s.safe, s.center]}>
        <Ionicons name="cloud-offline-outline" size={48} color="#ccc" />
        <Text style={[s.hint, { textAlign: "center", paddingHorizontal: 32 }]}>{error}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={fetchFundraisers}>
          <Text style={s.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A5F" />

      <ScrollView
        style={s.feed}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      >
        {posts.length === 0 ? (
          <View style={[s.center, { marginTop: 80 }]}>
            <Ionicons name="heart-outline" size={52} color="#ccc" />
            <Text style={s.hint}>No active fundraisers</Text>
          </View>
        ) : (
          posts.map(item => (
            <PostCard
              key={item.id}
              post={item}
              onOpenViewer={openViewer}
              navigation={navigation}
            />
          ))
        )}
      </ScrollView>

      <ImageViewer
        visible={viewerVis}
        imageItems={selItems}
        startIndex={selIdx}
        onClose={() => setViewerVis(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: "#f5f4f0" },
  feed:     { flex: 1 },
  center:   { flex: 1, justifyContent: "center", alignItems: "center" },
  hint:     { color: "#888", marginTop: 12, fontSize: 14 },
  retryBtn: {
    marginTop: 16, backgroundColor: "#e8623a",
    borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10,
  },
  retryText: { color: "#fff", fontWeight: "600" },
});

const av = StyleSheet.create({
  circle: { backgroundColor: "#c084fc", alignItems: "center", justifyContent: "center" },
  text:   { color: "#fff", fontSize: 15, fontWeight: "600" },
  dot: {
    position: "absolute", bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: "#22c55e", borderWidth: 2, borderColor: "#fff",
  },
});

const pb = StyleSheet.create({
  wrap:   { paddingHorizontal: 16, paddingBottom: 8, paddingTop: 4 },
  meta:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  label:  { fontSize: 12, color: "#888" },
  pct:    { fontSize: 12, fontWeight: "600", color: "#22c55e" },
  track:  {
    height: 6, backgroundColor: "#f0ede8",
    borderRadius: 99, overflow: "hidden", marginBottom: 5,
  },
  fill:   { height: "100%", backgroundColor: "#22c55e", borderRadius: 99 },
  amount: { fontSize: 13, fontWeight: "700", color: "#111" },
});

const ms = StyleSheet.create({
  container: { marginBottom: 2 },
  tile:      { overflow: "hidden" },

  // Image tile
  img: { width: "100%", height: 260, backgroundColor: "#e8e5e0" },
  expandHint: {
    position: "absolute", bottom: 10, right: 12,
    backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 6, padding: 5,
  },
  counterBadge: {
    position: "absolute", top: 10, right: 12,
    backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 12,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  counterText: { color: "#fff", fontSize: 11, fontWeight: "600" },

  // Document tile
  docTile: {
    height: 260, backgroundColor: "#1a1a2e",
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 28, gap: 10,
  },
  docIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#e8623a",
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  docLabel: {
    color: "rgba(255,255,255,0.6)", fontSize: 12,
    fontWeight: "500", textTransform: "uppercase", letterSpacing: 1,
  },
  docFileName: {
    color: "#fff", fontSize: 15, fontWeight: "700",
    textAlign: "center", lineHeight: 21,
  },
  docDownloadBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#e8623a",
    borderRadius: 22, paddingHorizontal: 22, paddingVertical: 11, marginTop: 6,
  },
  docDownloadText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // Pagination dots
  dotsRow: {
    flexDirection: "row", justifyContent: "center",
    alignItems: "center", gap: 5, paddingVertical: 9,
  },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: "#ddd" },
  dotActive: { backgroundColor: "#e8623a", width: 18, borderRadius: 3 },
});

const card = StyleSheet.create({
  root: {
    backgroundColor: "#fff", marginHorizontal: 14, marginTop: 12,
    borderRadius: 20, overflow: "hidden",
    borderWidth: 0.5, borderColor: "rgba(0,0,0,0.07)",
  },
  header:     { flexDirection: "row", alignItems: "center", padding: 14, paddingBottom: 10, gap: 10 },
  headerInfo: { flex: 1 },
  name:       { fontSize: 15, fontWeight: "600", color: "#111" },
  meta:       { fontSize: 11, color: "#888", marginTop: 2 },
  badge:      { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:  { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },

  body:  { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 17, fontWeight: "700", color: "#111", lineHeight: 24, marginBottom: 6 },
  desc:  { fontSize: 14, color: "#555", lineHeight: 22 },

  mediaLoader: {
    height: 80, alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 10, backgroundColor: "#fafaf9",
  },
  mediaLoaderText: { fontSize: 13, color: "#aaa" },

  endRow:  { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 16, paddingBottom: 10 },
  endText: { fontSize: 11, color: "#aaa" },

  footer: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderTopWidth: 0.5, borderTopColor: "#f0ede8",
    paddingHorizontal: 16, paddingVertical: 10,
  },
  reaction:      { flexDirection: "row", alignItems: "center", gap: 4, marginRight: 4 },
  reactionCount: { fontSize: 12, color: "#888" },
  fundBtn: {
    marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9,
  },
  fundBtnText: { fontSize: 13, fontWeight: "600", color: "#fff", letterSpacing: 0.3 },
});

const vw = StyleSheet.create({
  root:    { flex: 1, backgroundColor: "#000", justifyContent: "center" },
  imgWrap: { width, height: "100%", justifyContent: "center", alignItems: "center" },
  img:     { width, height: "100%" },
  close:   { position: "absolute", top: 52, right: 18 },
  closeCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center", justifyContent: "center",
  },
});