# Leonardo Tales Policy Engine — Permissions

| Action | Repository meaning |
| --- | --- |
| Read | Inspect information within the current task's approved scope. |
| Draft | Prepare nonbinding work for review. |
| Suggest | Recommend a decision while leaving authority with the human. |
| Modify | Change only paths explicitly approved for the task. |
| Execute | Perform a separately authorized action with its applicable checks. |
| Publish | Make content public only under a separate, concrete human release decision. |
| Deploy | Distribute or operate a system only under a separate human decision and applicable gates. |
| Delete | Remove assets only under a separate human decision and applicable gates. |

Permission is limited by task, project, scope, and context. A repository role, technical capability, earlier approval, audit note, or model output creates no standing authority. Source availability and the ability to fork or submit a pull request do not authorize contribution intake or acceptance. See [Project Boundary](PROJECT_BOUNDARY.md) and [Human Approval Gate](HUMAN_APPROVAL_GATE.md).

The policy engine's numeric `permissionTier` is an input to a local evaluation model; it is not an operating-system permission, proof of approval, or a grant of any action class above. A returned result cannot itself authorize tool use, public claims, deployment, or other high-impact action. The package does not authenticate a human approver or enforce the Constitution across arbitrary runtimes.

## Controlled profile facts are not permission grants

The separate `evaluateActionPolicy()` API uses no numeric permission tier and grants no action class above. Its registry is closed: only `telegram.notify_pending_action`, `calendar.create_meeting`, and `calendar.read_meeting_for_reconciliation` under `tales-actions-v1` can be evaluated. The original generic evaluator's closed production/external/data/secret boundaries remain intact.

An `allow` decision means supplied facts passed that profile's evaluation, not that a tool may now run. A trusted caller must authenticate the actor, verify current scope and approval, bind the target and revision/hash, and enforce execution, idempotency and audit controls outside this package. Neither the LLM nor the visitor may select trusted policy facts, a Telegram recipient, an arbitrary calendar or an event to read.

Notification authorization is a prior human-approved, limited capability, not blanket external communication permission. Meeting creation has an exact action-specific human gate. Reconciliation needs no new approval only for an already-authorized `execution_unknown` execution and its runtime-derived event ID; a false prior-authorization or binding fact blocks. No update/delete/list/freebusy, email, CRM, Drive, payments, browsing, generic HTTP or generic tool execution profile exists. Managed credentials outside this payload remain the separately governed runtime's responsibility.
