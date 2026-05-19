# 🚀 Elétron - IT Asset Management System (MVP)

A lightweight and robust internal IT asset management system designed to track hardware inventory (notebooks), maintain employee assignment histories, and generate compliance/responsibility terms.

---

## 📌 Project Architecture & Database Schema

Since this is an MVP database snapshot, the relational structure is mapped below using standard entity relationships. The backend communicates with a PostgreSQL database via Prisma ORM.

### Database Flow & Schema Diagram

    +-----------------------+              +-----------------------+
    |      Equipamento      |              |       Historico       |
    +-----------------------+              +-----------------------+
    | id (UUID)         [PK]| <----------+ | id (UUID)         [PK]|
    | patrimonio (String)   |            | | equipamentoId(UUID)[FK]|
    | modelo (String)       |            | | colaborador (String)  |
    | numeroSerie (String)  |            | | cliente (String)    |
    | status (Enum/String)  |            | | dataEnvio (DateTime)|
    +-----------------------+            | | dataDevolucao(Date) |
                |                        +-----------------------+
                +--- (1 to Many Relation) --------+

### Data Dictionary

#### 1. `Equipamento` (IT Asset / Notebook)
* **`id`** *(UUID, Primary Key)*: Unique identifier.
* **`patrimonio`** *(String, Unique)*: Internal asset tag ID (e.g., NB-1024).
* **`modelo`** *(String)*: Hardware model specifications (e.g., Dell Latitude 3420).
* **`numeroSerie`** *(String)*: Hardware manufacturer serial number.
* **`status`** *(String/Enum)*: Current lifecycle state (`Ativo`, `Disponível`, `Manutenção`).

#### 2. `Historico` (Assignment Logs)
* **`id`** *(UUID, Primary Key)*: Unique log identifier.
* **`equipamentoId`** *(UUID, Foreign Key)*: Relates directly to an `Equipamento`.
* **`colaborador`** *(String)*: Name of the employee holding the asset.
* **`cliente`** *(String)*: Operational sector or client project assignment.
* **`dataEnvio`** *(DateTime)*: The exact timestamp when the hardware was deployed to the employee.
* **`dataDevolucao`** *(DateTime, Nullable)*: Set when the asset returns to inventory. If `null`, the asset is currently in active use by the employee.

---

## 🛠️ Tech Stack

* **Frontend:** React, TypeScript, Tailwind CSS, Recharts (for dashboard data virtualization), Vite.
* **Backend:** Node.js, Express, Cors.
* **Database & DevOps:** PostgreSQL (hosted on Supabase), Prisma ORM, Dotenv.
* **Document Generator:** pdfMake (generates native responsibility terms directly on client-side).

---

## ⚡ Features Implemented

* **Dashboard Visualizer:** Quick toggle between analytic data cards and a dynamic Recharts pie chart.
* **Secure Access:** Restricted login layer for internal IT administrators (`admin@eletron.com`).
* **Full CRUD Inventory:** Seamlessly add, filter, and permanently delete assets.
* **Smart Allocation Management:** Clear separation of active users, stock assets, and devices undergoing maintenance.
* **Automatic Handover Log:** Reassigning a machine automatically timestamps the previous user's return date and tracks the new one.
* **PDF Document Auto-Generation:** Instantly outputs official legal responsibility terms formatted for printing and signatures.

---

## 🏃‍♂️ How to Run Locally

### Prerequisites
Make sure you have **Node.js** and **npm** installed.

### 1. Database & Environment Configuration
Inside the `server/` folder, create a `.env` file containing your Supabase/PostgreSQL connection string:

    DATABASE_URL="postgresql://postgres.your_project_id:your_password@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

### 2. Startup Backend Server
    cd server
    npm install
    npx prisma generate
    npm run dev

The server will boot on `http://localhost:3001`.

### 3. Startup Frontend Application
    cd client
    npm install
    npm run dev

The application interface will open automatically or be accessible at `http://localhost:5173`.

---

## 🔒 Security Compliance Note

All production credentials, internal API endpoints, and private database keys are locked inside localized environment variables (`.env`). They are explicitly ignored using tracking barriers (`.gitignore`) to prevent security leaks in open repositories.