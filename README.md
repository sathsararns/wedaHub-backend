# WedaHub Backend

Express 5 REST API + Socket.IO server. Owns all MongoDB access and proxies AI
chat requests to the `ai-service` (FastAPI). The frontend and the AI service
both talk to this backend — it is the only writer to the database.

## Prerequisites

- Node.js 18+
- Reachable MongoDB (Atlas cloud by default — no local DB needed)

## Setup

```bash
npm install
```

Create a `.env` file in this directory:

```env
MONGO_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=Cluster0"
JWT_SECRET_KEY="<long-random-secret>"
AI_SERVICE_URL=http://localhost:8000
```

## Run

```bash
npm start        # nodemon index.js — auto-reloads on change
```

Expect `MongoDB Connected Successfully!` and `Server running on 3000`.

## Test

```bash
npm test         # node --test tests/*.test.js
```

## API endpoints

Base URL: `http://localhost:3000`

| Mount | Router | Notes |
|---|---|---|
| `/api/users` | `routers/userRouter.js` | Register, login, profile |
| `/api/bookings` | `routers/bookingRouter.js` | CRUD + status updates, `POST /ai` for AI-created bookings |
| `/api/providers` | `routers/providerRouter.js` | Search, profile, ratings |
| `/api/reviews` | `routers/reviewRoutes.js` | Add / list provider reviews |
| `/api/ai` | `routers/aiRouter.js` | `POST /chat`, `POST /chat/stream`, `POST /chat/reset` → proxied to `AI_SERVICE_URL` via `services/aiService.js` |
| `/api/admin` | `routers/adminRouter.js` | Authenticated + admin-only |
| `/api/contact` | `routers/contactRoutes.js` | Authenticated |

Socket.IO is initialized in `socket.js` (`initSocket`) for realtime updates.

Auth: JWT bearer tokens, verified in `middlewares/authenticate.js`;
`middlewares/adminOnly.js` gates admin routes.

## Project structure

```text
backend/
  index.js               App entry: middleware, route mounts, Mongo connect, listen
  socket.js              Socket.IO setup
  routers/               One router per resource (user, booking, provider, review, ai, admin, contact)
  controllers/           Request handlers per resource
  services/              Business logic (aiService, bookingService, providerService)
  models/                Mongoose schemas (user, booking, review, ContactMessage)
  middlewares/           authenticate, adminOnly
  tests/                 node:test suites
```

## Troubleshooting

- `MongoDB Connection Error` — check `MONGO_URI`, Atlas IP whitelist, firewall/VPN.
  This app forces DNS to `8.8.8.8`/`1.1.1.1` (see `index.js`).
- AI chat 500s — is `ai-service` running at `AI_SERVICE_URL`?
- Frontend CORS errors — `origin` is allowlisted as `http://localhost:5173` in `index.js`;
  keep the frontend on that port.
