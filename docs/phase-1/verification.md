# Phase 1 verification report

This report is intentionally evidence-driven. Results are recorded only after commands run successfully in the current TypeScript repository.

| Check                            | Result                                                           |
| -------------------------------- | ---------------------------------------------------------------- |
| npm clean install                | Passed; npm 11 installed 1,351 packages from `package-lock.json` |
| Formatting                       | Passed; all included files match Prettier configuration          |
| ESLint                           | Passed; zero errors (two Supertest typing warnings)              |
| Type checking                    | Passed in shared, API, and web workspaces                        |
| Prisma validation and generation | Passed with Prisma 7.8.0                                         |
| Unit tests                       | Passed; API 6 tests and web 5 tests                              |
| API integration tests            | Passed; liveness and readiness 2/2                               |
| PostgreSQL integration tests     | Discovered and skipped because Docker/PostgreSQL are unavailable |
| Next.js production build         | Passed; all Phase 1 routes compiled                              |
| NestJS production build          | Passed                                                           |
| Turborepo checks                 | Formatting, lint, typecheck, test, and build passed              |

No Java build, Vaadin bundle, Maven test, or JAR is part of Residence.io.
