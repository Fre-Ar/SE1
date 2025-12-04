### **API Catalog**

**1. Authentication & User Management**

  * `POST /api/auth/register`: Create a new user account.
  * `POST /api/auth/login`: Authenticate and receive a session/token.
  * `GET /api/auth/me`: specific route to retrieve the currently logged-in user's profile.

**2. Content Management (Stories)**

  * `GET /api/stories`: Search and filter stories (powering the list view & timeline).
  * `GET /api/stories/:slug`: Fetch a single full story (matches `PageData`).
  * `POST /api/stories`: Create a new story draft.
  * `PUT /api/stories/:slug`: Update an existing story.

**3. Interaction (Comments)**

  * `POST /api/stories/:slug/comments`: Add a comment to a story.
  * `DELETE /api/comments/:id`: Remove a comment (moderation/author).

**4. Utilities**

  * `POST /api/upload`: Upload an image file and get a URL back (for the editor).

**5. Disputes & Reporting**

  * `POST /api/disputes`: File a report against content or a user. Open a formal dispute regarding historical accuracy or other issues.
  * `GET /api/disputes`: (Mod/Admin) View all active disputes.
  * `PATCH /api/disputes/:id`: (Mod/Admin) Update status (e.g., resolve, dismiss).

**6. Moderation (User & Content Control)**

  * `POST /api/moderation/users/:id/ban`: Ban a user from the platform.
  * `POST /api/moderation/users/:id/mute`: Prevent a user from commenting/editing specific contexts.
  * `POST /api/moderation/pages/:slug/lock`: Freeze a page (prevent new edits).
  * `GET /api/moderation/logs`: Retrieve system-wide audit logs.

**7. Administration (System Security)**

  * `PATCH /api/admin/users/:id/role`: Elevate or demote a user (Contributor ↔ Moderator ↔ Admin).
  * `POST /api/admin/ip-bans`: Block specific IP addresses.
  * `DELETE /api/admin/ip-bans/:ip`: Unblock an IP.

**8. Version Control**

  * `GET /api/stories/:slug/history`: View past versions of a page.
  * `POST /api/stories/:slug/revert`: Rollback to a previous version.

-----

### **Detailed API Specifications**

#### **1. Authentication**

**`POST /api/auth/register`**

  * **Purpose:** Create a new user account. On success, it should automatically log the user in (return the token) to reduce friction.
  * **Frontend Payload:**
    ```typescript
    {
      username: "HistoryFan99", // Unique
      email: "student@uni.lu", // Unique
      password: "strongPassword!23"
    }
    ```
  * **Success Response (201 Created):**
    ```typescript
    {
      user: {
        id: "u101",
        username: "HistoryFan99",
        role: "contributor" // Default role
      },
      token: "eyJhbGciOi..." // Token for immediate session start; store in localStorage/cookies
    }
    ```
  * **Error Responses:**
      * `400 Bad Request`: Validation failed (e.g., password too short, invalid email format).
      * `409 Conflict`: Username or Email already exists.

**`POST /api/auth/login`**

  * **Purpose:** Securely log in a user.
  * **Frontend Payload:**
    ```typescript
    {
      email: "user@uni.lu",
      password: "securePassword123"
    }
    ```
  * **Success Response (200 OK):**
    ```typescript
    {
      user: {
        id: "u1",
        username: "HistoryBuff",
        role: "contributor" // or 'moderator', 'admin'
      },
      token: "eyJhbGciOi..." // Token to store in localStorage/cookies
    }
    ```
  * **Errors:** `401 Unauthorized` (Invalid credentials).

**`GET /api/auth/me`**

  * **Purpose:** Re-hydrate user state on page reload.
  * **Headers:** `Authorization: Bearer <token>`
  * **Success Response (200 OK):** Returns the User object (same as login).

-----

#### **2. Content Management (The Core)**

**`GET /api/stories`**

  * **Purpose:** Fetch a lightweight list of stories for the Home Page, Search, or Timeline.
  * **Query Params:** `?query=market&tag=19th_century&sort=date_desc` (multiple `&tag=[TAG]` may be included)
  * **Success Response (200 OK):**
    ```typescript
    {
      data: [
        {
          id: "123",
          slug: "old-town-square",
          title: "Old Town Square",
          leadImage: { url: "...", alt: "..." }, // Minimal data for cards
          tags: ["Architecture"],
          createdAt: "2025-11-10T10:00:00Z"
        }
        // ... more items
      ],
      meta: { page: 1, total: 45 } // Pagination support
    }
    ```

