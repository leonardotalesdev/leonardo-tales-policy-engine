export type PolicyDecision =
  | 'allow'
  | 'requires-approval'
  | 'block'

const riskLevels = ['low', 'medium', 'high', 'restricted'] as const
const subjectTypes = [
  'agent-task',
  'work-order',
  'tool-action',
  'release-action',
  'memory-action',
] as const
const permissionTiers = [0, 1, 2, 3, 4, 5] as const

export type PolicyRiskLevel = (typeof riskLevels)[number]
export type PolicySubjectType = (typeof subjectTypes)[number]
export type PolicyPermissionTier = (typeof permissionTiers)[number]

export type PolicyEvaluationInput = {
  subjectType: PolicySubjectType
  title: string
  description: string
  /** Free descriptive text; structured fields alone determine the policy classification. */
  requestedAction: string
  permissionTier: PolicyPermissionTier
  riskHints: PolicyRiskLevel[]
  involvesSecrets: boolean
  involvesProduction: boolean
  involvesExternalIntegration: boolean
  involvesRealUserData: boolean
  involvesFinancialOrLegalOrHealthData: boolean
  proposesCommitOrPush: boolean
  proposesDeployment: boolean
  proposesPublicClaim: boolean
  /** Caller assertion only; no human identity, signature, authority, or approval freshness is verified. */
  humanApprovalPresent: boolean
}

const requiredInputFields = [
  'subjectType',
  'title',
  'description',
  'requestedAction',
  'permissionTier',
  'riskHints',
  'involvesSecrets',
  'involvesProduction',
  'involvesExternalIntegration',
  'involvesRealUserData',
  'involvesFinancialOrLegalOrHealthData',
  'proposesCommitOrPush',
  'proposesDeployment',
  'proposesPublicClaim',
  'humanApprovalPresent',
] as const satisfies readonly (keyof PolicyEvaluationInput)[]

type BooleanInputField = {
  [Field in keyof PolicyEvaluationInput]: PolicyEvaluationInput[Field] extends boolean
    ? Field
    : never
}[keyof PolicyEvaluationInput]

const booleanInputFields = [
  'involvesSecrets',
  'involvesProduction',
  'involvesExternalIntegration',
  'involvesRealUserData',
  'involvesFinancialOrLegalOrHealthData',
  'proposesCommitOrPush',
  'proposesDeployment',
  'proposesPublicClaim',
  'humanApprovalPresent',
] as const satisfies readonly BooleanInputField[]

function isAllowedValue<Value extends string | number>(
  allowed: readonly Value[],
  value: unknown,
): value is Value {
  return allowed.some((candidate) => candidate === value)
}

function hasBooleanFields(
  values: Record<keyof PolicyEvaluationInput, unknown>,
): values is Record<keyof PolicyEvaluationInput, unknown> &
  Pick<PolicyEvaluationInput, BooleanInputField> {
  return booleanInputFields.every((field) => typeof values[field] === 'boolean')
}

