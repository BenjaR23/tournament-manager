# Tournament Manager

A full-stack web application for creating, managing, and joining gaming tournaments. Users can explore competitions across different games, organize tournaments, and manage their participation through a centralized platform.

## Overview

Tournament Manager provides a platform for organizing gaming competitions with support for different tournament formats, participant management, and game-based discovery.

The application features a React frontend and a NestJS REST API, backed by PostgreSQL and Prisma ORM.

## Features

- **User Authentication:** Account registration and authentication.
- **Tournament Management:** Create and manage tournaments with configurable settings.
- **Game Selection:** Organize tournaments across multiple predefined games.
- **Tournament Formats:** Support for single elimination and group stage formats.
- **Participant Management:** Join and leave tournaments, with capacity restrictions.
- **Tournament Discovery:** Browse and filter tournaments by game, date, and participant count.
- **Series Configuration:** Configure match series using best-of settings.

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, NestJS, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Testing | Jest |
| Infrastructure | Docker, Docker Compose |
| Package Management | pnpm |
| CI/CD | GitHub Actions |

## Architecture

The application follows a separated frontend and backend architecture:

```text
tournament-manager/
├── apps/
│   ├── web/          # React frontend
│   └── api/          # NestJS REST API
├── package.json
├── pnpm-workspace.yaml
└── ...
```

The frontend communicates with the backend through REST APIs. The backend handles business logic, authentication, and database operations through Prisma ORM.

## Database Design

The relational database is structured around the following entities:

- **User:** Stores user accounts and authentication information.
- **Game:** Stores the games available for tournaments.
- **Tournament:** Contains tournament details, configuration, ownership, and scheduling.
- **TournamentParticipant:** Manages the relationship between users and tournaments.

The database uses relational constraints, unique indexes, and foreign keys to maintain data integrity.

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- Docker and Docker Compose

### Installation

Clone the repository:

```bash
git clone https://github.com/BenjaR23/tournament-manager.git
cd tournament-manager
```

Install dependencies:

```bash
pnpm install
```

### Environment Variables

Configure the environment variables required by the frontend and backend.

Refer to the environment example files in each application (`.env.example`) for the required configuration.

Make sure to configure the database connection and authentication settings before starting the application.

### Database Setup

Start the required infrastructure using Docker Compose:

```bash
docker compose up -d
```

Generate the Prisma client and apply database migrations using the project's configured Prisma scripts.

### Development

Start the development environment:

```bash
pnpm dev
```

Refer to the workspace scripts for additional commands.

## Testing

Run the available test suites using the configured workspace scripts.

```bash
pnpm test
```

## Deployment

The frontend and backend are deployed separately, with PostgreSQL hosted on Supabase.

This separation allows each application to be deployed and configured independently.

## Future Improvements

Potential areas for further development include:

- Automated tournament bracket generation.
- Match scheduling and result tracking.
- Tournament progression management.
- Additional tournament formats.
- Enhanced participant and organizer tools.

## Author

**Benjamín Rodríguez Fuentes**

- GitHub: [BenjaR23](https://github.com/BenjaR23)