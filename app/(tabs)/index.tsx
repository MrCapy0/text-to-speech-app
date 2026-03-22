import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { synthesizeSpeech } from './audioService';
import * as project from './project';
import SettingsModal from './settingsModal';
import { styles } from './styles';
import { translateWithGoogle } from './translationService';

// Dados iniciais (usados apenas se não houver projetos salvos)
const INITIAL_PHRASES: project.Phrase[] = [
  { id: '1', name: 'Greeting', phrase: 'Hello, how are you today?' },
  { id: '2', name: 'Farewell', phrase: 'Goodbye, see you later!' },
];

export default function HomeScreen() {
  // Estados de projetos
  const [projects, setProjects] = useState<project.Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // Estados da UI de frases (só relevantes quando um projeto está selecionado)
  const [phrases, setPhrases] = useState<project.Phrase[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingPhraseId, setEditingPhraseId] = useState<string | null>(null);
  const [editPhraseValue, setEditPhraseValue] = useState('');
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPhrase, setNewItemPhrase] = useState('');

  // Tradução e áudio
  const [isTranslating, setIsTranslating] = useState(false);
  const [translations, setTranslations] = useState<Map<string, string>>(new Map());
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioFiles, setAudioFiles] = useState<Map<string, string>>(new Map());
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Project
  const [isNewProjectModalVisible, setIsNewProjectModalVisible] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Settings
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  // Carregar projetos do AsyncStorage ao iniciar
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const stored = await AsyncStorage.getItem('projects');
      if (stored) {
        let parsed = JSON.parse(stored);
        parsed = parsed.map((p: any) => ({
          ...p,
          sourceLanguage: p.sourceLanguage || 'pt',
          targetLanguage: p.targetLanguage || 'pt',
          voice: p.voice || 'pt-BR_CamilaNatural',
        }));
        setProjects(parsed);
      } else {
        const defaultProject: project.Project = {
          id: 'default',
          name: 'Default Project',
          phrases: INITIAL_PHRASES,
          sourceLanguage: 'pt',
          targetLanguage: 'pt',
          voice: 'pt-BR_CamilaNatural',
        };
        setProjects([defaultProject]);
        await AsyncStorage.setItem('projects', JSON.stringify([defaultProject]));
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const saveProjects = async (updatedProjects: project.Project[]) => {
    setProjects(updatedProjects);
    await AsyncStorage.setItem('projects', JSON.stringify(updatedProjects));
  };

  const createProject = async (name: string) => {
    const newProject: project.Project = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      name,
      phrases: [],
      sourceLanguage: 'pt',
      targetLanguage: 'pt',
      voice: 'pt-BR_CamilaNatural',
    };
    const updated = [...projects, newProject];
    await saveProjects(updated);
  };

  const deleteProject = async (projectId: string) => {
    // Deletar a pasta de áudio do projeto
    const projectDir = new FileSystem.Directory(
      FileSystem.Paths.document,
      `Text to Speech Project/${projectId}`
    );
    try {
      if (projectDir.exists) {
        await projectDir.delete();
      }
    } catch (error) {
      console.error('Erro ao deletar pasta do projeto:', error);
    }

    const updated = projects.filter(p => p.id !== projectId);
    await saveProjects(updated);
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
      // Limpar estados da tela de frases
      setPhrases([]);
      setTranslations(new Map());
      setAudioFiles(new Map());
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setPlayingId(null);
      }
    }
  };

  const selectProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProjectId(projectId);
      setPhrases(project.phrases);
      // Limpar dados voláteis
      setTranslations(new Map());
      setAudioFiles(new Map());
      setExpandedIds(new Set());
      if (sound) {
        sound.stopAsync();
        sound.unloadAsync();
        setSound(null);
        setPlayingId(null);
      }
    }
  };

  // Funções de áudio
  const playAudio = async (id: string, fileUri: string) => {
    if (playingId === id && sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setPlayingId(null);
      return;
    }
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
      if (playingId === id && sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setPlayingId(null);
      }
      try {
        const audioFile = new FileSystem.File(filePath);
        await audioFile.delete();
      } catch (error) {
        // Ignorar erro se arquivo não existir
      }
      setAudioFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
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

  // Funções de edição de frases (todas atualizam o projeto atual)
  const saveEditingPhrase = async (id: string) => {
    if (editPhraseValue.trim() === '') {
      Alert.alert('Error', 'Phrase cannot be empty');
      return;
    }
    const updatedPhrases = phrases.map(item =>
      item.id === id ? { ...item, phrase: editPhraseValue } : item
    );
    setPhrases(updatedPhrases);
    setEditingPhraseId(null);
    setEditPhraseValue('');
    await clearItemData(id);
    // Atualizar projeto
    if (selectedProjectId) {
      const updatedProjects = projects.map(p =>
        p.id === selectedProjectId ? { ...p, phrases: updatedPhrases } : p
      );
      await saveProjects(updatedProjects);
    }
  };

  const saveEditingName = async (id: string) => {
    if (editNameValue.trim() === '') {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    const updatedPhrases = phrases.map(item =>
      item.id === id ? { ...item, name: editNameValue } : item
    );
    setPhrases(updatedPhrases);
    setEditingNameId(null);
    setEditNameValue('');
    await clearItemData(id);
    if (selectedProjectId) {
      const updatedProjects = projects.map(p =>
        p.id === selectedProjectId ? { ...p, phrases: updatedPhrases } : p
      );
      await saveProjects(updatedProjects);
    }
  };

  const handleAddItem = async () => {
    if (newItemName.trim() === '' || newItemPhrase.trim() === '') {
      Alert.alert('Error', 'Both name and phrase are required');
      return;
    }
    const newItem: project.Phrase = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      name: newItemName.trim(),
      phrase: newItemPhrase.trim(),
    };
    const updatedPhrases = [...phrases, newItem];
    setPhrases(updatedPhrases);
    setNewItemName('');
    setNewItemPhrase('');
    setIsAddModalVisible(false);
    if (selectedProjectId) {
      const updatedProjects = projects.map(p =>
        p.id === selectedProjectId ? { ...p, phrases: updatedPhrases } : p
      );
      await saveProjects(updatedProjects);
    }
  };

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
            await deleteAudioForItem(id);
            const updatedPhrases = phrases.filter(item => item.id !== id);
            setPhrases(updatedPhrases);
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
            if (selectedProjectId) {
              const updatedProjects = projects.map(p =>
                p.id === selectedProjectId ? { ...p, phrases: updatedPhrases } : p
              );
              await saveProjects(updatedProjects);
            }
          },
        },
      ]
    );
  };

  const duplicateItem = (id: string) => {
    const itemToDuplicate = phrases.find(item => item.id === id);
    if (!itemToDuplicate) return;
    const newItem: project.Phrase = {
      ...itemToDuplicate,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    };
    const updatedPhrases = [...phrases, newItem];
    setPhrases(updatedPhrases);
    if (selectedProjectId) {
      const updatedProjects = projects.map(p =>
        p.id === selectedProjectId ? { ...p, phrases: updatedPhrases } : p
      );
      saveProjects(updatedProjects);
    }
  };

  // Outras funções auxiliares
  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
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

  const startEditingPhrase = (id: string, currentPhrase: string) => {
    setEditingNameId(null);
    setEditNameValue('');
    setEditingPhraseId(id);
    setEditPhraseValue(currentPhrase);
  };

  const cancelEditingPhrase = () => {
    setEditingPhraseId(null);
    setEditPhraseValue('');
  };

  const startEditingName = (id: string, currentName: string) => {
    setEditingPhraseId(null);
    setEditPhraseValue('');
    setEditingNameId(id);
    setEditNameValue(currentName);
  };

  const cancelEditingName = () => {
    setEditingNameId(null);
    setEditNameValue('');
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

  const handleGenerate = async () => {

    if (!selectedProjectId || phrases.length === 0) return;
    const project = projects.find(p => p.id === selectedProjectId)!;
    const { targetLanguage, voice } = project;

    setIsTranslating(true);
    const newTranslations = new Map<string, string>();

    for (const item of phrases) {
      const translated = await translateWithGoogle(item.phrase, targetLanguage);
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
          const filePath = await synthesizeSpeech(translatedText, item.name, item.id, selectedProjectId, voice);
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

  const openNewProjectModal = () => {
    setIsNewProjectModalVisible(true);
  };

  const handleCreateProject = async () => {
    if (newProjectName.trim() === '') {
      Alert.alert('Error', 'Project name cannot be empty');
      return;
    }
    await createProject(newProjectName.trim());
    setNewProjectName('');
    setIsNewProjectModalVisible(false);
  };

  const confirmDeleteProject = (projectId: string) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? All associated audio files will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteProject(projectId) },
      ]
    );
  };

  const renderItem = ({ item }: { item: project.Phrase }) => {
    const isExpanded = expandedIds.has(item.id);
    const isEditingPhrase = editingPhraseId === item.id;
    const isEditingName = editingNameId === item.id;

    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemHeader}>
          {isEditingName ? (
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
            <>
              <TouchableOpacity
                style={styles.titleContainer}
                onPress={() => toggleExpand(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.itemTitle}>{item.name}</Text>
              </TouchableOpacity>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteItem(item.id)}
                >
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => showItemMenu(item.id)}
                >
                  <Text style={styles.menuIcon}>⋮</Text>
                </TouchableOpacity>
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

  if (isLoadingProjects) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text>Loading projects...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedProjectId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.appName}>Projects</Text>
          <TouchableOpacity style={styles.addButton} onPress={openNewProjectModal}>
            <Text style={styles.addButtonText}>+ New Project</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={projects}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.projectItem}>
              <TouchableOpacity style={styles.projectName} onPress={() => selectProject(item.id)}>
                <Text style={styles.projectTitle}>{item.name}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDeleteProject(item.id)}>
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
        {/* Modal para novo projeto */}
        <Modal
          visible={isNewProjectModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsNewProjectModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>New Project</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Project name"
                value={newProjectName}
                onChangeText={setNewProjectName}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsNewProjectModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleCreateProject}
                >
                  <Text style={styles.modalButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Tela de frases do projeto selecionado
  const currentProject = projects.find(p => p.id === selectedProjectId);
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedProjectId(null)}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.appName}>{currentProject?.name || 'Project'}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.settingsButton} onPress={() => setIsSettingsVisible(true)}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.generateButton,
              (isTranslating || isGeneratingAudio) && styles.disabledButton,
            ]}
            onPress={handleGenerate}
            disabled={isTranslating || isGeneratingAudio}
          >
            <Text style={styles.generateButtonText}>
              {isTranslating ? 'Translating...' : isGeneratingAudio ? 'Generating Audio...' : 'Generate'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={phrases}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <TouchableOpacity style={styles.addButton} onPress={() => setIsAddModalVisible(true)}>
            <Text style={styles.addButtonText}>+ Add New Item</Text>
          </TouchableOpacity>
        }
      />
      <Modal visible={isAddModalVisible} transparent animationType="slide" onRequestClose={() => setIsAddModalVisible(false)}>
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
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleAddItem}>
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <SettingsModal
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
        project={selectedProjectId ? projects.find(p => p.id === selectedProjectId) : undefined}
        onProjectUpdate={async (updatedProject) => {
          // Atualiza o projeto na lista e persiste
          const updatedProjects = projects.map(p =>
            p.id === updatedProject.id ? updatedProject : p
          );
          await saveProjects(updatedProjects);
          // Se o projeto atual for o mesmo, atualiza os dados locais
          if (selectedProjectId === updatedProject.id) {
            setPhrases(updatedProject.phrases);
            // Opcional: se quiser, também pode recarregar outras configurações que dependem do idioma
            // Mas a tradução e áudio já serão afetados no próximo generate.
          }
        }}
      />
    </SafeAreaView>
  );
}