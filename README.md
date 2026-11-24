# Snapgram — Full-Stack Instagram-Style Photo & Story Sharing Capstone

> **Full-Stack Application Complete (Phase 1 Frontend + Phase 2 Backend)**  
> Production-grade Instagram-style photo and 24-hour story sharing platform built with a **React + Vite** frontend and an **Express.js + MongoDB + Mongoose** backend with RBAC, JWT authentication with refresh token rotation, Direct Messages, and Close Friends privacy rings.

---

## 🚀 Quick Start

### 1. Start the Backend (`server/`)
Make sure your local MongoDB daemon is running (`mongodb://127.0.0.1:27017`).
```bash
cd server
npm install
npm run seed     # Seeds sample users, follows, close friends, posts, stories, and messages
npm run dev      # Starts Express server on http://localhost:5000 (Base API: /api)
```

### 2. Start the Frontend (`client/`)
In a separate terminal:
```bash
cd client
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser.

---

## 🔑 Pre-Configured Demo Accounts (Ready to Test)

The database includes pre-seeded accounts:

| Account Type | Username | Email | Password | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Standard User** | `@alex_creator` | `alex@snapgram.com` | `password123` | `user` |
| **Platform Administrator** | `@sarah_admin` | `admin@snapgram.com` | `admin123` | `admin` |
| **User (Traveler)** | `@elena_travels` | `elena@travel.org` | `password123` | `user` |
| **User (Developer)** | `@marcus_dev` | `marcus@code.io` | `password123` | `user` |
| **User (Photographer)** | `@kenji_photo` | `kenji@lens.jp` | `password123` | `user` |

*(Tip: You can also use the **Role Switcher** dropdown on the frontend navigation bar to toggle between user and admin sessions instantly!)*

---

## 🛠️ Tech Stack & Constraints

### Frontend (`client/`)
- **Framework:** React 18 + Vite
- **Routing:** `react-router-dom` (v6+)
- **State Management:** React Context API (`AuthContext`, `FeedContext`, `MessageContext`)
- **HTTP Client:** Native `fetch` API via [`apiClient.js`](file:///Users/aprajitamishra/Downloads/Web-D-3_Capstone/client/src/api/apiClient.js) with automatic 401 token refresh queue
- **Styling:** Tailwind CSS with Instagram dark theme palette
- **Icons:** `lucide-react`

### Backend (`server/`)
- **Runtime & Framework:** Node.js + Express.js (ES Modules)
- **Database & ODM:** MongoDB + Mongoose
- **Allowed Packages Only:** `express`, `mongoose`, `dotenv`, `bcrypt`, `jsonwebtoken`, `cors` (and `nodemon` as devDependency)
- **Port:** `5000` (`http://localhost:5000/api`)

---

## 📦 Mongoose Collections (`server/models/`)

1. **`User.js`**: `username`, `email`, `password` (hashed via `bcrypt` pre-save hook), `role` (`'user'` | `'admin'`), `name`, `bio`, `avatarUrl`, `savedPosts`, `closeFriends`, `refreshToken`, `timestamps: true`.
2. **`Post.js`**: `author` (ref: User), `imageUrl`, `caption`, `location`, `likes` (array of User refs), `timestamps: true`.
3. **`Comment.js`**: `post` (ref: Post), `author` (ref: User), `text`, `timestamps: true`.
4. **`Follow.js`**: `follower` (ref: User), `following` (ref: User), compound unique index `{ follower: 1, following: 1 }`.
5. **`Story.js`**: `author` (ref: User), `imageUrl`, `caption`, `isCloseFriendsOnly` (Boolean), `createdAt` with **MongoDB 24-hour TTL index** (`expires: 86400`).
6. **`Message.js`**: `sender` (ref: User), `receiver` (ref: User), `text`, `sharedPost` (ref: Post, optional), `isRead` (Boolean), `timestamps: true`.

---

## 📡 REST API Reference (`http://localhost:5000/api`)

### Authentication (`/api/auth`)
- `POST /register`: Registers new user, returns `{ user, accessToken, refreshToken }`.
- `POST /login`: Verifies credentials, returns `{ user, accessToken, refreshToken }`.
- `POST /refresh`: Validates refresh token and returns fresh token pair.
- `POST /logout`: Clears refresh token in DB.
- `GET /me`: Returns profile for authenticated session (`Bearer <accessToken>`).

