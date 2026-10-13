# @leonardo-tales/policy-engine

An experimental, narrow helper for evaluating proposed actions. It returns a policy decision without side effects or action execution. This package has no public registry release. This package is maintained in the standalone policy-engine source repository.

## Evaluate a proposal

```js
import { evaluatePolicy } from '@leonardo-tales/policy-engine'

const input = {
  subjectType: 'agent-task',
  title: 'Draft a local plan',
  description: 'Prepare a synthetic planning note.',
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
}

const result = evaluatePolicy(input)
console.log(result.decision) // 'allow'
```

Decisions are `allow`, `requires-approval`, or `block`. For example, setting `proposesCommitOrPush: true` without approval returns `requires-approval`; setting `involvesSecrets: true` returns `block` even when `humanApprovalPresent` is true. Invalid runtime input, such as `null`, returns `block` with risk level `restricted` and violation `invalid-policy-input`.

`requestedAction` is free descriptive text. The engine does not classify it with keywords, natural language, or a model; the structured fields determine the policy result. `humanApprovalPresent` is a caller-provided assertion. The engine does not verify a human identity, signature, authority, or approval freshness.

An `allow` result grants no operating-system, tool, deployment, or publication authority. The package performs no action or tool execution, provides no autonomous high-impact authority, and is not production- or security-certified. It must not be used as an approval system by itself.

## Local development and compatibility

In this standalone workspace, run `pnpm install --frozen-lockfile`, then `pnpm --filter @leonardo-tales/policy-engine test`, `pnpm --filter @leonardo-tales/policy-engine typecheck`, and `pnpm --filter @leonardo-tales/policy-engine build`. Consumers need the build output because the package exports `dist/index.js` and `dist/index.d.ts`.

The local proof environment is Node.js 22.22.2. Broader Node version support has not been verified or claimed.

## License and reporting boundary

Apache License 2.0 applies to this narrow policy-engine package distribution. The private Leonardo Tales Core repository and its history are outside that code-license scope. Hakan Demirci's rights-controlled original contributions to root governance and community documentation in the initial 25-file repository source snapshot are licensed under CC BY 4.0 within the separate scope of the [repository license map](https://github.com/leonardotalesdev/leonardo-tales-policy-engine/blob/main/LICENSE.md). Leonardo Tales trademarks and logos are not licensed by the package license; use of the name for package identity does not grant general branding rights.

The approved private security reporting channel is [leonardo2047@proton.me](mailto:leonardo2047@proton.me). The founder reports a successful delivery/reply test. Hakan is the sole maintainer. There is no response-time commitment. Do not put vulnerability details, secrets, or real user data in a public issue. Further publication and releases require separate human approval.

## Controlled action contract: tales-actions-v1

The separate `evaluateActionPolicy()` API is local, unreleased review work on the public v0.1.0 baseline. `ACTION_PROFILE_VERSION` and the immutable `REGISTERED_ACTION_PROFILES` are exported from the package entry point. The contract version is independent of the unchanged package version. This API does not call, replace or reinterpret `evaluatePolicy()`; all its existing v0.1 restrictions still apply.

### Runtime facts and validation

Only the trusted runtime may construct these facts from verified state. They are not an LLM tool schema to accept directly from a model or a visitor.

| Common required field | Contract |
| --- | --- |
| `profileVersion` | Exactly `tales-actions-v1`. |
| `actionProfile` | Exactly one of the three profiles below; no wildcard. |
| `environment` | `local`, `preview`, or `production`; local/preview block. |
| `runtimeEnabled` | Exact boolean; false blocks. |
| `actionId`, `targetId` | Opaque runtime aliases: 1-128 ASCII characters, first alphanumeric, subsequent alphanumeric/dot/underscore/hyphen. Use an alias, not a Google email/calendar ID or sub value. |
| `revision` | Positive safe integer. |
| `normalizedPayloadHash` | Exactly 64 lowercase hexadecimal characters (SHA-256 form). The runtime computes and compares the hash; the library only checks its form. |
| `targetAuthorized` | Exact boolean; false blocks. |
| `containsSecretMaterial` | Exact boolean; true means secret/token/credential material in the evaluated action/policy payload and blocks. Managed executor credentials outside that payload are not this flag and are not read here. |
| `involvesFinancialOrLegalOrHealthData` | Exact boolean; true blocks. |
| `realUserDataMinimized` | Exact boolean; false blocks. |

Exactly one profile-specific nested record is required. Missing, extra or symbol fields, accessors, arrays, class instances, non-plain prototypes, wrong primitives and unknown enums block. Plain records with Object.prototype or null prototypes are accepted. Required properties must be own data properties. No caller iterators or primitive coercion are used; descriptor/prototype inspection errors, including revoked proxies, fail closed. Proxy metadata traps themselves cannot be prevented by JavaScript inspection.

### Registry and decisions

All three profiles require every global gate. Restricted failures cannot be overridden by approval. Known false gates yield static profile-specific violations; malformed input returns `invalid-action-policy-input`.