**`GET /api/stories/:slug`**

  * **Purpose:** Load the **full** article for `PageView`. This **must** return the exact shape of the `PageData` type.
  * **Success Response (200 OK):**
    ```typescript
    // Matches PageData type from data_types.tsx
    {
      id: "12345",
      slug: "old-town-square",
      title: "Old Town Square",
      subtitle: "Central plaza...",
      lastEdited: "2025-11-18",
      lastEditedBy: "ArmandoF",
      tags: ["Architecture", "19th century"],
      leadImage: { ... },
      sections: [
        { id: "intro", title: "Overview", markdown: "..." },
        { id: "history", title: "History", markdown: "..." }
      ],
      discussion: [ ... ] // Embedded comments
    }
    ```
  * **Errors:** `404 Not Found`.

**`POST /api/stories`** (and `PUT /api/stories/:slug`)

  * **Purpose:** Save a story (Either create a new one with `POST` or update an existing one with `PUT`).
  * **Frontend Payload:**
    ```typescript
    {
      title: "New Discovery",
      subtitle: "An interesting find",
      slug: "new-discovery", // Optional, API should be able to generate from title
      tags: ["Excavation"],
      leadImage: { url: "/uploads/img1.jpg", alt: "Dig site" },
      sections: [
        { title: "The Dig", markdown: "We found..." }
      ]
    }
    ```
  * **Success Response (201 Created / 200 OK):** Returns the saved PageData object.

-----

#### **3. Interactions**

**`POST /api/stories/:slug/comments`**

  * **Purpose:** Post a comment.
  * **Headers:** `Authorization: Bearer <token>`
  * **Frontend Payload:**
    ```typescript
    {
      body: "I have a photo of this from 1950!"
    }
    ```
  * **Success Response (201 Created):**
    ```typescript
    {
      id: "c99",
      author: "CurrentUser",
      createdAt: "2025-11-20T...",
      body: "I have a photo of this from 1950!"
    }
    ```

-----

#### **4. Utilities**

**`POST /api/upload`**

  * **Purpose:** Handle image uploads. The Frontend uploads a file, the Backend saves it (to disk or cloud) and returns a URL.
  * **Frontend Payload:** `FormData` object (look it up) containing the file.
  * **Success Response (200 OK):**
    ```typescript
    {
      url: "/images/uploads/market-1905.jpg" // URL to be used in markdown or leadImage
    }
    ```

#### **5. Disputes & Reporting**

**`POST /api/disputes`**

  * **Purpose:** Allow users to formally challenge content accuracy (e.g., "The date of the fire is wrong"). Flag content or users that violate community guidelines (Spam, Harassment, Hate Speech).
  * **Frontend Payload:**
    ```typescript
    {
      targetId: "123", // ID of the Content (page)
      targetType: "comment", // 'comment', 'user', or 'story'
      reason: "The fire actually happened in 1824, citing 'City Archives Vol 2'.",
      category: "accuracy" // or 'bias', 'citation_missing', 'spam', 'harassment', 'hate_speech', 'violence', etc
    }
    ```
  * **Success Response (201 Created):** Returns the created Dispute object.
    ```typescript
    {
        id: "123",
        status: "pending",
        createdAt: "2025-11-20T14:30:00Z"
    }
    ```
  * **Error Responses:**
      * `400 Bad Request`: Missing target or invalid category.
      * `409 Conflict`: You have already reported this item.

**`GET /api/disputes`**

  * **Purpose:** Retrieve a list of disputes for moderation. This endpoint must support filtering so moderators can focus on active issues first.
  * **Query Params:**
      * `status`: Filter by state (e.g., `open`, `under_review`, `resolved`).
      * `sort`: `created_desc` (default) or `created_asc`.
      * `page`: For pagination (e.g., `1`).
  * **Success Response (200 OK):**
    ```typescript
    {
      data: [
        {
          id: "d101",
          targetId: "123", // The Page/Content ID
          targetType: "comment",
          targetTitle: "Old Town Square", 
          reason: "The fire actually happened in 1824...",
          status: "open",
          createdAt: "2025-11-21T09:00:00Z",
          createdBy: { 
             id: "u55",
             username: "HistoryBuff"
          }
        },
        // ... more disputes
      ],
      meta: {
        page: 1,
        total: 12,
        pendingCount: 5 // Helpful metric for the dashboard
      }
    }
    ```
  * **Error Responses:**
      * `401 Unauthorized`: Not logged in.
      * `403 Forbidden`: User does not have `role: 'moderator'` or `'admin'`.

