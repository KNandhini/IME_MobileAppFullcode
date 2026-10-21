import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
/**
 * LawBotScreen.js
 * IME Law Bot — Municipal Law & Bylaws AI Assistant
 * Place this file in: src/screens/LawBotScreen.js
 *
 * Sample questions are fetched from GET /api/lawbot/documents so the UI
 * always reflects whatever documents are currently registered in
 * LawBotService.cs — no need to hardcode/update questions here when a
 * new PDF is added on the backend.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { LawBotScreenStyles as styles } from './screenStyles';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Fallback groups, used only if GET /lawbot/documents fails ──
// (e.g. no connection on first load) so the screen still shows something.
const FALLBACK_SUGGESTION_GROUPS = [
  {
    docKey: '74amend',
    docLabel: '📜 74th Amendment',
    questions: [
      'What is the 74th Amendment?',
      'What are the 3 types of municipalities?',
      'What is the 12th Schedule?',
    ],
  },
  {
    docKey: 'iuei_bylaw',
    docLabel: '⚖️ IUEI Bylaws',
    questions: [
      'What is the admission fee for members?',
      'Who can vote in the General Body?',
      'How is a member removed?',
    ],
  },
];

// Icon per known docKey — unmapped/new docKeys fall back to a generic icon.
const DOC_ICONS = {
  '74amend': '📜',
  iuei_bylaw: '⚖️',
};

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
          <Text style={styles.bubbleSender}>IUE Law Assistant</Text>
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
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([
    {
      id: '0',
      sender: 'bot',
      text:
        'Hello! I am the IME Law Assistant 🏛️\n\n' +
        'I can answer your questions about:\n' +
        '• The 74th Constitutional Amendment Act, 1992 (Articles 243-P to 243-ZG, the 12th Schedule)\n' +
        '• The Bylaws of Institution of Urban Engineers, India (IUEI) — membership, governance, elections, and funds\n\n' +
        'Ask me anything about either document!',
      time: formatNow(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [suggestionGroups, setSuggestionGroups] = useState(FALLBACK_SUGGESTION_GROUPS);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  const flatListRef = useRef(null);
  const idCounter = useRef(1);

  const nextId = () => String(idCounter.current++);

  // ── Fetch the live document list + sample questions once on mount ──
  useEffect(() => {
    let active = true;

    api.get('/lawbot/documents')
      .then((res) => {
        if (!active) return;
        const groups = (res.data || [])
          .filter((doc) => doc?.sampleQuestions?.length > 0)
          .map((doc) => ({
            docKey: doc.key,
            docLabel: `${DOC_ICONS[doc.key] || '📄'} ${doc.displayName}`,
            questions: doc.sampleQuestions,
          }));
        if (groups.length > 0) setSuggestionGroups(groups);
      })
      .catch((err) => {
        console.warn('Could not load LawBot documents, using fallback list:', err?.message);
        // Keep FALLBACK_SUGGESTION_GROUPS — no need to surface an error to the user for this.
      })
      .finally(() => {
        if (active) setSuggestionsLoading(false);
      });

    return () => { active = false; };
  }, []);

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
    const q = (question || inputText).trim();
    if (!q || loading) return;

    setInputText('');
    setShowSuggestions(false);
    addMessage('user', q);
    setLoading(true);

    try {
      const response = await api.post('/lawbot/ask', { question: q });
      const data = response.data;

      if (data?.success && data?.answer) {
        addMessage('bot', data.answer);
      } else {
        addMessage('error', data?.message || 'No answer returned. Please try again.');
      }
    } catch (err) {
      console.error('LawBot error:', err);
      addMessage('error', err.friendlyMessage || 'Could not reach the server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [inputText, loading, addMessage]);

  const renderMessage = useCallback(({ item }) => (
    <MessageBubble item={item} />
  ), []);

  const renderSuggestionChip = useCallback((question) => (
    <TouchableOpacity
      key={question}
      style={styles.suggChip}
      onPress={() => sendQuestion(question)}
      activeOpacity={0.75}
    >
      <Text style={styles.suggText}>{question}</Text>
    </TouchableOpacity>
  ), [sendQuestion]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        backgroundColor={COLORS.headerStart}
        barStyle="light-content"
        translucent={false}
      />

      <GradientHeader style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>⚖</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>IME Law Assistant</Text>
          <Text style={styles.headerSub}>74th Amendment & IUEI Bylaws</Text>
        </View>
        <View style={styles.liveTag}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>AI</Text>
        </View>
      </GradientHeader>

      {/* ── Typing indicator + Suggestions + Input bar ──
          All grouped inside one KeyboardAvoidingView so they move
          together above the keyboard, always in this stacked order:
          typing indicator → suggestions (quick questions) → input bar. */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Messages ── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          style={{ flex: 1 }}
        />
        {/* ── Typing indicator ── */}
        {loading && (
          <View style={styles.typingRow}>
            <View style={styles.botAvatar}>
              <Text style={styles.botAvatarText}>⚖</Text>
            </View>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color={COLORS.accent} />
              <Text style={styles.typingText}>Searching the law book…</Text>
            </View>
          </View>
        )}

        {/* ── Suggestions — one row per source document ── */}
        {showSuggestions && (
          <View style={styles.suggWrap}>
            {suggestionsLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                <ActivityIndicator size="small" color={COLORS.accent} />
                <Text style={[styles.suggLabel, { marginLeft: 8, marginBottom: 0 }]}>
                  Loading quick questions…
                </Text>
              </View>
            ) : (
              suggestionGroups.map((group) => (
                <View key={group.docKey} style={{ marginBottom: 8 }}>
                  <Text style={styles.suggLabel}>{group.docLabel}</Text>
                  <FlatList
                    data={group.questions}
                    keyExtractor={item => item}
                    renderItem={({ item }) => renderSuggestionChip(item)}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.suggList}
                  />
                </View>
              ))
            )}
          </View>
        )}

        {/* ── Input bar ── */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) + 8 }]}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about the 74th Amendment or IUEI Bylaws…"
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
              ? <ActivityIndicator size="small" color={COLORS.white} />
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

export default LawBotScreen;