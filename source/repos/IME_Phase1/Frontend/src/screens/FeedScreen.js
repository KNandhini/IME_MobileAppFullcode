import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Pressable, SafeAreaView, StatusBar, Image, Dimensions, FlatList, ActivityIndicator, Modal, Animated, Alert, Platform } from 'react-native';
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons,MaterialCommunityIcons  } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { fundraiseService } from "../services/fundraiseService";
import api from "../utils/api";
import { FeedScreenS as s, FeedScreenAv as av, FeedScreenPb as pb, FeedScreenMs as ms, FeedScreenCard as card, FeedScreenVw as vw } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';
//const API_BASE_URL = "https://prasath-001-site1.ftempurl.com/api";
//const API_BASE_URL = "http://10.0.2.2:51150/api";
const API_BASE_URL = "https://imei.co.in/api";
const { width }    = Dimensions.get("window");
const CARD_WIDTH   = width - 28;


const API_BASE = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

const toPublicUrl = (filePath) => {
  if (!filePath) return null;

  if (filePath.startsWith("http")) return filePath;

  const idx = filePath.indexOf("Uploads\\");
  if (idx === -1) return filePath;

  const relative = filePath.substring(idx).replace(/\\/g, "/");

  return `${API_BASE}/${relative}`;
};
// ─── Helpers ──────────────────────────────────────────────────────────────────
// ─── Helpers ──────────────────────────────────────────────────────────────────
function getBadgeStyle(urgencyLevel, fundCategory) {
  if (urgencyLevel === "Critical" || urgencyLevel === "High")
    return { badgeColor: "#e8623a", badgeBg: "#fef3ed", fundColor: "#A0C878" };
  if (fundCategory === "Education")
    return { badgeColor: "#A0C878", badgeBg: "#f0f9f0", fundColor: "#A0C878" };
  if (fundCategory === "Medical")
    return { badgeColor: "#e8623a", badgeBg: "#fef3ed", fundColor: "#A0C878" };
  return { badgeColor: COLORS.accent, badgeBg: "#eef2ff", fundColor: COLORS.accent };
}
function formatTimeAgo(dateString) {
  if (!dateString) return "";

  // Treat server date as UTC
  const utcDate = new Date(
    dateString.endsWith("Z")
      ? dateString
      : dateString.replace(" ", "T") + "Z"
  );

  const diffMs = Date.now() - utcDate.getTime();

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}
function isImagePath(p = "") {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(p);
}

/** Windows backslash path → forward slash for API ?path= param */
/*const toApiPath = (storedPath) =>
  (storedPath || "").replace(/\\/g, "/");*/
