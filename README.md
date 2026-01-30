# 🏛️ Local History Documentation Site

A community-driven platform for collecting and sharing local historical stories, photos, and documents.  
Visitors can explore curated stories by era or location, while registered contributors can submit and moderate content to preserve regional heritage.

You can access the live website [here](letzhist-app-evarfcafgbcvachd.francecentral-01.azurewebsites.net)!

---
**Project Developers**  
- Armando Eduardo Freitas Gonçalves
- Kylian Kinnen
- Barak Landsman 
- Grzegorz Piotrowski
- Vasile Miron

## 📋 Table of Contents
- [🏛️ Local History Documentation Site](#️-local-history-documentation-site)
  - [📋 Table of Contents](#-table-of-contents)
  - [💡 About](#-about)
  - [Repo Setup](#repo-setup)
  - [✨ Features](#-features)
  - [🧱 Architecture](#-architecture)
  - [🧰 Tech Stack](#-tech-stack)
  - [⚙️ Setup \& Installation](#️-setup--installation)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
      - [Install Node.js, Next.js and React](#install-nodejs-nextjs-and-react)
    - [Environment Variables](#environment-variables)
    - [Run Database locally](#run-database-locally)
  - [🚀 Usage](#-usage)
  - [🗄️ Database Schema (Simplified)](#️-database-schema-simplified)
  - [📫 Contact](#-contact)

---


## 💡 About

**Local History Documentation Site** enables communities to document and preserve their shared past.  
It supports:
- Uploading stories, photos, and historical documents  
- Moderated submissions to ensure content quality  
- Structured metadata (date, location, theme) for rich search and categorization  

This project aims to balance openness with accuracy and respect for local heritage and is part of the **Software Engineering 1** course of the **University of Luxembourg**


---
## Repo Setup
```
SE1/
├─ archive/
├─ lecture_notes/
├─ Requirements/
│  ├─ sequence_diagrams/
│  ├─ templates/
│  ├─ use_case_diagrams/
│  └─ user_story_mappings/
├─ letzhist/
│  ├─ db/ # Database initialization scripts (SQL)
│  ├─ public/ # Static assets and uploads
│  └─ src/
│     ├─ app/ # Next.js App Router (Pages & API Routes)
|     ├─ components/ # React UI Components
|     └─ lib/ # Shared utilities & DB connection
├─ requirements.md # Functional & Non-Functional Requirements
├─ use_cases.md
├─ CONTRIBUTING.md
├─ README.md
├─ tasks.kanban
└─ topic.md

```
---
## ✨ Features

| Role | Capabilities |
|------|---------------|
| **Visitor** | Browse paginated stories, full-text search, filter by tags, view revision history. |
| **Contributor** | Create drafts, publish new story versions, upload media, comment on stories. |
| **Moderator** | Review disputes, hide inappropriate comments/stories, ban/mute users, view audit logs. |
| **Admin** | Manage user roles, system configuration. |

**Key Capabilities:**
- **Immutable Versioning**: Every edit creates a new `StoryRevision`, preserving history.
- **Traceability**: All sensitive actions (bans, edits, deletions) are recorded in an immutable `Audit Log`.
- **Search**: Advanced filtering by tags and full-text matching.
- **Discussion**: Threaded comments contextually linked to specific story versions.

--- 

## 🧱 Architecture

The application follows a **Monolithic** architecture built on the **Next.js App Router**, serving both the frontend UI and the backend API endpoints.

1.  **Client Layer (React)**: 
    - Uses `'use client'` components for interactive features (Editors, Search Forms).
    - Fetches data via standard `fetch` API calls to the internal backend.

2.  **API Layer (Next.js Route Handlers)**:
    - Located in `src/app/api/*`.
    - Handles business logic, input validation, and authorization checks.
    - strictly enforces Role-Based Access Control (RBAC).

3.  **Data Persistence**:
    - **MySQL**: Relational data (Users, Stories, Comments, Disputes).
    - **Blob Storage**: 
        - *Local Dev*: Filesystem (`public/images/uploads`).
        - *Production*: Azure Blob Storage (Configurable).

---
## 🧰 Tech Stack

**Frontend & Backend Framework**
- [Next.js 15](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)

**Database & Storage**
- [MySQL 8.0](https://www.mysql.com/) (Relational DB)
- [Docker](https://www.docker.com/) (Containerization)
- Azure Blob Storage (Optional for media)

**Styling & UI**
- [Tailwind CSS](https://tailwindcss.com/)
- React Icons

**Security & Utilities**
- `bcryptjs` (Password Hashing)
- `jsonwebtoken` (JWT Authentication)
- `mysql2` (Database Driver)

**Testing**
- Jest
- React Testing Library

---
## ⚙️ Setup & Installation

### Prerequisites
- Git (>= 2.20)  
  - Verify: `git --version`

- Node.js (LTS, e.g. 18+) and npm  
  - Verify: `node -v` and `npm -v`

- Docker
  - Install: https://docs.docker.com/get-docker/  
  - Verify: `docker --version` and `docker run hello-world`

- Docker Compose (v2+) or Docker Compose plugin  
  - Verify: `docker compose version` (or `docker-compose --version`)

- A code editor (recommended: VS Code) with useful extensions (Prettier, ESLint, Tailwind CSS Intellisense)

### Installation
```bash
# Clone repository
git clone https://github.com/Fre-Ar/SE1.git
```

#### Install Node.js, Next.js and React
Install Node.js as per this guide (run the commands in terminal): https://nodejs.org/en/download

Verify the installation by running: 
```bash
node -v
npm -v
```

Cd to the project folder.
Run 
```bash
cd letzhist
```

Install all 
```bash
npm install
```

### Environment Variables

Create a `.env.local` file in `letzhist/`:

```env
# Database
DB_HOST=localhost
DB_USER=letzuser
DB_PASSWORD=letzpass
DB_NAME=letz_hist_db

# Security
JWT_SECRET=super_secret_development_key
JWT_EXPIRES_IN=24h

# Optional: Azure Blob Storage (for Production)
# AZURE_STORAGE_CONNECTION_STRING=...
# AZURE_PUBLIC_BASE_URL=...

```


### Run Database locally

Navigate to ROOT directory:
```bash
cd letzhist
```

To start the MySQL Container by running:
```bash
docker compose up -d
```

*Note: The `init.sql` script will automatically create the tables on first startup.*

To stop the DB, run:
```bash
docker compose down -v
```

---

## 🚀 Usage
- cd to `letzhist`
- Run `npm run dev`
- Open http://localhost:3000

---

## 🗄️ Database Schema (Simplified)


The database is normalized to support versioning and moderation.

1. **`users`**: Stores credentials, roles (`admin`, `moderator`, `contributor`), and ban/mute status.

2. **`story`**: The "Container" for a topic. Holds the permanent ID and Slug.

3. **`storyRevision`**: Immutable snapshots of content.
* Linked to `story`.
* Contains `body`, `title`, `leadImage`.
* Has a `parentId` to form a version chain.

4. **`comment`**: Threaded discussions.
* Linked to a specific `storyRevision` (context).

5. **`dispute`**: Reports against content or users.
* Tracks `status` (open, resolved) and `resolutionNotes`.

6. **`audit_log`**: Immutable record of system actions.
* Records `who` (actor), `what` (action), `target`, and `reason`.


---

## 📫 Contact

For questions, please reach out to the project developers listed at the top.




