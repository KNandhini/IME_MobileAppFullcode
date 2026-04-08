// screens/RaiseFundScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator, SafeAreaView,
  KeyboardAvoidingView, Platform, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RAZORPAY_KEY = 'rzp_test_6pwjCwtwwp3YOu'; // replace with your key

// ─── Razorpay HTML ───────────────────────────────────────────────────────────
function getRazorpayHTML({ amount, userData, post }) {
  const name = (userData?.fullName || '').replace(/'/g, "\\'");
  const email = (userData?.email || '').replace(/'/g, "\\'");
  const phone = (userData?.phoneNumber || '').replace(/'/g, "\\'");

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
    content="default-src * 'unsafe-inline' 'unsafe-eval';
             script-src * 'unsafe-inline' 'unsafe-eval';
             connect-src *; img-src * data: blob:; frame-src *;">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:sans-serif;background:#f5f4f0;min-height:100vh;
         display:flex;align-items:center;justify-content:center;padding:20px}
    .card{background:#fff;border-radius:20px;padding:28px 20px;width:100%;
          max-width:400px;box-shadow:0 4px 24px rgba(0,0,0,.10);text-align:center}
    .title{font-size:20px;font-weight:700;color:#1a1a2e}
    .sub{font-size:13px;color:#888;margin-top:4px;margin-bottom:20px}
    .amt-box{background:#fef3ed;border-radius:12px;padding:14px;margin-bottom:24px}
    .amt-label{font-size:13px;color:#e8623a}
    .amt-value{font-size:36px;font-weight:700;color:#e8623a}
    .spinner{border:4px solid #f0ede8;border-top:4px solid #e8623a;border-radius:50%;
             width:40px;height:40px;animation:spin .8s linear infinite;margin:0 auto 12px}
    @keyframes spin{to{transform:rotate(360deg)}}
    #statusText{color:#555;font-size:15px;margin-bottom:8px}
    #errorBox{display:none;background:#ffebee;border-radius:10px;padding:16px;
              color:#c62828;font-size:14px;margin-top:12px}
    .retry-btn{margin-top:12px;background:#e8623a;color:#fff;border:none;
               border-radius:8px;padding:10px 28px;font-size:15px;cursor:pointer}
    .secure{margin-top:16px;color:#aaa;font-size:12px}
  </style>
</head>
<body>
<div class="card">
  <div class="title">Support This Cause</div>
  <div class="sub">${post?.title || 'Fundraiser'}</div>
  <div class="amt-box">
    <div class="amt-label">Your Contribution</div>
    <div class="amt-value">₹${Number(amount).toLocaleString('en-IN')}</div>
  </div>
  <div id="loader">
    <div class="spinner"></div>
    <div id="statusText">Opening Razorpay…</div>
  </div>
  <div id="errorBox">
    ⚠️ Could not connect to Razorpay.
    <br/><button class="retry-btn" onclick="loadRazorpay()">Retry</button>
  </div>
  <div class="secure">🔒 Secured by Razorpay</div>
</div>
<script>
var RZP_LOADED = false;
function loadRazorpay(){
  RZP_LOADED=false;
  document.getElementById('loader').style.display='block';
  document.getElementById('errorBox').style.display='none';
  document.getElementById('statusText').innerText='Connecting to Razorpay…';
  var ex=document.getElementById('rzp-script');if(ex)ex.remove();
  var to=setTimeout(function(){
    if(!RZP_LOADED){
      document.getElementById('loader').style.display='none';
      document.getElementById('errorBox').style.display='block';
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'SCRIPT_LOAD_FAILED'}));
    }
  },15000);
  var s=document.createElement('script');s.id='rzp-script';
  s.src='https://checkout.razorpay.com/v1/checkout.js';
  s.onload=function(){clearTimeout(to);RZP_LOADED=true;openRazorpay();};
  s.onerror=function(){
    clearTimeout(to);
    document.getElementById('loader').style.display='none';
    document.getElementById('errorBox').style.display='block';
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'SCRIPT_LOAD_FAILED'}));
  };
  document.head.appendChild(s);
}
function openRazorpay(){
  var opts={
    key:'${RAZORPAY_KEY}',
    amount:${Math.round(amount * 100)},
    currency:'INR',
    name:'Raise Fund',
    description:'${(post?.title || 'Donation').replace(/'/g, "\\'")}',
    theme:{color:'#e8623a'},
    prefill:{name:'${name}',email:'${email}',contact:'${phone}'},
    handler:function(r){
      document.getElementById('statusText').innerText='Payment successful!';
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type:'PAYMENT_SUCCESS',
        paymentId:r.razorpay_payment_id,
        orderId:r.razorpay_order_id||'',
        signature:r.razorpay_signature||''
      }));
    },
    modal:{
      ondismiss:function(){
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'PAYMENT_CANCELLED'}));
      },
      escape:false,handleback:true,animation:true
    }
  };
  try{
    var rzp=new Razorpay(opts);
    rzp.on('payment.failed',function(r){
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type:'PAYMENT_FAILED',error:r.error.description||'Payment failed'
      }));
    });
    rzp.open();
  }catch(e){
    document.getElementById('loader').style.display='none';
    document.getElementById('errorBox').style.display='block';
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'PAYMENT_FAILED',error:e.message}));
  }
}
window.onload=function(){loadRazorpay();};
</script>
</body>
</html>`;
}

// ─── API helpers ──────────────────────────────────────────────────────────────
const API_BASE = 'https://your-api.com'; // ← replace with your base URL

async function fetchMemberDetails(memberId) {
  const token = await AsyncStorage.getItem('authToken');
  const res = await fetch(`${API_BASE}/member/profile/${memberId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch member');
  return res.json(); // { id, fullName, email, phoneNumber, totalDonated, ... }
}

