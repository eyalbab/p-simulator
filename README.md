# Phishing Simulation Platform

This monorepo contains a phishing simulation application with:

- `management-server` (NestJS, port `3000`) for auth and dashboard APIs
- `simulation-server` (NestJS, port `3001`) for email send + click tracking
- `frontend` (React + Vite + Tailwind + shadcn/ui, served on port `80` in Docker)
- MongoDB (`27017`) as shared persistence

The frontend talks only to `management-server`. The management service forwards send requests to the simulation service.

## Quick Start (Docker Compose)

### 1) Prepare environment files

```bash
cp management-server/.env.example management-server/.env
cp simulation-server/.env.example simulation-server/.env
cp .env.example .env
```

Update secrets before running:

- `management-server/.env`: `JWT_SECRET`, `SERVICE_API_KEY`
- `simulation-server/.env`: `SMTP_USER`, `SMTP_PASS`, `SERVICE_API_KEY`
- `.env` (root): `SERVICE_API_KEY` (used by Docker Compose for both servers)

> `SERVICE_API_KEY` must be identical in both servers — it authenticates management-to-simulation service calls.

### 2) Build and start all services

```bash
docker compose up --build
```

If your Docker installation uses the legacy binary, run:

```bash
docker-compose up --build
```

### 3) Open the app

- Frontend: `http://localhost`
- Management API: `http://localhost:3000`
- Simulation API / tracking: `http://localhost:3001`

## Manual Setup (No Docker)

### Prerequisites

- Node.js 20+
- npm 10+
- MongoDB 7+

### 1) Install dependencies

```bash
cd management-server && npm install
cd ../simulation-server && npm install
cd ../frontend && npm install
```

### 2) Configure environment files

```bash
cp management-server/.env.example management-server/.env
cp simulation-server/.env.example simulation-server/.env
cp frontend/.env.example frontend/.env
```

Recommended local values:

- `management-server/.env`
  - `MONGODB_URI=mongodb://localhost:27017/phishing-simulator`
  - `SIMULATION_SERVER_URL=http://localhost:3001`
  - `PORT=3000`
- `simulation-server/.env`
  - `MONGODB_URI=mongodb://localhost:27017/phishing-simulator`
  - `TRACKING_BASE_URL=http://localhost:3001`
  - `PORT=3001`
- `frontend/.env`
  - `VITE_MANAGEMENT_SERVER_URL=http://localhost:3000`

### 3) Run services

Start each service in a separate terminal:

```bash
cd management-server && npm run start:dev
cd simulation-server && npm run start:dev
cd frontend && npm run dev
```

Frontend dev URL: `http://localhost:5173`

## API Summary

### Management Server (`http://localhost:3000`)

- `POST /auth/register`
  - Body: `{ "name": string, "email": string, "password": string }`
  - Response: JWT token payload
- `POST /auth/login`
  - Body: `{ "email": string, "password": string }`
  - Response: JWT token payload
- `GET /phishing/attempts` (JWT required)
  - Response: list of phishing attempts
- `POST /phishing/attempts` (JWT required)
  - Body: `{ "recipientEmail": string, "emailContent": string }`
  - Response: created attempt from simulation service

### Simulation Server (`http://localhost:3001`)

- `POST /phishing/send`
  - Internal service-to-service endpoint used by management server
- `GET /phishing/track/:trackingId`
  - Public tracking endpoint rendered in the phishing email link
  - Updates attempt status to `clicked` and returns awareness HTML page

## Usage Notes

- Use a dedicated throwaway Gmail account with an app password for SMTP.
- In Docker, `SIMULATION_SERVER_URL` is wired to `http://simulation-server:3001`.
- For local dev, use `http://localhost:3001` in `management-server/.env`.
- `TRACKING_BASE_URL` should be externally reachable in real deployments so recipients can trigger tracking.
- Keep `.env` files local only; do not commit secrets.