| Profile | Required nested facts | Decision after global gates |
| --- | --- | --- |
| `telegram.notify_pending_action` | `notification.pendingApprovalExists`, `notificationAuthorizationActive`, `recipientBound`, `messageDataMinimized`: all true | All true: allow; any false: block. Prior limited human authorization covers notification; no new per-notification approval. |
| `calendar.create_meeting` | `approval`: all eight booleans listed below | Approval absent: requires-approval; claimed approval with any binding false: block; every binding true: allow. |
| `calendar.read_meeting_for_reconciliation` | `reconciliation`: the eight fields listed below | All required facts pass: allow; otherwise block. No new per-action approval of the already-authorized execution. |

Meeting approval fields (all present, even when approval is absent):

- `approvalPresent`
- `approverAuthorized`
- `actionIdMatches`
- `revisionMatches`
- `payloadHashMatches`
- `targetMatches`
- `profileVersionMatches`
- `approvalUnexpired`

If `approvalPresent=false`, the other booleans do not substitute for absent approval. If true, every binding must be true. Expired, unauthorized, different-action, old-revision, different-hash, wrong-target or wrong-version approval blocks. The runtime must independently verify identity, authority, revocation and freshness against the exact normalized action.

Reconciliation fields:

- `reconciliationRequired=true`
- `linkedExecutionExists=true`
- `executionState='execution_unknown'`
- `deterministicExternalIdPresent=true`
- `linkedExecutionAuthorized=true`
- `executionTargetMatches=true`
- `externalIdBoundToAction=true`
- `lookupScope='bound_execution_only'`

The last four facts make the already-authorized, narrow read scope explicit. A mere existing event ID is insufficient. The runtime derives the event ID from the persisted execution/action, never a model/visitor-selected event. Other known states (`draft`, `pending_approval`, `approved`, `executing`, `executed`, `blocked`, `rejected`, `withdrawn`, `expired`) block. Unknown states/scopes are malformed and block. Browsing, availability search, unrelated or arbitrary event lookup has no profile or accepted scope.

### Synthetic example

```ts
import {
  ACTION_PROFILE_VERSION,
  evaluateActionPolicy,
  type ActionPolicyEvaluationInput,
} from '@leonardo-tales/policy-engine'

// Synthetic facts only. A real caller must independently establish every assertion.
const pendingMeeting = {
  profileVersion: ACTION_PROFILE_VERSION,
  actionProfile: 'calendar.create_meeting',
  environment: 'production',
  runtimeEnabled: true,
  actionId: 'synthetic-action-001',
  revision: 1,
  normalizedPayloadHash: 'a'.repeat(64),
  targetId: 'synthetic-calendar-alias',
  targetAuthorized: true,
  containsSecretMaterial: false,
  involvesFinancialOrLegalOrHealthData: false,
  realUserDataMinimized: true,
  approval: {
    approvalPresent: false,
    approverAuthorized: false,
    actionIdMatches: false,
    revisionMatches: false,
    payloadHashMatches: false,
    targetMatches: false,
    profileVersionMatches: false,
    approvalUnexpired: false,
  },
} satisfies ActionPolicyEvaluationInput

const result = evaluateActionPolicy(pendingMeeting)
// result.decision === 'requires-approval'
// result.riskLevel === 'high'; result.auditRequired === true
// result.evaluationOnly === true; no action or external request occurs.
```

### Output and execution boundary

Exports include `ActionProfile`, `ActionEnvironment`, `ActionExecutionState`, `ActionPolicyBaseInput`, `ActionApprovalContext`, `PendingActionNotificationFacts`, `MeetingReconciliationFacts`, `ActionPolicyEvaluationInput`, and `ActionPolicyEvaluationResult`.

Results contain `decision`, `riskLevel`, `reasons`, `violations`, `approvalRequirements`, `auditRequired`, `profileVersion`, `actionProfile`, `evaluationOnly=true`, and `boundaryNotes`. Audit is always required. Allow and requires-approval are high risk; block is restricted. Invalid input returns the canonical contract version and `actionProfile=null`; unknown or malformed input text is never reflected. Valid results also omit aliases, hashes and personal/action contents. Identical facts produce equal fresh results; input records are not mutated or retained.

An allow result is **not execution authority**. No network, Telegram/Calendar call, OAuth, credentials, Redis, identity/signature verification or executor exists here. The caller owns authentication, exact approval verification, OAuth/managed secrets, deterministic payload/target/event binding, idempotency, current state transitions, authorized execution and audit persistence. It must re-evaluate current facts immediately before execution and handle races/revocation; this library does not lock state or solve time-of-check/time-of-use.

Neither this contract nor a prior policy output creates standing production or external integration authority. Calendar update/delete/list/freebusy, email, CRM, Drive, payments, web browsing, generic HTTP and generic tool execution are not registered. The Constitution, separate runtime governance and human release/integration gates remain applicable.

### Validation scope

The original tests stay unchanged; dedicated `src/action-policy.test.ts` covers registry, all common/profile gates, exact approval binding, reconciliation limits, malformed runtime inputs, descriptor/getter/proxy cases, frozen/mutated records, result isolation and generic v0.1 regressions. Required commands remain the local-development commands above. This implementation is also locally checked on Node.js 24.16.0 / pnpm 11.9.0; this adds no general platform-support or production-certification claim.

Build output imports `dist/action-policy.js` from `dist/index.js`; the package file allowlist includes that file and its declaration. Generated dist remains ignored. No final .tgz, package publication, GitHub release, version bump or site integration is part of this task.
