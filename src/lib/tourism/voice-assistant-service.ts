// Voice assistant service stub
export class VoiceAssistantService {
  async processVoice(text: string): Promise<string> {
    return "Voice response";
  }
}

export const voiceAssistantService = new VoiceAssistantService();
