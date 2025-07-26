# YouTube Radar

This project is a read-only aggregation backend for multiple Google/YouTube accounts, designed to pull and display YouTube channel and video metrics. It's built with Next.js 14 App Router, TypeScript, Prisma, PostgreSQL, TailwindCSS, Shadcn UI, and integrates with Redis for caching and PKCE state management.

## Features

*   **Multi-Channel Support**: Connect and manage multiple YouTube channels.
*   **Google OAuth 2.0 (PKCE)**: Secure authentication flow with Google for YouTube Data API and YouTube Analytics API access.
*   **Encrypted Refresh Tokens**: Sensitive refresh tokens are encrypted before storage.
*   **Automated Data Sync**: Background tasks to periodically refresh video statistics, channel metrics, and daily analytics.
*   **Redis Caching**: Improves performance for frequently accessed analytics data.
*   **Detailed Channel View**: Dedicated pages for each channel showing video lists and analytics charts.
*   **Video & Analytics Tables**: Paginated and searchable lists of all videos and daily analytics across all channels.
*   **Task Logging**: Tracks the status and history of all background data synchronization tasks.
*   **Data Export**: Export video and daily analytics data to CSV or JSON.
*   **Responsive UI**: Built with TailwindCSS and Shadcn UI for a modern and responsive user experience.

## Technology Stack

*   **Framework**: Next.js 14 App Router
*   **Language**: TypeScript
*   **Database**: PostgreSQL (via Prisma ORM)
*   **Caching/State**: Redis (Upstash)
*   **APIs**: Google YouTube Data API v3, Google YouTube Analytics API v2
*   **Background Tasks**: Vercel Cron Jobs (or any external cron service)
*   **Encryption**: Node.js `crypto` (AES-256-GCM)
*   **Containerization**: Docker, Docker Compose

## Getting Started

### Prerequisites

*   Node.js (v18.x or higher)
*   npm or yarn
*   **Docker and Docker Compose** (for containerized setup)

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd youtube-analytics-dashboard
\`\`\`

### 2. Environment Variables

Create a `.env` file in the root of your project and populate it with the following variables.
**Important**: When running with Docker Compose, the `DATABASE_URL` for the `web` service should point to the `postgres` service name within the Docker network.

\`\`\`env
# Database (for Docker Compose)
DATABASE_URL="postgresql://user:password@postgres:5432/youtube_analytics?schema=public"
POSTGRES_DB="youtube_analytics" # Used by the postgres service
POSTGRES_USER="user"           # Used by the postgres service
POSTGRES_PASSWORD="password"   # Used by the postgres service

# Google OAuth
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
GOOGLE_REDIRECT_URI="http://localhost:3000/auth/callback" # For local Docker development. Add your production URL too!

# Encryption Key (for refresh tokens)
# Generate with: openssl rand -base64 32
ENCRYPTION_KEY="YOUR_32_BYTE_BASE64_ENCRYPTION_KEY"

# Upstash Redis (for PKCE state and API caching)
# These are external services, so URLs remain as is.
KV_REST_API_URL="YOUR_UPSTASH_REDIS_REST_URL"
KV_REST_API_TOKEN="YOUR_UPSTASH_REDIS_REST_TOKEN"

# Cron Job Security Token
# A strong, random string to secure your cron endpoints
CRON_SECRET_TOKEN="YOUR_CRON_SECRET_TOKEN"
\`\`\`

#### How to get Google OAuth Credentials:

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project or select an existing one.
3.  Navigate to "APIs & Services" > "Credentials".
4.  Click "Create Credentials" > "OAuth client ID".
5.  Select "Web application" as the application type.
6.  In "Authorized redirect URIs", add:
    *   `http://localhost:3000/auth/callback` (for local development, including Docker)
    *   `https://your-app-domain.vercel.app/auth/callback` (for production deployment)
7.  You will be provided with your `Client ID` and `Client Secret`.
8.  Navigate to "APIs & Services" > "Library". Search for and enable:
    *   `YouTube Data API v3`
    *   `YouTube Analytics API`

#### How to get Upstash Redis Credentials:

