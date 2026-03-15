import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import {
  WORKFLOW_TEMPLATES,
  getTemplateById,
  type WorkflowTemplate,
} from "@/lib/workflow-templates";

/**
 * POST /api/workflows/from-template
 * 
 * Create a new workflow from a template
 * 
 * Body:
 * - templateId: string (required) - ID of the template to use
 * - propertyId: string (optional) - Property to associate with workflow
 * 
 * Returns:
 * - workflow: Created workflow object
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { templateId, propertyId } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    // Get template
    const template = getTemplateById(templateId);
    
    if (!template) {
      return NextResponse.json(
        { error: `Template '${templateId}' not found` },
        { status: 404 }
      );
    }

    // Convert template to workflow nodes and edges
    const { nodes, edges } = convertTemplateToWorkflow(template, propertyId);

    // Create workflow
    const workflow = await prisma.workflow.create({
      data: {
        userId,
        propertyId: propertyId || null,
        name: template.name,
        description: template.description,
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        status: "draft",
        metadata: {
          createdFromTemplate: templateId,
          category: template.category,
          difficulty: template.difficulty,
          estimatedTimeSaved: template.estimatedTimeSaved,
        },
      },
    });

    return NextResponse.json({
      workflow,
      template: {
        id: template.id,
        name: template.name,
        category: template.category,
      },
    });
  } catch (error) {
    logger.error("Error creating workflow from template:", error);
    return NextResponse.json(
      { error: "Failed to create workflow from template" },
      { status: 500 }
    );
  }
}

/**
 * Convert workflow template to workflow nodes and edges
 */
function convertTemplateToWorkflow(
  template: WorkflowTemplate,
  propertyId?: string
) {
  const nodes: any[] = [];
  const edges: any[] = [];

  // Create trigger node
  const triggerNode = {
    id: "trigger-1",
    type: "trigger",
    position: { x: 400, y: 50 },
    data: {
      label: getTriggerLabel(template.trigger),
      icon: getTriggerIcon(template.trigger),
      type: "trigger",
      config: {
        type: template.trigger.type,
        schedule: template.trigger.schedule,
        event: template.trigger.event,
        condition: template.trigger.condition,
      },
    },
  };
  nodes.push(triggerNode);

  let previousNodeId = "trigger-1";

  // Create action nodes
  template.actions.forEach((action, index) => {
    const nodeId = `action-${index + 1}`;
    const actionNode = {
      id: nodeId,
      type: "action",
      position: { x: 400, y: 200 + (index * 150) },
      data: {
        label: getActionLabel(action.type),
        icon: getActionIcon(action.type),
        type: "action",
        config: {
          actionType: action.type,
          ...action.config,
        },
      },
    };
    nodes.push(actionNode);

    // Connect to previous node
    edges.push({
      id: `edge-${previousNodeId}-${nodeId}`,
      source: previousNodeId,
      target: nodeId,
    });

    previousNodeId = nodeId;
  });

  // Create end node
  const endNode = {
    id: "end-1",
    type: "end",
    position: { x: 400, y: 200 + (template.actions.length * 150) },
    data: {
      label: "Complete",
      icon: "✅",
      type: "end",
      config: {
        output: "Workflow completed",
      },
    },
  };
  nodes.push(endNode);

  // Connect last action to end
  edges.push({
    id: `edge-${previousNodeId}-end-1`,
    source: previousNodeId,
    target: "end-1",
  });

  return { nodes, edges };
}

/**
 * Get trigger label from trigger config
 */
function getTriggerLabel(trigger: WorkflowTemplate["trigger"]): string {
  if (trigger.type === "scheduled") {
    return `Schedule: ${trigger.schedule}`;
  }
  if (trigger.type === "event") {
    return `Event: ${trigger.event}`;
  }
  if (trigger.type === "webhook") {
    return "Webhook";
  }
  return "Trigger";
}

/**
 * Get trigger icon from trigger type
 */
function getTriggerIcon(trigger: WorkflowTemplate["trigger"]): string {
  switch (trigger.type) {
    case "scheduled":
      return "⏰";
    case "event":
      return "📢";
    case "webhook":
      return "🔗";
    default:
      return "🎯";
  }
}

/**
 * Get action label from action type
 */
function getActionLabel(actionType: string): string {
  const labels: Record<string, string> = {
    send_email: "Send Email",
    send_sms: "Send SMS",
    send_whatsapp: "Send WhatsApp",
    send_notification: "Send Notification",
    create_task: "Create Task",
    update_reservation: "Update Reservation",
    update_room_status: "Update Room Status",
    sync_eturizem: "Sync eTurizem",
    analyze_demand: "Analyze Demand",
    check_competitor_prices: "Check Competitor Prices",
    adjust_prices: "Adjust Prices",
    sync_channels: "Sync Channels",
    log_activity: "Log Activity",
    update_guest_profile: "Update Guest Profile",
    create_workflow: "Create Workflow",
  };
  return labels[actionType] || actionType;
}

/**
 * Get action icon from action type
 */
function getActionIcon(actionType: string): string {
  const icons: Record<string, string> = {
    send_email: "📧",
    send_sms: "📱",
    send_whatsapp: "💬",
    send_notification: "🔔",
    create_task: "✅",
    update_reservation: "📅",
    update_room_status: "🧹",
    sync_eturizem: "🔄",
    analyze_demand: "📊",
    check_competitor_prices: "🔍",
    adjust_prices: "💰",
    sync_channels: "🌐",
    log_activity: "📝",
    update_guest_profile: "👤",
    create_workflow: "🔄",
  };
  return icons[actionType] || "⚙️";
}

/**
 * GET /api/workflows/from-template
 * 
 * List all available workflow templates
 */
export async function GET() {
  try {
    const templates = Object.values(WORKFLOW_TEMPLATES).map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      difficulty: template.difficulty,
      estimatedTimeSaved: template.estimatedTimeSaved,
      trigger: template.trigger,
      actions: template.actions.map((action) => ({
        type: action.type,
        config: action.config,
      })),
    }));

    return NextResponse.json({ templates });
  } catch (error) {
    logger.error("Error fetching workflow templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow templates" },
      { status: 500 }
    );
  }
}
