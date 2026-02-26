/**
 * AgentFlow Pro - Multi-language Support Framework
 * Essential for tourism industry with international guests
 */

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
  defaultCurrency: string;
  dateFormat: string;
  numberFormat: string;
}

export interface TranslationRequest {
  content: string;
  sourceLanguage: string;
  targetLanguages: string[];
  context?: 'tourism' | 'hospitality' | 'booking' | 'general';
  contentType?: 'description' | 'email' | 'social' | 'blog' | 'legal';
  preserveFormatting?: boolean;
}

export interface TranslationResponse {
  success: boolean;
  translations: Record<string, TranslationResult>;
  detectedLanguage?: string;
  confidence?: number;
  errors?: string[];
}

export interface TranslationResult {
  translatedContent: string;
  confidence: number;
  alternatives?: string[];
  culturalNotes?: string[];
  seoKeywords?: string[];
}

export class MultiLanguageSupport {
  private static readonly SUPPORTED_LANGUAGES: Language[] = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      rtl: false,
      defaultCurrency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      numberFormat: '1,234.56'
    },
    {
      code: 'sl',
      name: 'Slovenian',
      nativeName: 'Slovenščina',
      rtl: false,
      defaultCurrency: 'EUR',
      dateFormat: 'DD.MM.YYYY',
      numberFormat: '1.234,56'
    },
    {
      code: 'de',
      name: 'German',
      nativeName: 'Deutsch',
      rtl: false,
      defaultCurrency: 'EUR',
      dateFormat: 'DD.MM.YYYY',
      numberFormat: '1.234,56'
    },
    {
      code: 'it',
      name: 'Italian',
      nativeName: 'Italiano',
      rtl: false,
      defaultCurrency: 'EUR',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: '1.234,56'
    },
    {
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      rtl: false,
      defaultCurrency: 'EUR',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: '1 234,56'
    },
    {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      rtl: false,
      defaultCurrency: 'EUR',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: '1.234,56'
    },
    {
      code: 'hr',
      name: 'Croatian',
      nativeName: 'Hrvatski',
      rtl: false,
      defaultCurrency: 'EUR',
      dateFormat: 'DD.MM.YYYY',
      numberFormat: '1.234,56'
    },
    {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      rtl: true,
      defaultCurrency: 'SAR',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: '1,234.56'
    }
  ];

  static getSupportedLanguages(): Language[] {
    return this.SUPPORTED_LANGUAGES;
  }

  static getLanguageByCode(code: string): Language | null {
    return this.SUPPORTED_LANGUAGES.find(lang => lang.code === code) || null;
  }

  static detectLanguage(content: string): string {
    // Simple language detection based on common words/phrases
    const slovenianWords = ['in', 'na', 'za', 'z', 'pri', 'po', 'do', 'od'];
    const germanWords = ['und', 'der', 'die', 'das', 'den', 'dem', 'des'];
    const italianWords = ['il', 'lo', 'la', 'le', 'un', 'una', 'del', 'della'];
    const frenchWords = ['le', 'la', 'les', 'des', 'du', 'de', 'un', 'une'];
    const spanishWords = ['el', 'la', 'los', 'las', 'un', 'una', 'del', 'de'];
    const arabicWords = ['في', 'من', 'إلى', 'على', 'وال', 'مع'];

    const words = content.toLowerCase().split(/\s+/);
    
    if (words.some(word => slovenianWords.includes(word))) return 'sl';
    if (words.some(word => germanWords.includes(word))) return 'de';
    if (words.some(word => italianWords.includes(word))) return 'it';
    if (words.some(word => frenchWords.includes(word))) return 'fr';
    if (words.some(word => spanishWords.includes(word))) return 'es';
    if (words.some(word => arabicWords.includes(word))) return 'ar';
    
    return 'en'; // Default to English
  }

  static async translateContent(request: TranslationRequest): Promise<TranslationResponse> {
    const translations: Record<string, TranslationResult> = {};
    const detectedLanguage = request.sourceLanguage || this.detectLanguage(request.content);
    
    try {
      for (const targetLang of request.targetLanguages) {
        const result = await this.translateToLanguage(
          request.content,
          detectedLanguage,
          targetLang,
          request.context,
          request.contentType
        );
        translations[targetLang] = result;
      }

      return {
        success: true,
        translations,
        detectedLanguage,
        confidence: 0.85
      };
    } catch (error) {
      return {
        success: false,
        translations: {},
        errors: [error instanceof Error ? error.message : 'Translation failed']
      };
    }
  }

  private static async translateToLanguage(
    content: string,
    sourceLang: string,
    targetLang: string,
    context?: string,
    contentType?: string
  ): Promise<TranslationResult> {
    // Mock translation implementation - integrate with real translation service
    const sourceLanguage = this.getLanguageByCode(sourceLang);
    const targetLanguage = this.getLanguageByCode(targetLang);
    
    if (!sourceLanguage || !targetLanguage) {
      throw new Error('Invalid language codes');
    }

    // Tourism-specific translations
    const tourismTranslations = this.getTourismTranslations(content, sourceLang, targetLang);
    
    return {
      translatedContent: tourismTranslations.translated,
      confidence: tourismTranslations.confidence,
      culturalNotes: tourismTranslations.culturalNotes,
      seoKeywords: tourismTranslations.seoKeywords,
      alternatives: tourismTranslations.alternatives
    };
  }

  private static getTourismTranslations(
    content: string,
    sourceLang: string,
    targetLang: string
  ): {
    translated: string;
    confidence: number;
    culturalNotes?: string[];
    seoKeywords?: string[];
    alternatives?: string[];
  } {
    const translations: Record<string, Record<string, any>> = {
      'en->sl': {
        'hotel': 'hotel',
        'room': 'soba',
        'reservation': 'rezervacija',
        'booking': 'rezervacija',
        'check-in': 'prijava',
        'check-out': 'odjava',
        'welcome': 'dobrodošli',
        'thank you': 'hvala',
        'tour': 'izlet',
        'vacation': 'počitnice',
        'adventure': 'pustolovščina'
      },
      'en->de': {
        'hotel': 'Hotel',
        'room': 'Zimmer',
        'reservation': 'Reservierung',
        'booking': 'Buchung',
        'check-in': 'Anreise',
        'check-out': 'Abreise',
        'welcome': 'Willkommen',
        'thank you': 'Danke',
        'tour': 'Tour',
        'vacation': 'Urlaub',
        'adventure': 'Abenteuer'
      },
      'en->it': {
        'hotel': 'albergo',
        'room': 'camera',
        'reservation': 'prenotazione',
        'booking': 'prenotazione',
        'check-in': 'check-in',
        'check-out': 'check-out',
        'welcome': 'benvenuto',
        'thank you': 'grazie',
        'tour': 'tour',
        'vacation': 'vacanze',
        'adventure': 'avventura'
      },
      'en->fr': {
        'hotel': 'hôtel',
        'room': 'chambre',
        'reservation': 'réservation',
        'booking': 'réservation',
        'check-in': 'arrivée',
        'check-out': 'départ',
        'welcome': 'bienvenue',
        'thank you': 'merci',
        'tour': 'visite',
        'vacation': 'vacances',
        'adventure': 'aventure'
      },
      'en->es': {
        'hotel': 'hotel',
        'room': 'habitación',
        'reservation': 'reserva',
        'booking': 'reserva',
        'check-in': 'check-in',
        'check-out': 'check-out',
        'welcome': 'bienvenido',
        'thank you': 'gracias',
        'tour': 'tour',
        'vacation': 'vacaciones',
        'adventure': 'aventura'
      }
    };

    const translationKey = `${sourceLang}->${targetLang}`;
    const translationMap = translations[translationKey] || {};
    
    let translatedContent = content;
    let confidence = 0.9;
    
    // Apply tourism-specific translations
    for (const [englishTerm, translatedTerm] of Object.entries(translationMap)) {
      const regex = new RegExp(`\\b${englishTerm}\\b`, 'gi');
      translatedContent = translatedContent.replace(regex, translatedTerm);
    }

    // Add cultural notes for specific languages
    const culturalNotes: string[] = [];
    if (targetLang === 'sl') {
      culturalNotes.push('Slovenian uses formal address for guests');
    }
    if (targetLang === 'de') {
      culturalNotes.push('German hospitality values precision and punctuality');
    }
    if (targetLang === 'ar') {
      culturalNotes.push('Arabic hospitality emphasizes generosity and respect');
    }

    // Generate SEO keywords for target language
    const seoKeywords = this.generateSEOKeywords(content, targetLang);

    return {
      translated: translatedContent,
      confidence,
      culturalNotes,
      seoKeywords
    };
  }

  private static generateSEOKeywords(content: string, language: string): string[] {
    const baseKeywords = ['hotel', 'accommodation', 'travel', 'vacation', 'booking'];
    const languageSpecificKeywords: Record<string, string[]> = {
      'sl': ['nastanitev', 'hoteli', 'počitnice', 'turizem', 'slovenija'],
      'de': ['unterkunft', 'hotels', 'urlaub', 'reisen', 'deutschland'],
      'it': ['alloggio', 'hotel', 'vacanze', 'viaggio', 'italia'],
      'fr': ['hébergement', 'hôtel', 'vacances', 'voyage', 'france'],
      'es': ['alojamiento', 'hotel', 'vacaciones', 'viaje', 'españa'],
      'ar': ['إقامة', 'فندق', 'عطلة', 'سفر', 'سياحة']
    };

    return [...baseKeywords, ...(languageSpecificKeywords[language] || [])];
  }

  static formatContentForLocale(
    content: string,
    languageCode: string,
    contentType: 'date' | 'currency' | 'number'
  ): string {
    const language = this.getLanguageByCode(languageCode);
    if (!language) return content;

    switch (contentType) {
      case 'date':
        return content.replace(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, 
          (match) => {
            const date = new Date(match);
            return date.toLocaleDateString(languageCode === 'en' ? 'en-US' : languageCode);
          });

      case 'currency':
        return content.replace(/\$\d+(?:\.\d{2})?/g, 
          (match) => {
            const amount = parseFloat(match.replace('$', ''));
            return new Intl.NumberFormat(languageCode, {
              style: 'currency',
              currency: language.defaultCurrency
            }).format(amount);
          });

      case 'number':
        return content.replace(/\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b/g,
          (match) => {
            const number = parseFloat(match.replace(/,/g, ''));
            return new Intl.NumberFormat(languageCode).format(number);
          });

      default:
        return content;
    }
  }

  static validateTranslationQuality(
    originalContent: string,
    translatedContent: string,
    sourceLang: string,
    targetLang: string
  ): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Check for length preservation (within 20% variance)
    const lengthDiff = Math.abs(originalContent.length - translatedContent.length) / originalContent.length;
    if (lengthDiff > 0.2) {
      issues.push('Translation length differs significantly from original');
      score -= 10;
    }

    // Check for tourism-specific terminology
    const tourismTerms = ['hotel', 'reservation', 'booking', 'check-in', 'check-out'];
    const sourceTerms = tourismTerms.filter(term => 
      originalContent.toLowerCase().includes(term.toLowerCase()));
    const targetTerms = tourismTerms.filter(term => 
      translatedContent.toLowerCase().includes(term.toLowerCase()));

    if (sourceTerms.length !== targetTerms.length) {
      issues.push('Missing tourism-specific terminology');
      score -= 15;
      suggestions.push('Ensure tourism terms are properly translated');
    }

    return { score, issues, suggestions };
  }
}
