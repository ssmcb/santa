# Secret Santa App: Implementation Timeline

This is a structured timeline with granular tasks to facilitate quick development.

## Phase 1: Setup & Internationalization

| Status | Task                                                                                | Next.js / Tech Focus         |
| :----: | ----------------------------------------------------------------------------------- | ---------------------------- |
|   ☑   | 1. Initialize Next.js project and configure Vercel deployment                       | Next.js App Router           |
|   ☑   | 2. Integrate Shadcn UI components and utility setup (Tailwind CSS)                  | `npx shadcn@latest init`     |
|   ☑   | 3. Install and configure next-intl for `en` and `pt`                                | `i18n.ts`, `middleware.ts`   |
|   ☑   | 4. Define and connect MongoDB/Mongoose models (`AdminUser`, `Group`, `Participant`) | Mongoose Schemas & DB Client |
|   ☑   | 5. Configure environment variables for MongoDB, AWS SES, and Session Secret         | `.env.local`                 |

## Phase 2: Core Authentication & User Flow

| Status | Task                                                                                                                     | Next.js / Tech Focus                                    |
| :----: | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
|   ☑   | 6. Build the `/get-started` page (Form + i18n text)                                                                      | Shadcn Components, Server-side Guards                   |
|   ☑   | 7. Implement `/api/admin-signup` to create `AdminUser`, generate code, and send email (AWS SES)                          | API Route, SES Utility, `AdminUser` CRUD                |
|   ☑   | 8. Implement `/api/verify` endpoint for code validation and session cookie creation                                      | API Route, Session Utility (iron-session), Cookie Logic |
|   ☑   | 9. Build the `/[locale]/verify` page with email display, edit email functionality, and resend code button (30s cooldown) | Client-side state management, Error Handling            |
|   ☑   | 10. Implement `/api/resend-code` endpoint with cooldown validation using `code_sent_at`                                  | API Route, Cooldown Logic, SES                          |
|   ☑   | 11. Implement a middleware/wrapper function to check for a valid session cookie on protected routes                      | Next.js Middleware/HOC                                  |

## Phase 3: Group & Invitation Logic

| Status | Task                                                                                                                                        | Next.js / Tech Focus                            |
| :----: | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
|   ☑   | 12. Implement `/api/group/create` (Admin-only, authenticated) with `name`, `date`, `place`, `budget` fields and generate unique `invite_id` | `Group` CRUD, Session Guard                     |
|   ☑   | 13. Build the `/[locale]/join` page to validate `inviteId` and collect Name (single field) and Email                                        | `Group` lookup, Frontend form                   |
|   ☑   | 14. Implement `/api/group/join` to create a new `Participant` with `code_sent_at` tracking and send verification code/link                  | `Participant` CRUD, SES, `invite_id` validation |
|   ☑   | 15. Build the Group Owner Dashboard (`/[locale]/group/[groupId]`) with participant list and group metadata                                  | Protected Route, Data Fetching                  |
|   ☑   | 16. Add invitation link with copy button and WhatsApp share button (`wa.me/?text=...`) to owner dashboard                                   | Frontend, Clipboard API, URL encoding           |
|   ☑   | 17. Implement email invitation feature: form to send invitations and list of sent emails (from `invitations_sent`)                          | Frontend form, State management                 |
|   ☑   | 18. Implement `/api/group/send-invitation` endpoint with duplicate check and tracking in `invitations_sent` array                           | API Route, `Group` update, SES                  |

## Phase 4: Lottery & Final Assignment

| Status | Task                                                                                                                                    | Next.js / Tech Focus                               |
| :----: | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
|   ☑   | 19. Implement the `/api/lottery/run` endpoint with no-self-draw algorithm and owner permission check                                    | API Route, Algorithm Implementation                |
|   ☑   | 20. Update `Participant.recipient_id` and send assignment emails with `assignment_email_status` and `assignment_email_sent_at` tracking | MongoDB Update, SES Email Template                 |
|   ☑   | 21. Build the Participant Dashboard (`/[locale]/group/[groupId]/dashboard`) to display the assigned recipient name                      | Protected Route, `Participant.recipient_id` lookup |
|   ☑   | 22. Add email delivery status table to owner dashboard (participant name + status color-coded)                                          | Frontend table, Status indicators                  |

## Phase 5: Email Delivery Tracking & Polish

| Status | Task                                                                                                                  | Next.js / Tech Focus                  |
| :----: | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
|   ☑   | 23. Configure AWS SES to publish notifications to SNS topic                                                           | AWS Console, SNS Topic setup          |
|   ☑   | 24. Create SQS queue and subscribe to SNS topic for delivery/bounce/complaint notifications                           | AWS Console, SQS setup                |
|   ☑   | 25. Implement `/api/webhooks/ses-notifications` endpoint to process SQS messages and update `assignment_email_status` | API Route, SQS Client, Status updates |
|   ☑   | 26. Set up polling or Lambda trigger to process SQS queue messages                                                    | AWS Lambda or Cron job                |
|   ☑   | 27. Final i18n review and component styling (Shadcn finalization)                                                     | i18n Text files, Styling Tweaks       |
