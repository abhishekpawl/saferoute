# SafeRoute MVP

Safety-first travel assistance MVP with a FastAPI backend and a React Native mobile client.

## Monorepo layout

- `backend/`: FastAPI API, PostgreSQL models, Redis-backed live location, WebSocket alerts
- `mobile/`: Expo React Native app for traveler and guardian flows
- `docker-compose.yml`: local PostgreSQL and Redis services

## MVP features included

- OTP-style auth flow scaffold with JWT sessions
- Traveler and guardian roles
- Guardian discovery by current map location
- Live location updates stored in Redis
- SOS event creation with real-time WebSocket fanout
- Guardian reviews and rating aggregation

## Quick start

### Infrastructure

```bash
docker compose up -d postgres redis
```

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

API docs will be available at `http://localhost:8000/docs`.

### Mobile

```bash
cd mobile
npm install
npm run start
```

The mobile client is configured for Expo SDK 54 / Expo Go.
For a physical device, point the mobile API base URL at your machine's LAN IP instead of `localhost`.

## Notes

- OTP delivery is scaffolded for development using Redis; production SMS delivery can be plugged in via Firebase Auth or Twilio.
- Guardian discovery currently uses Redis live locations plus an in-memory distance calculation; PostGIS can replace this later without changing the client contracts.
- The mobile map uses OpenStreetMap raster tiles, so no Google Maps API key is required for the MVP.
- Phone numbers are masked in guardian discovery responses to avoid direct contact sharing.
