/**
 * AI Concierge Agent - Onboarding through conversation
 * 
 * Guides users through setup via natural language conversation
 * Extracts structured data from conversation and creates resources
 */

import { MemoryMCP } from '@/ai/context-manager';
import { PROPERTY_TEMPLATES, mergeWithTemplate } from '@/lib/property-templates';

export interface PropertySetup {
  propertyName: string;
  propertyType: 'hotel' | 'kamp' | 'kmetija' | 'apartma' | 'drugo';
  address: {
    street: string;
    city: string;
    postalCode?: string;
    country: string;
  };
  roomCount: number;
  roomTypes: Array<{
    type: string;
    count: number;
    price: number;
    capacity?: number;
  }>;
  amenities: string[];
  enableEturizem: boolean;
  enableAutoEmails: boolean;
}

export interface ConciergeContext {
  userId: string;
  step: 'greeting' | 'property_info' | 'rooms_info' | 'amenities' | 'integrations' | 'complete';
  extractedData: Partial<PropertySetup>;
  conversation: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
  createdAt: string;
  updatedAt: string;
}

export class ConciergeAgent {
  private memory: MemoryMCP;

  constructor() {
    this.memory = new MemoryMCP();
  }

  /**
   * Process user message and return AI response
   */
  async processMessage(
    userId: string,
    message: string,
    existingContext?: ConciergeContext
  ): Promise<{
    response: string;
    context: ConciergeContext;
    progress: number;
    createdResources: string[];
  }> {
    // 1. Load or initialize context
    const ctx = existingContext || this.initializeContext(userId);

    // 2. Analyze user intent and extract entities
    const analysis = await this.analyzeMessage(message, ctx.step);

    // 3. Update context with extracted data
    ctx.extractedData = { ...ctx.extractedData, ...analysis.entities };
    ctx.conversation.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    // 4. Determine next action based on current step
    const createdResources: string[] = [];
    
    if (analysis.intent === 'provide_info' || analysis.intent === 'confirm') {
      // Execute actions based on current step
      if (ctx.step === 'property_info' && ctx.extractedData.propertyName) {
        // Property info collected, move to next step
        ctx.step = 'rooms_info';
        createdResources.push('property_initialized');
      } else if (ctx.step === 'rooms_info' && ctx.extractedData.roomCount) {
        // Rooms info collected, move to next step
        ctx.step = 'amenities';
        createdResources.push('rooms_initialized');
      } else if (ctx.step === 'amenities' && ctx.extractedData.amenities) {
        // Amenities collected, move to integrations
        ctx.step = 'integrations';
      } else if (ctx.step === 'integrations') {
        // All info collected, complete onboarding
        ctx.step = 'complete';
        createdResources.push('onboarding_complete');
      }
    }

    // 5. Generate AI response based on new step
    const response = this.generateResponse(ctx.step, ctx.extractedData, analysis);
    ctx.conversation.push({
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    });

    // 6. Update timestamp
    ctx.updatedAt = new Date().toISOString();

    // 7. Save context to Memory MCP
    await this.saveContext(ctx);

    return {
      response,
      context: ctx,
      progress: this.calculateProgress(ctx.step),
      createdResources,
    };
  }

