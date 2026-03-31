_This project has been created as part of the 42 curriculum by [mstrauss], [kruseva], [jmuhlber], [bszikora], [vmamoten]._

# ft_transcendence

## 📖 Description

ft_transcendence is the final project of the 42 Common Core. It is a full-stack web application designed around a social media concept with an integrated multiplayer game layer.
By the end of March, the project had moved beyond pure planning: authentication, profiles, friends, posts, and chat persistence were already in active development, while the first playable game prototype was being explored in parallel.

**Key Features:**

- **Platform Foundation:** Monorepo structure with separated frontend, backend, database, and proxy setup.
- **Social Core:** Authentication, user profiles, friendships, posts, and direct user-to-user interaction.
- **Chat Progress:** Real-time chat flow and database-backed message history were already under active implementation.
- **Game Prototype:** A first simple browser game prototype existed while the team was still deciding how the final multiplayer loop would be integrated.

---

## 🛠 Instructions

### Prerequisites

- Git
- Docker Engine or Docker Desktop
- Docker Compose
- Node.js and npm for local frontend development

### Installation & Execution

This project currently uses Docker for the backend, database, and shared infrastructure. During this phase, the frontend may still be run locally depending on the branch and the feature being tested.

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd ft_transcendence
   ```

2. **Environment Setup:**
   Create a `.env` file in the root directory based on the provided example:

   ```bash
   cp .env.example .env
   ```
   Review the database and JWT values in `.env` before starting the backend stack.

3. **Run the application:**
   To build and start the backend stack:

   ```bash
   docker-compose up --build
   ```

4. **Frontend development:**
   In the current project phase, the frontend can also be started locally:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access:**
   - Frontend: `http://localhost:3000`
   - Backend / API: `http://localhost:8080`

---

## 👥 Team Information

| Team Member    | Role            | Responsibilities                                                    |
| :------------- | :-------------- | :------------------------------------------------------------------ |
| **[mstrauss]** | Product Owner   | Defined vision, prioritized features, and maintained the project direction and module strategy. |
| **[kruseva]**  | Project Manager | Coordinated team communication, tracked open work, and helped keep the team aligned across meetings and reviews. |
| **[jmuhlber]** | Tech Lead       | Oversaw backend architecture, infrastructure discussions, and key technical decisions around auth, APIs, and deployment. |
| **[bszikora]** | Developer       | Joined the team during the implementation phase to support game-related planning and additional feature delivery. |
| **[vmamoten]** | Developer       | Joined during the late-March implementation phase and contributed to profile, auth-flow, and frontend integration work. |

---

## 📅 Project Management

**Organization:**
We organized our work around a shared monorepo and split the project into frontend, backend, infrastructure, and documentation tracks. Work was coordinated through discussions, pull requests, and regular syncs as the project structure was still being established.

**Tools Used:**

- **Task Tracking:** GitHub Issues
- **Communication:** WhatsApp
- **Version Control:** Git & GitHub
- **Documentation / Planning:** `QUESTIONS.md`, `INSTRUCTIONS.md`, `Project_Plan.md`

**Workflow:**
We used feature branches, pull requests, and peer review as the normal delivery path. Team changes during the project were reflected in role redistribution, milestone planning, and ongoing coordination through chat and review comments.

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

At this point in the project, the team is targeting a social-media-first implementation path that reaches the required score with one clear multiplayer game and a strong web foundation.

| Category | Module | Type | Points | Why This Module Fits The Project |
| :------- | :----- | :--- | :----- | :------------------------------- |
| Web | Framework for frontend + backend | Major | 2 | The project is being built as a structured full-stack application rather than a loose prototype, with React on the frontend and Express on the backend. |
| Web | User interaction | Major | 2 | A social media concept depends on profiles, messaging, and friendship-related interaction, so this is core to the product direction. |
| Web | Real-time features | Major | 2 | Real-time communication is needed for chat and for the multiplayer game layer planned around the social platform. |
| Web | ORM | Minor | 1 | Prisma reduces friction in managing the relational database as auth, users, and future social/game entities expand. |
| Web | File upload and management system | Minor | 1 | Avatar handling is already relevant for profiles and is a natural extension for social posts later. |
| User Management | Standard user management and authentication | Major | 2 | Authentication, editable profiles, and account handling are foundation features for every other planned module. |
| Gaming and User Experience | Complete web-based game | Major | 2 | The team agreed that one 1v1 web-based game is enough to unlock the gaming branch while keeping the project manageable. |
| Gaming and User Experience | Remote players | Major | 2 | The selected game should be played live between users on different devices, making multiplayer support part of the core scope. |
| Gaming and User Experience | Advanced chat features | Minor | 1 | Chat is a natural bridge between the social platform and the game, especially for invites and user blocking. |
| Web | Complete notification system for all creation, update, and deletion actions | Minor | 1 | Notifications strengthen the social experience and were discussed as a low-cost way to add value beyond the feed itself. |

**Planned score at this stage: 16 points, with the social platform already actively covering a large part of the web and user-management scope.**

---

## ✨ Features List & Assignment

| Feature | Developer(s) | Description |
| :------ | :----------- | :---------- |
| **Authentication Flow** | [jmuhlber], [vmamoten] | Login, registration, token handling, and backend auth endpoints were already being integrated into the app flow. |
| **Profiles** | [vmamoten], [kruseva] | Profile page work was in progress, including styling updates and account-facing UI. |
| **Friends System** | [jmuhlber] | Friend requests and relationship handling were close to functional by the end of March. |
| **Posts / Feed Foundation** | [kruseva], [jmuhlber] | The project already had the basis for social content and feed-related backend/frontend work. |
| **Chat With History** | [kruseva], [jmuhlber] | Real-time messaging was being connected to persistent database storage for chat history. |
| **Game Prototype** | [bszikora], [mstrauss] | A first simple browser game prototype existed as an early test bed for the final multiplayer direction. |
| **Infrastructure & Setup** | [mstrauss], [jmuhlber] | Docker, service layout, and local setup flow were already established to support team-wide development. |

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
