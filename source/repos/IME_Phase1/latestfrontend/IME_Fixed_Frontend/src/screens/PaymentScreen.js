import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Button, Card, RadioButton, TextInput } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { paymentService } from '../services/paymentService';

const PaymentScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [currentFee, setCurrentFee] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [qrCode, setQrCode] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [memberId, setMemberId] = useState(null);

  useEffect(() => {
    loadMemberAndFee();
  }, []);

  const loadMemberAndFee = async () => {
    setLoading(true);
    try {
      const userStr = await AsyncStorage.getItem('userData');
      if (userStr) {
        const user = JSON.parse(userStr);
        setMemberId(user.memberId);
      }

      const response = await paymentService.getCurrentFee();
      if (response.success) {
        setCurrentFee(response.data);
      }
    } catch (error) {
      console.error('Failed to load fee:', error);
      Alert.alert('Error', 'Failed to load current fee information');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!memberId) {
      Alert.alert('Error', 'Member information not found');
      return;
    }

    setProcessingPayment(true);
    try {
      const response = await paymentService.generateQR({
        memberId,
        amount: currentFee?.feeAmount || 0,
      });

      if (response.success) {
        setQrCode(response.data);
        setPaymentMethod('qr');
      } else {
        Alert.alert('Error', response.message || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('Failed to generate QR:', error);
      Alert.alert('Error', 'Failed to generate QR code');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleConfirmQRPayment = async () => {
    if (!transactionId.trim()) {
      Alert.alert('Error', 'Please enter transaction ID');
      return;
    }

    if (!qrCode?.paymentRequestId) {
      Alert.alert('Error', 'QR code information not found');
      return;
    }

    setProcessingPayment(true);
    try {
      const response = await paymentService.confirmQRPayment({
        paymentRequestId: qrCode.paymentRequestId,
        transactionId: transactionId.trim(),
      });

      if (response.success) {
        Alert.alert('Success', 'Payment submitted for verification', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('PaymentHistory'),
          },
        ]);
        setQrCode(null);
        setTransactionId('');
      } else {
        Alert.alert('Error', response.message || 'Failed to confirm payment');
      }
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      Alert.alert('Error', 'Failed to confirm payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (!memberId) {
      Alert.alert('Error', 'Member information not found');
      return;
    }

    setProcessingPayment(true);
    try {
      const response = await paymentService.createOrder({
        memberId,
        amount: currentFee?.feeAmount || 0,
        description: `Annual Membership Fee ${new Date().getFullYear()}`,
      });

      if (response.success) {
        // In production, integrate with Razorpay SDK
        // For now, show order details
        Alert.alert(
          'Razorpay Integration',
          'In production, this would open Razorpay payment gateway.\n\nOrder ID: ' +
            response.data.orderId,
          [
            {
              text: 'Simulate Success',
              onPress: () => simulateRazorpaySuccess(response.data),
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      Alert.alert('Error', 'Failed to create payment order');
    } finally {
      setProcessingPayment(false);
    }
  };

  const simulateRazorpaySuccess = async (orderData) => {
    try {
      const response = await paymentService.verifyPayment({
        orderId: orderData.orderId,
        paymentId: 'pay_' + Date.now(),
        signature: 'signature_' + Date.now(),
      });

      if (response.success) {
        Alert.alert('Success', 'Payment successful!', [
          {
            text: 'View History',
            onPress: () => navigation.navigate('PaymentHistory'),
          },
          { text: 'OK' },
        ]);
      }
    } catch (error) {
      console.error('Failed to verify payment:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.feeCard}>
        <Card.Content>
          <Text style={styles.feeLabel}>Annual Membership Fee</Text>
          <Text style={styles.feeAmount}>
            ₹{currentFee?.feeAmount?.toLocaleString('en-IN') || '0'}
          </Text>
          <Text style={styles.feeYear}>For Year {currentFee?.year || ''}</Text>
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
              <Text style={styles.radioLabel}>Razorpay (Card/UPI/Net Banking)</Text>
            </View>
            <View style={styles.radioItem}>
              <RadioButton value="qr" />
              <Text style={styles.radioLabel}>UPI QR Code</Text>
            </View>
          </RadioButton.Group>
        </Card.Content>
      </Card>

      {paymentMethod === 'razorpay' && (
        <Card style={styles.actionCard}>
          <Card.Content>
            <Text style={styles.infoText}>
              You will be redirected to Razorpay secure payment gateway
            </Text>
            <Button
              mode="contained"
              onPress={handleRazorpayPayment}
              loading={processingPayment}
              disabled={processingPayment}
              style={styles.payButton}
            >
              Pay ₹{currentFee?.feeAmount?.toLocaleString('en-IN') || '0'}
            </Button>
          </Card.Content>
        </Card>
      )}

      {paymentMethod === 'qr' && !qrCode && (
        <Card style={styles.actionCard}>
          <Card.Content>
            <Text style={styles.infoText}>
              Generate QR code to pay using any UPI app
            </Text>
            <Button
              mode="contained"
              onPress={handleGenerateQR}
              loading={processingPayment}
              disabled={processingPayment}
              style={styles.payButton}
            >
              Generate QR Code
            </Button>
          </Card.Content>
        </Card>
      )}

      {paymentMethod === 'qr' && qrCode && (
        <Card style={styles.qrCard}>
          <Card.Content>
            <Text style={styles.qrTitle}>Scan QR Code to Pay</Text>
            {qrCode.qrCodeBase64 && (
              <View style={styles.qrImageContainer}>
                <Image
                  source={{ uri: `data:image/png;base64,${qrCode.qrCodeBase64}` }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
            )}
            <Text style={styles.qrAmount}>
              Amount: ₹{qrCode.amount?.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.qrUpi}>UPI ID: {qrCode.upiId}</Text>

            <View style={styles.transactionInput}>
              <TextInput
                label="Enter Transaction ID"
                value={transactionId}
                onChangeText={setTransactionId}
                mode="outlined"
                placeholder="e.g., 123456789012"
                style={styles.input}
              />
              <Text style={styles.inputHint}>
                After payment, enter the transaction ID from your UPI app
              </Text>
            </View>

            <Button
              mode="contained"
              onPress={handleConfirmQRPayment}
              loading={processingPayment}
              disabled={processingPayment || !transactionId.trim()}
              style={styles.confirmButton}
            >
              Confirm Payment
            </Button>

            <Button
              mode="outlined"
              onPress={() => {
                setQrCode(null);
                setTransactionId('');
              }}
              disabled={processingPayment}
              style={styles.cancelButton}
            >
              Cancel
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feeCard: {
    margin: 15,
    elevation: 3,
    backgroundColor: '#2196F3',
  },
  feeLabel: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  feeAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 8,
  },
  feeYear: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  methodCard: {
    margin: 15,
    marginTop: 0,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  actionCard: {
    margin: 15,
    marginTop: 0,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  payButton: {
    paddingVertical: 6,
  },
  qrCard: {
    margin: 15,
    marginTop: 0,
    elevation: 2,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  qrImageContainer: {
    alignItems: 'center',
    marginVertical: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  qrImage: {
    width: 250,
    height: 250,
  },
  qrAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2196F3',
    marginTop: 8,
  },
  qrUpi: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
  },
  transactionInput: {
    marginTop: 20,
  },
  input: {
    backgroundColor: '#fff',
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  confirmButton: {
    marginTop: 16,
    paddingVertical: 6,
  },
  cancelButton: {
    marginTop: 8,
  },
  historyButton: {
    margin: 15,
  },
});

export default PaymentScreen;
