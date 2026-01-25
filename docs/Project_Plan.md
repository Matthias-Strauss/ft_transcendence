# 🏆 Project: "Social Media with MiniGames"

**Target Score:** 17 Points (MVP) → 22 Points (Tier 1) → 28 Points (Max)

The strategy relies on implementing a simple game (e.g., Tic-Tac-Toe) to unlock the "Gaming" dependency tree, combined with standard "Social" features.

## 1️⃣ Phase 1: The Core MVP (17 Points)

**Goal:** Secure the **19 points** necessary for a full **125% score**.

_Focus:_ Building a solid social media foundation with a simple game, including tournaments.

| Module                           | Category   | Points | Dependency | Complexity         | Comment                                        |
| :------------------------------- | :--------- | :----- | :--------- | :----------------- | :--------------------------------------------- |
| **Use a Framework**              | Web        | **2**  | None       | 🟢 Low             |                                                |
| **Standard User Mgmt**           | User Mgmt  | **2**  | None       | 🟢 Low             |                                                |
| **User Interaction**             | Web        | **2**  | None       | 🟢 Low             |                                                |
| **File Upload**                  | Web        | **1**  | None       | 🟢 Low             | User avatar upload (required anyway).          |
| **Real-time Features**           | Web        | **2**  | None       | 🟡 Moderate        |                                                |
| **Use an ORM**                   | Web        | **1**  | None       | 🟢 Low             | Use Prisma/TypeORM. Simplifies DB work         |
| **Web-based Game**               | Gaming     | **2**  | None       | 🟡 Moderate        | Tic-Tac-Toe                                    |
| **Remote Players**               | Gaming     | **2**  | Game       | 🟡 Moderate        |                                                |
| **AI Opponent**                  | AI         | **2**  | Game       | 🟢 Low             | Minimax Algo ?                                 |
| **Tournament System**            | Gaming     | **1**  | Game       | 🟡 Moderate        |                                                |
| **Blockchain**                   | Blockchain | **2**  | Tournament | 🟡 Moderate        | Store tournament scores                        |
| **Optional: Game Customization** | Gaming     | **1**  | Game       | 🟢 Low             | Allow changing board color or icons.           |
| **Optional: Game Statistics**    | User Mgmt  | **1**  | Game       | 🟢 Low             | Track wins/losses in the user profile.         |
| **Optional: Advanced Chat**      | Gaming     | **1**  | Game       | 🟢 Low             | Add "Block User" and "Invite to Play" buttons. |
| **BASE TOTAL**                   | **19**     |        |            | **with Optional:** | **22**                                         |

**Dependencies:**

- Blockchain → requires Tournament.
- Tournament → requires Game.
- AI, Stats, Customization, Remote → require Game.

---

## ⊕ Stretch Goals (Moderate Effort)

**Goal:** Reach up to **28 Points**.

_Focus:_ Standard features that require specific libraries or logic but are well-documented.

| Module                   | Category  | Points | Implementation Notes                                   |
| :----------------------- | :-------- | :----- | :----------------------------------------------------- |
| **Spectator Mode**       | Gaming    | **1**  | Allow a 3rd user to join the WebSocket room read-only. |
| **OAuth Integration**    | User Mgmt | **1**  | "Login with 42" or Google using Passport.js.           |
| **2FA (Two-Factor)**     | User Mgmt | **1**  | Generate QR codes for Google Authenticator.            |
| **GDPR Compliance**      | Data      | **1**  | "Download Data" (JSON) and "Anonymize/Delete" buttons. |
| **Advanced Permissions** | User Mgmt | **2**  | Admin roles (ban users, delete messages).              |
| **CUMULATIVE SCORE**     |           | **28** |                                                        |

## Avoid: Diminishing Returns

_These modules have a poor Effort-to-Point ratio or strict incompatibilities._

- **Multiplayer 3+ (2 pts):** Hard to balance game logic for 3+ people (vs 1v1).
  - Solution: Make multiplayer even number of players only, eg. pong with 4.
- **Server-Side Rendering (1 pt):** SSR introduces hydration headaches.
- **Multiple Languages (1 pt):** Requires translating _every_ string in the UI. Very tedious.
- **Microservices (2 pts):** High DevOps overhead for a small team.