  /**
   * Initialize new conversation context
   */
  private initializeContext(userId: string): ConciergeContext {
    return {
      userId,
      step: 'greeting',
      extractedData: {},
      conversation: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Analyze user message to extract intent and entities
   */
  private async analyzeMessage(
    message: string,
    currentStep: string
  ): Promise<{
    intent: 'provide_info' | 'question' | 'skip' | 'confirm' | 'greeting' | 'select_template';
    entities: Partial<PropertySetup>;
    templateId?: string;
    confidence: number;
  }> {
    const lowerMessage = message.toLowerCase();

    // Check if user wants to use a template
    if (lowerMessage.includes('hotel') && !lowerMessage.includes('imenuje')) {
      return {
        intent: 'select_template',
        templateId: 'hotel-boutique',
        entities: { propertyType: 'hotel' },
        confidence: 0.95,
      };
    }
    if (lowerMessage.includes('kamp') || lowerMessage.includes('camp')) {
      return {
        intent: 'select_template',
        templateId: 'kamp-standard',
        entities: { propertyType: 'kamp' },
        confidence: 0.95,
      };
    }
    if (lowerMessage.includes('kmetija')) {
      return {
        intent: 'select_template',
        templateId: 'kmetija-turisticna',
        entities: { propertyType: 'kmetija' },
        confidence: 0.95,
      };
    }
    if (lowerMessage.includes('apartma')) {
      return {
        intent: 'select_template',
        templateId: 'apartma-standard',
        entities: { propertyType: 'apartma' },
        confidence: 0.95,
      };
    }

    // Simple rule-based analysis (can be enhanced with AI)
    const entities: Partial<PropertySetup> = {};

    // Extract property name
    if (lowerMessage.includes('hotel') || lowerMessage.includes('apartma') || lowerMessage.includes('kmetija') || lowerMessage.includes('kamp')) {
      const nameMatch = message.match(/(?:hotel|apartma|kmetija|kamp)\s+([A-ZČŠŽa-zčšž\s]+)/i);
      if (nameMatch) {
        entities.propertyName = nameMatch[1].trim();
      }
      
      // Extract property type
      if (lowerMessage.includes('hotel')) entities.propertyType = 'hotel';
      else if (lowerMessage.includes('kamp') || lowerMessage.includes('camp')) entities.propertyType = 'kamp';
      else if (lowerMessage.includes('kmetija')) entities.propertyType = 'kmetija';
      else if (lowerMessage.includes('apartma')) entities.propertyType = 'apartma';
      else entities.propertyType = 'drugo';
    }

    // Extract room count
    const roomMatch = message.match(/(\d+)\s*(?:sob|soba|room|rooms)/i);
    if (roomMatch) {
      entities.roomCount = parseInt(roomMatch[1]);
    }

    // Extract address
    if (lowerMessage.includes('cesta') || lowerMessage.includes('ulica') || lowerMessage.includes('trg')) {
      const addressMatch = message.match(/([A-ZČŠŽa-zčšž\s]+(?:cesta|ulica|trg)\s*\d+)/i);
      if (addressMatch) {
        entities.address = {
          ...entities.address,
          street: addressMatch[1].trim(),
        };
      }
    }

    // Extract city
    if (lowerMessage.includes('ljubljana') || lowerMessage.includes('bled') || lowerMessage.includes('piran')) {
      const cityMatch = message.match(/(?:v|iz|near)\s+([A-ZČŠŽa-zčšž]+)/i);
      if (cityMatch) {
        entities.address = {
          ...entities.address,
          city: cityMatch[1].trim(),
          country: 'Slovenia',
        };
      }
    }

    // Determine intent
    let intent: 'provide_info' | 'question' | 'skip' | 'confirm' | 'greeting' = 'provide_info';
    
    if (lowerMessage.includes('pozdrav') || lowerMessage.includes('hello') || lowerMessage.includes('bok')) {
      intent = 'greeting';
    } else if (lowerMessage.includes('kako') || lowerMessage.includes('kaj') || lowerMessage.includes('?')) {
      intent = 'question';
    } else if (lowerMessage.includes('ne') || lowerMessage.includes('skip') || lowerMessage.includes('preskoči')) {
      intent = 'skip';
    } else if (lowerMessage.includes('da') || lowerMessage.includes('yes') || lowerMessage.includes('seveda') || lowerMessage.includes('ja')) {
      intent = 'confirm';
    }

    return {
      intent,
      entities,
      confidence: 0.9,
    };
  }

  /**
   * Generate AI response based on current step
   */
  private generateResponse(
    step: string,
    data: Partial<PropertySetup>,
    analysis: { intent: string; entities: any; confidence: number }
  ): string {
    switch (step) {
      case 'greeting':
        return `👋 Dobrodošli v AgentFlow Pro!

Jaz sem vaš osebni asistent in vam bom pomagal nastaviti vašo nastanitev v samo nekaj minutah.

Za začetek mi povejte:
• Kako se imenuje vaša nastanitev?
• Kakšen tip nastanitve imate? (hotel, apartma, kmetija, kamp)

Primer: "Hotel Slon v Ljubljani" ali "Apartma Bled z 10 sobami"

💡 Lahko tudi izberete predlogo:
• "Hotel" - Boutique hotel z vsemi storitvami
• "Kamp" - Kamping s parcelami in hišicami
• "Kmetija" - Turistična kmetija z doživetji
• "Apartma" - Samostojen apartma`;

      case 'property_info':
        if (data.propertyName) {
          return `✅ Odlično! Ustvarjam "${data.propertyName}"...

Zdaj mi povejte:
• Koliko sob/imate?
• Kje se nahaja? (naslov in kraj)

Primer: "12 sob na Slovenski cesti 34 v Ljubljani"`;
        }
        return `Razumem. Mi lahko poveste več o vaši nastanitvi?

• Ime nastanitve?
• Tip (hotel, apartma, kmetija, kamp)?
• Lokacija?`;

      case 'rooms_info':
        if (data.roomCount) {
          return `✅ Super! ${data.roomCount} sob je zabeleženih.

Zdaj pa še cene:
• Koliko stane povprečna soba na noč?
• Imate različne tipe sob? (single, double, suite...)

Primer: "Double sobe 85€, suite 150€" ali "Vse sobe so enake, 70€ na noč"`;
        }
        return `Koliko sob ima vaša nastanitev?

Primer: "12 sob" ali "8 double sob in 4 suite"`;

      case 'amenities':
        return `✅ Cene so nastavljene.

Kaj vse nudite gostom?
Naštejte kar vse kar imate:

Primer: "WiFi, parkirišče, zajtrk, bazen, spa, restavracija"

Ali pa samo "vse osnovno" če želite standardni paket.`;

      case 'integrations':
        return `✅ Amenities so shranjeni.

Zadnje vprašanje:
• Želite sinhronizacijo z eTurizem/AJPES?
• Želite avtomatske email-e gostom?

Lahko rečete samo "ja" za oboje ali "ne" če želite ročno.`;

      case 'complete':
        return `🎉 Čestitam! Vaša nastanitev je popolnoma nastavljena!

✅ "${data.propertyName}" ustvarjeno
✅ ${data.roomCount} sob konfiguriranih
✅ Cene nastavljene
✅ Amenities shranjeni
✅ eTurizem: ${data.enableEturizem ? 'VKLOPLJENO' : 'IZKLOPLJENO'}
✅ Avtomatski email-i: ${data.enableAutoEmails ? 'VKLOPLJENO' : 'IZKLOPLJENO'}

Vaš dashboard je pripravljen!

[🏠 Pojdi na Dashboard]
[📚 Ogled vodiča]
[💬 Še vprašanja?]

P.S. Kadarkoli potrebujete pomoč, samo vprašajte! 💬`;

      default:
        return `Razumem. Kako vam lahko pomagam naprej?

Lahko:
• Dodate nastanitev
• Ustvarite rezervacijo
• Napišete vsebino
• Pregledate statistiko

Kaj želite narediti?`;
    }
  }

  /**
   * Calculate progress percentage
   */
  private calculateProgress(step: string): number {
    const steps = ['greeting', 'property_info', 'rooms_info', 'amenities', 'integrations', 'complete'];
    const index = steps.indexOf(step);
    return Math.round((index / (steps.length - 1)) * 100);
  }

  /**
   * Save context to Memory MCP
   */
  private async saveContext(ctx: ConciergeContext): Promise<void> {
    try {
      await this.memory.storeGuestPreference(ctx.userId, {
        notes: `Onboarding progress: ${ctx.step}`,
      });
    } catch (error) {
      console.error('Failed to save onboarding context:', error);
    }
  }
}

// Factory function
export function createConciergeAgent(): ConciergeAgent {
  return new ConciergeAgent();
}
