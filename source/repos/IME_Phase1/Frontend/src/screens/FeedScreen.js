import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Image, Dimensions, FlatList,
  ActivityIndicator, Modal
} from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
import api from '../utils/api';

// ─── Badge color by urgency/category ─────────────────────────────────────────
function getBadgeStyle(urgencyLevel, fundCategory) {
  if (urgencyLevel === "Critical" || urgencyLevel === "High") {
    return { badgeColor: "#e8623a", badgeBg: "#fef3ed", fundColor: "#e8623a" };
  }
  if (fundCategory === "Education") {
    return { badgeColor: "#16a34a", badgeBg: "#f0f9f0", fundColor: "#11998e" };
  }
  if (fundCategory === "Medical") {
    return { badgeColor: "#e8623a", badgeBg: "#fef3ed", fundColor: "#e8623a" };
  }
  return { badgeColor: "#6366f1", badgeBg: "#eef2ff", fundColor: "#6366f1" };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Avatar({ initials, online, size = 44 }) {
  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      {online && <View style={[styles.onlineDot, { bottom: 0, right: 0 }]} />}
    </View>
  );
}

function ProgressBar({ raised, goal }) {
  const pct = Math.min((raised / goal) * 100, 100);
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressMeta}>
        <Text style={styles.progressLabel}>Raised so far</Text>
        <Text style={[styles.progressPct, { color: "#22c55e" }]}>
          {Math.round(pct)}% reached
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <View style={styles.progressMeta}>
        <Text style={styles.progressAmount}>₹{raised.toLocaleString("en-IN")}</Text>
        <Text style={styles.progressLabel}>Goal: ₹{goal.toLocaleString("en-IN")}</Text>
      </View>
    </View>
  );
}

