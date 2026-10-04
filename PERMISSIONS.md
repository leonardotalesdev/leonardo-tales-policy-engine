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
