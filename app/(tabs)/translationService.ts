// translationService.ts
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_GOOGLE_KEY = 'GOOGLE_API_KEY';
const STORAGE_TARGET_LANG = 'TARGET_LANGUAGE';

export const translateWithGoogle = async (text: string): Promise<string> => {
  try {
    const apiKey = await AsyncStorage.getItem(STORAGE_GOOGLE_KEY);
    if (!apiKey) {
      Alert.alert('Erro', 'Chave da API Google não configurada. Acesse as configurações.');
      return text;
    }

    const targetLang = await AsyncStorage.getItem(STORAGE_TARGET_LANG) || 'en';

    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          target: targetLang,
          format: 'text',
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.data.translations[0].translatedText;
  } catch (error) {
    console.error('Erro na tradução:', error);
    Alert.alert('Erro', 'Não foi possível traduzir o texto');
    return text;
  }
};