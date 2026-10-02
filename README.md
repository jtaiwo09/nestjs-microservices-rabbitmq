# NestJS Microservices — E-Commerce Platform

A production-pattern microservices application built with NestJS, RabbitMQ, and PostgreSQL. Implements both **choreography** and **orchestration** saga patterns for distributed transaction management across independent services.

---

## Architecture

```
                          ┌──────────────────┐
                          │   API Gateway    │  :3002
                          │  (HTTP / REST)   │
                          └────────┬─────────┘
                                   │
                        RabbitMQ topic exchange
                        (ecommerce.events :5672)
                                   │
         ┌─────────────────────────┼──────────────────────┐
         │                         │                      │
┌────────▼───────┐       ┌─────────▼──────┐    ┌──────────▼─────┐
│ users-service  │       │ orders-service │    │ email-service  │
│                │       │                │    │                │
│  users_db      │       │  orders_db     │    │  (no database) │
└────────────────┘       └───────┬────────┘    └────────────────┘
                                 │
               ┌─────────────────┴──────────────────┐
               │                                    │
    ┌──────────▼──────────┐            ┌────────────▼──────┐
    │  inventory-service  │            │  payment-service  │
    │                     │            │                   │
    │  inventory_db       │            │  payments_db      │
    └─────────────────────┘            └───────────────────┘
```

**Services:**

| Service | Port | Responsibilities |
|---|---|---|
| `api-gateway` | `3002` | HTTP entry point — JWT auth, request routing, Google OAuth |
| `orders-service` | — | Order lifecycle, choreography saga listener, orchestration saga coordinator |
| `inventory-service` | — | Stock reservation and release, transactional outbox |
| `payment-service` | — | Payment processing (simulated) |
| `users-service` | — | User accounts, credentials, refresh tokens |
| `email-service` | — | Email notifications (stub — extend as needed) |

No service reads from another service's database. All inter-service communication goes through RabbitMQ.

---

## Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 22 |
| pnpm | 9 |
| Docker + Docker Compose | any recent |

Install pnpm if you do not have it:

```bash
npm install -g pnpm
```

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd nest-microservices-course
pnpm install
```

### 2. Start infrastructure

```bash
docker-compose up -d
```

This starts:

- **PostgreSQL** on `localhost:5432` — a single instance. An init script creates all four databases (`users_db`, `orders_db`, `payments_db`, `inventory_db`) automatically on first boot.
- **RabbitMQ** on `localhost:5672` — management UI available at `http://localhost:15672`.

> RabbitMQ credentials: username `app`, password `app`

### 3. Configure environment variables

Each service ships with a `.env.example`. Copy each one to `.env`:

```bash
cp apps/api-gateway/.env.example       apps/api-gateway/.env
cp apps/users-service/.env.example     apps/users-service/.env
cp apps/orders-service/.env.example    apps/orders-service/.env
cp apps/payment-service/.env.example   apps/payment-service/.env
cp apps/inventory-service/.env.example apps/inventory-service/.env
cp apps/email-service/.env.example     apps/email-service/.env
```

**`apps/api-gateway/.env` — required changes:**

Generate two independent secrets for JWT signing:

```bash
openssl rand -base64 64
```

Run it twice and paste the outputs into `JWT_SECRET` and `JWT_REFRESH_SECRET`.

