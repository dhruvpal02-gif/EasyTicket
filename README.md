# EasyTicket 🎟️

A simple event ticketing platform for small and local events — built as a MERN stack college project.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) |
| File Uploads | Multer |
| QR Codes | `qrcode` npm package |

## Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally (or a MongoDB Atlas URI)

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd EasyTicket
```

### 2. Set up the backend
```bash
cd server
cp .env.example .env        # fill in MONGO_URI and JWT_SECRET
npm install
npm run dev                 # runs on http://localhost:5000
```

### 3. Set up the frontend
```bash
cd client
npm install
npm run dev                 # runs on http://localhost:5173
```

The Vite dev server proxies all `/api` requests to `localhost:5000` automatically.

## Project Structure

```
EasyTicket/
├── client/               # React + Vite frontend
│   └── src/
│       ├── assets/       # Static images and icons
│       ├── components/   # Reusable UI components (Navbar, EventCard …)
│       ├── context/      # React Context (AuthContext)
│       ├── hooks/        # Custom React hooks (useAuth …)
│       ├── pages/        # One file per route/screen
│       ├── services/     # Axios API instance
│       ├── styles/       # Global CSS
│       └── utils/        # Date formatters, helpers
│
└── server/               # Express REST API
    ├── config/           # MongoDB connection (db.js)
    ├── controllers/      # Business logic (auth, event, ticket)
    ├── middleware/       # JWT guard, Multer upload config
    ├── models/           # Mongoose schemas (User, Event, Ticket)
    ├── routes/           # Express routers (authRoutes, eventRoutes …)
    ├── uploads/          # Uploaded files served as static assets
    └── utils/            # JWT token generator
```
