import type {
  PolicyApprovalRequirement,
  PolicyEvaluationResult,
  PolicyViolation,
} from './index.js'

/** Contract version only; independent of the unreleased package version. */
export const ACTION_PROFILE_VERSION = 'tales-actions-v1' as const

export const REGISTERED_ACTION_PROFILES = Object.freeze([
  'telegram.notify_pending_action',
  'calendar.create_meeting',
  'calendar.read_meeting_for_reconciliation',
] as const)

export type ActionProfile = (typeof REGISTERED_ACTION_PROFILES)[number]
export type ActionEnvironment = 'local' | 'preview' | 'production'
export type ActionExecutionState =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'executing'
  | 'executed'
  | 'blocked'
  | 'rejected'
  | 'withdrawn'
  | 'expired'
  | 'execution_unknown'

/**
 * Trusted runtime assertions, not facts the model or a visitor may supply.
 * IDs are opaque runtime aliases, never email addresses, Google sub values,
 * credentials, visitor details, or the action payload itself.
 */
export type ActionPolicyBaseInput = {
  profileVersion: typeof ACTION_PROFILE_VERSION
  environment: ActionEnvironment
  runtimeEnabled: boolean
  actionId: string
  revision: number
  normalizedPayloadHash: string
  targetId: string
  targetAuthorized: boolean
  /** Secret material in the action/policy payload; not managed executor credentials. */
  containsSecretMaterial: boolean
  involvesFinancialOrLegalOrHealthData: boolean
  realUserDataMinimized: boolean
}

/** Runtime verifies identity, freshness and exact binding before supplying these facts. */
export type ActionApprovalContext = {
  approvalPresent: boolean
  approverAuthorized: boolean
  actionIdMatches: boolean
  revisionMatches: boolean
  payloadHashMatches: boolean
  targetMatches: boolean
  profileVersionMatches: boolean
  approvalUnexpired: boolean
}

export type PendingActionNotificationFacts = {
  pendingApprovalExists: boolean
  /** A separately human-approved, limited notification scope is active. */
  notificationAuthorizationActive: boolean
  /** Recipient is runtime-bound; the model must not choose it. */
  recipientBound: boolean
  messageDataMinimized: boolean
}

export type MeetingReconciliationFacts = {
  reconciliationRequired: boolean
  linkedExecutionExists: boolean
  executionState: ActionExecutionState
  deterministicExternalIdPresent: boolean
  /** The linked execution had valid authorization before the ambiguous result. */
  linkedExecutionAuthorized: boolean
  executionTargetMatches: boolean
  /** The runtime-derived external ID belongs to this action, not a supplied event. */
  externalIdBoundToAction: boolean
  lookupScope: 'bound_execution_only'
}

export type ActionPolicyEvaluationInput = ActionPolicyBaseInput & (
  | {
    actionProfile: 'telegram.notify_pending_action'
    notification: PendingActionNotificationFacts
  }
  | {
    actionProfile: 'calendar.create_meeting'
    approval: ActionApprovalContext
  }
  | {
    actionProfile: 'calendar.read_meeting_for_reconciliation'
    reconciliation: MeetingReconciliationFacts
  }
)

export type ActionPolicyEvaluationResult = PolicyEvaluationResult & {
  /** Canonical evaluated contract, never a reflected unknown input version. */
  profileVersion: typeof ACTION_PROFILE_VERSION
  /** Null when input fails validation; arbitrary input strings are never echoed. */
  actionProfile: ActionProfile | null
  /** An allow result does not grant execution authority or perform any action. */
  evaluationOnly: true
}

const commonFields = [
  'profileVersion', 'actionProfile', 'environment', 'runtimeEnabled',
  'actionId', 'revision', 'normalizedPayloadHash', 'targetId',
  'targetAuthorized', 'containsSecretMaterial',
  'involvesFinancialOrLegalOrHealthData', 'realUserDataMinimized',
] as const

const commonBooleans = [
  'runtimeEnabled', 'targetAuthorized', 'containsSecretMaterial',
  'involvesFinancialOrLegalOrHealthData', 'realUserDataMinimized',
] as const

const approvalFields = [
  'approvalPresent', 'approverAuthorized', 'actionIdMatches', 'revisionMatches',
  'payloadHashMatches', 'targetMatches', 'profileVersionMatches', 'approvalUnexpired',
] as const satisfies readonly (keyof ActionApprovalContext)[]

const notificationFields = [
  'pendingApprovalExists', 'notificationAuthorizationActive',
  'recipientBound', 'messageDataMinimized',
] as const satisfies readonly (keyof PendingActionNotificationFacts)[]