const toApiPath = (storedPath) => {
    if (!storedPath) return "";

    let path = storedPath;

    // remove server url if present
    path = path.replace(/^https?:\/\/[^/]+\//, "");

    // normalize backslashes to forward slashes
    path = path.replace(/\\/g, "/");

    // the file endpoint's ?path= is relative to the Uploads root on the
    // server, so strip a leading "Uploads/" segment if present
    path = path.replace(/^Uploads\//i, "");

    return path;
};
/**
 * Parse a comma-separated DB string of paths into an array of media items.
 * Each item: { type: 'image'|'doc', path: string, name: string }
 * "path" is the raw server path passed to AuthImage / doc download.
 *
 * `defaultType` is trusted as the source-of-truth when a path doesn't look
 * like a known image extension — since we already know WHICH db column
 * (beneficiaryPhotoUrl vs supportingDocumentUrl) this path came from, we
 * don't need to re-guess it purely from the extension.
 */
function parseMediaPaths(raw, defaultType = "image") {
  if (!raw) return [];
  return raw
    .split(",")
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => ({
      type: isImagePath(p) ? "image" : defaultType,
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
    const token = await AsyncStorage.getItem("authToken");
    const apiPath = toApiPath(storedPath);
    const url = `${API_BASE_URL}/Fundraise/file?path=${encodeURIComponent(apiPath)}`;

    const res = await fetch(url, {
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);

    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result); // "data:image/png;base64,..."
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("fetchAuthDataUri failed:", storedPath, "| url:", `${API_BASE_URL}/Fundraise/file?path=${encodeURIComponent(toApiPath(storedPath))}`, "| error:", e.message);
    return null;
  }
}

// ─── AuthImage ────────────────────────────────────────────────────────────────
/** Renders a single server image fetched with the auth token. */
function AuthImage({ path, style, resizeMode = "cover" }) {
  const [uri, setUri] = useState(null);
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
        <ActivityIndicator size="small" color={COLORS.accent} />
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
  const pct = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

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
 * Docs   → download button, fetches GET /api/Fundraise/file?path={item.path}
 *          (the only file route that actually exists on the backend).
 */
function MediaStrip({ mediaItems, onOpenViewer }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!mediaItems || mediaItems.length === 0) return null;

  const handleScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
    setActiveIndex(idx);
  };

  const [downloadingPath, setDownloadingPath] = useState(null);

  // Downloads the document by its exact stored path, via the backend's
  // single-file endpoint: GET /api/Fundraise/file?path=<path>
  // then saves it to device storage so it's visible in the file manager.
  //
  // Android: prompts the user to pick a folder (Storage Access Framework) —
  //          picking "Downloads" puts the file exactly where a normal
  //          downloaded file would appear.
  // iOS:     there is no app-accessible "Downloads" folder on iOS, so we
  //          open the native Share sheet, where the user taps "Save to Files"
  //          and can choose Downloads / On My iPhone / iCloud Drive etc.
  const handleDocOpen = async (item) => {
    if (downloadingPath) return; // ignore taps while a download is already in progress
    setDownloadingPath(item.path);
    try {
      const token = await AsyncStorage.getItem("authToken");
      const apiPath = toApiPath(item.path);
      const url = `${API_BASE_URL}/Fundraise/file?path=${encodeURIComponent(apiPath)}`;
      const fileName = item.name || "document.pdf";

      // 1. Download to a temporary local file in the app's own sandbox.
      //    This part needs no special permission on either platform.
      const tempUri = FileSystem.cacheDirectory + fileName;
      const downloadResult = await FileSystem.downloadAsync(url, tempUri, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      if (downloadResult.status !== 200) {
        Alert.alert("Error", `Server returned ${downloadResult.status}`);
        return;
      }

      if (Platform.OS === "android") {
        // 2a. Android — ask permission to write into a folder the user picks
        //     (Storage Access Framework). The system folder picker lets them
        //     choose "Download", which is exactly what was asked for.
        const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            "Permission needed",
            "Storage permission is required to save the document. The file is downloaded but not yet saved — please try again and allow access."
          );
          return;
        }

        const fileContent = await FileSystem.readAsStringAsync(tempUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
          perm.directoryUri,
          fileName.replace(/\.[^/.]+$/, ""), // file name without extension
          "application/pdf"
        );
        await FileSystem.writeAsStringAsync(destUri, fileContent, {
          encoding: FileSystem.EncodingType.Base64,
        });

        Alert.alert("Saved", `"${fileName}" was saved to the folder you selected.`);
      } else {
        // 2b. iOS — no programmatic Downloads folder; let the user save it
        //     themselves via the share sheet ("Save to Files" → Downloads).
        const canShare = await Sharing.isAvailableAsync();
        if (!canShare) {
          Alert.alert("Saved", `"${fileName}" was downloaded, but sharing isn't available on this device.`);
          return;
        }
        await Sharing.shareAsync(tempUri, {
          mimeType: "application/pdf",
          dialogTitle: `Save "${fileName}"`,
        });
      }
    } catch (e) {
      Alert.alert('Error', getSafeErrorMessage(e));
    } finally {
      setDownloadingPath(null);
    }
  };

  return (
    <View style={ms.container}>
      <FlatList
        data={mediaItems}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        snapToInterval={CARD_WIDTH}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        onScroll={handleScroll}
        scrollEventThrottle={16}
        nestedScrollEnabled
        directionalLockEnabled
        getItemLayout={(_, i) => ({ length: CARD_WIDTH, offset: CARD_WIDTH * i, index: i })}
        renderItem={({ item, index }) => {
          if (item.type === "image") {
            return (
              <Pressable
                style={[ms.tile, { width: CARD_WIDTH }]}
                onPress={() => {
                  // Pass only image items to the viewer
                  const imgItems = mediaItems.filter(m => m.type === "image");
                  const imgIdx = imgItems.findIndex(m => m.path === item.path);
                  onOpenViewer(imgItems, Math.max(imgIdx, 0));
                }}
              >
                {/*<AuthImage path={item.path} style={ms.img} resizeMode="cover" />*/}
                <Image
    source={{ uri: item.path }}
    style={ms.img}
    resizeMode="cover"
/>
                <View style={ms.expandHint}>
                  <Ionicons name="expand-outline" size={16} color={COLORS.white} />
                </View>
                {/* Slide counter badge */}
                {mediaItems.length > 1 && (
                  <View style={ms.counterBadge}>
                    <Text style={ms.counterText}>{index + 1}/{mediaItems.length}</Text>
                  </View>
                )}
              </Pressable>
            );
          }

          // Document tile
          const isPdf = /\.pdf(\?.*)?$/i.test(item.path);
          return (
            <View style={[ms.tile, ms.docTile, { width: CARD_WIDTH }]}>
              {/* Slide counter badge for doc tiles too */}
              {mediaItems.length > 1 && (
                <View style={ms.counterBadge}>
                  <Text style={ms.counterText}>{index + 1}/{mediaItems.length}</Text>
                </View>
              )}
              <View style={ms.docIconCircle}>
                <Ionicons
                  name={isPdf ? "document-text" : "document-attach"}
                  size={36}
                  color={COLORS.white}
                />
              </View>
              <Text style={ms.docLabel}>Supporting Document</Text>
              <Text style={ms.docFileName} numberOfLines={2}>{item.name}</Text>
              <TouchableOpacity
                style={[ms.docDownloadBtn, downloadingPath === item.path && { opacity: 0.6 }]}
                onPress={() => handleDocOpen(item)}
                activeOpacity={0.8}
                disabled={downloadingPath === item.path}
              >
                {downloadingPath === item.path ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Ionicons name="download-outline" size={16} color={COLORS.white} />
                )}
                <Text style={ms.docDownloadText}>
                  {downloadingPath === item.path ? "Saving…" : "Download"}
                </Text>
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
 * Binds image + document directly from the post object returned by
 * fundraiseService.getAll() — post.beneficiaryPhotoUrl and
 * post.supportingDocumentUrl are comma-separated path strings already
 * present on every Fundraise record from GET /api/Fundraise.
 *
 * There is NO separate "get all files by fundraiseId" endpoint on the
 * backend (confirmed against FundraiseController.cs — the only file route
 * is GET /api/Fundraise/file?path=... which downloads ONE file by its exact
 * path). So we don't call any extra API here — we just parse what getAll
 * already gave us. The actual file download-by-path happens later, only
 * when the user taps "Download" on a document tile (see handleDocOpen in
 * MediaStrip) or opens an image (see AuthImage / fetchAuthDataUri).
 */
function useAttachments(post) {
  const [mediaItems, setMediaItems] = useState([]);
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
              //path: String(rawPath),
              path: isImagePath(rawPath)
    ? toPublicUrl(rawPath)
    : rawPath,
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
       // ...parseMediaPaths(post.beneficiaryPhotoUrl,   "image"),
       
  ...parseMediaPaths(post.beneficiaryPhotoUrl, "image").map(x => ({
    ...x,
    path: toPublicUrl(x.path),
  })),
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
{/*function ImageViewer({ visible, imageItems, startIndex, onClose }) {
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
                  <ActivityIndicator size="large" color={COLORS.white} />
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
            <Ionicons name="close" size={22} color={COLORS.white} />
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}*/}
function ImageViewer({
    visible,
    imageItems,
    startIndex,
    onClose,
}) {

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={vw.root}>

                <FlatList
                    data={imageItems}
                    horizontal
                    pagingEnabled
                    initialScrollIndex={startIndex}
                    keyExtractor={(item, i) => i.toString()}
                    getItemLayout={(data, index) => ({
                        length: width,
                        offset: width * index,
                        index,
                    })}
                    renderItem={({ item }) => (

                        <View style={vw.imgWrap}>
                            <Image
                                source={{ uri: item.path }}
                                style={vw.img}
                                resizeMode="contain"
                            />
                        </View>

                    )}
                />

                <TouchableOpacity
                    style={vw.close}
                    onPress={onClose}
                >
                    <View style={vw.closeCircle}>
                        <Ionicons
                            name="close"
                            size={28}
                            color={COLORS.white}
                        />
                    </View>
                </TouchableOpacity>

            </View>
        </Modal>
    );
}
// ─── Post Card ────────────────────────────────────────────────────────────────
// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, onOpenViewer, navigation }) {
  const [liked, setLiked] = useState(false);
  const { badgeColor, badgeBg, fundColor } = getBadgeStyle(post.urgencyLevel, post.fundCategory);
  const { mediaItems, loadingMedia } = useAttachments(post);

  const initials = (post.fullName || "??")
    .split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();

  const badgeLabel = post.urgencyLevel?.toUpperCase() || post.fundCategory?.toUpperCase() || "";

  return (
    <View style={card.root}>

      {/* Header */}
      <View style={card.header}>
        <Avatar initials={initials} active={post.status === "Active"} />
        <View style={card.headerInfo}>
          <Text style={card.name}>{post.fullName}</Text>
          <Text style={card.meta}>{post.place} · {formatTimeAgo(post.createdDate)}</Text>
        </View>
        {!!badgeLabel && (
          <View style={[card.badge, { backgroundColor: badgeBg }]}>
            <Text style={[card.badgeText, { color: badgeColor }]}>
              {badgeLabel}
            </Text>
          </View>
        )}
      </View>

      {/* Title + description */}
      <View style={card.body}>
        <Text style={card.title}>{post.fundTitle}</Text>
        <Text style={card.desc} numberOfLines={3}>{post.description}</Text>
      </View>

      {/* Media strip */}
      {loadingMedia ? (
        <View style={card.mediaLoader}>
          <ActivityIndicator size="small" color={COLORS.accent} />
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
            color={liked ? COLORS.accent : "#bbb"}
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
                id: post.id,
                title: post.fundTitle,
                body: post.description,
                raised: post.collectedAmount ?? 0,
                goal: post.targetAmount ?? 0,
                badge: badgeLabel,
                contactNumber: post.contactNumber,
                bankName: post.bankName,
                accountNumber: post.accountNumber,
                ifsc: post.ifsc,
                upiId: post.upiId,
                fullName: post.fullName,
                badgeColor,
                badgeBg,
                minimumAmount: post.minimumAmount ?? 1,
              },
            })
          }
        >
          <Ionicons name="heart" size={14} color={COLORS.white} />
          <Text style={card.fundBtnText}>Raise Fund</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
//export default function FeedScreen({ navigation }) {
export default function FeedScreen({ navigation }) {
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.headerStart}
      />

      <View
  style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#F0F4FA',
  }}
>
  <MaterialCommunityIcons
    name="hand-heart-outline"
    size={70}
    color="#2E86DE"
  />

  <Text
    style={{
      fontSize: 24,
      fontWeight: '700',
      color: COLORS.dark,
      marginTop: 20,
      textAlign: 'center',
    }}
  >
    Under Development
  </Text>

  <Text
    style={{
      fontSize: 16,
      color: '#666',
      marginTop: 10,
      textAlign: 'center',
      lineHeight: 24,
    }}
  >
    Fund Support is currently under development.
    {'\n'}
    Please check back later.
  </Text>
</View>
    </SafeAreaView>
  );

  // Existing FundScreen code remains below.
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewerVis, setViewerVis] = useState(false);
  const [selItems, setSelItems] = useState([]);   // imageItems array
  const [selIdx, setSelIdx] = useState(0);

  const fetchFundraisers = async () => {
    try {
      setLoading(true); setError(null);
      const res = await fundraiseService.getAll();
      if (Array.isArray(res)) setPosts(res);
      else if (res?.success) setPosts(res.data || []);
      else if (Array.isArray(res?.data)) setPosts(res.data);
      else setError(getSafeErrorMessage(res));
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
        <ActivityIndicator size="large" color={COLORS.accent} />
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerStart} />

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









