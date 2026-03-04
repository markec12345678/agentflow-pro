/**
 * Integration & Automation Types and Interfaces
 */

export interface IntegrationConfig {
  id: string;
  name: string;
  type: IntegrationType;
  provider: string;
  version: string;
  status: IntegrationStatus;
  credentials: IntegrationCredentials;
  settings: IntegrationSettings;
  endpoints: IntegrationEndpoint[];
  webhooks: WebhookConfig[];
  mappings: FieldMapping[];
  syncSettings: SyncSettings;
  monitoring: MonitoringConfig;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
  lastError?: IntegrationError;
}

export type IntegrationType = 
  | 'booking-engine'
  | 'payment-gateway'
  | 'channel-manager'
  | 'pms'
  | 'crm'
  | 'email-marketing'
  | 'sms-gateway'
  | 'analytics'
  | 'social-media'
  | 'review-platform'
  | 'iot'
  | 'security'
  | 'backup'
  | 'monitoring'
  | 'custom';

export type IntegrationStatus = 
  | 'active'
  | 'inactive'
  | 'error'
  | 'pending'
  | 'disabled'
  | 'maintenance';

export interface IntegrationCredentials {
  type: 'api-key' | 'oauth' | 'basic' | 'certificate' | 'custom';
  encrypted: boolean;
  data: Record<string, unknown>;
  expiresAt?: Date;
  rotationRequired: boolean;
  lastRotated?: Date;
}

export interface IntegrationSettings {
  timeout: number; // in seconds
  retryAttempts: number;
  retryDelay: number; // in seconds
  rateLimit: RateLimit;
  caching: CacheConfig;
  logging: LoggingConfig;
  security: SecurityConfig;
  performance: PerformanceConfig;
}

export interface RateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
  strategy: 'fixed' | 'sliding' | 'token-bucket';
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // in seconds
  maxSize: number; // in MB
  strategy: 'lru' | 'fifo' | 'lfu';
  invalidation: CacheInvalidation[];
}

export interface CacheInvalidation {
  trigger: 'time' | 'event' | 'manual';
  condition: string;
  action: 'clear' | 'refresh' | 'partial';
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text' | 'structured';
  destinations: LogDestination[];
  sampling: number; // 0-1
}

export interface LogDestination {
  type: 'console' | 'file' | 'database' | 'external';
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface SecurityConfig {
  encryption: EncryptionConfig;
  authentication: AuthenticationConfig;
  authorization: AuthorizationConfig;
  validation: ValidationConfig;
}

export interface EncryptionConfig {
  algorithm: string;
  keySize: number;
  ivSize: number;
  mode: string;
}

export interface AuthenticationConfig {
  required: boolean;
  methods: ('api-key' | 'oauth' | 'jwt' | 'basic')[];
  tokenExpiry: number; // in seconds
  refreshEnabled: boolean;
}

export interface AuthorizationConfig {
  required: boolean;
  roles: string[];
  permissions: string[];
  policies: AuthorizationPolicy[];
}

export interface AuthorizationPolicy {
  name: string;
  effect: 'allow' | 'deny';
  actions: string[];
  resources: string[];
  conditions: PolicyCondition[];
}

export interface PolicyCondition {
  field: string;
  operator: 'equals' | 'contains' | 'starts-with' | 'ends-with' | 'regex';
  value: string;
}

export interface ValidationConfig {
  requestValidation: boolean;
  responseValidation: boolean;
  schemaValidation: boolean;
  sanitization: boolean;
  rules: ValidationRule[];
}

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  custom?: string;
}

export interface PerformanceConfig {
  timeout: number;
  maxConcurrent: number;
  queueSize: number;
  circuitBreaker: CircuitBreakerConfig;
  bulkhead: BulkheadConfig;
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  recoveryTimeout: number;
  halfOpenMaxCalls: number;
  slidingWindowType: 'count' | 'time';
  slidingWindowSize: number;
}

export interface BulkheadConfig {
  enabled: boolean;
  maxConcurrentCalls: number;
  maxWaitTime: number;
  queueSize: number;
}