const reconciliationBooleans = [
  'reconciliationRequired', 'linkedExecutionExists', 'deterministicExternalIdPresent',
  'linkedExecutionAuthorized', 'executionTargetMatches', 'externalIdBoundToAction',
] as const

const reconciliationFields = [
  ...reconciliationBooleans, 'executionState', 'lookupScope',
] as const satisfies readonly (keyof MeetingReconciliationFacts)[]

const executionStates: readonly ActionExecutionState[] = [
  'draft', 'pending_approval', 'approved', 'executing', 'executed',
  'blocked', 'rejected', 'withdrawn', 'expired', 'execution_unknown',
]

const boundaryNotes = [
  'Evaluation only: allow is not execution authority and performs no external action.',
  'Only the three exact registered profiles in tales-actions-v1 are evaluated.',
  'The trusted runtime owns authentication, approval verification, OAuth, credentials, idempotency, state transitions, execution and audit persistence.',
  'The model may propose an action; it must not supply trusted policy facts or select execution targets.',
  'Managed credentials stay outside this payload; this evaluator does not read or authorize secret handling.',
  'Generic evaluatePolicy v0.1 boundaries remain unchanged; no arbitrary external integration is opened.',
] as const

/**
 * Copy own data properties, without property reads, accessors or caller iterators.
 * Reject extra/symbol fields and non-plain objects. Proxy inspection traps cannot
 * be avoided in JavaScript; the outer validator catches inspection failures.
 */
function readRecord(input: unknown): Record<string, unknown> | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return null
  }
  const prototype = Object.getPrototypeOf(input)
  if (prototype !== Object.prototype && prototype !== null) {
    return null
  }
  const values: Record<string, unknown> = Object.create(null)
  for (const key of Reflect.ownKeys(input)) {
    if (typeof key !== 'string') {
      return null
    }
    const descriptor = Object.getOwnPropertyDescriptor(input, key)
    if (!descriptor || !('value' in descriptor)) {
      return null
    }
    values[key] = descriptor.value
  }
  return values
}

function hasExactFields(values: Record<string, unknown>, fields: readonly string[]) {
  const keys = Object.keys(values)
  return keys.length === fields.length && fields.every(
    (field) => Object.prototype.hasOwnProperty.call(values, field),
  )
}

function hasBooleans(values: Record<string, unknown>, fields: readonly string[]) {
  return fields.every((field) => typeof values[field] === 'boolean')
}

function isOpaqueId(value: unknown): value is string {
  return typeof value === 'string' &&
    value.length >= 1 && value.length <= 128 &&
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)
}

function validateInput(input: unknown): ActionPolicyEvaluationInput | null {
  try {
    const values = readRecord(input)
    if (!values ||
      values.profileVersion !== ACTION_PROFILE_VERSION ||
      !REGISTERED_ACTION_PROFILES.some((profile) => profile === values.actionProfile) ||
      !['local', 'preview', 'production'].some((env) => env === values.environment) ||
      !hasBooleans(values, commonBooleans) ||
      !isOpaqueId(values.actionId) || !isOpaqueId(values.targetId) ||
      typeof values.revision !== 'number' ||
      !Number.isSafeInteger(values.revision) || values.revision < 1 ||
      typeof values.normalizedPayloadHash !== 'string' ||
      values.normalizedPayloadHash.length !== 64 ||
      !/^[a-f0-9]{64}$/.test(values.normalizedPayloadHash)
    ) {
      return null
    }

    let detailField: 'notification' | 'approval' | 'reconciliation'
    let detail: Record<string, unknown> | null
    if (values.actionProfile === 'telegram.notify_pending_action') {
      detailField = 'notification'
      detail = readRecord(values.notification)
      if (!detail || !hasExactFields(detail, notificationFields) ||
        !hasBooleans(detail, notificationFields)) {
        return null
      }
    } else if (values.actionProfile === 'calendar.create_meeting') {
      detailField = 'approval'
      detail = readRecord(values.approval)
      if (!detail || !hasExactFields(detail, approvalFields) ||
        !hasBooleans(detail, approvalFields)) {
        return null
      }
    } else {
      detailField = 'reconciliation'
      detail = readRecord(values.reconciliation)
      if (!detail || !hasExactFields(detail, reconciliationFields) ||
        !hasBooleans(detail, reconciliationBooleans) ||
        !executionStates.some((state) => state === detail?.executionState) ||
        detail.lookupScope !== 'bound_execution_only') {
        return null
      }
    }
    if (!hasExactFields(values, [...commonFields, detailField])) {
      return null
    }
    // All scalars and the sole detail record have been validated and copied.
    return { ...values, [detailField]: detail } as ActionPolicyEvaluationInput
  } catch {
    return null
  }
}

