import type { Workflow } from "@/workflows/types";

export interface WorkflowApp {
  id: string;
  name: string;
  description: string;
  category: "content" | "research" | "automation" | "mixed";
  workflow: Omit<Workflow, "id">;
}

export const WORKFLOW_APPS: WorkflowApp[] = [
  {
    id: "content-pipeline",
    name: "Content Pipeline",
    description:
      "Research → Content → Deploy. Research a topic, generate blog posts, then deploy. Ideal for content teams.",
    category: "content",
    workflow: {
      name: "Content Pipeline",
      nodes: [
        {
          id: "t1",
          type: "Trigger",
          data: { label: "Start", triggerType: "manual" },
          position: { x: 100, y: 100 },
        },
        {
          id: "r1",
          type: "Agent",
          data: { label: "Research Agent", agentType: "research" },
          position: { x: 350, y: 100 },
        },
        {
          id: "c1",
          type: "Agent",
          data: { label: "Content Agent", agentType: "content" },
          position: { x: 600, y: 100 },
        },
        {
          id: "d1",
          type: "Agent",
          data: { label: "Deploy Agent", agentType: "deploy" },
          position: { x: 850, y: 100 },
        },
      ],
      edges: [
        { id: "e1", source: "t1", target: "r1" },
        { id: "e2", source: "r1", target: "c1" },
        { id: "e3", source: "c1", target: "d1" },
      ],
    },
  },
  {
    id: "research-brief",
    name: "Research Brief",
    description:
      "Research Agent only. Use for market research, competitor analysis, or topic deep-dives.",
    category: "research",
    workflow: {
      name: "Research Brief",
      nodes: [
        {
          id: "t1",
          type: "Trigger",
          data: { label: "Start", triggerType: "manual" },
          position: { x: 100, y: 100 },
        },
        {
          id: "r1",
          type: "Agent",
          data: { label: "Research Agent", agentType: "research" },
          position: { x: 400, y: 100 },
        },
      ],
      edges: [{ id: "e1", source: "t1", target: "r1" }],
    },
  },
  {
    id: "conditional-content",
    name: "Conditional Content",
    description:
      "Add a condition to branch your workflow. Research → Condition → Content or skip.",
    category: "mixed",
    workflow: {
      name: "Conditional Content",
      nodes: [
        {
          id: "t1",
          type: "Trigger",
          data: { label: "Start", triggerType: "manual" },
          position: { x: 100, y: 150 },
        },
        {
          id: "r1",
          type: "Agent",
          data: { label: "Research", agentType: "research" },
          position: { x: 350, y: 150 },
        },
        {
          id: "cond1",
          type: "Condition",
          data: { label: "Has results?", operator: "eq", operandA: "", operandB: "" },
          position: { x: 600, y: 150 },
        },
        {
          id: "c1",
          type: "Agent",
          data: { label: "Content Agent", agentType: "content" },
          position: { x: 900, y: 80 },
        },
        {
          id: "a1",
          type: "Action",
          data: { label: "Log (skip)", action: "log" },
          position: { x: 900, y: 220 },
        },
      ],
      edges: [
        { id: "e1", source: "t1", target: "r1" },
        { id: "e2", source: "r1", target: "cond1" },
        { id: "e3", source: "cond1", target: "c1", sourceHandle: "true" },
        { id: "e4", source: "cond1", target: "a1", sourceHandle: "false" },
      ],
    },
  },
  {
    id: "full-stack",
    name: "Full Stack Automation",
    description:
      "Research → Content → Code → Deploy. End-to-end from topic to live site.",
    category: "automation",
    workflow: {
      name: "Full Stack Automation",
      nodes: [
        {
          id: "t1",
          type: "Trigger",
          data: { label: "Start", triggerType: "manual" },
          position: { x: 80, y: 120 },
        },
        {
          id: "r1",
          type: "Agent",
          data: { label: "Research", agentType: "research" },
          position: { x: 300, y: 120 },
        },
        {
          id: "c1",
          type: "Agent",
          data: { label: "Content", agentType: "content" },
          position: { x: 520, y: 120 },
        },
        {
          id: "code1",
          type: "Agent",
          data: { label: "Code Agent", agentType: "code" },
          position: { x: 740, y: 120 },
        },
        {
          id: "d1",
          type: "Agent",
          data: { label: "Deploy", agentType: "deploy" },
          position: { x: 960, y: 120 },
        },
      ],
      edges: [
        { id: "e1", source: "t1", target: "r1" },
        { id: "e2", source: "r1", target: "c1" },
        { id: "e3", source: "c1", target: "code1" },
        { id: "e4", source: "code1", target: "d1" },
      ],
    },
  },
  {
    id: "tourism-content-pipeline",
    name: "Tourism Content Pipeline",
    description:
      "Research a destination → Generate travel guides, hotel copy, itineraries → Deploy. Ideal for tourism boards, hotels, travel bloggers.",
    category: "content",
    workflow: {
      name: "Tourism Content Pipeline",
      nodes: [
        {
          id: "t1",
          type: "Trigger",
          data: { label: "Start", triggerType: "manual" },
          position: { x: 100, y: 100 },
        },
        {
          id: "r1",
          type: "Agent",
          data: { label: "Research Agent", agentType: "research" },
          position: { x: 350, y: 100 },
        },
        {
          id: "c1",
          type: "Agent",
          data: { label: "Content Agent", agentType: "content" },
          position: { x: 600, y: 100 },
        },
        {
          id: "d1",
          type: "Agent",
          data: { label: "Deploy Agent", agentType: "deploy" },
          position: { x: 850, y: 100 },
        },
      ],
      edges: [
        { id: "e1", source: "t1", target: "r1" },
        { id: "e2", source: "r1", target: "c1" },
        { id: "e3", source: "c1", target: "d1" },
      ],
    },
  },
];

export function getWorkflowAppById(id: string): WorkflowApp | undefined {
  return WORKFLOW_APPS.find((a) => a.id === id);
}

export const CATEGORY_LABELS: Record<string, string> = {
  content: "Content",
  research: "Research",
  automation: "Automation",
  mixed: "Mixed",
};
