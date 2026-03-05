//! Workflow Executor CLI
//! 
//! Command-line interface for executing workflows via stdin/stdout.
//! 
//! Usage:
//!   echo '{"id":"wf1","name":"Test","nodes":[...],"edges":[...]}' | workflow-executor
//! 
//! Input: JSON-serialized WorkflowDefinition
//! Output: JSON-serialized WorkflowExecutionResult

use workflow_executor::{WorkflowDefinition, execute_workflow};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use std::io;

#[tokio::main]
async fn main() {
    let mut input = String::new();
    
    // Read from stdin
    if let Err(e) = tokio::io::stdin().read_to_string(&mut input).await {
        eprintln!("Failed to read stdin: {}", e);
        std::process::exit(1);
    }

    // Parse workflow definition
    let workflow: WorkflowDefinition = match serde_json::from_str(&input) {
        Ok(wf) => wf,
        Err(e) => {
            eprintln!("Failed to parse workflow JSON: {}", e);
            std::process::exit(1);
        }
    };

    // Execute workflow
    let result = execute_workflow(workflow).await;

    // Serialize and write to stdout
    let output = match serde_json::to_string(&result) {
        Ok(json) => json,
        Err(e) => {
            eprintln!("Failed to serialize result: {}", e);
            std::process::exit(1);
        }
    };

    if let Err(e) = tokio::io::stdout().write_all(output.as_bytes()).await {
        eprintln!("Failed to write stdout: {}", e);
        std::process::exit(1);
    }
}
