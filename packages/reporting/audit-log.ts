export type AuditActionType =
  | 'ai_analysis'
  | 'ai_test_plan_generated'
  | 'ai_test_generated'
  | 'ai_healing_suggestion'
  | 'human_review_approved'
  | 'human_review_rejected'
  | 'asset_promoted'
  | 'asset_deprecated'
  | 'production_guard_check'
  | 'unit_test_precheck'
  | 'external_system_access'
  | 'qc_request_analyzed'
  | 'qc_request_completed'
  | 'governance_violation';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditActionType;
  agent: string;
  projectKey?: string;
  detail: string;
  status: 'success' | 'warning' | 'error' | 'blocked';
  metadata?: Record<string, unknown>;
}

/**
 * Generate a unique audit entry ID.
 */
function generateAuditId(): string {
  return `audit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Create an audit log entry.
 *
 * Phase 1: Provides the audit entry structure. In future phases,
 * audit entries will be persisted to disk/DB for compliance.
 *
 * TODO: Implement persistent audit log storage in Phase 2+.
 */
export function createAuditEntry(
  action: AuditActionType,
  agent: string,
  detail: string,
  status: 'success' | 'warning' | 'error' | 'blocked' = 'success',
  projectKey?: string,
  metadata?: Record<string, unknown>
): AuditLogEntry {
  return {
    id: generateAuditId(),
    timestamp: new Date().toISOString(),
    action,
    agent,
    projectKey,
    detail,
    status,
    metadata,
  };
}

/**
 * Format an audit entry as a markdown table row.
 */
export function formatAuditEntry(entry: AuditLogEntry): string {
  return `| ${entry.timestamp} | ${entry.agent} | ${entry.action} | ${entry.status} | ${entry.detail} |`;
}

/**
 * Format an audit log header.
 */
export function formatAuditHeader(): string {
  return '| Timestamp | Agent | Action | Status | Detail |\n|-----------|-------|--------|--------|--------|';
}

/**
 * Full audit trail as stored in QC reports.
 */
export interface AuditTrail {
  entries: AuditLogEntry[];
  generatedAt: string;
  generatedBy: string;
}

export function createAuditTrail(generatedBy: string): AuditTrail {
  return {
    entries: [],
    generatedAt: new Date().toISOString(),
    generatedBy,
  };
}

export function addToAuditTrail(trail: AuditTrail, entry: AuditLogEntry): void {
  trail.entries.push(entry);
}
