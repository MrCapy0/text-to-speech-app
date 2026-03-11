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

import { styles } from './styles';

// Sample data: array of objects with name and phrase
const INITIAL_PHRASES = [
  { id: '1', name: 'Greeting', phrase: 'Hello, how are you today?' },
  { id: '2', name: 'Farewell', phrase: 'Goodbye, see you later!' },
  { id: '3', name: 'Thanks', phrase: 'Thank you very much!' },
  { id: '4', name: 'Question', phrase: 'What is your name?' },
  { id: '5', name: 'Weather', phrase: 'The weather is nice today.' },
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

  const saveEditingPhrase = (id: string) => {
    if (editPhraseValue.trim() === '') {
      Alert.alert('Error', 'Phrase cannot be empty');
      return;
    }
    setPhrases(prev =>
      prev.map(item => (item.id === id ? { ...item, phrase: editPhraseValue } : item))
    );
    setEditingPhraseId(null);
    setEditPhraseValue('');
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

  const saveEditingName = (id: string) => {
    if (editNameValue.trim() === '') {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    setPhrases(prev =>
      prev.map(item => (item.id === id ? { ...item, name: editNameValue } : item))
    );
    setEditingNameId(null);
    setEditNameValue('');
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
          onPress: () => {
            setPhrases(prev => prev.filter(item => item.id !== id));
            // Clean up any editing state
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
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const handleGenerate = () => {
    console.log('Generate button pressed');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>Text to Speech</Text>
        <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
          <Text style={styles.generateButtonText}>Generate</Text>
        </TouchableOpacity>
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
    </SafeAreaView>
  );
}
