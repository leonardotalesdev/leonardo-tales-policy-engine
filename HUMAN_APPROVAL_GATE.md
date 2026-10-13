# Leonardo Tales Policy Engine — Human Approval Gate

Human approval is specific to an action, scope, project, and context. It does not create continuing authority for another task and cannot override the [canonical Constitution](LEONARDO_TALES_CONSTITUTION.md). A package result, `humanApprovalPresent` value, chat message summary, audit entry, or agent role is not identity verification or a cryptographic approval mechanism.

Explicit human decisions and applicable reviews are required for repository publication, release, deployment, deletion or irreversible work, authority expansion, security posture changes, identity or memory-policy changes, secret handling, external communication, access to real personal or production data, public claims, and public governance claims. Before public distribution, the Constitution's applicable secrets, privacy, rights, governance, positioning, security, release-audit, and rollback-limit reviews must be satisfied. One gate does not satisfy another.

When a decision is missing or ambiguous, stop the affected action, preserve the working state, and report the concrete proposal, files, risks, and available evidence for human review. An approval record documents the claimed decision and scope; this repository has no system that independently verifies the human's identity or binds a signature to an action. See [Permissions](PERMISSIONS.md) and [Audit Log](AUDIT_LOG.md).

## Action-specific approval assertions in tales-actions-v1

`evaluateActionPolicy()` remains a pure evaluator; it does not authenticate Hakan or verify signatures. Its `calendar.create_meeting` input requires the nested `approval` record with all eight boolean facts: `approvalPresent`, `approverAuthorized`, `actionIdMatches`, `revisionMatches`, `payloadHashMatches`, `targetMatches`, `profileVersionMatches`, and `approvalUnexpired`. These must come from trusted runtime verification against its approval record and current action, never from model output or a visitor.

After global gates pass, absent approval returns `requires-approval`. A claimed approval with any failed identity, authorization, freshness or binding assertion returns `block`, not `requires-approval`. Only a claimed approval with every fact true returns `allow`. Invalid/missing fields block before evaluation. A new revision, changed normalized payload, different target/version, expiration or revocation requires current verification and re-evaluation; an earlier allow result cannot be cached as execution authority.

`telegram.notify_pending_action` uses an independently human-approved limited notification scope represented by `notificationAuthorizationActive` and a runtime-bound recipient. It requires no recursive per-notification approval. `calendar.read_meeting_for_reconciliation` requires no new per-action approval solely when reconciling the bound deterministic event of a previously authorized ambiguous execution. `linkedExecutionAuthorized`, `executionTargetMatches`, `externalIdBoundToAction` and `lookupScope='bound_execution_only'` narrow that scope; they do not grant general Calendar reads.

Every decision requires audit persistence by the caller. Publication, integration, secret handling, deployment and actual external execution retain their separate human/security gates. The local implementation does not satisfy them.
