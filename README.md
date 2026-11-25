# Leonardo Tales Policy Engine

**Evaluate a proposed agent action as `allow`, `requires-approval`, or `block`, using explicit facts supplied by your application.**

For example, the generic API can distinguish these synthetic proposals:

| Proposal | Decision |
| --- | --- |
| Draft a low-risk local review | `allow` |
| Propose a commit without human approval | `requires-approval` |
| Handle secret material, even with approval asserted | `block` |

[Install the npm package](packages/policy-engine/README.md#install-from-npm) · [Full API contract](packages/policy-engine/README.md) · [v0.2.0 release](https://github.com/leonardotalesdev/leonardo-tales-policy-engine/releases/tag/v0.2.0)

This experimental TypeScript package provides fixed evaluation contracts, not a configurable policy language. Use it when those constraints fit your application; consider [OPA](https://www.openpolicyagent.org/docs/agent-tool-calling) or [Cedar](https://docs.cedarpolicy.com/auth/authorization.html) when you need broader policy modeling. No comparative security or performance advantage is claimed.

**A decision is not execution authority.** Your application must verify the facts, enforce its own permissions and perform any separately authorized action. This package does not authenticate a person, execute a tool or save an audit record.

This is a narrow, fresh-history source repository for `@leonardo-tales/policy-engine`. It contains a policy-evaluation package and a limited governance and community surface; it is not the complete Leonardo Tales system.

The [Leonardo Tales Constitution v1.1.1](LEONARDO_TALES_CONSTITUTION.md) is the canonical, normative Turkish text for this repository. These English repository documents describe the package boundary and do not amend the Constitution. Any future English translation would initially be non-normative unless separately ratified. References in the canonical text to internal or historical governance material do not make that material part of this repository or available to readers.

The [Constitutional Alignment Test](CONSTITUTIONAL_ALIGNMENT_TEST.md) reproduces Constitution v1.0 §33 verbatim in Turkish, as required by LT-NC-045 of the current binding [Constitution v1.1.1](LEONARDO_TALES_CONSTITUTION.md). Turkish remains the binding reference; the English translation is non-normative.

## What the package does

The generic `evaluatePolicy()` API evaluates explicit caller-supplied policy fields and returns a typed result. Invalid runtime input is rejected with a deterministic `block / restricted` result. `requestedAction` is descriptive; the package does not classify natural language. The output is a local decision aid, not a verified permission grant or action executor. Its `humanApprovalPresent` field is a supplied fact, not proof of identity or approval.

Version 0.3.0 includes the accepted PE-BOUNDS changes. It limits generic descriptive text and risk hints, omits caller free text from diagnostics, and freezes exported policy metadata. Applications that consume diagnostic text or modify that metadata should review the [v0.3.0 release notes](docs/releases/v0.3.0.md) and [generic evaluation bounds](packages/policy-engine/README.md#generic-evaluation-bounds).

Leonardo Tales has broader constitutional and research aspirations. This package does **not** provide AGI, consciousness, an autonomous civilization, production certification, universal runtime constitutional enforcement, or autonomous high-impact authority. It does not control private Core systems, Dev, Science, or Vault. The [Project Boundary](PROJECT_BOUNDARY.md), [Permissions](PERMISSIONS.md), and [Human Approval Gate](HUMAN_APPROVAL_GATE.md) explain the limits.

## License and reporting

Package code and its narrow distribution materials retain the previously approved Apache-2.0 scope. Hakan Demirci's rights-controlled original contributions to root governance and community documentation in the initial 25-file repository source snapshot are licensed under CC BY 4.0 within the scope of the [license map](LICENSE.md). The map also grants CC BY 4.0 for his rights-controlled v0.2.0 governance/release documentation additions and modifications within its separately defined scope; the initial snapshot grant remains unchanged. [Security reporting](SECURITY.md) uses the approved private channel [leonardo2047@proton.me](mailto:leonardo2047@proton.me), and [external contribution intake](CONTRIBUTING.md) is not authorized. The founder reports a successful delivery/reply test. Hakan is the sole maintainer. Public npm distribution is authorized for the package starting with v0.2.1; registry publication status must be verified on npm. Production deployment is not provided. Further releases or deployment require separate human approval.

GitHub repository: `leonardotalesdev/leonardo-tales-policy-engine`; default branch: `main`.

## Controlled action profile surface (v0.2.0)

A second, independent API, `evaluateActionPolicy()`, evaluates exactly three named profiles under the exported `ACTION_PROFILE_VERSION = 'tales-actions-v1'` contract. It never routes or changes `evaluatePolicy()`. The generic v0.1 evaluator still blocks production, deployment, secrets, external integrations, real user data, high-stakes data and restricted-tier requests even when `humanApprovalPresent=true`.

| Registered profile | Decision after global gates pass |
| --- | --- |
| `telegram.notify_pending_action` | `allow` only for an existing pending action, active prior limited notification authorization, a bound recipient and minimized message. No recursive per-notification approval. |
| `calendar.create_meeting` | Absent action-specific approval: `requires-approval`. Claimed approval with any failed binding: `block`. All verified bindings: `allow`. |
| `calendar.read_meeting_for_reconciliation` | `allow` only to reconcile the bound deterministic event of a previously authorized `execution_unknown` execution. No new per-action approval; no browsing or availability lookup. |

All profiles require production context, enabled runtime, an authorized target, no secret material in the evaluated payload, no financial/legal/health data, and minimized real user data. Unknown profiles/versions and malformed input block. Every result requires audit; successful or pending evaluations are high risk, blocks are restricted.

**This is pure evaluation, not a runtime integration or permission grant.** The caller must establish trusted facts and separately enforce authentication, exact approval verification, OAuth, managed credentials, idempotency, state transitions, execution and audit persistence. Model/visitor assertions are not trusted policy facts. Managed executor credentials stay outside the policy payload and are not read by this package.

See the [package contract and examples](packages/policy-engine/README.md#controlled-action-contract-tales-actions-v1), [approval boundary](HUMAN_APPROVAL_GATE.md), and [security invariants](SECURITY.md). The action profile contract remains tales-actions-v1, independent of package release versioning. GitHub source, tags, Release assets and npm registry publication are distinct distribution channels. Public npm distribution is separately authorized beginning with package v0.2.1; registry availability must be verified on npm rather than inferred from this README. Production deployment is not provided, and this package does not implement site integration. See the [v0.2.0 release contents and artifact provenance requirements](docs/releases/v0.2.0.md).

## Verified reference integration

A separate Integration Lab has exercised the `tales-actions-v1` Calendar
profiles through a bounded real Google Calendar runtime.

The reference experiment validated exact human approval, deterministic
external identity, real Calendar execution, duplicate handling, crash-window
reconciliation, persistent authoritative state, terminal replay prevention,
and single-host multi-process execution coordination.

These results do **not** move OAuth, credentials, execution, persistence or
runtime authority into this package. Policy Engine remains a pure evaluation
component, and `allow` remains an evaluation result rather than permission to
execute.

See [Verified Reference Integration — Integration Lab v0.1](docs/VERIFIED_INTEGRATION_V0.1.md)
for the tested properties, observed results and explicit limitations.
