'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { 
  SpeechRecognition, 
  SpeechRecognitionEvent, 
  SpeechRecognitionErrorEvent,
  VoiceRecordingState 
} from '../types/speech';

interface GuidanceBarProps {
  /** Current guidance value */
  value: string;
  /** Called when guidance changes */
  onChange: (value: string) => void;
  /** Whether the input should be disabled */
  disabled?: boolean;
  /** Maximum character limit */
  maxLength?: number;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Enhanced guidance input component with voice dictation support
 * Uses Web Speech API for client-side speech-to-text conversion
 */
export default function GuidanceBar({ 
  value, 
  onChange, 
  disabled = false, 
  maxLength = 500,
  placeholder = "Enter additional instructions for the reply (e.g., ask a question, be concise, request a meeting)..."
}: GuidanceBarProps) {
  const [voiceState, setVoiceState] = useState<VoiceRecordingState>({
    isRecording: false,
    isSupported: false
  });
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check for speech recognition support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isSupported = !!SpeechRecognition && !!navigator.mediaDevices?.getUserMedia;
    
    setVoiceState(prev => ({
      ...prev,
      isSupported
    }));

    // Initialize recognition if supported
    if (isSupported && !recognitionRef.current) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-GB'; // British English as per project requirements
        
        recognition.onstart = () => {
          setVoiceState(prev => ({
            ...prev,
            isRecording: true,
            error: undefined
          }));
        };

        recognition.onend = () => {
          setVoiceState(prev => ({
            ...prev,
            isRecording: false
          }));
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          // Update the guidance with final results
          if (finalTranscript) {
            const newValue = value + (value ? ' ' : '') + finalTranscript;
            if (newValue.length <= maxLength) {
              onChange(newValue);
            }
          }

          // Show interim results in state for visual feedback
          setVoiceState(prev => ({
            ...prev,
            transcript: interimTranscript
          }));
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          let errorMessage = 'Voice recognition failed';
          
          switch (event.error) {
            case 'not-allowed':
              errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
              break;
            case 'no-speech':
              errorMessage = 'No speech detected. Please try speaking more clearly.';
              break;
            case 'audio-capture':
              errorMessage = 'Microphone not available. Please check your microphone connection.';
              break;
            case 'network':
              errorMessage = 'Network error occurred during voice recognition.';
              break;
            case 'service-not-allowed':
              errorMessage = 'Speech recognition service not allowed.';
              break;
            case 'language-not-supported':
              errorMessage = 'Language not supported for voice recognition.';
              break;
            default:
              errorMessage = `Voice recognition error: ${event.error}`;
          }

          setVoiceState(prev => ({
            ...prev,
            isRecording: false,
            error: errorMessage,
            transcript: undefined
          }));
        };

        recognitionRef.current = recognition;
      } catch (error) {
        console.error('Failed to initialize speech recognition:', error);
        setVoiceState(prev => ({
          ...prev,
          isSupported: false,
          error: 'Speech recognition initialization failed'
        }));
      }
    }

    // Cleanup function
    return () => {
      if (recognitionRef.current && voiceState.isRecording) {
        recognitionRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  const toggleRecording = useCallback(async () => {
    if (!recognitionRef.current || disabled) return;

    try {
      if (voiceState.isRecording) {
        recognitionRef.current.stop();
      } else {
        // Request microphone permission first
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          recognitionRef.current.start();
          
          // Clear any previous errors
          setVoiceState(prev => ({
            ...prev,
            error: undefined,
            transcript: undefined
          }));
        } catch {
          setVoiceState(prev => ({
            ...prev,
            error: 'Microphone permission denied. Please allow microphone access to use voice dictation.'
          }));
        }
      }
    } catch (error) {
      console.error('Toggle recording failed:', error);
      setVoiceState(prev => ({
        ...prev,
        error: 'Failed to start voice recognition'
      }));
    }
  }, [voiceState.isRecording, disabled]);

  // Keyboard shortcut for voice toggle (Ctrl/Cmd + Shift + V)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'V') {
        event.preventDefault();
        if (voiceState.isSupported) {
          toggleRecording();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleRecording, voiceState.isSupported]);

  const handleClearGuidance = useCallback(() => {
    onChange('');
    // Focus back to textarea
    textareaRef.current?.focus();
  }, [onChange]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="guidance-input" className="block text-sm font-medium text-gray-700">
          Guidance
        </label>
        {voiceState.isSupported && (
          <div className="text-xs text-gray-500">
            {voiceState.isRecording ? 'Recording...' : 'Press Ctrl+Shift+V or click mic'}
          </div>
        )}
      </div>
      
      <div className="relative">
        <textarea
          ref={textareaRef}
          id="guidance-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          maxLength={maxLength}
          className="w-full px-3 py-2 pr-24 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          disabled={disabled}
          aria-describedby="guidance-help guidance-count"
        />
        
        {/* Voice and Clear Controls */}
        <div className="absolute right-2 top-2 flex items-center space-x-1">
          {/* Clear button */}
          {value && (
            <button
              type="button"
              onClick={handleClearGuidance}
              disabled={disabled}
              className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 disabled:opacity-50"
              title="Clear guidance"
              aria-label="Clear guidance"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {/* Microphone button */}
          {voiceState.isSupported && (
            <button
              type="button"
              onClick={toggleRecording}
              disabled={disabled}
              className={`p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                voiceState.isRecording 
                  ? 'text-red-600 animate-pulse' 
                  : 'text-gray-400 hover:text-blue-600'
              }`}
              title={`${voiceState.isRecording ? 'Stop' : 'Start'} voice dictation (Ctrl+Shift+V)`}
              aria-label={`${voiceState.isRecording ? 'Stop' : 'Start'} voice dictation`}
              aria-pressed={voiceState.isRecording}
            >
              {voiceState.isRecording ? (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z"/>
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Interim transcript display */}
      {voiceState.transcript && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          <span className="font-medium">Listening:</span> {voiceState.transcript}
        </div>
      )}

      {/* Error display */}
      {voiceState.error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800" role="alert">
          <span className="font-medium">Voice Error:</span> {voiceState.error}
        </div>
      )}

      {/* Character count and help text */}
      <div className="flex items-center justify-between mt-1">
        <p id="guidance-help" className="text-xs text-gray-500">
          {!voiceState.isSupported && 'Voice dictation not supported in this browser. '}
          Additional instructions to influence the reply generation.
        </p>
        <p id="guidance-count" className="text-xs text-gray-500">
          {value.length}/{maxLength} characters
        </p>
      </div>
    </div>
  );
}