# Leonardo Tales Policy Engine — Memory Policy

Memory can support continuity, but it is context rather than verified truth, permission, or human approval. Current scoped instructions and checked repository state take precedence over stored summaries. No record can renew an expired or absent authorization.

This package does not include a memory service. Its policy result is not an authorization to collect, retain, export, or reveal data. Do not place secrets, credentials, recovery material, real personal data, or private-project records in source, fixtures, issues, prompts, or audit records. Use only task-relevant, non-sensitive context when working on this repository.

Any future memory collection, retention schedule, consent handling, deletion guarantee, identity binding, or public sharing requires separate design, rights review, and human approval. The existence of a governance document does not claim those mechanisms have been implemented. See [Project Boundary](PROJECT_BOUNDARY.md), [Audit Log](AUDIT_LOG.md), and the [canonical Constitution](LEONARDO_TALES_CONSTITUTION.md).

## Controlled action fact minimization

`evaluateActionPolicy()` has no memory or storage side effects. Its exact schema accepts only booleans/enums, opaque action/target aliases, a positive safe-integer revision and a lowercase SHA-256 normalized-payload hash. It requires no visitor name/email, meeting notes, Google email or `sub`, token, credential, or personal action payload. Additional/symbol fields are rejected rather than retained or reflected.

The runtime must minimize the underlying action and notification data, establish `realUserDataMinimized` and `messageDataMinimized` as appropriate, and keep managed credentials outside the evaluated payload. A hash or alias may remain linkable metadata; it is not proof of anonymization, consent or retention compliance. Results do not echo aliases or hashes, including for valid inputs. Malformed values produce a static failure result with `actionProfile=null`.

No approval/memory record supplies identity proof by itself, and no policy result authorizes storage. Retention, consent, deletion, access controls and audit persistence remain a separate runtime design and approval responsibility.
