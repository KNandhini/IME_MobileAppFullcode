import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Button, Card, RadioButton, IconButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { paymentService } from '../services/paymentService';

const RAZORPAY_KEY = 'rzp_test_6pwjCwtwwp3YOu';
const HARDCODED_AMOUNT = 2500;

const PaymentScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [memberId, setMemberId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showWebView, setShowWebView] = useState(false);

  useEffect(() => {
    loadMember();
  }, []);

  const loadMember = async () => {
    setLoading(true);
    try {
      const userStr = await AsyncStorage.getItem('userData');
      if (userStr) {
        const user = JSON.parse(userStr);
        setMemberId(user.memberId);
        setUserData(user);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load member information');
    } finally {
      setLoading(false);
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
            background: #2196F3;
            border-radius: 50%;
            line-height: 56px;
            font-size: 28px;
            margin: 0 auto 12px;
          }
          .title { font-size: 20px; font-weight: bold; color: #1a237e; }
          .subtitle { font-size: 13px; color: #888; margin-top: 4px; margin-bottom: 20px; }
          .amount-box {
            background: #e3f2fd;
            border-radius: 10px;
            padding: 14px;
            margin-bottom: 24px;
          }
          .amount-label { font-size: 13px; color: #1976D2; }
          .amount-value { font-size: 32px; font-weight: bold; color: #1565C0; }
          .spinner {
            border: 4px solid #e0e0e0;
            border-top: 4px solid #2196F3;
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
            background: #2196F3;
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
          <div class="title">Membership Portal</div>
          <div class="subtitle">Secure Payment via Razorpay</div>

          <div class="amount-box">
            <div class="amount-label">Annual Membership Fee</div>
            <div class="amount-value">₹2,500</div>
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
              amount: ${HARDCODED_AMOUNT * 100},
              currency: 'INR',
              name: 'Membership Portal',
              description: 'Annual Membership Fee',
              theme: { color: '#2196F3' },
              prefill: {
                name: '${(userData?.fullName || '').replace(/'/g, "\\'")}',
                email: '${(userData?.email || '').replace(/'/g, "\\'")}',
                contact: '${(userData?.phoneNumber || '').replace(/'/g, "\\'")}',
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
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'PAYMENT_CANCELLED'
                  }));
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
      console.log('WebView message:', data);

      if (data.type === 'PAYMENT_SUCCESS') {
        setShowWebView(false);
        setProcessingPayment(true);
        try {
          await paymentService.verifyPayment({
            orderId: data.orderId,
            paymentId: data.paymentId,
            signature: data.signature,
          });
          Alert.alert(
            '✅ Payment Successful',
            `Payment ID: ${data.paymentId}`,
            [
              { text: 'View History', onPress: () => navigation.navigate('PaymentHistory') },
              { text: 'OK' },
            ]
          );
        } catch (err) {
          Alert.alert('Payment Done', `Payment ID: ${data.paymentId}\nVerification pending.`);
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
        // ✅ Don't close WebView — let user retry from inside
        console.log('Razorpay script failed to load');
      }
    } catch (e) {
      console.error('WebView message parse error:', e);
    }
  };

  const handleRazorpayPayment = () => {
    if (!memberId) {
      Alert.alert('Error', 'Member information not found');
      return;
    }
    setShowWebView(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>

      {/* ✅ Razorpay WebView Modal */}
      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={() => setShowWebView(false)}
      >
        <View style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <Text style={styles.webViewTitle}>Secure Payment</Text>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setShowWebView(false)}
            />
          </View>
          <WebView
            source={{
              html: getRazorpayHTML(),
              baseUrl: 'https://checkout.razorpay.com', // ✅ critical for Android
            }}
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
            onError={(e) => {
              console.log('WebView error:', e.nativeEvent);
              Alert.alert('Error', 'Failed to load payment page');
              setShowWebView(false);
            }}
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading...</Text>
              </View>
            )}
          />
        </View>
      </Modal>

      <ScrollView style={styles.container}>
        <Card style={styles.feeCard}>
          <Card.Content>
            <Text style={styles.feeLabel}>Annual Membership Fee</Text>
            <Text style={styles.feeAmount}>₹2,500</Text>
            <Text style={styles.feeYear}>For Year {new Date().getFullYear()}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.methodCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Select Payment Method</Text>
            <RadioButton.Group
              onValueChange={(value) => setPaymentMethod(value)}
              value={paymentMethod}
            >
              <View style={styles.radioItem}>
                <RadioButton value="razorpay" />
                <Text style={styles.radioLabel}>Razorpay (Card / UPI / Net Banking)</Text>
              </View>
            </RadioButton.Group>
          </Card.Content>
        </Card>

        {paymentMethod === 'razorpay' && (
          <Card style={styles.actionCard}>
            <Card.Content>
              <View style={styles.amountBreakdown}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Membership Fee</Text>
                  <Text style={styles.breakdownValue}>₹2,500</Text>
                </View>
                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownTotal}>Total Payable</Text>
                  <Text style={styles.breakdownTotalValue}>₹2,500</Text>
                </View>
              </View>

              <Text style={styles.infoText}>
                🔒 Secured by Razorpay — Pay via UPI, Card or Net Banking
              </Text>

              <Button
                mode="contained"
                onPress={handleRazorpayPayment}
                loading={processingPayment}
                disabled={processingPayment}
                style={styles.payButton}
                buttonColor="#2196F3"
                icon="credit-card"
              >
                Pay ₹2,500
              </Button>
            </Card.Content>
          </Card>
        )}

        <Button
          mode="text"
          onPress={() => navigation.navigate('PaymentHistory')}
          style={styles.historyButton}
        >
          View Payment History
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  feeCard: { margin: 15, elevation: 3, backgroundColor: '#2196F3' },
  feeLabel: { fontSize: 16, color: '#fff', opacity: 0.9 },
  feeAmount: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginVertical: 8 },
  feeYear: { fontSize: 14, color: '#fff', opacity: 0.8 },

  methodCard: { margin: 15, marginTop: 0, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' },
  radioItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  radioLabel: { fontSize: 16, color: '#333', marginLeft: 8 },

  actionCard: { margin: 15, marginTop: 0, elevation: 2 },
  amountBreakdown: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 16, marginBottom: 16 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  breakdownLabel: { fontSize: 14, color: '#666' },
  breakdownValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  breakdownDivider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 8 },
  breakdownTotal: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  breakdownTotalValue: { fontSize: 18, fontWeight: 'bold', color: '#2196F3' },

  infoText: { fontSize: 13, color: '#666', marginBottom: 16, textAlign: 'center' },
  payButton: { paddingVertical: 6 },
  historyButton: { margin: 15 },

  webViewContainer: { flex: 1, backgroundColor: '#fff' },
  webViewHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 48,
    paddingBottom: 8, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  webViewTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  webViewLoading: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
});

export default PaymentScreen;