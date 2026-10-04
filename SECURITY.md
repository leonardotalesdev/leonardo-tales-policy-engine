# Security Policy

## Current boundary

`@leonardo-tales/policy-engine` is an experimental policy evaluator. It returns a result for supplied facts; it does not authenticate approvers, execute actions, enforce operating-system permissions, or provide production security certification. Callers must enforce their own controls and treat input provenance and approval claims as unverified unless separately established.

## Private reporting

Report suspected vulnerabilities privately to [leonardo2047@proton.me](mailto:leonardo2047@proton.me). Hakan Demirci is the sole maintainer and security triage owner and checks this mailbox every business day. There is no guaranteed response or resolution time.

The founder confirms that end-to-end email delivery and reply testing of this mailbox succeeded.

Include the affected source commit, a short impact description, and a minimal reproduction using synthetic data. Do not include credentials, private records, or unnecessary personal data. Do not disclose confidential vulnerability details in public issues or pull requests.

## Supported source

Only the current public default-branch source is supported. There is no older-version or backport commitment.

## Triage and coordinated disclosure

Hakan reviews reports, assesses impact, and coordinates a fix or mitigation and disclosure timing with the reporter. Every merge requires explicit human review and approval; publication or release requires its separate human gate. Keep confidential report details private and obtain the reporter's consent before public attribution. See [Human Approval Gate](HUMAN_APPROVAL_GATE.md).