export interface IntegrationEndpoint {
  id: string;
  name: string;
  path: string;
  method: HttpMethod;
  description: string;
  parameters: EndpointParameter[];
  requestSchema?: Schema;
  responseSchema?: Schema;
  rateLimitOverride?: Partial<RateLimit>;
  timeoutOverride?: number;
  retryOverride?: Partial<RetryConfig>;
  monitoring: EndpointMonitoring;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface EndpointParameter {
  name: string;
  type: 'path' | 'query' | 'header' | 'body';
  dataType: string;
  required: boolean;
  description: string;
  defaultValue?: unknown;
  validation?: ValidationRule[];
}

export interface Schema {
  type: string;
  properties: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean | Schema;
}

export interface SchemaProperty {
  type: string;
  format?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  enum?: unknown[];
  items?: Schema;
  properties?: Record<string, SchemaProperty>;
}

export interface RetryConfig {
  attempts: number;
  delay: number;
  backoff: 'fixed' | 'linear' | 'exponential';
  maxDelay: number;
  jitter: boolean;
  retryableErrors: string[];
}

export interface EndpointMonitoring {
  enabled: boolean;
  metrics: string[];
  alerts: AlertRule[];
  sampling: number;
}

export interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'ne';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  actions: AlertAction[];
}

export interface AlertAction {
  type: 'email' | 'sms' | 'webhook' | 'slack' | 'teams';
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  active: boolean;
  retryPolicy: RetryConfig;
  timeout: number;
  headers: Record<string, string>;
  payloadTemplate?: string;
  lastTriggered?: Date;
  triggerCount: number;
  errorCount: number;
}

export interface WebhookEvent {
  type: string;
  source: string;
  data: Record<string, unknown>;
  timestamp: Date;
  id: string;
  version: string;
}

export interface FieldMapping {
  id: string;
  sourceField: string;
  targetField: string;
  transformation: FieldTransformation;
  validation: ValidationRule[];
  required: boolean;
  defaultValue?: unknown;
  description: string;
}

export interface FieldTransformation {
  type: 'direct' | 'format' | 'calculate' | 'lookup' | 'conditional' | 'custom';
  config: Record<string, unknown>;
  script?: string;
}

export interface SyncSettings {
  enabled: boolean;
  direction: SyncDirection;
  frequency: SyncFrequency;
  conflictResolution: ConflictResolution;
  filters: SyncFilter[];
  batchSize: number;
  maxRetries: number;
  errorHandling: ErrorHandling;
}

export type SyncDirection = 'inbound' | 'outbound' | 'bidirectional';

export type SyncFrequency = 
  | 'real-time'
  | 'every-minute'
  | 'every-5-minutes'
  | 'every-15-minutes'
  | 'every-30-minutes'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'custom';

export interface ConflictResolution {
  strategy: 'source-wins' | 'target-wins' | 'manual' | 'merge' | 'timestamp';
  rules: ConflictRule[];
}

export interface ConflictRule {
  condition: string;
  action: 'accept' | 'reject' | 'merge' | 'transform';
  config: Record<string, unknown>;
}

export interface SyncFilter {
  field: string;
  operator: 'equals' | 'not-equals' | 'contains' | 'not-contains' | 'gt' | 'lt' | 'gte' | 'lte';
  value: unknown;
  type: 'include' | 'exclude';
}

export interface ErrorHandling {
  strategy: 'retry' | 'skip' | 'queue' | 'fail' | 'notify';
  maxRetries: number;
  retryDelay: number;
  deadLetterQueue: boolean;
  notification: ErrorNotification[];
}

export interface ErrorNotification {
  type: 'email' | 'sms' | 'webhook' | 'slack';
  recipients: string[];
  template: string;
  enabled: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: MonitoringMetric[];
  healthCheck: HealthCheckConfig;
  alerts: MonitoringAlert[];
  dashboards: DashboardConfig[];
}

