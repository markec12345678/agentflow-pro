# 🎨 VISUAL WORKFLOW BUILDER - Implementation Plan

**Priority:** 🔴 **HIGH** - Critical for UX  
**Timeline:** 1-2 weeks  
**Status:** Ready to implement

---

## 📋 REQUIREMENTS

### **Core Features (MVP):**
1. ✅ Drag-drop canvas for workflow building
2. ✅ Pre-built node palette (agents, triggers, actions)
3. ✅ Node configuration panels
4. ✅ Connection lines between nodes
5. ✅ Workflow validation
6. ✅ Save/load workflows
7. ✅ Test execution from builder

### **Nice-to-Have (Phase 2):**
- Template import/export
- Version history
- Collaboration (multi-user editing)
- Comments/annotations
- Workflow analytics

---

## 🏗️ ARCHITECTURE

### **Tech Stack:**
- **React Flow** or **React DnD** - Drag-drop library
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React** - UI framework

### **File Structure:**
```
src/app/dashboard/workflows/builder/
├── page.tsx                  # Main builder page
├── WorkflowCanvas.tsx        # Drag-drop canvas
├── NodePalette.tsx           # Left sidebar - available nodes
├── NodeRenderer.tsx          # Render different node types
├── NodeConfigPanel.tsx       # Right sidebar - node settings
├── ConnectionLine.tsx        # Custom connection lines
├── Toolbar.tsx               # Top toolbar (save, test, etc.)
└── hooks/
    ├── useWorkflow.ts        # Workflow state management
    ├── useNodes.ts           # Node operations
    └── useValidation.ts      # Workflow validation

src/web/components/workflow/
├── WorkflowNode.tsx          # Base node component
├── TriggerNode.tsx           # Trigger node (start)
├── AgentNode.tsx             # Agent execution node
├── ActionNode.tsx            # Action node (API, email, etc.)
├── ConditionNode.tsx         # If/else condition node
└── EndNode.tsx               # End node

src/lib/workflow/
├── types.ts                  # TypeScript types
├── validator.ts              # Workflow validation logic
├── executor.ts               # Workflow execution engine
└── templates.ts              # Pre-built templates
```

---

## 💻 IMPLEMENTATION

### **Step 1: Install Dependencies**
```bash
npm install reactflow zustand
npm install -D @types/reactflow
```

### **Step 2: Create Types**
```typescript
// src/lib/workflow/types.ts

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'agent' | 'action' | 'condition' | 'end';
  position: { x: number; y: number };
  data: {
    label: string;
    icon: string;
    config: Record<string, any>;
  };
}

export interface WorkflowConnection {
  id: string;
  source: string; // node ID
  target: string; // node ID
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  createdAt: string;
  updatedAt: string;
}
```

### **Step 3: Create Builder Page**
```typescript
// src/app/dashboard/workflows/builder/page.tsx

'use client';

import { useState } from 'react';
import WorkflowCanvas from './WorkflowCanvas';
import NodePalette from './NodePalette';
import NodeConfigPanel from './NodeConfigPanel';
import Toolbar from './Toolbar';

export default function WorkflowBuilderPage() {
  const [workflow, setWorkflow] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <Toolbar 
        workflow={workflow}
        onSave={() => {/* Save workflow */}}
        onTest={() => {/* Test workflow */}}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Node Palette */}
        <NodePalette 
          onDragStart={(nodeType) => {/* Handle drag */}}
        />
        
        {/* Canvas */}
        <WorkflowCanvas
          workflow={workflow}
          onChange={setWorkflow}
          selectedNode={selectedNode}
          onNodeSelect={setSelectedNode}
        />
        
        {/* Configuration Panel */}
        <NodeConfigPanel
          node={selectedNode}
          onChange={(config) => {/* Update node config */}}
          onClose={() => setSelectedNode(null)}
        />
      </div>
    </div>
  );
}
```

### **Step 4: Create Node Components**
```typescript
// src/web/components/workflow/AgentNode.tsx

interface AgentNodeProps {
  id: string;
  data: {
    label: string;
    icon: string;
    config: {
      agentId: string;
      input: any;
      timeout?: number;
    };
  };
  selected: boolean;
  onSelect: () => void;
}

export function AgentNode({ data, selected, onSelect }: AgentNodeProps) {
  return (
    <div
      className={`px-4 py-3 bg-white border-2 rounded-lg shadow-lg cursor-pointer
        ${selected ? 'border-blue-500' : 'border-gray-200'}
        hover:border-blue-400 transition-colors`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">{data.icon}</div>
        <div>
          <div className="font-semibold">{data.label}</div>
          <div className="text-xs text-gray-500">
            Agent: {data.config.agentId}
          </div>
        </div>
      </div>
      
      {/* Handle inputs/outputs */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-400 rounded-full" />
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full" />
    </div>
  );
}
```

---

## 🎨 UI/UX DESIGN

### **Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  [Save] [Test] [Templates] [Settings]      [Workflow ▼] │
├──────────┬────────────────────────────────┬─────────────┤
│          │                                │             │
│  NODE    │                                │   NODE      │
│  PALETTE │         CANVAS                 │   CONFIG    │
│          │                                │   PANEL     │
│  - Triggers          [Node1]──[Node2]    │             │
│  - Agents            [Node3]──[Node4]    │  Selected   │
│  - Actions           [Node5]──[Node6]    │  Node:      │
│  - Conditions        [Node7]──[Node8]    │  - Name     │
│          │                                │  - Agent    │
│          │                                │  - Input    │
│          │                                │  - Timeout  │
│          │                                │             │
└──────────┴────────────────────────────────┴─────────────┘
```

### **Node Types:**
- **Trigger** (green) - Start workflow (webhook, schedule, event)
- **Agent** (blue) - Execute AI agent
- **Action** (purple) - API call, email, database
- **Condition** (yellow) - If/else branching
- **End** (gray) - Workflow completion

---

## 🧪 TESTING

### **Test Cases:**
1. ✅ Drag node from palette to canvas
2. ✅ Connect two nodes
3. ✅ Configure node settings
4. ✅ Delete node/connection
5. ✅ Validate workflow (all nodes connected)
6. ✅ Save workflow to database
7. ✅ Load workflow from database
8. ✅ Test workflow execution

---

## 📦 DELIVERABLES

### **Week 1:**
- ✅ Basic drag-drop canvas
- ✅ 5 node types (trigger, agent, action, condition, end)
- ✅ Node configuration panels
- ✅ Save/load workflows

### **Week 2:**
- ✅ 20+ pre-built templates
- ✅ Workflow validation
- ✅ Test execution
- ✅ In-app guidance (tooltips)

---

## 🚀 NEXT STEPS

**After completing visual builder:**
1. Add template library
2. Add in-app guidance
3. Add AI dynamic pricing
4. Add channel manager

---

**Ready to implement?** Let me know and I'll start coding! 💻
