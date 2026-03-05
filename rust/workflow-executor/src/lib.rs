//! AgentFlow Pro - High-Performance Workflow Executor
//! 
//! Rust-based workflow execution engine for AI agent orchestration.
//! Provides parallel execution, dependency resolution, and error handling.
//! 
//! # Features
//! - DAG-based workflow execution
//! - Parallel node processing
//! - Error recovery and retries
//! - Real-time progress tracking
//! - Memory-efficient streaming

use napi_derive::napi;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use uuid::Uuid;
use std::collections::{HashMap, HashSet, VecDeque};
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc};

// ============================================================================
// Error Types
// ============================================================================

#[derive(Error, Debug)]
pub enum WorkflowError {
    #[error("Node not found: {0}")]
    NodeNotFound(String),
    #[error("Circular dependency detected")]
    CircularDependency,
    #[error("Execution failed: {0}")]
    ExecutionFailed(String),
    #[error("Timeout exceeded")]
    Timeout,
    #[error("Invalid workflow: {0}")]
    InvalidWorkflow(String),
}

pub type WorkflowResult<T> = Result<T, WorkflowError>;

// ============================================================================
// Data Structures
// ============================================================================

/// Workflow node representing a single task or agent execution
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct WorkflowNode {
    pub id: String,
    pub node_type: String,
    pub name: String,
    pub data: String,
    pub timeout_ms: Option<f64>,
    pub retry_count: Option<u32>,
}

/// Edge defining dependencies between nodes
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct WorkflowEdge {
    pub source: String,
    pub target: String,
    pub condition: Option<String>,
}

/// Complete workflow definition
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct WorkflowDefinition {
    pub id: String,
    pub name: String,
    pub nodes: Vec<WorkflowNode>,
    pub edges: Vec<WorkflowEdge>,
    pub metadata: Option<String>,
}

/// Execution status of a node
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[napi]
pub enum NodeStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Skipped,
}

/// Result of executing a single node
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct NodeExecutionResult {
    pub node_id: String,
    pub status: NodeStatus,
    pub output: Option<String>,
    pub error: Option<String>,
    pub duration_ms: f64,
    pub retries: u32,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
}

/// Overall workflow execution status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[napi]
pub enum WorkflowStatus {
    Queued,
    Running,
    Completed,
    Failed,
    Cancelled,
}

/// Complete workflow execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct WorkflowExecutionResult {
    pub workflow_id: String,
    pub execution_id: String,
    pub status: WorkflowStatus,
    pub node_results: Vec<NodeExecutionResult>,
    pub total_duration_ms: f64,
    pub started_at: String,
    pub completed_at: Option<String>,
    pub error: Option<String>,
}

/// Progress update for real-time tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct WorkflowProgress {
    pub execution_id: String,
    pub completed_nodes: u32,
    pub total_nodes: u32,
    pub current_node: Option<String>,
    pub status: WorkflowStatus,
    pub percent_complete: f64,
}

// ============================================================================
// Workflow Executor (Internal)
// ============================================================================

struct Executor {
    workflow: WorkflowDefinition,
    node_results: Arc<RwLock<HashMap<String, NodeExecutionResult>>>,
}

