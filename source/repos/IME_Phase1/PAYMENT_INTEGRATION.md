# Payment Integration Guide - IME Phase 1

This document provides sample implementation for payment integration in the IME application.

## Overview

The IME application supports two payment methods for Phase 1:
1. **Razorpay Integration** - Online payment gateway
2. **QR Code Payment** - UPI/Google Pay via QR code

---

## 1. Razorpay Integration

### Backend Implementation

#### Step 1: Install Razorpay Package

```bash
cd Backend/IME.API
dotnet add package Razorpay.Api --version 1.1.2
```

#### Step 2: Add Configuration

**appsettings.json:**
```json
{
  "Razorpay": {
    "KeyId": "YOUR_RAZORPAY_KEY_ID",
    "KeySecret": "YOUR_RAZORPAY_KEY_SECRET"
  }
}
```

#### Step 3: Create Payment Controller

**Backend/IME.API/Controllers/PaymentController.cs:**

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Razorpay.Api;
using IME.Core.DTOs;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly string _razorpayKeyId;
    private readonly string _razorpayKeySecret;

    public PaymentController(IConfiguration configuration)
    {
        _razorpayKeyId = configuration["Razorpay:KeyId"];
        _razorpayKeySecret = configuration["Razorpay:KeySecret"];
    }

    [HttpPost("create-order")]
    public IActionResult CreateOrder([FromBody] PaymentOrderDTO request)
    {
        try
        {
            RazorpayClient client = new RazorpayClient(_razorpayKeyId, _razorpayKeySecret);

            Dictionary<string, object> options = new Dictionary<string, object>();
            options.Add("amount", request.Amount * 100); // Amount in paise
            options.Add("currency", "INR");
            options.Add("receipt", $"order_rcptid_{request.MemberId}");

            Order order = client.Order.Create(options);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Order created successfully",
                Data = new
                {
                    OrderId = order["id"].ToString(),
                    Amount = request.Amount,
                    Currency = "INR",
                    KeyId = _razorpayKeyId
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPost("verify-payment")]
    public async Task<IActionResult> VerifyPayment([FromBody] PaymentVerificationDTO request)
    {
        try
        {
            string signature = request.RazorpaySignature;
            string orderId = request.RazorpayOrderId;
            string paymentId = request.RazorpayPaymentId;

            // Verify signature
            string payload = $"{orderId}|{paymentId}";
            string secret = _razorpayKeySecret;

            bool isValid = Utils.VerifySignature(payload, signature, secret);

            if (isValid)
            {
                // Save payment to database
                // Update member status
                // Send notification

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Payment verified successfully"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = false,
                Message = "Payment verification failed"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }
}
```

### Frontend Implementation (React Native)

#### Step 1: Install Razorpay React Native

```bash
cd Frontend
npm install react-native-razorpay
```

#### Step 2: Create Payment Service

**Frontend/src/services/paymentService.js:**

```javascript
import api from '../utils/api';
import RazorpayCheckout from 'react-native-razorpay';

export const paymentService = {
  createOrder: async (memberId, amount) => {
    const response = await api.post('/payment/create-order', {
      memberId,
      amount,
    });
    return response.data;
  },

  verifyPayment: async (paymentDetails) => {
    const response = await api.post('/payment/verify-payment', paymentDetails);
    return response.data;
  },

  initiateRazorpayPayment: async (orderDetails, memberDetails) => {
    const options = {
      description: 'IME Membership Fee',
      image: 'https://your-logo-url.com/logo.png',
      currency: orderDetails.currency,
      key: orderDetails.keyId,
      amount: orderDetails.amount * 100,
      order_id: orderDetails.orderId,
      name: 'Institution of Municipal Engineering',
      prefill: {
        email: memberDetails.email,
        contact: memberDetails.contactNumber,
        name: memberDetails.fullName,
      },
      theme: { color: '#2196F3' },
    };

    return new Promise((resolve, reject) => {
      RazorpayCheckout.open(options)
        .then((data) => {
          resolve({
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_order_id: data.razorpay_order_id,
            razorpay_signature: data.razorpay_signature,
          });
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
};
```

#### Step 3: Create Payment Screen

**Frontend/src/screens/PaymentScreen.js:**

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { paymentService } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';

const PaymentScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [membershipFee, setMembershipFee] = useState(1000);
  const { user } = useAuth();

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Step 1: Create order
      const orderResponse = await paymentService.createOrder(
        user.memberId,
        membershipFee
      );

      if (!orderResponse.success) {
        Alert.alert('Error', orderResponse.message);
        return;
      }

      // Step 2: Initiate Razorpay payment
      const paymentData = await paymentService.initiateRazorpayPayment(
        orderResponse.data,
        user
      );

      // Step 3: Verify payment
      const verifyResponse = await paymentService.verifyPayment({
        razorpayPaymentId: paymentData.razorpay_payment_id,
        razorpayOrderId: paymentData.razorpay_order_id,
        razorpaySignature: paymentData.razorpay_signature,
        memberId: user.memberId,
        amount: membershipFee,
      });

      if (verifyResponse.success) {
        Alert.alert('Success', 'Payment completed successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', 'Payment verification failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Payment failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Membership Fee Payment</Text>
          <Text style={styles.amount}>₹{membershipFee}</Text>
          <Text style={styles.description}>
            Annual membership fee for IME
          </Text>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handlePayment}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Pay Now with Razorpay
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2196F3',
    marginVertical: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    paddingVertical: 8,
  },
});

export default PaymentScreen;
```

---

## 2. QR Code Payment Integration

### Backend Implementation

#### Create QR Code Generator

**Backend/IME.Infrastructure/Services/QRCodeService.cs:**

```csharp
using QRCoder;
using System.Drawing;
using System.Drawing.Imaging;

namespace IME.Infrastructure.Services;

public class QRCodeService
{
    public string GeneratePaymentQR(decimal amount, string upiId, string name)
    {
        // UPI payment string format
        string upiString = $"upi://pay?pa={upiId}&pn={name}&am={amount}&cu=INR";

        using (QRCodeGenerator qrGenerator = new QRCodeGenerator())
        using (QRCodeData qrCodeData = qrGenerator.CreateQrCode(upiString, QRCodeGenerator.ECCLevel.Q))
        using (QRCode qrCode = new QRCode(qrCodeData))
        using (Bitmap qrCodeImage = qrCode.GetGraphic(20))
        {
            using (MemoryStream ms = new MemoryStream())
            {
                qrCodeImage.Save(ms, ImageFormat.Png);
                byte[] byteImage = ms.ToArray();
                string base64String = Convert.ToBase64String(byteImage);
                return $"data:image/png;base64,{base64String}";
            }
        }
    }
}
```

#### Add Payment Endpoint

**Backend/IME.API/Controllers/PaymentController.cs:**

```csharp
[HttpPost("generate-qr")]
public IActionResult GenerateQRCode([FromBody] QRPaymentDTO request)
{
    try
    {
        var qrService = new QRCodeService();
        
        string qrCodeImage = qrService.GeneratePaymentQR(
            request.Amount,
            "ime@upi", // Your UPI ID
            "Institution of Municipal Engineering"
        );

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = new
            {
                QRCode = qrCodeImage,
                Amount = request.Amount,
                UpiId = "ime@upi",
                Reference = $"IME_{request.MemberId}_{DateTime.Now.Ticks}"
            }
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new ApiResponse<object>
        {
            Success = false,
            Message = $"Error: {ex.Message}"
        });
    }
}

[HttpPost("confirm-qr-payment")]
public async Task<IActionResult> ConfirmQRPayment([FromBody] QRPaymentConfirmDTO request)
{
    try
    {
        // Manually verify payment by admin
        // or integrate with payment gateway webhook
        
        // Save payment record
        // Update member status
        
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Payment recorded. Pending verification."
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new ApiResponse<object>
        {
            Success = false,
            Message = $"Error: {ex.Message}"
        });
    }
}
```

### Frontend Implementation

**Frontend/src/screens/QRPaymentScreen.js:**

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Alert } from 'react-native';
import { Button, Card, TextInput } from 'react-native-paper';
import { paymentService } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';

const QRPaymentScreen = ({ navigation }) => {
  const [qrCode, setQrCode] = useState(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [amount] = useState(1000);
  const { user } = useAuth();

  useEffect(() => {
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    try {
      const response = await paymentService.generateQR(user.memberId, amount);
      if (response.success) {
        setQrCode(response.data.qrCode);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate QR code');
    }
  };

  const confirmPayment = async () => {
    if (!transactionRef) {
      Alert.alert('Error', 'Please enter transaction reference');
      return;
    }

    setLoading(true);
    try {
      const response = await paymentService.confirmQRPayment({
        memberId: user.memberId,
        amount,
        transactionReference: transactionRef,
      });

      if (response.success) {
        Alert.alert('Success', 'Payment submitted for verification', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to confirm payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Scan QR Code to Pay</Text>
          <Text style={styles.amount}>₹{amount}</Text>

          {qrCode && (
            <View style={styles.qrContainer}>
              <Image
                source={{ uri: qrCode }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>
          )}

          <Text style={styles.instructions}>
            1. Open any UPI app (Google Pay, PhonePe, Paytm, etc.)
            {'\n'}
            2. Scan the QR code above
            {'\n'}
            3. Complete the payment
            {'\n'}
            4. Enter transaction reference below
          </Text>
        </Card.Content>
      </Card>

      <TextInput
        label="Transaction Reference / UTR Number"
        value={transactionRef}
        onChangeText={setTransactionRef}
        mode="outlined"
        style={styles.input}
        placeholder="Enter 12-digit UTR number"
      />

      <Button
        mode="contained"
        onPress={confirmPayment}
        loading={loading}
        disabled={loading || !transactionRef}
        style={styles.button}
      >
        Confirm Payment
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 20,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  qrImage: {
    width: 250,
    height: 250,
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginTop: 10,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    paddingVertical: 8,
  },
});

export default QRPaymentScreen;
```

---

## 3. Payment DTOs

Add these to **Backend/IME.Core/DTOs/CommonDTOs.cs:**

```csharp
public class PaymentOrderDTO
{
    public int MemberId { get; set; }
    public decimal Amount { get; set; }
}

public class PaymentVerificationDTO
{
    public string RazorpayPaymentId { get; set; } = string.Empty;
    public string RazorpayOrderId { get; set; } = string.Empty;
    public string RazorpaySignature { get; set; } = string.Empty;
    public int MemberId { get; set; }
    public decimal Amount { get; set; }
}

public class QRPaymentDTO
{
    public int MemberId { get; set; }
    public decimal Amount { get; set; }
}

public class QRPaymentConfirmDTO
{
    public int MemberId { get; set; }
    public decimal Amount { get; set; }
    public string TransactionReference { get; set; } = string.Empty;
}
```

---

## 4. Testing Payment Integration

### Test Mode Credentials

**Razorpay Test Mode:**
- Key ID: `rzp_test_XXXXXXXXXXXXXXX`
- Key Secret: `YOUR_TEST_KEY_SECRET`

**Test Cards:**
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

### Testing Checklist:

- [ ] Generate payment order
- [ ] Initiate payment
- [ ] Complete payment with test card
- [ ] Verify payment signature
- [ ] Save payment record in database
- [ ] Update member status
- [ ] Send notification
- [ ] QR code generation
- [ ] Manual payment confirmation

---

## 5. Production Deployment

### Before Going Live:

1. **Get Production Credentials:**
   - Sign up at https://razorpay.com
   - Complete KYC verification
   - Get production key ID and secret

2. **Update Configuration:**
   - Replace test keys with production keys
   - Update UPI ID for QR payments
   - Configure webhooks

3. **Security:**
   - Store keys in environment variables
   - Never commit keys to git
   - Use HTTPS only
   - Validate all payments server-side

4. **Testing:**
   - Test with real payments (small amounts)
   - Verify webhook functionality
   - Test refund process
   - Check payment reports

---

## Support

For payment gateway issues:
- Razorpay: https://razorpay.com/support/
- Documentation: https://razorpay.com/docs/

---

**Note:** This is a sample implementation. Adapt it according to your specific requirements and payment gateway policies.
