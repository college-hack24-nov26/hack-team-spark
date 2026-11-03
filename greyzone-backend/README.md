# GREYZONE Backend — Detect. Defend. Alert.

Node.js / Express / MongoDB backend for a **safe, simulated** autonomous cyber-defence hackathon demonstration.

## Requirements
- Node.js 20+ (Node.js 22 LTS recommended)
- npm
- MongoDB Community Server running locally

## Setup
```bash
npm install
cp .env.example .env   # Windows PowerShell: Copy-Item .env.example .env
npm run dev
```
API: `http://localhost:5000` · Health: `GET /api/health`.

## Demo request
```bash
curl -X POST http://localhost:5000/api/scenarios -H "Content-Type: application/json" -d '{"scenario":"brute_force","sourceIp":"198.51.100.7","target":"demo-login"}'
```
PowerShell alternative:
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/scenarios -Method Post -ContentType 'application/json' -Body '{"scenario":"brute_force","sourceIp":"198.51.100.7","target":"demo-login"}'
```

## Endpoints
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Server health / detector mode |
| POST | `/api/events` | Submit event (`type`, `sourceIp`, `target`) |
| POST | `/api/scenarios` | Run demo (`scenario`, `sourceIp`, `target`) |
| GET | `/api/incidents?limit=25` | Recent incidents |
| GET | `/api/incidents/:id` | Incident with actions and alerts |
| GET | `/api/alerts` | Recent alerts |
| PATCH | `/api/alerts/:id/acknowledge` | Acknowledge alert |
| GET | `/api/status` | Dashboard summary |
| GET | `/api/blocked-sources` | Simulated blocklist |

Supported event/scenario types: `normal_traffic`, `port_scan`, `brute_force`, `ddos`, `suspicious_login`, `malware_beacon`.

## Detection engine integration
By default, deterministic demo scoring runs offline. To use a teammate's detection engine, set `DETECTION_URL` in `.env` to its HTTP endpoint. The backend POSTs `{type,sourceIp,target}` and expects `{score: 0..100 integer, reason: string}`. The backend sets severity, orchestrates simulated containment, verifies the virtual blocklist, and persists the workflow in MongoDB with compensating cleanup if a write fails. The detector must be trusted; use an internal URL only.

## Important scope and safety
- This project does **not** inspect real packets or modify actual firewall rules.
- The virtual blocklist demonstrates containment workflow, not real network protection.
- `/api/status` reports the simulated incident state, not real network health.
- For local demo use only: no authentication, rate limiting, or production-grade authorization is implemented. Do not expose it to the public internet without hardening.

## Tests
MongoDB must be running. Tests use a uniquely named `greyzone_test_*` database and drop only that test database.

```bash
npm test
```
