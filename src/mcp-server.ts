/**
 * AgentFlow Pro MCP Server
 * 
 * Omogoča direktno komunikacijo z AgentFlow Pro sistemi:
 * - Memory graph queries
 * - Agent execution
 * - Workflow management
 * - Database operations
 * - Redis cache operations
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Environment variables
const DATABASE_URL = process.env.DATABASE_URL;
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

// Create MCP server
const server = new McpServer({
  name: "agentflow-pro",
  version: "1.0.0",
});

// ============================================================================
// MEMORY GRAPH TOOLS
// ============================================================================

server.tool(
  "search_memory",
  "Search AgentFlow Pro memory graph for entities, relations, and observations",
  {
    query: z.string().describe("Search query"),
    limit: z.number().default(10).describe("Maximum results"),
  },
  async ({ query, limit }) => {
    try {
      // TODO: Implement actual memory search using src/memory/
      return {
        content: [
          {
            type: "text",
            text: `Memory search for "${query}" (limit: ${limit})\n\nNote: Full implementation requires memory backend integration.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error searching memory: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_entity",
  "Get a specific entity from the memory graph by ID or name",
  {
    entityId: z.string().describe("Entity ID or name"),
  },
  async ({ entityId }) => {
    try {
      return {
        content: [
          {
            type: "text",
            text: `Getting entity: ${entityId}\n\nNote: Full implementation requires memory backend integration.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting entity: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ============================================================================
// AGENT TOOLS
// ============================================================================

server.tool(
  "list_agents",
  "List all available agents in AgentFlow Pro",
  {},
  async () => {
    const agents = [
      { name: "research", description: "Web research and data collection" },
      { name: "content", description: "Content generation and optimization" },
      { name: "code", description: "Code generation and refactoring" },
      { name: "deploy", description: "Deployment and DevOps" },
      { name: "communication", description: "Email and messaging" },
      { name: "reservation", description: "Booking and reservation management" },
      { name: "concierge", description: "Guest communication and support" },
      { name: "security", description: "Security monitoring and verification" },
    ];

    return {
      content: [
        {
          type: "text",
          text: `Available Agents:\n\n${agents.map(a => `- **${a.name}**: ${a.description}`).join("\n")}`,
        },
      ],
    };
  }
);

server.tool(
  "execute_agent",
  "Execute an AgentFlow Pro agent with specific input",
  {
    agentName: z.string().describe("Agent name (research, content, code, deploy, etc.)"),
    input: z.string().describe("Input prompt or task for the agent"),
    workflowId: z.string().optional().describe("Optional workflow ID to associate with"),
  },
  async ({ agentName, input, workflowId }) => {
    try {
      // TODO: Implement actual agent execution using src/agents/
      return {
        content: [
          {
            type: "text",
            text: `Executing agent "${agentName}" with input:\n"${input}"\n${workflowId ? `Workflow ID: ${workflowId}` : ""}\n\nNote: Full implementation requires agent orchestrator integration.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error executing agent: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ============================================================================
// WORKFLOW TOOLS
// ============================================================================

server.tool(
  "list_workflows",
  "List all workflows in AgentFlow Pro",
  {},
  async () => {
    try {
      // TODO: Query database for workflows
      return {
        content: [
          {
            type: "text",
            text: "Workflows:\n\nNote: Full implementation requires database integration.",
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error listing workflows: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_workflow",
  "Get a specific workflow by ID",
  {
    workflowId: z.string().describe("Workflow ID"),
  },
  async ({ workflowId }) => {
    try {
      return {
        content: [
          {
            type: "text",
            text: `Getting workflow: ${workflowId}\n\nNote: Full implementation requires database integration.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting workflow: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "execute_workflow",
  "Execute a workflow by ID",
  {
    workflowId: z.string().describe("Workflow ID to execute"),
    input: z.record(z.string()).optional().describe("Optional input variables for the workflow"),
  },
  async ({ workflowId, input }) => {
    try {
      return {
        content: [
          {
            type: "text",
            text: `Executing workflow: ${workflowId}\nInput: ${JSON.stringify(input, null, 2)}\n\nNote: Full implementation requires workflow executor integration.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error executing workflow: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ============================================================================
// DATABASE TOOLS
// ============================================================================

server.tool(
  "query_database",
  "Execute a SQL query on the AgentFlow Pro database",
  {
    sql: z.string().describe("SQL query to execute"),
    params: z.array(z.string()).optional().describe("Query parameters"),
  },
  async ({ sql, params }) => {
    try {
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: DATABASE_URL });
      
      const result = await pool.query(sql, params);
      
      await pool.end();
      
      return {
        content: [
          {
            type: "text",
            text: `Query executed successfully.\nRows affected: ${result.rowCount}\n\nResults:\n${JSON.stringify(result.rows, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Database error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_table_schema",
  "Get the schema of a database table",
  {
    tableName: z.string().describe("Table name"),
  },
  async ({ tableName }) => {
    try {
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: DATABASE_URL });
      
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      await pool.end();
      
      return {
        content: [
          {
            type: "text",
            text: `Schema for table "${tableName}":\n\n${JSON.stringify(result.rows, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting schema: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ============================================================================
// REDIS TOOLS
// ============================================================================

server.tool(
  "redis_get",
  "Get a value from Redis cache",
  {
    key: z.string().describe("Redis key"),
  },
  async ({ key }) => {
    try {
      if (!REDIS_URL) {
        return {
          content: [{ type: "text", text: "REDIS_URL not configured" }],
          isError: true,
        };
      }

      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({
        url: REDIS_URL,
      });
      
      const value = await redis.get(key);
      
      return {
        content: [
          {
            type: "text",
            text: `Redis GET "${key}":\n${JSON.stringify(value, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Redis error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "redis_set",
  "Set a value in Redis cache",
  {
    key: z.string().describe("Redis key"),
    value: z.string().describe("Value to store"),
    ttl: z.number().optional().describe("Time to live in seconds"),
  },
  async ({ key, value, ttl }) => {
    try {
      if (!REDIS_URL) {
        return {
          content: [{ type: "text", text: "REDIS_URL not configured" }],
          isError: true,
        };
      }

      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({
        url: REDIS_URL,
      });
      
      await redis.set(key, value, ttl ? { ex: ttl } : undefined);
      
      return {
        content: [
          {
            type: "text",
            text: `Redis SET "${key}" = "${value}"${ttl ? ` (TTL: ${ttl}s)` : ""}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Redis error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "redis_keys",
  "List Redis keys matching a pattern",
  {
    pattern: z.string().default("*").describe("Key pattern (default: *)"),
  },
  async ({ pattern }) => {
    try {
      if (!REDIS_URL) {
        return {
          content: [{ type: "text", text: "REDIS_URL not configured" }],
          isError: true,
        };
      }

      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({
        url: REDIS_URL,
      });
      
      const keys = await redis.keys(pattern);
      
      return {
        content: [
          {
            type: "text",
            text: `Redis keys matching "${pattern}":\n${keys.join("\n")}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Redis error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ============================================================================
// SYSTEM TOOLS
// ============================================================================

server.tool(
  "get_system_status",
  "Get AgentFlow Pro system status",
  {},
  async () => {
    const status = {
      database: DATABASE_URL ? "configured" : "not configured",
      redis: REDIS_URL ? "configured" : "not configured",
      timestamp: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: "text",
          text: `AgentFlow Pro Status:\n\n${JSON.stringify(status, null, 2)}`,
        },
      ],
    };
  }
);

// ============================================================================
// START SERVER
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AgentFlow Pro MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
