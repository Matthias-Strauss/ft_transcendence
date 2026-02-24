_This project has been created as part of the 42 curriculum by [mstrauss], [kruseva], [jmuhlber], [ghodges]._

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
| **[mstrauss]** | Product Owner   | Defined vision, prioritized features, maintained backlog.           |
| **[ghodges]**  | Tech Lead       | Oversaw architecture, code quality, and technology stack decisions. |
| **[kruseva]**  | Developer       | Designed and implemented frontend features, participated in reviews, and helped shape the UI direction. |
| **[jmuhlber]** | Developer       | Implemented backend foundation work, authentication flows, and infrastructure-related setup. |

---

## 📅 Project Management

**Organization:**
We organized our work around a shared monorepo and split the project into frontend, backend, infrastructure, and documentation tracks. Work was coordinated through discussions, pull requests, and regular syncs as the project structure was still being established.

**Tools Used:**

- **Task Tracking:** GitHub Issues
- **Communication:** WhatsApp
- **Version Control:** Git & GitHub
- **Documentation / Planning:** `QUESTIONS.md`, `INSTRUCTIONS.md`, `Project_Plan.md`

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

## ✅ Implemented Modules

We have implemented the following modules to achieve the required **14 points** (Planned Target: 19 Core + 3 Optional = 22 Points).

### 1. Web (Total: 6 Points)

| Module                 | Type  | Points | Description/Implementation                                          |
| :--------------------- | :---- | :----- | :------------------------------------------------------------------ |
| **Use a Framework**    | Major | 2      | Implemented using [Frontend Framework] and [Backend Framework].     |
| **User Interaction**   | Major | 2      | Users can chat, add friends, and view profiles.                     |
| **Real-time Features** | Major | 2      | Used [e.g., Socket.io] for live game updates and chat broadcasting. |
| **File Upload**        | Minor | 1      | Users can upload avatars (validated for size/type).                 |
| **Use an ORM**         | Minor | 1      | Database interaction handled via [ORM Name].                        |

### 2. User Management (Total: 2 Points + Optional)

| Module                 | Type  | Points | Description/Implementation                                |
| :--------------------- | :---- | :----- | :-------------------------------------------------------- |
| **Standard User Mgmt** | Major | 2      | Secure auth, profile updates, and avatar management.      |
| **Game Statistics**    | Minor | 1      | _(Optional)_ Detailed win/loss tracking and leaderboards. |

### 3. Gaming & Experience (Total: 5 Points + Optional)

| Module                 | Type  | Points | Description/Implementation                                        |
| :--------------------- | :---- | :----- | :---------------------------------------------------------------- |
| **Web-based Game**     | Major | 2      | **Tic-Tac-Toe**: A logic-based game with clear win/loss states.   |
| **Remote Players**     | Major | 2      | Two users on different devices can play via WebSockets.           |
| **Tournament System**  | Minor | 1      | Bracket system for organized player matchmaking.                  |
| **Game Customization** | Minor | 1      | _(Optional)_ Users can customize game assets/themes.              |
| **Advanced Chat**      | Minor | 1      | _(Optional)_ Invite to play, block users, and persistent history. |

### 4. Artificial Intelligence (Total: 2 Points)

| Module          | Type  | Points | Description/Implementation                                                          |
| :-------------- | :---- | :----- | :---------------------------------------------------------------------------------- |
| **AI Opponent** | Major | 2      | An AI using the Minimax algorithm that simulates human play for the game TicTacToe. |

### 5. Blockchain (Total: 2 Points)

| Module         | Type  | Points | Description/Implementation                                              |
| :------------- | :---- | :----- | :---------------------------------------------------------------------- |
| **Blockchain** | Major | 2      | Integration with Avalanche (using Solidity) to store tournament scores. |

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

- **Category Title (if neccessary)**
- [Link to Framework Docs]
- [Link to ...]
- **Blockchain:**
  - [Link to Avalanche Blockchain Docs](https://build.avax.network/docs/)
  - [Hardhat Docs](https://hardhat.org/docs/)
  - [Metamask Docs](https://docs.metamask.io/)

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
