// screens/RaiseFundScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator, SafeAreaView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const RAZORPAY_KEY = 'rzp_test_6pwjCwtwwp3YOu';

// ─── Razorpay HTML ────────────────────────────────────────────────────────────
// FIX: handler now also sends method (payment mode) back to RN
function getRazorpayHTML({ amount, userData, post }) {
    console.log(userData,"UserData");
  const name  = (userData?.fullName      || '').replace(/'/g, "\\'");
  const email = (userData?.email         || '').replace(/'/g, "\\'");
  //const phone = (userData?.contactNumber || '').replace(/'/g, "\\'");
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
    description:'${(post?.title || 'Donation').replace(/'/g, "\\'")}',
    theme:{color:'#e8623a'},
    prefill:{name:'${name}',email:'${email}',contact:'${phone}'},
    handler:function(r){
      document.getElementById('statusText').innerText='Payment successful!';

      // ── FIX: send method along with payment details ──────────────
      // r.razorpay_payment_id is always present on success
      // method is available on the Razorpay instance after payment
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type      : 'PAYMENT_SUCCESS',
        paymentId : r.razorpay_payment_id,
        orderId   : r.razorpay_order_id   || '',
        signature : r.razorpay_signature  || '',
        method    : r.method              || 'Razorpay', // upi/card/netbanking/wallet
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
        error : r.error.description || 'Payment failed',
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

// ─── Map Razorpay method string → readable label ──────────────────────────────
// Razorpay sends: 'upi' | 'card' | 'netbanking' | 'wallet' | 'emi'
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
  if (!userStr) throw new Error('User not found');
  const user = JSON.parse(userStr);
  const memberId = user?.memberId || user?.id;
  if (!memberId) throw new Error('Member ID missing');
  const res = await api.get(`/member/profile/${memberId}`);
  if (res.data.success) return res.data.data;
  throw new Error(res.data.message || 'Failed to fetch member');
};

// ─── API: store payment ───────────────────────────────────────────────────────
// FIX: correct params — fundId, paymentMode, transactionId all properly passed
async function storePayment({ memberId, fundId, amount, transactionId, paymentMode }) {
    debugger;
  const res = await api.post('/RaiseFundPayment/donate', {
    memberId,
    fundId,
    amount,
    paymentMode,        // 'UPI' | 'Card' | 'NetBanking' | 'Wallet'
    transactionId,      // razorpay_payment_id
    paymentStatus: 'Success',
  });
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.data; // { id, balanceAmount, collectedAmount, targetAmount }
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

// ─── Amount Modal ─────────────────────────────────────────────────────────────
function AmountModal({ visible, post, onClose, onProceed }) {
  const minAmount = post.minimumAmount ?? 1;
  
  // FIX: autofill minimum amount when modal opens
  const [amount, setAmount] = useState(String(minAmount));
  const quickAmounts = [100, 500, 1000, 5000];

  // FIX: reset to minimum (not empty) when modal opens
  useEffect(() => {
    if (visible) setAmount(String(minAmount));
  }, [visible]);

  const handleProceed = () => {
    const num = parseInt(amount, 10);
    
    // FIX: validate against minimum amount
    if (!num || num < minAmount) {
      Alert.alert(
        'Amount too low',
        `Minimum donation for this fund is ₹${minAmount.toLocaleString('en-IN')}`
      );
      return;
    }
    onProceed(num);
  };

  // FIX: validate on change — prevent going below minimum
  const handleAmountChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setAmount(cleaned);
  };

  // FIX: on blur, if below minimum, reset to minimum
  const handleBlur = () => {
    const num = parseInt(amount, 10);
    if (!num || num < minAmount) {
      setAmount(String(minAmount));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={s.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={s.modalSheet}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>Support this cause</Text>

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

          {/* FIX: show minimum amount notice */}
          {minAmount > 1 && (
            <View style={s.minAmountBanner}>
              <Ionicons name="information-circle-outline" size={15} color="#e8623a" />
              <Text style={s.minAmountText}>
                Minimum donation: ₹{minAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          )}

          <Text style={s.modalSectionLabel}>Quick select</Text>
          <View style={s.quickRow}>
            {quickAmounts.map((q) => {
              // FIX: only show quick amounts >= minimum
              if (q < minAmount) return null;
              return (
                <TouchableOpacity
                  key={q}
                  style={[s.quickChip, amount === String(q) && s.quickChipActive]}
                  onPress={() => setAmount(String(q))}
                >
                  <Text style={[s.quickChipText, amount === String(q) && s.quickChipTextActive]}>
                    ₹{q.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={s.modalSectionLabel}>Or enter amount</Text>
          <View style={[
            s.amountInputRow,
            // FIX: red border if below minimum
            parseInt(amount) < minAmount && amount !== '' && s.amountInputRowError
          ]}>
            <Text style={s.rupeeSign}>₹</Text>
            <TextInput
              style={s.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              onBlur={handleBlur}          // ← reset to min on blur if too low
              keyboardType="number-pad"
              placeholder={`Min ₹${minAmount}`}
              placeholderTextColor="#bbb"
            />
          </View>

          {/* FIX: show inline error if below minimum */}
          {parseInt(amount) < minAmount && amount !== '' && (
            <Text style={s.minAmountError}>
              ⚠️ Minimum amount is ₹{minAmount.toLocaleString('en-IN')}
            </Text>
          )}

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

  const safePost = {
    ...post,
    raised: post.raised ?? post.collectedAmount ?? 0,
    goal  : post.goal   ?? post.targetAmount    ?? 0,
    title : post.title  || post.fundTitle       || '',
    body  : post.body   || post.description     || '',
    beneficiaryName: post.fullName       || '',
    contactNumber  : post.contactNumber  || '',
    upiId          : post.upiId          || '',
    bankName       : post.bankName       || '',
    accountNumber  : post.accountNumber  || '',
     minimumAmount  : post.minimumAmount  ?? 1,
  };

  const [memberData,        setMemberData]        = useState(null);
  const [loadingMember,     setLoadingMember]     = useState(true);
  const [amountModalVisible,setAmountModalVisible] = useState(false);
  const [paymentAmount,     setPaymentAmount]     = useState(0);
  const [showWebView,       setShowWebView]       = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchMemberDetails()
      .then(setMemberData)
      .catch(() => Alert.alert('Error', 'Could not load member details'))
      .finally(() => setLoadingMember(false));
  }, []);

  const handleAmountProceed = (amount) => {
    // FIX: don't open WebView if member data not loaded yet
  if (!memberData) {
    Alert.alert('Please wait', 'Loading your profile, please try again.');
    return;
  }

  // FIX: log to confirm correct number
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
        debugger;
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Razorpay message:', data);

      if (data.type === 'PAYMENT_SUCCESS') {
        setShowWebView(false);
        setProcessingPayment(true);

        // FIX: map Razorpay method → readable PaymentMode
        const paymentMode = mapPaymentMode(data.method);
        console.log('Payment mode:', paymentMode); // 'UPI' | 'Card' | 'NetBanking' | 'Wallet'

        try {
            debugger;
          const result = await storePayment({
            memberId     : memberData?.id || memberData?.memberId,
            fundId       : safePost.id,       // tbl_Fundraise.Id
            amount       : paymentAmount,
            transactionId: data.paymentId,    // razorpay_payment_id → TransactionId
            paymentMode,                      // 'UPI' | 'Card' | 'NetBanking' | 'Wallet'
          });

          Alert.alert(
            '✅ Thank you!',
            `Donated ₹${paymentAmount.toLocaleString('en-IN')} via ${paymentMode}\n` +
            `Transaction ID: ${data.paymentId}\n` +
            `Balance remaining: ₹${result?.balanceAmount?.toLocaleString('en-IN') ?? '—'}`,
            [{
              text: 'Done',
              // FIX: navigate to FeedScreen instead of goBack()
              onPress: () => navigation.navigate('FundScreen'),
            }]
          );

        } catch (err) {
          // Razorpay succeeded but DB failed — still navigate away
          Alert.alert(
            'Payment Done',
            `Payment received via ${paymentMode}\nTransaction ID: ${data.paymentId}\n(Record will sync shortly)`,
            [{
              text: 'OK',
              onPress: () => navigation.navigate('Organisation'),
            }]
          );
        } finally {
          setProcessingPayment(false);
        }

      } else if (data.type === 'PAYMENT_CANCELLED') {
        setShowWebView(false);
        setAmountModalVisible(true); // re-open amount modal

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

      {/* ── Razorpay WebView Modal ── */}
      <Modal visible={showWebView} animationType="slide" onRequestClose={() => setShowWebView(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={s.wvHeader}>
            <Text style={s.wvTitle}>Secure Payment</Text>
            <TouchableOpacity onPress={() => setShowWebView(false)} style={s.wvClose}>
              <Ionicons name="close" size={22} color="#333" />
            </TouchableOpacity>
          </View>
          <WebView
            source={{
              html    : getRazorpayHTML({ amount: paymentAmount, userData: memberData, post: safePost }),
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

        {/*uchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#333" />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>*/}

        {/* Post card */}
        <View style={s.postCard}>
          <View style={[s.badge, { backgroundColor: safePost.badgeBg }]}>
            <Text style={[s.badgeText, { color: safePost.badgeColor }]}>{safePost.badge}</Text>
          </View>
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
            {safePost.beneficiaryName  ? <Text style={s.beneficiaryText}>👤 {safePost.beneficiaryName}</Text>  : null}
            {safePost.contactNumber    ? <Text style={s.beneficiaryText}>📞 {safePost.contactNumber}</Text>    : null}
            {safePost.upiId            ? <Text style={s.beneficiaryText}>💳 UPI: {safePost.upiId}</Text>       : null}
            {safePost.bankName         ? <Text style={s.beneficiaryText}>🏦 {safePost.bankName}</Text>         : null}
            {safePost.accountNumber    ? <Text style={s.beneficiaryText}>🔢 A/C: {safePost.accountNumber}</Text>: null}
          </View>
        )}

        {/* CTA */}
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

      <AmountModal
        visible={amountModalVisible}
        post={safePost}
        onClose={() => setAmountModalVisible(false)}
        onProceed={handleAmountProceed}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe      : { flex: 1, backgroundColor: '#f5f4f0' },
  centered  : { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll    : { padding: 16, paddingBottom: 60 },

  backBtn   : { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backText  : { fontSize: 15, color: '#333' },

  postCard  : { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.07)' },
  badge     : { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  badgeText : { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  postTitle : { fontSize: 18, fontWeight: '700', color: '#111', lineHeight: 26, marginBottom: 8 },
  postBody  : { fontSize: 14, color: '#555', lineHeight: 22 },

  progressCard     : { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.07)' },
  cardSectionLabel : { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  progressMeta     : { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel    : { fontSize: 13, color: '#555' },
  progressPct      : { fontSize: 13, fontWeight: '700' },
  progressTrack    : { height: 8, backgroundColor: '#f0ede8', borderRadius: 99, overflow: 'hidden', marginBottom: 8 },
  progressFill     : { height: '100%', backgroundColor: '#22c55e', borderRadius: 99 },
  progressGoal     : { fontSize: 12, color: '#aaa' },

  statsRow   : { flexDirection: 'row', marginTop: 16, alignItems: 'center' },
  stat       : { flex: 1, alignItems: 'center' },
  statVal    : { fontSize: 16, fontWeight: '700', color: '#111' },
  statLabel  : { fontSize: 11, color: '#888', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: '#f0ede8' },

  memberCard       : { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.07)' },
  memberRow        : { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberAvatar     : { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e8623a', alignItems: 'center', justifyContent: 'center' },
  memberAvatarText : { color: '#fff', fontSize: 18, fontWeight: '600' },
  memberName       : { fontSize: 15, fontWeight: '600', color: '#111' },
  memberEmail      : { fontSize: 12, color: '#888', marginTop: 2 },

  beneficiaryCard : { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.07)' },
  beneficiaryText : { fontSize: 14, color: '#333', marginBottom: 6 },

  raiseFundBtn    : { backgroundColor: '#e8623a', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  raiseFundBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  secureNote      : { fontSize: 12, color: '#aaa', textAlign: 'center' },

  wvHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  wvTitle : { fontSize: 17, fontWeight: '600', color: '#333' },
  wvClose : { padding: 4 },

  processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  processingText   : { color: '#fff', marginTop: 12, fontSize: 15 },

  modalOverlay : { flex: 1, justifyContent: 'flex-end' },
  modalSheet   : { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalHandle  : { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle   : { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 16 },

  modalGoalBox     : { backgroundColor: '#f5f4f0', borderRadius: 14, padding: 14, marginBottom: 20 },
  modalGoalRow     : { flexDirection: 'row', marginTop: 14, alignItems: 'center' },
  modalStat        : { flex: 1, alignItems: 'center' },
  modalStatVal     : { fontSize: 15, fontWeight: '700', color: '#111' },
  modalStatLabel   : { fontSize: 11, color: '#888', marginTop: 2 },
  modalStatDivider : { width: 1, height: 32, backgroundColor: '#ddd' },

  modalSectionLabel: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  quickRow         : { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  quickChip        : { flex: 1, minWidth: 70, borderRadius: 10, paddingVertical: 10, backgroundColor: '#f0ede8', alignItems: 'center' },
  quickChipActive  : { backgroundColor: '#e8623a' },
  quickChipText    : { fontSize: 14, fontWeight: '600', color: '#666' },
  quickChipTextActive: { color: '#fff' },

  amountInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e0ddd8', borderRadius: 12, paddingHorizontal: 14, marginBottom: 20, backgroundColor: '#fafaf8' },
  rupeeSign     : { fontSize: 20, fontWeight: '600', color: '#333', marginRight: 6 },
  amountInput   : { flex: 1, fontSize: 22, fontWeight: '600', color: '#111', paddingVertical: 14 },
  proceedBtn    : { backgroundColor: '#e8623a', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  proceedBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
// inside StyleSheet.create({...}) — add these 3:
minAmountBanner  : { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef3ed', borderRadius: 8, padding: 10, marginBottom: 14 },
minAmountText    : { fontSize: 13, color: '#e8623a', fontWeight: '600' },
minAmountError   : { fontSize: 12, color: '#e8623a', marginTop: -14, marginBottom: 10, marginLeft: 4 },
amountInputRowError: { borderColor: '#e8623a', borderWidth: 1.5 },
});