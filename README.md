# 🛒 PricePulse — Local Grocery Price Comparison System

**SWYNEX Internship — Task 01: Project Architecture**  
**Project:** PricePulse | **Type:** Full-stack web application | **Location:** Sri Lanka

> **Academic starter project, not a deployed production system.** Shop names and prices in the example seed file are fictional. They are **not real-time prices** and have not been verified with retailers.

## Project overview

PricePulse helps people compare community-reported prices of the **same grocery item and package size** across local shops. Visitors can search products and view the latest approved price at each shop. Signed-in users can submit prices; admins review reports before they appear publicly.

### Features included in the starter

- Responsive React home page and searchable product catalogue
- Product price comparison filtered by district
- Lowest reported price, price spread, and shop comparison bars
- User register/login using JSON Web Tokens (JWT) and bcrypt password hashes
- Price report submission and personal report status history
- Admin report approval/rejection
- PostgreSQL relational schema, indexes, and illustrative demo data
- REST API with basic validation, authorization, security headers, and rate limits
- Frontend **preview mode** (fictional prices) if the API is offline

### Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite 6, CSS, lucide-react |
| Backend | Node.js 20+, Express 5, REST/JSON |
| Database | PostgreSQL 14+ (`pg`) |
| Security starter | bcryptjs, JWT, Helmet, CORS, express-rate-limit, Zod |
| Version control | Git / GitHub |

## Architecture diagram

```mermaid
flowchart LR
  U[Guest / Registered User / Admin] --> FE[React frontend :5173]
  FE -->|HTTPS in production / REST JSON| API[Express API :4000]
  API --> AUTH[Auth & role checks]
  API --> VAL[Validation & business rules]
  AUTH --> PG[(PostgreSQL)]
  VAL --> PG
  PG --> API
  API --> FE
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full technical design, ER diagram, flows and decisions. See [docs/API.md](docs/API.md) for endpoints and example requests.

## Repository structure

```text
PricePulse-SWYNEX-Task01/
├── README.md
├── .gitignore
├── docs/
│   ├── ARCHITECTURE.md
│   └── API.md
├── database/
│   ├── schema.sql
│   └── seed.sql
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── test/
│   └── src/
│       ├── app.js
│       ├── index.js
│       ├── config/
│       ├── middleware/
│       ├── routes/
│       ├── scripts/
│       └── utils/
└── frontend/
    ├── .env.example
    ├── package.json
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── api.js
        ├── demoData.js
        ├── main.jsx
        └── styles.css
```

## Quick start — frontend preview without database

**Requirements:** Node.js v20 or newer, npm.

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The frontend loads **fictional preview data** if the API is not connected. Registration, submitting reports and admin actions require the backend/database. See the orange preview notice in the UI.

## Full local setup — Windows (PowerShell)

**Install:** Node.js 20+ and PostgreSQL 14+ (with `psql` on PATH). Open the **extracted project root directory** in VS Code.

### 1. Create a PostgreSQL database

From the project root in a terminal:

```powershell
psql -U postgres -c "CREATE DATABASE pricepulse;"
psql -U postgres -d pricepulse -f database/schema.sql
psql -U postgres -d pricepulse -f database/seed.sql
```

If `psql` is not recognized, use the PostgreSQL SQL Shell (psql), add PostgreSQL's `bin` directory to PATH, or use pgAdmin Query Tool to run `schema.sql` then `seed.sql` on a newly created `pricepulse` database. **Run seed.sql only once** on an empty database.

### 2. Configure and run the backend

```powershell
cd backend
Copy-Item .env.example .env
npm install
```

Edit `backend/.env` to set your actual local `DATABASE_URL`, for example:

```dotenv
PORT=4000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/pricepulse
JWT_SECRET=replace_this_with_your_own_long_random_secret_of_32_or_more_characters
CLIENT_ORIGIN=http://localhost:5173
```

If your PostgreSQL password contains special URI characters (`@`, `#`, `/`, `:`), percent-encode them in `DATABASE_URL`.

Start the API:

```powershell
npm run dev
```

Check **http://localhost:4000/api/health**. Expected: `{"status":"ok","app":"PricePulse API"}`.

### 3. Start the React app (second terminal)

From the project root, or open a new terminal in `frontend`:

```powershell
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173**. You should now be able to register, sign in, and submit a price report. Submitted reports remain **PENDING** until approved.

### 4. Optional: create an admin account

Edit `backend/.env` and set `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (strong password, 12+ characters). Then in `backend` run:

```powershell
npm run create-admin
```

Sign in via the frontend using those credentials. The **Admin** tab appears for review. The admin command is intended for local development: it updates the account's password and role when the email already exists. Never commit `.env` or publish passwords.

### 5. Tests and build

```powershell
# In backend/
npm test
# In frontend/
npm run build
```

## How price comparison works

1. A visitor chooses one product and optionally a district.
2. The frontend requests `GET /api/prices/compare?productId=1&district=Batticaloa`.
3. The backend selects the **latest approved report per shop** for that exact product row (size/brand/variant).
4. Shops are sorted by ascending price; the UI displays the price, location, and date observed.
5. Authenticated users can submit a new report. Admin approval is required before it appears in public results.

Prices are **community observations** — they are not live offers and can be outdated.

## Submission to SWYNEX (Task 01)

1. **Extract this ZIP** into a folder. Do not upload only the ZIP file as a GitHub repo; GitHub does not unpack it into source files.
2. Sign in at [github.com](https://github.com) and create a **public** repository named `SWYNEX-Project-Architecture`.
3. Upload all **extracted project contents** (README, `docs/`, `frontend/`, `backend/`, `database/`) via **Add file → Upload files**, or push using Git. Make sure `.env` and `node_modules` are **not** uploaded.
4. Verify `README.md` and `docs/ARCHITECTURE.md` display correctly on GitHub. Copy the repository URL.
5. Record a short screen explanation showing the repository, architecture diagram/README, database tables, APIs, and frontend preview. Create a LinkedIn video post and tag the **official @SWYNEX Technologies** page. Copy the published post URL.
6. In SWYNEX **Task 01**, paste the **GitHub URL** under *Task submission link* and **LinkedIn post URL** under *LinkedIn explanation post link*. Click **Submit Task**.

The deliverable is the **architecture and starter repository**, not a claim that a fully deployed production platform exists.

## Limitations / future work

This is an educational scaffold. Before a real public launch, add email verification, refresh-token rotation, persistent audit logs, explicit reviewer notes, evidence/receipt review, pagination, stronger automated integration/e2e tests, migrations, monitoring, moderation policies, hosting, and verified retailer data partnerships.

## License / usage

Created as an educational internship starter. Adapt to your assignment and credit any third-party packages used. Demo names/prices are invented.
