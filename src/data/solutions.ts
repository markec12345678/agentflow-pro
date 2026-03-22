export interface SolutionRole {
  id: string;
  name: string;
  headline: string;
  description: string;
  features: string[];
  ctaText: string;
  icon?: string;
  cardDescription?: string;
}

export const SOLUTIONS: SolutionRole[] = [
  {
    id: "tourism-marketing",
    name: "Tourism Marketing Manager",
    headline: "Scale Destination Content Without Scaling Headcount",
    description:
      "Create SEO destination guides, hotel copy, seasonal campaigns, and social content that drives bookings. One topic, 10 on-brand drafts in minutes.",
    features: [
      "Destination guides and things-to-do content",
      "Hotel room and experience descriptions",
      "Seasonal campaign copy (summer, events, packages)",
      "Instagram captions and social for travel",
    ],
    ctaText: "Start Free Trial",
    icon: "✈️",
    cardDescription: "Destination guides, hotel copy, seasonal campaigns, social for travel.",
  },
  {
    id: "content-marketer",
    name: "Content Marketer",
    headline: "Scale Your Content Without Scaling Headcount",
    description:
      "Generate blog posts, social copy, and email campaigns that match your brand voice. One topic, 10 SEO-optimized drafts in minutes.",
    features: [
      "One-click blog generation (10 posts per run)",
      "Brand Voice and Style Guide from your URLs",
      "Prompt Library for social, email, and blog templates",
      "Bulk content grid for campaigns",
    ],
    ctaText: "Start Free Trial",
    cardDescription: "Scale blog, social, and email content. 10 posts per click.",
  },
  {
    id: "product-marketing",
    name: "Product Marketing",
    headline: "Launch Faster with AI-Powered Messaging",
    description:
      "Create product launches, feature announcements, and positioning copy that resonates. Audience-specific messaging built in.",
    features: [
      "Audience-specific content (B2B, developers, etc.)",
      "Product launch email templates",
      "Feature comparison and positioning copy",
      "Visual guidelines for consistent brand",
    ],
    ctaText: "Get Started",
    cardDescription: "Launch copy, feature announcements, audience-specific messaging.",
  },
  {
    id: "brand-manager",
    name: "Brand Manager",
    headline: "Keep Your Brand Voice Consistent Everywhere",
    description:
      "Define visual guidelines, audiences, and style once. Every piece of content stays on-brand automatically.",
    features: [
      "Visual Guidelines (colors, fonts, logo)",
      "Multi-audience messaging",
      "Style Guide enforcement in every output",
      "Customer stories and social proof",
    ],
    ctaText: "Try AgentFlow Pro",
    cardDescription: "Visual guidelines, audiences, style enforcement everywhere.",
  },
];

export function getSolutionById(id: string): SolutionRole | undefined {
  return SOLUTIONS.find((s) => s.id === id);
}

export interface SolutionIndustry {
  id: string;
  name: string;
  headline: string;
  description: string;
  features: string[];
  ctaText: string;
  icon?: string;
  cardDescription?: string;
}

export const INDUSTRIES: SolutionIndustry[] = [
  {
    id: "tourism",
    name: "Tourism & Hospitality",
    headline: "AI Content for Hotels, DMOs & Travel",
    description:
      "Generate destination guides, room descriptions, seasonal campaigns, and SEO content that drives direct bookings. Built for hotels, destination marketing organizations, and tour operators.",
    features: [
      "Destination and attraction blog posts",
      "Hotel room and experience descriptions",
      "Seasonal campaign content (summer, winter, events)",
      "Multi-destination SEO content",
      "Multi-language support (SL, EN, DE, IT, HR)",
    ],
    ctaText: "Start Free Trial",
    icon: "🏨",
    cardDescription: "Hotels, DMOs, tour operators. Destination guides, room copy, seasonal campaigns.",
  },
  {
    id: "tech",
    name: "Tech",
    headline: "AI Content for Technology & SaaS",
    description:
      "Scale your technical content, product docs, and developer marketing. Generate blog posts, release notes, and tutorials that resonate with your audience.",
    features: [
      "Technical blog posts and tutorials",
      "Product launch and release notes",
      "Developer-focused messaging",
      "SEO for technical keywords",
    ],
    ctaText: "Start Free Trial",
    icon: "💻",
    cardDescription: "Technical content, SaaS, developer marketing.",
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    headline: "Content That Converts for E-commerce",
    description:
      "Create product descriptions, category pages, and marketing copy that drives sales. Optimized for search and conversion.",
    features: [
      "Product and category descriptions",
      "Seasonal campaign content",
      "Email and social copy",
      "SEO for product pages",
    ],
    ctaText: "Get Started",
    icon: "🛒",
    cardDescription: "Product copy, campaigns, conversion content.",
  },
  {
    id: "healthcare",
    name: "Healthcare",
    headline: "Compliant Content for Healthcare",
    description:
      "Generate healthcare marketing content that stays compliant. Patient education, provider messaging, and brand-safe copy.",
    features: [
      "Patient education content",
      "Provider and B2B messaging",
      "Compliance-aware copy",
      "Medical terminology support",
    ],
    ctaText: "Try AgentFlow Pro",
    icon: "🏥",
    cardDescription: "Patient education, compliant marketing.",
  },
  {
    id: "finance",
    name: "Finance",
    headline: "Financial Services Content at Scale",
    description:
      "Create compliant financial content for fintech, banking, and insurance. Thought leadership, product copy, and regulatory-aware messaging.",
    features: [
      "Thought leadership articles",
      "Product and service descriptions",
      "Regulatory-aware copy",
      "Multi-audience messaging",
    ],
    ctaText: "Start Free Trial",
    icon: "💰",
    cardDescription: "Fintech, banking, regulatory-aware copy.",
  },
];

export function getIndustryBySlug(slug: string): SolutionIndustry | undefined {
  return INDUSTRIES.find((s) => s.id === slug);
}
