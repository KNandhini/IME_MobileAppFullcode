import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import api from '../utils/api';
import { RegistrationPaymentScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';
import logoImage from '../../assets/logo-clean.png';

const RAZORPAY_KEY = 'rzp_test_6pwjCwtwwp3YOu';

const RegistrationPaymentScreen = ({ route, navigation }) => {
  // No account exists yet at this point. `pendingSignup` is the full signup
  // payload built on the previous screen — it only gets posted to
  // /Auth/signup once Razorpay confirms the payment succeeded. If the person
  // cancels, fails, or backs out of the WebView, nothing is ever created.
  const { pendingSignup, profilePhotoUri } = route.params || {};

  const insets = useSafeAreaInsets();

  const [profilePhoto,      setProfilePhoto]      = useState(profilePhotoUri ? { uri: profilePhotoUri } : null);
  const [showWebView,       setShowWebView]        = useState(false);
  const [processingPayment, setProcessingPayment]  = useState(false);
  const [feeAmount,         setFeeAmount]          = useState(route.params?.feeAmount ?? 0);
  const [feeId,             setFeeId]              = useState(null);
  const [logoDataUri,       setLogoDataUri]        = useState(null);

  // Always fetch the current fee from the backend — params value may be stale or 0
  useEffect(() => {
    api.get('/payment/latest-fee')
      .then(res => {
        if (res.data?.success && res.data?.data) {
          setFeeAmount(parseFloat(res.data.data.amount) || 0);
          setFeeId(res.data.data.feeId ?? null);
        }
      })
      .catch(() => {}); // silently keep param value if request fails
  }, []);

  // Convert the local logo asset to a base64 data URI once, so it can be
  // handed to Razorpay's checkout.js as the `image` option — the WebView
  // needs an actual image string, not a bundler asset reference.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const asset = Asset.fromModule(logoImage);
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

  const uploadProfilePhoto = async (photoUri, memberId) => {
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

  // NOTE: Colors below are hardcoded (not pulled from the RN `COLORS` import)
  // because this string is injected into a WebView — a separate JS context
  // that has no access to React Native's `COLORS` object. Keep these in sync
  // with theme.js manually: primary #3A4EFB, dark #252943, accent/green #A0C878.
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
            padding-bottom: 40px;
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
            background: #A0C878;
            border-radius: 50%;
            line-height: 56px;
            font-size: 28px;
            margin: 0 auto 12px;
          }
          .title { font-size: 20px; font-weight: bold; color: #252943; }
          .subtitle { font-size: 13px; color: #888; margin-top: 4px; margin-bottom: 20px; }
          .amount-box {
            background: #A0C878;
            border-radius: 10px;
            padding: 14px;
            margin-bottom: 24px;
          }
          .amount-label { font-size: 13px; color: #252943; font-weight: 600; }
          .amount-value { font-size: 32px; font-weight: bold; color: #252943; }
          .spinner {
            border: 4px solid #e0e0e0;
            border-top: 4px solid #A0C878;
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
            background: #A0C878;
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
            <div class="amount-label">One-Time Membership Registration Fee</div>
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
            var amountPaise = ${Math.round((feeAmount ?? 0) * 100)};

            if (!amountPaise || amountPaise <= 0) {
              document.getElementById('loader').style.display = 'none';
              document.getElementById('errorBox').style.display = 'block';
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PAYMENT_FAILED',
                status: 'INVALID_AMOUNT',
              }));
              return;
            }

            var options = {
              key: '${RAZORPAY_KEY}',
              amount: amountPaise,
              currency: 'INR',
              name: 'IME Membership',
              description: 'One-Time Membership Registration Fee',
              image: '${logoDataUri || ''}',
              theme: { color: '#A0C878' },
              prefill: {
                name: '${(pendingSignup?.fullName || '').replace(/'/g, "\\'")}',
                email: '${(pendingSignup?.email || '').replace(/'/g, "\\'")}',
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
                  status: response.error.code || null,
                }));
              });
              rzp.open();
            } catch(e) {
              document.getElementById('loader').style.display = 'none';
              document.getElementById('errorBox').style.display = 'block';
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PAYMENT_FAILED',
                status: null,
                message: e.message,
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
          // Only now — after Razorpay has confirmed the payment — do we
          // actually create the account. Anything that goes wrong from here
          // is a "payment captured, account creation/activation needs
          // reconciling" case, not a "nothing happened" case, so we always
          // point them to support with the payment ID rather than losing it.
          const signupResponse = await api.post('/Auth/signup', pendingSignup);
          const signupRes = signupResponse.data;

          if (!signupRes.success) {
            Alert.alert(
              'Payment Received, Account Not Created',
              `Your payment (ID: ${data.paymentId}) was captured, but we could not create your account: ${getSafeErrorMessage(signupRes)}\n\nPlease contact support with this payment ID.`,
              [{ text: 'OK' }],
              { cancelable: false }
            );
            return;
          }

          const { userId, memberId } = signupRes.data;

          if (profilePhoto?.uri) {
            await uploadProfilePhoto(profilePhoto.uri, memberId);
          }

          const res = await api.post('/payment/register-payment', {
            memberId,
            userId,
            amount: feeAmount,
            paymentMode: 'Razorpay',
            transactionReference: data.paymentId,
            memberEmail: pendingSignup?.email ?? '',
            plainPassword: pendingSignup?.password ?? '',
          });

          if (res.data.success) {
            Alert.alert(
              'Registration Complete!',
              `Payment successful!\nPayment ID: ${data.paymentId}\n\nYour account is now active. Please login.`,
              [{ text: 'Login Now', onPress: () => navigation.replace('Login') }],
              { cancelable: false }
            );
          } else {
            // Account was created and payment was captured by Razorpay, but
            // marking the payment against the account failed on our side.
            // Still navigate — support can reconcile using the payment ID.
            Alert.alert(
              'Payment Received',
              `Payment ID: ${data.paymentId}\n\nYour payment was captured. If login fails, please contact support with this ID.`,
              [{ text: 'Go to Login', onPress: () => navigation.replace('Login') }],
              { cancelable: false }
            );
          }
        } catch (e) {
          // Network/server error somewhere after Razorpay success. We don't
          // know whether the account got created, so send them to support
          // with the payment ID rather than guessing.
          Alert.alert(
            'Payment Received',
            `Payment ID: ${data.paymentId}\n\nPlease try logging in. If your account is not active, contact support with this payment ID.`,
            [{ text: 'Go to Login', onPress: () => navigation.replace('Login') }],
            { cancelable: false }
          );
        } finally {
          setProcessingPayment(false);
        }

      } else if (data.type === 'PAYMENT_CANCELLED') {
        setShowWebView(false);
        Alert.alert('Cancelled', 'Payment was cancelled. No account was created — you can try again anytime.');

      } else if (data.type === 'PAYMENT_FAILED') {
        setShowWebView(false);
        Alert.alert('Payment Failed', getSafeErrorMessage(data) + '\n\nNo account was created.');

      } else if (data.type === 'SCRIPT_LOAD_FAILED') {
        console.log('Razorpay script failed to load');
      }
    } catch (e) {
      console.error('WebView message parse error:', e);
    }
  };

  const handlePayNow = () => {
    if (!pendingSignup) {
      Alert.alert('Error', 'Registration details not found. Please go back and fill the form again.');
      return;
    }
    setShowWebView(true);
  };

  // ---------------------------------------------------------------------
  // Full-screen WebView "page" instead of a <Modal>. When showWebView is
  // true, this early return replaces the whole component output with just
  // the payment WebView. The inner wrapper View adds paddingBottom equal to
  // the device's safe-area inset (gesture bar / home indicator) so Razorpay's
  // own "Continue" button isn't covered by the phone's nav gesture area.
  // ---------------------------------------------------------------------
  if (showWebView) {
    return (
      <View style={{ flex: 1, backgroundColor: '#A0C878' }}>
        <View style={{ flex: 1, paddingBottom: insets.bottom + 12 }}>
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
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading...</Text>
              </View>
            )}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>

      {/* Processing overlay */}
      {processingPayment && (
        <Modal visible transparent animationType="fade">
          <View style={styles.processingOverlay}>
            <View style={styles.processingBox}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.processingText}>Activating your account...</Text>
            </View>
          </View>
        </Modal>
      )}

      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
       
        {/* Profile Photo Section */}
        <View style={[styles.section,{marginTop:10}]}>
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
          <Text style={styles.feeLabel}>One-Time Membership Registration Fee</Text>
          <Text style={styles.feeAmount}>₹{feeAmount?.toFixed(2)}</Text>
          <Text style={styles.feeNote}>Pay securely via Razorpay — UPI, Card, Net Banking</Text>
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.razorpayBadge}>
            <Image
              source={logoImage}
              style={{ width: 32, height: 32, resizeMode: 'contain' }}
            />
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
  <Text style={[styles.backLinkText, { marginBottom: 10 }]}>← Go back and edit registration</Text>
</TouchableOpacity>

      </ScrollView>
    </View>
  );
};



export default RegistrationPaymentScreen;