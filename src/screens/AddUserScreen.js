import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
// import { useApp } from '../context/AppContext';
import { getRandomAvatar } from '../utils/mockData';

const AddUserScreen = ({ navigation }) => {
  // const { addContact } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: null,
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please check the form for errors');
      return;
    }

    const newContact = {
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      avatar: formData.avatar || getRandomAvatar(),
      status: 'offline',
      lastSeen: new Date(),
    };

    // addContact(newContact);
    Alert.alert('Success', 'Contact added successfully', [
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  const generateRandomAvatar = () => {
    setFormData({
      ...formData,
      avatar: getRandomAvatar(),
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          {formData.avatar ? (
            <Image source={{ uri: formData.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.randomAvatarButton}
          onPress={generateRandomAvatar}
        >
          <Icon name="casino" size={20} color="#007AFF" />
          <Text style={styles.randomAvatarText}>Generate Random Avatar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formSection}>
        <View style={styles.inputContainer}>
          <Icon name="person" size={20} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Name *"
            value={formData.name}
            onChangeText={text => setFormData({ ...formData, name: text })}
          />
        </View>
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        <View style={styles.inputContainer}>
          <Icon name="email" size={20} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email (optional)"
            value={formData.email}
            onChangeText={text => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        <View style={styles.inputContainer}>
          <Icon name="phone" size={20} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Phone (optional)"
            value={formData.phone}
            onChangeText={text => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
          />
        </View>
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Add Contact</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  avatarSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  randomAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  randomAvatarText: {
    color: '#007AFF',
    marginLeft: 8,
    fontSize: 14,
  },
  formSection: {
    backgroundColor: '#fff',
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 12,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AddUserScreen;