## Detailed Requirements

### 📌 Core Modules (19 Points)

#### **1. Use a Framework**

- **Category:** Web (Major)
- **Requirements:**
- You must use a framework for both the frontend and backend.

**Frontend:** React, Vue, Angular, Svelte, etc..

**Backend:** Express, NestJS, Django, Flask, Ruby on Rails, etc..

**Note:** Full-stack frameworks like Next.js, Nuxt.js, or SvelteKit count as both if you use both their frontend and backend capabilities.

#### **2. Standard User Management**

- **Category:** User Management (Major)
- **Requirements:**
  - Users must be able to update their profile information.
  - Users must be able to upload an avatar; a default avatar must be provided if none is uploaded.
  - Users must be able to add other users as friends and see their online status.
  - Users must have a profile page displaying their information.

#### **3. User Interaction** (Allow users to interact with other users)

- **Category:** Web (Major)
- **Requirements:**
  - **Chat System:** A basic chat system to send/receive messages between users.
  - **Profile System:** Ability to view user information.
  - **Friends System:** Ability to add/remove friends and see the friends list.

#### **4. File Upload** (File upload and management system)

- **Category:** Web (Minor)
- **Requirements:**
  - Support for multiple file types (images, documents, etc.).
  - Must implement client-side and server-side validation for type, size, and format.
  - Secure file storage with proper access control.
  - File preview functionality where applicable.
  - Progress indicators for uploads.
  - Ability to delete uploaded files.

#### **5. Real-time Features**

- **Category:** Web (Major)
- **Requirements:**
  - Implement real-time features using WebSockets or similar technology.
  - Must provide real-time updates across clients.
  - Must handle connection/disconnection gracefully.
  - Must implement efficient message broadcasting.

#### **6. Use an ORM**

- **Category:** Web (Minor)
- **Requirements:**
  - You must use an Object-Relational Mapping (ORM) tool for the database.

#### **7. Web-based Game** (Implement a complete web-based game)

- **Category:** Gaming and user experience (Major)
- **Requirements:**
  - The game can be real-time multiplayer (e.g., Pong, Chess, Tic-Tac-Toe, Card games).
  - Players must be able to play live matches.
  - The game must have clear rules and win/loss conditions.
  - The game can be 2D or 3D.

#### **8. Remote Players**

- **Category:** Gaming and user experience (Major)
- **Requirements:**
  - Enable two players on separate computers to play the same game in real-time.
  - Handle network latency and disconnections gracefully.
  - Provide a smooth user experience for remote gameplay.
  - Implement reconnection logic.

#### **9. AI Opponent**

- **Category:** Artificial Intelligence (Major)
- **Requirements:**

  - The AI must be challenging and able to win occasionally.
  - The AI should simulate human-like behavior (not perfect play).
  - If game customization is implemented, the AI must be able to use those options.
  - You must be able to explain your AI implementation during evaluation.

- **Dependency:** The AI must be able to play your specific game.

#### **10. Tournament System**

- **Category:** Gaming and user experience (Minor)
- **Requirements:**
  - Clear matchup order and bracket system.
  - Track who plays against whom.
  - Matchmaking system for tournament participants.
  - Tournament registration and management.

#### **11. Blockchain** (Store tournament scores on the Blockchain)

- **Category:** Blockchain (Major)
- **Requirements:**

  - Use **Avalanche** and **Solidity** smart contracts on a test blockchain.
  - Implement smart contracts to record, manage, and retrieve tournament scores.
  - Ensure data integrity and immutability.

- **Dependency:** Tournament System.

---

### 📌 Optional Modules (3 Points)

#### **12. Game Customization**

- **Category:** Gaming and user experience (Minor)
- **Requirements:**
  - Offer power-ups, attacks, or special abilities.
  - Offer different maps or themes.
  - Allow customizable game settings.
  - Default options must be available if the user chooses not to customize.

#### **13. Game Statistics** (Game statistics and match history)

- **Category:** User Management (Minor)
- **Requirements:**

  - Track user game statistics (wins, losses, ranking, level, etc.).
  - Display match history (1v1 games, dates, results, opponents).
  - Show achievements and progression.
  - Integrate a leaderboard.

