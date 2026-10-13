# Leonardo Tales Policy Engine

This is a narrow, fresh-history source repository for `@leonardo-tales/policy-engine`. It contains a policy-evaluation package and a limited governance and community surface; it is not the complete Leonardo Tales system.

The [Leonardo Tales Constitution v1.1.1](LEONARDO_TALES_CONSTITUTION.md) is the canonical, normative Turkish text for this repository. These English repository documents describe the package boundary and do not amend the Constitution. Any future English translation would initially be non-normative unless separately ratified. References in the canonical text to internal or historical governance material do not make that material part of this repository or available to readers.

The [Constitutional Alignment Test](CONSTITUTIONAL_ALIGNMENT_TEST.md) reproduces Constitution v1.0 §33 verbatim in Turkish, as required by LT-NC-045 of the current binding [Constitution v1.1.1](LEONARDO_TALES_CONSTITUTION.md). Turkish remains the binding reference; the English translation is non-normative.

## What the package does

The generic `evaluatePolicy()` API evaluates explicit caller-supplied policy fields and returns a typed result. Invalid runtime input is rejected with a deterministic `block / restricted` result. `requestedAction` is descriptive; the package does not classify natural language. The output is a local decision aid, not a verified permission grant or action executor. Its `humanApprovalPresent` field is a supplied fact, not proof of identity or approval.

Leonardo Tales has broader constitutional and research aspirations. This package does **not** provide AGI, consciousness, an autonomous civilization, production certification, universal runtime constitutional enforcement, or autonomous high-impact authority. It does not control private Core systems, Dev, Science, or Vault. The [Project Boundary](PROJECT_BOUNDARY.md), [Permissions](PERMISSIONS.md), and [Human Approval Gate](HUMAN_APPROVAL_GATE.md) explain the limits.

## License and reporting

Package code and its narrow distribution materials retain the previously approved Apache-2.0 scope. Hakan Demirci's rights-controlled original contributions to root governance and community documentation in the initial 25-file repository source snapshot are licensed under CC BY 4.0 within the scope of the [license map](LICENSE.md). [Security reporting](SECURITY.md) uses the approved private channel [leonardo2047@proton.me](mailto:leonardo2047@proton.me), and [external contribution intake](CONTRIBUTING.md) is not authorized. The founder reports a successful delivery/reply test. Hakan is the sole maintainer. This source publication does not include an npm registry release or production deployment. Further publication, releases, or deployment require separate human approval.

GitHub repository: `leonardotalesdev/leonardo-tales-policy-engine`; default branch: `main`.

## Controlled action profile surface (unreleased v0.2.0 release candidate)

A second, independent API, `evaluateActionPolicy()`, evaluates exactly three named profiles under the exported `ACTION_PROFILE_VERSION = 'tales-actions-v1'` contract. It never routes or changes `evaluatePolicy()`. The generic v0.1 evaluator still blocks production, deployment, secrets, external integrations, real user data, high-stakes data and restricted-tier requests even when `humanApprovalPresent=true`.

| Registered profile | Decision after global gates pass |
| --- | --- |
| `telegram.notify_pending_action` | `allow` only for an existing pending action, active prior limited notification authorization, a bound recipient and minimized message. No recursive per-notification approval. |
| `calendar.create_meeting` | Absent action-specific approval: `requires-approval`. Claimed approval with any failed binding: `block`. All verified bindings: `allow`. |
| `calendar.read_meeting_for_reconciliation` | `allow` only to reconcile the bound deterministic event of a previously authorized `execution_unknown` execution. No new per-action approval; no browsing or availability lookup. |

All profiles require production context, enabled runtime, an authorized target, no secret material in the evaluated payload, no financial/legal/health data, and minimized real user data. Unknown profiles/versions and malformed input block. Every result requires audit; successful or pending evaluations are high risk, blocks are restricted.

**This is pure evaluation, not a runtime integration or permission grant.** The caller must establish trusted facts and separately enforce authentication, exact approval verification, OAuth, managed credentials, idempotency, state transitions, execution and audit persistence. Model/visitor assertions are not trusted policy facts. Managed executor credentials stay outside the policy payload and are not read by this package.

See the [package contract and examples](packages/policy-engine/README.md#controlled-action-contract-tales-actions-v1), [approval boundary](HUMAN_APPROVAL_GATE.md), and [security invariants](SECURITY.md). The current release candidate is unreleased v0.2.0, prepared locally from the public v0.1.0 source baseline and the reviewed Action Profile checkpoint. No public v0.2.0 release, npm publication, final archive, deployment or site integration has occurred. The action profile contract remains tales-actions-v1, independent of package release versioning. See the [v0.2.0 release-candidate note](docs/releases/v0.2.0.md).
