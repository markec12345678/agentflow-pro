/**
 * Use Case: Alert Rule Management
 * 
 * Create, update, and manage alert rules.
 */

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface CreateAlertRuleInput {
  userId: string
  name: string
  eventType: string
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled?: boolean
  channels: ('email' | 'sms' | 'slack')[]
  cooldownMinutes?: number
  escalateAfterMinutes?: number
  escalateTo?: string
}

export interface CreateAlertRuleOutput {
  success: boolean
  ruleId: string
  name: string
}

export interface GetAlertRulesInput {
  userId: string
  enabled?: boolean
  severity?: string
}

export interface GetAlertRulesOutput {
  rules: AlertRule[]
  total: number
}

export interface AlertRule {
  id: string
  name: string
  eventType: string
  threshold: number
  severity: string
  enabled: boolean
  channels: string[]
  cooldownMinutes: number
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Use Case Class
// ============================================================================

export class AlertRuleManagement {
  constructor(
    private alertRuleRepository: AlertRuleRepository
  ) {}

  /**
   * Create new alert rule
   */
  async create(input: CreateAlertRuleInput): Promise<CreateAlertRuleOutput> {
    // 1. Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical']
    if (!validSeverities.includes(input.severity)) {
      throw new Error('Invalid severity level')
    }

    // 2. Validate channels
    const validChannels = ['email', 'sms', 'slack']
    const invalidChannels = input.channels.filter(c => !validChannels.includes(c))
    if (invalidChannels.length > 0) {
      throw new Error('Invalid channels')
    }

    // 3. Create rule
    const rule: AlertRule = {
      id: this.generateId(),
      name: input.name,
      eventType: input.eventType,
      threshold: input.threshold,
      severity: input.severity,
      enabled: input.enabled ?? true,
      channels: input.channels,
      cooldownMinutes: input.cooldownMinutes ?? 60,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 4. Save rule
    await this.alertRuleRepository.save(rule)

    return {
      success: true,
      ruleId: rule.id,
      name: rule.name
    }
  }

  /**
   * Get all alert rules
   */
  async getRules(input: GetAlertRulesInput): Promise<GetAlertRulesOutput> {
    const { userId, enabled, severity } = input

    // 1. Fetch rules
    const rules = await this.alertRuleRepository.findAll({
      userId,
      enabled,
      severity
    })

    return {
      rules,
      total: rules.length
    }
  }

  /**
   * Enable/disable alert rule
   */
  async toggleRule(ruleId: string, enabled: boolean): Promise<void> {
    const rule = await this.alertRuleRepository.findById(ruleId)
    
    if (!rule) {
      throw new Error('Rule not found')
    }

    rule.enabled = enabled
    await this.alertRuleRepository.save(rule)
  }

  /**
   * Delete alert rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    await this.alertRuleRepository.delete(ruleId)
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private generateId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// ============================================================================
// Repository Interface
// ============================================================================

export interface AlertRuleRepository {
  findById(id: string): Promise<AlertRule | null>
  findAll(filters: any): Promise<AlertRule[]>
  save(rule: AlertRule): Promise<void>
  delete(id: string): Promise<void>
}
