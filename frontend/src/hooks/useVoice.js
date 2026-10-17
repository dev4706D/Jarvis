import { useCallback, useRef, useState } from 'react';
import { playActivate, playDeactivate } from '../lib/audioSoundFx';

/**
 * useVoice — manages microphone recording, real-time Web Audio analyzer, and TTS playback.
 */
export function useVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animFrameRef = useRef(null);

  /**
   * Helper to get or create an AudioContext
   */
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  /**
   * Monitor real-time volume level from microphone
   */
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkLevel = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength;
      const normalized = Math.min(1, avg / 120);
      setAudioLevel(normalized);

      animFrameRef.current = requestAnimationFrame(checkLevel);
    };

    checkLevel();
  }, []);

  /**
   * Start recording from the microphone with real-time audio analysis.
   */
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const actx = getAudioContext();
      if (actx) {
        const source = actx.createMediaStreamSource(stream);
        const analyser = actx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.75;
        source.connect(analyser);

        sourceRef.current = source;
        analyserRef.current = analyser;
        monitorAudioLevel();
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);
      playActivate();
    } catch (err) {
      console.error('Failed to start recording:', err);
      throw new Error('Microphone access denied');
    }
  }, [getAudioContext, monitorAudioLevel]);

  /**
   * Stop recording and return the audio blob.
   */
  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      setAudioLevel(0);

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // Stop tracks
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());

        if (sourceRef.current) {
          sourceRef.current.disconnect();
          sourceRef.current = null;
        }

        setIsRecording(false);
        playDeactivate();
        resolve(audioBlob);
      };

      mediaRecorder.stop();
    });
  }, []);

  /**
   * Play audio from base64-encoded data (ElevenLabs response).
   */
  const playAudioBase64 = useCallback(async (base64Audio) => {
    try {
      setIsSpeaking(true);

      const audioBytes = Uint8Array.from(atob(base64Audio), (c) => c.charCodeAt(0));
      const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.error('Audio playback failed:', err);
      setIsSpeaking(false);
    }
  }, []);

  /**
   * Speak text using browser's SpeechSynthesis API (fallback).
   */
  const speakBrowser = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  /**
   * Play response audio: use base64 if available, else browser TTS.
   */
  const playResponse = useCallback(async (text, audioBase64) => {
    if (audioBase64) {
      await playAudioBase64(audioBase64);
    } else {
      speakBrowser(text);
    }
  }, [playAudioBase64, speakBrowser]);

  /**
   * Stop any ongoing speech.
   */
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    isRecording,
    isSpeaking,
    audioLevel,
    analyserRef,
    startRecording,
    stopRecording,
    playResponse,
    stopSpeaking,
  };
}