function validatePolicyInput(input: unknown): PolicyEvaluationInput | null {
  try {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      return null
    }

    const values = {} as Record<keyof PolicyEvaluationInput, unknown>

    for (const field of requiredInputFields) {
      const descriptor = Object.getOwnPropertyDescriptor(input, field)

      if (!descriptor || !('value' in descriptor)) {
        return null
      }

      values[field] = descriptor.value
    }

    const { subjectType, title, description, requestedAction, permissionTier, riskHints } = values

    if (
      !isAllowedValue(subjectTypes, subjectType) ||
      typeof title !== 'string' ||
      typeof description !== 'string' ||
      typeof requestedAction !== 'string' ||
      !isAllowedValue(permissionTiers, permissionTier) ||
      !Array.isArray(riskHints) ||
      !hasBooleanFields(values)
    ) {
      return null
    }

    const validatedRiskHints: PolicyRiskLevel[] = []
    const length = Object.getOwnPropertyDescriptor(riskHints, 'length')?.value

    if (typeof length !== 'number' || !Number.isSafeInteger(length) || length < 0) {
      return null
    }

    for (let index = 0; index < length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(riskHints, String(index))

      if (!descriptor || !('value' in descriptor) || !isAllowedValue(riskLevels, descriptor.value)) {
        return null
      }

      validatedRiskHints.push(descriptor.value)
    }

    return {
      subjectType,
      title,
      description,
      requestedAction,
      permissionTier,
      riskHints: validatedRiskHints,
      involvesSecrets: values.involvesSecrets,
      involvesProduction: values.involvesProduction,
      involvesExternalIntegration: values.involvesExternalIntegration,
      involvesRealUserData: values.involvesRealUserData,
      involvesFinancialOrLegalOrHealthData: values.involvesFinancialOrLegalOrHealthData,
      proposesCommitOrPush: values.proposesCommitOrPush,
      proposesDeployment: values.proposesDeployment,
      proposesPublicClaim: values.proposesPublicClaim,
      humanApprovalPresent: values.humanApprovalPresent,
    }
  } catch {
    // A Proxy may throw while its own data properties are inspected.
    return null
  }
}

export type PolicyRule = {
  id: string
  title: string
  decision: PolicyDecision
  riskLevel: PolicyRiskLevel
  description: string
}

export type PolicyViolation = {
  id: string
  title: string
  riskLevel: PolicyRiskLevel
  description: string
  blocking: boolean
}

export type PolicyApprovalRequirement = {
  id: string
  title: string
  riskLevel: PolicyRiskLevel
  description: string
  satisfied: boolean
}

export type PolicyEvaluationResult = {
  decision: PolicyDecision
  riskLevel: PolicyRiskLevel
  reasons: string[]
  violations: PolicyViolation[]
  approvalRequirements: PolicyApprovalRequirement[]
  auditRequired: boolean
  boundaryNotes: string[]
}

const riskRank: Record<PolicyRiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  restricted: 3,
}

const policyRules: PolicyRule[] = [
  {
    id: 'local-low-risk-planning',
    title: 'Local low-risk planning',
    decision: 'allow',
    riskLevel: 'low',
    description: 'Low-risk local draft and planning actions may be allowed.',
  },
  {
    id: 'human-approval-gate',
    title: 'Human approval gate',
    decision: 'requires-approval',
    riskLevel: 'medium',
    description: 'Commit, push, public claim, medium-risk, high-risk, and high-tier actions require human approval.',
  },
  {
    id: 'restricted-boundary',
    title: 'Restricted boundary',
    decision: 'block',
    riskLevel: 'restricted',
    description: 'Production, secrets, external integrations, real user data, and high-stakes data remain blocked in v0.1.',
  },
]

export const corePolicyRules = policyRules

export const policyEngineBoundaryNotes = [
  'Policy Engine evaluates only. It does not execute actions.',
  'No autonomous execution is introduced.',
  'Human authority remains the final execution boundary.',
  'Production, secrets, real user data, high-stakes data, and external integrations remain closed in v0.1.',
  'Commit, push, deployment, release, and public claim actions remain human-controlled.',
]

function maxRiskLevel(levels: PolicyRiskLevel[]) {
  return levels.reduce<PolicyRiskLevel>((current, candidate) =>
    riskRank[candidate] > riskRank[current] ? candidate : current,
  'low')
}

function riskFromPermissionTier(tier: PolicyPermissionTier): PolicyRiskLevel {
  if (tier <= 1) {
    return 'low'
  }

  if (tier === 2) {
    return 'medium'
  }

  if (tier <= 4) {
    return 'high'
  }

  return 'restricted'
}

function addViolation(
  violations: PolicyViolation[],
  violation: PolicyViolation,
) {
  if (!violations.some((existing) => existing.id === violation.id)) {
    violations.push(violation)
  }
}

