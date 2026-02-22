-- CreateTable
CREATE TABLE "WorkflowCheckpoint" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "nodeLabel" TEXT,
    "contextSnapshot" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkflowCheckpoint_workflowId_idx" ON "WorkflowCheckpoint"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowCheckpoint_status_idx" ON "WorkflowCheckpoint"("status");

-- AddForeignKey
ALTER TABLE "WorkflowCheckpoint" ADD CONSTRAINT "WorkflowCheckpoint_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
