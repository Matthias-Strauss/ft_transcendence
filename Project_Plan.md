# 🏆 Project: "Social Media with MiniGames"

**Target Score:** 17 Points (MVP) → 22 Points (Tier 1) → 28 Points (Max)

The strategy relies on implementing a simple game (e.g., Tic-Tac-Toe) to unlock the "Gaming" dependency tree, combined with standard "Social" features.

## 1️⃣ Phase 1: The Core MVP (17 Points)

**Goal:** Secure the **19 points** necessary for a full **125% score**.

*Focus:* Building a solid social media foundation with a simple game, including tournaments.

| Module | Category | Points | Dependency | Complexity | Comment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Use a Framework** | Web | **2** | None | 🟢 Low | |
| **Standard User Mgmt** | User Mgmt | **2** | None | 🟢 Low | |
| **User Interaction** | Web | **2** | None | 🟢 Low | |
| **File Upload** | Web | **1** | None | 🟢 Low | User avatar upload (required anyway). |
| **Real-time Features** | Web | **2** | None | 🟡 Moderate | |
| **Use an ORM** | Web | **1** | None | 🟢 Low | Use Prisma/TypeORM. Simplifies DB work |
| **Web-based Game** | Gaming | **2** | None | 🟡 Moderate | Tic-Tac-Toe |
| **Remote Players** | Gaming | **2** | Game | 🟡 Moderate | |
| **AI Opponent** | AI | **2** | Game | 🟢 Low | Minimax Algo ? |
| **Tournament System** | Gaming | **1** | Game | 🟡 Moderate | |
| **Blockchain** | Blockchain | **2** | Tournament | 🟡 Moderate | Store tournament scores |
| **Optional: Game Customization** | Gaming | **1** | Game | 🟢 Low | Allow changing board color or icons. |
| **Optional: Game Statistics** | User Mgmt | **1** | Game | 🟢 Low | Track wins/losses in the user profile. |
| **Optional: Advanced Chat** | Gaming | **1** | Game | 🟢 Low | Add "Block User" and "Invite to Play" buttons. |
| **BASE TOTAL** | **19** | | | **with Optional:** | **22** |

**Dependencies:**

* Blockchain → requires Tournament.
* Tournament → requires Game.
* AI, Stats, Customization, Remote → require Game.

---

## ⊕ Stretch Goals (Moderate Effort)

**Goal:** Reach up to **28 Points**.

*Focus:* Standard features that require specific libraries or logic but are well-documented.

| Module | Category | Points | Implementation Notes |
| :--- | :--- | :--- | :--- |
| **Spectator Mode** | Gaming | **1** | Allow a 3rd user to join the WebSocket room read-only. |
| **OAuth Integration** | User Mgmt | **1** | "Login with 42" or Google using Passport.js. |
| **2FA (Two-Factor)** | User Mgmt | **1** | Generate QR codes for Google Authenticator. |
| **GDPR Compliance** | Data | **1** | "Download Data" (JSON) and "Anonymize/Delete" buttons. |
| **Advanced Permissions** | User Mgmt | **2** | Admin roles (ban users, delete messages). |
| **CUMULATIVE SCORE** | | **28** | |

---

## Avoid: Diminishing Returns

*These modules have a poor Effort-to-Point ratio or strict incompatibilities.*

* **Multiplayer 3+ (2 pts):** Hard to balance game logic for 3+ people (vs 1v1).
  * Solution: Make multiplayer even number of players only, eg. pong with 4.
* **Server-Side Rendering (1 pt):** SSR introduces hydration headaches.
* **Multiple Languages (1 pt):** Requires translating *every* string in the UI. Very tedious.
* **Microservices (2 pts):** High DevOps overhead for a small team.
