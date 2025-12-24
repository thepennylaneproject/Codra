/**
 * useVoiceToPrompt
 * Custom hook for voice-to-text prompt input using Web Speech API
 */

import { useEffect, useCallback, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface UseVoiceToPromptOptions {
    onTranscriptUpdate?: (transcript: string) => void;
    onFinalTranscript?: (transcript: string) => void;
    language?: string;
}

interface UseVoiceToPromptResult {
    transcript: string;
    interimTranscript: string;
    isListening: boolean;
    isSupported: boolean;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
}

export function useVoiceToPrompt(options: UseVoiceToPromptOptions = {}): UseVoiceToPromptResult {
    const { onTranscriptUpdate, onFinalTranscript, language = 'en-US' } = options;
    const [lastFinalTranscript, setLastFinalTranscript] = useState('');

    const {
        transcript,
        interimTranscript,
        finalTranscript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
    } = useSpeechRecognition();

    // Track final transcript changes
    useEffect(() => {
        if (finalTranscript && finalTranscript !== lastFinalTranscript) {
            setLastFinalTranscript(finalTranscript);
            onFinalTranscript?.(finalTranscript);
        }
    }, [finalTranscript, lastFinalTranscript, onFinalTranscript]);

    // Track interim transcript changes
    useEffect(() => {
        if (transcript) {
            onTranscriptUpdate?.(transcript);
        }
    }, [transcript, onTranscriptUpdate]);

    const startListening = useCallback(() => {
        SpeechRecognition.startListening({
            continuous: true,
            language,
        });
    }, [language]);

    const stopListening = useCallback(() => {
        SpeechRecognition.stopListening();
    }, []);

    return {
        transcript,
        interimTranscript,
        isListening: listening,
        isSupported: browserSupportsSpeechRecognition,
        startListening,
        stopListening,
        resetTranscript,
    };
}
