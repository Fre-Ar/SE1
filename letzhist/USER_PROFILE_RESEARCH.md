# LëtzHist User Profile & Settings Page - Research Summary

## Overview
This document contains findings from analyzing the LëtzHist authentication system, user data structure, and available API endpoints to support creating a user profile/settings page for logged-in users.

---

## 1. AUTHENTICATION SYSTEM

### Mechanism
- **Type**: Token-based authentication (JWT-like tokens)
- **Flow**: Username/email + password → server generates token → client stores in localStorage/cookies
- **Session Management**: Stateless (token-based)

### Key Files
- **Login Route**: `src/app/api/auth/login/route.ts`
- **Register Route**: `src/app/api/auth/register/route.ts`
- **Logout Route**: `src/app/api/auth/logout/route.ts` (currently empty)
- **User Check**: `GET /api/auth/me` (documented but not yet implemented)

### Current Implementation Status
- ✅ Registration working (POST /api/auth/register)
- ✅ Login working (POST /api/auth/login)
- ✅ Password hashing with PBKDF2 implemented
- ⚠️ Token handling needs implementation (returns `{ success: true }` instead of token)
- ⚠️ Logout endpoint not implemented
- ⚠️ `/api/auth/me` endpoint documented but not yet created

---

## 2. USER DATA STRUCTURE

### UserProfile Type
```typescript
type UserProfile = {
  id: string;
  username: string;
  email?: string;              // Email might be hidden in public contexts
  role: UserRole;              // 'contributor' | 'moderator' | 'admin'
  isMuted?: boolean;           // Moderation flag
  mutedUntil?: string;         // ISO Date string - when mute expires
};
```

### Available User Fields
- **id**: Unique identifier (string)
- **username**: User's display name (string, required, 25 chars max)
- **email**: User's email address (string, required, unique)
- **role**: User permission level
  - `contributor` (default)
  - `moderator`
  - `admin`
- **isMuted**: Boolean indicating if user is temporarily muted
- **mutedUntil**: ISO date string for when mute expires
- **created_at**: Timestamp of account creation (in DB but not exposed in UserProfile type)

### Database User Table
```sql
CREATE TABLE users (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(25) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  password_salt VARCHAR(255) NOT NULL,
  role ENUM('contributor','moderator','admin') DEFAULT 'contributor',
  created_at TIMESTAMP NOT NULL,
  last_login TIMESTAMP NULL
);
```

**Additional fields in DB (not currently exposed):**
- `password_hash` / `password_salt`: For authentication
- `last_login`: Timestamp of most recent login

---

## 3. SESSION/TOKEN MANAGEMENT

### Current Status
- **Where Tokens Are Stored**: Intended for localStorage or cookies (not yet implemented)
- **Token Format**: JWT-like format `"eyJhbGciOi..."` (per API spec)
- **Token Usage**: Sent via `Authorization: Bearer <token>` header for protected endpoints

### How to Check if User is Logged In
**Option 1: Direct Token Storage Check** (frontend)
```typescript
const token = localStorage.getItem('authToken');
const isLoggedIn = !!token;
```

**Option 2: Call GET /api/auth/me** (Recommended)
```typescript
const response = await fetch('/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const user = await response.json();
```

### Implementation Gaps
- Need to implement token generation and return in login/register responses
- Need to implement `GET /api/auth/me` endpoint for verifying current user
- Need to implement `POST /api/auth/logout` endpoint
- Token refresh mechanism not mentioned (consider adding)

---

## 4. AUTHENTICATION FLOW - Login/Register Pages

### Login Flow (`src/app/login/page.tsx`)
```
User Input (email + password)
    ↓
POST /api/auth/login
    ↓
Current Response: { success: true }
    ↓
TODO: Should return: { user: UserProfile, token: string }
    ↓
Store token (localStorage/cookies)
    ↓
Redirect to home/dashboard
```

**Current Pattern:**
- Client-side form with email and password fields
- Fetch to `/api/auth/login` with JSON body
- Basic error handling with alert
- No token storage or redirect logic

