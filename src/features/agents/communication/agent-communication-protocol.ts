/**
 * AgentFlow Pro - Inter-Agent Communication Protocol
 * Enhanced messaging, shared state, and collaborative workflows
 */

export interface AgentMessage {
  messageId: string;
  fromAgentId: string;
  toAgentId?: string;
  broadcast?: boolean;
  type: MessageType;
  subject: string;
  content: any;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: string;
  correlationId?: string; // For request-response tracking
  inReplyTo?: string;
  metadata?: {
    workflowId?: string;
    taskId?: string;
    requiresResponse?: boolean;
    timeoutMs?: number;
  };
}

export interface SharedState {
  stateId: string;
  key: string;
  value: any;
  version: number;
  updatedAt: string;
  updatedBy: string;
  ttl?: number; // Time to live in ms
  metadata?: {
    workflowId?: string;
    scope: 'global' | 'workflow' | 'agent';
  };
}

export interface MessageSubscription {
  subscriptionId: string;
  agentId: string;
  topic: string;
  filter?: (message: AgentMessage) => boolean;
  callback: (message: AgentMessage) => Promise<void>;
  createdAt: string;
}

export type MessageType =
  | 'request'
  | 'response'
  | 'notification'
  | 'event'
  | 'command'
  | 'query'
  | 'stream_chunk';

export interface CommunicationStats {
  totalMessages: number;
  messagesByType: Record<MessageType, number>;
  avgResponseTimeMs: number;
  pendingRequests: number;
  failedMessages: number;
}