async function storePayment({ memberId, postId, amount, paymentId, orderId, signature }) {
  const token = await AsyncStorage.getItem('authToken');
  const res = await fetch(`${API_BASE}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      memberId,
      postId,
      amount,
      paymentId,
      orderId,
      signature,
      paidAt: new Date().toISOString(),
    }),
  });
  if (!res.ok) throw new Error('Failed to store payment');
  return res.json();
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────
function ProgressBar({ raised, goal, color = '#e8623a' }) {
  const pct = Math.min((raised / goal) * 100, 100);
  return (
    <View>
      <View style={s.progressMeta}>
        <Text style={s.progressLabel}>₹{raised.toLocaleString('en-IN')} raised</Text>
        <Text style={[s.progressPct, { color: '#22c55e' }]}>{Math.round(pct)}%</Text>
      </View>
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={s.progressGoal}>Goal: ₹{goal.toLocaleString('en-IN')}</Text>
    </View>
  );
}

// ─── Amount Modal ─────────────────────────────────────────────────────────────
function AmountModal({ visible, post, onClose, onProceed }) {
  const [amount, setAmount] = useState('');
  const quickAmounts = [100, 500, 1000, 5000];

  const handleProceed = () => {
    const num = parseInt(amount, 10);
    if (!num || num < 1) {
      Alert.alert('Invalid amount', 'Please enter a valid amount (min ₹1)');
      return;
    }
    onProceed(num);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={s.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={s.modalSheet}>
          {/* Handle */}
          <View style={s.modalHandle} />

          <Text style={s.modalTitle}>Support this cause</Text>

          {/* Goal summary inside popup */}
          <View style={s.modalGoalBox}>
            <ProgressBar raised={post.raised} goal={post.goal} />
            <View style={s.modalGoalRow}>
              <View style={s.modalStat}>
                <Text style={s.modalStatVal}>₹{post.raised.toLocaleString('en-IN')}</Text>
                <Text style={s.modalStatLabel}>Raised</Text>
              </View>
              <View style={s.modalStatDivider} />
              <View style={s.modalStat}>
                <Text style={s.modalStatVal}>₹{post.goal.toLocaleString('en-IN')}</Text>
                <Text style={s.modalStatLabel}>Goal</Text>
              </View>
              <View style={s.modalStatDivider} />
              <View style={s.modalStat}>
                <Text style={[s.modalStatVal, { color: '#22c55e' }]}>
                  {Math.round((post.raised / post.goal) * 100)}%
                </Text>
                <Text style={s.modalStatLabel}>Reached</Text>
              </View>
            </View>
          </View>

          {/* Quick amounts */}
          <Text style={s.modalSectionLabel}>Quick select</Text>
          <View style={s.quickRow}>
            {quickAmounts.map((q) => (
              <TouchableOpacity
                key={q}
                style={[s.quickChip, amount === String(q) && s.quickChipActive]}
                onPress={() => setAmount(String(q))}
              >
                <Text style={[s.quickChipText, amount === String(q) && s.quickChipTextActive]}>
                  ₹{q.toLocaleString('en-IN')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom input */}
          <Text style={s.modalSectionLabel}>Or enter amount</Text>
          <View style={s.amountInputRow}>
            <Text style={s.rupeeSign}>₹</Text>
            <TextInput
              style={s.amountInput}
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="Enter amount"
              placeholderTextColor="#bbb"
            />
          </View>

          {/* CTA */}
          <TouchableOpacity style={s.proceedBtn} onPress={handleProceed} activeOpacity={0.85}>
            <Ionicons name="heart" size={16} color="#fff" />
            <Text style={s.proceedBtnText}>
              Proceed to Pay{amount ? ` ₹${Number(amount).toLocaleString('en-IN')}` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function RaiseFundScreen({ route, navigation }) {
  const { post } = route.params;

  const [memberData, setMemberData] = useState(null);
  const [loadingMember, setLoadingMember] = useState(true);
  const [amountModalVisible, setAmountModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [showWebView, setShowWebView] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Load member on mount
  useEffect(() => {
    (async () => {
      try {
        const userStr = await AsyncStorage.getItem('userData');
        if (userStr) {
          const cached = JSON.parse(userStr);
          // Fetch fresh member details from API using stored memberId
          const fresh = await fetchMemberDetails(cached.memberId);
          setMemberData(fresh);
        }
      } catch (e) {
        Alert.alert('Error', 'Could not load member details');
      } finally {
        setLoadingMember(false);
      }
    })();
  }, []);

  const handleAmountProceed = (amount) => {
    setPaymentAmount(amount);
    setAmountModalVisible(false);
    setShowWebView(true);
  };

  const handleWebViewMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'PAYMENT_SUCCESS') {
        setShowWebView(false);
        setProcessingPayment(true);
        try {
          // Store payment in your DB table
          await storePayment({
            memberId: memberData?.id || memberData?.memberId,
            postId: post.id,
            amount: paymentAmount,
            paymentId: data.paymentId,
            orderId: data.orderId,
            signature: data.signature,
          });
          Alert.alert(
            '✅ Thank you!',
            `Your donation of ₹${paymentAmount.toLocaleString('en-IN')} was successful.\nPayment ID: ${data.paymentId}`,
            [{ text: 'Done', onPress: () => navigation.goBack() }]
          );
        } catch (err) {
          // Payment succeeded but DB store failed — still show success
          Alert.alert(
            'Payment Done',
            `Payment ID: ${data.paymentId}\nAmount: ₹${paymentAmount.toLocaleString('en-IN')}\n(Record will sync shortly)`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } finally {
          setProcessingPayment(false);
        }

      } else if (data.type === 'PAYMENT_CANCELLED') {
        setShowWebView(false);
        // quietly re-open the amount modal so user can retry
        setAmountModalVisible(true);

      } else if (data.type === 'PAYMENT_FAILED') {
        setShowWebView(false);
        Alert.alert('Payment Failed', data.error || 'Something went wrong. Please try again.');

      } else if (data.type === 'SCRIPT_LOAD_FAILED') {
        console.log('Razorpay script failed — user can retry inside WebView');
      }
    } catch (e) {
      console.error('WebView message parse error:', e);
    }
  };

  if (loadingMember) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#e8623a" />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Razorpay WebView ── */}
      <Modal visible={showWebView} animationType="slide" onRequestClose={() => setShowWebView(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={s.wvHeader}>
            <Text style={s.wvTitle}>Secure Payment</Text>
            <TouchableOpacity onPress={() => setShowWebView(false)} style={s.wvClose}>
              <Ionicons name="close" size={22} color="#333" />
            </TouchableOpacity>
          </View>
          <WebView
            source={{ html: getRazorpayHTML({ amount: paymentAmount, userData: memberData, post }), baseUrl: 'https://checkout.razorpay.com' }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            originWhitelist={['*']}
            mixedContentMode="always"
            thirdPartyCookiesEnabled
            allowUniversalAccessFromFileURLs
            allowFileAccessFromFileURLs
            allowsInlineMediaPlayback
            renderLoading={() => (
              <View style={s.centered}>
                <ActivityIndicator size="large" color="#e8623a" />
              </View>
            )}
            onError={() => {
              Alert.alert('Error', 'Failed to load payment page');
              setShowWebView(false);
            }}
          />
        </SafeAreaView>
      </Modal>

      {/* Processing overlay */}
      {processingPayment && (
        <View style={s.processingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={s.processingText}>Recording your donation…</Text>
        </View>
      )}

      {/* ── Main content ── */}
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Back */}
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#333" />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>

        {/* Post summary */}
        <View style={s.postCard}>
          <View style={[s.badge, { backgroundColor: post.badgeBg }]}>
            <Text style={[s.badgeText, { color: post.badgeColor }]}>{post.badge}</Text>
          </View>
          <Text style={s.postTitle}>{post.title}</Text>
          <Text style={s.postBody}>{post.body}</Text>
        </View>

        {/* Progress card */}
        <View style={s.progressCard}>
          <Text style={s.cardSectionLabel}>Fundraiser Progress</Text>
          <ProgressBar raised={post.raised} goal={post.goal} />

          <View style={s.statsRow}>
            <View style={s.stat}>
              <Text style={s.statVal}>₹{post.raised.toLocaleString('en-IN')}</Text>
              <Text style={s.statLabel}>Raised</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statVal}>₹{(post.goal - post.raised).toLocaleString('en-IN')}</Text>
              <Text style={s.statLabel}>Remaining</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statVal}>₹{post.goal.toLocaleString('en-IN')}</Text>
              <Text style={s.statLabel}>Goal</Text>
            </View>
          </View>
        </View>

        {/* Member info */}
        {memberData && (
          <View style={s.memberCard}>
            <Text style={s.cardSectionLabel}>Donating as</Text>
            <View style={s.memberRow}>
              <View style={s.memberAvatar}>
                <Text style={s.memberAvatarText}>
                  {(memberData.fullName || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={s.memberName}>{memberData.fullName}</Text>
                <Text style={s.memberEmail}>{memberData.email}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Raise Fund CTA */}
        <TouchableOpacity
          style={s.raiseFundBtn}
          onPress={() => setAmountModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="heart" size={18} color="#fff" />
          <Text style={s.raiseFundBtnText}>Raise Fund</Text>
        </TouchableOpacity>

        <Text style={s.secureNote}>🔒 Secured by Razorpay · All transactions are encrypted</Text>
      </ScrollView>

      {/* Amount popup */}
      <AmountModal
        visible={amountModalVisible}
        post={post}
        onClose={() => setAmountModalVisible(false)}
        onProceed={handleAmountProceed}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f4f0' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 60 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backText: { fontSize: 15, color: '#333' },

  postCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    marginBottom: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.07)',
  },
  badge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  badgeText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  postTitle: { fontSize: 18, fontWeight: '700', color: '#111', lineHeight: 26, marginBottom: 8 },
  postBody: { fontSize: 14, color: '#555', lineHeight: 22 },

  progressCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    marginBottom: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.07)',
  },
  cardSectionLabel: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 13, color: '#555' },
  progressPct: { fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 8, backgroundColor: '#f0ede8', borderRadius: 99, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 99 },
  progressGoal: { fontSize: 12, color: '#aaa' },

  statsRow: { flexDirection: 'row', marginTop: 16, alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '700', color: '#111' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: '#f0ede8' },

  memberCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    marginBottom: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.07)',
  },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#e8623a', alignItems: 'center', justifyContent: 'center',
  },
  memberAvatarText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  memberName: { fontSize: 15, fontWeight: '600', color: '#111' },
  memberEmail: { fontSize: 12, color: '#888', marginTop: 2 },

  raiseFundBtn: {
    backgroundColor: '#e8623a', borderRadius: 16, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginBottom: 12,
  },
  raiseFundBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  secureNote: { fontSize: 12, color: '#aaa', textAlign: 'center' },

  // WebView header
  wvHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  wvTitle: { fontSize: 17, fontWeight: '600', color: '#333' },
  wvClose: { padding: 4 },

  // Processing overlay
  processingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center', alignItems: 'center', zIndex: 999,
  },
  processingText: { color: '#fff', marginTop: 12, fontSize: 15 },

  // Amount modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#ddd',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 16 },

  modalGoalBox: {
    backgroundColor: '#f5f4f0', borderRadius: 14, padding: 14, marginBottom: 20,
  },
  modalGoalRow: { flexDirection: 'row', marginTop: 14, alignItems: 'center' },
  modalStat: { flex: 1, alignItems: 'center' },
  modalStatVal: { fontSize: 15, fontWeight: '700', color: '#111' },
  modalStatLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  modalStatDivider: { width: 1, height: 32, backgroundColor: '#ddd' },

  modalSectionLabel: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  quickChip: {
    flex: 1, minWidth: 70, borderRadius: 10, paddingVertical: 10,
    backgroundColor: '#f0ede8', alignItems: 'center',
  },
  quickChipActive: { backgroundColor: '#e8623a' },
  quickChipText: { fontSize: 14, fontWeight: '600', color: '#666' },
  quickChipTextActive: { color: '#fff' },

  amountInputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e0ddd8', borderRadius: 12,
    paddingHorizontal: 14, marginBottom: 20, backgroundColor: '#fafaf8',
  },
  rupeeSign: { fontSize: 20, fontWeight: '600', color: '#333', marginRight: 6 },
  amountInput: { flex: 1, fontSize: 22, fontWeight: '600', color: '#111', paddingVertical: 14 },

  proceedBtn: {
    backgroundColor: '#e8623a', borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  proceedBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});