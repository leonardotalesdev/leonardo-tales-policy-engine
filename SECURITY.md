# Security Policy

## Current boundary

`@leonardo-tales/policy-engine` is an experimental policy evaluator. It returns a result for supplied facts; it does not authenticate approvers, execute actions, enforce operating-system permissions, or provide production security certification. Callers must enforce their own controls and treat input provenance and approval claims as unverified unless separately established.


## Controlled action surface: trust boundary and invariants

The local `packages/policy-engine/src/action-policy.ts` implementation adds pure `evaluateActionPolicy()` evaluation alongside the unchanged generic v0.1 API. Its `tales-actions-v1` registry is fixed to three profiles; no network, OAuth, secret reading, Redis, execution or identity verification is included. This is not a production runtime or security certification.

- The runtime must construct policy facts from its verified state. Never pass model/visitor assertions through as trusted authorization, approval, minimization, recipient or event bindings.
- Unknown version/profile, malformed fields, local/preview, disabled runtime, unauthorized target, secret material in the evaluated payload, high-stakes data and non-minimized real user data block.
- Calendar creation requires every exact action/revision/hash/target/version/approver/freshness binding. Absent approval requires approval; claimed invalid approval blocks.
- Notification requires a pending action, active prior human-approved limited scope, bound recipient and minimized message. It provides no arbitrary messaging authority.
- Reconciliation requires a previously authorized `execution_unknown` execution, matching target and action-bound deterministic external ID. Only `bound_execution_only` is accepted; no browsing, availability search or arbitrary event read.
- All results require audit. `allow` never authorizes execution itself. Generic production/external/data/secret/restricted blocks remain intact.
- Validation inspects own data descriptors in exact plain/null-prototype records; missing/extra/symbol fields, accessors and wrong primitives/enums fail closed. No caller iterators or primitive coercion are used. Throwing/revoked proxy inspection fails closed. Outputs contain static policy text and recognized enums, not raw input, aliases, hashes or personal contents.

These facts are not independently proven by the library: a dishonest trusted caller can assert false facts as true. The runtime must enforce authentication, authorization, approval verification, OAuth, managed credential isolation, target/event binding, request size limits, idempotency, state transitions and minimized audit persistence. Hash format validation does not recompute or prove payload integrity. Boolean freshness is not a clock check. JavaScript proxy metadata traps can run during inspection; callers should pass freshly constructed plain records, not arbitrary live objects.

Review for bypasses of the registry, global gates or approval bindings, broadened reconciliation scope, reflective outputs, or accidental execution/credential access. No new vulnerability class is excluded or accepted as safe. Existing private reporting and human release gates remain unchanged.

## Private reporting

Report suspected vulnerabilities privately to [leonardo2047@proton.me](mailto:leonardo2047@proton.me). Hakan Demirci is the sole maintainer and security triage owner and checks this mailbox every business day. There is no guaranteed response or resolution time.

The founder confirms that end-to-end email delivery and reply testing of this mailbox succeeded.

Include the affected source commit, a short impact description, and a minimal reproduction using synthetic data. Do not include credentials, private records, or unnecessary personal data. Do not disclose confidential vulnerability details in public issues or pull requests.

## Supported source

Only the current public default-branch source is supported. There is no older-version or backport commitment.

## Triage and coordinated disclosure

Hakan reviews reports, assesses impact, and coordinates a fix or mitigation and disclosure timing with the reporter. Every merge requires explicit human review and approval; publication or release requires its separate human gate. Keep confidential report details private and obtain the reporter's consent before public attribution. See [Human Approval Gate](HUMAN_APPROVAL_GATE.md).
