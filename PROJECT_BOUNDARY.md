# Leonardo Tales Policy Engine — Project Boundary

## Purpose and scope

This is a narrow, fresh-history repository centered on `@leonardo-tales/policy-engine`. The package evaluates supplied policy facts and returns a result; it does not execute the requested action. The repository is not the complete Leonardo Tales system or a production deployment. Its contents are limited to the reviewed package, technical support files, and approved governance and community documents.

The project's current constitutional and governance lineage is the Leonardo Tales **Core governance domain**. This repository is a separate, narrow distribution surface for the policy-engine package. That lineage does not settle permanent package ownership or location within Leonardo Tales; the long-term arrangement remains unresolved. It grants no cross-project authority or access to the private Core repository or its data.

The Turkish [Leonardo Tales Constitution v1.1.1](LEONARDO_TALES_CONSTITUTION.md) remains the canonical, normative text. Carrying a byte-identical copy does not revise it or import private materials it references. English repository guidance explains the narrow project boundary and does not supersede the Constitution.

## Exclusions

Private Core history, Core Console, Science, Vault, Dev, internal decisions and audits, research, strategy, memories, incidents, credentials, unrelated packages, and private data are outside this repository. References to any such material in the canonical Constitution do not make it public or grant access. No cross-project authority follows from this repository's existence.

## Work and authority

Read, Draft, Suggest, Modify, Execute, Publish, Deploy, and Delete remain distinct actions. A role description, tool capability, package output, or local record does not grant authority. Any repository change requires an applicable human-approved task and scope. Publication, deployment, external communication, deletion, and high-impact action require their own approvals and applicable reviews. See [Permissions](PERMISSIONS.md) and [Human Approval Gate](HUMAN_APPROVAL_GATE.md).

If scope, rights, security, or approval is uncertain, stop the affected action, preserve the state, and seek human review. This repository grants no runtime authority or access to private repositories, systems, or data.

## Separate controlled action evaluation surface

The reviewed implementation scope adds `packages/policy-engine/src/action-policy.ts` and a separate exported `evaluateActionPolicy()`. The `tales-actions-v1` schema registers only `telegram.notify_pending_action`, `calendar.create_meeting`, and `calendar.read_meeting_for_reconciliation`. This is an explicit, narrow evaluation surface; it neither routes nor relaxes the generic `evaluatePolicy()` v0.1 boundary.

Production is an evaluated caller context, not a deployment status or authority grant. Local/preview inputs, disabled runtime, unknown version/profile, unauthorized target, payload secrets, high-stakes data or non-minimized real user data block. All evaluations require audit. The notification evaluates a separately human-approved, limited scope; meeting creation requires exact action-specific approval; reconciliation is limited to a previously authorized ambiguous execution and its bound deterministic event.

There is no executor, network client, OAuth, credential access, authentication, cryptographic verification, Redis, memory service, model, or runtime enforcement in this package. It consumes only typed facts, opaque aliases and a hash, never personal action contents. The caller owns those mechanisms and must re-evaluate current facts before its authorized executor acts. An `allow` result supplies no standing, cross-project, arbitrary external-tool or secret authority.

This local implementation task does not authorize release, integration into hakandemirci.tech, or production operations. The Constitution remains unchanged. See the [package contract](packages/policy-engine/README.md#controlled-action-contract-tales-actions-v1).
