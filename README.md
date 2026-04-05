# SafeRoute

SafeRoute is a mobile-first travel safety and planning platform built for travelers who need trip assistance, trusted local support, and fast escalation tools in one experience. The project combines a React Native mobile app with a FastAPI backend, real-time location workflows, SOS coordination, ticket search redirects, and an AI-powered trip planner.

<p align="center">
  <img src="docs/screenshots/tickets.png" alt="Tickets screen" width="18%" />
  <img src="docs/screenshots/planner.png" alt="Planner screen" width="18%" />
  <img src="docs/screenshots/guardians.png" alt="Guardians screen" width="18%" />
  <img src="docs/screenshots/safety.png" alt="Safety screen" width="18%" />
  <img src="docs/screenshots/profile.png" alt="Profile screen" width="18%" />
</p>

## Overview

SafeRoute is designed around three primary actors:

- `Traveler`: the main user planning trips, tracking movement, and triggering SOS alerts
- `Guardian`: a verified local helper visible on the map
- `System`: the backend services responsible for authentication, live location, alerts, and planning responses

The current MVP includes:

- OTP-style authentication with JWT sessions
- Guardian discovery on a live map
- Redis-backed live location updates
- SOS creation and real-time event delivery
- Basic trust layer with ratings and reviews
- Ticket comparison for air, train, and bus with provider redirects
- AI trip planner with `Safe` and `General` modes

## Tech Stack

### Mobile

- React Native
- Expo SDK 54
- TypeScript
- React Navigation
- OpenStreetMap tiles via `react-native-maps`

### Backend

- FastAPI
- SQLAlchemy
- PostgreSQL
- Redis
- WebSockets
- Pydantic Settings

### AI

- OpenAI API
- `gpt-5-mini` by default for planner responses

### Infra

- Docker Compose for local PostgreSQL and Redis
- Render, Neon, and Upstash are suitable low-cost deployment options for this repo structure

## Key Features

### Safety Workflows

- Real-time live location sharing
- SOS trigger flow with persistent event creation
- WebSocket-based activity feed and location acknowledgements
- Guardian discovery based on current user location

### Planning Workflows

- Multi-turn trip planning chat
- `Safe` mode for risk-aware travel recommendations
- `General` mode for itinerary and destination planning
- Follow-up question support using prior trip context

### Travel Discovery

- Ticket search across air, train, and bus categories
- Redirect-based comparison flow for provider handoff
- Provider-ready architecture for future API or MCP integration

## Architecture

```text
[ Expo React Native App ]
          |
          v
[ FastAPI API Layer ]
    |        |        |
    v        v        v
PostgreSQL  Redis   WebSockets
```

### Data Responsibilities

- `PostgreSQL`: users, guardian profiles, reviews, SOS events
- `Redis`: OTP storage, live locations, high-frequency state
- `WebSockets`: live activity and tracking events

## Repository Structure

```text
.
├── backend/              # FastAPI backend
├── mobile/               # Expo React Native app
├── docker-compose.yml    # Local Postgres + Redis
└── README.md
```

## Getting Started

### Prerequisites

- Python `3.12+`
- Node.js `18+`
- npm
- Docker Desktop
- Expo Go or a local simulator/emulator

### 1. Start Local Infrastructure

```bash
docker compose up -d postgres redis
```

This starts:

- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

### 2. Configure and Run the Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
APP_NAME=SafeRoute API
ENVIRONMENT=development
SECRET_KEY=change-me
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/saferoute
REDIS_URL=redis://localhost:6379/0
CORS_ORIGINS=http://localhost:19006,http://localhost:8081,http://localhost:3000
DEFAULT_OTP_CODE=123456
OTP_EXPIRY_SECONDS=300
GUARDIAN_DISCOVERY_RADIUS_KM=10
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
```

Run the API:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend endpoints will be available at:

- API base: `http://localhost:8000/api/v1`
- Swagger docs: `http://localhost:8000/docs`

