# 📝 Secret Santa App: Technical Design Document (Context)

## 1. Stack & Tools
| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend/Backend** | Next.js (App Router) | Full-stack capability with API Routes for rapid development. |
| **Styling/UI** | **Shadcn UI + Tailwind CSS** | Provides accessible, well-designed components and utility-first styling for speed. |
| **Internationalization** | **`next-intl`** | Provides robust routing and component-level translation support for **`en-US`** and **`pt-BR`**. |
| **Database** | MongoDB (via Mongoose) | Flexible, scalable NoSQL store for quick schema iteration. |
| **Email Service** | AWS SES | Reliable, cost-effective transactional email for verification and assignments. |
| **Session Mgmt** | Encrypted Cookies (e.g., `iron-session`) | Simple, stateless session management tied to the verification code flow, avoiding a complex auth library. |

## 2. Data Models (MongoDB)

### 2.1 `AdminUser` Collection (Single Document)
* **Purpose:** Stores the single user/email who is allowed to **"Get Started"** and create the first group.
* **Structure:**
    | Field | Type | Description |
    | :--- | :--- | :--- |
    | `email` | `String` | The email of the first-ever user (unique). |
    | `name` | `String` | The name of the first-ever user. |
    | `is_registered` | `Boolean` | Always `true` after the first user signs up. Used to guard the `/get-started` route. |

### 2.2 `Group` Collection
* **Purpose:** Defines a Secret Santa event.
* **Structure:**
    | Field | Type | Description |
    | :--- | :--- | :--- |
    | `_id` | `ObjectId` | Unique identifier. |
    | `name` | `String` | Event name (e.g., "Family Christmas 2025"). |
    | `budget` | `String` | Suggested gift budget. |
    | `date` | `Date` | Date of the gift exchange. |
    | `owner_email` | `String` | The email of the user who created the group. |
    | `participants` | `Array<ObjectId>` | References to **`Participant`** documents. |
    | **`invite_id`** | **`String`** | **Unique, unguessable ID for invitation links.** |
    | `is_drawn` | `Boolean` | True if the lottery has been executed. |

### 2.3 `Participant` Collection (The Core User/Session Model)
* **Purpose:** Stores individual user details, their assignment, and the login token.
* **Structure:**
    | Field | Type | Description |
    | :--- | :--- | :--- |
    | `_id` | `ObjectId` | Unique identifier. |
    | `group_id` | `ObjectId` | Reference to the parent `Group`. |
    | `name` | `String` | Participant's display name. |
    | `email` | `String` | Participant's email. |
    | **`recipient_id`** | `ObjectId` | **The ID of the person they drew.** |
    | **`verification_code`** | **`String`** | **Unique code for password-less login/verification.** |
    | `code_expires_at` | `Date` | Timestamp for code expiration (e.g., 30 minutes). |

## 3. Core Application Flow & Logic

### A. Initial Signup / "Get Started"
1.  **Route:** `/get-started` (Guarded on the server).
2.  **Logic:**
    * If `AdminUser` document exists and `is_registered` is `true`, redirect to login page.
    * If no `AdminUser` exists, display a form for Name and Email.
    * On submit, create the `AdminUser` document, generate a `verification_code`, and send a login link via **AWS SES**.
    * The link redirects to the general verification page: `/verify?email=[...]&code=[...]`.

### B. User Invitation & Verification
1.  **Invitation Link Generation:** When a group is created, the owner receives a sharable link for others: `/[locale]/join?inviteId=[Group.invite_id]`.
2.  **`/[locale]/join` Page Logic:**
    * Accepts `inviteId` from the URL query.
    * Fetches the `Group` and displays its details (e.g., "You are invited to join 'Family Christmas 2025'").
    * Form requests the user's **Name** and **Email**.
    * On submit, an API route:
        * Checks if a `Participant` with that email already exists in that `Group`.
        * Creates a new `Participant` document, linking them to the `Group`.
        * Generates a new `verification_code` and sends the login link: `/[locale]/verify?email=[...]&code=[...]`.

### C. Password-less Session Management
1.  **Route:** `/[locale]/verify`
2.  **API Endpoint (`/api/verify`):**
    * Accepts `email` and `code` as query parameters.
    * Looks up the `Participant` where `email`, `verification_code` match and `code_expires_at` is $\ge$ current time.
    * If valid, it:
        * Generates an encrypted, short-lived **session cookie** containing the `Participant._id`.
        * Clears the used `verification_code` and `code_expires_at` in the database.
        * Returns a success state.
    * If invalid/expired, returns an error.
3.  **Client-side:** On successful API response, the client sets the cookie and redirects to the appropriate dashboard (e.g., `/[locale]/group/[groupId]/dashboard`).

### D. Multi-Language (i18n) Setup
* **Tool:** `next-intl`
* **Locales:** `en` (Default: `en-US`), `pt` (`pt-BR`).
* **Implementation:** All key text strings (labels, errors, emails) must be accessed via the `t()` function to support dynamic language switching based on the URL or user preference.