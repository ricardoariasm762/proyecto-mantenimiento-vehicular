import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VoiceInputService {
  public isListening = signal<boolean>(false);
  public transcriptText = signal<string>('');
  public isSupported = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);

  private recognition: any = null;

  constructor() {
    this.initSpeechRecognition();
  }

  private initSpeechRecognition(): void {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.isSupported.set(true);
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'es-CO'; // Español Colombia / Latinoamérica

      this.recognition.onstart = () => {
        this.isListening.set(true);
        this.errorMessage.set(null);
      };

      this.recognition.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        this.transcriptText.set(fullTranscript);
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Error en SpeechRecognition:', event.error);
        this.isListening.set(false);
        if (event.error === 'not-allowed') {
          this.errorMessage.set('Permiso de micrófono denegado en el navegador.');
        } else if (event.error === 'no-speech') {
          this.errorMessage.set('No se detectó audio del micrófono.');
        } else {
          this.errorMessage.set(`Aviso de voz: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        this.isListening.set(false);
      };
    } else {
      this.isSupported.set(false);
      console.warn('La API Web Speech no está disponible en este navegador.');
    }
  }

  public startListening(): void {
    if (!this.recognition) {
      this.errorMessage.set('El navegador no soporta reconocimiento de voz nativo.');
      return;
    }

    try {
      this.transcriptText.set('');
      this.errorMessage.set(null);
      this.recognition.start();
    } catch (e: any) {
      console.warn('Aviso al iniciar reconocimiento:', e.message);
      // Si ya estaba corriendo, reiniciar
      this.recognition.stop();
      setTimeout(() => {
        try {
          this.recognition.start();
        } catch (err) {
          console.error('Error al reiniciar reconocimiento:', err);
        }
      }, 150);
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening()) {
      this.recognition.stop();
    }
    this.isListening.set(false);
  }

  public clearTranscript(): void {
    this.transcriptText.set('');
  }
}
