import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
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
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();

  const handleSignup = async () => {
    // Validation
    if (!formData.fullName || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await signup({
        ...formData,
        age: parseInt(formData.age),
      });

      if (response.success) {
        Alert.alert(
          'Success',
          'Registration successful! Pending admin approval.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert('Registration Failed', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join IME Membership</Text>
      </View>

      <TextInput
        label="Full Name *"
        value={formData.fullName}
        onChangeText={(text) => updateField('fullName', text)}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Email *"
        value={formData.email}
        onChangeText={(text) => updateField('email', text)}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        label="Password *"
        value={formData.password}
        onChangeText={(text) => updateField('password', text)}
        mode="outlined"
        secureTextEntry
        style={styles.input}
      />

      <TextInput
        label="Confirm Password *"
        value={formData.confirmPassword}
        onChangeText={(text) => updateField('confirmPassword', text)}
        mode="outlined"
        secureTextEntry
        style={styles.input}
      />

      <TextInput
        label="Contact Number"
        value={formData.contactNumber}
        onChangeText={(text) => updateField('contactNumber', text)}
        mode="outlined"
        keyboardType="phone-pad"
        style={styles.input}
      />

      <TextInput
        label="Address"
        value={formData.address}
        onChangeText={(text) => updateField('address', text)}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
      />

      <TextInput
        label="Gender"
        value={formData.gender}
        onChangeText={(text) => updateField('gender', text)}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Age"
        value={formData.age}
        onChangeText={(text) => updateField('age', text)}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        label="Date of Birth (YYYY-MM-DD)"
        value={formData.dateOfBirth}
        onChangeText={(text) => updateField('dateOfBirth', text)}
        mode="outlined"
        placeholder="2000-01-01"
        style={styles.input}
      />

      <TextInput
        label="Place"
        value={formData.place}
        onChangeText={(text) => updateField('place', text)}
        mode="outlined"
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleSignup}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Sign Up
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.navigate('Login')}
        style={styles.linkButton}
      >
        Already have an account? Login
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
  },
  linkButton: {
    marginTop: 10,
  },
});

export default SignupScreen;
