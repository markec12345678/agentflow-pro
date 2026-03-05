// AgentFlow Workflow Executor - NAPI-RS Binding Entry Point
// This file provides the JavaScript/TypeScript interface to the Rust workflow executor

const { existsSync, readFileSync } = require('fs')
const { join } = require('path')

const { platform, arch } = process

let nativeBinding = null
let localFileExisted = false
let loadError = null

/**
 * Resolve the binding file path based on platform
 */
function resolveBindingPath() {
  const bindingName = 'agentflow-workflow'
  
  switch (platform) {
    case 'android':
      if (arch === 'arm64') {
        return join(__dirname, `${bindingName}.android-arm64.node`)
      }
      return join(__dirname, `${bindingName}.android-arm-eabi.node`)
    
    case 'win32':
      return join(__dirname, `${bindingName}.win32-x64-msvc.node`)
    
    case 'darwin':
      if (arch === 'arm64') {
        return join(__dirname, `${bindingName}.darwin-arm64.node`)
      }
      return join(__dirname, `${bindingName}.darwin-x64.node`)
    
    case 'freebsd':
      if (arch === 'x64') {
        return join(__dirname, `${bindingName}.freebsd-x64.node`)
      }
      return join(__dirname, `${bindingName}.freebsd-arm64.node`)
    
    case 'linux':
      if (arch === 'x64') {
        return join(__dirname, `${bindingName}.linux-x64-gnu.node`)
      }
      if (arch === 'arm64') {
        return join(__dirname, `${bindingName}.linux-arm64-gnu.node`)
      }
      if (arch === 'arm') {
        return join(__dirname, `${bindingName}.linux-arm-gnueabihf.node`)
      }
      break
    
    default:
      throw new Error(`Unsupported OS: ${platform}, architecture: ${arch}`)
  }
  
  throw new Error(`Unsupported OS: ${platform}, architecture: ${arch}`)
}

/**
 * Load the native NAPI binding
 */
function loadNativeBinding() {
  const bindingPath = resolveBindingPath()
  
  try {
    return require(bindingPath)
  } catch (e) {
    localFileExisted = existsSync(bindingPath)
    loadError = e
  }
  
  // Try loading from parent directory (for monorepo setups)
  try {
    return require(join(__dirname, '..', bindingPath))
  } catch (e) {
    loadError = e
  }
  
  // Try loading from rust/target directory (for development)
  const targetPaths = [
    join(__dirname, '..', '..', 'target', 'release'),
    join(__dirname, '..', '..', 'target', 'debug'),
  ]
  
  for (const targetPath of targetPaths) {
    try {
      const files = require('fs').readdirSync(targetPath)
      const bindingFile = files.find(f => 
        f.includes(bindingName) && f.endsWith('.node')
      )
      if (bindingFile) {
        return require(join(targetPath, bindingFile))
      }
    } catch (e) {
      // Continue to next path
    }
  }
  
  // Construct helpful error message
  let error_msg = `
Failed to load native binding for AgentFlow Workflow Executor.

Platform: ${platform}
Architecture: ${arch}
Expected binding: ${bindingPath}
Local file existed: ${localFileExisted}

Original error: ${loadError?.message}

Possible solutions:
1. Run 'npm run build:workflow:napi' to build the binding locally
2. Ensure you're using a supported platform (win32/linux/darwin x64 or arm64)
3. Check that the Rust build completed successfully
`.trim()
  
  throw new Error(error_msg)
}

// Load the native module
nativeBinding = loadNativeBinding()

// Export all NAPI bindings
module.exports = nativeBinding

// Named exports for convenience
module.exports.executeWorkflow = nativeBinding.execute_workflow
module.exports.validateWorkflow = nativeBinding.validate_workflow
module.exports.getExecutionPlan = nativeBinding.get_execution_plan
module.exports.createProgressTracker = nativeBinding.create_progress_tracker

// Export types/enums
module.exports.NodeStatus = nativeBinding.NodeStatus
module.exports.WorkflowStatus = nativeBinding.WorkflowStatus

/**
 * Helper class for workflow execution
 */
class WorkflowExecutor {
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 30000,
      retries: options.retries || 3,
      ...options
    }
  }
  
  /**
   * Execute a workflow
   * @param {Object} workflow - Workflow definition
   * @returns {Promise<Object>} Execution result
   */
  async execute(workflow) {
    return nativeBinding.execute_workflow(workflow)
  }
  
  /**
   * Validate a workflow without executing
   * @param {Object} workflow - Workflow definition
   * @returns {boolean} True if valid
   */
  validate(workflow) {
    try {
      nativeBinding.validate_workflow(workflow)
      return true
    } catch (e) {
      return false
    }
  }
  
  /**
   * Get execution plan (topological order)
   * @param {Object} workflow - Workflow definition
   * @returns {string[]} Array of node IDs in execution order
   */
  getPlan(workflow) {
    return nativeBinding.get_execution_plan(workflow)
  }
}

module.exports.WorkflowExecutor = WorkflowExecutor
