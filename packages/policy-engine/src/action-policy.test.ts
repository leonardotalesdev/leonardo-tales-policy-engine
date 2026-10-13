import { describe, expect, it } from 'vitest'
import {
  ACTION_PROFILE_VERSION,
  REGISTERED_ACTION_PROFILES,
  corePolicyRules,
  evaluateActionPolicy,
  evaluatePolicy,
  policyEngineBoundaryNotes,
} from './index.js'
import type {
  ActionApprovalContext,
  ActionExecutionState,
  ActionPolicyEvaluationInput,
  ActionPolicyEvaluationResult,
  ActionProfile,
  MeetingReconciliationFacts,
  PendingActionNotificationFacts,
  PolicyEvaluationInput,
} from './index.js'

const common = {
  profileVersion: ACTION_PROFILE_VERSION,
  environment: 'production' as const,
  runtimeEnabled: true,
  actionId: 'synthetic-action-001',
  revision: 1,
  normalizedPayloadHash: 'a'.repeat(64),
  targetId: 'synthetic-target-001',
  targetAuthorized: true,
  containsSecretMaterial: false,
  involvesFinancialOrLegalOrHealthData: false,
  realUserDataMinimized: true,
}
const approval: ActionApprovalContext = {
  approvalPresent: true,
  approverAuthorized: true,
  actionIdMatches: true,
  revisionMatches: true,
  payloadHashMatches: true,
  targetMatches: true,
  profileVersionMatches: true,
  approvalUnexpired: true,
}
const notification: PendingActionNotificationFacts = {
  pendingApprovalExists: true,
  notificationAuthorizationActive: true,
  recipientBound: true,
  messageDataMinimized: true,
}
const reconciliation: MeetingReconciliationFacts = {
  reconciliationRequired: true,
  linkedExecutionExists: true,
  executionState: 'execution_unknown',
  deterministicExternalIdPresent: true,
  linkedExecutionAuthorized: true,
  executionTargetMatches: true,
  externalIdBoundToAction: true,
  lookupScope: 'bound_execution_only',
}

function valid(profile: ActionProfile): ActionPolicyEvaluationInput {
  if (profile === 'telegram.notify_pending_action') {
    return { ...common, actionProfile: profile, notification: { ...notification } }
  }
  if (profile === 'calendar.create_meeting') {
    return { ...common, actionProfile: profile, approval: { ...approval } }
  }
  return { ...common, actionProfile: profile, reconciliation: { ...reconciliation } }
}
function evaluate(value: unknown) {
  return evaluateActionPolicy(value as ActionPolicyEvaluationInput)
}
function record(value: unknown) {
  return value as Record<string, unknown>
}
function detailKey(profile: ActionProfile) {
  return profile === 'telegram.notify_pending_action' ? 'notification'
    : profile === 'calendar.create_meeting' ? 'approval' : 'reconciliation'
}
function detail(input: ActionPolicyEvaluationInput) {
  return record(record(input)[detailKey(input.actionProfile)])
}
function expectBlock(result: ActionPolicyEvaluationResult, invalid = false) {
  expect(result.decision).toBe('block')
  expect(result.riskLevel).toBe('restricted')
  expect(result.auditRequired).toBe(true)
  expect(result.evaluationOnly).toBe(true)
  expect(result.violations.length).toBeGreaterThan(0)
  expect(result.violations.every((item) => item.blocking)).toBe(true)
  if (invalid) {
    expect(result.actionProfile).toBeNull()
    expect(result.profileVersion).toBe(ACTION_PROFILE_VERSION)
    expect(result.violations.map((item) => item.id)).toEqual(['invalid-action-policy-input'])
  }
}

