# Spoken Edge - Language Tool

A comprehensive educational platform designed to break language barriers between students, teachers, and administrators.

## 🚀 Features

-   **Role-Based Access Control (RBAC)**: Distinct dashboards and capabilities for Super Admins, School Admins, Teachers, and Students.
-   **Real-time Communication**:
    -   Secure private messaging.
    -   Socket.io powered live interactions.
    -   In-person session management with translation support.
-   **Multi-Language Support**: Complete localization and real-time translation capabilities.
-   **School Management**: Tools for managing schools, classrooms, and user rosters.
-   **Audit & Analytics**: Comprehensive logging of actions and usage statistics.

## 🛠️ Tech Stack

### Frontend
-   **Framework**: React (Vite)
-   **Styling**: TailwindCSS
-   **State/Context**: React Context API (Auth, Socket, Session, Language)
-   **Routing**: React Router DOM (v7)
-   **HTTP Client**: Axios

### Backend
-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: PostgreSQL
-   **Authentication**: JWT (JSON Web Tokens)
-   **Real-time**: Socket.io

## 📂 Project Structure

This project follows a Monorepo structure:

```
Language-Tool/
├── backend/            # Express API & Database Logic
│   ├── src/
│   ├── database/       # Migrations & Schema
│   └── .env.example
├── frontend/           # React Application
│   ├── src/
│   ├── public/
│   └── .env.example
└── package.json        # Root scripts for concurrent execution
```

## ⚡ Getting Started

### Prerequisites
-   Node.js (v16+)
-   PostgreSQL (v14+)

### 1. Installation

Install dependencies for both frontend and backend from the root directory:

```bash
npm run install-all
```

### 2. Environment Setup

**Backend:**
Copy the example environment file and configure it:
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
```

**Frontend:**
Copy the example environment file:
```bash
cd frontend
cp .env.example .env
# Edit .env if your backend port differs from default (5001)
```

### 3. Database Setup

Ensure your PostgreSQL service is running and create the database:

```bash
createdb language_tool
```

Run the schema migration scripts located in `backend/database/schema.sql` (and any migrations) to set up tables.

### 4. Running the App

You can run both backend and frontend concurrently from the root directory:

```bash
npm run dev
```

-   **Frontend**: http://localhost:5173
-   **Backend**: http://localhost:5001

## 🚢 Deployment

The application is designed to be deployed easily on platforms like **Railway** or **Render**.

1.  **Build Frontend**: `cd frontend && npm run build`
2.  **Start Backend**: `cd backend && npm start`
3.  **Environment**: Ensure all production environment variables (DB_HOST, etc.) are set.

For detailed deployment instructions, refer to `deployment_guide.md` (if available in artifacts).

## 📄 License
Private - Spoken Edge. All Rights Reserved.