export class AgentCommunicationProtocol {
  private messageQueue: AgentMessage[] = [];
  private subscriptions: Map<string, MessageSubscription[]> = new Map();
  private sharedState: Map<string, SharedState> = new Map();
  private pendingRequests: Map<string, {
    message: AgentMessage;
    resolve: (response: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private messageHistory: AgentMessage[] = [];
  private stats: CommunicationStats = {
    totalMessages: 0,
    messagesByType: {} as Record<MessageType, number>,
    avgResponseTimeMs: 0,
    pendingRequests: 0,
    failedMessages: 0,
  };

  /**
   * Send message to agent
   */
  async sendMessage(message: Omit<AgentMessage, 'messageId' | 'timestamp'>): Promise<string> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const fullMessage: AgentMessage = {
      ...message,
      messageId,
      timestamp: new Date().toISOString(),
    };

    // Add to queue
    this.messageQueue.push(fullMessage);
    this.messageHistory.push(fullMessage);

    // Update stats
    this.stats.totalMessages++;
    this.stats.messagesByType[message.type] = (this.stats.messagesByType[message.type] || 0) + 1;

    // Process message
    await this.processMessage(fullMessage);

    return messageId;
  }

  /**
   * Send request and wait for response
   */
  async sendRequest(
    fromAgentId: string,
    toAgentId: string,
    subject: string,
    content: any,
    timeoutMs: number = 30000
  ): Promise<any> {
    const correlationId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const message: Omit<AgentMessage, 'messageId' | 'timestamp'> = {
      fromAgentId,
      toAgentId,
      type: 'request',
      subject,
      content,
      priority: 'normal',
      correlationId,
      metadata: {
        requiresResponse: true,
        timeoutMs,
      },
    };

    const messageId = await this.sendMessage(message);

    // Create promise for response
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(correlationId);
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(correlationId, {
        message: { ...message, messageId, timestamp: new Date().toISOString() },
        resolve,
        reject,
        timeout,
      });

      this.stats.pendingRequests++;
    });
  }

  /**
   * Send response to request
   */
  async sendResponse(
    fromAgentId: string,
    toAgentId: string,
    inReplyTo: string,
    correlationId: string,
    content: any
  ): Promise<void> {
    const responseMessage: Omit<AgentMessage, 'messageId' | 'timestamp'> = {
      fromAgentId,
      toAgentId,
      type: 'response',
      subject: 'Re: ' + inReplyTo,
      content,
      priority: 'normal',
      correlationId,
      inReplyTo,
    };

    await this.sendMessage(responseMessage);

    // Resolve pending request
    const pending = this.pendingRequests.get(correlationId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(correlationId);
      pending.resolve(content);
      this.stats.pendingRequests--;
    }
  }

  /**
   * Broadcast message to all subscribers
   */
  async broadcast(
    fromAgentId: string,
    topic: string,
    content: any,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<void> {
    const message: Omit<AgentMessage, 'messageId' | 'timestamp'> = {
      fromAgentId,
      broadcast: true,
      type: 'notification',
      subject: topic,
      content,
      priority,
    };

    await this.sendMessage(message);
  }

  /**
   * Subscribe to messages
   */
  subscribe(
    agentId: string,
    topic: string,
    callback: (message: AgentMessage) => Promise<void>,
    filter?: (message: AgentMessage) => boolean
  ): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const subscription: MessageSubscription = {
      subscriptionId,
      agentId,
      topic,
      filter,
      callback,
      createdAt: new Date().toISOString(),
    };

    const topicSubscriptions = this.subscriptions.get(topic) || [];
    topicSubscriptions.push(subscription);
    this.subscriptions.set(topic, topicSubscriptions);

    return subscriptionId;
  }

  /**
   * Unsubscribe from messages
   */
  unsubscribe(subscriptionId: string): void {
    for (const [topic, subs] of this.subscriptions.entries()) {
      const index = subs.findIndex(s => s.subscriptionId === subscriptionId);
      if (index !== -1) {
        subs.splice(index, 1);
        if (subs.length === 0) {
          this.subscriptions.delete(topic);
        }
        break;
      }
    }
  }

  /**
   * Get shared state
   */
  getState(key: string, agentId?: string): any {
    const state = this.sharedState.get(key);
    if (!state) return null;

    // Check TTL
    if (state.ttl && Date.now() > new Date(state.updatedAt).getTime() + state.ttl) {
      this.sharedState.delete(key);
      return null;
    }

    return state.value;
  }

  /**
   * Set shared state
   */
  setState(
    key: string,
    value: any,
    updatedBy: string,
    options?: { ttl?: number; scope?: 'global' | 'workflow' | 'agent'; workflowId?: string }
  ): SharedState {
    const existing = this.sharedState.get(key);
    
    const state: SharedState = {
      stateId: `state_${key}_${Date.now()}`,
      key,
      value,
      version: (existing?.version || 0) + 1,
      updatedAt: new Date().toISOString(),
      updatedBy,
      ttl: options?.ttl,
      metadata: {
        workflowId: options?.workflowId,
        scope: options?.scope || 'global',
      },
    };

    this.sharedState.set(key, state);
    return state;
  }

  /**
   * Delete shared state
   */
  deleteState(key: string): boolean {
    return this.sharedState.delete(key);
  }

  /**
   * Get communication stats
   */
  getStats(): CommunicationStats {
    return { ...this.stats };
  }

  /**
   * Get message history
   */
  getMessageHistory(agentId?: string, limit: number = 100): AgentMessage[] {
    let history = this.messageHistory;
    
    if (agentId) {
      history = history.filter(m => m.fromAgentId === agentId || m.toAgentId === agentId);
    }

    return history.slice(-limit);
  }

  /**
   * Clear message history
   */
  clearHistory(olderThanMs: number = 60 * 60 * 1000): number {
    const cutoff = Date.now() - olderThanMs;
    const initialLength = this.messageHistory.length;
    
    this.messageHistory = this.messageHistory.filter(
      m => new Date(m.timestamp).getTime() > cutoff
    );

    return initialLength - this.messageHistory.length;
  }

  /**
   * Process message and notify subscribers
   */
  private async processMessage(message: AgentMessage): Promise<void> {
    // Find subscribers
    const topic = message.subject;
    const subscribers = this.subscriptions.get(topic) || [];

    // Process in parallel
    const promises = subscribers.map(async sub => {
      // Apply filter if present
      if (sub.filter && !sub.filter(message)) {
        return;
      }

      try {
        await sub.callback(message);
      } catch (error) {
        logger.error(`[AgentComm] Subscriber ${sub.agentId} failed:`, error);
        this.stats.failedMessages++;
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Create workflow communication channel
   */
  createWorkflowChannel(workflowId: string, agentIds: string[]): {
    broadcast: (fromAgentId: string, content: any) => Promise<void>;
    request: (fromAgentId: string, toAgentId: string, content: any) => Promise<any>;
    setState: (key: string, value: any) => void;
    getState: (key: string) => any;
  } {
    return {
      broadcast: async (fromAgentId: string, content: any) => {
        await this.broadcast(fromAgentId, `workflow:${workflowId}`, content);
      },
      request: async (fromAgentId: string, toAgentId: string, content: any) => {
        return this.sendRequest(fromAgentId, toAgentId, `workflow:${workflowId}`, content);
      },
      setState: (key: string, value: any) => {
        this.setState(`workflow:${workflowId}:${key}`, 'system', { scope: 'workflow', workflowId });
      },
      getState: (key: string) => {
        return this.getState(`workflow:${workflowId}:${key}`);
      },
    };
  }

  /**
   * Implement publish-subscribe pattern
   */
  createPubSub() {
    return {
      publish: async (topic: string, content: any, fromAgentId: string) => {
        await this.broadcast(fromAgentId, topic, content);
      },
      subscribe: (topic: string, agentId: string, callback: (content: any) => Promise<void>) => {
        return this.subscribe(agentId, topic, async (message) => {
          await callback(message.content);
        });
      },
    };
  }

  /**
   * Implement request-response pattern
   */
  createRequestResponse(agentId: string) {
    return {
      request: async (toAgentId: string, subject: string, content: any, timeoutMs?: number) => {
        return this.sendRequest(agentId, toAgentId, subject, content, timeoutMs);
      },
      respond: async (inReplyTo: string, correlationId: string, content: any) => {
        await this.sendResponse(agentId, 'unknown', inReplyTo, correlationId, content);
      },
    };
  }
}

/**
 * Message builder for fluent API
 */
export class MessageBuilder {
  private message: Partial<AgentMessage> = {};

  from(fromAgentId: string): MessageBuilder {
    this.message.fromAgentId = fromAgentId;
    return this;
  }

  to(toAgentId: string): MessageBuilder {
    this.message.toAgentId = toAgentId;
    return this;
  }

  type(type: MessageType): MessageBuilder {
    this.message.type = type;
    return this;
  }

  subject(subject: string): MessageBuilder {
    this.message.subject = subject;
    return this;
  }

  content(content: any): MessageBuilder {
    this.message.content = content;
    return this;
  }

  priority(priority: 'low' | 'normal' | 'high' | 'urgent'): MessageBuilder {
    this.message.priority = priority;
    return this;
  }

  requiresResponse(timeoutMs?: number): MessageBuilder {
    this.message.metadata = { ...this.message.metadata, requiresResponse: true, timeoutMs };
    return this;
  }

  build(): Omit<AgentMessage, 'messageId' | 'timestamp'> {
    return this.message as Omit<AgentMessage, 'messageId' | 'timestamp'>;
  }
}

export const agentCommunicationProtocol = new AgentCommunicationProtocol();
