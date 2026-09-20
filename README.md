# Colombo Stock Exchange (CSE) Demo Stock Trading Platform

A full-stack, institutional-grade demo stock trading platform designed for Sri Lankan equities. Retail users can practice trading Colombo Stock Exchange (CSE) listed equities with Rs. 1,000,000 virtual capital in real-time or off-hours, while exchange administrators have global visibility over market operations and user portfolios.

---

## Key Features

- **All 285 CSE Listed Equities**: Complete catalog of CSE stocks across 14 industry sectors (Banking, Diversified Financials, Capital Goods, Food & Beverage, Telecommunications, etc.).
- **Real-Time Live CSE Feed & Ticker Simulation**:
  - Automatically fetches live price ticks and index data from CSE official endpoints.
  - Built-in realistic tick simulation fallback maintaining realistic Sri Lankan market spreads.
- **Accurate CSE Indices**: Real-time tracking of the All Share Price Index (**ASPI**) and **S&P SL20**.
- **Market Hours Engine**:
  - Validates official Sri Lanka Standard Time (**SLT UTC+5:30**, 9:30 AM – 2:30 PM).
  - Off-hours orders are queued as `QUEUED` and automatically executed on next market open.
  - Admin demo override toggle to test live matching during off-market hours.
- **Strict CSE 1.12% Transaction Fee Structure**:
  - Automatically calculates and enforces the standard CSE composite fee:
    - Brokerage: 0.640%
    - SEC Cess: 0.072%
    - CDS Fee: 0.024%
    - Share Transaction Levy: 0.300%
    - **Total: 1.120%**
- **Virtual Portfolio Management**:
  - Rs. 1,000,000.00 virtual capital automatically allocated to every new account.
  - Realized & Unrealized P&L tracking, weighted average cost basis, and available cash balance locking.
- **Exchange Admin Dashboard**:
  - Global leaderboard of top-performing traders.
  - System-wide volume, total virtual capital deployed, and most traded equities.
  - User ledger inspection and market session control.
- **Real-Time WebSockets**: Powered by Socket.IO for instant live order execution alerts and tick-by-tick market feed streaming.

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide React, Socket.IO Client.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, Socket.IO.
- **Database**: SQLite (Zero-config local development) / PostgreSQL (via Docker Compose for production).

---

## Quick Start (Windows)

Simply double-click:
```bat
start-cse-platform.bat
```
This will start both the backend API (`http://localhost:5000`) and frontend web app (`http://localhost:3000`), then automatically open your browser.

To stop the servers anytime, run:
```bat
stop-cse-platform.bat
```

---

## Manual Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/cse-demo-trading.git
cd cse-demo-trading
```

### 2. Backend Setup
```bash
cd backend
npm install

# Initialize Prisma Database & Seed 285 Stocks + Demo Accounts
npx prisma db push
npm run seed

# Build & Start Backend
npm run build
npm start
```
*Backend API will run at `http://localhost:5000`.*

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Build & Start Next.js
npm run build
npm start
```
*Frontend Trading Terminal will run at `http://localhost:3000`.*

---

## Default Credentials

| Role | Email | Password |
|---|---|---|
| **Demo Trader** | `trader1@demo.lk` | `Trader@1234` |
| **Exchange Admin** | `admin@cse.lk` | `Admin@1234` |

---

## License
MIT
