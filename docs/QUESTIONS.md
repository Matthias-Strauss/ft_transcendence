
# 👥 Open Questions

* **What is our Git workflow?** Are we using feature branches with Pull Requests? Who reviews code before merging?

## 🛠️ Technology Stack

❗Next.js, Nuxt.js, SvelteKit count as Fullstack frameworks (Front + Back)

* **Which Frontend Framework are we choosing?:** (React, Vue, Angular, Svelte, etc.?)

* **Which Backend Framework are we choosing?:** (Express, NestJS, Django, Flask, Ruby on Rails,
etc.?)

  *Considerations: If we choose NestJS, we get strict typing and architecture out of the box (good for "Standard User Mgmt"). If we choose Django, we get a built-in Admin panel (very fast setup). Please pick what you are most comfortable and confident in :)*

* **Which ORM are we using?** (Prisma, TypeORM, Sequelize, etc.?)

* **Which specific library will we use for WebSockets?** (Socket.io, native WebSockets, etc.)
  * *Considerations: Socket.io is generally recommended for the "Game" module because it simplifies the "reconnection logic" requirement.*

* **Which Styling Framework?** (Tailwind, Bootstrap, Material UI, etc.?)

* **Do we want to include OAuth (currently excluded)?** (should be simpler than implementing a secure password reset flow, no?)

## 🚀 Deployment & DevOps

* **Who is handling the Docker setup?** It needs to run with a single command (`docker-compose up`).

* **Seperate Docker Containers, or all in one?**

* **How are we handling HTTPS?** (Self-signed certificates for localhost?)
