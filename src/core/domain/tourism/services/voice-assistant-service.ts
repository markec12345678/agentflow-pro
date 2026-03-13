/**
 * Voice Assistant Service for Tourism
 * Handles: Speech-to-Text, Intent Recognition, Text-to-Speech
 */

interface VoiceInteractionResult {
  transcript: string;
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  response: string;
  responseAudioUrl?: string;
  language: string;
}

interface SpeechToTextOptions {
  language?: string;
  model?: 'whisper' | 'fast-whisper';
  timestamps?: boolean;
}

interface TextToSpeechOptions {
  voice?: string;
  language?: string;
  speed?: number;
  model?: 'dia' | 'kokoro' | 'chatterbox';
}

export class VoiceAssistantService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.INFERENCE_SH_API_KEY || process.env.HUGGINGFACE_API_KEY || '';
  }

  /**
   * Convert speech to text using Whisper
   */
  async speechToText(
    audioBuffer: Buffer | ArrayBuffer,
    options: SpeechToTextOptions = {}
  ): Promise<{ transcript: string; language: string; duration: number }> {
    const { language = 'sl', model = 'fast-whisper', timestamps = false } = options;

    try {
      // Convert to Blob if needed
      const blob = audioBuffer instanceof Buffer 
        ? new Blob([audioBuffer], { type: 'audio/wav' })
        : new Blob([audioBuffer], { type: 'audio/wav' });

      const formData = new FormData();
      formData.append('file', blob, 'audio.wav');
      formData.append('model', model);
      formData.append('language', language);
      if (timestamps) {
        formData.append('timestamps', 'true');
      }

      const response = await fetch('https://api.inference.sh/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Speech-to-text API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        transcript: result.text || '',
        language: result.language || language,
        duration: result.duration || 0,
      };
    } catch (error) {
      console.error('Speech-to-text failed:', error);
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Recognize intent from transcribed text
   */
  async recognizeIntent(transcript: string, language: string = 'sl'): Promise<{
    intent: string;
    confidence: number;
    entities: Record<string, any>;
  }> {
    const prompt = `
Analyze this guest inquiry and extract:
1. Primary intent (booking_inquiry, amenity_question, pricing_question, check_in_out, complaint, request, general_info)
2. Confidence score (0-1)
3. Entities (dates, numbers, locations, amenity types)

Transcript: "${transcript}"
Language: ${language}

Respond with JSON only:
{
  "intent": "booking_inquiry",
  "confidence": 0.95,
  "entities": {
    "date": "2026-03-15",
    "guests": 2,
    "nights": 3
  }
}
    `.trim();

    try {
      const response = await fetch('https://api.inference.sh/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4.5',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`Intent recognition failed: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON from intent recognition');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Intent recognition failed:', error);
      // Fallback to simple keyword matching
      return this.fallbackIntentRecognition(transcript);
    }
  }

  /**
   * Fallback intent recognition using keyword matching
   */
  private fallbackIntentRecognition(transcript: string): {
    intent: string;
    confidence: number;
    entities: Record<string, any>;
  } {
    const text = transcript.toLowerCase();
    
    const intentPatterns: Record<string, RegExp[]> = {
      booking_inquiry: [/rezervir/, /book/, /prosto/, /available/, /termin/],
      pricing_question: [/cena/, /price/, /strošek/, /cost/, /plačilo/],
      amenity_question: [/oprema/, /amenity/, /wifi/, /bazen/, /parkirišče/],
      check_in_out: [/prihod/, /odhod/, /check-in/, /check-out/, /ura/],
      complaint: [/težava/, /problem/, /slabo/, /complaint/, /napaka/],
      request: [/prosim/, /request/, /lahko/, /could/, /would/],
    };

    let bestIntent = 'general_info';
    let bestScore = 0;

    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      const score = patterns.reduce((acc, pattern) => acc + (pattern.test(text) ? 1 : 0), 0);
      if (score > bestScore) {
        bestIntent = intent;
        bestScore = score;
      }
    }

    const confidence = Math.min(bestScore / 3, 0.9);

    // Extract simple entities
    const entities: Record<string, any> = {};
    const dateMatch = text.match(/(\d{1,2})\.?\s*(\d{1,2})\.?\s*(\d{4})?/);
    if (dateMatch) {
      entities.date = `${dateMatch[1]}.${dateMatch[2]}.${dateMatch[3] || '2026'}`;
    }

    const guestMatch = text.match(/(\d+)\s*(oseb|guest|people|osob)/);
    if (guestMatch) {
      entities.guests = parseInt(guestMatch[1]);
    }

    return { intent: bestIntent, confidence, entities };
  }

  /**
   * Generate response based on intent
   */
  async generateResponse(
    intent: string,
    entities: Record<string, any>,
    propertyContext?: any
  ): Promise<string> {
    const contextPrompt = propertyContext 
      ? `Property context: ${JSON.stringify(propertyContext)}\n\n`
      : '';

    const prompt = `
${contextPrompt}You are a helpful hotel assistant. Generate a friendly, professional response based on:

Intent: ${intent}
Entities: ${JSON.stringify(entities)}

Response guidelines:
- Be concise and helpful
- Use Slovenian language (unless inquiry was in English)
- Include relevant details
- End with a call-to-action if appropriate

Response:
    `.trim();

    try {
      const response = await fetch('https://api.inference.sh/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4.5',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Response generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content || 'Oprostite, nisem razumel. Lahko ponovite?';
    } catch (error) {
      console.error('Response generation failed:', error);
      return 'Oprostite, prišlo je do napake. Poskusite ponovno.';
    }
  }

  /**
   * Convert text to speech
   */
  async textToSpeech(
    text: string,
    options: TextToSpeechOptions = {}
  ): Promise<{ audioUrl: string; duration: number }> {
    const {
      voice = 'default',
      language = 'sl-SI',
      speed = 1.0,
      model = 'kokoro',
    } = options;

    try {
      const response = await fetch('https://api.inference.sh/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: text,
          voice,
          language,
          speed,
        }),
      });

      if (!response.ok) {
        throw new Error(`Text-to-speech API error: ${response.statusText}`);
      }

      // Get audio blob and upload to storage
      const audioBlob = await response.blob();
      const audioUrl = await this.uploadAudioToStorage(audioBlob);

      return {
        audioUrl,
        duration: 0, // Would need to calculate from audio metadata
      };
    } catch (error) {
      console.error('Text-to-speech failed:', error);
      throw new Error(`TTS failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload audio to storage (S3, GCS, or local)
   */
  private async uploadAudioToStorage(audioBlob: Blob): Promise<string> {
    // For now, return a placeholder URL
    // In production, upload to S3/GCS and return the URL
    const fileName = `voice-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;
    
    // TODO: Implement actual storage upload
    // Example: Upload to S3
    // const s3Url = await s3.upload({ Bucket: 'agentflow-voice', Key: fileName, Body: audioBlob }).promise();
    
    return `/api/tourism/voice/audio/${fileName}`;
  }

  /**
   * Complete voice interaction flow
   */
  async processVoiceInteraction(
    audioBuffer: Buffer | ArrayBuffer,
    propertyContext?: any
  ): Promise<VoiceInteractionResult> {
    // Step 1: Speech to text
    const { transcript, language, duration } = await this.speechToText(audioBuffer);

    // Step 2: Intent recognition
    const { intent, confidence, entities } = await this.recognizeIntent(transcript, language);

    // Step 3: Generate response
    const response = await this.generateResponse(intent, entities, propertyContext);

    // Step 4: Text to speech (optional)
    let responseAudioUrl: string | undefined;
    try {
      const ttsResult = await this.textToSpeech(response, { language });
      responseAudioUrl = ttsResult.audioUrl;
    } catch (error) {
      console.error('TTS failed, returning text response only:', error);
    }

    return {
      transcript,
      intent,
      confidence,
      entities,
      response,
      responseAudioUrl,
      language,
    };
  }

  /**
   * Log voice interaction to database
   */
  async logInteraction(data: {
    userId?: string;
    propertyId?: string;
    sessionId: string;
    interactionType: string;
    audioUrl?: string;
    transcript: string;
    intent: string;
    confidence: number;
    response?: string;
    responseAudioUrl?: string;
    duration: number;
    language: string;
  }): Promise<void> {
    try {
      const { prisma } = await import('@/lib/prisma');
      await prisma.voiceInteraction.create({
        data,
      });
    } catch (error) {
      console.error('Failed to log voice interaction:', error);
    }
  }
}

export const voiceAssistantService = new VoiceAssistantService();
