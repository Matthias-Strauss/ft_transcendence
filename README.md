*This project has been created as part of the 42 curriculum by [mstrauss], [kruseva], [jmuhlber], [rriebsch], [ghodges].*

# ft_transcendence

## 📖 Description

ft_transcendence is the final project of the 42 Common Core. It is a comprehensive web application designed to be a social media platform with social games.
This project combines a robust backend, a modern frontend, and a relational database to create a seamless social gaming experience.

**Key Features:**

* **Game:** A real-time multiplayer implementation of Tic-Tac-Toe with tournament capabilities.
* **Social:** User profiles, friends lists, and real-time chat.
* **Security:** Two-factor authentication (if added), encrypted data, and secure authentication.
* **Blockchain:** Tournament scores are immutably recorded on the Avalanche blockchain.

---

## 🛠 Instructions

### Prerequisites

* Docker & Docker Compose
* [Any other tools, e.g., Node.js version, Make, etc.] **✏️ ADD ALL DEPENDENCIES YOU ADD HERE!!!**

### Installation & Execution

This project uses Docker to ensure consistency across environments.

1. **Clone the repository:**

    ```bash
    git clone git@github.com:Matthias-Strauss/ft_transcendence.git
    cd ft_transcendence
    ```

2. **Environment Setup:**
    Create a `.env` file in the root directory based on the provided example:

    ```bash
    cp .env.example .env
    # Edit .env and fill in your credentials (API Keys, DB config, etc.)
    ```

    Or rename the provided .env.example to .env and replace the necccessary fields with real values.

3. **Run the application:**
    To build and start the containers:

    ```bash
    docker-compose up --build
    ```

4. **Access:**
    Open your browser and navigate to: `http://localhost:8080`

---

## 👥 Team Information

| Team Member | Role | Responsibilities |
| :--- | :--- | :--- |
| **[mstrauss]** | Product Owner | Defined vision, prioritized features, maintained backlog. |
| **[rriebsch]** | Project Manager | Facilitated coordination, tracked deadlines, managed blockers. |
| **[ghodges]** | Tech Lead | Oversaw architecture, code quality, and technology stack decisions. |
| **[kruseva]** | Developer | Implemented features, wrote tests, participated in code reviews. |
| **[jmuhlber]** | Developer | Implemented features, wrote tests, participated in code reviews. |

---

## 📅 Project Management

**Organization:**
We organized our work using Agile/Scrum with Weekly stand-ups.

**Tools Used:**

* **Task Tracking:** GitHub Issues
* **Communication:** WhatsApp
* **Version Control:** Git & GitHub
* **✏️ ADD ANY ADDITIONAL TOOLS YOU INTRODUCE HERE YOU ADD HERE!!!**

---

## 💻 Technical Stack

* **✏️ DOCUMENT YOUR TECH CHOICES HERE. MAKE SURE TO PROVIDE REASONING!!!**

### Frontend

* **Framework:** [e.g., React, Vue, Angular]
* **Reasoning:** [Brief justification, e.g., "Chosen for its component-based architecture and state management capabilities."]

### Backend

* **Framework:** [e.g., NestJS, Django, Ruby on Rails]
* **Reasoning:** [Brief justification.]

### Database

* **Database:** [e.g., PostgreSQL]
* **Reasoning:** [Brief justification.]

* **ORM:** [e.g., Prisma, TypeORM]
* **Reasoning:** [Brief justification.]

### Blockchain

* **Network:** Avalanche
* **Language:** Solidity, Typescript
* **Tooling:** Hardhat, Metamask
* **Reasoning:** Hardhat and Metamask were selected because they are more mature toolings in this space than their alternatives.

---

## 🗄 Database Schema

![Database Schema](./path/to/schema_image.png) # ✏️ WE WILL ADD THIS ONCE DATABASE IS FINAL FEEL FREE TO TRACK THE CURRENT STATE BELOW THOUGH!!!

* **Users:** Stores authentication data, social-posts, likes & dislikes, stats, and profile info.
* **Matches:** Stores history of games played.
* **Friendships:** Manages user relationships.
* **Tournaments:** Tracks tournament brackets and results.

---

## ✅ Implemented Modules

We have implemented the following modules to achieve the required **14 points** (Planned Target: 19 Core + 3 Optional = 22 Points).

### 1. Web (Total: 6 Points)

