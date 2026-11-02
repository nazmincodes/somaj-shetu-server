# Shomaj Setu — Server*

Express + MongoDB REST API for the Shomaj Setu social development events platform.
Protected routes verify the JWT issued by BetterAuth (client app) through its JWKS endpoint.

## Setup
1. `npm install`
2. Fill the values in `.env` (names are already there):
   - `PORT` – e.g. 5000
   - `MONGODB_URI` – your MongoDB connection string
   - `DB_NAME` – database name (use the same one as the client `MONGODB_DB`)
   - `CLIENT_URL` – URL of the Next.js client (no trailing slash)
3. `npm run dev` (or `npm start`)
4. Optional sample data: `npm run seed`

## Endpoints
| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/events?limit&search&type&sort` | Public | Upcoming events only |
| GET | `/events/:id` | Public | Event details |
| GET | `/events/mine` | JWT | Events created by me |
| POST | `/events` | JWT | Create event (validated, future date only) |
| PUT | `/events/:id` | JWT + owner | Update event |
| DELETE | `/events/:id` | JWT + owner | Delete event and its joins |
| GET | `/joins/me` | JWT | Events I joined, sorted by date |
| GET | `/joins/status/:eventId` | JWT | Did I join this event? |
| POST | `/joins/:eventId` | JWT | Join an event |
| DELETE | `/joins/:eventId` | JWT | Leave an event |

## Deploy (Vercel)
`vercel.json` is included. Add the four env variables in the Vercel dashboard and allow
Vercel to reach MongoDB Atlas (Network Access → `0.0.0.0/0`).
