/**
 * AI Prompt Templates for AgentFlow Pro
 * 
 * Pre-built prompt templates for AI-powered features:
 * - Guest communication (reviews, messages, emails)
 * - Content generation (descriptions, titles, amenities)
 * - Translation (multi-language support)
 * - Analysis (sentiment, feedback, trends)
 * - Business (reports, forecasts, recommendations)
 * 
 * Each template includes:
 * - Prompt structure with variables
 * - Category classification
 * - Word/character limits
 * - Tone and style guidelines
 * 
 * @version 1.0.0
 * @author AgentFlow Pro Team
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AIPromptTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: 'guest-communication' | 'content' | 'translation' | 'analysis' | 'business' | 'operations';
  variables: string[];
  maxWords?: number;
  maxCharacters?: number;
  tone?: 'professional' | 'friendly' | 'formal' | 'casual' | 'empathetic';
  language?: string;
  examples?: Array<{
    input: Record<string, string>;
    output: string;
  }>;
}

// ============================================================================
// AI PROMPT TEMPLATES
// ============================================================================

export const AI_PROMPT_TEMPLATES: Record<string, AIPromptTemplate> = {
  // ============================================================================
  // GUEST COMMUNICATION
  // ============================================================================

  respond_to_review: {
    id: 'respond_to_review',
    name: 'Odgovor na Review',
    description: 'Professional response to guest review',
    prompt: `Write a professional and friendly response to this guest review. Keep it under {{maxWords}} words.

Review: "{{review_text}}"
Guest Name: {{guest_name}}
Property Name: {{property_name}}
Review Score: {{review_score}}/10

Guidelines:
- Thank the guest for their feedback
- Address specific points mentioned
- If negative, apologize and mention improvements
- If positive, express appreciation
- Invite them to return
- Sign off as property management

Response:`,
    category: 'guest-communication',
    variables: ['review_text', 'guest_name', 'property_name', 'review_score', 'maxWords'],
    maxWords: 150,
    tone: 'professional',
    examples: [{
      input: {
        review_text: 'Amazing stay! Beautiful view and friendly staff.',
        guest_name: 'John Doe',
        property_name: 'Villa Bled',
        review_score: '9',
        maxWords: '100'
      },
      output: 'Dear John, Thank you so much for your wonderful review! We\'re delighted that you enjoyed the view and our staff\'s hospitality. It was our pleasure hosting you at Villa Bled. We look forward to welcoming you back soon! Warm regards, Villa Bled Management'
    }]
  },

  respond_to_complaint: {
    id: 'respond_to_complaint',
    name: 'Odgovor na Pritožbo',
    description: 'Empathetic response to guest complaint',
    prompt: `Write an empathetic and solution-oriented response to this guest complaint. Keep it under {{maxWords}} words.

Complaint: "{{complaint_text}}"
Guest Name: {{guest_name}}
Property Name: {{property_name}}
Issue Type: {{issue_type}}

Guidelines:
- Acknowledge their frustration
- Apologize sincerely
- Explain what went wrong (briefly)
- Describe corrective action taken
- Offer compensation if appropriate
- Ensure it won't happen again
- Invite them to give another chance

Response:`,
    category: 'guest-communication',
    variables: ['complaint_text', 'guest_name', 'property_name', 'issue_type', 'maxWords'],
    maxWords: 200,
    tone: 'empathetic'
  },

  welcome_message: {
    id: 'welcome_message',
    name: 'Welcome Message',
    description: 'Personalized welcome message for guest',
    prompt: `Write a warm and welcoming message for a guest arriving soon. Keep it under {{maxWords}} words.

Guest Name: {{guest_name}}
Property Name: {{property_name}}
Check-in Date: {{check_in_date}}
Check-out Date: {{check_out_date}}
Room Type: {{room_type}}
Special Occasion: {{special_occasion}}

Guidelines:
- Express excitement for their visit
- Mention check-in details
- Highlight property features
- Mention any special arrangements
- Provide contact information
- Keep it friendly and warm

Message:`,
    category: 'guest-communication',
    variables: ['guest_name', 'property_name', 'check_in_date', 'check_out_date', 'room_type', 'special_occasion', 'maxWords'],
    maxWords: 150,
    tone: 'friendly'
  },

  // ============================================================================
  // CONTENT GENERATION
  // ============================================================================

  generate_room_description: {
    id: 'generate_room_description',
    name: 'Generiraj Opis Sobe',
    description: 'Compelling room description',
    prompt: `Write a compelling and detailed room description for a property listing. Keep it under {{maxWords}} words.

Room Type: {{room_type}}
Size: {{room_size}} m²
Max Guests: {{max_guests}}
Bed Type: {{bed_type}}
View: {{view}}
Features: {{features}}
Amenities: {{amenities}}

Guidelines:
- Start with a captivating opening
- Highlight unique features
- Describe the view
- Mention comfort aspects
- List key amenities
- End with a call-to-action
- Use sensory language
- Keep it engaging

Description:`,
    category: 'content',
    variables: ['room_type', 'room_size', 'max_guests', 'bed_type', 'view', 'features', 'amenities', 'maxWords'],
    maxWords: 200,
    tone: 'professional'
  },

  generate_property_title: {
    id: 'generate_property_title',
    name: 'Generiraj Naslov Propriety',
    description: 'Catchy property title for listings',
    prompt: `Generate 5 catchy and SEO-friendly titles for this property. Each title should be under {{maxCharacters}} characters.

Property Type: {{property_type}}
Location: {{location}}
Key Feature: {{key_feature}}
Bedrooms: {{bedrooms}}
Special Amenities: {{special_amenities}}

Guidelines:
- Include location
- Highlight unique feature
- Use power words (Luxury, Stunning, Charming, etc.)
- Keep it concise
- Make it stand out

Generate 5 options:`,
    category: 'content',
    variables: ['property_type', 'location', 'key_feature', 'bedrooms', 'special_amenities', 'maxCharacters'],
    maxCharacters: 80,
    tone: 'professional'
  },

  generate_amenity_description: {
    id: 'generate_amenity_description',
    name: 'Opis Amenitetov',
    description: 'Description of property amenities',
    prompt: `Write engaging descriptions for these property amenities. Keep each under {{maxWords}} words.

Amenities: {{amenities}}
Property Type: {{property_type}}
Target Audience: {{target_audience}}

Guidelines:
- Explain benefit of each amenity
- Use appealing language
- Highlight quality/brand if relevant
- Keep it concise

Descriptions:`,
    category: 'content',
    variables: ['amenities', 'property_type', 'target_audience', 'maxWords'],
    maxWords: 50,
    tone: 'friendly'
  },

  // ============================================================================
  // TRANSLATION
  // ============================================================================

  translate_message: {
    id: 'translate_message',
    name: 'Prevedi Sporočilo',
    description: 'Translate message to target language',
    prompt: `Translate this message to {{target_language}}. Keep it professional and friendly. Preserve any names, dates, and numbers.

Original Message:
"{{message}}"

Original Language: {{source_language}}
Target Language: {{target_language}}
Tone: {{tone}}

Guidelines:
- Maintain the original meaning
- Adapt cultural references if needed
- Keep numbers and dates format appropriate
- Ensure natural flow
- Preserve formality level

Translation:`,
    category: 'translation',
    variables: ['message', 'source_language', 'target_language', 'tone'],
    tone: 'professional'
  },

  localize_content: {
    id: 'localize_content',
    name: 'Lokaliziraj Vsebino',
    description: 'Localize content for specific market',
    prompt: `Localize this content for the {{target_market}} market. Adapt cultural references, measurements, and formatting.

Content:
"{{content}}"

Source Market: {{source_market}}
Target Market: {{target_market}}

Guidelines:
- Convert measurements (m² to sq ft if needed)
- Adapt currency if mentioned
- Localize date formats
- Adapt cultural references
- Ensure appropriate tone

Localized Content:`,
    category: 'translation',
    variables: ['content', 'source_market', 'target_market'],
    tone: 'professional'
  },

  // ============================================================================
  // ANALYSIS
  // ============================================================================

  analyze_sentiment: {
    id: 'analyze_sentiment',
    name: 'Analiza Sentimenta',
    description: 'Analyze sentiment of guest feedback',
    prompt: `Analyze the sentiment of this guest feedback and provide detailed insights.

Feedback:
"{{feedback_text}}"

Provide analysis for:
1. Overall Sentiment (Positive/Neutral/Negative)
2. Sentiment Score (0-10)
3. Key Emotions Detected
4. Specific Topics Mentioned
5. Areas of Satisfaction
6. Areas of Concern
7. Suggested Actions

Analysis:`,
    category: 'analysis',
    variables: ['feedback_text'],
    tone: 'professional'
  },

  extract_insights: {
    id: 'extract_insights',
    name: 'Izloži Insights',
    description: 'Extract key insights from reviews',
    prompt: `Extract key insights from these guest reviews. Identify patterns and trends.

Reviews:
"{{reviews}}"

Provide:
1. Most Mentioned Positive Aspects (top 3)
2. Most Mentioned Negative Aspects (top 3)
3. Emerging Trends
4. Guest Demographics Insights
5. Seasonal Patterns
6. Competitive Advantages
7. Areas for Improvement

Insights:`,
    category: 'analysis',
    variables: ['reviews'],
    tone: 'professional'
  },

  // ============================================================================
  // BUSINESS
  // ============================================================================

  generate_monthly_report: {
    id: 'generate_monthly_report',
    name: 'Generiraj Mesečno Poročilo',
    description: 'Generate monthly performance report',
    prompt: `Generate a comprehensive monthly performance report based on this data.

Property: {{property_name}}
Month: {{month}} {{year}}

Key Metrics:
- Revenue: €{{revenue}} (vs Budget: €{{budget}})
- Occupancy: {{occupancy}}% (vs Last Year: {{occupancy_ly}}%)
- ADR: €{{adr}} (vs Last Year: €{{adr_ly}})
- RevPAR: €{{revpar}} (vs Last Year: €{{revpar_ly}})
- Review Score: {{review_score}}/10
- Total Reviews: {{review_count}}

Provide:
1. Executive Summary
2. Key Achievements
3. Areas of Concern
4. Recommendations for Next Month

Report:`,
    category: 'business',
    variables: ['property_name', 'month', 'year', 'revenue', 'budget', 'occupancy', 'occupancy_ly', 'adr', 'adr_ly', 'revpar', 'revpar_ly', 'review_score', 'review_count'],
    tone: 'professional'
  },

  generate_forecast: {
    id: 'generate_forecast',
    name: 'Generiraj Forecast',
    description: 'Generate revenue forecast',
    prompt: `Generate a revenue forecast based on historical data and market trends.

Property: {{property_name}}
Forecast Period: {{period}}

Historical Data:
- Last Year Revenue: €{{revenue_ly}}
- Last Month Revenue: €{{revenue_lm}}
- Current Occupancy: {{occupancy}}%
- Current ADR: €{{adr}}

Market Trends:
- Market Growth: {{market_growth}}%
- Seasonality: {{seasonality}}
- Events: {{events}}

Provide:
1. Revenue Forecast
2. Occupancy Forecast
3. ADR Forecast
4. Key Assumptions
5. Risks and Opportunities

Forecast:`,
    category: 'business',
    variables: ['property_name', 'period', 'revenue_ly', 'revenue_lm', 'occupancy', 'adr', 'market_growth', 'seasonality', 'events'],
    tone: 'professional'
  },

  // ============================================================================
  // OPERATIONS
  // ============================================================================

  generate_task_description: {
    id: 'generate_task_description',
    name: 'Opis Naloge',
    description: 'Generate clear task description for staff',
    prompt: `Generate a clear and actionable task description for staff.

Task Type: {{task_type}}
Priority: {{priority}}
Location: {{location}}
Deadline: {{deadline}}
Special Instructions: {{special_instructions}}

Guidelines:
- Be specific and clear
- Include all necessary details
- Mention priority level
- Add deadline
- Include any special requirements

Task Description:`,
    category: 'operations',
    variables: ['task_type', 'priority', 'location', 'deadline', 'special_instructions'],
    maxWords: 100,
    tone: 'professional'
  },

  generate_checklist: {
    id: 'generate_checklist',
    name: 'Generiraj Checklist',
    description: 'Generate operational checklist',
    prompt: `Generate a comprehensive checklist for this operational task.

Task: {{task}}
Role: {{role}}
Property Type: {{property_type}}

Guidelines:
- List all steps in order
- Include quality checks
- Add time estimates
- Mention required tools/materials
- Include safety considerations

Checklist:`,
    category: 'operations',
    variables: ['task', 'role', 'property_type'],
    tone: 'professional'
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Render prompt with variables
 * 
 * @param templateId - Template ID
 * @param variables - Variable values
 * @returns Rendered prompt
 * 
 * @example
 * const prompt = renderPrompt('respond_to_review', {
 *   review_text: 'Great stay!',
 *   guest_name: 'John',
 *   property_name: 'Villa',
 *   review_score: '9',
 *   maxWords: '100'
 * });
 */
export function renderPrompt(
  templateId: string,
  variables: Record<string, string>
): string {
  const template = AI_PROMPT_TEMPLATES[templateId];

  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  let prompt = template.prompt;

  // Replace all variables
  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  return prompt;
}

/**
 * Get template by ID
 */
export function getTemplateById(templateId: string): AIPromptTemplate | undefined {
  return AI_PROMPT_TEMPLATES[templateId];
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: AIPromptTemplate['category']): AIPromptTemplate[] {
  return Object.values(AI_PROMPT_TEMPLATES).filter(
    (template) => template.category === category
  );
}

/**
 * Check if template exists
 */
export function templateExists(templateId: string): boolean {
  return templateId in AI_PROMPT_TEMPLATES;
}

/**
 * Get all template IDs
 */
export const AI_TEMPLATE_IDS = Object.keys(AI_PROMPT_TEMPLATES);

// ============================================================================
// EXPORTS
// ============================================================================

export type { AIPromptTemplate };
export default AI_PROMPT_TEMPLATES;