const commonFields = [
  'profileVersion', 'actionProfile', 'environment', 'runtimeEnabled',
  'actionId', 'revision', 'normalizedPayloadHash', 'targetId', 'targetAuthorized',
  'containsSecretMaterial', 'involvesFinancialOrLegalOrHealthData', 'realUserDataMinimized',
]
const commonBooleans = [
  'runtimeEnabled', 'targetAuthorized', 'containsSecretMaterial',
  'involvesFinancialOrLegalOrHealthData', 'realUserDataMinimized',
]
const wrongBooleans = [0, 1, 'true', 'false', null, undefined, {}, []]
const invalidIds = [
  '', ' ', 'a b', 'a/b', 'a\\b', 'a@synthetic.invalid', 'a:1', '\n',
  '-a', 'a'.repeat(129), 1, null, undefined, {}, [], new String('synthetic'),
]
const invalidHashes = [
  '', 'a'.repeat(63), 'a'.repeat(65), 'A'.repeat(64), 'g'.repeat(64),
  'a'.repeat(63) + '\n', ' a'.repeat(32), 1, null, undefined, {}, [],
]
const nonObjects = [null, undefined, true, 1, 'synthetic', [], () => true, new Date(0), new Map()]
const globalBlocks = [
  ['environment', 'local', 'action-environment-blocked'],
  ['environment', 'preview', 'action-environment-blocked'],
  ['runtimeEnabled', false, 'action-runtime-disabled'],
  ['targetAuthorized', false, 'action-target-unauthorized'],
  ['containsSecretMaterial', true, 'action-secret-material'],
  ['involvesFinancialOrLegalOrHealthData', true, 'action-high-stakes-data'],
  ['realUserDataMinimized', false, 'action-data-not-minimized'],
] as const

describe('action profile public API', () => {
  it('registers exactly three immutable profiles and one contract version', () => {
    expect(ACTION_PROFILE_VERSION).toBe('tales-actions-v1')
    expect(REGISTERED_ACTION_PROFILES).toEqual([
      'telegram.notify_pending_action',
      'calendar.create_meeting',
      'calendar.read_meeting_for_reconciliation',
    ])
    expect(Object.isFrozen(REGISTERED_ACTION_PROFILES)).toBe(true)
  })

  it('cannot enable another profile by mutating the exported registry', () => {
    expect(() => (REGISTERED_ACTION_PROFILES as unknown as string[]).push('calendar.list')).toThrow()
    expectBlock(evaluate({ ...valid('calendar.create_meeting'), actionProfile: 'calendar.list' }), true)
  })

  it('keeps existing exports available', () => {
    expect(typeof evaluatePolicy).toBe('function')
    expect(corePolicyRules.length).toBeGreaterThan(0)
    expect(policyEngineBoundaryNotes.length).toBeGreaterThan(0)
  })
})

