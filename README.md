# ResQFood — Rescue Surplus, Feed Hope

A full-stack web platform that connects food donors (wedding halls, hotels, hostels, bakeries) directly with nearby NGOs and independent volunteers for swift food pickup and redistribution.

---

## Local Deployment Guide (macOS)

### Prerequisites

- **Node.js** v18+ — [Download](https://nodejs.org/)
- **MongoDB** Community Edition — [Install via Homebrew](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/)

### Step 1: Start MongoDB

Open **Terminal 1** and start the MongoDB daemon:

```bash
brew services start mongodb-community
```

Verify it's running:

```bash
mongosh --eval "db.adminCommand('ping')"
```

You should see `{ ok: 1 }`.

### Step 2: Start the Backend API Server

Open **Terminal 2** and run:

```bash
cd resqfood-app/backend
npm install
npm start
```

Expected output:

```
Connected to MongoDB
Seeded 3 initial donations
ResQFood API running on http://localhost:5001
```

### Step 3: Start the Frontend React App

Open **Terminal 3** and run:

```bash
cd resqfood-app/frontend
npm install
npm start
```

The app will open automatically at [http://localhost:3000](http://localhost:3000).

> **Note:** When prompted `Would you like to run this app on port 3000?`, type `Y`.

### Step 4: Use the App

1. **Donate Food** — Fill out the "Live Donation Engine" form and submit.
2. **Accept Pickup** — Click "Accept Pickup Mission" on any pending donation card.
3. **Track Impact** — Watch the "Impact Accelerator" counters animate in real time.

---

## Project Structure

```
resqfood-app/
├── backend/
│   ├── models/
│   │   └── Donation.js          # Mongoose schema
│   ├── .env                      # Environment config
│   ├── server.js                 # Express API server (port 5001)
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js                # Main React component
│   │   ├── App.css               # All styles & animations
│   │   └── index.js              # React entry point
│   └── package.json
├── README.md
└── REPORT.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/donations` | Fetch all active donations (sorted newest first) |
| POST | `/api/donations` | Create a new donation listing |
| PATCH | `/api/donations/:id` | Update donation status (Pending → Claimed → Completed) |

---

## Troubleshooting

**MongoDB connection refused**: Ensure MongoDB is running (`brew services start mongodb-community`).

**Port already in use**: Kill the process using port 5001 or 3000:
```bash
lsof -ti:5001 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

**CORS errors**: Verify the backend is running on port 5001 and the frontend on port 3000.
