// FeedScreen.jsx — Expo / React Native
// Run: npx create-expo-app MyApp, drop this into screens/, and import it in your navigator.

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
    FlatList  
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // expo install @expo/vector-icons
import { Modal } from "react-native";
const { width } = Dimensions.get("window");

// ─────────────────────────────────────────────
// Sample data
// ─────────────────────────────────────────────
const POSTS = [
  {
    id: "1",
    name: "Arjun Mehta",
    initials: "AM",
    avatarGradient: ["#667eea", "#764ba2"],
    location: "Delhi, India",
    time: "2 hours ago",
    badge: "URGENT",
    badgeColor: "#e8623a",
    badgeBg: "#fef3ed",
    title: "Medical support needed for 8-year-old with rare condition",
    body:
      "My nephew Rohan was diagnosed with a rare autoimmune disorder last month. The treatment is available but the costs are beyond what our family can manage alone. Every rupee matters right now.",
    docName: "Medical_Report_Rohan.pdf",
    docMeta: "Diagnosis report · 2.4 MB",
    images: [
      "https://picsum.photos/400/300",
      "https://picsum.photos/401/300",
      "https://picsum.photos/402/300",
      "https://picsum.photos/403/300",
      "https://picsum.photos/404/300",
    ],
    raised: 136000,
    goal: 200000,
    likes: 0,
    comments: 0,
    fundColor: "#e8623a",
    online: true,
  },
  {
    id: "2",
    name: "Sunita Rao",
    initials: "SR",
    avatarGradient: ["#11998e", "#38ef7d"],
    location: "Bengaluru",
    time: "Yesterday",
    badge: "EDUCATION",
    badgeColor: "#16a34a",
    badgeBg: "#f0f9f0",
    title: "Help send 12 girls from rural Karnataka to college",
    body:
      "These bright students passed their 12th with distinction but lack funds for the next step. Let's change that together.",
    docName: "Student_List_Sunita.pdf",
    docMeta: "Verified list · 1.1 MB",
    images: [
      "https://picsum.photos/400/300",
      "https://picsum.photos/401/300",
      "https://picsum.photos/402/300",],
    raised: 86000,
    goal: 200000,
    likes: 0,
    comments: 0,
    fundColor: "#11998e",
    online: false,
  },
];

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function Avatar({ initials, online, size = 44 }) {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      {online && (
        <View
          style={[
            styles.onlineDot,
            { bottom: 0, right: 0 },
          ]}
        />
      )}
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
        <Text style={styles.progressAmount}>
          ₹{raised.toLocaleString("en-IN")}
        </Text>
        <Text style={styles.progressLabel}>
          Goal: ₹{goal.toLocaleString("en-IN")}
        </Text>
      </View>
    </View>
  );
}

function DocumentCard({ docName, docMeta, images, onOpenImages }) {
  return (
    <View style={styles.docCard}>
      <View style={styles.docRow}>
        <View style={styles.docIcon}>
          <Ionicons name="document-text" size={20} color="#fff" />
        </View>
        <View style={styles.docInfo}>
          <Text style={styles.docName} numberOfLines={1}>
            {docName}
          </Text>
          <Text style={styles.docMeta}>{docMeta}</Text>
        </View>
        <TouchableOpacity style={styles.docDownload}>
          <Ionicons name="download-outline" size={16} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Clickable Thumbnails */}
<View style={styles.thumbStrip}>
  {images.slice(0, 3).map((img, index) => {
    const isLast = index === 2 && images.length > 3;

    return (
      <TouchableOpacity
        key={index}
        style={styles.thumbWrapper}
        onPress={() => onOpenImages(images,  index)}
      >
        <Image source={{ uri: img }} style={styles.thumbImage} />

        {isLast && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>
              +{images.length - 3}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  })}
</View>
    </View>
  );
}

function PostCard({ post,onOpenImages,navigation }) {
  const [liked, setLiked] = useState(false);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Avatar initials={post.initials} online={post.online} />
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.posterName}>{post.name}</Text>
          <Text style={styles.posterMeta}>
            {post.time} · {post.location}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: post.badgeBg }]}>
          <Text style={[styles.badgeText, { color: post.badgeColor }]}>
            {post.badge}
          </Text>
        </View>
      </View>

      {/* Title + Body */}
      <View style={styles.cardContent}>
        <Text style={styles.postTitle}>{post.title}</Text>
        <Text style={styles.postBody}>{post.body}</Text>
      </View>

      {/* Document */}
      <DocumentCard
  docName={post.docName}
  docMeta={post.docMeta}
  images={post.images}
  onOpenImages={onOpenImages}
/>

      {/* Progress */}
      <ProgressBar raised={post.raised} goal={post.goal} />

      {/* Footer */}
      <View style={styles.cardFooter}>
        <TouchableOpacity
          onPress={() => setLiked(!liked)}
          style={styles.footerReaction}
        >
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={18}
            color={liked ? "#e8623a" : "#aaa"}
          />
          <Text style={styles.footerCount}>{post.likes + (liked ? 1 : 0)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerReaction}>
          <Ionicons name="chatbubble-outline" size={16} color="#aaa" />
          <Text style={styles.footerCount}>{post.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fundBtn, { backgroundColor: post.fundColor }]}
           onPress={() => navigation.navigate("RaiseFund", { post })} 
          activeOpacity={0.85}
        >
          <Ionicons name="heart" size={14} color="#fff" />
          <Text style={styles.fundBtnText}>Raise Fund</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────

