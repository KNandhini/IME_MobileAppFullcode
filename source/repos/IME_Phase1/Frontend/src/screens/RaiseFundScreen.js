import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
// screens/RaiseFundScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, SafeAreaView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import api from '../utils/api';
import { RaiseFundScreenS as s } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';
import logoAsset from '../../assets/logo-clean.png';

const RAZORPAY_KEY = 'rzp_test_6pwjCwtwwp3YOu';
const GREEN = COLORS.accent;

// Logo shown on the Razorpay checkout screen (the circular emblem in your
// screenshot). Loaded from your local asset (assets/logo-clean.png, imported
// above) and converted to a base64 data URI at runtime — see
// useLogoDataUri() below — since the WebView needs an actual image string,
// not a bundler asset reference.
const LOGO_ASSET = logoAsset;

// ─── Local overrides for the full-screen "Support this cause" sheet ──────────
// (kept local to this file since screenStyles.js wasn't in scope for this edit)
const fsStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.white,
  },
  closeBtn: {
    padding: 6,
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginTop: 0,
    paddingTop: 0,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
});

// ─── Razorpay HTML ────────────────────────────────────────────────────────────
function getRazorpayHTML({ amount, userData, post, logoUrl }) {
  console.log(userData, "UserData");
  const name  = (userData?.fullName      || '').replace(/'/g, "\\'");
  const email = (userData?.email         || '').replace(/'/g, "\\'");
  const phone = (
    userData?.contactNumber ||
    userData?.phoneNumber   ||
    userData?.mobile        ||
    userData?.phone         ||
    ''
  ).replace(/[^0-9]/g, '');
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
         display:flex;align-items:center;justify-content:center;padding:20px;
         padding-bottom:40px}
    .card{background:#fff;border-radius:20px;padding:28px 20px;width:100%;
          max-width:400px;box-shadow:0 4px 24px rgba(0,0,0,.10);text-align:center}
    .title{font-size:20px;font-weight:700;color:#1a1a2e}
    .sub{font-size:13px;color:#888;margin-top:4px;margin-bottom:20px}
    .amt-box{background:#F0F6E9;border-radius:12px;padding:14px;margin-bottom:24px}
    .amt-label{font-size:13px;color:#5C7A3A}
    .amt-value{font-size:36px;font-weight:700;color:#5C7A3A}
    .spinner{border:4px solid #f0ede8;border-top:4px solid #A0C878;border-radius:50%;
             width:40px;height:40px;animation:spin .8s linear infinite;margin:0 auto 12px}
    @keyframes spin{to{transform:rotate(360deg)}}
    #statusText{color:#555;font-size:15px;margin-bottom:8px}
    #errorBox{display:none;background:#ffebee;border-radius:10px;padding:16px;
              color:#c62828;font-size:14px;margin-top:12px}
    .retry-btn{margin-top:12px;background:#A0C878;color:#fff;border:none;
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
    <div class="amt-value">&#8377;${Number(amount).toLocaleString('en-IN')}</div>
  </div>
  <div id="loader">
    <div class="spinner"></div>
    <div id="statusText">Opening Razorpay…</div>
  </div>
  <div id="errorBox">
    &#9888; Could not connect to Razorpay.
    <br/><button class="retry-btn" onclick="loadRazorpay()">Retry</button>
  </div>
  <div class="secure">&#128274; Secured by Razorpay</div>
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
    image:'${logoUrl || ''}',
    description:'${(post?.title || 'Donation').replace(/'/g, "\\'")}',
    theme:{color:'#A0C878'},
    prefill:{name:'${name}',email:'${email}',contact:'${phone}'},
    handler:function(r){
      document.getElementById('statusText').innerText='Payment successful!';
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type      : 'PAYMENT_SUCCESS',
        paymentId : r.razorpay_payment_id,
        orderId   : r.razorpay_order_id   || '',
        signature : r.razorpay_signature  || '',
        method    : r.method              || 'Razorpay',
      }));
    },
    modal:{
      ondismiss:function(){
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'PAYMENT_CANCELLED'}));
      },
      escape:false, handleback:true, animation:true
    }
  };
  try{
    var rzp=new Razorpay(opts);
    rzp.on('payment.failed',function(r){
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type  :'PAYMENT_FAILED',
        status: r.error.code || null,
      }));
    });
    rzp.open();
  }catch(e){
    document.getElementById('loader').style.display='none';
    document.getElementById('errorBox').style.display='block';
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'PAYMENT_FAILED',status: null}));
  }
}
window.onload=function(){loadRazorpay();};
</script>
</body>
</html>`;
}

// ─── Map Razorpay method string → readable label ──────────────────────────────
function mapPaymentMode(method) {
  const map = {
    upi        : 'UPI',
    card       : 'Card',
    netbanking : 'NetBanking',
    wallet     : 'Wallet',
    emi        : 'EMI',
  };
  return map[method?.toLowerCase()] || 'Razorpay';
}

// ─── API: fetch member details ────────────────────────────────────────────────
const fetchMemberDetails = async () => {
  const userStr = await AsyncStorage.getItem('userData');
  if (!userStr) throw new Error('No user session');
  const user = JSON.parse(userStr);

  const memberId = user?.memberId || user?.MemberId || user?.id;
  const userId   = user?.userId   || user?.UserId;

  if (memberId) {
    try {
      const res = await api.get(`/member/profile/${memberId}`);
      const body = res.data;
      if (body?.success || body?.Success) {
        return body?.data || body?.Data;
      }
    } catch (_) {
      // fall through to stored data
    }
  }

  return {
    id: memberId || userId,
    memberId: memberId || userId,
    fullName: user?.fullName || user?.FullName || '',
    email: user?.email || user?.Email || '',
    contactNumber: user?.contactNumber || user?.ContactNumber || '',
  };
};

// ─── API: store payment ───────────────────────────────────────────────────────
async function storePayment({ memberId, fundId, amount, transactionId, paymentMode }) {
  const res = await api.post('/RaiseFundPayment/donate', {
    memberId,
    fundId,
    amount,
    paymentMode,
    transactionId,
    paymentStatus: 'Success',
  });
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.data;
}

// ─── useLogoDataUri ────────────────────────────────────────────────────────────
/**
 * Converts the local logo asset (LOGO_ASSET) into a base64 data URI once,
 * so it can be handed to Razorpay's checkout.js as the `image` option.
 * Runs once per app session — cheap after the first call.
 */
function useLogoDataUri() {
  const [logoDataUri, setLogoDataUri] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const asset = Asset.fromModule(LOGO_ASSET);
        await asset.downloadAsync();
        const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (!cancelled) setLogoDataUri(`data:image/png;base64,${base64}`);
      } catch (e) {
        console.warn('Failed to prepare logo for Razorpay checkout:', e.message);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return logoDataUri;
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
function ProgressBar({ raised, goal }) {
  const pct = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;
  return (
    <View>
      <View style={s.progressMeta}>
        <Text style={s.progressLabel}>₹{raised.toLocaleString('en-IN')} raised</Text>
        <Text style={[s.progressPct, { color: '#22c55e' }]}>{Math.round(pct)}%</Text>
      </View>
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${pct}%` }]} />
      </View>
      <Text style={s.progressGoal}>Goal: ₹{goal.toLocaleString('en-IN')}</Text>
    </View>
  );
}

