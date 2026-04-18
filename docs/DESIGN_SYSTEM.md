# 🎨 Custom Design System

This document explains the custom design system claimed in the README. The goal of the system is to keep the social feed, profile pages, chat flows, and Pong shell visually consistent while still allowing feature-specific layouts.

## 1. Visual Identity

### 1.1 Color Palette

The frontend uses a small set of shared CSS custom properties defined in `frontend/styles/index.css` and then re-used throughout Tailwind utility classes and inline styles.

| Role             | Token / Value        | Usage                                                               |
| :--------------- | :------------------- | :------------------------------------------------------------------ |
| Primary accent   | `--color-1: #6a00ff` | Main call-to-action buttons, active highlights, icon accents        |
| Secondary accent | `--color-2: #ff0095` | Secondary action emphasis, gradients, game highlights, liked states |
| Tertiary accent  | `--color-3: #95ff00` | Positive / standout highlight color, game and tag accents           |
| App background   | `#0f172a`            | Main application shell background                                   |
| Surface          | `#1e293b`, `#1b1f23` | Hover states, dropdowns, content surfaces                           |
| Border           | `#39444d`            | Dividers, panel boundaries, image frames                            |
| Primary text     | `#f7f9f9`            | Main readable text on dark surfaces                                 |
| Secondary text   | `#8b98a5`            | Metadata, usernames, helper text                                    |

### 1.2 Typography

The application uses the default sans-serif system stack exposed through Tailwind’s generated base styles. The hierarchy is enforced through consistent size and weight choices rather than custom font families.

| Role                   | Typical Size     | Weight         | Usage                                        |
| :--------------------- | :--------------- | :------------- | :------------------------------------------- |
| Section / page title   | `20px` to `24px` | Bold           | Feed headers, empty states, feature headings |
| Primary label / action | `15px` to `16px` | Bold or medium | Sidebar labels, buttons, user names          |
| Body text              | `15px`           | Normal         | Posts, comments, chat message content        |
| Metadata / helper text | `13px` to `15px` | Normal         | Usernames, counters, secondary descriptions  |

### 1.3 Icons

The design system uses `lucide-react` as the icon library. Icons are consistently used as lightweight outline-style affordances in navigation, feed actions, chat actions, notifications, and game surfaces.

Examples from the current UI:

- Navigation: `Home`, `Trophy`, `Bell`, `MessageSquare`, `Users`, `Bookmark`
- Feed / actions: `Heart`, `MessageCircle`, `Share2`, `MoreHorizontal`, `ImagePlus`
- Game / shell: `Gamepad2`, `Play`, `Zap`

## 2. Reusable Component Library

The project currently includes the following reusable frontend components that make up the claimed custom design system.

### 1. `LeftSidebar`

- Purpose: Main application navigation shell.
- Reuse: Shared navigation container across authenticated app views.
- Consistency rules: Fixed width, dark shell background, rounded navigation items, shared CTA styling for post creation.

### 2. `SidebarItem`

- Purpose: Reusable nav row used by the left sidebar.
- Reuse: Handles icon + label layout for both links and action buttons.
- Consistency rules: Shared spacing, hover surface, text sizing, rounded-full interaction area.

### 3. `User`

- Purpose: Shared identity block for avatar, display name, username, and optional verification state.
- Reuse: Feed cards, comments, and profile-linked user references.
- Consistency rules: Common avatar sizing, text treatment, and route linking behavior.

### 4. `AuthedImage`

- Purpose: Reusable image component for protected media.
- Reuse: Avatars, post images, and other authenticated file-backed media.
- Consistency rules: Centralizes authenticated fetch behavior so protected assets render consistently across the app.

### 5. `PostCard`

- Purpose: Reusable feed card for rendering a post and its primary actions.
- Reuse: Main feed and any post-list context.
- Consistency rules: Shared border rhythm, hover surface, action-row treatment, tag pill styling, and media frame styling.

### 6. `NewPost`

- Purpose: Shared post-composer surface.
- Reuse: Feed creation flow.
- Consistency rules: Shared composer spacing, avatar gradient placeholder, media preview frame, and primary action button treatment.

### 7. `Dropdown`

- Purpose: Reusable action menu for post-level contextual actions.
- Reuse: Save/share and similar item-level commands.
- Consistency rules: Shared dark popup surface, border color, spacing, and hover state.

### 8. `CommentSection`

- Purpose: Reusable post-comment thread and composer block.
- Reuse: Any feed context that opens inline comments.
- Consistency rules: Shared comment input treatment, icon-button states, avatars, and border language.

### 9. `PostsFeed`

- Purpose: Reusable feed-list container that coordinates multiple post cards.
- Reuse: Feed and profile-adjacent post views.
- Consistency rules: Shared stacking and content rhythm for post collections.

### 10. `FriendsCard`

- Purpose: Reusable relationship card for friend / request / user-discovery contexts.
- Reuse: Friends page and related user-management views.
- Consistency rules: Shared card composition, action alignment, and profile-preview treatment.

### 11. `ChatPanel`

- Purpose: Reusable messaging surface for active conversations.
- Reuse: Fixed right-side chat panel and shared chat layout.
- Consistency rules: Shared message-shell styling, toggle affordances, and real-time interaction surface.

### 12. `GamePanel`

- Purpose: Reusable game-launch and game-status presentation shell.
- Reuse: Pong-related call-to-action and active game states.
- Consistency rules: Shared use of accent gradients, rounded surfaces, and prominent action buttons.

## 3. System Patterns

### 3.1 Layout

- Authenticated app layout is built around a fixed left navigation, central content column, and optional right-side chat panel.
- Borders and dark surfaces are used to separate major zones instead of large shadows.
- Rounded-full buttons and rounded-2xl media containers are recurring shape choices across the product.

### 3.2 Interaction Language

- Primary actions use `--color-1`.
- Strong secondary / emotional actions such as likes or game emphasis use `--color-2`.
- Status / standout tags and game accents use `--color-3`.
- Hover feedback is subtle and usually implemented through slightly lighter dark surfaces or translucent accent backgrounds.

### 3.3 Media and File Handling

- Protected images are rendered through `AuthedImage` so secured assets are handled consistently.
- Post and chat media use bordered, rounded containers to match the rest of the UI.
- Upload-related interactions reuse the same accent and preview patterns used elsewhere in the interface.

## 4. Implementation Notes

- Frontend technology: React + TypeScript + Tailwind-generated utility classes.
- Icon library: `lucide-react`.
- Core shared tokens live in `frontend/styles/index.css`.
- Reusable components currently live in `frontend/components/ui/` plus a few higher-level shell components in `frontend/components/`.