export interface MonitoringMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
  description: string;
  labels: Record<string, string>;
  enabled: boolean;
}

export interface HealthCheckConfig {
  enabled: boolean;
  interval: number; // in seconds
  timeout: number;
  endpoints: HealthCheckEndpoint[];
  failureThreshold: number;
  recoveryThreshold: number;
}

export interface HealthCheckEndpoint {
  url: string;
  method: HttpMethod;
  expectedStatus: number;
  timeout: number;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface MonitoringAlert {
  name: string;
  condition: AlertCondition;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  actions: AlertAction[];
  cooldown: number; // in seconds
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte';
  threshold: number;
  duration: number; // in seconds
}

export interface DashboardConfig {
  name: string;
  description: string;
  widgets: DashboardWidget[];
  refreshInterval: number;
  enabled: boolean;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'log' | 'status';
  title: string;
  query: string;
  visualization: VisualizationConfig;
  position: WidgetPosition;
  size: WidgetSize;
}

export interface VisualizationConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap';
  xAxis?: string;
  yAxis?: string;
  series?: string[];
  colors?: string[];
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface IntegrationError {
  code: string;
  message: string;
  details: Record<string, unknown>;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolvedAt?: Date;
  resolution?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  status: WorkflowStatus;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  variables: WorkflowVariable[];
  errorHandling: WorkflowErrorHandling;
  monitoring: WorkflowMonitoring;
  createdAt: Date;
  updatedAt: Date;
  lastExecuted?: Date;
  executionCount: number;
  successCount: number;
  errorCount: number;
}

export type WorkflowStatus = 
  | 'active'
  | 'inactive'
  | 'draft'
  | 'archived'
  | 'error';

export interface WorkflowTrigger {
  type: TriggerType;
  config: TriggerConfig;
  enabled: boolean;
}

export type TriggerType = 
  | 'webhook'
  | 'schedule'
  | 'event'
  | 'manual'
  | 'api'
  | 'file'
  | 'email'
  | 'database';

export interface TriggerConfig {
  webhook?: WebhookTriggerConfig;
  schedule?: ScheduleTriggerConfig;
  event?: EventTriggerConfig;
  manual?: ManualTriggerConfig;
  api?: ApiTriggerConfig;
  file?: FileTriggerConfig;
  email?: EmailTriggerConfig;
  database?: DatabaseTriggerConfig;
}

export interface WebhookTriggerConfig {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  authentication: AuthenticationConfig;
  timeout: number;
}

export interface ScheduleTriggerConfig {
  cron: string;
  timezone: string;
  startDate?: Date;
  endDate?: Date;
}

export interface EventTriggerConfig {
  source: string;
  eventType: string;
  filters: EventFilter[];
}

export interface EventFilter {
  field: string;
  operator: string;
  value: unknown;
}

export interface ManualTriggerConfig {
  allowedUsers: string[];
  allowedRoles: string[];
  requireConfirmation: boolean;
}

export interface ApiTriggerConfig {
  endpoint: string;
  method: HttpMethod;
  authentication: AuthenticationConfig;
  rateLimit?: RateLimit;
}

export interface FileTriggerConfig {
  path: string;
  pattern: string;
  recursive: boolean;
  events: ('create' | 'modify' | 'delete')[];
}

export interface EmailTriggerConfig {
  mailbox: string;
  filters: EmailFilter[];
  pollingInterval: number;
}

export interface EmailFilter {
  field: 'from' | 'to' | 'subject' | 'body' | 'attachments';
  operator: string;
  value: string;
}

export interface DatabaseTriggerConfig {
  connection: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  condition?: string;
  pollingInterval: number;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  config: StepConfig;
  position: StepPosition;
  retryPolicy: RetryConfig;
  timeout: number;
  condition?: StepCondition;
  parallel?: boolean;
}

export type StepType = 
  | 'task'
  | 'decision'
  | 'parallel'
  | 'delay'
  | 'webhook'
  | 'script'
  | 'integration'
  | 'notification'
  | 'approval'
  | 'transform'
  | 'filter'
  | 'loop'
  | 'sub-workflow';

export interface StepConfig {
  task?: TaskStepConfig;
  decision?: DecisionStepConfig;
  parallel?: ParallelStepConfig;
  delay?: DelayStepConfig;
  webhook?: WebhookStepConfig;
  script?: ScriptStepConfig;
  integration?: IntegrationStepConfig;
  notification?: NotificationStepConfig;
  approval?: ApprovalStepConfig;
  transform?: TransformStepConfig;
  filter?: FilterStepConfig;
  loop?: LoopStepConfig;
  subWorkflow?: SubWorkflowStepConfig;
}

export interface TaskStepConfig {
  action: string;
  parameters: Record<string, unknown>;
  service: string;
  version?: string;
}

export interface DecisionStepConfig {
  condition: string;
  branches: DecisionBranch[];
  defaultBranch?: string;
}

export interface DecisionBranch {
  name: string;
  condition: string;
  steps: string[]; // step IDs
}

export interface ParallelStepConfig {
  branches: ParallelBranch[];
  waitAll: boolean;
}

export interface ParallelBranch {
  name: string;
  steps: string[]; // step IDs
}

export interface DelayStepConfig {
  duration: number;
  unit: 'seconds' | 'minutes' | 'hours' | 'days';
}

export interface WebhookStepConfig {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: unknown;
  authentication: AuthenticationConfig;
  timeout: number;
}

export interface ScriptStepConfig {
  language: 'javascript' | 'python' | 'bash';
  code: string;
  runtime?: string;
  version?: string;
}

export interface IntegrationStepConfig {
  integrationId: string;
  endpoint: string;
  method: HttpMethod;
  parameters: Record<string, unknown>;
  mapping?: FieldMapping[];
}

export interface NotificationStepConfig {
  type: 'email' | 'sms' | 'push' | 'webhook' | 'slack' | 'teams';
  recipients: string[];
  template: string;
  data: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface ApprovalStepConfig {
  approvers: string[];
  requiredApprovals: number;
  timeout: number;
  reminderInterval: number;
  escalationPolicy?: EscalationPolicy;
}

export interface EscalationPolicy {
  level: number;
  approvers: string[];
  timeout: number;
}

export interface TransformStepConfig {
  input: string;
  output: string;
  transformation: string;
  language: 'javascript' | 'python' | 'xslt';
}

export interface FilterStepConfig {
  condition: string;
  action: 'continue' | 'skip' | 'error';
}

export interface LoopStepConfig {
  type: 'for' | 'while' | 'foreach';
  condition: string;
  collection?: string;
  iterator?: string;
  steps: string[]; // step IDs
}

export interface SubWorkflowStepConfig {
  workflowId: string;
  parameters: Record<string, unknown>;
  waitForCompletion: boolean;
}

export interface StepPosition {
  x: number;
  y: number;
}

export interface StepCondition {
  expression: string;
  language: 'javascript' | 'python';
}

export interface WorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  defaultValue?: unknown;
  required: boolean;
  description: string;
  validation?: ValidationRule[];
}

export interface WorkflowErrorHandling {
  strategy: 'retry' | 'continue' | 'error' | 'compensate';
  maxRetries: number;
  retryDelay: number;
  compensationSteps?: string[]; // step IDs
  notification: ErrorNotification[];
}

export interface WorkflowMonitoring {
  enabled: boolean;
  metrics: WorkflowMetric[];
  alerts: WorkflowAlert[];
  logging: WorkflowLogging;
}

export interface WorkflowMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
  description: string;
  labels: Record<string, string>;
}