describe.each(REGISTERED_ACTION_PROFILES)('%s common gates and input robustness', (profile) => {
  it('returns high-risk, audited evaluation for valid runtime facts', () => {
    const output = evaluateActionPolicy(valid(profile))
    expect(output.decision).toBe('allow')
    expect(output.riskLevel).toBe('high')
    expect(output.auditRequired).toBe(true)
    expect(output.evaluationOnly).toBe(true)
    expect(output.profileVersion).toBe(ACTION_PROFILE_VERSION)
    expect(output.actionProfile).toBe(profile)
    expect(output.violations).toEqual([])
    expect(output.boundaryNotes.join(' ')).toContain('allow is not execution authority')
  })

  it.each(globalBlocks)('blocks global %s=%s', (field, value, id) => {
    const output = evaluate({ ...valid(profile), [field]: value })
    expectBlock(output)
    expect(output.actionProfile).toBe(profile)
    expect(output.violations.some((item) => item.id === id)).toBe(true)
  })

  it('reports all failing global boundaries in stable order', () => {
    const output = evaluate({
      ...valid(profile), runtimeEnabled: false, environment: 'local',
      targetAuthorized: false, containsSecretMaterial: true,
      involvesFinancialOrLegalOrHealthData: true, realUserDataMinimized: false,
    })
    expectBlock(output)
    expect(output.violations.map((item) => item.id)).toEqual([
      'action-runtime-disabled', 'action-environment-blocked', 'action-target-unauthorized',
      'action-secret-material', 'action-high-stakes-data', 'action-data-not-minimized',
    ])
    expect(output.approvalRequirements).toEqual([])
  })

  it.each(['calendar.list', 'calendar.freebusy', 'calendar.update', 'calendar.delete',
    'email.send', 'http.request', '*', 'calendar.*', '', 'attacker-profile-marker'])(
    'blocks unregistered profile %s', (actionProfile) => {
      const output = evaluate({ ...valid(profile), actionProfile })
      expectBlock(output, true)
      expect(JSON.stringify(output)).not.toContain(actionProfile || 'attacker-profile-marker')
    },
  )

  it.each(['tales-actions-v2', '', 'attacker-version-marker', 1, null, {}, []])(
    'blocks unknown or malformed profile version %#', (profileVersion) => {
      const output = evaluate({ ...valid(profile), profileVersion })
      expectBlock(output, true)
      expect(JSON.stringify(output)).not.toContain('attacker-version-marker')
    },
  )

  it.each(['staging', 'Production', '', true, 1, null, {}, []])(
    'blocks invalid environment %#', (environment) =>
      expectBlock(evaluate({ ...valid(profile), environment }), true),
  )

  describe.each(commonFields)('required own field %s', (field) => {
    it('rejects missing', () => {
      const input = record(valid(profile))
      delete input[field]
      expectBlock(evaluate(input), true)
    })
    it.each([null, undefined])('rejects %s', (value) => {
      expectBlock(evaluate({ ...valid(profile), [field]: value }), true)
    })
    it('rejects inherited instead of own', () => {
      const input = record(valid(profile))
      const inherited = { [field]: input[field] }
      delete input[field]
      Object.setPrototypeOf(input, inherited)
      expectBlock(evaluate(input), true)
    })
    it('rejects accessor without invoking it', () => {
      const input = valid(profile)
      let calls = 0
      Object.defineProperty(input, field, {
        enumerable: true,
        get() { calls += 1; throw new Error('attacker-getter-marker') },
      })
      expectBlock(evaluate(input), true)
      expect(calls).toBe(0)
    })
  })

  describe.each(commonBooleans)('boolean field %s', (field) => {
    it.each(wrongBooleans)('rejects non-boolean %#', (value) =>
      expectBlock(evaluate({ ...valid(profile), [field]: value }), true),
    )
  })

  describe.each(['actionId', 'targetId'])('opaque identifier %s', (field) => {
    it.each(invalidIds)('rejects invalid ID %#', (value) =>
      expectBlock(evaluate({ ...valid(profile), [field]: value }), true),
    )
    it.each(['x', 'synthetic_001.A-2', 'a'.repeat(128)])('accepts bounded alias %#', (value) => {
      expect(evaluate({ ...valid(profile), [field]: value }).decision).toBe('allow')
    })
  })

  it.each([0, -1, -0, 0.5, 1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1,
    '1', null, undefined, {}, []])('rejects invalid revision %#', (revision) =>
      expectBlock(evaluate({ ...valid(profile), revision }), true),
  )
  it.each([1, 2, Number.MAX_SAFE_INTEGER])('accepts positive safe integer revision %s', (revision) => {
    expect(evaluate({ ...valid(profile), revision }).decision).toBe('allow')
  })
  it.each(invalidHashes)('rejects invalid normalized SHA-256 hash %#', (normalizedPayloadHash) =>
    expectBlock(evaluate({ ...valid(profile), normalizedPayloadHash }), true),
  )
  it('accepts exact lowercase SHA-256 hexadecimal form', () => {
    expect(evaluate({ ...valid(profile), normalizedPayloadHash: '0123456789abcdef'.repeat(4) }).decision).toBe('allow')
  })

  it.each(nonObjects)('rejects malformed top-level value %#', (value) =>
    expectBlock(evaluate(value), true),
  )
  it.each(nonObjects)('rejects malformed profile facts %#', (value) =>
    expectBlock(evaluate({ ...valid(profile), [detailKey(profile)]: value }), true),
  )
  it('rejects absent profile facts', () => {
    const input = record(valid(profile))
    delete input[detailKey(profile)]
    expectBlock(evaluate(input), true)
  })
  it('rejects profile fact accessor without invoking it', () => {
    let calls = 0
    const input = valid(profile)
    Object.defineProperty(input, detailKey(profile), {
      get() { calls += 1; return detail(input) }, enumerable: true,
    })
    expectBlock(evaluate(input), true)
    expect(calls).toBe(0)
  })

  it.each(['rawPayload', 'credential', 'visitorEmail', 'humanApprovalPresent', '__proto__'])(
    'rejects extra field %s instead of accepting a payload or loose approval', (field) => {
      const input = valid(profile)
      Object.defineProperty(input, field, { value: 'attacker-extra-marker', enumerable: true })
      const output = evaluate(input)
      expectBlock(output, true)
      expect(JSON.stringify(output)).not.toContain('attacker-extra-marker')
    },
  )
  it('rejects an unknown nested property', () => {
    const input = valid(profile)
    detail(input).rawPayload = 'attacker-nested-marker'
    const output = evaluate(input)
    expectBlock(output, true)
    expect(JSON.stringify(output)).not.toContain('attacker-nested-marker')
  })
  it('rejects an unknown getter without invoking it', () => {
    let calls = 0
    const input = valid(profile)
    Object.defineProperty(input, 'extra', { get() { calls += 1; return true } })
    expectBlock(evaluate(input), true)
    expect(calls).toBe(0)
  })
  it('does not invoke caller iterators', () => {
    let calls = 0
    const input = valid(profile)
    Object.defineProperty(input, Symbol.iterator, { value: () => { calls += 1; throw new Error('iterator') } })
    expectBlock(evaluate(input), true)
    expect(calls).toBe(0)
  })
  it('rejects nested symbol fields without invoking their getter', () => {
    let calls = 0
    const input = valid(profile)
    Object.defineProperty(detail(input), Symbol.iterator, { get() { calls += 1; throw new Error('iterator') } })
    expectBlock(evaluate(input), true)
    expect(calls).toBe(0)
  })
  it('does not coerce attacker objects into primitives', () => {
    let calls = 0
    const input = valid(profile)
    const hostile = { [Symbol.toPrimitive]() { calls += 1; throw new Error('coercion') } }
    record(input).normalizedPayloadHash = hostile
    expectBlock(evaluate(input), true)
    expect(calls).toBe(0)
  })

  it.each(['ownKeys', 'getPrototypeOf', 'getOwnPropertyDescriptor'] as const)(
    'fails closed on throwing top-level proxy %s', (trap) => {
      const proxy = new Proxy(valid(profile), {
        [trap]: () => { throw new Error('attacker-proxy-marker') },
      })
      const output = evaluate(proxy)
      expectBlock(output, true)
      expect(JSON.stringify(output)).not.toContain('attacker-proxy-marker')
    },
  )
  it.each(['ownKeys', 'getPrototypeOf', 'getOwnPropertyDescriptor'] as const)(
    'fails closed on throwing nested proxy %s', (trap) => {
      const input = valid(profile)
      record(input)[detailKey(profile)] = new Proxy(detail(input), {
        [trap]: () => { throw new Error('attacker-nested-proxy-marker') },
      })
      expectBlock(evaluate(input), true)
    },
  )
  it('fails closed on revoked proxy', () => {
    const proxy = Proxy.revocable(valid(profile), {})
    proxy.revoke()
    expectBlock(evaluate(proxy.proxy), true)
  })
  it('does not read values through proxy get traps', () => {
    let reads = 0
    const input = valid(profile)
    const nested = new Proxy(detail(input), { get() { reads += 1; throw new Error('get') } })
    record(input)[detailKey(profile)] = nested
    const proxy = new Proxy(input, { get() { reads += 1; throw new Error('get') } })
    expect(evaluate(proxy).decision).toBe('allow')
    expect(reads).toBe(0)
  })

  it('accepts plain records with null prototypes', () => {
    const input = valid(profile)
    Object.setPrototypeOf(input, null)
    Object.setPrototypeOf(detail(input), null)
    expect(evaluate(input).decision).toBe('allow')
  })
  it('does not mutate a deeply frozen input', () => {
    const input = valid(profile)
    const before = JSON.stringify(input)
    Object.freeze(detail(input))
    Object.freeze(input)
    expect(evaluate(input).decision).toBe('allow')
    expect(JSON.stringify(input)).toBe(before)
  })
  it('returns deterministic results without shared mutable result arrays or violations', () => {
    const input = { ...valid(profile), targetAuthorized: false }
    const first = evaluate(input)
    const second = evaluate(input)
    expect(first).toEqual(second)
    first.reasons.push('mutation')
    first.boundaryNotes.length = 0
    first.violations[0].description = 'mutation'
    first.approvalRequirements.push({
      id: 'mutation', title: 'mutation', description: 'mutation', riskLevel: 'low', satisfied: true,
    })
    expect(evaluate(input)).toEqual(second)
  })
  it('does not retain or return the caller input, identifiers or hash', () => {
    const input = valid(profile)
    const before = evaluate(input)
    const serialized = JSON.stringify(before)
    expect(serialized).not.toContain(common.actionId)
    expect(serialized).not.toContain(common.targetId)
    expect(serialized).not.toContain(common.normalizedPayloadHash)
    input.targetAuthorized = false
    expect(before.decision).toBe('allow')
    expectBlock(evaluate(input))
  })
})