Google OAuth is optional. Leave the placeholder values in place to disable it, or create OAuth 2.0 credentials in [Google Cloud Console](https://console.cloud.google.com) and set the authorised redirect URI to `http://localhost:3002/auth/google/callback`.

All other services work with the default values in `.env.example` unchanged.

### 4. Run database migrations

Each service that owns a database must apply its migrations before starting:

```bash
pnpm --filter users-service     exec prisma migrate deploy
pnpm --filter orders-service    exec prisma migrate deploy
pnpm --filter payment-service   exec prisma migrate deploy
pnpm --filter inventory-service exec prisma migrate deploy
```

### 5. Seed the inventory

The inventory service needs product data before orders can be placed:

```bash
pnpm --filter inventory-service exec prisma db seed
```

This creates a set of products with randomised stock quantities. The seed script is idempotent — running it again skips products that already exist.

### 6. Start all services

```bash
pnpm dev
```

Turbo starts every service in watch mode with live reload. Output from all services is streamed to the same terminal with service-name prefixes. The API gateway is ready when its log shows it is listening on port `3002`.

---

## API Reference

Base URL: `http://localhost:3002`

### Authentication

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| `POST` | `/auth/register` | No | Create a new user account |
| `POST` | `/auth/login` | No | Login with email and password |
| `POST` | `/auth/refresh` | Refresh token | Get a new access token |
| `POST` | `/auth/logout` | Bearer | Invalidate the current refresh token |
| `GET` | `/auth/google` | No | Start Google OAuth flow |
| `GET` | `/auth/google/callback` | No | Google OAuth redirect handler |

**Register:**

```json
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password",
  "firstName": "Jane",
  "lastName": "Doe"
}
```

**Login:**

```json
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

Response:

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

### Orders

All order endpoints require a Bearer access token in the `Authorization` header.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/orders` | Place a new order |
| `GET` | `/orders/:id/saga` | Get the saga execution state for an order |

**Place an order:**

```json
POST /orders
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "items": [
    {
      "productId": "<uuid-from-seed>",
      "quantity": 2,
      "unitPrice": 49.99
    }
  ],
  "totalAmount": 99.98,
  "currency": "USD"
}
```

Response:

```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING"
}
```

The order is created synchronously. The saga that confirms or cancels it runs in the background — use `GET /orders/:id/saga` to check progress.

**Get saga state:**

```json
GET /orders/550e8400-e29b-41d4-a716-446655440000/saga
Authorization: Bearer <accessToken>
```

Response:

```json
{
  "id": "...",
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "step": "COMPLETED",
  "status": "COMPLETED",
  "createdAt": "2026-10-02T10:00:00.000Z",
  "updatedAt": "2026-10-02T10:00:03.412Z"
}
```

Possible `step` values: `STARTED` · `RESERVING_INVENTORY` · `PROCESSING_PAYMENT` · `RELEASING_INVENTORY` · `COMPLETED` · `FAILED`

Possible `status` values: `RUNNING` · `COMPLETED` · `FAILED` · `TIMED_OUT`

---

## How It Works

### Order fulfillment — choreography saga

```
POST /orders
  └─► orders-service  creates order in DB
                       emits: order.created
        └─► inventory-service  reserves stock in DB
                                emits: inventory.reserved
              └─► payment-service  processes payment in DB
                                    emits: payment.completed
                    └─► orders-service  updates order → CONFIRMED
```

Each service reacts to the previous event. If inventory fails, orders-service cancels. If payment fails, inventory-service releases the reservation and orders-service cancels.

### Order fulfillment — orchestration saga

The `OrderSagaOrchestrator` inside `orders-service` drives the same flow centrally using RPC (`send`) instead of events (`emit`). It persists saga state to the database at every step. See `output/module-02/README.md` for the detailed lesson.

### Transactional outbox (inventory service)

When inventory reserves stock, the `inventory.reserved` event payload is written to an `OutboxEvent` table inside the same database transaction. A background processor (`OutboxProcessorService`) polls every 5 seconds for unpublished events, publishes them to RabbitMQ, and marks them as published. This guarantees the event is never silently dropped even if the service restarts between the DB write and the publish.

---

## Project Structure

```
.
├── apps/
│   ├── api-gateway/          # HTTP entry point — auth, routing
│   ├── orders-service/       # Orders + saga orchestrator + saga controller
│   ├── inventory-service/    # Stock management + outbox processor
│   ├── payment-service/      # Payment processing
│   ├── users-service/        # Users + refresh tokens
│   └── email-service/        # Email stub
├── libs/
│   ├── common/               # Shared constants, DTOs, RabbitMQ client configs
│   ├── auth/                 # AuthenticatedMessage type (shared across services)
│   └── config/               # Shared ConfigService wrapper
├── scripts/
│   └── init-dbs.sql          # Runs once on first Docker boot — creates all databases
└── docker-compose.yml        # PostgreSQL + RabbitMQ
```

---

## Development

### Add a database migration

```bash
pnpm --filter <service-name> exec prisma migrate dev --name <description>
pnpm --filter <service-name> exec prisma generate
```

Example:

```bash
pnpm --filter orders-service exec prisma migrate dev --name add-saga-state
pnpm --filter orders-service exec prisma generate
```

### Run a single service

```bash
pnpm --filter api-gateway dev
pnpm --filter orders-service dev
```

### Inspect RabbitMQ

Open `http://localhost:15672` (user: `app`, pass: `app`) to see queues, exchanges, bindings, and message rates. Useful for verifying that events are being published and consumed correctly.

---

## Environment Variable Reference

### `apps/api-gateway`

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | No | `development` or `production` |
| `PORT` | No | HTTP port (default: `3002`) |
| `RABBITMQ_URL` | Yes | RabbitMQ connection string |
| `JWT_SECRET` | Yes | Secret for signing access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens (min 32 chars) |
| `JWT_EXPIRES_IN` | Yes | Access token TTL (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Yes | Refresh token TTL (e.g. `7d`) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | No | OAuth redirect URI |

### `apps/users-service` / `apps/orders-service` / `apps/payment-service` / `apps/inventory-service`

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | No | `development` or `production` |
| `RABBITMQ_URL` | Yes | RabbitMQ connection string |
| `DATABASE_URL` | Yes | PostgreSQL connection string |

### `apps/email-service`

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | No | `development` or `production` |
| `RABBITMQ_URL` | Yes | RabbitMQ connection string |
