import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { synthesizeSpeech } from './audioService';
import SettingsModal from './settingsModal';
import { styles } from './styles';
import { translateWithGoogle } from './translationService';

// Sample data: array of objects with name and phrase
const INITIAL_PHRASES = [
  { id: '1', name: 'Greeting', phrase: 'Hello, how are you today?' },
  { id: '2', name: 'Farewell', phrase: 'Goodbye, see you later!' },
];

export default function HomeScreen() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  // Phrase editing
  const [editingPhraseId, setEditingPhraseId] = useState<string | null>(null);
  const [editPhraseValue, setEditPhraseValue] = useState('');
  // Name editing
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  // Data
  const [phrases, setPhrases] = useState(INITIAL_PHRASES);
  // Add new item modal
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPhrase, setNewItemPhrase] = useState('');

  // Translation.
  const [isTranslating, setIsTranslating] = useState(false);
  const [translations, setTranslations] = useState<Map<string, string>>(new Map());

  // Audio generation states
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioFiles, setAudioFiles] = useState<Map<string, string>>(new Map());

  // Settings
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  // Audio
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const playAudio = async (id: string, fileUri: string) => {
    // Se já está tocando este item, para
    if (playingId === id && sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setPlayingId(null);
      return;
    }
    // Stop this if is playing another
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setPlayingId(null);
    }
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setPlayingId(id);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setSound(null);
          setPlayingId(null);
          newSound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      Alert.alert('Erro', 'Não foi possível reproduzir o áudio');
    }
  };

  const deleteAudioForItem = async (id: string) => {
    const filePath = audioFiles.get(id);
    if (filePath) {
      try {
        await FileSystem.deleteAsync(filePath, { idempotent: true });
      } catch (error) {
        console.error('Erro ao deletar arquivo de áudio:', error);
      }
      // Remove do estado
      setAudioFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
      // Se estiver tocando, para e descarrega
      if (playingId === id && sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setPlayingId(null);
      }
    }
  };

  const clearItemData = async (id: string) => {
    await deleteAudioForItem(id);
    setTranslations(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        // If collapsing, cancel any editing for this item
        if (editingPhraseId === id) {
          setEditingPhraseId(null);
          setEditPhraseValue('');
        }
        if (editingNameId === id) {
          setEditingNameId(null);
          setEditNameValue('');
        }
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Phrase editing
  const startEditingPhrase = (id: string, currentPhrase: string) => {
    // Cancel name editing if active
    setEditingNameId(null);
    setEditNameValue('');
    setEditingPhraseId(id);
    setEditPhraseValue(currentPhrase);
  };

  const cancelEditingPhrase = () => {
    setEditingPhraseId(null);
    setEditPhraseValue('');
  };

  const saveEditingPhrase = async (id: string) => {
    if (editPhraseValue.trim() === '') {
      Alert.alert('Error', 'Phrase cannot be empty');
      return;
    }
    setPhrases(prev =>
      prev.map(item => (item.id === id ? { ...item, phrase: editPhraseValue } : item))
    );
    setEditingPhraseId(null);
    setEditPhraseValue('');
    // Limpa dados associados (tradução e áudio)
    await clearItemData(id);
  };

  // Name editing
  const startEditingName = (id: string, currentName: string) => {
    // Cancel phrase editing if active
    setEditingPhraseId(null);
    setEditPhraseValue('');
    setEditingNameId(id);
    setEditNameValue(currentName);
  };

  const cancelEditingName = () => {
    setEditingNameId(null);
    setEditNameValue('');
  };

  const saveEditingName = async (id: string) => {
    if (editNameValue.trim() === '') {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    setPhrases(prev =>
      prev.map(item => (item.id === id ? { ...item, name: editNameValue } : item))
    );
    setEditingNameId(null);
    setEditNameValue('');
    await clearItemData(id);
  };

  // Duplicate
  const duplicateItem = (id: string) => {
    const itemToDuplicate = phrases.find(item => item.id === id);
    if (!itemToDuplicate) return;

    const newItem = {
      ...itemToDuplicate,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    };

    setPhrases(prev => [...prev, newItem]);
  };

  // Delete
  const deleteItem = (id: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteAudioForItem(id); // remove arquivo físico e do estado
            setPhrases(prev => prev.filter(item => item.id !== id));
            // Limpa outros estados (expansão, edição)
            if (expandedIds.has(id)) {
              setExpandedIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
              });
            }
            if (editingPhraseId === id) {
              setEditingPhraseId(null);
              setEditPhraseValue('');
            }
            if (editingNameId === id) {
              setEditingNameId(null);
              setEditNameValue('');
            }
          },
        },
      ]
    );
  };

  const showItemMenu = (id: string) => {
    const item = phrases.find(i => i.id === id);
    if (!item) return;

    Alert.alert(
      'Item Options',
      'Choose an action',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit Name', onPress: () => startEditingName(id, item.name) },
        { text: 'Duplicate', onPress: () => duplicateItem(id) },
      ]
    );
  };

  const handleAddItem = () => {
    if (newItemName.trim() === '' || newItemPhrase.trim() === '') {
      Alert.alert('Error', 'Both name and phrase are required');
      return;
    }
    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: newItemName.trim(),
      phrase: newItemPhrase.trim(),
    };
    setPhrases(prev => [...prev, newItem]);
    setNewItemName('');
    setNewItemPhrase('');
    setIsAddModalVisible(false);
  };

  const renderItem = ({ item }: { item: typeof phrases[0] }) => {
    const isExpanded = expandedIds.has(item.id);
    const isEditingPhrase = editingPhraseId === item.id;
    const isEditingName = editingNameId === item.id;

    return (
      <View style={styles.itemContainer}>
        {/* Header */}
        <View style={styles.itemHeader}>
          {isEditingName ? (
            // Name editing UI
            <View style={styles.nameEditContainer}>
              <TextInput
                style={styles.nameEditInput}
                value={editNameValue}
                onChangeText={setEditNameValue}
                autoFocus
                placeholder="Enter name"
              />
              <View style={styles.nameEditActions}>
                <TouchableOpacity
                  style={[styles.nameEditButton, styles.saveNameButton]}
                  onPress={() => saveEditingName(item.id)}
                >
                  <Text style={styles.nameEditButtonText}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nameEditButton, styles.cancelNameButton]}
                  onPress={cancelEditingName}
                >
                  <Text style={styles.nameEditButtonText}>✗</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Normal header
            <>
              <TouchableOpacity
                style={styles.titleContainer}
                onPress={() => toggleExpand(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.itemTitle}>{item.name}</Text>
              </TouchableOpacity>
              <View style={styles.headerActions}>
                {/* Delete button (trash icon) */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteItem(item.id)}
                >
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
                {/* 3-dot menu button */}
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => showItemMenu(item.id)}
                >
                  <Text style={styles.menuIcon}>⋮</Text>
                </TouchableOpacity>
                {/* Expand/collapse button */}
                <TouchableOpacity
                  onPress={() => toggleExpand(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.expandIcon}>{isExpanded ? '▼' : '►'}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Expanded content */}
        {isExpanded && (
          <View style={styles.itemContent}>
            {isEditingPhrase ? (
              <View>
                <TextInput
                  style={styles.editInput}
                  value={editPhraseValue}
                  onChangeText={setEditPhraseValue}
                  multiline
                  autoFocus
                  placeholder="Enter phrase"
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={[styles.editButton, styles.saveButton]}
                    onPress={() => saveEditingPhrase(item.id)}
                  >
                    <Text style={styles.editButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editButton, styles.cancelButton]}
                    onPress={cancelEditingPhrase}
                  >
                    <Text style={styles.editButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.itemPhrase}>{item.phrase}</Text>
                <TouchableOpacity
                  style={styles.editPhraseButton}
                  onPress={() => startEditingPhrase(item.id, item.phrase)}
                >
                  <Text style={styles.editPhraseButtonText}>Edit</Text>
                </TouchableOpacity>
                {translations.has(item.id) && (
                  <Text style={styles.translatedText}>"{translations.get(item.id)}"</Text>
                )}
                {audioFiles.has(item.id) && (
                  <TouchableOpacity
                    style={styles.audioButton}
                    onPress={() => playAudio(item.id, audioFiles.get(item.id)!)}
                  >
                    <Text style={styles.audioButtonText}>
                      {playingId === item.id ? '⏹️ Stop' : '▶️ Play'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const handleGenerate = async () => {
    if (phrases.length === 0) return;
    setIsTranslating(true);
    const targetLanguage = 'pt';
    const newTranslations = new Map<string, string>();

    for (const item of phrases) {
      const translated = await translateWithGoogle(item.phrase);
      newTranslations.set(item.id, translated);
    }

    setTranslations(newTranslations);
    setIsTranslating(false);

    setIsGeneratingAudio(true);
    const newAudioFiles = new Map<string, string>();

    for (const item of phrases) {
      const translatedText = newTranslations.get(item.id);
      if (translatedText) {
        try {
          const filePath = await synthesizeSpeech(translatedText, item.name, item.id);
          newAudioFiles.set(item.id, filePath);
        } catch (error) {
          console.error(`Audio generation failed for ${item.name}:`, error);
          Alert.alert('Error', `Failed to generate audio for "${item.name}". Check your IBM credentials.`);
        }
      }
    }

    setAudioFiles(newAudioFiles);
    setIsGeneratingAudio(false);
    Alert.alert('Success', 'Translation and audio generation completed!');
  };

  const handleApiKeySaved = () => {
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>Text to Speech</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setIsSettingsVisible(true)}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.generateButton,
              (isTranslating || isGeneratingAudio) && styles.disabledButton
            ]}
            onPress={handleGenerate}
            disabled={isTranslating || isGeneratingAudio}
          >
            <Text style={styles.generateButtonText}>
              {isTranslating
                ? 'Translating...'
                : isGeneratingAudio
                  ? 'Generating Audio...'
                  : 'Generate'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={phrases}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsAddModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+ Add New Item</Text>
          </TouchableOpacity>
        }
      />

      {/* Add Item Modal */}
      <Modal
        visible={isAddModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Item</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Name"
              value={newItemName}
              onChangeText={setNewItemName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Phrase"
              value={newItemPhrase}
              onChangeText={setNewItemPhrase}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setIsAddModalVisible(false);
                  setNewItemName('');
                  setNewItemPhrase('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddItem}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <SettingsModal
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
      />
    </SafeAreaView >
  );
}