export interface WorkflowAlert {
  name: string;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actions: AlertAction[];
  enabled: boolean;
}

export interface WorkflowLogging {
  level: 'debug' | 'info' | 'warn' | 'error';
  includePayload: boolean;
  includeResult: boolean;
  customFields: string[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowVersion: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  trigger: TriggerInfo;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  steps: StepExecution[];
  variables: Record<string, unknown>;
  error?: ExecutionError;
  metadata: ExecutionMetadata;
}

export type ExecutionStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout'
  | 'retrying';

export interface TriggerInfo {
  type: TriggerType;
  data: Record<string, unknown>;
  timestamp: Date;
  source?: string;
}

export interface StepExecution {
  id: string;
  stepId: string;
  name: string;
  type: StepType;
  status: StepExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: ExecutionError;
  attempts: number;
  logs: ExecutionLog[];
}

export type StepExecutionStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'cancelled'
  | 'timeout';

export interface ExecutionError {
  code: string;
  message: string;
  stack?: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

export interface ExecutionLog {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

export interface ExecutionMetadata {
  environment: string;
  version: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  tags: Record<string, string>;
}

export interface AutomationEngine {
  // Integration Management
  getIntegrations: () => Promise<IntegrationConfig[]>;
  getIntegration: (id: string) => Promise<IntegrationConfig>;
  createIntegration: (config: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<IntegrationConfig>;
  updateIntegration: (id: string, updates: Partial<IntegrationConfig>) => Promise<IntegrationConfig>;
  deleteIntegration: (id: string) => Promise<void>;
  testIntegration: (id: string) => Promise<IntegrationTestResult>;
  
  // Workflow Management
  getWorkflows: () => Promise<WorkflowDefinition[]>;
  getWorkflow: (id: string) => Promise<WorkflowDefinition>;
  createWorkflow: (definition: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>) => Promise<WorkflowDefinition>;
  updateWorkflow: (id: string, updates: Partial<WorkflowDefinition>) => Promise<WorkflowDefinition>;
  deleteWorkflow: (id: string) => Promise<void>;
  deployWorkflow: (id: string) => Promise<void>;
  undeployWorkflow: (id: string) => Promise<void>;
  
  // Execution Management
  executeWorkflow: (workflowId: string, input: Record<string, unknown>, options?: ExecutionOptions) => Promise<WorkflowExecution>;
  getExecution: (id: string) => Promise<WorkflowExecution>;
  getExecutions: (workflowId?: string, filters?: ExecutionFilters) => Promise<WorkflowExecution[]>;
  cancelExecution: (id: string) => Promise<void>;
  retryExecution: (id: string) => Promise<void>;
  
  // Monitoring and Analytics
  getIntegrationMetrics: (integrationId: string, period: DateRange) => Promise<IntegrationMetrics>;
  getWorkflowMetrics: (workflowId: string, period: DateRange) => Promise<WorkflowMetrics>;
  getSystemHealth: () => Promise<SystemHealth>;
  getAlerts: (filters?: AlertFilters) => Promise<Alert[]>;
  
  // Configuration Management
  getSystemConfig: () => Promise<SystemConfig>;
  updateSystemConfig: (config: Partial<SystemConfig>) => Promise<SystemConfig>;
  
  // Event Management
  emitEvent: (event: AutomationEvent) => Promise<void>;
  subscribeToEvents: (filters: EventFilter[], callback: EventCallback) => Promise<string>;
  unsubscribeFromEvents: (subscriptionId: string) => Promise<void>;
}

export interface IntegrationTestResult {
  success: boolean;
  duration: number;
  tests: TestResult[];
  summary: TestSummary;
  recommendations: string[];
}

export interface TestResult {
  name: string;
  type: 'connection' | 'authentication' | 'endpoint' | 'data' | 'performance';
  success: boolean;
  duration: number;
  message: string;
  details?: Record<string, unknown>;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  successRate: number;
}

export interface ExecutionOptions {
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  timeout?: number;
  retryPolicy?: RetryConfig;
  variables?: Record<string, unknown>;
  metadata?: ExecutionMetadata;
}

export interface ExecutionFilters {
  status?: ExecutionStatus;
  dateRange?: DateRange;
  triggerType?: TriggerType;
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface IntegrationMetrics {
  integrationId: string;
  period: DateRange;
  requests: RequestMetrics;
  errors: ErrorMetrics;
  performance: PerformanceMetrics;
  usage: UsageMetrics;
}

export interface RequestMetrics {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  averageResponseTime: number;
  requestsPerMinute: number;
}

export interface ErrorMetrics {
  total: number;
  byType: Record<string, number>;
  byEndpoint: Record<string, number>;
  recent: ErrorMetric[];
}

export interface ErrorMetric {
  timestamp: Date;
  code: string;
  message: string;
  endpoint?: string;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  throughput: number;
  errorRate: number;
}

export interface UsageMetrics {
  requests: number;
  dataTransferred: number;
  cost: number;
  quota: QuotaMetrics;
}

export interface QuotaMetrics {
  used: number;
  limit: number;
  percentage: number;
  resetDate: Date;
}

export interface WorkflowMetrics {
  workflowId: string;
  period: DateRange;
  executions: ExecutionMetrics;
  performance: WorkflowPerformanceMetrics;
  errors: WorkflowErrorMetrics;
}

export interface ExecutionMetrics {
  total: number;
  successful: number;
  failed: number;
  cancelled: number;
  averageDuration: number;
  executionsPerDay: number;
}

export interface WorkflowPerformanceMetrics {
  averageDuration: number;
  p50: number;
  p95: number;
  p99: number;
  throughput: number;
  successRate: number;
}

export interface WorkflowErrorMetrics {
  total: number;
  byStep: Record<string, number>;
  byType: Record<string, number>;
  recent: WorkflowErrorMetric[];
}

export interface WorkflowErrorMetric {
  timestamp: Date;
  stepId: string;
  stepName: string;
  error: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  components: ComponentHealth[];
  metrics: SystemMetrics;
  alerts: ActiveAlert[];
}

export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  lastCheck: Date;
  responseTime?: number;
  uptime?: number;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: NetworkMetrics;
  activeConnections: number;
  queueSize: number;
}

export interface NetworkMetrics {
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  connections: number;
}

export interface ActiveAlert {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  component?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface AlertFilters {
  severity?: string[];
  component?: string[];
  acknowledged?: boolean;
  dateRange?: DateRange;
  limit?: number;
}

export interface Alert {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: AlertCondition;
  message: string;
  timestamp: Date;
  component?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface SystemConfig {
  environment: string;
  version: string;
  features: FeatureConfig[];
  limits: SystemLimits;
  security: SystemSecurityConfig;
  performance: SystemPerformanceConfig;
  logging: SystemLoggingConfig;
  monitoring: SystemMonitoringConfig;
}

export interface FeatureConfig {
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface SystemLimits {
  maxWorkflows: number;
  maxIntegrations: number;
  maxConcurrentExecutions: number;
  maxExecutionTime: number;
  maxPayloadSize: number;
  maxRetries: number;
}

export interface SystemSecurityConfig {
  encryption: EncryptionConfig;
  authentication: AuthenticationConfig;
  authorization: AuthorizationConfig;
  rateLimit: RateLimit;
  audit: AuditConfig;
}

export interface AuditConfig {
  enabled: boolean;
  logLevel: string;
  retention: number; // in days
  fields: string[];
}

export interface SystemPerformanceConfig {
  timeout: number;
  maxConcurrent: number;
  queueSize: number;
  cacheSize: number;
  batchSize: number;
}

export interface SystemLoggingConfig {
  level: string;
  format: string;
  destinations: LogDestination[];
  sampling: number;
}

export interface SystemMonitoringConfig {
  enabled: boolean;
  metrics: string[];
  healthCheck: HealthCheckConfig;
  alerts: MonitoringAlert[];
}

export interface AutomationEvent {
  id: string;
  type: string;
  source: string;
  data: Record<string, unknown>;
  timestamp: Date;
  version: string;
  correlationId?: string;
  causationId?: string;
}

export interface EventFilter {
  type?: string;
  source?: string;
  data?: Record<string, unknown>;
  dateRange?: DateRange;
}

export interface EventCallback {
  (event: AutomationEvent): Promise<void> | void;
}
