# SmartSolar SSMTS — Web Portal

> **Smart Solar Microgrid Transaction & Energy Trading System (SSMTS)**  
> Enterprise Frontend Portal for Decentralized Solar Energy Exchange and Autonomous Microgrid Operations.

---

## ⚡ Overview

**SmartSolar SSMTS** is an enterprise-grade web application built to monitor, manage, and facilitate decentralized renewable energy transactions within solar microgrids. It seamlessly connects with the **SmartSolarMicrogrid.API** backend to provide real-time visibility into grid nodes, automated 15-minute slot generation, energy reservations, prosumer accounts, and role-based operator controls.

---

## 🚀 Key Modules & Features

### 1. 🔐 Authentication & Session Persistence
- **JWT Authentication:** Secure token-based access with custom claims and expiration validation.
- **Session Rehydration:** Instant user rehydration from local cache on page reload with background token verification (`/api/v1/auth/me`).
- **Role-Based Access Control (RBAC):**
  - **Backoffice Admin:** Full administrative privileges across all modules (Users, Prosumers, Nodes, Reservations).
  - **Grid Operator:** Operational access focused on Nodes, Slot Generation, and Energy Slot Reservations.
- **Modern Split-Screen UI:** Minimalist, branded authentication interface with high-contrast inputs and instant validation.

### 2. 🌐 Microgrid Node Management
- Comprehensive overview of all operational hubs (Substations, Community Solar, Industrial Arrays).
- Detailed telemetry: Capacity (kW), Voltage rating (V), Node status (Active/Inactive), and GPS coordinates.
- Human-readable Node Codes (`SGH-KOL-001`) with automatic MongoDB `ObjectId` resolution.
- Live dynamic slot generation trigger per node.

### 3. ⏱️ Energy Slot Reservations
- 15-minute time-slot reservations (BR-01, BR-02, BR-03, BR-05 adherence).
- Real-time slot availability checking, automatic future slot filtering (`startUtc > now`).
- On-demand slot generation for hubs with empty schedules.
- Approval and status update workflows with dual ID support (`ObjectId` & `ReservationNo` e.g., `RSV-20260921-29474B`).

### 4. ⚡ Prosumer Management
- Profile management for clean energy producers and consumers.
- Smart Meter ID tracking and associated Grid Hub node linking.
- Feed-in tariff rates, consumption quotas, and account status toggles.

### 5. 👥 User Management
- Administrative creation and role assignment for Backoffice and Grid Operator accounts.
- Password policy enforcement (minimum 8 characters, uppercase letter, and digit).
- Activation and deactivation controls.

---

## 🛠️ Technology Stack

- **Framework:** React 19 + TypeScript
- **Bundler & Tooling:** Vite 8
- **Styling:** SCSS + Bootstrap 5 + Custom Design Tokens (Solar Amber / Orange theme)
- **Icons:** Lucide React
- **Routing:** React Router v7
- **HTTP Client:** Native Fetch with centralized RFC 7807 problem details error handling
- **State Management:** React Context (`AuthContext`)

---

## 📋 Prerequisites

Ensure you have the following installed on your environment:
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Backend API:** `SmartSolarMicrogrid.API` (.NET 8 + MongoDB running on `http://localhost:5000`)

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/SmartSolarMicrogrid/ssmts-web.git
cd ssmts-web
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (or copy from `.env.example`):
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### 4. Run Development Server
```bash
npm run dev
```
The application will be accessible at: `http://localhost:5174` (or `http://localhost:5173`).

### 5. Build for Production
```bash
npm run build
```
Generates production assets in the `dist/` directory.

---

## 🔑 Seeded Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Backoffice Admin** | `admin@solarmicrogrid.com` | `Admin@1234` |
| **Grid Operator** | `operator@solarmicrogrid.com` | `Operator@1234` |

---

## 🔗 Architecture & API Integration

The web application communicates with the following REST API endpoints:

- `POST /api/v1/auth/login` — Authenticate and obtain JWT
- `GET /api/v1/auth/me` — Retrieve active profile & validate token
- `GET/POST /api/v1/users` — User administration
- `GET/POST/PUT /api/v1/nodes` — Microgrid nodes
- `GET/POST /api/v1/nodes/{nodeId}/slots` — Slot inspection and on-demand generation
- `GET/POST /api/v1/reservations` — Energy booking & scheduling
- `POST /api/v1/reservations/{id}/approve` — Reservation approval workflow
- `GET/POST/PUT /api/v1/prosumers` — Prosumer accounts

---

## 📄 License

This project is developed as an academic enterprise application solution for **SLIIT SE Y4S2 — Enterprise Application Development**. All rights reserved.
