# ResQFood — Architectural Hand-off Report

## 1. Project Vision

ResQFood addresses a critical inefficiency in the food supply chain: perfectly edible surplus food from commercial venues (weddings, hotels, hostels, bakeries) goes to waste while nearby communities face food insecurity. The platform creates a real-time logistics bridge between surplus sources and verified NGOs/volunteers, reducing landfill burden and feeding people in need.

**Core mission**: Reduce food waste through hyperlocal, tech-enabled matching and pickup logistics.

---

## 2. Technical Core Stack

### 2.1 Database Layer — MongoDB + Mongoose

**Why MongoDB**: The donation data model is inherently document-oriented — each listing is a self-contained record with nested metadata. MongoDB's schema flexibility allows rapid iteration on fields (e.g., adding dietary tags, photos, expiry windows) without migrations. The geospatial indexing capability (`2dsphere`) provides a direct upgrade path for proximity-based donor-NGO matching.

**Schema design** (`Donation.js`):
- `donorType`: Categorical enum enforcing data integrity at the database level
- `foodItems`, `quantity`, `location`: Core listing data with validation guards
- `status`: State-machine field (`Pending → Claimed → Completed`) enabling clear lifecycle tracking
- `timestamps`: Automatic `createdAt`/`updatedAt` for sorting and analytics

**Self-seeding mechanism**: On cold start, if the collection is empty, three realistic seed records are inserted. This ensures the frontend never renders an empty state during demonstrations or onboarding.

### 2.2 API Layer — Node.js + Express (Port 5001)

A lightweight, three-route REST API:

| Endpoint | Purpose | Validation |
|----------|---------|------------|
| `GET /api/donations` | Fetch active listings sorted by recency | Excludes `Completed` donations |
| `POST /api/donations` | Create new donation | Required fields, type enum, quantity bounds |
| `PATCH /api/donations/:id` | Transition status | ObjectId validation, status enum |

**Architecture decisions**:
- **CORS scoped** to `localhost:3000` for development safety
- **Custom middleware** for JSON parse error handling and response headers
- **Lean queries** (`.lean()`) for read performance — Mongoose documents are plain objects on read paths
- **Atomic status transitions** via `findByIdAndUpdate` with `{ new: true }` for optimistic UI updates

### 2.3 Presentation Layer — React 18 (Port 3000)

Functional component architecture using `useState` and `useEffect` with an 8-second polling interval for near-real-time feed updates. The UI is organized as an asymmetrical "Bento Grid" with three panels:

- **Panel A — Live Donation Engine**: Controlled form with dropdown, number input, and text inputs; fires `POST /api/donations` on submit.
- **Panel B — Real-time Broadcast Hub**: Scrollable feed of donation cards with micro-animations; each card exposes a contextual action button.
- **Panel C — NGO & Volunteer Nexus**: Static directory of four verified partner organizations with connection cards.

**Impact Accelerator**: Three live counters that animate on state transitions. Particle burst effects (14 particles in randomized directions) provide haptic visual feedback on every user action.

---

## 3. UX Engagement Psychology

The design employs several psychological principles to drive engagement:

| Principle | Implementation |
|-----------|---------------|
| **Endowment effect** | Users see their donation reflected instantly in counters — they "own" the impact |
| **Social proof** | Live feed shows others donating in real time |
| **Goal gradient** | Impact counters create a visible progress narrative |
| **Variable rewards** | Particle bursts and bounce animations provide unpredictable positive feedback |
| **Color psychology** | Emerald (trust/growth) + Amber (urgency/warmth) on dark slate (premium/trust) |

**Motion design**: The `cubic-bezier(0.16, 1, 0.3, 1)` easing curve creates an "overshoot-and-settle" feel that signals completion and satisfaction. Sequential `fadeSlideUp` animations with staggered delays create a cascading reveal that guides visual attention down the page.

---

## 4. Scalability & Integration Roadmap

### Phase 1 — Proximity Matching (Current Gap)
- Integrate MongoDB `2dsphere` geospatial indexes on `location` field
- Auto-geocode donor addresses via forward geocoding (Mapbox/Google Geocoding API)
- Implement `GET /api/donations/nearby?lng=X&lat=Y&radius=5km` for NGO/volunteer-facing queries

### Phase 2 — Real-time Notifications
- Integrate Twilio SMS API for instant alerts:
  - New donation within 5km → SMS to verified NGOs
  - Claim confirmation → SMS to donor + volunteer
  - Pickup reminder → SMS 30 min before scheduled window
- Server-Sent Events (SSE) as an alternative to polling for the frontend feed

### Phase 3 — Schedule & Routing
- Add optional pickup time window to donation schema
- Integrate Mapbox Directions API for volunteer route optimization
- Batch multiple nearby pickups into single volunteer routes

### Phase 4 — Analytics & Verification
- Admin dashboard with waste reduction metrics (kg CO₂ equivalent)
- Photo verification flow at pickup and delivery
- Reputation scoring for donors, NGOs, and volunteers

---

## 5. Security & Compliance Considerations

- Rate limiting on POST/PATCH endpoints to prevent abuse (express-rate-limit)
- Input sanitization against NoSQL injection via Mongoose schema strict mode
- Environment-based configuration for database credentials (already implemented via `.env`)
- GDPR-compliant data retention policy for donor/NGO records

---

## 6. Appendix — Dependency Graph

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (port 3000)              │
│  React 18 + functional hooks + pure CSS animations   │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP (fetch)
                       ▼
┌─────────────────────────────────────────────────────┐
│              Backend API (port 5001)                  │
│  Express 4 + CORS + validation middleware             │
└──────────────────────┬──────────────────────────────┘
                       │ Mongoose ODM
                       ▼
┌─────────────────────────────────────────────────────┐
│              MongoDB (port 27017)                     │
│  Donations collection → BSON documents                │
└─────────────────────────────────────────────────────┘
```

**Total dependencies**: 5 backend packages (express, mongoose, cors, dotenv) + 3 frontend packages (react, react-dom, react-scripts). Zero external UI libraries — all visual depth achieved through pure CSS.
