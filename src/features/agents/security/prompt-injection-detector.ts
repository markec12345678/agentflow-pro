/**
 * AgentFlow Pro - Prompt Injection Detection & Prevention
 * Protects agents from jailbreak attempts and malicious inputs
 */

export interface SecurityScanResult {
  isSafe: boolean;
  riskScore: number; // 0-100
  detectedThreats: ThreatDetection[];
  recommendation: 'allow' | 'review' | 'block';
  sanitizedInput?: string;
}

export interface ThreatDetection {
  type: ThreatType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  description: string;
  matchedPattern?: string;
  location?: 'input' | 'output';
}

export type ThreatType =
  | 'prompt_injection'
  | 'jailbreak_attempt'
  | 'role_playing'
  | 'instruction_override'
  | 'context_leakage'
  | 'token_overflow'
  | 'malicious_code'
  | 'pii_extraction'
  | 'system_prompt_access';

export interface SecurityConfig {
  maxTokenLimit: number;
  blockedPatterns: RegExp[];
  sensitivityLevel: 'low' | 'medium' | 'high';
  allowlistDomains: string[];
  blocklistDomains: string[];
}

export class PromptInjectionDetector {
  private config: SecurityConfig;

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      maxTokenLimit: config?.maxTokenLimit || 10000,
      blockedPatterns: config?.blockedPatterns || this.getDefaultBlockedPatterns(),
      sensitivityLevel: config?.sensitivityLevel || 'medium',
      allowlistDomains: config?.allowlistDomains || [],
      blocklistDomains: config?.blocklistDomains || [
        'pastebin.com',
        'hastebin.com',
        'ctrlq.org',
      ],
    };
  }

  /**
   * Scan input for security threats
   */
  async scanInput(input: string, context?: any): Promise<SecurityScanResult> {
    const threats: ThreatDetection[] = [];

    // 1. Check for prompt injection patterns
    const injectionThreats = this.detectPromptInjection(input);
    threats.push(...injectionThreats);

    // 2. Check for jailbreak attempts
    const jailbreakThreats = this.detectJailbreakAttempts(input);
    threats.push(...jailbreakThreats);

    // 3. Check for role-playing attacks
    const rolePlayingThreats = this.detectRolePlaying(input);
    threats.push(...rolePlayingThreats);

    // 4. Check for instruction override attempts
    const overrideThreats = this.detectInstructionOverride(input);
    threats.push(...overrideThreats);

    // 5. Check for context leakage attempts
    const leakageThreats = this.detectContextLeakage(input);
    threats.push(...leakageThreats);

    // 6. Check for malicious URLs
    const urlThreats = this.detectMaliciousUrls(input);
    threats.push(...urlThreats);

    // 7. Check token limit
    const tokenThreat = this.checkTokenLimit(input);
    if (tokenThreat) threats.push(tokenThreat);

    // Calculate risk score
    const riskScore = this.calculateRiskScore(threats);

    // Determine recommendation
    const recommendation = this.getRecommendation(riskScore, threats);

    return {
      isSafe: riskScore < 30,
      riskScore,
      detectedThreats: threats,
      recommendation,
      sanitizedInput: this.sanitizeInput(input, threats),
    };
  }

  /**
   * Scan agent output before returning to user
   */
  async scanOutput(output: string, input?: string): Promise<SecurityScanResult> {
    const threats: ThreatDetection[] = [];

    // 1. Check for sensitive information leakage
    const leakageThreats = this.detectDataLeakage(output);
    threats.push(...leakageThreats);

    // 2. Check for malicious code generation
    const codeThreats = this.detectMaliciousCode(output);
    threats.push(...codeThreats);

    // 3. Check for PII in output
    const piiThreats = this.detectPiiLeakage(output);
    threats.push(...piiThreats);

    // Calculate risk score
    const riskScore = this.calculateRiskScore(threats);
    const recommendation = this.getRecommendation(riskScore, threats);

    return {
      isSafe: riskScore < 30,
      riskScore,
      detectedThreats: threats,
      recommendation,
    };
  }

  /**
   * Detect prompt injection patterns
   */
  private detectPromptInjection(input: string): ThreatDetection[] {
    const threats: ThreatDetection[] = [];
    const patterns = [
      // Classic injection patterns
      /ignore (all|previous) instructions/i,
      /forget (all|previous) instructions/i,
      /disregard (all|previous) instructions/i,
      /bypass (all|content) filters/i,
      /override (your|the) rules/i,
      /you are now in (developer|debug|test) mode/i,
      /system:|system prompt:|instruction:/i,
      /### Instruction:/i,
      /<|begin_of_text\|>/i,
      /<\|startoftext\|>/i,
      // Nested injection
      /repeat the words above/i,
      /print the conversation/i,
      /output your (system prompt|instructions|rules)/i,
      // Base64/encoded payloads
      /base64\.decode\(/i,
      /atob\(/i,
    ];

    for (const pattern of patterns) {
      if (pattern.test(input)) {
        threats.push({
          type: 'prompt_injection',
          severity: 'high',
          confidence: 0.9,
          description: 'Detected prompt injection attempt',
          matchedPattern: pattern.toString(),
        });
      }
    }

    return threats;
  }

  /**
   * Detect jailbreak attempts
   */
  private detectJailbreakAttempts(input: string): ThreatDetection[] {
    const threats: ThreatDetection[] = [];
    const jailbreakPatterns = [
      // DAN-style jailbreaks
      /dan mode|do anything now/i,
      /developer mode/i,
      /simulation mode/i,
      /roleplay as an (unrestricted|unfiltered|uncensored) ai/i,
      // Hypothetical scenarios
      /pretend you are (evil|malicious|harmful)/i,
      /what would you do if you were (unrestricted|free)/i,
      // Translation attacks
      /translate this to (pig latin|base64|rot13) and back/i,
      // Token smuggling
      /split this word/i,
      /use dots between letters/i,
    ];

    for (const pattern of jailbreakPatterns) {
      if (pattern.test(input)) {
        threats.push({
          type: 'jailbreak_attempt',
          severity: 'critical',
          confidence: 0.95,
          description: 'Detected jailbreak attempt',
          matchedPattern: pattern.toString(),
        });
      }
    }

    return threats;
  }

  /**
   * Detect role-playing attacks
   */
  private detectRolePlaying(input: string): ThreatDetection[] {
    const threats: ThreatDetection[] = [];
    const patterns = [
      /you are now (a hacker|an ai without restrictions)/i,
      /act as (a developer|system administrator)/i,
      /from now on, you are/i,
      /your new name is/i,
      /you have been (upgraded|modified|reprogrammed)/i,
    ];

    for (const pattern of patterns) {
      if (pattern.test(input)) {
        threats.push({
          type: 'role_playing',
          severity: 'medium',
          confidence: 0.8,
          description: 'Detected role-playing attack attempt',
          matchedPattern: pattern.toString(),
        });
      }
    }

    return threats;
  }

  /**
   * Detect instruction override attempts
   */
  private detectInstructionOverride(input: string): ThreatDetection[] {
    const threats: ThreatDetection[] = [];
    const patterns = [
      /new instruction:/i,
      /important: ignore/i,
      /actually, (don't|do not)/i,
      /scratch that/i,
      /on second thought/i,
      /the real task is/i,
    ];

    for (const pattern of patterns) {
      if (pattern.test(input)) {
        threats.push({
          type: 'instruction_override',
          severity: 'medium',
          confidence: 0.75,
          description: 'Detected instruction override attempt',
          matchedPattern: pattern.toString(),
        });
      }
    }

    return threats;
  }

  /**
   * Detect context leakage attempts
   */
  private detectContextLeakage(input: string): ThreatDetection[] {
    const threats: ThreatDetection[] = [];
    const patterns = [
      /what is your (system prompt|base prompt|instruction)/i,
      /tell me about your (training data|knowledge cutoff)/i,
      /what model are you\?/i,
      /who created you\?/i,
      /what are your (guidelines|rules|policies)/i,
    ];

    for (const pattern of patterns) {
      if (pattern.test(input)) {
        threats.push({
          type: 'context_leakage',
          severity: 'low',
          confidence: 0.7,
          description: 'Detected context leakage attempt',
          matchedPattern: pattern.toString(),
        });
      }
    }

    return threats;
  }

  /**
   * Detect malicious URLs
   */
  private detectMaliciousUrls(input: string): ThreatDetection[] {
    const threats: ThreatDetection[] = [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = input.match(urlRegex) || [];

    for (const url of urls) {
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;

        // Check blocklist
        if (this.config.blocklistDomains.some(d => domain.includes(d))) {
          threats.push({
            type: 'prompt_injection',
            severity: 'high',
            confidence: 0.9,
            description: `Blocked domain detected: ${domain}`,
            matchedPattern: url,
          });
        }
      } catch {
        // Invalid URL, ignore
      }
    }

    return threats;
  }

  /**
   * Check token limit
   */
  private checkTokenLimit(input: string): ThreatDetection | null {
    // Approximate token count (4 chars per token for English)
    const estimatedTokens = Math.ceil(input.length / 4);

    if (estimatedTokens > this.config.maxTokenLimit) {
      return {
        type: 'token_overflow',
        severity: 'medium',
        confidence: 1.0,
        description: `Input exceeds token limit (${estimatedTokens} > ${this.config.maxTokenLimit})`,
      };
    }

    return null;
  }

  /**
   * Detect data leakage in output
   */
  private detectDataLeakage(output: string): ThreatDetection[] {
    const threats: ThreatDetection[] = [];

    // Check for API keys, passwords, etc.
    const sensitivePatterns = [
      /api[_-]?key\s*[=:]\s*['"][a-zA-Z0-9]{20,}['"]/i,
      /password\s*[=:]\s*['"][^'"]+['"]/i,
      /secret\s*[=:]\s*['"][a-zA-Z0-9]{16,}['"]/i,
      /token\s*[=:]\s*['"][a-zA-Z0-9]{20,}['"]/i,
      /-----BEGIN (RSA |EC )?PRIVATE KEY-----/i,
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(output)) {
        threats.push({
          type: 'context_leakage',
          severity: 'critical',
          confidence: 0.95,
          description: 'Sensitive information detected in output',
          matchedPattern: pattern.toString(),
        });
      }
    }

    return threats;
  }

  /**
   * Detect malicious code generation
   */
  private detectMaliciousCode(output: string): ThreatDetection[] {
    const threats: ThreatDetection[] = [];
    const patterns = [
      /eval\s*\(/i,
      /exec\s*\(/i,
      /system\s*\(/i,
      /child_process/i,
      /spawn\s*\(/i,
      /rm\s+-rf\s+\//i,
      /DROP TABLE/i,
      /DELETE FROM.*WHERE 1/i,
      /<script[^>]*>.*<\/script>/i,
      /javascript:/i,
    ];

    for (const pattern of patterns) {
      if (pattern.test(output)) {
        threats.push({
          type: 'malicious_code',
          severity: 'high',
          confidence: 0.8,
          description: 'Potentially malicious code detected',
          matchedPattern: pattern.toString(),
        });
      }
    }

    return threats;
  }

  /**
   * Detect PII leakage
   */
  private detectPiiLeakage(output: string): ThreatDetection[] {
    const threats: ThreatDetection[] = [];

    // Email addresses
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    if (output.match(emailRegex)) {
      threats.push({
        type: 'pii_extraction',
        severity: 'medium',
        confidence: 0.9,
        description: 'Email addresses detected in output',
      });
    }

    // Phone numbers (various formats)
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
    if (output.match(phoneRegex)) {
      threats.push({
        type: 'pii_extraction',
        severity: 'medium',
        confidence: 0.85,
        description: 'Phone numbers detected in output',
      });
    }

    // Credit card numbers
    const ccRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
    if (output.match(ccRegex)) {
      threats.push({
        type: 'pii_extraction',
        severity: 'critical',
        confidence: 0.95,
        description: 'Credit card numbers detected in output',
      });
    }

    return threats;
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(threats: ThreatDetection[]): number {
    if (threats.length === 0) return 0;

    const severityWeights = {
      low: 10,
      medium: 25,
      high: 50,
      critical: 100,
    };

    let totalScore = 0;
    for (const threat of threats) {
      const weight = severityWeights[threat.severity];
      totalScore += weight * threat.confidence;
    }

    // Normalize to 0-100
    return Math.min(100, Math.round(totalScore / threats.length));
  }

  /**
   * Get recommendation based on risk score
   */
  private getRecommendation(
    riskScore: number,
    threats: ThreatDetection[]
  ): 'allow' | 'review' | 'block' {
    if (riskScore >= 70) return 'block';
    if (riskScore >= 30) return 'review';

    // Auto-block if any critical threats
    if (threats.some(t => t.severity === 'critical')) return 'block';

    return 'allow';
  }

  /**
   * Sanitize input by removing detected threats
   */
  private sanitizeInput(input: string, threats: ThreatDetection[]): string {
    let sanitized = input;

    for (const threat of threats) {
      if (threat.matchedPattern) {
        try {
          const regex = new RegExp(threat.matchedPattern, 'gi');
          sanitized = sanitized.replace(regex, '[REDACTED]');
        } catch {
          // Invalid regex, skip
        }
      }
    }

    return sanitized;
  }

  /**
   * Get default blocked patterns
   */
  private getDefaultBlockedPatterns(): RegExp[] {
    return [
      /ignore instructions/i,
      /bypass filters/i,
      /you are now/i,
      /system prompt/i,
    ];
  }
}

/**
 * Create security middleware for agent execution
 */
export function createSecurityMiddleware(detector: PromptInjectionDetector) {
  return async function securityMiddleware(
    input: string,
    execute: (safeInput: string) => Promise<any>
  ): Promise<any> {
    // Scan input
    const scanResult = await detector.scanInput(input);

    if (scanResult.recommendation === 'block') {
      throw new SecurityError(
        'Request blocked due to security concerns',
        scanResult.detectedThreats
      );
    }

    if (scanResult.recommendation === 'review') {
      console.warn('[Security] Request flagged for review:', scanResult.detectedThreats);
      // Could trigger human review here
    }

    // Execute with sanitized input
    const safeInput = scanResult.sanitizedInput || input;
    return execute(safeInput);
  };
}

export class SecurityError extends Error {
  constructor(
    message: string,
    public threats: ThreatDetection[]
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

export const promptInjectionDetector = new PromptInjectionDetector();
