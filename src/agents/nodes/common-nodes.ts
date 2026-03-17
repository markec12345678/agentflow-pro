/**
 * Reusable LangGraph Nodes
 * 
 * Common node implementations for agent graphs
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

// ============================================================================
// TYPES
// ============================================================================

export interface NodeContext {
  messages: Array<{ role: string; content: string }>;
  [key: string]: any;
}

export interface NodeResult {
  [key: string]: any;
}

// ============================================================================
// LLM NODES
// ============================================================================

/**
 * LLM Call Node
 * Generic node for calling LLM with custom prompts
 */
export async function llmCallNode(
  context: NodeContext,
  options: {
    systemPrompt: string;
    userPromptFn: (context: NodeContext) => string;
    model?: string;
    temperature?: number;
    outputKey?: string;
  }
): Promise<NodeResult> {
  const llm = new ChatOpenAI({
    model: options.model || 'gpt-4o-mini',
    temperature: options.temperature ?? 0.3,
  });

  const userPrompt = options.userPromptFn(context);

  const response = await llm.invoke([
    new SystemMessage(options.systemPrompt),
    new HumanMessage(userPrompt)
  ]);

  const outputKey = options.outputKey || 'llmOutput';
  
  return {
    [outputKey]: response.content,
    messages: [...context.messages, { role: 'assistant', content: response.content }]
  };
}

/**
 * Tool Call Node
 * Execute a tool/function based on LLM decision
 */
export async function toolCallNode(
  context: NodeContext,
  options: {
    toolName: string;
    toolFn: (input: any) => Promise<any>;
    inputExtractor: (context: NodeContext) => any;
    outputKey?: string;
  }
): Promise<NodeResult> {
  const input = options.inputExtractor(context);
  const result = await options.toolFn(input);
  
  const outputKey = options.outputKey || 'toolResult';
  
  return {
    [outputKey]: result,
    messages: [...context.messages, { 
      role: 'tool', 
      content: `Tool ${options.toolName} executed successfully` 
    }]
  };
}

/**
 * Conditional Router Node
 * Route to different paths based on condition
 */
export function conditionalRouterNode(
  context: NodeContext,
  options: {
    conditionFn: (context: NodeContext) => boolean;
    truePath: string;
    falsePath: string;
  }
): string {
  return options.conditionFn(context) ? options.truePath : options.falsePath;
}

// ============================================================================
// VALIDATION NODES
// ============================================================================

/**
 * Quality Check Node
 * Validate output meets quality standards
 */
export async function qualityCheckNode(
  context: NodeContext,
  options: {
    qualityThreshold: number;
    qualityMetric: (context: NodeContext) => number;
    passPath: string;
    failPath: string;
    maxRetries?: number;
  }
): Promise<{ next: string; qualityScore: number }> {
  const score = options.qualityMetric(context);
  const passed = score >= options.qualityThreshold;
  
  const retryCount = context.retryCount || 0;
  const maxRetries = options.maxRetries || 2;
  
  if (passed) {
    return { next: options.passPath, qualityScore: score };
  } else if (retryCount < maxRetries) {
    return { next: options.failPath, qualityScore: score, retryCount: retryCount + 1 };
  } else {
    // Max retries reached, continue anyway
    return { next: options.passPath, qualityScore: score };
  }
}

/**
 * Schema Validation Node
 * Validate output against schema
 */
export async function schemaValidationNode(
  context: NodeContext,
  options: {
    schema: any;
    validateFn: (data: any, schema: any) => { valid: boolean; errors: string[] };
    dataExtractor: (context: NodeContext) => any;
  }
): Promise<{ valid: boolean; errors: string[] }> {
  const data = options.dataExtractor(context);
  const result = options.validateFn(data, options.schema);
  
  return {
    valid: result.valid,
    errors: result.errors,
    messages: [...context.messages, {
      role: 'system',
      content: result.valid ? 'Validation passed' : `Validation failed: ${result.errors.join(', ')}`
    }]
  };
}

// ============================================================================
// TRANSFORMATION NODES
// ============================================================================

