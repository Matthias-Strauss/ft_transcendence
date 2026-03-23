_This project has been created as part of the 42 curriculum by [mstrauss], [kruseva], [jmuhlber], [bszikora], [mohrahma]._

# ft_transcendence

## 📖 Description

ft_transcendence is the final project of the 42 Common Core. It is a full-stack web application designed around a social media concept with an integrated multiplayer game layer.
At this stage of the project, the focus is on building the core platform first: user authentication, profiles, a frontend foundation, a backend API, and the infrastructure needed to support social features and game-related extensions later on.

**Key Features:**

- **Platform Foundation:** Monorepo structure with separated frontend, backend, database, and proxy setup.
- **Social Core:** Authentication, user profiles, and the first steps toward user-to-user interaction.
- **Technical Direction:** Containerized deployment, relational database support, and a framework-based frontend/backend stack.
- **Planned Extension:** A multiplayer game module that will integrate into the social platform once the core foundation is stable.

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
| **[mohrahma]** | Developer       | Added during the active implementation phase to reinforce development capacity as the team structure changed. |

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

![Database Schema](./path/to/schema_image.png) # ✏️ WE WILL ADD THIS ONCE DATABASE IS FINAL FEEL FREE TO TRACK THE CURRENT STATE BELOW THOUGH!!!

- **Users:** Stores authentication data, social-posts, likes & dislikes, stats, and profile info.
- **Matches:** Stores history of games played.
- **Friendships:** Manages user relationships.
- **Tournaments:** Tracks tournament brackets and results.

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

**Planned score at this stage: 16 points before optional refinements to the game branch.**

---

## ✨ Features List & Assignment

**✏️ DOCUMENT THE INDIVIDUAL FEATURES YOU ARE WORKING ON, USE YOUR 42 LOGIN NAME. THE BELOW ARE EXAMPLES!!!**

| Feature               | Developer(s) | Description                                      |
| :-------------------- | :----------- | :----------------------------------------------- |
| **Auth System**       | [Login]      | OAuth, JWT handling, and 2FA.                    |
| **Tic-Tac-Toe Logic** | [Login]      | Game state management and win detection.         |
| **Chat System**       | [Login]      | WebSocket integration for real-time messaging.   |
| **Blockchain**        | [mstrauss]   | Smart contract development and Web3 integration. |
| **Tournament Logic**  | [mstrauss]   | Developed tournament logic for Minigame(s).      |
| **Frontend UI**       | [Login]      | Responsive design and component structure.       |
| **DevOps**            | [Login]      | Docker configuration and deployment scripts.     |

---

## 👷 Individual Contributions

**✏️ DOCUMENT THE MODULES YOU ARE WORKING ON AND THE CHALLENGES YOU FACE. USE YOUR 42 LOGIN NAME. I HAVE PROVIDED AN EXAMPLE!!!**

### [mstrauss]

- **Modules:** e.g. Blockchain, Tournament System.
- **Contribution:** e.g. Wrote the Solidity smart contract. Built the tournament bracket generation logic.
- **Challenges:** e.g., "Integrating the Web3 provider with the existing frontend state."

### [kruseva]

- **Modules:**
- **Contribution:**
- **Challenges:**

### [jmuhlber]

- **Modules:**
- **Contribution:**
- **Challenges:**

### [rriebsch]

- **Modules:**
- **Contribution:**
- **Challenges:**

### [ghodges]

- **Modules:**
- **Contribution:**
- **Challenges:**

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
