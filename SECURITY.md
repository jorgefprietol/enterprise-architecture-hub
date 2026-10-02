# Security policy

This repository provides a local architecture portfolio application. Reads expose a fictional demonstration catalog. Mutations require a shared editor token injected at runtime. The token is not a substitute for enterprise identity and access management.

Do not expose the Compose deployment to the internet without TLS, OIDC authentication, role-based authorization, named-user audit attribution, request throttling, hardened ingress and tested backups. Keep the local editor token in the ignored `.env` file and rotate it after accidental disclosure. The application keeps this token in browser memory rather than persistent browser storage.

The catalog uses restrictive foreign keys, input validation and transactional audit events. The audit table is an operational record, not a tamper-proof compliance ledger. CSV exports prefix potentially executable spreadsheet formulas. Nginx limits content sources and blocks framing. Container health checks cover the underlying services; the integration smoke check covers the full decision path.

Dependency updates are proposed weekly. C# treats restore warnings as errors; npm audit blocks high-severity findings in CI. Build artifacts include a software bill of materials and provenance. These controls do not constitute an external security assessment.

Report security issues privately to the repository owner through GitHub security advisories. Do not include secrets or confidential data in public issues.
