_This project has been created as part of the 42 curriculum by mstrauss, kruseva, jmuhlber, vmamoten._

# 🪐 ft_transcendence

## 📖 Description

ft_transcendence is the final project of the 42 Common Core. It is a full-stack social web application that combines community features with a real-time multiplayer Pong experience.
The goal of the project is to build a modern platform where users can create profiles, connect with other users, share content, communicate in real time, and launch live matches directly from the application. The project combines a React frontend, an Express backend, Prisma-managed PostgreSQL data, and WebSocket-powered real-time features into a single containerized application.

**Key Features:**

- **Social Platform:** User profiles, friendship management, direct messaging, notifications, and a shared social feed with posts, comments, bookmarks, and media uploads.
- **Real-Time Interaction:** Socket.IO-powered messaging, live updates, typing indicators, unread state, and in-app game invites.
- **Gameplay:** A browser-playable 3D Pong game with remote multiplayer support and live synchronized match state.
- **Technical Foundation:** A framework-based full-stack architecture using React, Express, Prisma, PostgreSQL, and a reusable custom design system.
- **User Experience:** Search, pagination, protected media handling, and integrated file upload flows for avatars, posts, and chat attachments.

---

## 🛠 Instructions

### Prerequisites

- Git
- Docker Engine or Docker Desktop
- Docker Compose v2 (`docker compose`)

### Installation & Execution

This project uses Docker for the full application stack, including the frontend, backend, database, reverse proxy, and optional Adminer instance.

1. **Clone the repository:**

   ```bash
   git clone <your-repository-url>
   cd ft_transcendence
   ```

2. **Environment Setup:**
   Create a `.env` file in the root directory based on the provided example:

   ```bash
   cp .env.example .env
   ```

   Review the following values before starting the stack:
   - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
   - `JWT_SECRET`
   - `PROXY_HTTP_PORT`, `PROXY_HTTPS_PORT`
   - `TLS_CERT_HOSTS`
   - `APP_ORIGIN`
   - `CORS_ALLOWED_ORIGINS`

   If you want to access the app from another machine on your network, append your host IP or domain to `TLS_CERT_HOSTS` and add the matching `https://...` origin to `CORS_ALLOWED_ORIGINS`. If you change the proxy ports or hostnames, update `APP_ORIGIN`, `TLS_CERT_HOSTS`, and `CORS_ALLOWED_ORIGINS` so they stay consistent.

3. **Run the application:**
   Build and start all services with:

   ```bash
   docker compose up --build
   ```

   On first startup, the proxy generates a self-signed TLS certificate automatically. Your browser will likely show a certificate warning for local development / deployment.

4. **Access:**
   Open your browser and navigate to:
   - `http://localhost:8080` for the HTTP entrypoint, which redirects to HTTPS.

5. **Stop the application:**

   ```bash
   docker compose down
   ```

   To remove the database volume and start with a fresh local state:

   ```bash
   docker compose down -v
   ```

   This deletes persisted database data.

---

## 👥 Team Information

| Team Member    | Role            | Responsibilities                                                    |
| :------------- | :-------------- | :------------------------------------------------------------------ |
| **[mstrauss]** | Product Owner   | Defined vision, prioritized features, maintained backlog.           |
| **[kruseva]**  | Project Manager | Facilitated coordination, tracked deadlines, managed blockers.      |
| **[jmuhlber]** | Tech Lead       | Oversaw architecture, code quality, and technology stack decisions. |
| **[vmamoten]** | Developer       | Implemented features, wrote tests, participated in code reviews.    |

---

## 📅 Project Management

**Organization:**
We organized the project as a monorepo with separate frontend, backend, database, and proxy services. Work was split into feature-focused branches and merged through pull requests rather than direct pushes to `main`. Pull Requests require the review of at the minimum one other team member in order to be merged into main.

**Task Distribution:**
Tasks were divided by feature ownership and subsystem focus:

- `mstrauss`: Pong gameplay, matchmaking/game-invite flow, real-time game integration, and performance tuning.
- `jmuhlber`: authentication, backend routes, Prisma/database work, uploads, and infrastructure fixes.
- `kruseva`: frontend UI work, chat UX, feed interactions, responsive styling, and reusable components.
- `vmamoten`: notifications, chat state handling, friends/profile features, pagination, and protected file access fixes.

