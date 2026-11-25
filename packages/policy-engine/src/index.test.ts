import { describe, expect, it } from 'vitest'

import {
  corePolicyRules,
  evaluatePolicy,
  policyEngineBoundaryNotes,
  type PolicyEvaluationInput,
} from './index'

function createPolicyInput(
  overrides: Partial<PolicyEvaluationInput> = {},
): PolicyEvaluationInput {
  return {
    subjectType: 'agent-task',
    title: 'Local planning task',
    description: 'Draft a local plan without execution.',
    requestedAction: 'draft-plan',
    permissionTier: 1,
    riskHints: ['low'],
    involvesSecrets: false,
    involvesProduction: false,
    involvesExternalIntegration: false,
    involvesRealUserData: false,
    involvesFinancialOrLegalOrHealthData: false,
    proposesCommitOrPush: false,
    proposesDeployment: false,
    proposesPublicClaim: false,
    humanApprovalPresent: false,
    ...overrides,
  }
}

function evaluateRuntimeInput(input: unknown) {
  return evaluatePolicy(input as PolicyEvaluationInput)
}

const invalidResult = {
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

const requiredFields = [
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

const booleanFields = [
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

describe('policy engine evaluation', () => {
  it('allows low-risk local planning actions', () => {
    const result = evaluatePolicy(createPolicyInput())

    expect(result.decision).toBe('allow')
    expect(result.riskLevel).toBe('low')
    expect(result.violations).toEqual([])
    expect(result.auditRequired).toBe(false)
  })

  it('requires approval for commit or push proposals', () => {
    const result = evaluatePolicy(createPolicyInput({
      subjectType: 'release-action',
      title: 'Create a commit',
      requestedAction: 'commit',
      permissionTier: 4,
      riskHints: ['medium'],
      proposesCommitOrPush: true,
    }))

    expect(result.decision).toBe('requires-approval')
    expect(result.approvalRequirements.map((requirement) => requirement.id)).toContain('commit-push-gate')
    expect(result.auditRequired).toBe(true)
  })

  it('blocks production deployment', () => {
    const result = evaluatePolicy(createPolicyInput({
      subjectType: 'release-action',
      title: 'Deploy to production',
      requestedAction: 'deploy',
      permissionTier: 5,
      riskHints: ['restricted'],
      involvesProduction: true,
      proposesDeployment: true,
    }))

    expect(result.decision).toBe('block')
    expect(result.violations.map((violation) => violation.id)).toContain('production-boundary')
    expect(result.riskLevel).toBe('restricted')
  })

  it('blocks secret handling', () => {
    const result = evaluatePolicy(createPolicyInput({
      title: 'Use an API key',
      requestedAction: 'use-secret',
      permissionTier: 5,
      involvesSecrets: true,
    }))

    expect(result.decision).toBe('block')
    expect(result.violations.map((violation) => violation.id)).toContain('secret-handling')
  })

  it('blocks external integrations', () => {
    const result = evaluatePolicy(createPolicyInput({
      subjectType: 'tool-action',
      title: 'Connect Slack',
      requestedAction: 'connect-external-service',
      permissionTier: 3,
      involvesExternalIntegration: true,
      riskHints: ['high'],
    }))

    expect(result.decision).toBe('block')
    expect(result.violations.map((violation) => violation.id)).toContain('external-integration-boundary')
  })

  it('blocks real user data', () => {
    const result = evaluatePolicy(createPolicyInput({
      title: 'Import customer records',
      requestedAction: 'read-user-data',
      permissionTier: 5,
      involvesRealUserData: true,
    }))

    expect(result.decision).toBe('block')
    expect(result.violations.map((violation) => violation.id)).toContain('real-user-data-boundary')
  })

  it('requires approval for public claims and blocks restricted public claims', () => {
    const publicClaim = evaluatePolicy(createPolicyInput({
      subjectType: 'release-action',
      title: 'Publish a product capability note',
      requestedAction: 'publish-public-claim',
      permissionTier: 4,
      riskHints: ['high'],
      proposesPublicClaim: true,
    }))
    const restrictedPublicClaim = evaluatePolicy(createPolicyInput({
      subjectType: 'release-action',
      title: 'Claim production safety',
      requestedAction: 'publish-restricted-public-claim',
      permissionTier: 5,
      riskHints: ['restricted'],
      proposesPublicClaim: true,
    }))

    expect(publicClaim.decision).toBe('requires-approval')
    expect(publicClaim.approvalRequirements.map((requirement) => requirement.id)).toContain('public-claim-gate')
    expect(restrictedPublicClaim.decision).toBe('block')
  })

  it('allows approval-gated categories after human approval when no restricted boundary is crossed', () => {
    const result = evaluatePolicy(createPolicyInput({
      subjectType: 'release-action',
      title: 'Approved local commit',
      requestedAction: 'commit',
      permissionTier: 4,
      riskHints: ['medium'],
      proposesCommitOrPush: true,
      humanApprovalPresent: true,
    }))

    expect(result.decision).toBe('allow')
    expect(result.approvalRequirements.every((requirement) => requirement.satisfied)).toBe(true)
  })

  it('keeps restricted actions blocked even when vague human approval is present', () => {
    const result = evaluatePolicy(createPolicyInput({
      title: 'Approved production deployment',
      requestedAction: 'deploy',
      permissionTier: 5,
      involvesProduction: true,
      proposesDeployment: true,
      humanApprovalPresent: true,
    }))

    expect(result.decision).toBe('block')
    expect(result.approvalRequirements.some((requirement) => !requirement.satisfied)).toBe(true)
  })

  it('requires audit when risk is medium, high, or restricted', () => {
    const mediumRisk = evaluatePolicy(createPolicyInput({
      requestedAction: 'local-code-change',
      permissionTier: 2,
      riskHints: ['medium'],
    }))
    const highRisk = evaluatePolicy(createPolicyInput({
      requestedAction: 'external-sandbox-draft',
      permissionTier: 3,
      riskHints: ['high'],
    }))
    const restrictedRisk = evaluatePolicy(createPolicyInput({
      requestedAction: 'use-secret',
      permissionTier: 5,
      involvesSecrets: true,
    }))

    expect(mediumRisk.auditRequired).toBe(true)
    expect(highRisk.auditRequired).toBe(true)
    expect(restrictedRisk.auditRequired).toBe(true)
  })

  it('always includes boundary notes', () => {
    const result = evaluatePolicy(createPolicyInput())
    const notes = result.boundaryNotes.join(' ')

    expect(notes).toContain('evaluates only')
    expect(notes).toContain('does not execute')
    expect(notes).toContain('Human authority')
  })
})

describe('policy engine runtime input boundary', () => {
  it.each([
    { tier: 0, approval: false, decision: 'allow', risk: 'low' },
    { tier: 1, approval: false, decision: 'allow', risk: 'low' },
    { tier: 2, approval: false, decision: 'requires-approval', risk: 'medium' },
    { tier: 2, approval: true, decision: 'allow', risk: 'medium' },
    { tier: 3, approval: false, decision: 'requires-approval', risk: 'high' },
    { tier: 3, approval: true, decision: 'allow', risk: 'high' },
    { tier: 4, approval: false, decision: 'requires-approval', risk: 'high' },
    { tier: 4, approval: true, decision: 'allow', risk: 'high' },
    { tier: 5, approval: false, decision: 'block', risk: 'restricted' },
    { tier: 5, approval: true, decision: 'block', risk: 'restricted' },
  ])('preserves tier $tier with approval=$approval', ({ tier, approval, decision, risk }) => {
    const result = evaluateRuntimeInput(createPolicyInput({
      permissionTier: tier as PolicyEvaluationInput['permissionTier'],
      humanApprovalPresent: approval,
    }))

    expect(result.decision).toBe(decision)
    expect(result.riskLevel).toBe(risk)
    expect(result.auditRequired).toBe(tier >= 2)

    if (tier === 5) {
      expect(result.violations.map(({ id }) => id)).toContain('restricted-tier-boundary')
    }
  })

  it.each(['agent-task', 'work-order', 'tool-action', 'release-action', 'memory-action'] as const)(
    'accepts subjectType %s', (subjectType) => {
      expect(evaluatePolicy(createPolicyInput({ subjectType })).decision).toBe('allow')
    },
  )

  it.each([
    { riskHints: [], decision: 'allow', risk: 'low' },
    { riskHints: ['low', 'low'], decision: 'allow', risk: 'low' },
    { riskHints: ['low', 'high', 'medium'], decision: 'requires-approval', risk: 'high' },
    { riskHints: ['medium', 'high', 'low'], decision: 'requires-approval', risk: 'high' },
  ])('preserves valid riskHints $riskHints', ({ riskHints, decision, risk }) => {
    const result = evaluateRuntimeInput(createPolicyInput({ riskHints: riskHints as PolicyEvaluationInput['riskHints'] }))
    expect(result.decision).toBe(decision)
    expect(result.riskLevel).toBe(risk)
  })

  it.each(['title', 'description', 'requestedAction'] as const)(
    'accepts empty and whitespace-only %s', (field) => {
      for (const value of ['', ' ']) {
        expect(evaluatePolicy(createPolicyInput({ [field]: value })).decision).toBe('allow')
      }
    },
  )

  it.each(['proposesCommitOrPush', 'proposesPublicClaim'] as const)(
    'keeps %s approval gated', (field) => {
      const pending = evaluatePolicy(createPolicyInput({ [field]: true }))
      const approved = evaluatePolicy(createPolicyInput({ [field]: true, humanApprovalPresent: true }))
      expect(pending.decision).toBe('requires-approval')
      expect(approved.decision).toBe('allow')
      expect(pending.riskLevel).toBe(field === 'proposesCommitOrPush' ? 'medium' : 'high')
    },
  )

  it.each([
    ['involvesProduction', 'production-boundary'],
    ['proposesDeployment', 'production-boundary'],
    ['involvesSecrets', 'secret-handling'],
    ['involvesExternalIntegration', 'external-integration-boundary'],
    ['involvesRealUserData', 'real-user-data-boundary'],
    ['involvesFinancialOrLegalOrHealthData', 'high-stakes-data-boundary'],
  ] as const)('keeps %s blocked despite approval', (field, violationId) => {
    const result = evaluatePolicy(createPolicyInput({ [field]: true, humanApprovalPresent: true }))
    expect(result.decision).toBe('block')
    expect(result.riskLevel).toBe('restricted')
    expect(result.violations.map(({ id }) => id)).toContain(violationId)
  })

  it('keeps restricted risk blocked with a low tier and approval', () => {
    const result = evaluatePolicy(createPolicyInput({
      permissionTier: 0,
      riskHints: ['low', 'restricted', 'high'],
      humanApprovalPresent: true,
    }))
    expect(result.decision).toBe('block')
    expect(result.violations.map(({ id }) => id)).toContain('restricted-tier-boundary')
  })

  it('keeps production and secret blocking ahead of an approved commit gate', () => {
    const result = evaluatePolicy(createPolicyInput({
      involvesProduction: true,
      involvesSecrets: true,
      proposesCommitOrPush: true,
      humanApprovalPresent: true,
    }))
    expect(result.decision).toBe('block')
    expect(result.violations.map(({ id }) => id)).toEqual(['secret-handling', 'production-boundary'])
    expect(result.approvalRequirements.find(({ id }) => id === 'commit-push-gate')?.satisfied).toBe(true)
    expect(result.approvalRequirements.find(({ id }) => id === 'production-gate')?.satisfied).toBe(false)
  })

  it.each([
    { requestedAction: 'draft-plan', expected: 'allow' },
    { requestedAction: 'deploy-production', expected: 'allow' },
    { requestedAction: 'unknown-action', expected: 'allow' },
  ])('keeps requestedAction=$requestedAction descriptive', ({ requestedAction, expected }) => {
    const result = evaluatePolicy(createPolicyInput({ requestedAction }))
    expect(result.decision).toBe(expected)
    expect(result.riskLevel).toBe('low')
  })

  it('uses structured deployment and production flags regardless of requestedAction text', () => {
    expect(evaluatePolicy(createPolicyInput({
      requestedAction: 'deploy-production',
      proposesDeployment: true,
    })).decision).toBe('block')
    expect(evaluatePolicy(createPolicyInput({
      requestedAction: 'draft-plan',
      involvesProduction: true,
    })).decision).toBe('block')
  })

  it.each([6, -1, '1', 1.5, NaN, Infinity, -Infinity, true, new Number(1)])(
    'rejects invalid permissionTier %s', (permissionTier) => {
      expect(evaluateRuntimeInput({ ...createPolicyInput(), permissionTier })).toEqual(invalidResult)
    },
  )

  it.each(['false', 1, 'true', 0, {}, new Boolean(false)])(
    'rejects invalid approval value %s on an approval gate', (humanApprovalPresent) => {
      expect(evaluateRuntimeInput({
        ...createPolicyInput(),
        proposesCommitOrPush: true,
        humanApprovalPresent,
      })).toEqual(invalidResult)
    },
  )

  it.each(booleanFields)('rejects nonboolean %s', (field) => {
    for (const value of ['false', 1, {}, new Boolean(false)]) {
      expect(evaluateRuntimeInput({ ...createPolicyInput(), [field]: value })).toEqual(invalidResult)
    }
  })

  it.each(requiredFields)('rejects missing, null, and undefined %s', (field) => {
    const missing: Record<string, unknown> = { ...createPolicyInput() }
    delete missing[field]

    for (const input of [
      missing,
      { ...createPolicyInput(), [field]: null },
      { ...createPolicyInput(), [field]: undefined },
    ]) {
      expect(evaluateRuntimeInput(input)).toEqual(invalidResult)
    }
  })

  it.each([null, undefined, [], 'input', 1, false, () => 'input'])(
    'rejects a non-object input %s', (input) => {
      expect(evaluateRuntimeInput(input)).toEqual(invalidResult)
    },
  )

  it.each(['title', 'description', 'requestedAction'] as const)(
    'rejects nonprimitive %s', (field) => {
      for (const value of [1, false, {}, [], new String('text')]) {
        expect(evaluateRuntimeInput({ ...createPolicyInput(), [field]: value })).toEqual(invalidResult)
      }
    },
  )

  it.each(['critical', 'LOW', '', 'constructor', 'toString', '__proto__'])(
    'rejects unknown risk hint %s', (riskHint) => {
      expect(evaluateRuntimeInput({ ...createPolicyInput(), riskHints: [riskHint] })).toEqual(invalidResult)
    },
  )

  it.each([
    { riskHints: ['low', 'critical'] },
    { riskHints: ['restricted', 'critical'] },
    { riskHints: ['critical', 'high'] },
    { riskHints: [null] },
    { riskHints: [undefined] },
    { riskHints: [1] },
    { riskHints: [false] },
    { riskHints: [{}] },
    { riskHints: [['high']] },
  ])('rejects mixed or malformed riskHints $riskHints', ({ riskHints }) => {
    expect(evaluateRuntimeInput({ ...createPolicyInput(), riskHints })).toEqual(invalidResult)
  })

  it.each(['low', {}, { 0: 'low', length: 1 }, new Set(['low'])])(
    'rejects non-array riskHints %s', (riskHints) => {
      expect(evaluateRuntimeInput({ ...createPolicyInput(), riskHints })).toEqual(invalidResult)
    },
  )

  it('rejects sparse risk arrays instead of skipping their empty slots', () => {
    const riskHints = new Array(2)
    riskHints[1] = 'high'
    expect(evaluateRuntimeInput({ ...createPolicyInput(), riskHints })).toEqual(invalidResult)
  })

  it.each(['unknown', 'AGENT-TASK', '', 'constructor', new String('agent-task')])(
    'rejects invalid subjectType %s', (subjectType) => {
      expect(evaluateRuntimeInput({ ...createPolicyInput(), subjectType })).toEqual(invalidResult)
    },
  )

  it('rejects an inherited required field', () => {
    const input: Record<string, unknown> = Object.assign(
      Object.create({ humanApprovalPresent: false }),
      createPolicyInput(),
    )
    delete input.humanApprovalPresent
    expect(evaluateRuntimeInput(input)).toEqual(invalidResult)
  })

  it('rejects an accessor required field without invoking it', () => {
    const input = createPolicyInput()
    let getterCalls = 0
    Object.defineProperty(input, 'humanApprovalPresent', {
      get() {
        getterCalls += 1
        return true
      },
    })
    expect(evaluateRuntimeInput(input)).toEqual(invalidResult)
    expect(getterCalls).toBe(0)
  })

  it('rejects a risk array accessor without invoking it', () => {
    const input = createPolicyInput()
    let getterCalls = 0
    Object.defineProperty(input.riskHints, '0', {
      get() {
        getterCalls += 1
        return 'low'
      },
    })
    expect(evaluateRuntimeInput(input)).toEqual(invalidResult)
    expect(getterCalls).toBe(0)
  })

  it('ignores unknown extra fields without reading their getters', () => {
    const input = createPolicyInput()
    Object.defineProperty(input, 'unknownExtra', {
      get() {
        throw new Error('unknown field was read')
      },
    })
    expect(evaluateRuntimeInput(input)).toEqual(evaluatePolicy(createPolicyInput()))
  })

  it('uses indexed risk values without invoking a caller iterator', () => {
    const input = createPolicyInput()
    Object.defineProperty(input.riskHints, Symbol.iterator, {
      value() {
        throw new Error('caller iterator was used')
      },
    })
    expect(evaluatePolicy(input).decision).toBe('allow')
  })

  it('accepts a frozen valid input without mutation', () => {
    const input = createPolicyInput()
    Object.freeze(input.riskHints)
    Object.freeze(input)
    expect(evaluatePolicy(input)).toEqual(evaluatePolicy(createPolicyInput()))
  })

  it('treats a descriptor trap failure as invalid without running policy rules', () => {
    const input = new Proxy(createPolicyInput(), {
      getOwnPropertyDescriptor() {
        throw new Error('descriptor unavailable')
      },
    })
    expect(evaluateRuntimeInput(input)).toEqual(invalidResult)
  })

  it('does not reflect invalid input or partially evaluate it', () => {
    const input = {
      ...createPolicyInput(),
      title: 'RAW_INVALID_TITLE_SENTINEL',
      requestedAction: 'RAW_INVALID_ACTION_SENTINEL',
      permissionTier: 6,
      involvesProduction: true,
      humanApprovalPresent: true,
    }
    const result = evaluateRuntimeInput(input)
    expect(result).toEqual(invalidResult)
    expect(JSON.stringify(result)).not.toContain('RAW_INVALID_')
    expect(result.violations.map(({ id }) => id)).toEqual(['invalid-policy-input'])
  })

  it('returns fresh invalid result structures on every evaluation', () => {
    const input = { ...createPolicyInput(), permissionTier: 6 }
    const first = evaluateRuntimeInput(input)
    const second = evaluateRuntimeInput(input)
    expect(first).toEqual(second)
    expect(first).not.toBe(second)
    expect(first.reasons).not.toBe(second.reasons)
    expect(first.violations).not.toBe(second.violations)
    expect(first.violations[0]).not.toBe(second.violations[0])
    expect(first.approvalRequirements).not.toBe(second.approvalRequirements)
    expect(first.boundaryNotes).not.toBe(second.boundaryNotes)
    first.violations[0].title = 'Changed by caller'
    first.reasons.push('Changed by caller')
    first.boundaryNotes.push('Changed by caller')
    expect(evaluateRuntimeInput(input)).toEqual(invalidResult)
  })

  it('returns the same result for identical valid input values', () => {
    const input = createPolicyInput({
      permissionTier: 4,
      riskHints: ['medium'],
      proposesCommitOrPush: true,
      humanApprovalPresent: true,
    })
    expect(evaluatePolicy(input)).toEqual(evaluatePolicy(input))
  })
})

describe('bounded generic policy evaluation', () => {
  const textLimits = [
    ['title', 256],
    ['description', 4096],
    ['requestedAction', 1024],
  ] as const

  describe.each(textLimits)('%s limit', (field, limit) => {
    it('uses the normal approval gate below and exactly at the limit', () => {
      const base = createPolicyInput({ proposesCommitOrPush: true })
      const expected = evaluatePolicy(base)
      expect(expected.decision).toBe('requires-approval')
      for (const length of [limit - 1, limit]) {
        expect(evaluatePolicy({ ...base, [field]: 'a'.repeat(length) })).toEqual(expected)
      }
    })

    it('rejects overflow without running policy rules', () => {
      const base = createPolicyInput({ involvesProduction: true, humanApprovalPresent: true })
      expect(evaluatePolicy({ ...base, [field]: 'a'.repeat(limit + 1) })).toEqual(invalidResult)
    })

    it('counts UTF-16 code units, including both halves of an astral character', () => {
      const exact = '💡'.repeat(limit / 2)
      expect(evaluatePolicy(createPolicyInput({ [field]: exact })).decision).toBe('allow')
      expect(evaluatePolicy(createPolicyInput({ [field]: exact + 'x' }))).toEqual(invalidResult)
      const decomposed = 'e\u0301'.repeat(limit / 2) + 'x'
      expect(evaluatePolicy(createPolicyInput({ [field]: decomposed }))).toEqual(invalidResult)
    })
  })

  it.each([31, 32])('uses every accepted hint in a list of %i entries', (length) => {
    const hints: PolicyEvaluationInput['riskHints'] = Array(length).fill('low')
    hints[length - 1] = 'high'
    const expected = evaluatePolicy(createPolicyInput({ riskHints: ['high'] }))
    expect(expected.decision).toBe('requires-approval')
    expect(evaluatePolicy(createPolicyInput({ riskHints: hints }))).toEqual(expected)
    expect(evaluatePolicy(createPolicyInput({ riskHints: hints.reverse() }))).toEqual(expected)
  })

  it('rejects oversized strings and collections before inspecting hint indices', () => {
    function checkEarlyRejection(length: number, overrides: Partial<PolicyEvaluationInput>) {
      const inspected: PropertyKey[] = []
      const hints = new Proxy<PolicyEvaluationInput['riskHints']>(Array(length).fill('low'), {
        ownKeys(target) {
          inspected.push('ownKeys')
          return Reflect.ownKeys(target)
        },
        getOwnPropertyDescriptor(target, property) {
          inspected.push(property)
          return Reflect.getOwnPropertyDescriptor(target, property)
        },
        get(target, property, receiver) {
          inspected.push(property)
          return Reflect.get(target, property, receiver)
        },
      })
      expect(evaluatePolicy(createPolicyInput({ ...overrides, riskHints: hints }))).toEqual(invalidResult)
      expect(inspected.filter((key) => key !== 'length')).toEqual([])
    }
    checkEarlyRejection(33, {})
    for (const [field, limit] of textLimits) {
      checkEarlyRejection(32, { [field]: 'a'.repeat(limit + 1) })
    }
  })

  it('rejects a malformed final hint after a restricted hint at the inclusive limit', () => {
    const hints: unknown[] = Array(32).fill('low')
    hints[0] = 'restricted'
    hints[31] = 'invalid'
    expect(evaluateRuntimeInput({ ...createPolicyInput(), riskHints: hints })).toEqual(invalidResult)
  })

  const diagnosticCases = [
    ['allow', {}, 'allow'],
    ['approval gate', { proposesCommitOrPush: true }, 'requires-approval'],
    ['restricted fact', { involvesProduction: true, humanApprovalPresent: true }, 'block'],
    ['invalid input', { riskHints: ['invalid'] }, 'block'],
  ] as const

  it.each(diagnosticCases)('omits free text and control characters for %s', (_, facts, decision) => {
    const base = { ...createPolicyInput(), ...facts }
    const output = evaluateRuntimeInput({
      ...base,
      title: 'TITLE_MARKER\r',
      description: 'DESCRIPTION_MARKER\n',
      requestedAction: 'ACTION_MARKER\u001b',
    })
    expect(output.decision).toBe(decision)
    expect(output).toEqual(evaluateRuntimeInput(base))
    const serialized = JSON.stringify(output)
    for (const token of ['TITLE_MARKER', 'DESCRIPTION_MARKER', 'ACTION_MARKER', '\\r', '\\n', '\\u001b']) {
      expect(serialized).not.toContain(token)
    }
  })

  it('exposes frozen, readonly metadata arrays and rules', () => {
    expect(Object.isFrozen(policyEngineBoundaryNotes)).toBe(true)
    expect(Object.isFrozen(corePolicyRules)).toBe(true)
    expect(() => {
      // @ts-expect-error Consumers cannot assign to a public boundary note.
      policyEngineBoundaryNotes[0] = policyEngineBoundaryNotes[0]
    }).toThrow(TypeError)
    expect(() => {
      // @ts-expect-error Consumers cannot replace an exported rule.
      corePolicyRules[0] = corePolicyRules[0]
    }).toThrow(TypeError)
    for (const rule of corePolicyRules) {
      expect(Object.isFrozen(rule)).toBe(true)
      expect(() => {
        // @ts-expect-error Individual exported rules also have readonly fields.
        rule.title = rule.title
      }).toThrow(TypeError)
    }
  })

  it('gives consumers mutable, independent results for valid policy blocks', () => {
    const input = createPolicyInput({ involvesSecrets: true })
    const result = evaluatePolicy(input)
    const original = structuredClone(result)
    result.decision = 'allow'
    result.reasons.push('consumer note')
    result.boundaryNotes.length = 0
    result.violations[0].title = 'consumer title'
    result.violations.length = 0
    result.approvalRequirements[0].satisfied = true
    result.approvalRequirements.length = 0
    expect(evaluatePolicy(input)).toEqual(original)
  })

  it('uses only required own fields on records with cyclic extras and compatible prototypes', () => {
    const extra: Record<string, unknown> = { humanApprovalPresent: true }
    extra.self = extra
    Object.defineProperty(extra, 'ignored', {
      enumerable: true,
      get() { throw new Error('nested extra was read') },
    })
    const base = createPolicyInput({ proposesCommitOrPush: true })
    const expected = evaluatePolicy(base)
    expect(expected.decision).toBe('requires-approval')
    for (const prototype of [null, { humanApprovalPresent: true }]) {
      const input = { ...base, extra }
      Object.setPrototypeOf(input, prototype)
      const observed = new Proxy(input, {
        ownKeys() { throw new Error('generic input was enumerated') },
      })
      expect(evaluatePolicy(observed)).toEqual(expected)
      input.title = 'a'.repeat(257)
      expect(evaluatePolicy(observed)).toEqual(invalidResult)
    }
  })
})
