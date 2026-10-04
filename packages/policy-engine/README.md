# @leonardo-tales/policy-engine

An experimental, narrow helper for evaluating proposed actions. It returns a policy decision without side effects or action execution. This package has no public registry release. This package is maintained in the standalone policy-engine source repository.

## Evaluate a proposal

```js
import { evaluatePolicy } from '@leonardo-tales/policy-engine'

const input = {
  subjectType: 'agent-task',
  title: 'Draft a local plan',
  description: 'Prepare a synthetic planning note.',
  requestedAction: 'draft-plan',
  permissionTier: 1,
  riskHints: ['low'],
  involvesSecrets: false,
  involvesProduction: false,
  involvesExternalIntegration: false,
  involvesRealUserData: false,
  involvesFinancialOrLegalOrHealthData: false,
  proposesCommitOrPush: false,
  proposesDeployment: false,
  proposesPublicClaim: false,
  humanApprovalPresent: false,
}

const result = evaluatePolicy(input)
console.log(result.decision) // 'allow'
```

Decisions are `allow`, `requires-approval`, or `block`. For example, setting `proposesCommitOrPush: true` without approval returns `requires-approval`; setting `involvesSecrets: true` returns `block` even when `humanApprovalPresent` is true. Invalid runtime input, such as `null`, returns `block` with risk level `restricted` and violation `invalid-policy-input`.

`requestedAction` is free descriptive text. The engine does not classify it with keywords, natural language, or a model; the structured fields determine the policy result. `humanApprovalPresent` is a caller-provided assertion. The engine does not verify a human identity, signature, authority, or approval freshness.

An `allow` result grants no operating-system, tool, deployment, or publication authority. The package performs no action or tool execution, provides no autonomous high-impact authority, and is not production- or security-certified. It must not be used as an approval system by itself.

## Local development and compatibility

In this standalone workspace, run `pnpm install --frozen-lockfile`, then `pnpm --filter @leonardo-tales/policy-engine test`, `pnpm --filter @leonardo-tales/policy-engine typecheck`, and `pnpm --filter @leonardo-tales/policy-engine build`. Consumers need the build output because the package exports `dist/index.js` and `dist/index.d.ts`.

The local proof environment is Node.js 22.22.2. Broader Node version support has not been verified or claimed.

## License and reporting boundary

Apache License 2.0 applies to this narrow policy-engine package distribution. The private Leonardo Tales Core repository and its history are outside that code-license scope. Hakan Demirci's rights-controlled original contributions to root governance and community documentation in the initial 25-file repository source snapshot are licensed under CC BY 4.0 within the separate scope of the [repository license map](https://github.com/leonardotalesdev/leonardo-tales-policy-engine/blob/main/LICENSE.md). Leonardo Tales trademarks and logos are not licensed by the package license; use of the name for package identity does not grant general branding rights.

The approved private security reporting channel is [leonardo2047@proton.me](mailto:leonardo2047@proton.me). The founder reports a successful delivery/reply test. Hakan is the sole maintainer. There is no response-time commitment. Do not put vulnerability details, secrets, or real user data in a public issue. Further publication and releases require separate human approval.
