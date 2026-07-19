# Cadence — Music Practice & Progress Tracker

A full-stack MERN app for logging practice sessions, tracking goals, and visualizing progress over time.

## Tech stack

- **Frontend:** React 18 + Vite, React Router, Axios — plain CSS design system (no UI framework)
- **Backend:** Node.js + Express.js, REST API
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (JSON Web Tokens) + bcrypt password hashing

## Project structure

```
music-practice-tracker/
├── backend/
│   ├── config/db.js              # MongoDB connection
│   ├── models/                   # User, PracticeSession, Goal schemas
│   ├── routes/                   # auth, sessions, goals REST endpoints
│   ├── middleware/authMiddleware.js
│   ├── server.js                 # Express app entry point
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/axios.js          # Axios instance + auth token interceptor
    │   ├── context/AuthContext.jsx
    │   ├── components/           # Layout, cards, modal, waveform progress bar
    │   ├── pages/                # Login, Signup, Dashboard, Sessions, Calendar, Goals
    │   └── index.css             # Design tokens & component styles
    └── .env.example
```

## Setup

### Prerequisites

- Node.js 18+
- A MongoDB database — either a local install (`mongodb://127.0.0.1:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set:
- `MONGO_URI` — your MongoDB connection string
- `JWT_SECRET` — any long random string (used to sign login tokens)

Then start the server:

```bash
npm run dev      # with nodemon, auto-restarts on changes
# or
npm start
```

The API runs at `http://localhost:5000`.

### 2. Frontend

In a new terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:5173` and talks to the API via `VITE_API_URL` in `.env`.

### 3. Create an account

Open `http://localhost:5173`, click **Sign up**, and create your first account. You'll land on the dashboard, where a default goal (30 minutes/day) is created automatically — you can change it any time on the **Goal** page.

## API overview

All `/api/sessions` and `/api/goals` routes require an `Authorization: Bearer <token>` header, obtained from `/api/auth/login` or `/api/auth/signup`.

| Method | Endpoint             | Description                                   |
|--------|-----------------------|------------------------------------------------|
| POST   | `/api/auth/signup`    | Create a new account                           |
| POST   | `/api/auth/login`     | Log in, returns a JWT                          |
| GET    | `/api/auth/me`        | Get the current logged-in user                 |
| GET    | `/api/sessions`       | List sessions (`?search=` and `?date=` filters)|
| GET    | `/api/sessions/stats` | Dashboard stats + recent sessions              |
| POST   | `/api/sessions`       | Create a session                               |
| PUT    | `/api/sessions/:id`   | Update a session                               |
| DELETE | `/api/sessions/:id`   | Delete a session                               |
| GET    | `/api/goals`          | Get current goal + progress                    |
| PUT    | `/api/goals`          | Create/update goal (`type`, `targetMinutes`)   |

## Design notes

The UI uses a warm "studio" palette — amethyst violet, brass amber, and sage — on a soft parchment-violet background, with Fraunces (display serif) for headings and Plus Jakarta Sans for body text. The goal-progress bar is styled as a waveform/equalizer to tie the visual language back to music practice. Everything is light-themed, card-based, and responsive down to mobile (sidebar collapses to a slide-out drawer under 900px).

## Notes for going to production

- Set a strong, unique `JWT_SECRET`
- Restrict CORS (`CLIENT_URL`) to your deployed frontend domain
- Use MongoDB Atlas or a managed Mongo instance rather than a local database
- Serve the frontend build (`npm run build` in `frontend/`) via a static host or CDN, and point `VITE_API_URL` at your deployed API