function violation(id: string, description: string): PolicyViolation {
  return { id, title: description, description, riskLevel: 'restricted', blocking: true }
}

function result(
  actionProfile: ActionProfile | null,
  decision: ActionPolicyEvaluationResult['decision'],
  reasons: string[],
  violations: PolicyViolation[] = [],
  approvalRequirements: PolicyApprovalRequirement[] = [],
): ActionPolicyEvaluationResult {
  return {
    decision,
    riskLevel: decision === 'block' ? 'restricted' : 'high',
    reasons,
    violations,
    approvalRequirements,
    auditRequired: true,
    profileVersion: ACTION_PROFILE_VERSION,
    actionProfile,
    evaluationOnly: true,
    boundaryNotes: [...boundaryNotes],
  }
}

/**
 * Pure evaluation of trusted runtime assertions. It cannot authenticate an
 * approver, verify a signature, read credentials or execute an external tool.
 * Re-evaluate current facts immediately before the runtime's authorized executor.
 */
export function evaluateActionPolicy(input: ActionPolicyEvaluationInput): ActionPolicyEvaluationResult {
  const facts = validateInput(input)
  if (!facts) {
    return result(null, 'block', ['Action policy input validation failed.'], [
      violation('invalid-action-policy-input', 'Input does not satisfy the exact action policy contract.'),
    ])
  }

  const violations: PolicyViolation[] = []
  const check = (passed: boolean, id: string, description: string) => {
    if (!passed) {
      violations.push(violation(id, description))
    }
  }
  check(facts.runtimeEnabled, 'action-runtime-disabled', 'The controlled action runtime is disabled.')
  check(facts.environment === 'production', 'action-environment-blocked', 'Real external action profiles require production context.')
  check(facts.targetAuthorized, 'action-target-unauthorized', 'The runtime target is not authorized.')
  check(!facts.containsSecretMaterial, 'action-secret-material', 'Secret material in the evaluated payload is blocked.')
  check(!facts.involvesFinancialOrLegalOrHealthData, 'action-high-stakes-data', 'Financial, legal or health data is blocked.')
  check(facts.realUserDataMinimized, 'action-data-not-minimized', 'Real user data minimization is required.')
  if (violations.length > 0) {
    return result(facts.actionProfile, 'block', ['One or more global action boundaries failed.'], violations)
  }

  if (facts.actionProfile === 'telegram.notify_pending_action') {
    for (const field of notificationFields) {
      check(facts.notification[field], 'notification-' + field, 'Required notification fact failed: ' + field + '.')
    }
    return result(facts.actionProfile, violations.length ? 'block' : 'allow', [
      violations.length
        ? 'Notification scope or pending-action facts failed.'
        : 'The limited pre-authorized pending-action notification facts pass; no new per-notification approval is required.',
    ], violations)
  }

  if (facts.actionProfile === 'calendar.create_meeting') {
    const approvalGate: PolicyApprovalRequirement = {
      id: 'meeting-action-approval',
      title: 'Exact meeting action approval',
      description: 'Runtime-verified authorized, unexpired approval must bind the action ID, revision, payload hash, target and profile version.',
      riskLevel: 'high',
      satisfied: false,
    }
    if (!facts.approval.approvalPresent) {
      return result(facts.actionProfile, 'requires-approval', [
        'Verified action-specific human approval is absent.',
      ], [], [approvalGate])
    }
    for (const field of approvalFields) {
      check(facts.approval[field], 'meeting-approval-' + field, 'Claimed approval binding failed: ' + field + '.')
    }
    approvalGate.satisfied = violations.length === 0
    return result(facts.actionProfile, violations.length ? 'block' : 'allow', [
      violations.length
        ? 'A claimed approval is invalid, mismatched or expired; it cannot be treated as absent approval.'
        : 'All runtime-verified exact meeting approval facts pass.',
    ], violations, [approvalGate])
  }

  for (const field of reconciliationBooleans) {
    check(facts.reconciliation[field], 'reconciliation-' + field, 'Required reconciliation fact failed: ' + field + '.')
  }
  check(
    facts.reconciliation.executionState === 'execution_unknown',
    'reconciliation-execution-state',
    'Reconciliation is restricted to execution_unknown.',
  )
  return result(facts.actionProfile, violations.length ? 'block' : 'allow', [
    violations.length
      ? 'The narrowly bound, previously authorized execution reconciliation facts failed.'
      : 'Only the bound deterministic event for a previously authorized ambiguous execution may be reconciled; no new per-action approval is required.',
  ], violations)
}