export default function FeedScreen({ navigation }) {
    const [viewerVisible, setViewerVisible] = useState(false);
const [selectedImages, setSelectedImages] = useState([]);
const [startIndex, setStartIndex] = useState(0);
//const scrollRef = useRef(null);
const flatListRef = useRef(null);
const openViewer = (imgs, index = 0) => {
  setSelectedImages([...imgs]); // ✅ force new reference
  setStartIndex(index);
  setViewerVisible(true);
};

/*useEffect(() => {
  if (viewerVisible && scrollRef.current) {
    setTimeout(() => {
      scrollRef.current.scrollTo({
        x: width * startIndex,
        animated: false,
      });
    }, 100);
  }
}, [viewerVisible, startIndex]);*/
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* App Header */}
      

      {/* Feed */}
      <ScrollView
        style={styles.feed}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {POSTS.map((post) => (
          <PostCard
  key={post.id}
  post={post}
  onOpenImages={(imgs, index) => openViewer(imgs, index)}
   navigation={navigation}  
/>
        ))}
      </ScrollView>

     {/* Full Screen Viewer */}
     <Modal visible={viewerVisible} transparent={true}>
  <View style={styles.viewer}>
    <FlatList
      data={selectedImages}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      keyExtractor={(_, index) => index.toString()}
      initialScrollIndex={startIndex}
      getItemLayout={(data, index) => ({
        length: width,
        offset: width * index,
        index,
      })}
      renderItem={({ item }) => (
        <Image source={{ uri: item }} style={styles.fullImage} />
      )}
    />

    <TouchableOpacity
      style={styles.closeBtn}
      onPress={() => setViewerVisible(false)}
    >
      <Ionicons name="close" size={30} color="#fff" />
    </TouchableOpacity>
  </View>
</Modal>
    </SafeAreaView>
  );
}
    

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f4f0" },

  // Header
  appHeader: {
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  appHeaderSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  appHeaderTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "500",
    marginTop: 2,
    letterSpacing: -0.5,
  },
  appHeaderRight: { flexDirection: "row", alignItems: "center" },
  notifDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    backgroundColor: "#e8623a",
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#1a1a2e",
  },
  userChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#e8623a",
    alignItems: "center",
    justifyContent: "center",
  },
  userChipText: { color: "#fff", fontSize: 13, fontWeight: "500" },

  // Feed
  feed: { flex: 1, paddingTop: 4 },

  // Card
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.07)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingBottom: 10,
    gap: 10,
  },
  avatar: {
    backgroundColor: "#c084fc",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 15, fontWeight: "500" },
  onlineDot: {
    position: "absolute",
    width: 13,
    height: 13,
    backgroundColor: "#22c55e",
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#fff",
  },
  cardHeaderInfo: { flex: 1 },
  posterName: { fontSize: 15, fontWeight: "600", color: "#111" },
  posterMeta: { fontSize: 11, color: "#888", marginTop: 2, fontFamily: "monospace" },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },

  // Content
  cardContent: { paddingHorizontal: 16, paddingBottom: 12 },
  postTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111",
    lineHeight: 24,
    marginBottom: 8,
  },
  postBody: { fontSize: 14, color: "#444", lineHeight: 22 },

  // Doc
  docCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: "#f0ede8",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  docIcon: {
    width: 40,
    height: 48,
    backgroundColor: "#e8623a",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  docInfo: { flex: 1 },
  docName: { fontSize: 13, fontWeight: "600", color: "#111" },
  docMeta: { fontSize: 11, color: "#888", marginTop: 2 },
  docDownload: {
    width: 30,
    height: 30,
    backgroundColor: "#fff",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.1)",
  },
  thumbStrip: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  thumb: {
    flex: 1,
    height: 70,
    backgroundColor: "#ddd8d0",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbMore: { backgroundColor: "#1a1a2e" },
  thumbMoreText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "monospace",
  },

  // Progress
  progressWrap: { paddingHorizontal: 16, paddingBottom: 14 },
  progressMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: { fontSize: 12, color: "#888" },
  progressPct: { fontSize: 12, fontWeight: "600" },
  progressTrack: {
    height: 6,
    backgroundColor: "#f0ede8",
    borderRadius: 99,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#22c55e",
    borderRadius: 99,
  },
  progressAmount: { fontSize: 13, fontWeight: "600", color: "#111" },

  // Footer
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#f0ede8",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  footerReaction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: 4,
  },
  footerCount: { fontSize: 12, color: "#888" },
  fundBtn: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  fundBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.3,
  },

  // Bottom Tab Bar
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 20,
    paddingTop: 10,
  },
  tabItem: { alignItems: "center", gap: 3 },
  tabLabel: { fontSize: 9, letterSpacing: 0.5, fontFamily: "monospace" },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#e8623a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#e8623a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  viewer: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "#000",
  justifyContent: "center",
},

fullImage: {
  width: width,
  height: "100%",
  resizeMode: "contain",
},

closeBtn: {
  position: "absolute",
  top: 50,
  right: 20,
},
thumbWrapper: {
  flex: 1,
  height: 80,
  borderRadius: 10,
  overflow: "hidden",
},

thumbImage: {
  width: "100%",
  height: "100%",
},

overlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  alignItems: "center",
  justifyContent: "center",
},

overlayText: {
  color: "#fff",
  fontSize: 18,
  fontWeight: "bold",
},
});