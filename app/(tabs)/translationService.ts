import { Alert } from 'react-native';

const GOOGLE_TRANSLATE_API_KEY = 'AIzaSyCBwtki7JT0Vtz4eJGpSi12-vX4_tzw5pA';
export const translateWithGoogle = async (
    text: string,
    targetLang: string = 'pt'
): Promise<string> => {
    try {
        const response = await fetch(
            `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`,
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
};