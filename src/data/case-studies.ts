export interface CaseStudy {
  id: string;
  company: string;
  industry: string;
  role: string;
  quote: string;
  challenge: string;
  solution: string;
  outcome: string;
  metric: string;
  metricLabel: string;
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: "boutique-hotel-content",
    company: "Alpine Retreat",
    industry: "Hospitality",
    role: "Marketing Manager",
    quote:
      "We went from 2 destination posts a month to 12. Our SEO rankings for 'things to do in [region]' doubled. AgentFlow's Brand Voice keeps our content consistent with our boutique positioning.",
    challenge:
      "Small marketing team needed to produce destination guides, room descriptions, and seasonal campaigns for 5 properties. Manual drafting took 6+ hours per piece.",
    solution:
      "We set up Brand Voice from our website, defined our target guests (couples, families), and used Bulk Generate for destination topics. The Optimize modal helped with meta titles and local SEO keywords.",
    outcome:
      "12 posts per month within 4 weeks. Direct booking traffic up 35%. Content team focuses on photography and partnerships; AgentFlow handles the copy.",
    metric: "35%",
    metricLabel: "increase in direct booking traffic",
  },
  {
    id: "saas-content-scale",
    company: "Flowbase",
    industry: "SaaS",
    role: "Content Lead",
    quote:
      "AgentFlow helped us scale our blog from 2 posts a week to 12. Same team, no new hires. The Bulk Grid and audience-specific generation let us target B2B and developer audiences with one workflow.",
    challenge:
      "We needed to 6x our content output to support a new product launch, but couldn't afford to scale the content team. Manual drafts took 4+ hours per post.",
    solution:
      "We set up Brand Voice from our blog URL, defined two audiences (B2B decision-makers and developers), and used the Bulk Grid to generate 50 topic batches. The Marketing Editor's inline Improve/Expand helped our editors polish drafts in minutes instead of hours.",
    outcome:
      "We hit 12 posts per week within 3 weeks. Organic traffic grew 40% in the first quarter. Our content team now ranks topics, generates drafts, and polishes—with AgentFlow handling the heavy lifting.",
    metric: "3x",
    metricLabel: "faster content creation",
  },
  {
    id: "agency-production",
    company: "Nexus Digital",
    industry: "Marketing Agency",
    role: "Marketing Director",
    quote:
      "We cut content production time in half. Our writers focus on strategy and client input; AgentFlow handles the drafts. The Prompt Library and Personalization tool are game-changers for client campaigns.",
    challenge:
      "As a 15-person agency, we were drowning in client content requests. Each blog or social campaign required multiple rounds of revision, eating into margins.",
    solution:
      "We onboard clients with their brand URLs for automatic Voice and Style capture. For each campaign we use the Prompt Library to kick off drafts, then Personalization to turn one template into 20+ client-specific variations. Publish to WordPress and LinkedIn directly from the app.",
    outcome:
      "Production time per deliverable dropped from 3–4 hours to under 90 minutes. We onboarded 8 new clients in 6 months without adding headcount. Client satisfaction scores increased because we deliver faster without sacrificing quality.",
    metric: "50%",
    metricLabel: "time saved per deliverable",
  },
  {
    id: "tech-startup-seo",
    company: "DeployHQ",
    industry: "Tech Startup",
    role: "Growth Manager",
    quote:
      "From idea to publish in under an hour. Our SEO rankings have never been better. The Optimization modal gives us meta titles, descriptions, and internal link suggestions in one click.",
    challenge:
      "We're a dev tools startup with strong product but weak content. Competing with larger players meant we needed more SEO content, but our small team couldn't keep up.",
    solution:
      "We use AgentFlow's Research agent for topic ideas, then Generate for 10 drafts at a time. The SEO Optimize modal suggests meta titles, descriptions, and internal links. We publish to WordPress and repurpose to LinkedIn. Visual Guidelines keep our brand consistent across everything.",
    outcome:
      "We went from 5 posts per month to 20+. Organic traffic doubled in 4 months. Three posts hit page one for high-intent keywords. Our Growth team runs content as a core channel now.",
    metric: "2x",
    metricLabel: "faster publishing",
  },
  {
    id: "tourism-destination-content",
    company: "Alpine Destinations",
    industry: "Tourism",
    role: "Marketing Manager",
    quote:
      "We scaled destination content from 5 to 30 guides per quarter. The Tourism Content Pipeline and destination prompts let us launch new regions without hiring. Research agent finds local gems we'd never uncover manually.",
    challenge:
      "We manage 12 destination regions and needed fresh guides, hotel descriptions, and itineraries for each. Our small marketing team spent weeks on each region. Manual research and writing couldn't keep up with seasonal campaigns.",
    solution:
      "We use the Tourism Content Pipeline: Research agent gathers local insights and attractions, Content agent generates guides using Destination Guide and Hotel Description prompts. We deploy to our WordPress travel site. Brand Voice keeps our alpine-adventure tone consistent across all content.",
    outcome:
      "We went from 5 guides per quarter to 30+. Content production time per region dropped from 3 weeks to 3 days. Organic traffic to our destination pages grew 55% in 6 months. Our team now focuses on partnerships and strategy while AgentFlow handles the bulk content.",
    metric: "60%",
    metricLabel: "content production time saved",
  },
];

export function getCaseStudyById(id: string): CaseStudy | undefined {
  return CASE_STUDIES.find((c) => c.id === id);
}
