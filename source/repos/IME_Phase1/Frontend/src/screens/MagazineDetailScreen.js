import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, ActivityIndicator, Modal, Alert, Platform, TextInput, KeyboardAvoidingView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { magazineService } from '../services/magazineService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import api from '../utils/api';
import { MagazineDetailScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';
const NAVY = '#1E3A5F';
const GOLD = '#D4A017';

const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
// filePath from the server is a raw disk path like "Uploads\magazines\xyz.jpg" —
// convert it into a URL the app can actually load/display/download.
const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const idx = filePath.indexOf('Uploads\\');
  if (idx === -1) return filePath;
  const relative = filePath.substring(idx).replace(/\\/g, '/');
  return `${API_BASE}/${relative}`;
};

const MagazineDetailScreen = ({ route, navigation }) => {
  const { item } = route.params || {};
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  // ---------- Forum Discussion state ----------
  const [discussions, setDiscussions] = useState([]);
  const [discussionLoading, setDiscussionLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [currentMember, setCurrentMember] = useState({ memberId: null, memberName: "" });
  const scrollRef = useRef(null);

  useEffect(() => {
    loadAttachments();
    loadCurrentMember();
    loadDiscussion();
  }, []);

  const loadAttachments = async () => {
    try {
      const res = await magazineService.getAttachments(item.magazineId);
      if (res?.success) setAttachments(res.data ?? []);
    } catch (e) {
      console.warn('Load attachments error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Pull logged-in member info — adjust keys to whatever you store at login
  const loadCurrentMember = async () => {
  try {
    debugger;
    const userData = await AsyncStorage.getItem("userData");

    if (userData) {
      const user = JSON.parse(userData);
console.log(userData,"user");
      setCurrentMember({
        memberId: user.memberId ?? null,
        memberName: user.fullName ?? "Guest",
      });
    } else {
      setCurrentMember({
        memberId: null,
        memberName: "Guest",
      });
    }
  } catch (e) {
    console.warn("loadCurrentMember error:", e);
  }
};
  // Always re-fetches full history from the server, so it shows
  // everything again whenever you come back to this screen
  const loadDiscussion = async () => {
    try {
      debugger;
      setDiscussionLoading(true);
      const res = await magazineService.getForumDiscussion(item.magazineId);
      if (res?.success) setDiscussions(res.data ?? []);
    } catch (e) {
      console.warn('Load discussion error:', e);
    } finally {
      setDiscussionLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const text = messageText.trim();
    if (!text) return;

    setSending(true);
    try {
        debugger;
      const res = await magazineService.addForumDiscussion({
        magazineId: item.magazineId,
        memberId: currentMember.memberId,
        memberName: currentMember.memberName,
        comment: text,
      });

      if (res?.success && res.data) {
        // append the newly inserted message immediately (no full reload needed)
        setDiscussions((prev) => [...prev, res.data]);
        setMessageText("");
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      } else {
        Alert.alert("Error", "Could not post your message. Try again.");
      }
    } catch (e) {
      Alert.alert('Error', getSafeErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const formatDateTime = (dateVal) => {
    const d = new Date(dateVal);
    const datePart = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timePart = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} • ${timePart}`;
  };

  const dateStr = item.publishedDate
    ? new Date(item.publishedDate).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '';

  const isPdf = (path) => path?.toLowerCase().endsWith('.pdf');
  const isImage = (path) => path?.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i);

  const handleAttachmentDownload = async (attachment) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const fileName = attachment.fileName;
      const url = toPublicUrl(attachment.filePath);
      const tempUri = FileSystem.cacheDirectory + fileName;

      const result = await FileSystem.downloadAsync(url, tempUri, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      if (result.status !== 200) {
        Alert.alert("Error", "Failed to download file.");
        return;
      }

      if (Platform.OS === "android") {
        const permission =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert("Permission Required", "Please allow access to save the file.");
          return;
        }

        const base64 = await FileSystem.readAsStringAsync(tempUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const extension = fileName.split(".").pop()?.toLowerCase();
        let mimeType = "application/octet-stream";
        switch (extension) {
          case "pdf": mimeType = "application/pdf"; break;
          case "jpg":
          case "jpeg": mimeType = "image/jpeg"; break;
          case "png": mimeType = "image/png"; break;
          case "doc": mimeType = "application/msword"; break;
          case "docx":
            mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            break;
          case "xls": mimeType = "application/vnd.ms-excel"; break;
          case "xlsx":
            mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            break;
        }

        const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permission.directoryUri,
          fileName.replace(/\.[^/.]+$/, ""),
          mimeType
        );

        await FileSystem.writeAsStringAsync(destUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        Alert.alert("Success", `${fileName} saved successfully.`);
      } else {
        await Sharing.shareAsync(tempUri);
      }
    } catch (e) {
      Alert.alert('Error', getSafeErrorMessage(e));
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Magazine Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : (StatusBar.currentHeight || 0) + 56}
      >
        <ScrollView contentContainerStyle={styles.body} ref={scrollRef}>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>📖 Magazine</Text>
          </View>

          <Text style={styles.title}>{item.title}</Text>

          {!!item.issueNumber && (
            <Text style={styles.issue}>{item.issueNumber}</Text>
          )}

          <View style={styles.metaRow}>
            {!!item.authorName && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="account-outline" size={16} color="#64748B" />
                <Text style={styles.metaText}>{item.authorName}</Text>
              </View>
            )}
            {!!dateStr && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="calendar-outline" size={16} color="#64748B" />
                <Text style={styles.metaText}>{dateStr}</Text>
              </View>
            )}
          </View>

          {!!item.category && (
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}

          {!!item.description && (
            <View style={styles.descBlock}>
              <Text style={styles.descLabel}>DESCRIPTION</Text>
              <Text style={styles.descText}>{item.description}</Text>
            </View>
          )}

          <Text style={styles.attachLabel}>ATTACHMENTS</Text>
          {loading ? (
            <ActivityIndicator color={NAVY} style={{ marginVertical: 20 }} />
          ) : attachments.length === 0 ? (
            <Text style={styles.noAttach}>No files attached.</Text>
          ) : (
            <View style={styles.attachSection}>
              {attachments.map((a) => {
                const url = toPublicUrl(a.filePath);
                return isImage(a.filePath) ? (
                  <TouchableOpacity
                    key={a.attachmentId}
                    onPress={() => {
                      setPreviewImage(url);
                      setPreviewVisible(true);
                    }}
                    activeOpacity={0.85}
                    style={{ marginBottom: 14 }}
                  >
                    <Image source={{ uri: url }} style={styles.attachImage} resizeMode="contain" />
                    <Text style={styles.attachHint}>Tap to enlarge</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    key={a.attachmentId}
                    style={styles.downloadBtn}
                    onPress={() => handleAttachmentDownload(a)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={isPdf(a.filePath) ? "file-pdf-box" : "download-outline"}
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.downloadText} numberOfLines={1}>
                      {a.fileName || 'Download Attachment'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ===================== DISCUSSION FORUM ===================== */}
          <Text style={styles.attachLabel}>DISCUSSION FORUM</Text>

          <View style={styles.discussionBox}>
            {discussionLoading ? (
              <ActivityIndicator color={NAVY} style={{ marginVertical: 20 }} />
            ) : discussions.length === 0 ? (
              <Text style={styles.noAttach}>No discussion yet. Be the first to comment.</Text>
            ) : (
              discussions.map((d) => {
                const isMine = d.memberId === currentMember.memberId;
                return (
                  <View
                    key={d.discussionId}
                    style={[
                      styles.chatBubbleWrap,
                      isMine ? styles.chatBubbleWrapMine : styles.chatBubbleWrapOther,
                    ]}
                  >
                    <View
                      style={[
                        styles.chatBubble,
                        isMine ? styles.chatBubbleMine : styles.chatBubbleOther,
                      ]}
                    >
                      <Text style={styles.chatName}>{d.memberName}</Text>
                      <Text style={styles.chatContent}>{d.comment}</Text>
                      <Text style={styles.chatDate}>{formatDateTime(d.createdDate)}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

        </ScrollView>

        {/* ===================== CHAT INPUT BAR ===================== */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Post your Answer..."
            placeholderTextColor="#94A3B8"
            value={messageText}
            onChangeText={setMessageText}
            multiline
             
            
          />
          <TouchableOpacity
            style={[styles.sendBtn, sending && { opacity: 0.6 }]}
            onPress={handleSendMessage}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={styles.previewContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setPreviewVisible(false)}>
            <MaterialCommunityIcons name="close-circle" size={38} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: previewImage }} style={styles.previewImage} resizeMode="contain" />
        </View>
      </Modal>
    </View>
  );
};



export default MagazineDetailScreen;