### Posts & Comments (`/api/posts`)
- `GET /` or `GET /feed`: Returns posts from followed users + own posts, populated with authors and comments.
- `GET /explore`: Returns most-liked posts sorted by like count descending via MongoDB aggregation `$addFields: { likesCount: { $size: "$likes" } }` + `$sort: { likesCount: -1, createdAt: -1 }`.
- `POST /`: Creates post `{ imageUrl, caption, location }`.
- `GET /:id`: Retrieves single post with populated author and comments.
- `DELETE /:id`: Deletes post (author or admin only).
- `POST /:id/like`: Toggles like (`$addToSet` / `$pull`).
- `POST /:id/save`: Toggles bookmark on user (`$addToSet` / `$pull`).
- `GET /saved`: Returns user's saved post IDs.
- `GET /saved/all`: Returns populated saved posts.
- `GET /:id/comments` & `POST /:id/comments`: Fetch & add comments.

### 24-Hour Stories (`/api/stories`)
- `POST /`: Creates 24-hour story `{ imageUrl, caption, isCloseFriendsOnly }`.
- `GET /` or `GET /feed`: Returns active stories (< 24h). **Close Friends Privacy Twist:** If `story.isCloseFriendsOnly === true`, it is ONLY returned if the viewer is the author or is in the author's `closeFriends` array.
- `DELETE /:id`: Deletes story.

### Users & Follow System (`/api/users`)
- `GET /search?q=`: Search users by username or name.
- `GET /`: Lists all users with follower/following and post counts.
- `GET /:username`: Returns user profile, posts grid, follower counts, `isFollowing`, and `isCloseFriend` booleans.
- `PUT /profile`: Updates bio / avatarUrl / name.
- `POST /:usernameOrId/follow`: Toggles follow / unfollow.
- `GET /me/followers`: Lists followers for Close Friends Manager.
- `POST /close-friends`: Toggles user in/out of `closeFriends` array.

### Direct Messages (`/api/messages`)
- `GET /conversations`: Returns conversation summaries with last message and unread count.
- `GET /:userId`: Chronological chat history between logged-in user and target user.
- `POST /:userId`: Sends a message `{ text, sharedPostId? }`.
- `PATCH /:userId/read`: Marks messages from that user as read.
- `GET /unread/count`: Total unread messages for navbar badge.

### Admin Dashboard RBAC (`/api/admin`)
- `GET /users`: Full moderation list of users with roles and stats.
- `PATCH /users/:id/role`: Promotes/demotes user roles (`user` <-> `admin`).
- `DELETE /users/:id`: Cascades and deletes user along with all their content.
- `GET /posts`: List of all posts for moderation.
- `DELETE /posts/:id`: Forces deletion of any inappropriate post.

---

## 🌟 Full-Stack Folder Structure

```
Web-D-3_Capstone/
├── client/
│   ├── src/
│   │   ├── api/              # Native fetch API client with auto 401 refresh
│   │   ├── context/          # AuthContext, FeedContext, MessageContext
│   │   ├── components/       # Navbar, StoriesBar, StoryModal, PostCard, Modals
│   │   ├── pages/            # Home, Explore, Profile, Messages, Login, Register, AdminDashboard
│   │   ├── mock/             # Fallback persistence engine when backend offline
│   │   ├── App.jsx           # Routes & global modal mount
│   │   └── index.css         # Tailwind directives & story gradients
│   ├── vite.config.js
│   └── package.json
└── server/
    ├── config/
    │   └── db.js             # Mongoose connection
    ├── models/
    │   ├── User.js           # Users, passwords, roles, closeFriends, savedPosts
    │   ├── Post.js           # Posts & likes
    │   ├── Comment.js        # Post comments
    │   ├── Follow.js         # Follower / Following graph
    │   ├── Story.js          # 24-hr stories with TTL index
    │   └── Message.js        # Direct messages & shared post attachments
    ├── middleware/
    │   ├── authMiddleware.js # protect (JWT bearer) & authorizeAdmin (RBAC)
    │   └── errorMiddleware.js# Centralized error handler
    ├── utils/
    │   └── tokenUtils.js     # JWT access & refresh token signer/verifier
    ├── controllers/
    │   ├── authController.js
    │   ├── postController.js
    │   ├── storyController.js
    │   ├── userController.js
    │   ├── messageController.js
    │   └── adminController.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── postRoutes.js
    │   ├── storyRoutes.js
    │   ├── userRoutes.js
    │   ├── messageRoutes.js
    │   └── adminRoutes.js
    ├── server.js             # Express app entry & CORS config
    ├── seed.js               # Database population script
    ├── .env
    ├── .env.example
    └── package.json
```