| Module | Type | Points | Description/Implementation |
| :--- | :--- | :--- | :--- |
| **Use a Framework** | Major | 2 | Implemented using [Frontend Framework] and [Backend Framework]. |
| **User Interaction** | Major | 2 | Users can chat, add friends, and view profiles. |
| **Real-time Features** | Major | 2 | Used [e.g., Socket.io] for live game updates and chat broadcasting. |
| **File Upload** | Minor | 1 | Users can upload avatars (validated for size/type). |
| **Use an ORM** | Minor | 1 | Database interaction handled via [ORM Name]. |

### 2. User Management (Total: 2 Points + Optional)

| Module | Type | Points | Description/Implementation |
| :--- | :--- | :--- | :--- |
| **Standard User Mgmt** | Major | 2 | Secure auth, profile updates, and avatar management. |
| **Game Statistics** | Minor | 1 | *(Optional)* Detailed win/loss tracking and leaderboards. |

### 3. Gaming & Experience (Total: 5 Points + Optional)

| Module | Type | Points | Description/Implementation |
| :--- | :--- | :--- | :--- |
| **Web-based Game** | Major | 2 | **Tic-Tac-Toe**: A logic-based game with clear win/loss states. |
| **Remote Players** | Major | 2 | Two users on different devices can play via WebSockets. |
| **Tournament System** | Minor | 1 | Bracket system for organized player matchmaking. |
| **Game Customization** | Minor | 1 | *(Optional)* Users can customize game assets/themes. |
| **Advanced Chat** | Minor | 1 | *(Optional)* Invite to play, block users, and persistent history. |

### 4. Artificial Intelligence (Total: 2 Points)

| Module | Type | Points | Description/Implementation |
| :--- | :--- | :--- | :--- |
| **AI Opponent** | Major | 2 | An AI using the Minimax algorithm that simulates human play for the game TicTacToe. |

### 5. Blockchain (Total: 2 Points)

| Module | Type | Points | Description/Implementation |
| :--- | :--- | :--- | :--- |
| **Blockchain** | Major | 2 | Integration with Avalanche (using Solidity) to store tournament scores. |

---

## ✨ Features List & Assignment

**✏️ DOCUMENT THE INDIVIDUAL FEATURES YOU ARE WORKING ON, USE YOUR 42 LOGIN NAME. THE BELOW ARE EXAMPLES!!!**

| Feature | Developer(s) | Description |
| :--- | :--- | :--- |
| **Auth System** | [Login] | OAuth, JWT handling, and 2FA. |
| **Tic-Tac-Toe Logic** | [Login] | Game state management and win detection. |
| **Chat System** | [Login] | WebSocket integration for real-time messaging. |
| **Blockchain** | [mstrauss] | Smart contract development and Web3 integration. |
| **Tournament Logic** | [mstrauss] | Developed tournament logic for Minigame(s). |
| **Frontend UI** | [Login] | Responsive design and component structure. |
| **DevOps** | [Login] | Docker configuration and deployment scripts. |

---

## 👷 Individual Contributions

**✏️ DOCUMENT THE MODULES YOU ARE WORKING ON AND THE CHALLENGES YOU FACE. USE YOUR 42 LOGIN NAME. I HAVE PROVIDED AN EXAMPLE!!!**

### [mstrauss]

* **Modules:** e.g. Blockchain, Tournament System.
* **Contribution:** e.g. Wrote the Solidity smart contract. Built the tournament bracket generation logic.
* **Challenges:** e.g., "Integrating the Web3 provider with the existing frontend state."

### [kruseva]

* **Modules:**
* **Contribution:**
* **Challenges:**

### [jmuhlber]

* **Modules:**
* **Contribution:**
* **Challenges:**

### [rriebsch]

* **Modules:**
* **Contribution:**
* **Challenges:**

### [ghodges]

* **Modules:**
* **Contribution:**
* **Challenges:**

---

## 📚 Resources & AI Usage

### Documentation

* **Category Title (if neccessary)**
* [Link to Framework Docs]
* [Link to ...]
* **Blockchain:**
  * [Link to Avalanche Blockchain Docs](https://build.avax.network/docs/)
  * [Hardhat Docs](https://hardhat.org/docs/)
  * [Metamask Docs](https://docs.metamask.io/)

### AI Usage

*As per the subject requirements, we transparently declare our use of AI tools:*

* **Tools Used:** Gemini
* **Use Cases:**
  * *Project Planning:*
    * Extracting key information from the subject.pdf and making it digestible.
    * Ranking Complexity of Topics.
    * Checking for module dependency issues.
    * Quick formatting.
  * *Debugging:*
    * Used to explain cryptic error messages in the backend.
  * *Learning new Tech:* Used "Guided learning" mode to develop long lastiung understanding about the technologies used that are new to us.
  * *Tests:* Tests were generated with AI assistance in order to support rapid development.
