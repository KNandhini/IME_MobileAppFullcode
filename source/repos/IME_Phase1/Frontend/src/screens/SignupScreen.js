import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  TouchableOpacity, Modal,
} from 'react-native';
import { TextInput, Button, Menu } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../utils/api';

const SignupScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    contactNumber: '', address: '', gender: '', age: '',
    dateOfBirth: '', place: '', designationId: 1,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [genderMenuVisible, setGenderMenuVisible] = useState(false);
  const [menuWidth, setMenuWidth] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const [welcomeVisible, setWelcomeVisible] = useState(true);
  const [currentFee, setCurrentFee] = useState(null);

  useEffect(() => {
    fetchFee();
  }, []);

  const fetchFee = async () => {
    try {
      const res = await api.get('/payment/latest-fee');
      if (res.data.success) setCurrentFee(res.data.data);
    } catch (e) {
      console.warn('Fee fetch failed:', e.message);
    }
  };

  const updateField = (field, value) => {
    let v = value;
    if (field === 'fullName') v = value.replace(/[^A-Za-z\s]/g, '').slice(0, 150);
    else if (field === 'email') v = value.slice(0, 100);
    else if (field === 'contactNumber') v = value.replace(/[^0-9]/g, '').slice(0, 10);
    else if (field === 'age') v = value.replace(/[^0-9]/g, '').slice(0, 3);
    else if (field === 'address') v = value.replace(/[^A-Za-z0-9\s,./-]/g, '').slice(0, 250);
    else if (field === 'place') v = value.replace(/[^A-Za-z\s]/g, '').slice(0, 50);
    setFormData((prev) => ({ ...prev, [field]: v }));
  };

  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 80);

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const validate = () => {
    let e = {};
    if (!formData.fullName) e.fullName = 'Required';
    if (!formData.email) e.email = 'Required';
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(formData.email)) e.email = 'Invalid email';
    if (!formData.password) e.password = 'Required';
    else if (!/^(?=.*[0-9])(?=.*[!@#$%^&*]).{6,}$/.test(formData.password)) e.password = 'Min 6 chars, 1 number & 1 special char';
    if (!formData.confirmPassword) e.confirmPassword = 'Required';
    else if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!formData.contactNumber) e.contactNumber = 'Required';
    else if (!/^[0-9]{10}$/.test(formData.contactNumber)) e.contactNumber = 'Must be 10 digits';
    if (!formData.address) e.address = 'Required';
    if (!formData.gender) e.gender = 'Required';
    if (!formData.age) e.age = 'Required';
    if (!formData.place) e.place = 'Required';
    if (!formData.dateOfBirth) e.dateOfBirth = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = formData;
      const response = await api.post('/Auth/signup', { ...payload, age: parseInt(formData.age) });
      const res = response.data;
      if (res.success) {
        navigation.navigate('RegistrationPayment', {
          userId: res.data.userId,
          memberId: res.data.memberId,
          feeAmount: currentFee ? parseFloat(currentFee.amount) : 0,
          memberName: formData.fullName,
        });
      } else {
        Alert.alert('Failed', res.message);
      }
    } catch {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Welcome Modal */}
      <Modal visible={welcomeVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Welcome to IME</Text>
            <Text style={styles.modalSubtitle}>Member Registration</Text>
            <Text style={styles.modalBody}>
              To join as an IME member, please complete the registration form and pay the annual membership fee.
            </Text>
            {currentFee ? (
              <View style={styles.feeBox}>
                <Text style={styles.feeLabel}>Annual Membership Fee</Text>
                <Text style={styles.feeAmount}>₹{parseFloat(currentFee.amount).toFixed(2)}</Text>
              </View>
            ) : (
              <Text style={styles.noFee}>No fee currently set. Contact admin.</Text>
            )}
            <TouchableOpacity style={styles.proceedBtn} onPress={() => setWelcomeVisible(false)}>
              <Text style={styles.proceedBtnText}>Proceed to Register</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.backLink}>Already a member? Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join IME Membership</Text>
      </View>

      <View style={styles.card}>
        <TextInput label="Full Name *" value={formData.fullName} onChangeText={(t) => updateField('fullName', t)}
          mode="outlined" theme={{ roundness: 10 }} outlineColor="#BBDEFB" activeOutlineColor="#1976D2" style={styles.input} />
        {errors.fullName && <Text style={styles.error}>{errors.fullName}</Text>}

        <TextInput label="Email *" value={formData.email} onChangeText={(t) => updateField('email', t)}
          mode="outlined" theme={{ roundness: 10 }} outlineColor="#BBDEFB" activeOutlineColor="#1976D2" style={styles.input} />
        {errors.email && <Text style={styles.error}>{errors.email}</Text>}

        <TextInput label="Password *" value={formData.password} onChangeText={(t) => updateField('password', t)}
          secureTextEntry={!showPassword} mode="outlined" theme={{ roundness: 10 }}
          outlineColor="#BBDEFB" activeOutlineColor="#1976D2"
          right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(!showPassword)} />}
          style={styles.input} />
        <Text style={styles.helper}>Min 6 chars, include number & special character</Text>
        {errors.password && <Text style={styles.error}>{errors.password}</Text>}

        <TextInput label="Confirm Password *" value={formData.confirmPassword} onChangeText={(t) => updateField('confirmPassword', t)}
          secureTextEntry={!showConfirmPassword} mode="outlined" theme={{ roundness: 10 }}
          outlineColor="#BBDEFB" activeOutlineColor="#1976D2"
          right={<TextInput.Icon icon={showConfirmPassword ? 'eye-off' : 'eye'} onPress={() => setShowConfirmPassword(!showConfirmPassword)} />}
          style={styles.input} />
        {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword}</Text>}

        <TextInput label="Contact Number *" value={formData.contactNumber} onChangeText={(t) => updateField('contactNumber', t)}
          keyboardType="numeric" mode="outlined" theme={{ roundness: 10 }}
          outlineColor="#BBDEFB" activeOutlineColor="#1976D2" style={styles.input} />
        {errors.contactNumber && <Text style={styles.error}>{errors.contactNumber}</Text>}

        <TextInput label="Address *" value={formData.address} onChangeText={(t) => updateField('address', t)}
          multiline mode="outlined" theme={{ roundness: 10 }}
          outlineColor="#BBDEFB" activeOutlineColor="#1976D2" style={styles.input} />
        {errors.address && <Text style={styles.error}>{errors.address}</Text>}

        <View style={{ width: '100%' }} onLayout={(e) => setMenuWidth(e.nativeEvent.layout.width)}>
          <Menu visible={genderMenuVisible} onDismiss={() => setGenderMenuVisible(false)}
            contentStyle={{ width: menuWidth }}
            anchor={
              <TouchableOpacity onPress={() => setGenderMenuVisible(true)}>
                <View pointerEvents="none">
                  <TextInput label="Gender *" value={formData.gender} mode="outlined"
                    theme={{ roundness: 10 }} outlineColor="#BBDEFB" activeOutlineColor="#1976D2"
                    style={styles.input} editable={false} />
                </View>
              </TouchableOpacity>
            }>
            <Menu.Item title="Male" onPress={() => { updateField('gender', 'Male'); setGenderMenuVisible(false); }} />
            <Menu.Item title="Female" onPress={() => { updateField('gender', 'Female'); setGenderMenuVisible(false); }} />
            <Menu.Item title="Transgender" onPress={() => { updateField('gender', 'Transgender'); setGenderMenuVisible(false); }} />
          </Menu>
        </View>
        {errors.gender && <Text style={styles.error}>{errors.gender}</Text>}

        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <View pointerEvents="none">
            <TextInput label="Date of Birth *" value={formData.dateOfBirth} mode="outlined"
              theme={{ roundness: 10 }} outlineColor="#BBDEFB" activeOutlineColor="#1976D2"
              style={styles.input} editable={false} />
          </View>
        </TouchableOpacity>
        {errors.dateOfBirth && <Text style={styles.error}>{errors.dateOfBirth}</Text>}
        {showDatePicker && (
          <DateTimePicker value={selectedDate || new Date()} mode="date" display="default"
            minimumDate={minDate} maximumDate={today}
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (event.type === 'set' && date) {
                setSelectedDate(date);
                updateField('dateOfBirth', formatDate(date));
              }
            }} />
        )}

        <TextInput label="Age *" value={formData.age} onChangeText={(t) => updateField('age', t)}
          keyboardType="numeric" mode="outlined" theme={{ roundness: 10 }}
          outlineColor="#BBDEFB" activeOutlineColor="#1976D2" style={styles.input} />
        {errors.age && <Text style={styles.error}>{errors.age}</Text>}

        <TextInput label="Place *" value={formData.place} onChangeText={(t) => updateField('place', t)}
          mode="outlined" theme={{ roundness: 10 }} outlineColor="#BBDEFB" activeOutlineColor="#1976D2" style={styles.input} />
        {errors.place && <Text style={styles.error}>{errors.place}</Text>}

        <Button mode="contained" onPress={handleSignup} loading={loading} style={styles.button} labelStyle={{ fontSize: 16 }}>
          Proceed to Payment
        </Button>
      </View>

      <Button mode="text" onPress={() => navigation.navigate('Login')} style={styles.linkButton}>
        Already have an account? Login
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#fff' },
  content:        { padding: 20 },
  header:         { alignItems: 'center', marginBottom: 25 },
  title:          { fontSize: 28, fontWeight: 'bold', color: '#1976D2' },
  subtitle:       { fontSize: 14, color: '#666', marginTop: 5 },
  input:          { marginBottom: 10, borderRadius: 10 },
  button:         { marginTop: 20, paddingVertical: 6, borderRadius: 10, backgroundColor: '#1E3A5F' },
  linkButton:     { marginTop: 10 },
  error:          { color: 'red', fontSize: 12, marginBottom: 8, marginLeft: 5 },
  helper:         { fontSize: 12, color: '#555', marginBottom: 8, marginLeft: 5 },
  // Welcome Modal
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox:       { backgroundColor: '#fff', borderRadius: 16, padding: 28, width: '100%', alignItems: 'center' },
  modalTitle:     { fontSize: 24, fontWeight: 'bold', color: '#1E3A5F', marginBottom: 4 },
  modalSubtitle:  { fontSize: 14, color: '#666', marginBottom: 16 },
  modalBody:      { fontSize: 14, color: '#444', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  feeBox:         { backgroundColor: '#1E3A5F', borderRadius: 12, padding: 20, alignItems: 'center', width: '100%', marginBottom: 20 },
  feeLabel:       { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  feeAmount:      { color: '#D4A017', fontSize: 32, fontWeight: 'bold', marginTop: 4 },
  noFee:          { color: '#999', fontSize: 13, marginBottom: 20 },
  proceedBtn:     { backgroundColor: '#1E3A5F', borderRadius: 10, padding: 14, width: '100%', alignItems: 'center', marginBottom: 12 },
  proceedBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backLink:       { color: '#1976D2', fontSize: 14 },
});

export default SignupScreen;
