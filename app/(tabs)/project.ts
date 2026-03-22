export type LanguageKey = 'en' | 'pt' | 'es';

export interface Phrase {
    id: string;
    name: string;
    phrase: string;
}

export interface Project {
    id: string;
    name: string;
    phrases: Phrase[];
    sourceLanguage: LanguageKey;
    targetLanguage: LanguageKey;
    voice: string;
}