### 3. Configure and Run the Mobile App

```bash
cd mobile
npm install
```

Create `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Start Expo:

```bash
npm run start -- --clear
```

### 4. Local Device Networking

If you are testing on a real phone, `localhost` will not work.

Update `mobile/.env` to use your machine's LAN IP:

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:8000/api/v1
```

Make sure the backend is started with:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Environment Variables

### Backend

| Variable | Required | Description |
|---|---:|---|
| `APP_NAME` | No | FastAPI app title |
| `ENVIRONMENT` | No | `development` or `production` |
| `SECRET_KEY` | Yes | JWT signing secret |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Session duration |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |
| `DEFAULT_OTP_CODE` | No | Development OTP override |
| `OTP_EXPIRY_SECONDS` | No | OTP lifetime |
| `GUARDIAN_DISCOVERY_RADIUS_KM` | No | Nearby guardian search radius |
| `OPENAI_API_KEY` | No | Enables planner chat |
| `OPENAI_MODEL` | No | Planner model, defaults to `gpt-5-mini` |

### Mobile

| Variable | Required | Description |
|---|---:|---|
| `EXPO_PUBLIC_API_URL` | Yes | Base URL for the FastAPI backend |

## Core API Surface

The backend is mounted under `/api/v1`.

### Auth

- `POST /auth/request-otp`
- `POST /auth/verify-otp`

### Guardians and Location

- `GET /guardians/nearby`
- `POST /locations/me`
- `GET /users/me`

### Safety

- `POST /sos/trigger`
- `WS /ws/realtime`

### Reviews

- `POST /reviews`
- `GET /reviews/guardian/{id}`

### Tickets

- `POST /tickets/search`

### Planner

- `POST /planner/chat`

## Product Notes

### Planner

- Planner calls are routed through the backend so the OpenAI API key stays server-side.
- `Safe` mode emphasizes location choice, movement strategy, night safety, transport reliability, and risk-aware planning.
- `General` mode emphasizes itinerary, pacing, experiences, transport, and budget.
- Off-topic prompts are redirected back to trip planning.

### Maps

- The app uses OpenStreetMap tiles for development and MVP use.
- For production traffic, use a proper tile provider or hosted tile service.

### Ticket Search

- The current flow is redirect-based and does not yet fetch live provider fares.
- It is structured to support official provider APIs or MCP-based adapters later.

### Auth

- OTP is currently development-oriented.
- `DEFAULT_OTP_CODE=123456` is useful for local testing.
- A production release should replace this with a real SMS or auth provider.

## Deployment Notes

This repository can be deployed as a monorepo.

Recommended practical setup:

- `backend/` -> Render or AWS
- PostgreSQL -> Neon or RDS
- Redis -> Upstash or ElastiCache
- `mobile/` -> Expo EAS Build

High-level sequence:

1. Deploy PostgreSQL and Redis
2. Deploy the FastAPI backend
3. Point `EXPO_PUBLIC_API_URL` to the live backend
4. Build mobile binaries with Expo EAS

## Current Limitations

- OTP auth is still a development scaffold
- Push notifications are not fully wired
- Ticket results are redirect-only, not live fare aggregation
- Guardian discovery is MVP-grade and does not yet use PostGIS
- This should not be treated as production-ready emergency infrastructure

## Roadmap

- Production auth via Twilio or Firebase
- Push notifications for SOS escalation
- PostGIS-powered geo queries
- Persistent location history
- Official provider integrations for fares
- Admin workflow for guardian verification
- Richer trust and moderation systems

## Screens Included In The MVP

- Tickets
- Planner
- Nearby Guardians
- Safety Center
- Profile

## Contributing

This project is currently structured as a single monorepo for fast iteration across backend and mobile. If you extend it:

- keep backend and mobile contracts in sync
- avoid committing real secrets
- prefer official partner APIs over scraping for travel providers

## License

No license has been specified yet. Add a license before open-sourcing or distributing beyond private use.
