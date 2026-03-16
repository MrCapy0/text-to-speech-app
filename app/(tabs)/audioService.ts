import AsyncStorage from '@react-native-async-storage/async-storage';
import { fromByteArray } from 'base64-js'; // Para codificação segura
import * as FileSystem from 'expo-file-system';

const STORAGE_IBM_KEY = 'IBM_API_KEY';
const STORAGE_IBM_URL = 'IBM_SERVICE_URL';

const AUDIO_DIR = new FileSystem.Directory(
    FileSystem.Paths.document,
    'Text to Speech Project'
);

async function ensureDirectoryExists() {
    if (!AUDIO_DIR.exists) {
        await AUDIO_DIR.create({ intermediates: true });
    }
}

/**
 * Codifica uma string para Base64 de forma segura (funciona com caracteres especiais)
 */
function encodeBase64(str: string): string {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    return fromByteArray(bytes);
}

/**
 * Testa a autenticação listando as vozes disponíveis (GET)
 */
export async function testAuth(): Promise<boolean> {
    try {
        const apiKey = await AsyncStorage.getItem(STORAGE_IBM_KEY);
        const serviceUrl = await AsyncStorage.getItem(STORAGE_IBM_URL);
        if (!apiKey || !serviceUrl) return false;

        const authString = 'apikey:' + apiKey;
        const auth = 'Basic ' + encodeBase64(authString);

        const response = await fetch(serviceUrl + '/v1/voices', {
            method: 'GET',
            headers: {
                'Authorization': auth,
            },
        });

        return response.ok;
    } catch (error) {
        console.error('Auth test failed:', error);
        return false;
    }
}

// audioService.ts (partes modificadas)
export async function synthesizeSpeech(
    text: string,
    name: string,
    itemId: string,
    voice: string = 'en-US_MichaelV3Voice'
): Promise<string> {
    const apiKey = await AsyncStorage.getItem(STORAGE_IBM_KEY);
    const serviceUrl = await AsyncStorage.getItem(STORAGE_IBM_URL);

    if (!apiKey || !serviceUrl) {
        throw new Error('IBM Watson credentials not configured.');
    }

    await ensureDirectoryExists();

    // Codifica a autenticação com base64-js
    const authString = 'apikey:' + apiKey;
    const auth = 'Basic ' + encodeBase64(authString);

    const url = `${serviceUrl}/v1/synthesize?voice=${encodeURIComponent(voice)}&text=${encodeURIComponent(text)}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'audio/mp3',
            'Authorization': auth,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`IBM TTS error (${response.status}): ${errorText}`);
    }

    const audioData = await response.arrayBuffer();
    const uint8Array = new Uint8Array(audioData);

    const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${safeName}_${itemId}.mp3`;
    const audioFile = new FileSystem.File(AUDIO_DIR.uri, fileName);

    await audioFile.write(uint8Array);
    console.log("Saved on: " + audioFile.uri);
    return audioFile.uri;
}