**Coordination:**
We used a lightweight Agile-style workflow with bi-weekly standups and ad hoc syncs when blockers appeared. Day-to-day coordination happened through WhatsApp, and work progress was tracked through GitHub Issues and pull requests.

**Tools Used:**

- Task Tracking: GitHub Issues
- Version Control / Review: Git, GitHub branches, pull requests, peer review before merge
- Communication: WhatsApp

**Workflow:**
We used `feat/*`, `fix/*`, and `docs/*` branches, descriptive commit messages, and review-driven merges into `main`.

---

## 💻 Technical Stack

### Frontend

- **Framework:** React with TypeScript and Vite
- **Reasoning:** Chosen to support a component-based frontend architecture and fast iteration on the social platform UI.

### Backend

- **Framework:** Express with TypeScript
- **Reasoning:** Chosen to keep the backend explicit and lightweight while building the core API and authentication system.

### Database

- **Database:** PostgreSQL
- **Reasoning:** Chosen because the project requires a relational data model for users, sessions, and future social/game entities.

- **ORM:** Prisma
- **Reasoning:** Chosen to handle schema definition, migrations, and type-safe database access.

### Infrastructure

- **Containerization:** Docker, Docker Compose
- **Reasoning:** Chosen to provide a consistent local development and evaluation environment.

- **Reverse Proxy / Web Layer:** Nginx
- **Reasoning:** Chosen to handle routing, certificate setup, and service entry points once the stack is fully integrated.

---

## 🗄 Database Schema

The database had already moved past the placeholder stage by late March. The current Prisma schema was centered around user accounts and the first social features, with room to grow into the game layer later.

- **User**
  - Key fields: `id`, `username`, `password`, `displayName`, `email`, `avatarPath`
  - Purpose: Stores account credentials and profile information.
- **RefreshToken**
  - Key fields: `id`, `token`, `userId`, `createdAt`, `expiresAt`
  - Purpose: Supports session persistence and secure token refresh flows.
- **Friendship**
  - Key fields: `id`, `requesterId`, `receiverId`, `status`, `createdAt`
  - Purpose: Tracks friend requests and accepted social connections between users.
- **DirectMessage**
  - Key fields: `id`, `senderId`, `receiverId`, `content`, `createdAt`
  - Purpose: Stores chat history in the database instead of keeping messages only in memory.
- **Post**
  - Key fields: `id`, `authorId`, `content`, `createdAt`
  - Purpose: Supports the social feed and user-generated content.
- **Comment**
  - Key fields: `id`, `authorId`, `postId`, `content`, `createdAt`
  - Purpose: Supports interaction around posts.

**Key relationships:**
- One `User` can have many `RefreshToken`, `Post`, `Comment`, and `DirectMessage` records.
- `Friendship` links two users and represents the current relationship state between them.
- A `Post` belongs to one user and can have many `Comment` records.

---

## ✅ Planned / Active Modules

At this point in the project, the team is targeting a social-media-first implementation path that reaches the required score with one clear multiplayer game and a strong web foundation. The modules below reflect work that is already active in the codebase or clearly owned by a specific part of the team.

| Category | Module | Type | Points | Why This Module Fits The Project |
| :------- | :----- | :--- | :----- | :------------------------------- |
| Web | Framework for frontend + backend | Major | 2 | The project is being built as a structured full-stack application rather than a loose prototype, with React on the frontend and Express on the backend. |
| Web | User interaction | Major | 2 | Profiles, friendships, posts, and direct messaging are already central to the app structure, so this module matches the main product identity rather than being an add-on. |
| Web | Real-time features | Major | 2 | Real-time behavior is being used for chat already and is also the expected backbone for the final multiplayer experience. |
| Web | ORM | Minor | 1 | Prisma is already shaping the schema and backend data access layer, making this a concrete implementation choice rather than only a planning decision. |
| Web | File upload and management system | Minor | 1 | Avatar and media-related flows are part of the user/profile experience and fit naturally into the growing social feature set. |
| User Management | Standard user management and authentication | Major | 2 | Login, registration, token refresh, and editable account data are already active work and unlock every other protected feature in the platform. |
| Gaming and User Experience | Complete web-based game | Major | 2 | The team has already begun implementing a browser-game prototype, so this remains the chosen route for the gaming branch. |
| Gaming and User Experience | Remote players | Major | 2 | The game direction is explicitly multiplayer, which means remote play is not optional but part of the target implementation. |
| Gaming and User Experience | Advanced chat features | Minor | 1 | Persistent chat history, friend-aware communication, and invite-oriented flows tie the social side of the product to the game side. |
| Web | Complete notification system for all creation, update, and deletion actions | Minor | 1 | Notifications now fit the real social interactions being built and help make the platform feel cohesive rather than a collection of isolated pages. |