- **Dependency:** Functional Game.

#### **14. Advanced Chat** (Advanced chat features)

- **Category:** Gaming and user experience (Minor)
- **Requirements:**

  - Ability to block users from messaging you.
  - Invite users to play games directly from the chat interface.
  - Game/tournament notifications in chat.
  - Access to user profiles from the chat interface.
  - Chat history persistence.
  - Typing indicators and read receipts.

- **Dependency:** This enhances the basic chat from the "User Interaction" module and requires that module first.

Based on the `en.subject.pdf`, here are the **General Requirements** that apply to the entire project, independent of the specific modules you selected. Failure to meet these results in project rejection.

### 1. General Application Constraints

- **Web Application:** The project must be a web application consisting of a frontend, a backend, and a database.

- **Browser Compatibility:** The website must be compatible with the latest stable version of Google Chrome.

- **Console Errors:** No warnings or errors should appear in the browser console.

- **Multi-user Support (Mandatory):**
- The website must support multiple users simultaneously.

- Users must be able to interact with the application at the same time without conflicts or performance issues.

- Concurrent actions must be handled properly, ensuring no data corruption or race conditions.

- Real-time updates must be reflected across all connected users when applicable.

### 2. Deployment & Version Control

- **Containerization:** Deployment must use a containerization solution (Docker, Podman, or equivalent) and run with a single command.

- **Git Usage:**
  - Git must be used with clear and meaningful commit messages.
  - The repository must show commits from all team members.
  - Commit messages must describe the changes.
  - The history must demonstrate proper work distribution across the team.
- **Submission:** Only the work inside your Git repository will be evaluated.

### 3. Legal & Privacy

- **Mandatory Pages:** The project must include accessible **Privacy Policy** and **Terms of Service** pages.

- **Content:** These pages must contain relevant and appropriate content for your project; they cannot be placeholder or empty pages.

- **Accessibility:** They must be easily accessible from the application (e.g., footer links).

- **🚨 Penalty:** Missing or inadequate pages will result in project rejection.

### 4. Technical Constraints

- **Security:**

  - Credentials (API keys, environment variables) must be stored in a local `.env` file that is ignored by Git.

  - An `env.example` file must be provided.

  - For the backend, HTTPS must be used everywhere.

- **Input Validation:** All forms and user inputs must be properly validated in both the frontend and backend.

- **Database:** The database must have a clear schema and well-defined relations.

- **Frontend:** The frontend must be clear, responsive, and accessible across all devices.

- **Styling:** You must use a CSS framework or styling solution (e.g., Tailwind, Bootstrap, Material-UI, Styled Components).

- **Authentication:**
  - Users must be able to sign up and log in securely.
  - Minimum requirement: Email and password authentication with proper security (hashed passwords, salted, etc.).

### 5. Team & Management

- **Team Size:** The project is for a group of 4-5 people.

- **Roles:** You must assign and document specific roles: Product Owner, Project Manager, Technical Lead, and Developers.

- **Evaluation:** All team members must be able to explain the project and their specific contributions during the evaluation.

### 6. README.md Requirements

A comprehensive `README.md` file at the root of the repository is mandatory and must include:

- **Header:** The exact italicized line: _This project has been created as part of the 42 curriculum by <login1>..._.

- **Description:** Project name, goal, overview, and key features.

- **Instructions:** Prerequisites, environment setup, and step-by-step execution commands.

- **Team Information:** List of members, assigned roles, and brief responsibilities.

- **Project Management:** Description of work organization, tools used, and communication channels .

- **Technical Stack:** Frontend/Backend technologies, Database choice, and justification for technical choices .

- **Database Schema:** Visual representation or description of tables and relationships.

- **Features List:** Complete list of features and which member worked on them .

- **Modules:** List of chosen modules, point calculation, justification (especially for custom modules), and implementation details .

- **Individual Contributions:** Detailed breakdown of each member's work and challenges faced .

- **AI Usage:** A "Resources" section describing how AI was used, for which tasks, and which parts of the project.

- **Language:** The README must be written in English.
