# WedaHub Backend

Express 5 REST API + Socket.IO server. Owns all MongoDB access and proxies AI
chat requests to the `ai-service` (FastAPI). The frontend and the AI service
both talk to this backend — it is the only writer to the database.

## Prerequisites

- Node.js 22.x
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
FRONTEND_URL=http://localhost:5173
```

## Run

```bash
npm start        # production: node index.js
npm run dev      # development: nodemon index.js
```

The server connects to MongoDB before listening. `GET /health` returns 200 when
MongoDB is connected, or 503 when disconnected.

## Deploy to Render

Use the included `render.yaml` as a Blueprint, or create a Free Node web service
with build command `npm ci`, start command `npm start`, and health path `/health`.
Commit `package-lock.json`. Set `NODE_ENV=production`, `MONGO_URI`,
`JWT_SECRET_KEY`, `FRONTEND_URL` (Vercel origin), and `AI_SERVICE_URL` (public
FastAPI URL). Render provides `PORT`. Use `.env.example` for local settings.

`FRONTEND_URL` accepts comma-separated exact origins and controls both REST and
Socket.IO CORS. Production startup rejects missing deployment settings.

See [the complete deployment guide](../DEPLOYMENT.md) in the WedaHub workspace.

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
  index.js               Environment validation, Mongo connect, listen
  app.js                 Express middleware, health checks, route mounts
  config.js              Environment loading and shared CORS settings
  socket.js              Socket.IO setup
  routers/               One router per resource (user, booking, provider, review, ai, admin, contact)
  controllers/           Request handlers per resource
  services/              Business logic (aiService, bookingService, providerService)
  models/                Mongoose schemas (user, booking, review, ContactMessage)
  middlewares/           authenticate, adminOnly
  tests/                 node:test suites
```

## Troubleshooting

- MongoDB connection failure — check `MONGO_URI`, Atlas network access, firewall/VPN.
  System DNS is used by default. For local DNS issues, optionally set
  `DNS_SERVERS=8.8.8.8,1.1.1.1`.
- AI chat 500s — is `ai-service` running at `AI_SERVICE_URL`?
- Frontend CORS errors — set `FRONTEND_URL` to the frontend's exact origin. Local
  development defaults to `http://localhost:5173`.
