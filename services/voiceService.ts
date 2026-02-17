import { Language, ISpeechRecognitionEvent, ISpeechRecognitionErrorEvent } from '../types';

class VoiceService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis = window.speechSynthesis;
  private isListening: boolean = false;

  constructor() {
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false; // Stop after one command for cleaner UX
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    } else {
      console.error("Speech Recognition API not supported in this browser.");
    }
  }

  public setLanguage(lang: Language) {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onEnd: () => void,
    onError: (error: string) => void
  ) {
    if (!this.recognition) {
      onError("not-supported");
      return;
    }

    // If already listening, we can either ignore or stop and restart. 
    // For safety, if the flag is true, we assume it's running.
    if (this.isListening) {
      return;
    }

    this.recognition.onresult = (event: ISpeechRecognitionEvent) => {
      const result = event.results[event.resultIndex];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;
      onResult(transcript, isFinal);
    };

    this.recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      // Ignore 'no-speech' errors as they just mean silence, but pass others
      if (event.error !== 'no-speech') {
        onError(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      console.warn("Recognition start failed:", e);
      this.isListening = false;
      // Report unexpected start failures (e.g. permission issues on some browsers)
      onError('start-failed');
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn("Error stopping recognition:", e);
      }
      this.isListening = false;
    }
  }

  public speak(text: string, lang: 'en' | 'hi' = 'en') {
    // Cancel any current speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Set language for TTS
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';

    // Try to find a suitable voice
    const voices = this.synthesis.getVoices();
    if (voices.length > 0) {
      // Try to match the specific language voice
      const preferredVoice = voices.find(v => v.lang.startsWith(utterance.lang));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }

    // Adjust pitch/rate for a more natural human-like feel
    // JARVIS doesn't need to be robotic to be cool.
    utterance.pitch = 1.0;
    utterance.rate = 0.95; // Slightly slower for clarity and naturalness
    utterance.volume = 1.0;

    this.synthesis.speak(utterance);
  }
}

export const voiceService = new VoiceService();