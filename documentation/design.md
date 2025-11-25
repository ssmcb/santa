# Secret Santa App: Technical Design Document

## 1. Stack & Tools

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Frontend/Backend** | Next.js 16 (App Router) | Full-stack capability with API Routes for rapid development. |
| **Styling/UI** | Shadcn UI + Tailwind CSS 4 | Provides accessible, well-designed components and utility-first styling for speed. |
| **Internationalization** | next-intl | Robust routing and component-level translation support for `en` and `pt`. |
| **Database** | MongoDB (via Mongoose) | Flexible, scalable NoSQL store for quick schema iteration. |
| **Email Service** | AWS SES | Reliable, cost-effective transactional email for verification and assignments. |
| **Session Management** | Encrypted Cookies (iron-session) | Simple, stateless session management tied to the verification code flow. |

## 2. Data Models (MongoDB)

### 2.1 AdminUser Collection

**Purpose:** Stores the single user/email who is allowed to "Get Started" and create the first group.

| Field | Type | Description |
|-------|------|-------------|
| `email` | `String` | The email of the first-ever user (unique). |
| `name` | `String` | The name of the first-ever user. |
| `is_registered` | `Boolean` | Always `true` after the first user signs up. Used to guard the `/get-started` route. |

### 2.2 Group Collection

**Purpose:** Defines a Secret Santa event.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | `ObjectId` | Unique identifier. |
| `name` | `String` | Event name (e.g., "Family Christmas 2025"). |
| `budget` | `String` | Suggested gift budget. |
| `date` | `Date` | Date of the gift exchange. |
| `place` | `String` | Location/place of the event. |
| `owner_email` | `String` | The email of the user who created the group. |
| `participants` | `Array<ObjectId>` | References to `Participant` documents. |
| `invite_id` | `String` | Unique, unguessable ID for invitation links. |
| `is_drawn` | `Boolean` | True if the lottery has been executed. |
| `invitations_sent` | `Array<{email: String, sent_at: Date}>` | Tracks which emails the owner has sent invitations to (prevents duplicate sends). |

### 2.3 Participant Collection

**Purpose:** Stores individual user details, their assignment, and the login token.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | `ObjectId` | Unique identifier. |
| `group_id` | `ObjectId` | Reference to the parent `Group`. |
| `name` | `String` | Participant's display name (single name field). |
| `email` | `String` | Participant's email. |
| `recipient_id` | `ObjectId` | The ID of the person they drew. |
| `verification_code` | `String` | Unique code for password-less login/verification. |
| `code_expires_at` | `Date` | Timestamp for code expiration (e.g., 30 minutes). |
| `code_sent_at` | `Date` | Timestamp of when the last verification code was sent (for resend cooldown). |
| `assignment_email_status` | `String` | Status of assignment email: `pending`, `sent`, `delivered`, `bounced`, `failed`. |
| `assignment_email_sent_at` | `Date` | Timestamp of when assignment email was sent. |

## 3. Core Application Flow & Logic

### A. Initial Signup / "Get Started"

1. **Route:** `/get-started` (Guarded on the server)
2. **Logic:**
   - If `AdminUser` document exists and `is_registered` is `true`, redirect to login page
   - If no `AdminUser` exists, display a form for Name and Email
   - On submit:
     - Create the `AdminUser` document
     - Generate a `verification_code`
     - Send a login link via AWS SES
     - Redirect to: `/verify?email=[...]&code=[...]`

### B. User Invitation & Verification

1. **Invitation Link Generation:**
   - When a group is created, the owner receives a sharable link: `/[locale]/join?inviteId=[Group.invite_id]`

2. **`/[locale]/join` Page Logic:**
   - Accepts `inviteId` from the URL query
   - Fetches the `Group` and displays its details (e.g., "You are invited to join 'Family Christmas 2025'")
   - Form requests the user's Name (single field) and Email
   - On submit, an API route:
     - Checks if a `Participant` with that email already exists in that `Group`
     - Creates a new `Participant` document, linking them to the `Group`
     - Generates a new `verification_code` and sets `code_sent_at`
     - Sends the login link via AWS SES: `/[locale]/verify?email=[...]&code=[...]`

### C. Password-less Session Management

1. **Route:** `/[locale]/verify`

2. **Verification Page UX:**
   - Displays the email address being verified
   - Shows input field for verification code
   - Allows user to edit/fix their email if it was entered incorrectly
   - "Resend Code" button (disabled for 30 seconds after last send, uses `code_sent_at` for validation)
   - If email is edited, a new verification code is sent to the new address

3. **API Endpoint (`/api/verify`):**
   - Accepts `email` and `code` as query parameters
   - Looks up the `Participant` where `email`, `verification_code` match and `code_expires_at` ≥ current time
   - If valid:
     - Generates an encrypted, short-lived session cookie containing the `Participant._id`
     - Clears the used `verification_code` and `code_expires_at` in the database
     - Returns a success state
   - If invalid/expired, returns an error

4. **API Endpoint (`/api/resend-code`):**
   - Accepts `email` as parameter
   - Checks `code_sent_at` to enforce 30-second cooldown
   - Generates new `verification_code` and updates `code_sent_at`
   - Sends new verification email via AWS SES

5. **Client-side:**
   - On successful API response, the client sets the cookie
   - Redirects to the appropriate dashboard (e.g., `/[locale]/group/[groupId]/dashboard`)

### D. Group Owner Dashboard & Invitation Management

1. **Owner Dashboard Features:**
   - View list of all participants who have successfully signed up
   - Display group metadata (name, date, place, budget)
   - Show invitation link with copy button
   - WhatsApp share button: generates `https://wa.me/?text=[encoded invitation link]`
   - Email invitation form: owner can send invitation directly via email
     - Input field for recipient email
     - Button to send invitation email
     - Display list of emails already sent (from `invitations_sent` array) to prevent duplicates
   - "Run Lottery" button (enabled only when participants > 2)
   - After lottery is run: display email delivery status for each participant

2. **API Endpoint (`/api/group/send-invitation`):**
   - Accepts `groupId` and `recipientEmail`
   - Validates that requester is the group owner (session check)
   - Checks if email was already sent (in `invitations_sent` array)
   - Sends invitation email with the join link via AWS SES
   - Adds entry to `Group.invitations_sent` array

### E. Lottery Execution & Email Tracking

1. **API Endpoint (`/api/lottery/run`):**
   - Validates group owner permission
   - Runs no-self-draw algorithm
   - Updates all `Participant.recipient_id` fields
   - Sends assignment emails to all participants via AWS SES
   - Sets `Participant.assignment_email_status` to `sent`
   - Sets `Participant.assignment_email_sent_at` timestamp

2. **AWS SNS/SQS Integration for Email Tracking:**
   - Configure AWS SES to publish notifications to SNS topic
   - SNS topic triggers SQS queue
   - API endpoint `/api/webhooks/ses-notifications` processes SQS messages
   - Updates `Participant.assignment_email_status` based on notification type:
     - `Delivery`: Update to `delivered`
     - `Bounce`: Update to `bounced`
     - `Complaint`: Update to `failed`

3. **Owner View:**
   - After lottery, dashboard shows table of participants with email delivery status
   - Color-coded status indicators (delivered: green, sent: yellow, bounced/failed: red)

### F. Multi-Language (i18n) Setup

- **Library:** next-intl
- **Locales:** `en` (English US), `pt` (Portuguese BR)
- **Implementation:** All user-facing text strings (labels, errors, emails) must be accessed via the `t()` function to support dynamic language switching based on the URL or user preference