**`PATCH /api/disputes/:id`**

  * **Purpose:** Moderators resolve the dispute.
  * **Headers:** `Authorization: Bearer <mod_token>`
  * **Frontend Payload:**
    ```typescript
    {
      status: "resolved", // 'under_review', 'dismissed', 'resolved'
      resolutionNotes: "Updated the date to 1824 based on provided evidence."
    }
    ```
  * **Success Response (200 OK):** Returns updated Dispute.

-----

#### **6. Moderation**

**`POST /api/moderation/users/:id/ban`**

  * **Purpose:** Ban a user account.
  * **Frontend Payload:**
    ```typescript
    {
      reason: "Repeated vandalism",
      duration: "permanent" // or date string "2025-12-31"
    }
    ```
  * **Success Response (200 OK):**
    ```typescript
    { success: true, userId: "u55", status: "banned" }
    ```

**`POST /api/moderation/users/:id/mute`**

  * **Purpose:** Temporarily or permanently prevent a user from creating new content (comments, edits, stories) while still allowing them to log in and read content.
  * **Frontend Payload:**
    ```typescript
    {
      scope: "global", // or 'comments_only', 'edits_only'
      durationMinutes: 1440, // 24 hours. null = indefinite
      reason: "Spamming the comment section."
    }
    ```
  * **Success Response (200 OK):**
    ```typescript
    {
      userId: "u55",
      isMuted: true,
      mutedUntil: "2025-11-22T14:30:00Z",
      scope: "global"
    }
    ```
  * **Error Responses:**
      * `400 Bad Request`: Invalid duration or scope.
      * `403 Forbidden`: You cannot mute another Moderator or Admin.

**`POST /api/moderation/pages/:slug/lock`**

  * **Purpose:** Prevent further edits to a controversial page.
  * **Frontend Payload:**
    ```typescript
    {
      locked: true,
      reason: "High volume of vandalism/disputes in progress."
    }
    ```
  * **Success Response (200 OK):** Returns the updated Page metadata.

**`GET /api/moderation/logs`**

  * **Purpose:** View audit trail for security.
  * **Query Params:** `?userId=u55&action=delete&date_from=2025-01-01`
  * **Success Response (200 OK):**
    ```typescript
    {
      logs: [
        {
          id: "log_902",
          actor: "Admin_Sarah",
          action: "ban_user",
          target: "User_Bob",
          timestamp: "2025-11-20T14:30:00Z"
        }
      ]
    }
    ```

-----

#### **7. Administration**

**`PATCH /api/admin/users/:id/role`**

  * **Purpose:** Change user permissions.
  * **Frontend Payload:**
    ```typescript
    {
      role: "moderator" // 'contributor', 'moderator', 'admin'
    }
    ```
  * **Success Response (200 OK):** Returns updated User profile.

**`POST /api/admin/ip-bans`**

  * **Purpose:** Firewall level block for malicious actors.
  * **Frontend Payload:**
    ```typescript
    {
      ipAddress: "192.168.0.55",
      reason: "DDoS attempt"
    }
    ```
  * **Success Response (201 Created):**
    ```typescript
    { id: "ban_1", ip: "192.168.0.55", createdAt: "..." }
    ```

**`DELETE /api/admin/ip-bans/:ip`**

  * **Purpose:** Remove an IP address from the blocklist, restoring access to the platform for that network.
  * **Path Parameter:** `:ip` (The IP address, e.g., `192.168.1.5`).
      * **Critical Note:** Since IP addresses contain dots (`.`) or colons (`:` for IPv6), the Frontend **must URL-encode** this parameter (e.g., `192%2E168%2E1%2E5`) to avoid confusing the router.
  * **Success Response (200 OK):**
    ```typescript
    {
      success: true,
      message: "IP 192.168.1.5 has been unblocked."
    }
    ```
  * **Error Responses:**
      * `404 Not Found`: This IP is not currently banned.
      * `400 Bad Request`: Invalid IP format provided.

-----

#### **8. Version Control**

**`GET /api/stories/:slug/history`**

  * **Purpose:** Show the evolution of a page.
  * **Success Response (200 OK):**
    ```typescript
    {
      history: [
        {
          versionId: "v2",
          editedBy: "ArmandoF",
          timestamp: "2025-11-18T10:00:00Z",
          changeSummary: "Added section about the Market"
        },
        {
          versionId: "v1",
          editedBy: "System",
          timestamp: "2025-11-10T09:00:00Z",
          changeSummary: "Initial creation"
        }
      ]
    }
    ```

**`POST /api/stories/:slug/revert`**

  * **Purpose:** Undo vandalism or mistakes.
  * **Frontend Payload:**
    ```typescript
    {
      targetVersionId: "v1"
    }
    ```
  * **Success Response (200 OK):** Returns the current (reverted) PageData.