describe('profile-specific gates', () => {
  describe('pending action notification', () => {
    it.each(Object.keys(notification))('blocks false %s', (field) => {
      const input = valid('telegram.notify_pending_action')
      detail(input)[field] = false
      expectBlock(evaluate(input))
    })
    it('uses prior limited scope without recursive notification approval', () => {
      const output = evaluate(valid('telegram.notify_pending_action'))
      expect(output.decision).toBe('allow')
      expect(output.approvalRequirements).toEqual([])
      expect(output.auditRequired).toBe(true)
    })
  })

  describe('meeting creation', () => {
    it('requires absent action-specific approval', () => {
      const input = valid('calendar.create_meeting')
      for (const field of Object.keys(approval)) detail(input)[field] = false
      const output = evaluate(input)
      expect(output.decision).toBe('requires-approval')
      expect(output.riskLevel).toBe('high')
      expect(output.auditRequired).toBe(true)
      expect(output.violations).toEqual([])
      expect(output.approvalRequirements).toEqual([expect.objectContaining({
        id: 'meeting-action-approval', satisfied: false, riskLevel: 'high',
      })])
    })
    it('requires approval even if absent approval has other positive binding assertions', () => {
      const input = valid('calendar.create_meeting')
      detail(input).approvalPresent = false
      expect(evaluate(input).decision).toBe('requires-approval')
    })
    it('allows only exact approval with every binding true', () => {
      const output = evaluate(valid('calendar.create_meeting'))
      expect(output.decision).toBe('allow')
      expect(output.approvalRequirements[0].satisfied).toBe(true)
      expect(output.auditRequired).toBe(true)
    })
    it.each(Object.keys(approval).filter((field) => field !== 'approvalPresent'))(
      'blocks claimed but invalid approval %s', (field) => {
        const input = valid('calendar.create_meeting')
        detail(input)[field] = false
        const output = evaluate(input)
        expectBlock(output)
        expect(output.violations.map((item) => item.id)).toContain('meeting-approval-' + field)
        expect(output.approvalRequirements[0].satisfied).toBe(false)
      },
    )
    it('never downgrades a global block to requires-approval', () => {
      const input = valid('calendar.create_meeting')
      detail(input).approvalPresent = false
      input.containsSecretMaterial = true
      expectBlock(evaluate(input))
    })
    it('returns a fresh approval gate per evaluation', () => {
      const input = valid('calendar.create_meeting')
      const output = evaluate(input)
      output.approvalRequirements[0].satisfied = false
      expect(evaluate(input).approvalRequirements[0].satisfied).toBe(true)
    })
  })

  describe('execution reconciliation', () => {
    it.each(Object.keys(reconciliation).filter((field) => typeof record(reconciliation)[field] === 'boolean'))(
      'blocks false %s', (field) => {
        const input = valid('calendar.read_meeting_for_reconciliation')
        detail(input)[field] = false
        expectBlock(evaluate(input))
      },
    )
    it.each<ActionExecutionState>([
      'draft', 'pending_approval', 'approved', 'executing', 'executed',
      'blocked', 'rejected', 'withdrawn', 'expired',
    ])('blocks known state %s other than execution_unknown', (executionState) => {
      const input = valid('calendar.read_meeting_for_reconciliation')
      detail(input).executionState = executionState
      expectBlock(evaluate(input))
    })
    it.each(['unknown', 'EXECUTION_UNKNOWN', '', true, 1, null, undefined, {}, []])(
      'blocks malformed or unknown execution state %#', (value) => {
        const input = valid('calendar.read_meeting_for_reconciliation')
        detail(input).executionState = value
        expectBlock(evaluate(input), true)
      },
    )
    it.each(['calendar_browsing', 'availability_search', 'unrelated_event_lookup',
      'user_selected_event', 'arbitrary_calendar_read', '', 1, null, undefined, {}, []])(
      'blocks broadened or invalid lookup scope %#', (scope) => {
        const input = valid('calendar.read_meeting_for_reconciliation')
        detail(input).lookupScope = scope
        expectBlock(evaluate(input), true)
      },
    )
    it('requires no new human approval for the exact previously authorized execution', () => {
      const output = evaluate(valid('calendar.read_meeting_for_reconciliation'))
      expect(output.decision).toBe('allow')
      expect(output.approvalRequirements).toEqual([])
      expect(output.auditRequired).toBe(true)
    })
  })
})

