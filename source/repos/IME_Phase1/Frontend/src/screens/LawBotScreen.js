/**
 * LawBotScreen.js
 * IME Law Bot — 74th Constitutional Amendment AI Assistant
 * Place this file in: src/screens/LawBotScreen.js
 */

import React, { useState, useRef, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { LawBotScreenStyles as styles } from './screenStyles';

// ── Suggested quick questions ──────────────────────────────────
const SUGGESTIONS = [
  'What is the 74th Amendment?',
  'What are the 3 types of municipalities?',
  'What is the 12th Schedule?',
  'Reservation of seats for women?',
  'What is Ward Committee?',
  'Duration of municipalities?',
  'What is State Finance Commission?',
  'Metropolitan Planning Committee?',
];

// ── Single message bubble ──────────────────────────────────────
const MessageBubble = React.memo(({ item }) => {
  const isBot = item.sender === 'bot';
  const isErr = item.sender === 'error';

  return (
    <View style={[styles.msgRow, isBot || isErr ? styles.msgRowBot : styles.msgRowUser]}>
      {(isBot || isErr) && (
        <View style={[styles.botAvatar, isErr && styles.botAvatarErr]}>
          <Text style={styles.botAvatarText}>{isErr ? '⚠' : '⚖'}</Text>
        </View>
      )}
      <View style={[
        styles.bubble,
        isBot   ? styles.bubbleBot  : null,
        !isBot && !isErr ? styles.bubbleUser : null,
        isErr   ? styles.bubbleErr  : null,
      ]}>
        {isBot && (
          <Text style={styles.bubbleSender}>IME Law Assistant</Text>
        )}
        <Text style={[
          styles.bubbleText,
          isBot ? styles.bubbleTextBot : styles.bubbleTextUser,
          isErr ? styles.bubbleTextErr : null,
        ]}>
          {item.text}
        </Text>
        <Text style={[styles.timeText, isBot ? styles.timeBot : styles.timeUser]}>
          {item.time}
        </Text>
      </View>
    </View>
  );
});

// ── Main Screen ────────────────────────────────────────────────
const LawBotScreen = ({ navigation }) => {
  const { user } = useAuth();

  const [messages,  setMessages]  = useState([
    {
      id: '0',
      sender: 'bot',
      text:
        'Hello! I am the IME Law Assistant 🏛️\n\n' +
        'I can answer your questions about the 74th Constitutional Amendment Act, 1992 — ' +
        'including all articles from 243-P to 243-ZG, the 12th Schedule, and how they ' +
        'apply to Municipal Engineers.\n\n' +
        'Ask me anything about municipal governance law!',
      time: formatNow(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const flatListRef = useRef(null);
  const idCounter   = useRef(1);

  const nextId = () => String(idCounter.current++);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const addMessage = useCallback((sender, text) => {
    setMessages(prev => [
      ...prev,
      { id: nextId(), sender, text, time: formatNow() },
    ]);
    scrollToBottom();
  }, []);

  const sendQuestion = useCallback(async (question) => {
    debugger;
    const q = (question || inputText).trim();
    if (!q || loading) return;

    setInputText('');
    setShowSuggestions(false);
    addMessage('user', q);
    setLoading(true);

    try {
        debugger;
      const response = await api.post('/lawbot/ask', { question: q });
      debugger;
      const data = response.data;

      if (data?.success && data?.answer) {
        addMessage('bot', data.answer);
      } else {
        addMessage('error', data?.message || 'No answer returned. Please try again.');
      }
    } catch (err) {
      console.error('LawBot error:', err);
      addMessage('error', 'Could not reach the server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [inputText, loading, addMessage]);

  const renderMessage = useCallback(({ item }) => (
    <MessageBubble item={item} />
  ), []);

  const renderSuggestion = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.suggChip}
      onPress={() => sendQuestion(item)}
      activeOpacity={0.75}
    >
      <Text style={styles.suggText}>{item}</Text>
    </TouchableOpacity>
  ), [sendQuestion]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#1E3A5F" barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>⚖</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>IME Law Assistant</Text>
          <Text style={styles.headerSub}>74th Constitutional Amendment</Text>
        </View>
        <View style={styles.liveTag}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>AI</Text>
        </View>
      </View>

      {/* ── Messages ── */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
      />

      {/* ── Typing indicator ── */}
      {loading && (
        <View style={styles.typingRow}>
          <View style={styles.botAvatar}>
            <Text style={styles.botAvatarText}>⚖</Text>
          </View>
          <View style={styles.typingBubble}>
            <ActivityIndicator size="small" color="#1E3A5F" />
            <Text style={styles.typingText}>Searching the law book…</Text>
          </View>
        </View>
      )}

      {/* ── Suggestions ── */}
      {showSuggestions && (
        <View style={styles.suggWrap}>
          <Text style={styles.suggLabel}>💡 Quick Questions</Text>
          <FlatList
            data={SUGGESTIONS}
            keyExtractor={item => item}
            renderItem={renderSuggestion}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggList}
          />
        </View>
      )}

      {/* ── Input bar ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about the 74th Amendment…"
            placeholderTextColor="#aaa"
            multiline
            maxLength={500}
            returnKeyType="default"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendQuestion()}
            disabled={!inputText.trim() || loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.sendIcon}>➤</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

function formatNow() {
  return new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

const NAVY  = '#1E3A5F';
const GOLD  = '#D4A017';
const BG    = '#F0F2F5';
const WHITE = '#ffffff';



export default LawBotScreen;