### Register Flow (`src/app/register/page.tsx`)
```
User Input (username + email + password)
    ↓
POST /api/auth/register
    ↓
Current Response: { success: true }
    ↓
TODO: Should return: { user: UserProfile, token: string }
    ↓
Auto-login (per API spec: "automatically log the user in to reduce friction")
    ↓
Store token
    ↓
Redirect to home/dashboard
```

**Current Pattern:**
- Client-side form with username, email, and password fields
- Fetch to `/api/auth/register` with JSON body
- Server-side password hashing with PBKDF2 (salt + hash)
- Response shows success message instead of returning token/user

**Missing Implementations:**
1. Token generation in both endpoints
2. Return full AuthResponse: `{ user: UserProfile, token: string }`
3. Redirect logic after successful auth
4. Error handling for existing users/invalid credentials
5. Client-side token persistence

---

## 5. HEADER NAVIGATION

### Current Header (`src/components/header.tsx`)
- Logo/branding area
- Search input field
- "New page" button (hidden on mobile)
- "Log in" link (hidden on mobile)
- "Register" link (hidden on mobile)

### What's Missing for Logged-In State
- Conditional rendering: hide login/register when user is logged in
- User profile dropdown menu
- Display current username or avatar
- Logout button
- Link to profile/settings page
- Indicator for moderator/admin status

**Suggested Enhancement:**
```typescript
// Show when user is logged out
<Link href="/login">Log in</Link>
<Link href="/register">Register</Link>

// Show when user is logged in
<div className="flex items-center gap-2">
  <span>{user.username}</span>
  <button onClick={handleLogout}>Log out</button>
  <Link href="/profile">Profile</Link>
</div>
```

---

## 6. DATABASE SCHEMA

### Users Table
```sql
CREATE TABLE users (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(25) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  password_salt VARCHAR(255) NOT NULL,
  role ENUM('contributor','moderator','admin') DEFAULT 'contributor',
  created_at TIMESTAMP NOT NULL,
  last_login TIMESTAMP NULL
);
```

### Key Characteristics
- **Auto-incrementing numeric ID** (not UUID)
- **Username**: Max 25 characters, unique
- **Email**: Unique, used for login
- **Password Security**: PBKDF2 with salt (10,000 iterations, SHA-512, 64-byte hash)
- **Role-Based Access**: Three tiers (contributor, moderator, admin)
- **Timestamps**: Account creation and last login tracking

### Related Tables That Reference Users
- `comment`: User comments on content (user_fk → users.id_pk)
- `edit_history`: Track who edited content (user_fk → users.id_pk)
- `dispute`: Disputes filed by users
- `disputing`: Track users involved in disputes

---

## 7. AVAILABLE API ENDPOINTS FOR USER OPERATIONS

### Authentication Endpoints
| Endpoint | Method | Status | Purpose |
|----------|--------|--------|---------|
| `/api/auth/register` | POST | ✅ Implemented | Create new user account |
| `/api/auth/login` | POST | ✅ Implemented | Authenticate user |
| `/api/auth/me` | GET | 📝 Documented | Get current user profile |
| `/api/auth/logout` | POST | 📝 Empty | Logout user |

### User-Related Endpoints (Moderation/Admin)
| Endpoint | Method | Required Role | Purpose |
|----------|--------|----------------|---------|
| `/api/moderation/users/:id/ban` | POST | moderator/admin | Ban a user |
| `/api/moderation/users/:id/mute` | POST | moderator/admin | Mute a user |
| `/api/admin/users/:id/role` | PATCH | admin | Change user role |

### Profile/User Data Available Through
- **After Login**: `POST /api/auth/login` returns UserProfile
- **Current Session**: `GET /api/auth/me` should return current UserProfile
- **Need to Create**: Endpoints for updating user profile fields

### What's NOT Yet Implemented
- ❌ `GET /api/users/:id` - Get specific user profile
- ❌ `PUT /api/users/:id` - Update user profile
- ❌ `POST /api/auth/logout` - Logout endpoint
- ❌ `GET /api/auth/me` - Get current user (documented only)
- ❌ Password change endpoint
- ❌ Email change endpoint
- ❌ Account deletion endpoint

---

## 8. EXISTING USER PROFILE UI PATTERNS

