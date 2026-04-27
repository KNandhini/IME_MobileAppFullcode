import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';

const POLL_INTERVAL_MS = 3000;

const ChatScreen = ({ navigation, route }) => {
  const { conversationId, otherMemberName } = route.params || {};
  const { user } = useAuth();

  const [messages,    setMessages]    = useState([]);
  const [inputText,   setInputText]   = useState('');
  const [sending,     setSending]     = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const flatListRef  = useRef(null);
  const pollTimerRef = useRef(null);
  const latestIdRef  = useRef(0);
  const isMounted    = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadMessages(true);

    pollTimerRef.current = setInterval(pollNewMessages, POLL_INTERVAL_MS);

    return () => {
      isMounted.current = false;
      clearInterval(pollTimerRef.current);
    };
  }, [conversationId]);

  const loadMessages = async (isInitial = false) => {
    try {
      const res = await chatService.getMessages(conversationId, 1, 100);
      if (!isMounted.current) return;
      if (res.success && Array.isArray(res.data)) {
        setMessages(res.data);
        if (res.data.length > 0) {
          latestIdRef.current = res.data[res.data.length - 1].messageId;
        }
        if (isInitial) {
          setTimeout(() => scrollToBottom(), 100);
        }
      }
    } finally {
      if (isMounted.current) setInitialLoad(false);
    }
  };

  const pollNewMessages = async () => {
    try {
      const res = await chatService.getMessages(conversationId, 1, 100);
      if (!isMounted.current) return;
      if (res.success && Array.isArray(res.data)) {
        const newMsgs = res.data.filter(m => m.messageId > latestIdRef.current);
        if (newMsgs.length > 0) {
          setMessages(res.data);
          latestIdRef.current = res.data[res.data.length - 1].messageId;
          scrollToBottom();
        }
      }
    } catch (_) { /* silent */ }
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setInputText('');
    setSending(true);

    const clientTime = new Date().toISOString();

    // Optimistic update with client local time
    const tempId = Date.now() * -1;
    const optimistic = {
      messageId:      tempId,
      conversationId,
      senderId:       user?.memberId ?? 0,
      senderName:     user?.fullName ?? 'Me',
      messageText:    text,
      sentDate:       clientTime,
      isRead:         false,
      isOwn:          true,
    };
    setMessages(prev => [...prev, optimistic]);
    setTimeout(() => scrollToBottom(), 50);

    try {
      const res = await chatService.sendMessage(conversationId, text, clientTime);
      if (res.success) {
        // Replace optimistic message with real one
        setMessages(prev =>
          prev.map(m =>
            m.messageId === tempId
              ? { ...m, messageId: res.data?.messageId ?? tempId, sentDate: res.data?.sentDate ?? m.sentDate }
              : m
          )
        );
        latestIdRef.current = res.data?.messageId ?? latestIdRef.current;
      } else {
        // Remove failed optimistic message
        setMessages(prev => prev.filter(m => m.messageId !== tempId));
      }
    } catch (_) {
      setMessages(prev => prev.filter(m => m.messageId !== tempId));
    } finally {
      setSending(false);
    }
  };

  const renderMessage = useCallback(({ item }) => {
    const isOwn    = item.isOwn;
    const timeText = formatTime(item.sentDate);

    return (
      <View style={[styles.msgRow, isOwn ? styles.msgRowOwn : styles.msgRowOther]}>
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isOwn ? styles.bubbleTextOwn : styles.bubbleTextOther]}>
            {item.messageText}
          </Text>
          <Text style={[styles.timeText, isOwn ? styles.timeOwn : styles.timeOther]}>
            {timeText}
          </Text>
        </View>
      </View>
    );
  }, []);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z'));
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1E3A5F" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarLetter}>
            {(otherMemberName || 'M').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherMemberName || 'Chat'}</Text>
        </View>
      </View>

      {/* Messages */}
      {initialLoad ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1E3A5F" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.messageId)}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Say hello! 👋</Text>
            </View>
          }
        />
      )}

      {/* Input bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message…"
            placeholderTextColor="#aaa"
            multiline
            maxLength={2000}
            returnKeyType="default"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.8}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.sendIcon}>➤</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },

  // Header
  header: {
    backgroundColor: '#1E3A5F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 44,
    paddingBottom: 10,
    paddingHorizontal: 14,
  },
  backBtn:   { padding: 6, marginRight: 6 },
  backIcon:  { fontSize: 22, color: '#fff', fontWeight: '700' },
  headerAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#D4A017',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 10,
  },
  headerAvatarLetter: { color: '#1E3A5F', fontSize: 16, fontWeight: '800' },
  headerInfo: { flex: 1 },
  headerName: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Messages
  centerBox:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageList: { padding: 12, paddingBottom: 8 },

  msgRow:      { flexDirection: 'row', marginBottom: 6 },
  msgRowOwn:   { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },

  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  bubbleOwn:   { backgroundColor: '#1E3A5F', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#fff',    borderBottomLeftRadius: 4  },

  bubbleText:       { fontSize: 15, lineHeight: 21 },
  bubbleTextOwn:    { color: '#fff' },
  bubbleTextOther:  { color: '#1a1a1a' },

  timeText:   { fontSize: 10, marginTop: 3 },
  timeOwn:    { color: 'rgba(255,255,255,0.55)', textAlign: 'right' },
  timeOther:  { color: '#aaa', textAlign: 'left' },

  // Empty
  emptyWrap: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 15, color: '#aaa' },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
    maxHeight: 120,
    marginRight: 8,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1E3A5F',
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#B0BEC5' },
  sendIcon: { color: '#fff', fontSize: 18, marginLeft: 2 },
});

export default ChatScreen;
