# Backend Agent

## Overview
NestJS backend for GameSphere, a multi-tenant tournament management system with cricket match scoring.

## Core Modules
- **Authentication**: Google OAuth + JWT guards (`JwtAuthGuard`)
- **Organizations**: Multi-tenant org management — POST/DELETE gated behind `SUPER_ADMIN` (`CreateOrgGuard` + `RolesGuard`), PATCH gated behind `ORG_ADMIN`/`SUPER_ADMIN`
- **Tournaments**: CRUD + team management — all mutation endpoints guarded with `RolesGuard` requiring `ORG_ADMIN` or `SUPER_ADMIN`
- **Teams**: Create, rename, delete, add/remove members — admin-guarded
- **Matches**: Scheduling, scoring (start/end/lock/unlock), deletion — create/delete admin-guarded; start/end/lock/unlock open to any authenticated user
- **Venues**: Venue management for tournament fixtures
- **Form Configs**: Dynamic form configuration per organization
- **Import**: CSV user import — admin-guarded
- **Brackets**: Bracket generation (single/double elimination, round-robin) — generate endpoint admin-guarded
- **Cricket**: Ball-by-ball scoring, batsman/bowler tracking, innings management, wide/no-ball penalty runs
- **SSE**: Server-Sent Events for real-time updates

## Key Features
- Multi-tenant architecture via `TenantContext` middleware
- Role-based access control: `super_admin`, `org_admin`, `volunteer`, `player`
  - `CreateOrgGuard` — bootstrap mode: allows org creation when no orgs exist, otherwise requires `SUPER_ADMIN`
  - `RolesGuard` — checks user's role in the active org against `@Roles()` decorator
- Cricket scoring:
  - Batsman tracking (striker/non-striker, per-batsman stats, auto-switch on odd runs/over completion)
  - Bowling figures (wickets, runs, overs, economy)
  - Wide/no-ball adds +1 penalty run automatically
  - Completed innings scores saved to `match.result.completedInnings[]`
  - Toss info stored in `match.result.toss`, required before match starts
- SQLite/PostgreSQL via TypeORM
- API rate limiting & Helmet security middleware

## API Endpoints
- `/auth` — Authentication
- `/organizations` — Org management
- `/tournaments` — Tournament CRUD + team management
- `/teams` — Team member management
- `/matches` — Match scheduling and scoring
- `/venues` — Venue management
- `/form-configs` — Dynamic form configuration
- `/import` — CSV user import
- `/brackets` — Bracket generation
- `/cricket/{matchId}/start` — Start cricket match (toss required)
- `/cricket/{matchId}/ball` — Log a ball
- `/cricket/{matchId}/innings-end` — End current innings
- `/cricket/{matchId}/state` — Get match state
- `/cricket/{matchId}/events` — Get ball events
- `/cricket/events/{eventId}` — Update a ball event

## Technologies
NestJS, TypeScript, TypeORM, SQLite/PostgreSQL, JWT, Google OAuth 2.0, Helmet, Throttler
