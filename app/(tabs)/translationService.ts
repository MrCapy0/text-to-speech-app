import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const STORAGE_KEY = 'GOOGLE_API_KEY';

export const translateWithGoogle = async (
    text: string,
    targetLang: string = 'pt'
): Promise<string> => {

    try {
        const apiKey = await AsyncStorage.getItem(STORAGE_KEY);
        if (!apiKey) {
            Alert.alert('Erro', 'Chave da API não configurada. Acesse as configurações.');
            return text;
        }

        try {
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
            console.error(`translation error on ${text}`, error);
            Alert.alert('Error', `can't translate ${text}`);
            return text; // Return original text if fail.
        }
    }
    catch (error) {
        Alert.alert("Load settings error: " + error);
        return text;
    }
};