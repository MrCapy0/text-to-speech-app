import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const STORAGE_KEY = 'GOOGLE_API_KEY';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (apiKey: string) => void;
}

export default function SettingsModal({ visible, onClose, onSave }: SettingsModalProps) {
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(true);

    // Load settings open screen.
    useEffect(() => {
        if (visible) {
            loadSettings();
        }
    }, [visible]);

    const loadSettings = async () => {
        try {
            const savedKey = await AsyncStorage.getItem(STORAGE_KEY);
            if (savedKey !== null) {
                setApiKey(savedKey);
            }
        } catch (error) {
            console.error('Error on load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (apiKey.trim() === '') {
            Alert.alert('Error', "Error, the key can't be empty.");
            console.log("Error, key empty");
            return;
        }
        try {
            await AsyncStorage.setItem(STORAGE_KEY, apiKey.trim());
            onSave(apiKey.trim());
            Alert.alert('Success', "Settings saved!");
            onClose();
        } catch (error) {
            Alert.alert('Error', "Can't save settings.");
            console.log("Save error " + error);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Configurações</Text>
                    <Text style={styles.label}>Chave da API do Google Translate</Text>
                    <TextInput
                        style={styles.input}
                        value={apiKey}
                        onChangeText={setApiKey}
                        placeholder="Insira sua chave API"
                        autoCapitalize="none"
                        autoCorrect={false}
                        secureTextEntry // para esconder a chave enquanto digita
                    />
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.buttonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.saveButton]}
                            onPress={handleSave}
                        >
                            <Text style={styles.buttonText}>Salvar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

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