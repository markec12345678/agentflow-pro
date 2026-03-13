/**
 * Use Case: Execute Workflow
 * 
 * Execute automation workflow.
 */

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface ExecuteWorkflowInput {
  workflowId: string
  userId: string
  inputData?: Record<string, any>
}

export interface ExecuteWorkflowOutput {
  success: boolean
  executionId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: any
  error?: string
}

// ============================================================================
// Use Case Class
// ============================================================================

export class ExecuteWorkflow {
  constructor(
    private workflowRepository: WorkflowRepository,
    private workflowExecutor: WorkflowExecutor
  ) {}

  /**
   * Execute workflow
   */
  async execute(input: ExecuteWorkflowInput): Promise<ExecuteWorkflowOutput> {
    const { workflowId, userId, inputData } = input

    // 1. Get workflow
    const workflow = await this.workflowRepository.findById(workflowId)
    if (!workflow) {
      throw new Error('Workflow not found')
    }

    // 2. Verify user has access
    if (!workflow.isActive) {
      throw new Error('Workflow is not active')
    }

    // 3. Execute workflow
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      const result = await this.workflowExecutor.execute(workflow, inputData)

      return {
        success: true,
        executionId,
        status: 'completed',
        result
      }
    } catch (error: any) {
      return {
        success: false,
        executionId,
        status: 'failed',
        error: error.message
      }
    }
  }
}

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface WorkflowRepository {
  findById(id: string): Promise<any | null>
}

export interface WorkflowExecutor {
  execute(workflow: any, inputData?: Record<string, any>): Promise<any>
}