1.  Go to [Upstash Console](https://console.upstash.com/).
2.  Create a new Redis database.
3.  Once created, you will find the `REST_API_URL` and `REST_API_TOKEN` in your database details.

### 3. Build Docker Images

First, build the Docker images for your services:

\`\`\`bash
docker compose build
\`\`\`

### 4. Start Services and Database Setup

Start the PostgreSQL and Redis services in the background:

\`\`\`bash
docker compose up -d postgres redis
\`\`\`

Wait a few moments for the `postgres` service to fully initialize. You can check its logs: `docker compose logs postgres`.

Once PostgreSQL is ready, run Prisma migrations to set up your database schema. This command executes `npx prisma migrate deploy` inside the `web` container:

\`\`\`bash
docker compose run --rm web npx prisma migrate deploy
\`\`\`

### 5. Run the Application

#### Development Mode

To run the Next.js application in development mode with hot-reloading:

\`\`\`bash
docker compose up web
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser. Changes to your code will automatically trigger a rebuild and refresh.

#### Production Mode

To run the Next.js application in production mode (after building the image with `docker compose build`):

\`\`\`bash
docker compose up -d # This will start all services in detached mode
\`\`\`

The `web` service will run `npm start` as defined in its `Dockerfile`'s `CMD`.

### Background Tasks (Cron Jobs)

The data synchronization tasks are designed to be triggered by an external cron service (e.g., Vercel Cron Jobs, GitHub Actions, or a dedicated cron service).

All tasks are exposed via a single secure endpoint: `/api/cron/run`.

### How to Configure Cron Jobs (e.g., Vercel Cron Jobs)

In your `vercel.json` file (or directly in the Vercel Dashboard under Project Settings -> Cron Jobs), add the following configurations:

\`\`\`json
{
  "crons": [
    {
      "path": "/api/cron/run?task=video_sync",
      "schedule": "*/10 * * * *",
      "headers": {
        "X-CRON-TOKEN": "YOUR_CRON_SECRET_TOKEN"
      }
    },
    {
      "path": "/api/cron/run?task=channel_hourly",
      "schedule": "0 * * * *",
      "headers": {
        "X-CRON-TOKEN": "YOUR_CRON_SECRET_TOKEN"
      }
    },
    {
      "path": "/api/cron/run?task=channel_daily",
      "schedule": "0 2 * * *",
      "headers": {
        "X-CRON-TOKEN": "YOUR_CRON_SECRET_TOKEN"
      }
    },
    {
      "path": "/api/cron/run?task=reauth_check",
      "schedule": "0 * * * *",
      "headers": {
        "X-CRON-TOKEN": "YOUR_CRON_SECRET_TOKEN"
      }
    }
  ]
}
\`\`\`

**Note**: Replace `YOUR_CRON_SECRET_TOKEN` with the actual value from your environment variables.

### Manual Task Execution (for Development/Debugging)

You can manually trigger the `video_sync` task by executing a command inside the running `web` container:

\`\`\`bash
docker compose exec web npx ts-node scripts/manual-fetch.ts
\`\`\`

This script will run `video_sync` for all active channels.

## Project Structure

\`\`\`
.
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── init/route.ts
│   │   ├── channels/
│   │   │   └── [channelId]/
│   │   │       └── daily-stats/route.ts
│   │   ├── cron/
│   │   │   └── run/route.ts
│   │   ├── export/route.ts
│   │   ├── videos/route.ts
│   │   ├── analytics/route.ts
│   │   └── tasks/route.ts
│   ├── auth/
│   │   └── callback/route.ts
│   ├── channels/
│   │   ├── [channelId]/
│   │   │   ├── analytics/page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── videos/page.tsx
│   │   └── page.tsx
│   ├── analytics/page.tsx
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── page.tsx (redirects to /channels)
│   ├── tasks/page.tsx
│   └── videos/page.tsx
├── components/ui/ (shadcn/ui components)
├── lib/
│   ├── api-response.ts
│   ├── auth.ts
│   ├── db.ts
│   ├── encryption.ts
│   ├── logger.ts
│   ├── redis.ts
│   ├── tasks.ts
│   └── utils.ts
│   └── youtube.ts
│   └── crypto/
│       └── encrypt.ts
│   └── tasks/
│       ├── channel-daily.ts
│       ├── channel-hourly.ts
│       ├── reauthCheck.ts
│       └── video-sync.ts
│   └── youtube/
│       └── oauth.ts
├── prisma/
│   └── schema.prisma
├── scripts/
│   └── manual-fetch.ts
├── public/
│   └── placeholder.svg
├── .env # New: For Docker Compose environment variables
├── Dockerfile # New: Docker build instructions for the web service
├── docker-compose.yml # New: Docker Compose orchestration file
├── next.config.mjs
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── ...
