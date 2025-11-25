# 🗓️ Secret Santa App: Implementation Timeline (Checklist)

This is a structured timeline with granular tasks to facilitate quick development.

## Phase 1: Setup & Internationalization (i18n) 🌍
| Status | Task | Next.js / Tech Focus | Est. Time |
| :---: | :--- | :--- | :--- |
| $\square$ | 1. Initialize Next.js project and configure Vercel deployment. | Next.js App Router | 2 hrs |
| $\square$ | 2. Integrate **Shadcn UI** components and utility setup (Tailwind CSS). | `npx shadcn@latest init` | 1 hr |
| $\square$ | 3. Install and configure **`next-intl`** for `en` and `pt`. | `i18n.ts`, `middleware.ts` | 2 hrs |
| $\square$ | 4. Define and connect MongoDB/Mongoose models (`AdminUser`, `Group`, `Participant`). | Mongoose Schemas & DB Client | 3 hrs |
| $\square$ | 5. Configure environment variables for MongoDB, AWS SES, and Session Secret. | `.env.local` | 1 hr |

## Phase 2: Core Authentication & User Flow 🔒
| Status | Task | Next.js / Tech Focus | Est. Time |
| :---: | :--- | :--- | :--- |
| $\square$ | 6. Build the **`/get-started`** page (Form + i18n text). | Shadcn Components, Server-side Guards | 2 hrs |
| $\square$ | 7. Implement **`/api/admin-signup`** to create `AdminUser`, generate code, and send email (AWS SES). | API Route, SES Utility, `AdminUser` CRUD | 3 hrs |
| $\square$ | 8. Implement **`/api/verify`** endpoint for code validation and session cookie creation. | API Route, Session Utility (e.g., `iron-session`), Cookie Logic | 3 hrs |
| $\square$ | 9. Build the **`/[locale]/verify`** page to handle verification link/code flow. | Client-side redirects, Error Handling | 2 hrs |
| $\square$ | 10. Implement a middleware/wrapper function to check for a valid session cookie on protected routes. | Next.js Middleware/HOC | 2 hrs |

## Phase 3: Group & Invitation Logic 🤝
| Status | Task | Next.js / Tech Focus | Est. Time |
| :---: | :--- | :--- | :--- |
| $\square$ | 11. Implement **`/api/group/create`** (Admin-only, authenticated) and generate the unique `invite_id`. | `Group` CRUD, Session Guard | 3 hrs |
| $\square$ | 12. Build the **`/[locale]/join`** page to validate `inviteId` and collect Name/Email. | `Group` lookup, Frontend form | 2 hrs |
| $\square$ | 13. Implement **`/api/group/join`** to create a new `Participant` and send *their* verification code/link. | `Participant` CRUD, SES, `invite_id` validation | 3 hrs |
| $\square$ | 14. Build the **Group Dashboard** (`/[locale]/group/[groupId]`) for the group owner. | Protected Route, Data Fetching | 2 hrs |

## Phase 4: Lottery & Final Assignment 🎯
| Status | Task | Next.js / Tech Focus | Est. Time |
| :---: | :--- | :--- | :--- |
| $\square$ | 15. Implement the **`/api/lottery/run`** endpoint with the no-self-draw algorithm. | API Route, Algorithm Implementation | 4 hrs |
| $\square$ | 16. Integrate the logic to update `Participant.recipient_id` and generate final assignment emails. | MongoDB Update, SES Email Template | 3 hrs |
| $\square$ | 17. Build the **Recipient Dashboard** (`/[locale]/group/[groupId]/dashboard`) to display the assigned recipient. | Protected Route, `Participant.recipient_id` lookup | 2 hrs |
| $\square$ | 18. Final i18n review and component styling (Shadcn finalization). | i18n Text files, Styling Tweaks | 2 hrs |

| **TOTAL ESTIMATED IMPLEMENTATION TIME:** | **35 Hours (Approx. 4-5 Days)** |