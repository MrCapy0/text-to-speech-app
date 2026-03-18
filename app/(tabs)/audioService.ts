import AsyncStorage from '@react-native-async-storage/async-storage';
import { fromByteArray } from 'base64-js'; // Para codificação segura
import * as FileSystem from 'expo-file-system';

const STORAGE_IBM_KEY = 'IBM_API_KEY';
const STORAGE_IBM_URL = 'IBM_SERVICE_URL';
const STORAGE_VOICE = 'VOICE'; // from settings modal.

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

// audioService.ts (trecho modificado)
export async function synthesizeSpeech(
    text: string,
    name: string,
    itemId: string,
    projectId: string
): Promise<string> {
    const apiKey = await AsyncStorage.getItem(STORAGE_IBM_KEY);
    const serviceUrl = await AsyncStorage.getItem(STORAGE_IBM_URL);
    const voice = await AsyncStorage.getItem(STORAGE_VOICE) || 'pt-BR_CamilaNatural';

    if (!apiKey || !serviceUrl) {
        throw new Error('IBM Watson credentials not configured.');
    }

    // Diretório base
    const baseDir = new FileSystem.Directory(FileSystem.Paths.document, 'Text to Speech Project');
    const projectDir = new FileSystem.Directory(baseDir.uri, projectId);
    if (!(projectDir.exists)) {
        await projectDir.create({ intermediates: true });
    }

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
    const audioFile = new FileSystem.File(projectDir.uri, fileName);

    await audioFile.write(uint8Array);
    return audioFile.uri;
}