/**
 * AgentFlow Pro - Guest Communication Agent
 * Automated messaging, review responses, multi-language support
 */

import type { Agent } from "../../orchestrator/Orchestrator";
import { isMockMode } from "@/lib/mock-mode";

export interface CommunicationInput {
  action: "send_message" | "generate_review_response" | "create_template";
  guestId?: string;
  reservationId?: string;
  messageType?: "pre_arrival" | "post_stay" | "check_in" | "check_out" | "inquiry" | "complaint";
  language?: string;
  customMessage?: string;
  reviewText?: string;
  reviewRating?: number;
  templateName?: string;
  templateContent?: string;
}

export interface CommunicationOutput {
  success: boolean;
  messageId?: string;
  content?: string;
  translatedContent?: Record<string, string>;
  scheduledAt?: Date;
  sentAt?: Date;
  message?: string;
  errors?: string[];
}

export function createCommunicationAgent(config?: {
  emailProvider?: string;
  smsProvider?: string;
  translationKey?: string;
}): Agent {
  const emailProvider = config?.emailProvider ?? process.env.EMAIL_PROVIDER ?? "";
  const smsProvider = config?.smsProvider ?? process.env.SMS_PROVIDER ?? "";
  const translationKey = config?.translationKey ?? process.env.TRANSLATION_API_KEY ?? "";

  return {
    id: "communication-agent",
    type: "communication",
    name: "Guest Communication Agent",
    execute: async (input: unknown): Promise<CommunicationOutput> => {
      const { 
        action, 
        guestId, 
        reservationId, 
        messageType, 
        language = "en", 
        customMessage,
        reviewText,
        reviewRating,
        templateName,
        templateContent
      } = (input as CommunicationInput) ?? {};
      
      if (isMockMode()) {
        return {
          success: true,
          messageId: `MSG_${Date.now()}`,
          content: "Mock message content",
          translatedContent: { en: "Mock message", sl: "Mock sporočilo" },
          scheduledAt: new Date(),
          message: "Mock communication sent successfully"
        };
      }

      try {
        switch (action) {
          case "send_message":
            return await sendMessage(guestId!, reservationId!, messageType!, language, customMessage);
          
          case "generate_review_response":
            return await generateReviewResponse(reviewText!, reviewRating!, language);
          
          case "create_template":
            return await createTemplate(templateName!, templateContent!, language);
          
          default:
            return {
              success: false,
              message: `Unknown action: ${action}`,
              errors: [`Invalid action: ${action}`]
            };
        }
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "Unknown error occurred",
          errors: [error instanceof Error ? error.message : "Unknown error"]
        };
      }
    },
  };
}

async function sendMessage(
  guestId: string, 
  reservationId: string, 
  messageType: string, 
  language: string, 
  customMessage?: string
): Promise<CommunicationOutput> {
  const messageId = `MSG_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  let content = customMessage;
  if (!content) {
    content = generateMessageContent(messageType, language);
  }
  
  // Translate if needed
  const translatedContent = await translateContent(content, language);
  
  // Mock sending - integrate with email/SMS providers
  return {
    success: true,
    messageId,
    content,
    translatedContent,
    sentAt: new Date(),
    message: `Message sent via ${messageType} in ${language}`
  };
}

async function generateReviewResponse(
  reviewText: string, 
  rating: number, 
  language: string
): Promise<CommunicationOutput> {
  let responseContent = "";
  
  if (rating >= 4) {
    responseContent = generatePositiveReviewResponse(reviewText, language);
  } else if (rating >= 2) {
    responseContent = generateNeutralReviewResponse(reviewText, language);
  } else {
    responseContent = generateNegativeReviewResponse(reviewText, language);
  }
  
  const translatedContent = await translateContent(responseContent, language);
  
  return {
    success: true,
    messageId: `REVIEW_${Date.now()}`,
    content: responseContent,
    translatedContent,
    message: "Review response generated"
  };
}

async function createTemplate(
  templateName: string, 
  templateContent: string, 
  language: string
): Promise<CommunicationOutput> {
  // Mock template creation - save to database
  return {
    success: true,
    messageId: `TEMPLATE_${Date.now()}`,
    content: templateContent,
    message: `Template "${templateName}" created in ${language}`
  };
}

function generateMessageContent(messageType: string, language: string): string {
  const templates = {
    en: {
      pre_arrival: "Dear Guest, we're excited to welcome you! Your check-in details and local recommendations are attached.",
      post_stay: "Thank you for staying with us! We'd love to hear about your experience.",
      check_in: "Welcome! Check-in starts at 3 PM. Your room is ready and we're here to assist.",
      check_out: "Safe travels! Check-out is at 11 AM. We hope to see you again soon.",
      inquiry: "Thank you for your inquiry. We'll respond within 24 hours with availability information."
    },
    sl: {
      pre_arrival: "Spoštovani gost, veselimo se vašega prihoda! Podatki o prijavi in lokalne priporočila so v prilogi.",
      post_stay: "Hvala, ker ste bili naš gost! Radi bi slišali za vaše izkušnje.",
      check_in: "Dobrodošli! Prijava začne ob 15:00. Vaša soba je pripravljena in tu smo za pomoč.",
      check_out: "Srečno potovanje! Odjava je ob 11:00. Upamo, da vas bomo spet videli.",
      inquiry: "Hvala za povpraševanje. Odgovorili vam bomo v 24 urah s podatki o razpoložljivosti."
    }
  };
  
  return templates[language as keyof typeof templates]?.[messageType as keyof typeof templates.en] || 
         templates.en[messageType as keyof typeof templates.en];
}

function generatePositiveReviewResponse(reviewText: string, language: string): string {
  const responses = {
    en: `Thank you for your wonderful review! We're delighted you had a great experience and look forward to welcoming you back.`,
    sl: `Hvala za čudovit review! Veseli smo, da ste bili zadovoljni in se veselimo vašega ponovnega prihoda.`
  };
  
  return responses[language as keyof typeof responses] || responses.en;
}

function generateNeutralReviewResponse(reviewText: string, language: string): string {
  const responses = {
    en: `Thank you for your feedback. We appreciate your suggestions and will use them to improve our services.`,
    sl: `Hvala za povratne informacije. Cenimo vaše predloge in jih bomo uporabili za izboljšavo naših storitev.`
  };
  
  return responses[language as keyof typeof responses] || responses.en;
}

function generateNegativeReviewResponse(reviewText: string, language: string): string {
  const responses = {
    en: `We sincerely apologize for your experience. We take your feedback seriously and would appreciate the opportunity to make things right.`,
    sl: `Iskreno se opravičujemo za vaše izkušnje. Vaše povratne informacije jemljemo resno in bi radi popravili stvari.`
  };
  
  return responses[language as keyof typeof responses] || responses.en;
}

async function translateContent(content: string, targetLanguage: string): Promise<Record<string, string>> {
  // Mock translation - integrate with translation service
  const translations: Record<string, string> = {
    en: content,
    sl: content // Mock translation - replace with actual translation API
  };
  
  return translations;
}