impl Executor {
    fn new(workflow: WorkflowDefinition) -> Self {
        Self {
            workflow,
            node_results: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Validate workflow structure (check for cycles, missing nodes)
    fn validate(&self) -> WorkflowResult<()> {
        let node_ids: HashSet<&String> = self.workflow.nodes.iter()
            .map(|n| &n.id)
            .collect();

        // Check for missing nodes in edges
        for edge in &self.workflow.edges {
            if !node_ids.contains(&edge.source) {
                return Err(WorkflowError::NodeNotFound(edge.source.clone()));
            }
            if !node_ids.contains(&edge.target) {
                return Err(WorkflowError::NodeNotFound(edge.target.clone()));
            }
        }

        // Check for circular dependencies using topological sort
        let mut in_degree: HashMap<&String, usize> = HashMap::new();
        for node in &self.workflow.nodes {
            in_degree.insert(&node.id, 0);
        }

        for edge in &self.workflow.edges {
            *in_degree.get_mut(&edge.target).unwrap() += 1;
        }

        let mut queue: VecDeque<String> = VecDeque::new();
        for (node_id, &degree) in &in_degree {
            if degree == 0 {
                queue.push_back(node_id.to_string());
            }
        }

        let mut visited = 0;
        while let Some(node_id) = queue.pop_front() {
            visited += 1;
            for edge in &self.workflow.edges {
                if edge.source == *node_id {
                    let target_degree = in_degree.get_mut(&edge.target).unwrap();
                    *target_degree -= 1;
                    if *target_degree == 0 {
                        queue.push_back(edge.target.clone());
                    }
                }
            }
        }

        if visited != self.workflow.nodes.len() {
            return Err(WorkflowError::CircularDependency);
        }

        Ok(())
    }

    /// Get nodes with no dependencies (ready to execute)
    fn get_ready_nodes(&self, completed: &HashSet<String>) -> Vec<&WorkflowNode> {
        let mut ready = Vec::new();

        for node in &self.workflow.nodes {
            if completed.contains(&node.id) {
                continue;
            }

            // Check if all dependencies are satisfied
            let deps_satisfied = self.workflow.edges.iter()
                .filter(|e| &e.target == &node.id)
                .all(|e| completed.contains(&e.source));

            if deps_satisfied {
                ready.push(node);
            }
        }

        ready
    }

    /// Execute a single node (mock implementation - would integrate with actual agents)
    async fn execute_node(&self, node: &WorkflowNode) -> NodeExecutionResult {
        let started_at = Utc::now();
        let max_retries = node.retry_count.unwrap_or(0);
        let timeout = node.timeout_ms.unwrap_or(30000.0);

        for attempt in 0..=max_retries {
            let start = std::time::Instant::now();
            
            // Mock execution - in real implementation, this would:
            // 1. Call the appropriate agent/service
            // 2. Pass input from dependency nodes
            // 3. Handle timeouts and errors
            let result = self.mock_execute_node(node).await;
            
            let duration_ms = start.elapsed().as_millis() as u64;

            if result.is_ok() {
                return NodeExecutionResult {
                    node_id: node.id.clone(),
                    status: NodeStatus::Completed,
                    output: result.ok().map(|v| v.to_string()),
                    error: None,
                    duration_ms: duration_ms as f64,
                    retries: attempt,
                    started_at: Some(started_at.to_rfc3339()),
                    completed_at: Some(Utc::now().to_rfc3339()),
                };
            }

            if attempt == max_retries {
                return NodeExecutionResult {
                    node_id: node.id.clone(),
                    status: NodeStatus::Failed,
                    output: None,
                    error: result.err().map(|e| e.to_string()),
                    duration_ms: duration_ms as f64,
                    retries: attempt,
                    started_at: Some(started_at.to_rfc3339()),
                    completed_at: Some(Utc::now().to_rfc3339()),
                };
            }
        }

        unreachable!()
    }

    /// Mock node execution (replace with actual agent integration)
    async fn mock_execute_node(&self, node: &WorkflowNode) -> Result<String, WorkflowError> {
        // Simulate processing time
        let duration = node.timeout_ms.unwrap_or(10.0) as u64;
        tokio::time::sleep(tokio::time::Duration::from_millis(duration)).await;

        // Return mock output as JSON string
        Ok(format!(r#"{{
            "node_id": "{}",
            "node_type": "{}",
            "status": "success",
            "data": "{}"
        }}"#, node.id, node.node_type, node.data))
    }
}

// ============================================================================
// Main Workflow Executor (NAPI exported)
// ============================================================================

/// Execute a workflow with all nodes and edges
/// 
/// # Arguments
/// * `workflow` - Workflow definition with nodes and edges
/// 
/// # Returns
/// WorkflowExecutionResult with status and node results
/// 
/// # Example
/// ```
/// let result = execute_workflow(workflow_def).await?;
/// println!("Status: {:?}", result.status);
/// ```
pub async fn execute_workflow(workflow: WorkflowDefinition) -> WorkflowExecutionResult {
    let execution_id = Uuid::new_v4().to_string();
    let started_at = Utc::now().to_rfc3339();

    let executor = Executor::new(workflow.clone());

    // Validate workflow
    if let Err(e) = executor.validate() {
        return WorkflowExecutionResult {
            workflow_id: workflow.id,
            execution_id,
            status: WorkflowStatus::Failed,
            node_results: vec![],
            total_duration_ms: 0.0,
            started_at,
            completed_at: Some(Utc::now().to_rfc3339()),
            error: Some(e.to_string()),
        };
    }

    let completed = Arc::new(RwLock::new(HashSet::<String>::new()));
    let node_results = Arc::new(RwLock::new(Vec::<NodeExecutionResult>::new()));

    let start_time = std::time::Instant::now();

    // Execute nodes level by level (topological order)
    loop {
        let completed_guard = completed.read().await;
        if completed_guard.len() >= workflow.nodes.len() {
            break;
        }

        let ready_nodes = executor.get_ready_nodes(&completed_guard);
        if ready_nodes.is_empty() {
            break;
        }

        // Execute ready nodes in parallel
        let mut handles = vec![];
        for node in ready_nodes {
            let node_clone = node.clone();
            let workflow_clone = executor.workflow.clone();
            let handle = tokio::spawn(async move {
                let temp_executor = Executor::new(workflow_clone);
                temp_executor.execute_node(&node_clone).await
            });
            handles.push(handle);
        }

        drop(completed_guard);

        // Collect results
        for handle in handles {
            if let Ok(result) = handle.await {
                let node_id = result.node_id.clone();
                node_results.write().await.push(result.clone());
                if result.status == NodeStatus::Completed {
                    completed.write().await.insert(node_id);
                }
            }
        }
    }

    let total_duration_ms = start_time.elapsed().as_millis() as u64;
    let results_guard = node_results.read().await;
    
    let all_completed = results_guard.iter()
        .all(|r| r.status == NodeStatus::Completed);

    WorkflowExecutionResult {
        workflow_id: workflow.id,
        execution_id,
        status: if all_completed { 
            WorkflowStatus::Completed 
        } else { 
            WorkflowStatus::Failed 
        },
        node_results: results_guard.clone(),
        total_duration_ms: total_duration_ms as f64,
        started_at,
        completed_at: Some(Utc::now().to_rfc3339()),
        error: if !all_completed {
            Some("Some nodes failed during execution".to_string())
        } else {
            None
        },
    }
}

/// Validate workflow structure without executing
#[napi]
pub fn validate_workflow(workflow: WorkflowDefinition) -> Result<(), napi::Error> {
    let executor = Executor::new(workflow);
    executor.validate().map_err(|e| napi::Error::new(napi::Status::InvalidArg, e.to_string()))
}

/// Get execution plan (topological order) without running
#[napi]
pub fn get_execution_plan(workflow: WorkflowDefinition) -> Vec<String> {
    let executor = Executor::new(workflow);
    
    if executor.validate().is_err() {
        return vec![];
    }

    let mut order = Vec::new();
    let mut visited = HashSet::new();
    let mut stack = Vec::new();

    // Find nodes with no dependencies
    for node in &executor.workflow.nodes {
        let has_deps = executor.workflow.edges.iter()
            .any(|e| &e.target == &node.id);
        
        if !has_deps {
            stack.push(node.id.clone());
        }
    }

    while let Some(node_id) = stack.pop() {
        if visited.contains(&node_id) {
            continue;
        }
        visited.insert(node_id.clone());
        order.push(node_id.clone());

        // Add dependent nodes
        for edge in &executor.workflow.edges {
            if &edge.source == &node_id {
                stack.push(edge.target.clone());
            }
        }
    }

    order
}

/// Create a progress tracker for real-time monitoring
#[napi]
pub fn create_progress_tracker(
    execution_id: String,
    total_nodes: u32,
) -> WorkflowProgress {
    WorkflowProgress {
        execution_id,
        completed_nodes: 0,
        total_nodes,
        current_node: None,
        status: WorkflowStatus::Running,
        percent_complete: 0.0,
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_workflow() -> WorkflowDefinition {
        WorkflowDefinition {
            id: "test-workflow".to_string(),
            name: "Test Workflow".to_string(),
            nodes: vec![
                WorkflowNode {
                    id: "node1".to_string(),
                    node_type: "research".to_string(),
                    name: "Research".to_string(),
                    data: r#"{"query": "test"}"#.to_string(),
                    timeout_ms: Some(5000.0),
                    retry_count: Some(2),
                },
                WorkflowNode {
                    id: "node2".to_string(),
                    node_type: "content".to_string(),
                    name: "Content Generation".to_string(),
                    data: r#"{"format": "blog-post"}"#.to_string(),
                    timeout_ms: Some(10000.0),
                    retry_count: Some(1),
                },
                WorkflowNode {
                    id: "node3".to_string(),
                    node_type: "deploy".to_string(),
                    name: "Deploy".to_string(),
                    data: r#"{"platform": "vercel"}"#.to_string(),
                    timeout_ms: Some(15000.0),
                    retry_count: Some(0),
                },
            ],
            edges: vec![
                WorkflowEdge {
                    source: "node1".to_string(),
                    target: "node2".to_string(),
                    condition: None,
                },
                WorkflowEdge {
                    source: "node2".to_string(),
                    target: "node3".to_string(),
                    condition: None,
                },
            ],
            metadata: None,
        }
    }

    #[tokio::test]
    async fn test_workflow_validation() {
        let workflow = create_test_workflow();
        let result = validate_workflow(workflow);
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_workflow_execution() {
        let workflow = create_test_workflow();
        let result = execute_workflow(workflow).await;
        
        assert_eq!(result.status, WorkflowStatus::Completed);
        assert_eq!(result.node_results.len(), 3);
    }

    #[tokio::test]
    async fn test_execution_plan() {
        let workflow = create_test_workflow();
        let plan = get_execution_plan(workflow);
        
        assert_eq!(plan.len(), 3);
        assert_eq!(plan[0], "node1");
        assert!(plan.contains(&"node2".to_string()));
        assert!(plan.contains(&"node3".to_string()));
    }

    #[test]
    fn test_circular_dependency_detection() {
        let workflow = WorkflowDefinition {
            id: "circular".to_owned(),
            name: "Circular".to_owned(),
            nodes: vec![
                WorkflowNode {
                    id: "a".to_owned(),
                    node_type: "test".to_string(),
                    name: "A".to_owned(),
                    data: serde_json::Value::Object(serde_json::Map::new()),
                    timeout_ms: None,
                    retry_count: None,
                },
                WorkflowNode {
                    id: "b".to_owned(),
                    node_type: "test".to_string(),
                    name: "B".to_owned(),
                    data: serde_json::Value::Object(serde_json::Map::new()),
                    timeout_ms: None,
                    retry_count: None,
                },
            ],
            edges: vec![
                WorkflowEdge {
                    source: "a".to_owned(),
                    target: "b".to_owned(),
                    condition: None,
                },
                WorkflowEdge {
                    source: "b".to_string(),
                    target: "a".to_string(),
                    condition: None,
                },
            ],
            metadata: None,
        };

        let result = validate_workflow(workflow);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Circular dependency detected");
    }
}