**Planned score at this stage: 16 points, with feature ownership and implementation direction now clear enough to defend during review.**

---

## ✨ Features List & Assignment

| Feature | Owner | Developer(s) | Description |
| :------ | :---- | :----------- | :---------- |
| **Authentication Flow** | [jmuhlber] | [jmuhlber], [vmamoten] | Login, registration, token handling, and backend auth endpoints were being integrated into the app flow, with ownership now tracked by login for review purposes. |
| **Profiles** | [vmamoten] | [vmamoten], [kruseva] | Profile page work was in progress, including styling updates and account-facing UI. |
| **Friends System** | [jmuhlber] | [jmuhlber] | Friend requests and relationship handling were close to functional by early April. |
| **Posts / Feed Foundation** | [kruseva] | [kruseva], [jmuhlber] | The project already had the basis for social content and feed-related backend/frontend work. |
| **Chat With History** | [kruseva] | [kruseva], [jmuhlber] | Real-time messaging was being connected to persistent database storage for chat history. |
| **Notifications** | [vmamoten] | [vmamoten], [jmuhlber] | Notification-oriented flows were being added around the emerging social interactions in the app. |
| **Game Prototype** | [bszikora] | [bszikora], [mstrauss] | A first simple browser game prototype existed as an early test bed for the final multiplayer direction. |
| **Infrastructure & Setup** | [mstrauss] | [mstrauss], [jmuhlber] | Docker, service layout, and local setup flow were already established to support team-wide development. |

---

## 👷 Individual Contributions

### [mstrauss]

- **Modules:** Product direction, setup coordination, early game planning.
- **Contribution:** Defined the project scope, kept the module strategy aligned with the subject, and supported the first game-prototype direction.
- **Challenges:** Keeping the project achievable while still aiming for a strong module score and social-platform identity.

### [kruseva]

- **Modules:** Frontend UI, chat, feed-related interfaces.
- **Contribution:** Drove frontend implementation work, including chat UX, social-page structure, and the visual direction of the application.
- **Challenges:** Connecting evolving backend behavior to a frontend that was still changing quickly during active feature development.

### [jmuhlber]

- **Modules:** Backend API, authentication, Prisma schema, friendship logic.
- **Contribution:** Built core backend foundations, auth flows, database-backed models, and the friends-system groundwork.
- **Challenges:** Designing backend structures that would support both current social features and the later game integration.

### [bszikora]

- **Modules:** Game prototype, multiplayer planning.
- **Contribution:** Joined during implementation and began exploring the first browser-game prototype and how game session logic could fit the project.
- **Challenges:** Starting game work while the final integration and real-time architecture were still being refined.

### [vmamoten]

- **Modules:** Profiles, auth-flow integration, frontend polish.
- **Contribution:** Contributed to profile-page work, login/register improvements, and frontend-side integration tasks after joining in late March.
- **Challenges:** Integrating quickly into an already moving codebase and picking up unfinished UI and auth work without slowing feature progress.

---

## 📚 Resources & AI Usage

### Documentation

- [React Documentation](https://react.dev/)
- [Express Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Socket.IO Documentation](https://socket.io/docs/v4/)

### AI Usage

_As per the subject requirements, we transparently declare our use of AI tools:_

- **Tools Used:** Gemini
- **Use Cases:**
  - _Project Planning:_
    - Extracting key information from the subject.pdf and making it digestible.
    - Ranking Complexity of Topics.
    - Checking for module dependency issues.
    - Quick formatting.
  - _Debugging:_
    - Used to explain cryptic error messages in the backend.
  - _Learning new Tech:_ Used "Guided learning" mode to develop long lastiung understanding about the technologies used that are new to us.
  - _Tests:_ Tests were generated with AI assistance in order to support rapid development.