// ─── AmountView ───────────────────────────────────────────────────────────────
// Full-screen "Support this cause" sheet, rendered directly (no <Modal>) via
// a conditional early return in RaiseFundScreen — same pattern used for the
// Razorpay WebView screen. Single header row only (title + close), so there
// is no doubled-header stacking anymore.
function AmountView({ post, onClose, onProceed, insets }) {
  const minAmount = post.minimumAmount ?? 1;
  const [amount, setAmount] = useState('');
  const quickAmounts = [100, 500, 1000, 5000];

  const handleProceed = () => {
    const num = parseInt(amount, 10);
    if (!num || num < 1) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    onProceed(num);
  };

  const handleAmountChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setAmount(cleaned);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <KeyboardAvoidingView
        style={[s.modalOverlay, fsStyles.overlay]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Single header — title + close button, nothing else on top of it */}
        <View style={fsStyles.header}>
          <Text style={[s.modalTitle, { marginBottom: 0 }]}>Support this cause</Text>
          <TouchableOpacity onPress={onClose} style={fsStyles.closeBtn}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={[s.modalSheet, fsStyles.sheet]}
          contentContainerStyle={{ paddingBottom: 12 }}
          keyboardShouldPersistTaps="handled"
        >
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
                  {post.goal > 0 ? Math.round((post.raised / post.goal) * 100) : 0}%
                </Text>
                <Text style={s.modalStatLabel}>Reached</Text>
              </View>
            </View>
          </View>

          {/* Display minimum amount as info only — no validation */}
          {minAmount > 1 && (
            <View style={s.minAmountBanner}>
              <Ionicons name="information-circle-outline" size={15} color={GREEN} />
              <Text style={s.minAmountText}>
                Minimum donation: ₹{minAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          )}

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

          <Text style={s.modalSectionLabel}>Or enter amount</Text>
          <View style={s.amountInputRow}>
            <Text style={s.rupeeSign}>₹</Text>
            <TextInput
              style={s.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="number-pad"
              placeholder={minAmount > 1 ? `Min ₹${minAmount.toLocaleString('en-IN')}` : 'Enter amount'}
              placeholderTextColor="#bbb"
            />
          </View>
        </ScrollView>

        {/* Fixed footer — bottom padding follows the device's real safe-area
            inset (gesture bar / home indicator) instead of a guessed value */}
        <View style={[fsStyles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={s.proceedBtn} onPress={handleProceed} activeOpacity={0.85}>
            <Ionicons name="heart" size={16} color={COLORS.white} />
            <Text style={s.proceedBtnText}>
              Proceed to Pay{amount ? ` ₹${Number(amount).toLocaleString('en-IN')}` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function RaiseFundScreen({ route, navigation }) {
  const { post } = route.params;
  const insets = useSafeAreaInsets();

  const buildSafePost = (p) => ({
    ...p,
    raised: p.raised ?? p.collectedAmount ?? 0,
    goal  : p.goal   ?? p.targetAmount    ?? 0,
    title : p.title  || p.fundTitle       || '',
    body  : p.body   || p.description     || '',
    beneficiaryName: p.fullName       || '',
    contactNumber  : p.contactNumber  || '',
    upiId          : p.upiId          || '',
    bankName       : p.bankName       || '',
    accountNumber  : p.accountNumber  || '',
    minimumAmount  : p.minimumAmount  ?? 1,
  });

  const [livePost, setLivePost] = useState(buildSafePost(post));
  const safePost = livePost;

  const [memberData,         setMemberData]         = useState(null);
  const [loadingMember,      setLoadingMember]      = useState(true);
  const [amountModalVisible, setAmountModalVisible] = useState(false);
  const [paymentAmount,      setPaymentAmount]      = useState(0);
  const [showWebView,        setShowWebView]        = useState(false);
  const [processingPayment,  setProcessingPayment]  = useState(false);
  const logoDataUri = useLogoDataUri();

  useEffect(() => {
    fetchMemberDetails()
      .then(setMemberData)
      .catch((err) => {
        console.warn('fetchMemberDetails failed:', err.message);
        Alert.alert('Session Expired', 'Please log out and log in again.');
      })
      .finally(() => setLoadingMember(false));
  }, []);

  const handleAmountProceed = (amount) => {
    if (!memberData) {
      Alert.alert('Please wait', 'Loading your profile, please try again.');
      return;
    }
    console.log('Phone going to Razorpay:',
      memberData?.contactNumber ||
      memberData?.phoneNumber   ||
      'EMPTY - check field name!'
    );
    setPaymentAmount(amount);
    setAmountModalVisible(false);
    setShowWebView(true);
  };

  // ─── WebView message handler ──────────────────────────────────────────────
  const handleWebViewMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Razorpay message:', data);

      if (data.type === 'PAYMENT_SUCCESS') {
        setShowWebView(false);
        setProcessingPayment(true);

        const paymentMode = mapPaymentMode(data.method);
        console.log('Payment mode:', paymentMode);

        try {
          const result = await storePayment({
            memberId     : memberData?.id || memberData?.memberId,
            fundId       : safePost.id,
            amount       : paymentAmount,
            transactionId: data.paymentId,
            paymentMode,
          });

          setLivePost(prev => buildSafePost({
            ...prev,
            collectedAmount: (prev.raised ?? 0) + paymentAmount,
            raised:          (prev.raised ?? 0) + paymentAmount,
            balanceAmount:   result?.balanceAmount ?? Math.max(0, (prev.goal ?? 0) - (prev.raised ?? 0) - paymentAmount),
          }));

          Alert.alert(
            '✅ Thank you!',
            `Donated ₹${paymentAmount.toLocaleString('en-IN')} via ${paymentMode}\n` +
            `Transaction ID: ${data.paymentId}\n` +
            `Balance remaining: ₹${result?.balanceAmount?.toLocaleString('en-IN') ?? '—'}`,
            [{ text: 'Done' }]
          );

        } catch (err) {
          Alert.alert(
            'Payment Done',
            `Payment received via ${paymentMode}\nTransaction ID: ${data.paymentId}\n(Record will sync shortly)`,
            [{ text: 'OK' }]
          );
        } finally {
          setProcessingPayment(false);
        }

      } else if (data.type === 'PAYMENT_CANCELLED') {
        setShowWebView(false);
        setAmountModalVisible(true);

      } else if (data.type === 'PAYMENT_FAILED') {
        setShowWebView(false);
        Alert.alert('Payment Failed', getSafeErrorMessage(data));

      } else if (data.type === 'SCRIPT_LOAD_FAILED') {
        console.log('Razorpay script failed — user can retry inside WebView');
      }

    } catch (e) {
      console.error('WebView message parse error:', e);
    }
  };

  if (loadingMember) {
    // Background forced to white for the moment right after tapping
    // "Raise Fund" on the feed card, while the member profile loads.
    return (
      <View style={[s.centered, { backgroundColor: COLORS.white }]}>
        <ActivityIndicator size="large" color={GREEN} />
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Full-screen Razorpay WebView "page" instead of a <Modal>. No custom
  // header here at all — Razorpay's own checkout UI already has its own
  // header/back control, so adding another header on top of it was the
  // cause of the doubled-header look. The wrapper View's paddingBottom
  // follows the device's real safe-area inset so Razorpay's own "Continue"
  // button isn't covered by the gesture bar / home indicator.
  // ─────────────────────────────────────────────────────────────────────────
  if (showWebView) {
    return (
      <View style={{ flex: 1, backgroundColor: '#A0C878' }}>
        {/* Processing overlay still renders on top of the WebView layer,
            in case a payment success message arrives right as the sheet
            is closing */}
        {processingPayment && (
          <View style={s.processingOverlay}>
            <ActivityIndicator size="large" color={COLORS.white} />
            <Text style={s.processingText}>Recording your donation…</Text>
          </View>
        )}
        <View style={{ flex: 1, paddingBottom: insets.bottom + 12 }}>
          <WebView
            source={{
              html    : getRazorpayHTML({ amount: paymentAmount, userData: memberData, post: safePost, logoUrl: logoDataUri }),
              baseUrl : 'https://checkout.razorpay.com',
            }}
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
                <ActivityIndicator size="large" color={GREEN} />
              </View>
            )}
            onError={() => {
              Alert.alert('Error', 'Failed to load payment page');
              setShowWebView(false);
            }}
          />
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Full-screen "Support this cause" amount-entry page instead of a <Modal>.
  // Only rendered when nothing else (WebView) is showing, so there's never
  // a Modal-on-Modal or header-on-header stack.
  // ─────────────────────────────────────────────────────────────────────────
  if (amountModalVisible) {
    return (
      <AmountView
        post={safePost}
        onClose={() => setAmountModalVisible(false)}
        onProceed={handleAmountProceed}
        insets={insets}
      />
    );
  }

  return (
    <SafeAreaView style={s.safe}>

      {/* Processing overlay */}
      {processingPayment && (
        <View style={s.processingOverlay}>
          <ActivityIndicator size="large" color={COLORS.white} />
          <Text style={s.processingText}>Recording your donation…</Text>
        </View>
      )}

      {/* ── Main content ── */}
      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}>

        {/* Post card */}
        <View style={s.postCard}>
          {(safePost.badge) && (
            <View style={[s.badge, { backgroundColor: safePost.badgeBg || COLORS.selected }]}>
              <Text style={[s.badgeText, { color: safePost.badgeColor || GREEN }]}>{safePost.badge}</Text>
            </View>
          )}
          <Text style={s.postTitle}>{safePost.title}</Text>
          <Text style={s.postBody}>{safePost.body}</Text>
        </View>

        {/* Progress card */}
        <View style={s.progressCard}>
          <Text style={s.cardSectionLabel}>Fundraiser Progress</Text>
          <ProgressBar raised={safePost.raised} goal={safePost.goal} />
          <View style={s.statsRow}>
            <View style={s.stat}>
              <Text style={s.statVal}>₹{safePost.raised.toLocaleString('en-IN')}</Text>
              <Text style={s.statLabel}>Raised</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statVal}>₹{(safePost.goal - safePost.raised).toLocaleString('en-IN')}</Text>
              <Text style={s.statLabel}>Remaining</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statVal}>₹{safePost.goal.toLocaleString('en-IN')}</Text>
              <Text style={s.statLabel}>Goal</Text>
            </View>
          </View>
        </View>

        {/* Member card */}
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

        {/* Beneficiary Details */}
        {(safePost.beneficiaryName || safePost.upiId || safePost.contactNumber ||
          safePost.bankName || safePost.accountNumber) && (
          <View style={s.beneficiaryCard}>
            <Text style={s.cardSectionLabel}>Beneficiary Details</Text>
            {safePost.beneficiaryName ? <Text style={s.beneficiaryText}>👤 {safePost.beneficiaryName}</Text> : null}
            {safePost.contactNumber   ? <Text style={s.beneficiaryText}>📞 {safePost.contactNumber}</Text>   : null}
            {safePost.upiId           ? <Text style={s.beneficiaryText}>💳 UPI: {safePost.upiId}</Text>      : null}
            {safePost.bankName        ? <Text style={s.beneficiaryText}>🏦 {safePost.bankName}</Text>        : null}
            {safePost.accountNumber   ? <Text style={s.beneficiaryText}>🔢 A/C: {safePost.accountNumber}</Text> : null}
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={s.raiseFundBtn}
          onPress={() => setAmountModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="heart" size={18} color={COLORS.white} />
          <Text style={s.raiseFundBtnText}>Raise Fund</Text>
        </TouchableOpacity>

        <Text style={[s.secureNote, { marginTop: 16, marginBottom: 24 }]}>
          🔒 Secured by Razorpay · All transactions are encrypted
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}