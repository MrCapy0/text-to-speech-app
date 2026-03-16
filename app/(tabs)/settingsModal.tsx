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
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Definição dos tipos
type LanguageKey = 'en' | 'pt' | 'es';

interface VoiceOption {
  label: string;
  value: string;
}

// Chaves para armazenamento
const STORAGE_GOOGLE_KEY = 'GOOGLE_API_KEY';
const STORAGE_IBM_KEY = 'IBM_API_KEY';
const STORAGE_IBM_URL = 'IBM_SERVICE_URL';
const STORAGE_SOURCE_LANG = 'SOURCE_LANGUAGE';
const STORAGE_TARGET_LANG = 'TARGET_LANGUAGE';
const STORAGE_VOICE = 'VOICE';

// Opções de idiomas (com tipo seguro)
const languages: { label: string; value: LanguageKey }[] = [
  { label: 'Português', value: 'pt' },
  { label: 'Inglês', value: 'en' },
  { label: 'Espanhol', value: 'es' },
];

// Vozes por idioma alvo (mapeamento tipo seguro)
const voicesByTarget: Record<LanguageKey, VoiceOption[]> = {
  en: [
    { label: 'Australian Heidi', value: 'en-AU_HeidiNatural' },
    { label: 'Australian Jack', value: 'en-AU_JackNatural' },
    { label: 'Canadian Hannah', value: 'en-CA_HannahNatural' },
    { label: 'British Chloe', value: 'en-GB_ChloeNatural' },
    { label: 'EUA Ellie', value: 'en-US_EllieNatural' },
    { label: 'EUA Emma', value: 'en-US_EmmaNatural' },
    { label: 'EUA Ethan', value: 'en-US_EthanNatural' },
    { label: 'EUA Jackson', value: 'en-US_JacksonNatural' },
    { label: 'EUA Victoria', value: 'en-US_VictoriaNatural' },
  ],
  pt: [
    { label: 'Brasil Lucas', value: 'pt-BR_LucasNatural' },
    { label: 'Brasil Camila', value: 'pt-BR_CamilaNatural' },
  ],
  es: [
    { label: 'Latino Alejandro', value: 'es-LA_AlejandroNatural' },
    { label: 'Latino Daniela', value: 'es-LA_DanielaNatural' },
  ],
};

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [ibmApiKey, setIbmApiKey] = useState('');
  const [ibmServiceUrl, setIbmServiceUrl] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState<LanguageKey>('pt');
  const [targetLanguage, setTargetLanguage] = useState<LanguageKey>('pt');
  const [voice, setVoice] = useState<string>('pt-BR_CamilaNatural');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadSavedSettings();
    }
  }, [visible]);

  const loadSavedSettings = async () => {
    try {
      const [
        google,
        ibmKey,
        ibmUrl,
        source,
        target,
        savedVoice,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_GOOGLE_KEY),
        AsyncStorage.getItem(STORAGE_IBM_KEY),
        AsyncStorage.getItem(STORAGE_IBM_URL),
        AsyncStorage.getItem(STORAGE_SOURCE_LANG),
        AsyncStorage.getItem(STORAGE_TARGET_LANG),
        AsyncStorage.getItem(STORAGE_VOICE),
      ]);
      if (google) setGoogleApiKey(google);
      if (ibmKey) setIbmApiKey(ibmKey);
      if (ibmUrl) setIbmServiceUrl(ibmUrl);
      // Valida se o valor carregado é uma chave válida, senão usa padrão
      if (source && languages.some(l => l.value === source)) {
        setSourceLanguage(source as LanguageKey);
      }
      if (target && languages.some(l => l.value === target)) {
        setTargetLanguage(target as LanguageKey);
      }
      if (savedVoice) setVoice(savedVoice);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Quando o idioma alvo muda, ajusta a voz para a primeira disponível se a atual não for compatível
  useEffect(() => {
    const availableVoices = voicesByTarget[targetLanguage] || [];
    if (availableVoices.length > 0 && !availableVoices.some(v => v.value === voice)) {
      setVoice(availableVoices[0].value);
    }
  }, [targetLanguage, voice]);

  const handleSave = async () => {
    if (!googleApiKey.trim() || !ibmApiKey.trim() || !ibmServiceUrl.trim()) {
      Alert.alert('Error', 'All API fields are required.');
      return;
    }

    try {
      await AsyncStorage.setItem(STORAGE_GOOGLE_KEY, googleApiKey.trim());
      await AsyncStorage.setItem(STORAGE_IBM_KEY, ibmApiKey.trim());
      await AsyncStorage.setItem(STORAGE_IBM_URL, ibmServiceUrl.trim());
      await AsyncStorage.setItem(STORAGE_SOURCE_LANG, sourceLanguage);
      await AsyncStorage.setItem(STORAGE_TARGET_LANG, targetLanguage);
      await AsyncStorage.setItem(STORAGE_VOICE, voice);
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

          {/* Project Section */}
          <Text style={styles.sectionTitle}>Project</Text>

          <Text style={styles.label}>Source Language</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={sourceLanguage}
              onValueChange={(itemValue) => setSourceLanguage(itemValue as LanguageKey)}
              style={styles.picker}
            >
              {languages.map(lang => (
                <Picker.Item key={lang.value} label={lang.label} value={lang.value} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Target Language</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={targetLanguage}
              onValueChange={(itemValue) => setTargetLanguage(itemValue as LanguageKey)}
              style={styles.picker}
            >
              {languages.map(lang => (
                <Picker.Item key={lang.value} label={lang.label} value={lang.value} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Voice</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={voice}
              onValueChange={(itemValue) => setVoice(itemValue)}
              style={styles.picker}
            >
              {(voicesByTarget[targetLanguage] || []).map(v => (
                <Picker.Item key={v.value} label={v.label} value={v.value} />
              ))}
            </Picker>
          </View>

          {/* API Section */}
          <Text style={styles.sectionTitle}>API Keys</Text>

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

// Styles (mantidos iguais)
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
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    color: '#333',
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
    width: '100%',
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