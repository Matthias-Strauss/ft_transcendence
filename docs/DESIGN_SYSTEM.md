# 🎨 Custom Design System

> **Note:** This design system was built from scratch to ensure consistency across the ft_transcendence platform. It includes a defined color palette, typography rules, custom iconography, and a library of over 10 reusable UI components.

## 1. Visual Identity

### 1.1 Color Palette

We utilize a set of CSS variables (or Tailwind config) to maintain thematic consistency.

| Role           | Color Name    | Hex Code  | Usage                                        |
| :------------- | :------------ | :-------- | :------------------------------------------- |
| **Primary**    | `Neon Blue`   | `#00D4FF` | Main actions, active states, links           |
| **Secondary**  | `Deep Purple` | `#6A00FF` | Accents, gradients, secondary buttons        |
| **Background** | `Void Black`  | `#0F172A` | Main page background                         |
| **Surface**    | `Slate Gray`  | `#1E293B` | Cards, modals, sidebars                      |
| **Success**    | `Cyber Green` | `#10B981` | Success messages, online status              |
| **Error**      | `Glitch Red`  | `#EF4444` | Error states, delete actions, offline status |
| **Text**       | `Ghost White` | `#F8FAFC` | Primary text content                         |

### 1.2 Typography

**Font Family:** `[e.g., 'Inter', sans-serif]`
**Headings:** `[e.g., 'Orbitron', display]` (Used for h1, h2, branding)

| Scale     | Size     | Weight | Usage              |
| :-------- | :------- | :----- | :----------------- |
| **H1**    | 2.5rem   | 700    | Main Page Titles   |
| **H2**    | 2.0rem   | 600    | Section Headers    |
| **Body**  | 1.0rem   | 400    | Standard text      |
| **Small** | 0.875rem | 300    | Metadata, captions |

### 1.3 Icons

We use **[e.g., Lucide React / Heroicons / Custom SVGs]** wrapped in a custom `<Icon />` component to ensure consistent sizing and coloring.

- **Style:** [e.g., Outline/Solid]
- **Stroke Width:** [e.g., 2px]

---

## 2. Reusable Component Library (Minimum 10)

_The following components are implemented as reusable modules with props for customization._

### 1. `<Button />`

- **Variants:** Primary, Secondary, Ghost, Danger.
- **Props:** `size` (sm/md/lg), `isLoading` (bool), `icon` (component).
- **Usage:** Used for all user interactions (Login, Submit, Game Controls).

### 2. `<InputField />`

- **Features:** Built-in label, error message handling, and icon support.
- **Validation:** Visual states for focus, error, and disabled.
- **Usage:** Login forms, chat input, profile editing.

### 3. `<Avatar />`

- **Variants:** Circle, Rounded-Square.
- **Features:** Displays user image or initials fallback. Includes "Online/Offline" status indicator dot.
- **Usage:** User profile, friend lists, chat headers.

### 4. `<Card />`

- **Description:** The fundamental container for content.
- **Styles:** Glassmorphism effect with border-radius and subtle shadow.
- **Usage:** Game stats, User Profile summary, Match history items.

### 5. `<Modal />`

- **Description:** A reusable dialog overlay with backdrop blur.
- **Features:** Header, Body, Footer slots, and "Click outside to close" logic.
- **Usage:** 2FA entry, Edit Profile form, Game Over screen.

### 6. `<Badge />`

- **Description:** Small status indicators.
- **Variants:** Info (Blue), Success (Green), Warning (Yellow), Error (Red).
- **Usage:** Displaying user role (Admin/User), game status (Live/Finished).

### 7. `<Loader />` / `<Spinner />`

- **Description:** Animated SVG component matching the primary color.
- **Usage:** Loading states for data fetching, matchmaking waiting screen.

### 8. `<ToggleSwitch />`

- **Description:** An interactive binary control.
- **Usage:** Enable/Disable 2FA, Dark/Light mode toggle.

### 9. `<Alert />` / `<Toast />`

- **Description:** Feedback messages that appear temporarily.
- **Variants:** Success, Error, Info.
- **Usage:** "Friend request sent", "Login failed", "Game started".

### 10. `<Tooltip />`

- **Description:** Hover-triggered informational text.
- **Usage:** Explaining icons, showing full timestamps in chat.

### 11. `<Navigation />` / `<Sidebar />`

- **Description:** Responsive navigation container.
- **Features:** Collapsible on mobile, highlights active route.

---

## 3. Implementation Details

- **Technology:** [e.g., React Functional Components + Tailwind CSS]
- **Organization:** All components are located in `frontend/src/components/ui`.
- **Consistency:** We adhere to the [Atomic Design] methodology (Atoms -> Molecules -> Organisms).
