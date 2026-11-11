# ami-server

The backend for Àmì: creators list videos, other creators and brands license the whole video or part of it, and pay through the Xtradot Bank sandbox. Search uses the Huawei MaaS models to understand what people type. The plan behind it is in `ami-client/docs/BACKEND.md`; the endpoints match `ami-client/docs/API.md`.

## Run it locally

```bash
nvm use 22
npx npm@11 install
cp .env.example .env   # then set JWT_SECRET (any long random string)
docker compose up -d   # MySQL 8.4 on 127.0.0.1:3308
npm run migrate:dev
npm run seed
npm run start:dev      # http://localhost:4000/api, health at /healthz
```

Locally the bank and AI are mocks (`BANK_ADAPTER=mock`, `AI_ADAPTER=mock`), because the real ones only answer from inside the sandbox cluster. Every demo account's password is `demo1234`; the front end's one-click login uses `tolu@demo.ami`.

To point the front end at this server, start it with `NEXT_PUBLIC_API_URL=http://localhost:4000/api`.

## In the sandbox

Set `BANK_ADAPTER=xtradot`, `AI_ADAPTER=maas`, `GATEWAY_KEY` (from the `huawei-gateway` secret), `APP_URL=https://team04.xtradot.co`, `FRONTEND_URL=https://team04.xtradot.co`, `COOKIE_SECURE=true`, `ALLOW_PAYMENT_SIMULATION=false` and `WEBHOOK_URL=http://api.team04.svc.cluster.local:8080/api/hooks/forge`. Build with `docker build --platform linux/amd64`. The container runs migrations, then listens on port 8080.

## Endpoints

Everything is under `/api`.

| Area | Endpoints |
| --- | --- |
| Accounts | `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `GET /me`, `PATCH /me` |
| Videos | `GET /videos?q=&category=`, `GET /videos/:id`, `POST /videos`, `PATCH /videos/:id` |
| Licensing | `POST /checkout`, `GET /licences/:number`, `GET /licences/:number/download`, `GET /check/:number` |
| Payments | `GET /payments/callback` (bank redirect), `GET /payments/:reference`, `POST /payments/:reference/simulate` (demo only) |
| Library | `GET /library` |
| Payouts | `GET /banks`, `GET /payouts`, `POST /payouts/account/enquiry`, `PUT /payouts/account`, `POST /payouts` |
| Admin | `GET /admin`, `PATCH /admin/users/:id`, `PATCH /admin/videos/:id` |
| Bank webhooks | `POST /hooks/forge` (signed with HMAC-SHA256) |

Scheduled jobs re-check pending payments and payouts every minute, retry unprocessed webhooks every 5 minutes and expire licences hourly.
