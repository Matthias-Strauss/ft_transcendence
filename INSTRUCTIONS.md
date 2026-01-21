# 🚀 ft_transcendence - Team Instructions

## 🏁 Getting Started

1. **Environment Setup:**
   - Create your local secrets file (never commit this!):

     ```bash
     cp .env.example .env
     ```

   - _Action:_ Fill in the `.env` with your local keys/configs.

2. **Run the Project:**

   ```bash
   docker-compose up --build
   ```

   - App will run at: `http://localhost:3000` (check `.env` for ports).

---

## 🌳 Git Workflow

- **Main Branch:** `main` is for production-ready code only. **Do not push directly to main.**
- **Branch Naming:**
  - Features: `feat/feature-name` (e.g., `feat/auth-login`)
  - Fixes: `fix/bug-name` (e.g., `fix/chat-websocket`)
  - Docs: `docs/update-readme`
- **Process:**
  1. Create a branch.
  2. Work & Commit (Use descriptive commit messages: "Add user login route").
  3. Push & Open a Pull Request (PR).
  4. **Review:** At least 1 teammate must approve before merging.

---

## 📂 Project Structure -- Monorepo

- `root`: Config files (`docker-compose.yml`, `.eslintrc.js`, `.env.example`).
- `/frontend`: All Client-side code (React/Vue).
- `/backend`: All Server-side code (NestJS/Django).
- `/dont_sync`: Private notes (ignored by git).

---

## 🎨 Coding Standards

- **Formatting:** I configured **Prettier** + **ESLint** so we have the same formatting.
  - _Requirement:_ Run `npm install` in project root in order to install "Prettier" and "ESLint". Alternatively install them as extensions in VS Code.
  - The configuration formats Files automatically on Save.
- **Secrets:**
  - ❌ NEVER hardcode API keys or passwords.
  - ✅ Use `process.env.VARIABLE_NAME` and add keys to `.env`.
- **Comments:** Explain _why_ complex logic exists, not _what_ the code does.

---

## 🗣️ Communication

- **Task Tracking:** [GitHub Issues](https://github.com/Matthias-Strauss/ft_transcendence/issues)
- **Chat:** WhatsApp (let me know if you prefer something different)
- **Sync:** Weekly standup on [Day] at [Time] communicated in WhatsApp. We'll keep this casual, with remote option, and only meet if we deem it necessary :)
