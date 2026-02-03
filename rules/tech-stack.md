# 🧠 iCreatechs – Cursor Clone Issue Tracker

## ⚡ Fast Development Plan (Implementation Order)

**Phase 1 — Core scaffolding (no paid services required)**

1. Project setup (repo, CI, env)
2. Intro landing page
3. Projects system (create/open workspace)
4. Conversation system (chat threads per project)

**Phase 2 — IDE basics (no paid services required)** 5. IDE layout (panels, tabs, resize) 6. File explorer 7. Monaco editor integration 8. Code editor state (open files, cursor, undo)

**Phase 3 — AI & background jobs (paid/usage-based services may apply)** 9. AI features (chat, explain, refactor) — Inngest 10. AI agents tools (file ops, commands) — Inngest 11. Firecrawl AI (web scraping tool) — Firecrawl (paid plan likely)

**Phase 4 — Auth, data, billing, and ops (paid/usage-based services)** 12. Supabase auth integration — Supabase (paid plan possible) 13. JWT verification — Supabase 14. Postgres schema — Supabase 15. Stripe customer creation — Stripe (paid plan/fees) 16. Subscription plans — Stripe 17. Usage metering — Stripe + Postgres 18. Sentry full stack — Sentry (paid plan possible) 19. Production infra — Vercel + API host 20. Supabase prod environment — Supabase

---

## 💳 Paid/Usage‑Based Services by Module

| Module         | Service   | Where it appears                   | Notes                               |
| -------------- | --------- | ---------------------------------- | ----------------------------------- |
| Billing        | Stripe    | Billing issues                     | Paid plan/fees for production usage |
| Authentication | Supabase  | Auth integration, JWT verification | Free tier available; paid for scale |
| Infrastructure | Supabase  | Postgres schema                    | Free tier available; paid for scale |
| Deployment     | Supabase  | Prod environment                   | Paid for production workloads       |
| Observability  | Sentry    | Sentry full stack                  | Free tier available; paid for scale |
| AI & Agents    | Firecrawl | Firecrawl AI (web scraping tool)   | Paid plan likely                    |

---

## 📌 Database Properties (columns)

Create a Notion database with these fields:

| Property       | Type         | Purpose                             |
| -------------- | ------------ | ----------------------------------- |
| **Issue**      | Title        | Task name                           |
| **Module**     | Select       | What system it belongs to           |
| **Stack**      | Multi-select | Next.js, Supabase, Stripe, etc      |
| **Status**     | Select       | Backlog, In Progress, Blocked, Done |
| **Priority**   | Select       | P0 (Critical), P1, P2, P3           |
| **Complexity** | Select       | XS, S, M, L, XL                     |
| **Owner**      | Person       | Who is working on it                |
| **Depends On** | Relation     | Blocks / dependencies               |
| **Type**       | Select       | Feature, Infra, Bug, UX, Security   |
| **Notes**      | Text         | Design / links                      |

---

## 🧩 MODULE TYPES (Use these in the Module column)

- Core Platform
- Authentication
- Billing
- AI & Agents
- IDE / Editor
- Infrastructure
- Observability
- Integrations
- Deployment

---

## 🚀 Your actual issues (based on your stack)

Paste this into Notion as rows.

---

### Core Platform

| Issue                                          | Module        | Stack             | Status  | Priority | Type    |
| ---------------------------------------------- | ------------- | ----------------- | ------- | -------- | ------- |
| Intro landing page                             | Core Platform | Next.js           | Done    | P2       | UX      |
| Project setup (repo, CI, env)                  | Core Platform | Next.js           | Done    | P0       | Infra   |
| Projects system (create/open workspace)        | Core Platform | Next.js, Postgres | Backlog | P0       | Feature |
| Conversation system (chat threads per project) | Core Platform | Next.js           | Backlog | P0       | Feature |

---

### Authentication

| Issue                               | Module         | Stack             | Status  | Priority | Type     |
| ----------------------------------- | -------------- | ----------------- | ------- | -------- | -------- |
| Supabase auth integration (Next.js) | Authentication | Supabase, Next.js | Backlog | P0       | Security |
| JWT verification                    | Authentication | Supabase          | Backlog | P0       | Security |
| User sync (Supabase → Postgres)     | Authentication | Postgres          | Backlog | P0       | Infra    |

---

### Billing

| Issue                               | Module  | Stack            | Status  | Priority | Type    |
| ----------------------------------- | ------- | ---------------- | ------- | -------- | ------- |
| Stripe customer creation            | Billing | Stripe, Nextjs   | Backlog | P0       | Infra   |
| Subscription plans                  | Billing | Stripe           | Backlog | P0       | Feature |
| Usage metering (AI / tokens / jobs) | Billing | Stripe, Postgres | Backlog | P0       | Infra   |
| Billing final polish (UX, invoices) | Billing | Stripe, Next.js  | Backlog | P1       | UX      |

---

### IDE / Editor

| Issue                                        | Module       | Stack          | Status  | Priority | Type    |
| -------------------------------------------- | ------------ | -------------- | ------- | -------- | ------- |
| IDE layout (panels, tabs, resize)            | IDE / Editor | Next.js        | Backlog | P0       | UX      |
| File explorer                                | IDE / Editor | Next.js        | Backlog | P0       | Feature |
| Monaco editor integration                    | IDE / Editor | Monaco         | Backlog | P0       | Feature |
| Code editor state (open files, cursor, undo) | IDE / Editor | Next.js        | Backlog | P0       | Infra   |
| Web terminal preview                         | IDE / Editor | Docker, Judge0 | Backlog | P1       | Feature |

---

### AI & Agents

| Issue                                 | Module      | Stack     | Status  | Priority | Type    |
| ------------------------------------- | ----------- | --------- | ------- | -------- | ------- |
| AI features (chat, explain, refactor) | AI & Agents | Inngest   | Backlog | P0       | Feature |
| AI agents tools (file ops, commands)  | AI & Agents | Inngest   | Backlog | P0       | Feature |
| Firecrawl AI (web scraping tool)      | AI & Agents | Firecrawl | Backlog | P1       | Feature |

---

### Infrastructure

| Issue                                  | Module         | Stack      | Status  | Priority | Type    |
| -------------------------------------- | -------------- | ---------- | ------- | -------- | ------- |
| Postgres schema                        | Infrastructure | Supabase   | Backlog | P0       | Infra   |
| Background jobs (AI, scraping, builds) | Infrastructure | Inngest    | Backlog | P0       | Infra   |
| Judge0 / Docker execution engine       | Infrastructure | Docker     | Backlog | P0       | Infra   |
| GitHub import/export                   | Infrastructure | GitHub API | Backlog | P1       | Feature |

---

### Observability

| Issue             | Module        | Stack           | Status  | Priority | Type  |
| ----------------- | ------------- | --------------- | ------- | -------- | ----- |
| Sentry full stack | Observability | Sentry, Next.js | Backlog | P1       | Infra |
|                   |               |                 |         |          |       |

---

### Deployment

| Issue                                | Module     | Stack    | Status  | Priority | Type  |
| ------------------------------------ | ---------- | -------- | ------- | -------- | ----- |
| Production infra (Vercel + API host) | Deployment | Next.js  | Backlog | P0       | Infra |
| Supabase prod environment            | Deployment | Supabase | Backlog | P0       | Infra |
