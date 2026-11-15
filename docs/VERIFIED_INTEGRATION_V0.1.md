# Verified Reference Integration — Integration Lab v0.1

Date: 2026-11-15

Status: VALIDATED REFERENCE EXPERIMENT

This document records a bounded reference-runtime experiment for the Leonardo
Tales Policy Engine controlled action profiles.

It does not extend the authority of the Policy Engine and does not turn an
`allow` result into execution authority.

The Policy Engine remains an evaluation component. Authentication, approval
verification, credentials, execution, persistence, reconciliation and runtime
state remain responsibilities of the trusted caller/runtime.

## Scope

The reference experiment exercised the `tales-actions-v1` controlled action
contract, primarily:

- `calendar.create_meeting`
- `calendar.read_meeting_for_reconciliation`

The runtime connected Policy Engine decisions to a real Google Calendar
account through a separately implemented Integration Lab.

The Integration Lab is intentionally separate from this repository.

## Runtime boundary tested

The validated flow was:

`agent action proposal`
→ `Policy Engine evaluation`
→ `requires-approval`
→ `exact human approval`
→ `Policy Engine re-evaluation`
→ `allow`
→ `durable execution preparation`
→ `authoritative execution state`
→ `deterministic external identity`
→ `Google Calendar execution`
→ `durable outcome / bounded reconciliation`

An `allow` result alone was never treated as sufficient execution authority.

## M1 — Human-gated real execution

Result: PASS

A real `calendar.create_meeting` action was evaluated without approval and
returned `requires-approval`.

The human approval was bound to:

- action ID
- action revision
- normalized payload SHA-256
- target
- action profile version
- authorized approver
- approval expiration

After exact verification and policy re-evaluation, the action returned
`allow`.

The trusted runtime then created one real Google Calendar event.

Observed provider result:

- HTTP status: `200`
- Calendar status: `confirmed`
- attendees: `0`
- automatic retry: disabled

## M2 — Bound reconciliation

Result: PASS

A reconciliation action was limited to the deterministic external event
identity bound to a previously authorized ambiguous execution.

The `calendar.read_meeting_for_reconciliation` policy allowed the bounded
lookup.

A real read-only Google Calendar request confirmed the existing event.

The reconciliation path did not provide general Calendar browsing,
availability search or arbitrary event reads.

## M3 — Deterministic provider idempotency experiment

Result: PASS

The same previously authorized action was intentionally presented to Google
Calendar again using the same deterministic external event identity.

Observed:

- first successful creation: `200`
- duplicate provider attempt: `409`
- automatic retry: disabled
- next step: reconciliation

The runtime did not convert the duplicate response into an automatic new
execution.

This is an application-level deterministic idempotency experiment plus
observed provider behavior. It is not a mathematical exactly-once guarantee.

## M4 — Post-side-effect crash recovery

Result: PASS

A controlled fault was injected after Google Calendar had accepted the
external action but before the local successful terminal outcome had been
persisted.

After restart, the runtime treated the action as `execution_unknown`.

It did not blindly retry the external mutation.

A bounded reconciliation request looked up only the deterministic event bound
to that execution.

Observed:

- reconciliation provider status: `200`
- existing Calendar event confirmed
- authoritative state recovered to `executed`
- automatic retry: disabled

## M5 — Persistent authoritative execution state

Result: PASS

A restart-safe local execution-state store was introduced separately from the
append-only audit journal.

The tested execution lifecycle included:

`draft`
→ `pending_approval`
→ `approved`
→ `executing`
→ `executed`

and, for ambiguous outcomes:

`executing`
→ `execution_unknown`
→ bounded reconciliation
→ `executed`

The real Calendar action completed with authoritative state:

- state: `executed`
- state version: `5`
- reason: `provider-confirmed-execution`

The exact same action was then presented again.

The runtime loaded the existing terminal `executed` state and blocked
re-entry locally before OAuth and before any new external request.

## M6 — Single-host concurrency safety

Result: PASS

Twelve independent local worker processes raced for the same:

`approved → executing`

transition.

Observed:

- workers: `12`
- execution-authority winners: `1`
- blocked workers: `11`
- final state: `executing`
- external execution identity bound to the single winner

A conservative stale-lock recovery experiment also passed:

- live lock owner: recovery blocked
- dead owner with young lock: recovery blocked
- confirmed-dead owner with sufficiently old lock: recovery allowed
- authoritative execution state remained unchanged during lock recovery

These results apply to the tested single-host filesystem runtime only.

They do not establish multi-host or distributed execution safety.

## M7 — Execution-state backend abstraction

Result: PASS

The runtime coordinator was separated from the filesystem implementation by
an `ExecutionStateBackend` contract.

The current reference implementation uses a local
`FileExecutionStateBackend`.

This creates a future boundary for transactional storage without making
PostgreSQL, Supabase or distributed-lock guarantees part of the v0.1 result.

## Policy properties exercised

The Integration Lab exercised the following Policy Engine properties:

- missing meeting approval → `requires-approval`
- exact meeting approval → `allow`
- changed payload after approval → `block`
- reconciliation of a bound `execution_unknown` action → `allow`
- reconciliation of an already executed action → `block`
- wrong external identity → `block`
- unauthorized linked execution → `block`
- malformed or insufficient runtime facts remain fail-closed

The trusted runtime additionally provided mechanisms that are intentionally
outside the Policy Engine package:

- OAuth
- managed provider credentials
- exact approval capture
- durable audit persistence
- deterministic external execution identity
- execution-state persistence
- replay prevention
- provider execution
- reconciliation
- local multi-process coordination

## What this validation establishes

The experiment provides evidence that the narrow Policy Engine action contract
can participate in a real external-action runtime while preserving the tested
approval, identity, audit, reconciliation and fail-closed boundaries.

It also demonstrates why policy evaluation and execution authority remain
separate concerns.

## What this validation does not establish

This experiment is not:

- production certification
- security certification
- an independent security audit
- a general proof of exactly-once execution
- a distributed-systems guarantee
- a multi-host concurrency guarantee
- proof that arbitrary integrations are safe
- authorization for production deployment
- authorization for publication of credentials, tokens, audit data or user data

The current reference runtime uses a local filesystem-backed state store and
single-host coordination.

Production identity, distributed transactional state, secrets lifecycle,
tamper-resistant audit storage, deployment and monitoring remain outside this
validation.

## Repository boundary

The Policy Engine repository owns the evaluation contracts and their tests.

The Integration Lab owns the reference runtime and experiment machinery,
including:

- Google OAuth
- Google Calendar execution
- durable runtime audit
- deterministic event identity
- crash-window experiments
- reconciliation implementation
- execution state machine
- replay prevention
- local process locking
- stale-lock recovery

Provider-specific runtime infrastructure should not be moved into the Policy
Engine package merely because it was used to validate the policy contract.

The reference Integration Lab completed milestones M1–M7 and was tagged
locally as `v0.1.0` after its final regression suite passed.
