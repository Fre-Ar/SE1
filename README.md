# 🏛️ Local History Documentation Site

A community-driven platform for collecting and sharing local historical stories, photos, and documents.  
Visitors can explore curated stories by era or location, while registered contributors can submit and moderate content to preserve regional heritage.

---
**Project Developers**  
- Armando Eduardo Freitas Gonçalves
- Kylian Kinnen
- Barak Landsman 
- Grzegorz Piotrowski
- Vasile 

## 📋 Table of Contents
- [🏛️ Local History Documentation Site](#️-local-history-documentation-site)
  - [📋 Table of Contents](#-table-of-contents)
  - [💡 About](#-about)
  - [Repo Setup](#repo-setup)
  - [✨ Features](#-features)
  - [🧱 Architecture](#-architecture)
  - [🧰 Tech Stack](#-tech-stack)
  - [**TODO**](#todo)
  - [⚙️ Setup \& Installation](#️-setup--installation)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
      - [Install Node.js, Next.js and React](#install-nodejs-nextjs-and-react)
    - [Run Database locally](#run-database-locally)
  - [🚀 Usage](#-usage)
  - [🗄️ Database Schema (Simplified)](#️-database-schema-simplified)
  - [🤝 Contributing](#-contributing)
  - [Notes for future](#notes-for-future)
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
│  ├─ db/
│  ├─ db_data/
│  ├─ public/
│  └─ src/
├─ requirements.md
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
| **Visitor** | Browse, search, and read content |
| **Contributor** | Submit, edit, and discuss submissions |
| **Moderator** | Approve or reject content, resolve disputes |
| **Admin** | Manage users, configure the system, enforce GDPR compliance |

Additional features:
- Full-text search and filtering by location/era  
- Audit logs for moderation actions  
- Responsive and accessible UI  
- Secure authentication with role-based permissions
--- 
## 🧱 Architecture

**TODO**


---
## 🧰 Tech Stack

**TODO**
---
## ⚙️ Setup & Installation

### Prerequisites
- Git (>= 2.20)  
  - Verify: `git --version`

- Node.js (LTS, e.g. 18+) and npm  
  - Verify: `node -v` and `npm -v`

- Docker (required)  
  - Install: https://docs.docker.com/get-docker/  
  - Verify: `docker --version` and `docker run hello-world`

- Docker Compose (v2+) or Docker Compose plugin  
  - Verify: `docker compose version` (or `docker-compose --version`)

- A code editor (recommended: VS Code) with useful extensions (Prettier, ESLint, Tailwind CSS Intellisense)

- Optional but helpful: Yarn or pnpm if you prefer alternative package managers
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


### Run Database locally

Navigate to ROOT directory:
```bash
cd letzhist
```

To start the DB run:
```bash
docker compose -f docker-compose.yml up -d
```

To stop the DB run:
```bash
docker compose -f docker-compose.yml down
```
---
## 🚀 Usage
- cd to `letzhist`
- Run `npm run dev`

---

## 🗄️ Database Schema (Simplified)

**TODO**

---

## 🤝 Contributing

Contributions are welcome!  
1. Fork the repo  
2. Create a feature branch (`git checkout -b feature/xyz`)  
3. Commit changes (`git commit -m "Add xyz"`)  
4. Push and open a Pull Request  

Before submitting, please:
**TODO**

---
## Notes for future
- When development starts, we'll tag the latest commit, and create branches for each. We'll guard main with the need to accept merge requests.

## 📫 Contact




