// Text-to-Speech functionality
export class TextToSpeech {
  private synth: SpeechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  speak(text: string, onEnd?: () => void): void {
    // Cancel any ongoing speech
    this.cancel();

    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.rate = 0.9;
    this.utterance.pitch = 1;
    this.utterance.volume = 1;

    if (onEnd) {
      this.utterance.onend = onEnd;
    }

    this.synth.speak(this.utterance);
  }

  cancel(): void {
    this.synth.cancel();
  }

  pause(): void {
    this.synth.pause();
  }

  resume(): void {
    this.synth.resume();
  }

  isSpeaking(): boolean {
    return this.synth.speaking;
  }
}

// Speech-to-Text functionality
export class SpeechToText {
  private recognition: any;
  private isListening = false;
  private isStarting = false;
  private startTimeoutId: number | null = null;
  private restartTimeoutId: number | null = null;
  private finalizeTimeoutId: number | null = null;
  private manuallyStopped = false;
  private startRequestId = 0;
  private accumulatedTranscript = '';
  private lastDeliveredTranscript = '';
  private onResultCallback?: (transcript: string) => void;
  private onInterimCallback?: (transcript: string) => void;
  private onEndCallback?: () => void;
  private onStartCallback?: () => void;
  private onErrorCallback?: (error: string) => void;
  private onActivityChangeCallback?: (activity: SpeechRecognitionActivity) => void;
  private sessionOptions: Required<SpeechRecognitionOptions> = {
    autoRestart: false,
    continuous: false,
    finalResultDebounceMs: 450,
    interimResults: false,
    restartDelayMs: 200,
  };

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
    }
  }

  isSupported(): boolean {
    return !!this.recognition;
  }

  private emitActivity(activity: SpeechRecognitionActivity) {
    this.onActivityChangeCallback?.(activity);
  }

  private clearTimers() {
    if (this.startTimeoutId !== null) {
      window.clearTimeout(this.startTimeoutId);
      this.startTimeoutId = null;
    }

    if (this.restartTimeoutId !== null) {
      window.clearTimeout(this.restartTimeoutId);
      this.restartTimeoutId = null;
    }

    if (this.finalizeTimeoutId !== null) {
      window.clearTimeout(this.finalizeTimeoutId);
      this.finalizeTimeoutId = null;
    }
  }

  private normalizeTranscript(text: string) {
    return text.replace(/\s+/g, ' ').trim();
  }

  private flushTranscript() {
    const transcript = this.normalizeTranscript(this.accumulatedTranscript);

    if (!transcript || transcript === this.lastDeliveredTranscript) {
      return;
    }

    this.lastDeliveredTranscript = transcript;
    this.onResultCallback?.(transcript);
  }

  private scheduleTranscriptFlush() {
    if (this.finalizeTimeoutId !== null) {
      window.clearTimeout(this.finalizeTimeoutId);
    }

    this.emitActivity('processing');
    this.finalizeTimeoutId = window.setTimeout(() => {
      this.finalizeTimeoutId = null;
      this.flushTranscript();

      if (this.isListening) {
        this.emitActivity('listening');
      }
    }, this.sessionOptions.finalResultDebounceMs);
  }

  private scheduleRestart(requestId: number) {
    if (!this.sessionOptions.autoRestart || this.manuallyStopped || requestId !== this.startRequestId) {
      return;
    }

    if (this.restartTimeoutId !== null) {
      window.clearTimeout(this.restartTimeoutId);
    }

    this.emitActivity('processing');
    this.restartTimeoutId = window.setTimeout(() => {
      this.restartTimeoutId = null;

      if (this.manuallyStopped || requestId !== this.startRequestId) {
        return;
      }

      try {
        this.isStarting = true;
        this.emitActivity('processing');
        this.recognition.start();
      } catch (error) {
        console.error('[SpeechToText] Failed to restart speech recognition', error);
        this.isStarting = false;
        this.isListening = false;
        this.onErrorCallback?.('Failed to restart speech recognition');
      }
    }, this.sessionOptions.restartDelayMs);
  }

  private async requestMicrophonePermission(onError?: (error: string) => void) {
    if (!navigator.mediaDevices?.getUserMedia) {
      onError?.('audio-capture');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      console.log('[SpeechToText] Microphone permission granted');
      return true;
    } catch (error: any) {
      console.error('[SpeechToText] Microphone permission request failed', error);

      const errorName = error?.name;
      if (
        errorName === 'NotAllowedError' ||
        errorName === 'PermissionDeniedError' ||
        errorName === 'SecurityError'
      ) {
        onError?.('not-allowed');
        return false;
      }

      if (
        errorName === 'NotFoundError' ||
        errorName === 'DevicesNotFoundError' ||
        errorName === 'OverconstrainedError' ||
        errorName === 'NotReadableError' ||
        errorName === 'TrackStartError'
      ) {
        onError?.('audio-capture');
        return false;
      }

      onError?.('permission');
      return false;
    }
  }

  async startListening(
    onResult: (transcript: string) => void,
    onError?: (error: string) => void,
    onEnd?: () => void,
    onStart?: () => void,
    options?: SpeechRecognitionOptions,
  ): Promise<boolean> {
    if (!this.recognition) {
      onError?.('Speech recognition is not supported in this browser');
      return false;
    }

    if (this.isListening || this.isStarting) {
      console.log('[SpeechToText] Start skipped because recognition is already active.');
      return false;
    }

    const requestId = ++this.startRequestId;
    this.isStarting = true;
    this.manuallyStopped = false;
    this.clearTimers();
    this.accumulatedTranscript = '';
    this.lastDeliveredTranscript = '';
    this.onResultCallback = onResult;
    this.onInterimCallback = options?.onInterimResult;
    this.onEndCallback = onEnd;
    this.onStartCallback = onStart;
    this.onErrorCallback = onError;
    this.onActivityChangeCallback = options?.onActivityChange;
    this.sessionOptions = {
      autoRestart: options?.autoRestart ?? false,
      continuous: options?.continuous ?? false,
      finalResultDebounceMs: options?.finalResultDebounceMs ?? 450,
      interimResults: options?.interimResults ?? false,
      restartDelayMs: options?.restartDelayMs ?? 200,
    };
    this.recognition.continuous = this.sessionOptions.continuous;
    this.recognition.interimResults = this.sessionOptions.interimResults;

    const allowed = await this.requestMicrophonePermission(onError);
    if (!allowed || requestId !== this.startRequestId) {
      this.isStarting = false;
      return false;
    }

    this.recognition.onstart = () => {
      console.log('[SpeechToText] Mic started');
      this.clearTimers();
      this.isStarting = false;
      this.isListening = true;
      this.emitActivity('listening');
      this.onStartCallback?.();
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let receivedFinalResult = false;

      for (let index = event.resultIndex ?? 0; index < (event.results?.length ?? 0); index += 1) {
        const result = event.results[index];
        const transcript = this.normalizeTranscript(result?.[0]?.transcript ?? '');

        if (!transcript) {
          continue;
        }

        if (result?.isFinal) {
          this.accumulatedTranscript = this.normalizeTranscript(
            `${this.accumulatedTranscript} ${transcript}`,
          );
          receivedFinalResult = true;
          continue;
        }

        interimTranscript = this.normalizeTranscript(`${interimTranscript} ${transcript}`);
      }

      this.onInterimCallback?.(interimTranscript);

      if (interimTranscript) {
        this.emitActivity('listening');
      }

      if (receivedFinalResult) {
        this.scheduleTranscriptFlush();
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('[SpeechToText] Speech error:', event.error);
      this.clearTimers();
      this.isStarting = false;
      this.isListening = false;

      if (event.error === 'aborted' && this.manuallyStopped) {
        return;
      }

      this.emitActivity('idle');
      this.onErrorCallback?.(event.error);
    };

    this.recognition.onend = () => {
      console.log('[SpeechToText] Mic stopped');
      this.isStarting = false;
      this.isListening = false;

      if (this.finalizeTimeoutId !== null) {
        window.clearTimeout(this.finalizeTimeoutId);
        this.finalizeTimeoutId = null;
      }

      this.flushTranscript();
      this.onInterimCallback?.('');

      if (!this.manuallyStopped && requestId === this.startRequestId && this.sessionOptions.autoRestart) {
        this.scheduleRestart(requestId);
        return;
      }

      this.manuallyStopped = false;
      this.emitActivity('idle');
      this.onEndCallback?.();
    };

    this.startTimeoutId = window.setTimeout(() => {
      this.startTimeoutId = null;

      try {
        this.recognition.start();
      } catch (error) {
        console.error('[SpeechToText] Failed to start speech recognition', error);
        this.isStarting = false;
        this.isListening = false;
        this.emitActivity('idle');
        this.onErrorCallback?.('Failed to start speech recognition');
      }
    }, 300);

    return true;
  }

  stopListening(): void {
    this.startRequestId += 1;
    this.clearTimers();

    if (!this.recognition || (!this.isListening && !this.isStarting)) {
      this.emitActivity('idle');
      return;
    }

    this.manuallyStopped = true;
    this.isStarting = false;
    this.flushTranscript();
    this.onInterimCallback?.('');

    if (!this.isListening) {
      this.manuallyStopped = false;
      this.emitActivity('idle');
      this.onEndCallback?.();
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    }

    this.isListening = false;
    this.emitActivity('processing');
  }

  getIsListening(): boolean {
    return this.isListening || this.isStarting;
  }
}

export type SpeechRecognitionActivity = 'idle' | 'listening' | 'processing';

export interface SpeechRecognitionOptions {
  autoRestart?: boolean;
  continuous?: boolean;
  finalResultDebounceMs?: number;
  interimResults?: boolean;
  onActivityChange?: (activity: SpeechRecognitionActivity) => void;
  onInterimResult?: (transcript: string) => void;
  restartDelayMs?: number;
}

export const textToSpeech = new TextToSpeech();
export const speechToText = new SpeechToText();
