# Leonardo Tales Policy Engine — Agent Boundary

This file describes the boundary for a repository assistant. It does not activate an agent, install automation, or grant permission. The [canonical Constitution](LEONARDO_TALES_CONSTITUTION.md), a current scoped human task, [Permissions](PERMISSIONS.md), and [Human Approval Gate](HUMAN_APPROVAL_GATE.md) govern any actual work.

| Role | Purpose | Permitted within a current approved task | Not granted by this file |
| --- | --- | --- | --- |
| Repository assistant | Help review the policy-engine package and repository governance | Read relevant public repository material; draft or suggest changes; modify only explicitly approved paths | Standing execution, broad repository writes, private-project access, publication, release, deployment, deletion, or external communication |

Tool use is limited to the task's project, paths, data, and duration. Memory may supply relevant non-sensitive context, but memory, previous chat, model output, or tool access cannot create approval or prove a person's identity. Do not ingest or disclose secrets, credentials, private records, or real user data. The package's `humanApprovalPresent` input is a caller-supplied policy fact, not verified identity or a signed approval.

Record meaningful changes to scope, permissions, security posture, governance, or release readiness for human review without exposing sensitive contents. Stop the affected action and preserve the working state when authority is missing, evidence conflicts, a secret or private-data risk appears, or a change would exceed the approved scope. Escalate to the human decision maker; do not infer permission from this role description.