function addApprovalRequirement(
  approvalRequirements: PolicyApprovalRequirement[],
  approvalRequirement: PolicyApprovalRequirement,
) {
  if (!approvalRequirements.some((existing) => existing.id === approvalRequirement.id)) {
    approvalRequirements.push(approvalRequirement)
  }
}

function createRestrictedViolation(
  id: string,
  title: string,
  description: string,
): PolicyViolation {
  return {
    id,
    title,
    riskLevel: 'restricted',
    description,
    blocking: true,
  }
}

function createRestrictedApprovalRequirement(
  id: string,
  title: string,
  description: string,
): PolicyApprovalRequirement {
  return {
    id,
    title,
    riskLevel: 'restricted',
    description,
    satisfied: false,
  }
}

function invalidPolicyInputResult(): PolicyEvaluationResult {
  return {
    decision: 'block',
    riskLevel: 'restricted',
    reasons: ['Policy input validation failed; no action was authorized.'],
    violations: [{
      id: 'invalid-policy-input',
      title: 'Invalid policy input',
      riskLevel: 'restricted',
      description: 'Input does not satisfy the policy evaluation contract.',
      blocking: true,
    }],
    approvalRequirements: [],
    auditRequired: true,
    boundaryNotes: [
      ...policyEngineBoundaryNotes,
      'Invalid input was rejected before policy evaluation.',
    ],
  }
}