### Found in Current Codebase
- **Username Display**: None currently (only in forms during auth)
- **User Avatar**: None (no image assets for users)
- **Role Display**: None (role stored but not shown)
- **Account Info**: None (no profile page exists)

### Form Patterns to Follow
The auth pages demonstrate the project's form pattern:

```tsx
// Controlled inputs
const [username, setUsername] = useState("");

// Single form submission
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  const res = await fetch("/api/auth/...", {
    method: "POST",
    body: JSON.stringify({ ... }),
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
}

// Simple validation feedback
{message && <p className="text-sm">{message}</p>}
```

### Styling
- Uses **Tailwind CSS** classes
- Classes used: `bg-blue-600`, `text-white`, `rounded`, `px-3`, `py-2`, `flex`, `flex-col`, `gap-3`, etc.
- Similar card/container styling in header
- Mobile-responsive with `hidden`, `sm:inline` for responsive display

---

## 9. IMPLEMENTATION RECOMMENDATIONS FOR PROFILE PAGE

### Priority 1: Core Infrastructure
1. **Implement Token Handling**
   - Modify login/register routes to return `{ user: UserProfile, token: string }`
   - Store token in localStorage with key like `authToken`
   - Update header to check token and show user state

2. **Implement Missing Auth Endpoints**
   - `GET /api/auth/me` - Verify and return current user from token
   - `POST /api/auth/logout` - Clear token on client
   - Token validation middleware for protected routes

3. **Create Profile Page**
   - Route: `src/app/profile/page.tsx`
   - Display: username, email, role, account creation date
   - Fetch user data from `GET /api/auth/me`

### Priority 2: Profile Features
1. **Basic Profile Display**
   - Read-only view of username, email, role
   - Join date (created_at)
   - Mute status if applicable

2. **Account Settings**
   - Edit profile (username, email)
   - Change password endpoint needed
   - Delete account option

3. **User Activity** (Future)
   - Comments authored
   - Pages edited
   - Disputes filed

### Priority 3: Header Integration
1. Conditional navigation based on auth state
2. User dropdown menu
3. Quick logout
4. Role badge (moderator/admin)

### Key Files to Create/Modify
```
Create:
  src/app/profile/page.tsx          - Main profile page
  src/app/profile/settings.tsx      - Settings sub-page
  src/lib/auth-context.tsx          - Auth state management
  src/lib/useAuth.ts                - Custom hook for auth

Modify:
  src/app/api/auth/login/route.ts   - Return token + user
  src/app/api/auth/register/route.ts - Return token + user
  src/app/api/auth/me/route.ts      - Create endpoint
  src/app/api/auth/logout/route.ts  - Implement logout
  src/components/header.tsx         - Show user state
```

---

## 10. SECURITY CONSIDERATIONS

### Already Implemented
- ✅ Password hashing with PBKDF2 (salt + 10,000 iterations)
- ✅ UNIQUE constraints on username and email
- ✅ Role-based access control (contributor/moderator/admin)

### Need to Implement
- ⚠️ Token validation and expiration
- ⚠️ HTTPS-only cookies or secure localStorage handling
- ⚠️ CORS configuration
- ⚠️ Rate limiting on auth endpoints
- ⚠️ Protected routes validation
- ⚠️ Secure token storage (httpOnly cookies preferred over localStorage)

### Data Exposure
- Email field marked as optional in UserProfile for public contexts
- Username should always be public (attribution)
- Password never returned in responses

---

## SUMMARY CHECKLIST FOR PROFILE PAGE CREATION

- [ ] Implement token generation and return in auth endpoints
- [ ] Create `GET /api/auth/me` endpoint
- [ ] Implement `POST /api/auth/logout` endpoint
- [ ] Create custom `useAuth()` hook for client-side auth state
- [ ] Update header component to show/hide auth UI conditionally
- [ ] Create profile page with user info display
- [ ] Add profile link to header
- [ ] Implement token refresh mechanism (if needed)
- [ ] Add protected route wrapper component
- [ ] Create settings/account management page
- [ ] Add password change functionality
- [ ] Implement email change functionality
- [ ] Add account deletion option
- [ ] Consider role badge display for mods/admins
- [ ] Add user activity history view (future)

