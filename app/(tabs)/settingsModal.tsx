// SettingsModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_GOOGLE_KEY = 'GOOGLE_API_KEY';
const STORAGE_IBM_KEY = 'IBM_API_KEY';
const STORAGE_IBM_URL = 'IBM_SERVICE_URL';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [ibmApiKey, setIbmApiKey] = useState('');
  const [ibmServiceUrl, setIbmServiceUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadSavedKeys();
    }
  }, [visible]);

  const loadSavedKeys = async () => {
    try {
      const [google, ibmKey, ibmUrl] = await Promise.all([
        AsyncStorage.getItem(STORAGE_GOOGLE_KEY),
        AsyncStorage.getItem(STORAGE_IBM_KEY),
        AsyncStorage.getItem(STORAGE_IBM_URL),
      ]);
      if (google) setGoogleApiKey(google);
      if (ibmKey) setIbmApiKey(ibmKey);
      if (ibmUrl) setIbmServiceUrl(ibmUrl);
    } catch (error) {
      console.error('Error loading keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!googleApiKey.trim() || !ibmApiKey.trim() || !ibmServiceUrl.trim()) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    try {
      await AsyncStorage.setItem(STORAGE_GOOGLE_KEY, googleApiKey.trim());
      await AsyncStorage.setItem(STORAGE_IBM_KEY, ibmApiKey.trim());
      await AsyncStorage.setItem(STORAGE_IBM_URL, ibmServiceUrl.trim());
      Alert.alert('Success', 'Settings saved!');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Settings</Text>

          <Text style={styles.label}>Google Translate API Key</Text>
          <TextInput
            style={styles.input}
            value={googleApiKey}
            onChangeText={setGoogleApiKey}
            placeholder="Enter Google API key"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />

          <Text style={styles.label}>IBM Watson API Key</Text>
          <TextInput
            style={styles.input}
            value={ibmApiKey}
            onChangeText={setIbmApiKey}
            placeholder="Enter IBM API key"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />

          <Text style={styles.label}>IBM Watson Service URL</Text>
          <TextInput
            style={styles.input}
            value={ibmServiceUrl}
            onChangeText={setIbmServiceUrl}
            placeholder="e.g. https://api.us-south.text-to-speech.watson.cloud.ibm.com"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Styles (same as before, but we can reuse or extend)
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
  },
});