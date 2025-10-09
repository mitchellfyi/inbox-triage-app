'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function VoiceInput({ 
  onTranscript, 
  disabled = false,
  className = ''
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      // Configure recognition
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-GB'; // British English to match extension
      
      // Set up event handlers
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
      };
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setIsSupported(false);
      setError('Speech recognition not supported in this browser');
    }
  }, [onTranscript]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening || disabled) return;
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Failed to start voice input');
    }
  }, [isListening, disabled]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const handleClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          disabled
          className="p-2 text-gray-400 cursor-not-allowed"
          title="Voice input not supported"
        >
          🎤
        </button>
        <span className="text-xs text-gray-500">
          Voice input not supported
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`p-2 rounded-md transition-colors ${
          isListening
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={isListening ? 'Stop voice input' : 'Start voice input'}
      >
        {isListening ? (
          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        ) : (
          '🎤'
        )}
      </button>
      
      <div className="flex flex-col">
        <span className="text-xs text-gray-500">
          {isListening ? 'Listening...' : 'Click to start voice dictation'}
        </span>
        {error && (
          <span className="text-xs text-red-600">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
