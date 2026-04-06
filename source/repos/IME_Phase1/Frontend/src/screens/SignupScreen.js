import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { TextInput, Button, Menu } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';

const SignupScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    contactNumber: '',
    address: '',
    gender: '',
    age: '',
    dateOfBirth: '',
    place: '',
    designationId: 1,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [genderMenuVisible, setGenderMenuVisible] = useState(false);
  const [menuWidth, setMenuWidth] = useState(0);

  // DOB
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const { signup } = useAuth();

  // ✅ INPUT CONTROL
  const updateField = (field, value) => {
    let updatedValue = value;

    switch (field) {
      case 'fullName':
        updatedValue = value.replace(/[^A-Za-z\s]/g, '').slice(0, 150);
        break;
      case 'email':
        updatedValue = value.slice(0, 100);
        break;
      case 'contactNumber':
        updatedValue = value.replace(/[^0-9]/g, '').slice(0, 10);
        break;
      case 'age':
        updatedValue = value.replace(/[^0-9]/g, '').slice(0, 3);
        break;
      case 'address':
        updatedValue = value.replace(/[^A-Za-z0-9\s,./-]/g, '').slice(0, 250);
        break;
      case 'place':
        updatedValue = value.replace(/[^A-Za-z\s]/g, '').slice(0, 50);
        break;
      default:
        break;
    }

    setFormData((prev) => ({ ...prev, [field]: updatedValue }));
  };

  // ✅ DATE LIMITS
  const today = new Date();
  const maxDate = today;
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 80);

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // ✅ VALIDATION
  const validate = () => {
    let newErrors = {};

    if (!formData.fullName) newErrors.fullName = 'Required';

    if (!formData.email) {
      newErrors.email = 'Required';
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.(com|edu\.in|au\.in)$/.test(
        formData.email
      )
    ) {
      newErrors.email = 'Invalid email';
    }

    if (!formData.password) {
      newErrors.password = 'Required';
    } else if (
      !/^(?=.*[0-9])(?=.*[!@#$%^&*]).{6,}$/.test(formData.password)
    ) {
      newErrors.password = 'Min 6 chars, 1 number & 1 special char';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.contactNumber) {
      newErrors.contactNumber = 'Required';
    } else if (!/^[0-9]{10}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Must be 10 digits';
    }

    if (!formData.address) newErrors.address = 'Required';
    if (!formData.gender) newErrors.gender = 'Required';
    if (!formData.age) newErrors.age = 'Required';
    if (!formData.place) newErrors.place = 'Required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ SUBMIT
  const handleSignup = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = formData;

      const response = await signup({
        ...payload,
        age: parseInt(formData.age),
      });

      if (response.success) {
        Alert.alert('Success', 'Registration successful!', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        Alert.alert('Failed', response.message);
      }
    } catch {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

 return (
  <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    
    {/* HEADER */}
    <View style={styles.header}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join IME Membership</Text>
    </View>

    {/* CARD */}
    <View style={styles.card}>

      {/* FULL NAME */}
      <TextInput
        label="Full Name *"
        value={formData.fullName}
        onChangeText={(t) => updateField('fullName', t)}
        mode="outlined"
        theme={{ roundness: 10 }}
        outlineColor="#BBDEFB"
        activeOutlineColor="#1976D2"
        style={styles.input}
      />
      {errors.fullName && <Text style={styles.error}>{errors.fullName}</Text>}

      {/* EMAIL */}
      <TextInput
        label="Email *"
        value={formData.email}
        onChangeText={(t) => updateField('email', t)}
        mode="outlined"
        theme={{ roundness: 10 }}
        outlineColor="#BBDEFB"
        activeOutlineColor="#1976D2"
     
        style={styles.input}
      />
      {errors.email && <Text style={styles.error}>{errors.email}</Text>}

      {/* PASSWORD */}
      <TextInput
        label="Password *"
        value={formData.password}
        onChangeText={(t) => updateField('password', t)}
        secureTextEntry={!showPassword}
        mode="outlined"
        theme={{ roundness: 10 }}
        outlineColor="#BBDEFB"
        activeOutlineColor="#1976D2"
       
        right={
          <TextInput.Icon
            icon={showPassword ? 'eye-off' : 'eye'}
            onPress={() => setShowPassword(!showPassword)}
          />
        }
        style={styles.input}
      />
      <Text style={styles.helper}>
        Min 6 chars, include number & special character
      </Text>
      {errors.password && <Text style={styles.error}>{errors.password}</Text>}

      {/* CONFIRM PASSWORD */}
      <TextInput
        label="Confirm Password *"
        value={formData.confirmPassword}
        onChangeText={(t) => updateField('confirmPassword', t)}
        secureTextEntry={!showConfirmPassword}
        mode="outlined"
        theme={{ roundness: 10 }}
        outlineColor="#BBDEFB"
        activeOutlineColor="#1976D2"
        
        right={
          <TextInput.Icon
            icon={showConfirmPassword ? 'eye-off' : 'eye'}
            onPress={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
          />
        }
        style={styles.input}
      />
      {errors.confirmPassword && (
        <Text style={styles.error}>{errors.confirmPassword}</Text>
      )}

      {/* MOBILE */}
      <TextInput
        label="Contact Number *"
        value={formData.contactNumber}
        onChangeText={(t) => updateField('contactNumber', t)}
        keyboardType="numeric"
        mode="outlined"
        theme={{ roundness: 10 }}
        outlineColor="#BBDEFB"
        activeOutlineColor="#1976D2"
       
        style={styles.input}
      />
      {errors.contactNumber && (
        <Text style={styles.error}>{errors.contactNumber}</Text>
      )}

      {/* ADDRESS */}
      <TextInput
        label="Address *"
        value={formData.address}
        onChangeText={(t) => updateField('address', t)}
        multiline
        mode="outlined"
        theme={{ roundness: 10 }}
        outlineColor="#BBDEFB"
        activeOutlineColor="#1976D2"
    
        style={styles.input}
      />
      {errors.address && <Text style={styles.error}>{errors.address}</Text>}

      {/* GENDER */}
      <View style={{ width: '100%' }} onLayout={(e) => setMenuWidth(e.nativeEvent.layout.width)}>
        <Menu
          visible={genderMenuVisible}
          onDismiss={() => setGenderMenuVisible(false)}
          contentStyle={{ width: menuWidth }}
          anchor={
            <TouchableOpacity onPress={() => setGenderMenuVisible(true)}>
              <View pointerEvents="none">
                <TextInput
                  label="Gender *"
                  value={formData.gender}
                  mode="outlined"
                  theme={{ roundness: 10 }}
                  outlineColor="#BBDEFB"
                  activeOutlineColor="#1976D2"
                 
                  style={styles.input}
                  editable={false}
                />
              </View>
            </TouchableOpacity>
          }
        >
          <Menu.Item title="Male" onPress={() => {updateField('gender','Male'); setGenderMenuVisible(false);}}/>
          <Menu.Item title="Female" onPress={() => {updateField('gender','Female'); setGenderMenuVisible(false);}}/>
          <Menu.Item title="Transgender" onPress={() => {updateField('gender','Transgender'); setGenderMenuVisible(false);}}/>
        </Menu>
      </View>
      {errors.gender && <Text style={styles.error}>{errors.gender}</Text>}

      {/* DOB */}
      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <View pointerEvents="none">
          <TextInput
            label="Date of Birth *"
            value={formData.dateOfBirth}
            mode="outlined"
            theme={{ roundness: 10 }}
            outlineColor="#BBDEFB"
            activeOutlineColor="#1976D2"
            
            style={styles.input}
            editable={false}
          />
        </View>
      </TouchableOpacity>
      {errors.dateOfBirth && <Text style={styles.error}>{errors.dateOfBirth}</Text>}
{/* ✅ ADD THIS */}
{showDatePicker && (
  <DateTimePicker
    value={selectedDate || new Date()}
    mode="date"
    display="default"
    minimumDate={minDate}
    maximumDate={maxDate}
    onChange={(event, date) => {
      setShowDatePicker(false);
      if (event.type === 'set' && date) {
        setSelectedDate(date);
        updateField('dateOfBirth', formatDate(date));
      }
    }}
  />
)}
      {/* AGE */}
      <TextInput
        label="Age *"
        value={formData.age}
        onChangeText={(t) => updateField('age', t)}
        keyboardType="numeric"
        mode="outlined"
        theme={{ roundness: 10 }}
        outlineColor="#BBDEFB"
        activeOutlineColor="#1976D2"
        style={styles.input}
      />
      {errors.age && <Text style={styles.error}>{errors.age}</Text>}

      {/* PLACE */}
      <TextInput
        label="Place *"
        value={formData.place}
        onChangeText={(t) => updateField('place', t)}
        mode="outlined"
        theme={{ roundness: 10 }}
        outlineColor="#BBDEFB"
        activeOutlineColor="#1976D2"
       
        style={styles.input}
      />
      {errors.place && <Text style={styles.error}>{errors.place}</Text>}

      {/* BUTTON */}
      <Button
        mode="contained"
        onPress={handleSignup}
        loading={loading}
        style={styles.button}
        labelStyle={{ fontSize: 16 }}
      >
        Sign Up
      </Button>

    </View>

    <Button mode="text" onPress={() => navigation.navigate('Login')} style={styles.linkButton}>
      Already have an account? Login
    </Button>

  </ScrollView>
);
};

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#fff', }, content: { padding: 20, }, header: { alignItems: 'center', marginBottom: 25, }, title: { fontSize: 28, fontWeight: 'bold', color: '#1976D2', }, subtitle: { fontSize: 14, color: '#666', marginTop: 5, }, input: { marginBottom: 10, borderRadius: 10, }, button: { marginTop: 20, paddingVertical: 6, borderRadius: 10, backgroundColor: '#6061b4', }, linkButton: { marginTop: 10, }, error: { color: 'red', fontSize: 12, marginBottom: 8, marginLeft: 5, }, helper: { fontSize: 12, color: '#555', marginBottom: 8, marginLeft: 5, }, });

export default SignupScreen;