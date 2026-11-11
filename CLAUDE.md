# ami-server

The Àmì backend. NestJS 12 (ES modules), MySQL 8.4, Sequelize 6 with sequelize-typescript, and Umzug migrations. The layout copies `~/Desktop/SoloBankingServer`: domain-driven design with ports and adapters, and commands kept separate from queries. The front end is `~/Desktop/ami-client`; its API contract is `ami-client/docs/API.md` and the plan is `ami-client/docs/BACKEND.md`.

## Layers

- `src/business/`: the domain and its use cases. No framework or ORM imports, except `Injectable` and `Logger` from `@nestjs/common`.
  - `domain/entities`, `domain/values` (enums, money, pricing, licence numbers, search words) and `domain/errors` (errors extend `DomainError`).
  - `ports/`: interfaces for the bank, the AI models, the clock, ids and passwords, with Symbol tokens in `ports/tokens.ts`.
  - `repositories/`: persistence interfaces, with Symbol tokens in `repositories/tokens.ts`.
  - `handlers/<area>/`: one handler per write, extending `AbstractRequestHandlerTemplate` and returning `CommandResponse`.
- `src/query/`: read-side query classes that use Sequelize models directly; JSON shapes live in `query/shared/serializers.ts`.
- `src/web/`: controllers, Sequelize models (listed in `ALL_MODELS`), repository implementations, adapters, security, validation DTOs, filters, scheduled jobs, and wiring in `providers/`.
- `src/auth/`: the JWT token service.

## Rules

- Money is whole kobo in `BIGINT` columns named `*_kobo`. Do all money maths with bignumber.js through `business/domain/values/money.ts` (`money`, `toKobo`, `nairaToKobo`, `koboToNaira`, `sumKobo`). Never use plain `+`, `*` or `Math.round` on money.
- Query with Sequelize's ORM methods (`findAll`, `findOne`, `count`, `sum`, `update`, `upsert`, `Op`). Don't write raw SQL or `sequelize.literal` unless the ORM can't express the query.
- Every bank call goes through `BankPort`. Every POST that moves money or creates a record sends an idempotency key that is stored before the call and reused on retry. A transfer that times out is marked `unknown` and re-checked, never sent again.
- Never activate a licence from a redirect alone: `ConfirmPaymentHandler` verifies with the bank first.
- Register ports and repositories in `web/providers/infrastructure.providers.ts`, handlers in `handler.providers.ts`, and queries in `query.providers.ts`.
- Every schema change is a migration in `migrations/` named `NNNN-description.migration.ts`. Never use `sync()`.
- Relative imports end in `.js`.
- Use Node 22 (`nvm use 22`). Install packages with `npx npm@11 install`.
- No code comments.
- Synthetic data only, even in seeds and logs. Never commit `.env` or the team key.