/**
 * Data Transformation Node
 * Transform data from one format to another
 */
export async function transformNode(
  context: NodeContext,
  options: {
    transformFn: (data: any) => any;
    inputKey: string;
    outputKey: string;
  }
): Promise<NodeResult> {
  const inputData = context[options.inputKey];
  const transformedData = options.transformFn(inputData);
  
  return {
    [options.outputKey]: transformedData
  };
}

/**
 * Aggregation Node
 * Combine multiple results into one
 */
export async function aggregateNode(
  context: NodeContext,
  options: {
    inputKeys: string[];
    aggregateFn: (results: any[]) => any;
    outputKey: string;
  }
): Promise<NodeResult> {
  const results = options.inputKeys.map(key => context[key]);
  const aggregated = options.aggregateFn(results);
  
  return {
    [options.outputKey]: aggregated
  };
}

// ============================================================================
// ERROR HANDLING NODES
// ============================================================================

/**
 * Error Handler Node
 * Handle errors gracefully
 */
export async function errorHandlerNode(
  context: NodeContext,
  options: {
    errorKey: string;
    recoveryFn: (error: any, context: NodeContext) => Promise<NodeResult>;
    fallbackPath?: string;
  }
): Promise<NodeResult> {
  const error = context[options.errorKey];
  
  if (!error) {
    return {};
  }
  
  try {
    return await options.recoveryFn(error, context);
  } catch (recoveryError) {
    // Recovery failed, use fallback
    if (options.fallbackPath) {
      return { next: options.fallbackPath };
    }
    throw recoveryError;
  }
}

/**
 * Retry Node
 * Retry previous step with modified context
 */
export function retryNode(
  context: NodeContext,
  options: {
    retryCountKey?: string;
    maxRetries?: number;
    retryPath: string;
    failPath: string;
  }
): { next: string; retryCount: number } {
  const retryCount = (context[options.retryCountKey || 'retryCount'] || 0) + 1;
  const maxRetries = options.maxRetries || 3;
  
  if (retryCount <= maxRetries) {
    return { next: options.retryPath, retryCount };
  } else {
    return { next: options.failPath, retryCount };
  }
}

// ============================================================================
// UTILITY NODES
// ============================================================================

/**
 * Logger Node
 * Log context for debugging
 */
export async function loggerNode(
  context: NodeContext,
  options: {
    message?: string;
    logKeys?: string[];
    level?: 'info' | 'warn' | 'error';
  }
): Promise<NodeResult> {
  const message = options.message || 'Node executed';
  const level = options.level || 'info';
  
  const logData: any = { message, timestamp: new Date().toISOString() };
  
  if (options.logKeys) {
    options.logKeys.forEach(key => {
      logData[key] = context[key];
    });
  }
  
  console[level](`[LangGraph] ${JSON.stringify(logData, null, 2)}`);
  
  return {};
}

/**
 * Set Metadata Node
 * Add metadata to context
 */
export async function setMetadataNode(
  context: NodeContext,
  options: {
    metadata: Record<string, any>;
  }
): Promise<NodeResult> {
  return {
    metadata: {
      ...context.metadata,
      ...options.metadata,
      updatedAt: new Date().toISOString()
    }
  };
}

/**
 * Parallel Execution Node
 * Execute multiple nodes in parallel
 */
export async function parallelNode(
  context: NodeContext,
  options: {
    tasks: Array<{
      key: string;
      fn: (context: NodeContext) => Promise<any>;
    }>;
  }
): Promise<NodeResult> {
  const results = await Promise.all(
    options.tasks.map(async task => {
      try {
        const result = await task.fn(context);
        return { key: task.key, result, error: null };
      } catch (error) {
        return { key: task.key, result: null, error };
      }
    })
  );
  
  const output: NodeResult = {};
  const errors: string[] = [];
  
  results.forEach(({ key, result, error }) => {
    if (error) {
      errors.push(`Task ${key} failed: ${error}`);
    } else {
      output[key] = result;
    }
  });
  
  if (errors.length > 0) {
    output.parallelErrors = errors;
  }
  
  return output;
}