/** Evaluation only: an allow result does not execute an action or grant OS, publication, or deployment permission. */
export function evaluatePolicy(input: PolicyEvaluationInput): PolicyEvaluationResult {
  const validatedInput = validatePolicyInput(input)

  if (!validatedInput) {
    return invalidPolicyInputResult()
  }

  input = validatedInput
  const reasons: string[] = []
  const violations: PolicyViolation[] = []
  const approvalRequirements: PolicyApprovalRequirement[] = []
  const initialRisk = maxRiskLevel([
    riskFromPermissionTier(input.permissionTier),
    ...input.riskHints,
  ])
  let riskLevel = initialRisk

  if (input.involvesSecrets) {
    riskLevel = maxRiskLevel([riskLevel, 'restricted'])
    addViolation(
      violations,
      createRestrictedViolation(
        'secret-handling',
        'Secret handling is blocked',
        'Secrets, credentials, tokens, and .env values require a dedicated secret handling design and explicit written authorization outside v0.1.',
      ),
    )
    addApprovalRequirement(
      approvalRequirements,
      createRestrictedApprovalRequirement(
        'secret-gate',
        'Secret Gate',
        'Explicit written secret authorization is required, and Policy Engine v0.1 does not model or execute that authorization.',
      ),
    )
  }

  if (input.involvesProduction || input.proposesDeployment) {
    riskLevel = maxRiskLevel([riskLevel, 'restricted'])
    addViolation(
      violations,
      createRestrictedViolation(
        'production-boundary',
        'Production or deployment is blocked',
        'Production deployment, live infrastructure, and deployment actions are closed by default.',
      ),
    )
    addApprovalRequirement(
      approvalRequirements,
      createRestrictedApprovalRequirement(
        'production-gate',
        'Production Gate',
        'Production action requires explicit written authorization, security review, audit, and rollback design outside v0.1.',
      ),
    )
  }

  if (input.involvesExternalIntegration) {
    riskLevel = maxRiskLevel([riskLevel, 'restricted'])
    addViolation(
      violations,
      createRestrictedViolation(
        'external-integration-boundary',
        'External integration is blocked',
        'Connector, API, service, and external system integrations remain future scope until Tool Registry and Sandbox Simulation exist.',
      ),
    )
    addApprovalRequirement(
      approvalRequirements,
      createRestrictedApprovalRequirement(
        'external-integration-gate',
        'External Integration Gate',
        'External integration requires documented scope, sandbox boundary, tool registry metadata, and explicit human authorization.',
      ),
    )
  }

  if (input.involvesRealUserData) {
    riskLevel = maxRiskLevel([riskLevel, 'restricted'])
    addViolation(
      violations,
      createRestrictedViolation(
        'real-user-data-boundary',
        'Real user data is blocked',
        'Real user data must not be handled by the local-first v0.1 policy workflow.',
      ),
    )
  }

  if (input.involvesFinancialOrLegalOrHealthData) {
    riskLevel = maxRiskLevel([riskLevel, 'restricted'])
    addViolation(
      violations,
      createRestrictedViolation(
        'high-stakes-data-boundary',
        'Financial, legal, or health data is blocked',
        'High-stakes data and decisions require production-grade policy, security, legal, and human authority controls that do not exist in v0.1.',
      ),
    )
  }

  if (input.permissionTier === 5 || input.riskHints.includes('restricted')) {
    riskLevel = maxRiskLevel([riskLevel, 'restricted'])
    addViolation(
      violations,
      createRestrictedViolation(
        'restricted-tier-boundary',
        'Restricted tier is blocked',
        'Tier 5 or restricted-risk actions must not be treated as autonomous or locally approved by v0.1 policy evaluation.',
      ),
    )
  }

  if (input.proposesCommitOrPush) {
    riskLevel = maxRiskLevel([riskLevel, 'medium'])
    addApprovalRequirement(approvalRequirements, {
      id: 'commit-push-gate',
      title: 'Commit / Push Gate',
      riskLevel: 'medium',
      description: 'Commit and push proposals require explicit human approval before any manual terminal action.',
      satisfied: input.humanApprovalPresent,
    })
  }

  if (input.proposesPublicClaim && riskLevel !== 'restricted') {
    riskLevel = maxRiskLevel([riskLevel, 'high'])
    addApprovalRequirement(approvalRequirements, {
      id: 'public-claim-gate',
      title: 'Public Claim Gate',
      riskLevel: 'high',
      description: 'Public claims require a reality check and human approval before publication.',
      satisfied: input.humanApprovalPresent,
    })
  }

  if (input.permissionTier >= 3 && input.permissionTier <= 4) {
    riskLevel = maxRiskLevel([riskLevel, 'high'])
    addApprovalRequirement(approvalRequirements, {
      id: 'high-tier-gate',
      title: 'High Permission Tier Gate',
      riskLevel: 'high',
      description: `Tier ${input.permissionTier} proposals require human approval before action.`,
      satisfied: input.humanApprovalPresent,
    })
  }

  if (riskLevel === 'medium' || riskLevel === 'high') {
    addApprovalRequirement(approvalRequirements, {
      id: 'risk-review-gate',
      title: 'Risk Review Gate',
      riskLevel,
      description: `${riskLevel} risk proposals require human review before execution.`,
      satisfied: input.humanApprovalPresent,
    })
  }

  const hasBlockingViolations = violations.some((violation) => violation.blocking)
  const missingApprovals = approvalRequirements.filter(
    (requirement) => !requirement.satisfied,
  )
  const decision: PolicyDecision = hasBlockingViolations
    ? 'block'
    : missingApprovals.length > 0
      ? 'requires-approval'
      : 'allow'

  if (decision === 'allow') {
    reasons.push('The proposal stays inside the current local-only policy boundary.')
  }

  if (decision === 'requires-approval') {
    reasons.push('The proposal is not blocked, but one or more human approval gates are still required.')
  }

  if (decision === 'block') {
    reasons.push('The proposal crosses a closed or restricted Leonardo Tales Core boundary.')
  }

  reasons.push(
    `Subject ${input.subjectType} requested ${input.requestedAction}.`,
    `Policy Engine v0.1 returned ${decision}; it did not execute the proposal.`,
  )

  return {
    decision,
    riskLevel,
    reasons,
    violations,
    approvalRequirements,
    auditRequired: riskLevel !== 'low',
    boundaryNotes: [
      ...policyEngineBoundaryNotes,
      `Evaluated subject: ${input.title || 'Untitled proposal'}.`,
    ],
  }
}