function DocumentCard({ docName, docUrl, images, onOpenImages }) {
  return (
    <View style={styles.docCard}>
      <View style={styles.docRow}>
        <View style={styles.docIcon}>
          <Ionicons name="document-text" size={20} color="#fff" />
        </View>
        <View style={styles.docInfo}>
          <Text style={styles.docName} numberOfLines={1}>{docName}</Text>
          <Text style={styles.docMeta}>Supporting document</Text>
        </View>
        <TouchableOpacity style={styles.docDownload}>
          <Ionicons name="download-outline" size={16} color="#666" />
        </TouchableOpacity>
      </View>

      {images.length > 0 && (
        <View style={styles.thumbStrip}>
          {images.slice(0, 3).map((img, index) => {
            const isLast = index === 2 && images.length > 3;
            return (
              <TouchableOpacity
                key={index}
                style={styles.thumbWrapper}
                onPress={() => onOpenImages(images, index)}
              >
                <Image source={{ uri: img }} style={styles.thumbImage} />
                {isLast && (
                  <View style={styles.overlay}>
                    <Text style={styles.overlayText}>+{images.length - 3}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
const formatTimeAgo = (dateString) => {
  if (!dateString) return '';

  const now = new Date();
  const created = new Date(dateString);
  const diffMs = now - created;

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';

  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;

  if (diffDays === 1) return 'Yesterday';

  if (diffDays < 7) return `${diffDays} days ago`;

  // older → show date + time
  return created.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};
function PostCard({ post, onOpenImages, navigation }) {
  const [liked, setLiked] = useState(false);
  const { badgeColor, badgeBg, fundColor } = getBadgeStyle(post.urgencyLevel, post.fundCategory);

  // Build images array from beneficiaryPhotoUrl
  const images = post.beneficiaryPhotoUrl ? [post.beneficiaryPhotoUrl] : [];

  // Initials from fullName
  const initials = (post.fullName || "??")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Avatar initials={initials} online={post.status === "Active"} />
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.posterName}>{post.fullName}</Text>
          <Text style={styles.posterMeta}>{post.place} · {formatTimeAgo(post.createdDate)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>
            {post.urgencyLevel?.toUpperCase() || post.fundCategory?.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Title + Body */}
      <View style={styles.cardContent}>
        <Text style={styles.postTitle}>{post.fundTitle}</Text>
        <Text style={styles.postBody}>{post.description}</Text>
      </View>

      {/* Document */}
      <DocumentCard
        docName={`${post.fundCategory}_Document.pdf`}
        docUrl={post.supportingDocumentUrl}
        images={images}
        onOpenImages={onOpenImages}
      />

      {/* Progress */}
      <ProgressBar raised={post.collectedAmount} goal={post.targetAmount} />

      {/* End date */}
      {post.endDate && (
        <View style={styles.endDateRow}>
          <Ionicons name="time-outline" size={13} color="#aaa" />
          <Text style={styles.endDateText}>
            Ends {new Date(post.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <TouchableOpacity onPress={() => setLiked(!liked)} style={styles.footerReaction}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={18} color={liked ? "#e8623a" : "#aaa"} />
          <Text style={styles.footerCount}>{liked ? 1 : 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerReaction}>
          <Ionicons name="chatbubble-outline" size={16} color="#aaa" />
          <Text style={styles.footerCount}>0</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fundBtn, { backgroundColor: fundColor }]}
          onPress={() => navigation.navigate("RaiseFund", { post: {
    id: post.id,
    title: post.fundTitle,
    body: post.description,
   raised: post.collectedAmount ?? post.raised ?? 0,
      goal: post.targetAmount ?? post.goal ?? 0,
    badge: post.urgencyLevel || post.fundCategory || '',
    contactNumber: post.contactNumber,
  bankName: post.bankName,
  accountNumber: post.accountNumber,
  ifsc: post.ifsc,
  upiId: post.upiId,
  fullName: post.fullName,
    badgeColor: badgeColor,
    badgeBg: badgeBg,
     minimumAmount: post.minimumAmount ?? 1,
  } })}
          activeOpacity={0.85}
        >
          <Ionicons name="heart" size={14} color="#fff" />
          <Text style={styles.fundBtnText}>Raise Fund</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function FeedScreen({ navigation  }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [startIndex, setStartIndex] = useState(0);
 useFocusEffect(
  useCallback(() => {
    fetchFundraisers();
  }, [])
);

  useEffect(() => {
    fetchFundraisers();
  }, []);

  const fetchFundraisers = async () => {
  try {
    setLoading(true);
    setError(null);

    const res = await api.get('/Fundraise'); // ✅ clean call

    if (res.data.success) {
      setPosts(res.data.data);
    } else {
      setError(res.data.message || "Failed to load");
    }

  } catch (e) {
    console.log("ERROR FULL:", e);
    console.log("ERROR RESPONSE:", e.response);
    console.log("ERROR MESSAGE:", e.message);

    setError("Network error. Pull to refresh.");
  } finally {
    setLoading(false);
  }
};

  const openViewer = (imgs, index = 0) => {
    setSelectedImages([...imgs]);
    setStartIndex(index);
    setViewerVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#e8623a" />
        <Text style={{ color: "#888", marginTop: 12 }}>Loading fundraisers…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="cloud-offline-outline" size={48} color="#ccc" />
        <Text style={{ color: "#888", marginTop: 12, textAlign: "center" }}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchFundraisers}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f4f0" />

      <ScrollView
        style={styles.feed}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {posts.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Ionicons name="heart-outline" size={48} color="#ccc" />
            <Text style={{ color: "#aaa", marginTop: 12 }}>No active fundraisers</Text>
          </View>
        ) : (
          posts.map((item) => (
  <PostCard
    key={item.id}
    post={item}               // ← pass raw item
    onOpenImages={openViewer}
    navigation={navigation}
  />
))
        )}
      </ScrollView>

      {/* Full Screen Image Viewer */}
      <Modal visible={viewerVisible} transparent={true} onRequestClose={() => setViewerVisible(false)}>
        <View style={styles.viewer}>
          <FlatList
            data={selectedImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => i.toString()}
            initialScrollIndex={startIndex}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.fullImage} />
            )}
          />
          <TouchableOpacity style={styles.closeBtn} onPress={() => setViewerVisible(false)}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f4f0" },
  feed: { flex: 1, paddingTop: 4 },

  card: {
    backgroundColor: "#fff", marginHorizontal: 14, marginTop: 12,
    borderRadius: 20, overflow: "hidden",
    borderWidth: 0.5, borderColor: "rgba(0,0,0,0.07)",
  },
  cardHeader: {
    flexDirection: "row", alignItems: "center",
    padding: 14, paddingBottom: 10, gap: 10,
  },
  avatar: { backgroundColor: "#c084fc", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 15, fontWeight: "500" },
  onlineDot: {
    position: "absolute", width: 13, height: 13,
    backgroundColor: "#22c55e", borderRadius: 7,
    borderWidth: 2, borderColor: "#fff",
  },
  cardHeaderInfo: { flex: 1 },
  posterName: { fontSize: 15, fontWeight: "600", color: "#111" },
  posterMeta: { fontSize: 11, color: "#888", marginTop: 2, fontFamily: "monospace" },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },

  cardContent: { paddingHorizontal: 16, paddingBottom: 12 },
  postTitle: { fontSize: 17, fontWeight: "600", color: "#111", lineHeight: 24, marginBottom: 8 },
  postBody: { fontSize: 14, color: "#444", lineHeight: 22 },

  docCard: {
    marginHorizontal: 16, marginBottom: 14,
    backgroundColor: "#f0ede8", borderRadius: 14, overflow: "hidden",
    borderWidth: 0.5, borderColor: "rgba(0,0,0,0.08)",
  },
  docRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  docIcon: {
    width: 40, height: 48, backgroundColor: "#e8623a",
    borderRadius: 6, alignItems: "center", justifyContent: "center",
  },
  docInfo: { flex: 1 },
  docName: { fontSize: 13, fontWeight: "600", color: "#111" },
  docMeta: { fontSize: 11, color: "#888", marginTop: 2 },
  docDownload: {
    width: 30, height: 30, backgroundColor: "#fff", borderRadius: 15,
    alignItems: "center", justifyContent: "center",
    borderWidth: 0.5, borderColor: "rgba(0,0,0,0.1)",
  },
  thumbStrip: { flexDirection: "row", gap: 4, paddingHorizontal: 12, paddingBottom: 12 },
  thumbWrapper: { flex: 1, height: 80, borderRadius: 10, overflow: "hidden" },
  thumbImage: { width: "100%", height: "100%" },
  overlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center",
  },
  overlayText: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  progressWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  progressMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel: { fontSize: 12, color: "#888" },
  progressPct: { fontSize: 12, fontWeight: "600" },
  progressTrack: {
    height: 6, backgroundColor: "#f0ede8", borderRadius: 99, overflow: "hidden", marginBottom: 6,
  },
  progressFill: { height: "100%", backgroundColor: "#22c55e", borderRadius: 99 },
  progressAmount: { fontSize: 13, fontWeight: "600", color: "#111" },

  endDateRow: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 16, paddingBottom: 10,
  },
  endDateText: { fontSize: 11, color: "#aaa" },

  cardFooter: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderTopWidth: 0.5, borderTopColor: "#f0ede8",
    paddingHorizontal: 16, paddingVertical: 10,
  },
  footerReaction: { flexDirection: "row", alignItems: "center", gap: 4, marginRight: 4 },
  footerCount: { fontSize: 12, color: "#888" },
  fundBtn: {
    marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9,
  },
  fundBtnText: { fontSize: 13, fontWeight: "600", color: "#fff", letterSpacing: 0.3 },

  retryBtn: {
    marginTop: 16, backgroundColor: "#e8623a", borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 10,
  },
  retryBtnText: { color: "#fff", fontWeight: "600" },

  viewer: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "#000", justifyContent: "center",
  },
  fullImage: { width, height: "100%", resizeMode: "contain" },
  closeBtn: { position: "absolute", top: 50, right: 20 },
});