describe.each(REGISTERED_ACTION_PROFILES)('%s strict profile fact records', (profile) => {
  const sample = detail(valid(profile))
  describe.each(Object.keys(sample))('required nested field %s', (field) => {
    it('rejects missing field', () => {
      const input = valid(profile)
      delete detail(input)[field]
      expectBlock(evaluate(input), true)
    })
    it.each([null, undefined])('rejects %s', (value) => {
      const input = valid(profile)
      detail(input)[field] = value
      expectBlock(evaluate(input), true)
    })
    it('rejects inherited nested field', () => {
      const input = valid(profile)
      const nested = detail(input)
      const inherited = { [field]: nested[field] }
      delete nested[field]
      Object.setPrototypeOf(nested, inherited)
      expectBlock(evaluate(input), true)
    })
    it('rejects nested accessor without invocation', () => {
      let calls = 0
      const input = valid(profile)
      Object.defineProperty(detail(input), field, {
        get() { calls += 1; throw new Error('nested-getter') }, enumerable: true,
      })
      expectBlock(evaluate(input), true)
      expect(calls).toBe(0)
    })
    if (typeof sample[field] === 'boolean') {
      it.each(wrongBooleans)('rejects non-boolean fact %#', (value) => {
        const input = valid(profile)
        detail(input)[field] = value
        expectBlock(evaluate(input), true)
      })
    }
  })
})

