import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Modal, Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import api from '../utils/api';

const RAZORPAY_KEY = 'rzp_test_6pwjCwtwwp3YOu';

const RegistrationPaymentScreen = ({ route, navigation }) => {
  const { userId, memberId, feeAmount, memberName, profilePhotoUri } = route.params || {};

  const [profilePhoto, setProfilePhoto] = useState(profilePhotoUri ? { uri: profilePhotoUri } : null);
  const [showWebView, setShowWebView] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const pickProfilePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setProfilePhoto(result.assets[0]);
    }
  };

  const uploadProfilePhoto = async (photoUri) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: photoUri,
        name: 'profile_photo.jpg',
        type: 'image/jpeg',
      });
      formData.append('memberId', memberId.toString());

      const baseUrl = api.defaults.baseURL;
      const response = await fetch(`${baseUrl}/File/upload-profile-photo`, {
        method: 'POST',
        body: formData,
      });
      const json = await response.json();
      return json.success;
    } catch (e) {
      console.warn('Profile photo upload failed:', e.message);
      return false;
    }
  };

  const getRazorpayHTML = () => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy"
              content="default-src * 'unsafe-inline' 'unsafe-eval';
                       script-src * 'unsafe-inline' 'unsafe-eval';
                       connect-src *;
                       img-src * data: blob:;
                       frame-src *;
                       style-src * 'unsafe-inline';">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: sans-serif;
            background: #f0f4f8;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .card {
            background: #fff;
            border-radius: 16px;
            padding: 28px 20px;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.10);
            text-align: center;
          }
          .logo {
            width: 56px; height: 56px;
            background: #1E3A5F;
            border-radius: 50%;
            line-height: 56px;
            font-size: 28px;
            margin: 0 auto 12px;
          }
          .title { font-size: 20px; font-weight: bold; color: #1E3A5F; }
          .subtitle { font-size: 13px; color: #888; margin-top: 4px; margin-bottom: 20px; }
          .amount-box {
            background: #D4A017;
            border-radius: 10px;
            padding: 14px;
            margin-bottom: 24px;
          }
          .amount-label { font-size: 13px; color: #1E3A5F; font-weight: 600; }
          .amount-value { font-size: 32px; font-weight: bold; color: #1E3A5F; }
          .spinner {
            border: 4px solid #e0e0e0;
            border-top: 4px solid #1E3A5F;
            border-radius: 50%;
            width: 40px; height: 40px;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 12px;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          #statusText { color: #555; font-size: 15px; margin-bottom: 8px; }
          #errorBox {
            display: none;
            background: #ffebee;
            border-radius: 10px;
            padding: 16px;
            color: #c62828;
            font-size: 14px;
            margin-top: 12px;
          }
          .retry-btn {
            margin-top: 12px;
            background: #1E3A5F;
            color: #fff;
            border: none;
            border-radius: 8px;
            padding: 10px 28px;
            font-size: 15px;
            cursor: pointer;
          }
          .secure { margin-top: 16px; color: #aaa; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">💳</div>
          <div class="title">IME Membership</div>
          <div class="subtitle">Secure Registration Payment</div>

          <div class="amount-box">
            <div class="amount-label">Annual Membership Fee</div>
            <div class="amount-value">₹${feeAmount?.toFixed(2) ?? '0.00'}</div>
          </div>

          <div id="loader">
            <div class="spinner"></div>
            <div id="statusText">Connecting to Razorpay...</div>
          </div>

          <div id="errorBox">
            ⚠️ Could not connect to Razorpay.<br/>Check internet connection.
            <br/><button class="retry-btn" onclick="loadRazorpay()">Retry</button>
          </div>

          <div class="secure">🔒 Secured by Razorpay</div>
        </div>

        <script>
          var RZP_LOADED = false;

          function loadRazorpay() {
            RZP_LOADED = false;
            document.getElementById('loader').style.display = 'block';
            document.getElementById('errorBox').style.display = 'none';
            document.getElementById('statusText').innerText = 'Connecting to Razorpay...';

            var existing = document.getElementById('rzp-script');
            if (existing) existing.remove();

            var timeout = setTimeout(function() {
              if (!RZP_LOADED) {
                document.getElementById('loader').style.display = 'none';
                document.getElementById('errorBox').style.display = 'block';
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SCRIPT_LOAD_FAILED' }));
              }
            }, 15000);

            var script = document.createElement('script');
            script.id = 'rzp-script';
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';

            script.onload = function() {
              clearTimeout(timeout);
              RZP_LOADED = true;
              document.getElementById('statusText').innerText = 'Opening payment...';
              openRazorpay();
            };

            script.onerror = function() {
              clearTimeout(timeout);
              document.getElementById('loader').style.display = 'none';
              document.getElementById('errorBox').style.display = 'block';
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SCRIPT_LOAD_FAILED' }));
            };

            document.head.appendChild(script);
          }

          function openRazorpay() {
            var options = {
              key: '${RAZORPAY_KEY}',
              amount: ${Math.round((feeAmount ?? 0) * 100)},
              currency: 'INR',
              name: 'IME Membership',
              description: 'Annual Membership Registration Fee',
              theme: { color: '#1E3A5F' },
              prefill: {
                name: '${(memberName || '').replace(/'/g, "\\'")}',
              },
              handler: function(response) {
                document.getElementById('statusText').innerText = 'Payment successful!';
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'PAYMENT_SUCCESS',
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id || '',
                  signature: response.razorpay_signature || '',
                }));
              },
              modal: {
                ondismiss: function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAYMENT_CANCELLED' }));
                },
                escape: false,
                handleback: true,
                animation: true,
              },
            };

            try {
              var rzp = new Razorpay(options);
              rzp.on('payment.failed', function(response) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'PAYMENT_FAILED',
                  error: response.error.description || 'Payment failed',
                }));
              });
              rzp.open();
            } catch(e) {
              document.getElementById('loader').style.display = 'none';
              document.getElementById('errorBox').style.display = 'block';
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PAYMENT_FAILED',
                error: e.message,
              }));
            }
          }

          window.onload = function() { loadRazorpay(); };
        </script>
      </body>
    </html>
  `;

  const handleWebViewMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'PAYMENT_SUCCESS') {
        setShowWebView(false);
        setProcessingPayment(true);
        try {
          // Upload profile photo first if selected
          if (profilePhoto?.uri) {
            await uploadProfilePhoto(profilePhoto.uri);
          }

          // Confirm registration payment
          const res = await api.post('/payment/register-payment', {
            memberId,
            userId,
            amount: feeAmount,
            paymentMode: 'Razorpay',
            transactionReference: data.paymentId,
          });

          if (res.data.success) {
            Alert.alert(
              'Registration Complete!',
              `Payment successful!\nPayment ID: ${data.paymentId}\n\nYour account is now active. Please login to continue.`,
              [{ text: 'Login Now', onPress: () => navigation.navigate('Login') }]
            );
          } else {
            Alert.alert('Error', res.data.message || 'Payment confirmation failed.');
          }
        } catch (e) {
          Alert.alert(
            'Payment Done',
            `Payment ID: ${data.paymentId}\nVerification pending. Please contact support if account is not activated.`
          );
        } finally {
          setProcessingPayment(false);
        }

      } else if (data.type === 'PAYMENT_CANCELLED') {
        setShowWebView(false);
        Alert.alert('Cancelled', 'Payment was cancelled.');

      } else if (data.type === 'PAYMENT_FAILED') {
        setShowWebView(false);
        Alert.alert('Payment Failed', data.error || 'Something went wrong. Try again.');

      } else if (data.type === 'SCRIPT_LOAD_FAILED') {
        console.log('Razorpay script failed to load');
      }
    } catch (e) {
      console.error('WebView message parse error:', e);
    }
  };

  const handlePayNow = () => {
    if (!memberId) {
      Alert.alert('Error', 'Member information not found. Please go back and re-register.');
      return;
    }
    setShowWebView(true);
  };

  return (
    <View style={{ flex: 1 }}>

      {/* Razorpay WebView Modal */}
      <Modal visible={showWebView} animationType="slide" onRequestClose={() => setShowWebView(false)}>
        <View style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <Text style={styles.webViewTitle}>Secure Payment</Text>
            <IconButton icon="close" size={24} onPress={() => setShowWebView(false)} />
          </View>
          <WebView
            source={{ html: getRazorpayHTML(), baseUrl: 'https://checkout.razorpay.com' }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            originWhitelist={['*']}
            mixedContentMode="always"
            thirdPartyCookiesEnabled={true}
            allowUniversalAccessFromFileURLs={true}
            allowFileAccessFromFileURLs={true}
            allowsInlineMediaPlayback={true}
            onError={() => {
              Alert.alert('Error', 'Failed to load payment page');
              setShowWebView(false);
            }}
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color="#1E3A5F" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading...</Text>
              </View>
            )}
          />
        </View>
      </Modal>

      {/* Processing overlay */}
      {processingPayment && (
        <Modal visible transparent animationType="fade">
          <View style={styles.processingOverlay}>
            <View style={styles.processingBox}>
              <ActivityIndicator size="large" color="#1E3A5F" />
              <Text style={styles.processingText}>Activating your account...</Text>
            </View>
          </View>
        </Modal>
      )}

      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Complete Payment</Text>
          <Text style={styles.headerSubtitle}>Hi {memberName}, one last step!</Text>
        </View>

        {/* Profile Photo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Photo</Text>
          <View style={styles.photoRow}>
            <TouchableOpacity onPress={pickProfilePhoto} activeOpacity={0.8}>
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto.uri }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderIcon}>👤</Text>
                </View>
              )}
              <View style={styles.photoBadge}>
                <Text style={styles.photoBadgeText}>✏️</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.photoInfo}>
              <Text style={styles.photoInfoTitle}>
                {profilePhoto ? 'Photo selected' : 'No photo selected'}
              </Text>
              <Text style={styles.photoInfoHint}>Tap the avatar to upload your photo</Text>
              {!profilePhoto && (
                <Text style={styles.photoOptional}>(Optional — you can add it later)</Text>
              )}
            </View>
          </View>
        </View>

        {/* Fee Card */}
        <View style={styles.feeCard}>
          <Text style={styles.feeLabel}>Annual Membership Fee</Text>
          <Text style={styles.feeAmount}>₹{feeAmount?.toFixed(2)}</Text>
          <Text style={styles.feeNote}>Pay securely via Razorpay — UPI, Card, Net Banking</Text>
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.razorpayBadge}>
            <Text style={styles.razorpayIcon}>💳</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.razorpayTitle}>Razorpay Secure Payment</Text>
              <Text style={styles.razorpaySubtitle}>UPI • Debit/Credit Card • Net Banking</Text>
            </View>
            <View style={styles.razorpayActive}>
              <Text style={styles.razorpayActiveText}>✓</Text>
            </View>
          </View>
        </View>

        {/* Amount breakdown */}
        <View style={styles.section}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Membership Fee</Text>
            <Text style={styles.breakdownValue}>₹{feeAmount?.toFixed(2)}</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownTotal}>Total Payable</Text>
            <Text style={styles.breakdownTotalValue}>₹{feeAmount?.toFixed(2)}</Text>
          </View>
        </View>

        {/* Pay Button */}
        <TouchableOpacity style={styles.button} onPress={handlePayNow}>
          <Text style={styles.buttonText}>Pay ₹{feeAmount?.toFixed(2)} via Razorpay</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>← Go back and edit registration</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#f5f5f5' },
  header:               { backgroundColor: '#1E3A5F', padding: 28, alignItems: 'center' },
  headerTitle:          { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtitle:       { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  feeCard:              { backgroundColor: '#D4A017', margin: 16, borderRadius: 12, padding: 24, alignItems: 'center' },
  feeLabel:             { color: '#1E3A5F', fontSize: 13, fontWeight: '600' },
  feeAmount:            { color: '#1E3A5F', fontSize: 40, fontWeight: 'bold', marginVertical: 4 },
  feeNote:              { color: '#1E3A5F', fontSize: 12, textAlign: 'center', marginTop: 4 },

  section:              { backgroundColor: '#fff', margin: 16, marginTop: 0, borderRadius: 12, padding: 16, elevation: 1 },
  sectionTitle:         { fontSize: 15, fontWeight: '700', color: '#1E3A5F', marginBottom: 12 },

  // Profile photo
  photoRow:             { flexDirection: 'row', alignItems: 'center' },
  photoPreview:         { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: '#1E3A5F' },
  photoPlaceholder:     { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E8EFF7', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#BBDEFB', borderStyle: 'dashed' },
  photoPlaceholderIcon: { fontSize: 32 },
  photoBadge:           { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: '#1E3A5F', justifyContent: 'center', alignItems: 'center' },
  photoBadgeText:       { fontSize: 10 },
  photoInfo:            { marginLeft: 16, flex: 1 },
  photoInfoTitle:       { fontSize: 14, fontWeight: '600', color: '#333' },
  photoInfoHint:        { fontSize: 12, color: '#888', marginTop: 2 },
  photoOptional:        { fontSize: 11, color: '#aaa', marginTop: 4, fontStyle: 'italic' },

  // Razorpay badge
  razorpayBadge:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4FF', borderRadius: 10, padding: 12, borderWidth: 1.5, borderColor: '#1E3A5F' },
  razorpayIcon:         { fontSize: 28 },
  razorpayTitle:        { fontSize: 14, fontWeight: '700', color: '#1E3A5F' },
  razorpaySubtitle:     { fontSize: 12, color: '#666', marginTop: 2 },
  razorpayActive:       { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1E3A5F', justifyContent: 'center', alignItems: 'center' },
  razorpayActiveText:   { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  // Amount breakdown
  breakdownRow:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  breakdownLabel:       { fontSize: 14, color: '#666' },
  breakdownValue:       { fontSize: 14, color: '#333', fontWeight: '500' },
  breakdownDivider:     { height: 1, backgroundColor: '#E0E0E0', marginVertical: 8 },
  breakdownTotal:       { fontSize: 16, fontWeight: 'bold', color: '#222' },
  breakdownTotalValue:  { fontSize: 18, fontWeight: 'bold', color: '#1E3A5F' },

  button:               { backgroundColor: '#1E3A5F', margin: 16, borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonText:           { color: '#fff', fontSize: 16, fontWeight: '700' },
  backLink:             { alignItems: 'center', marginBottom: 30 },
  backLinkText:         { color: '#1976D2', fontSize: 14 },

  // WebView
  webViewContainer:     { flex: 1, backgroundColor: '#fff' },
  webViewHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  webViewTitle:         { fontSize: 18, fontWeight: 'bold', color: '#333' },
  webViewLoading:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },

  // Processing overlay
  processingOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  processingBox:        { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', minWidth: 200 },
  processingText:       { marginTop: 16, fontSize: 15, color: '#1E3A5F', fontWeight: '600' },
});

export default RegistrationPaymentScreen;