describe('generic v0.1 boundary regressions', () => {
  const base: PolicyEvaluationInput = {
    subjectType: 'tool-action',
    title: 'Synthetic regression',
    description: 'Synthetic generic evaluation',
    requestedAction: 'synthetic-test',
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
    humanApprovalPresent: true,
  }
  it.each([
    'involvesProduction', 'proposesDeployment', 'involvesSecrets',
    'involvesExternalIntegration', 'involvesRealUserData', 'involvesFinancialOrLegalOrHealthData',
  ] as const)('still blocks %s despite approval', (field) => {
    const output = evaluatePolicy({ ...base, [field]: true })
    expect(output.decision).toBe('block')
    expect(output.riskLevel).toBe('restricted')
  })
  it('still blocks restricted tier despite approval', () => {
    expect(evaluatePolicy({ ...base, permissionTier: 5 }).decision).toBe('block')
  })
  it('still blocks restricted risk hints despite approval', () => {
    expect(evaluatePolicy({ ...base, riskHints: ['restricted'] }).decision).toBe('block')
  })
  it('cannot route generic external actions through new profile fields', () => {
    const input = { ...base, involvesExternalIntegration: true, ...valid('calendar.create_meeting') }
    expect(evaluatePolicy(input).decision).toBe('block')
  })
})
