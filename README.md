# 💬 ChatApp — WhatsApp-like Real-time Chat

A production-ready, full-featured web chat application built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **Firebase** — deployable to **Vercel** or **Netlify** in minutes.

---

## ✨ Features

| Feature | Status |
|---|---|
| Google / Gmail Sign-In (OAuth) | ✅ |
| Email OTP Login (Gmail SMTP) | ✅ |
| One-to-one direct messaging | ✅ |
| Group chats | ✅ |
| Realtime message delivery | ✅ |
| Online/offline status | ✅ |
| Message read receipts | ✅ |
| Add / remove group members | ✅ |
| Leave group | ✅ |
| Chat search | ✅ |
| User search | ✅ |
| Responsive (mobile + desktop) | ✅ |
| Dark mode (WhatsApp-style UI) | ✅ |
| Serverless OTP API route | ✅ |

---

## 🗂 Project Structure

```
chatapp/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main chat layout
│   │   ├── layout.tsx            # Root layout + providers
│   │   ├── globals.css
│   │   ├── login/
│   │   │   └── page.tsx          # Login (Google + Email OTP)
│   │   └── api/
│   │       └── otp/
│   │           ├── send/route.ts   # POST: generate & email OTP
│   │           └── verify/route.ts # POST: verify OTP
│   ├── components/
│   │   └── chat/
│   │       ├── Sidebar.tsx         # Chat list + search
│   │       ├── ChatWindow.tsx      # Message view + input
│   │       ├── MessageBubble.tsx   # Individual message
│   │       ├── ChatListItem.tsx    # Chat row in sidebar
│   │       ├── Avatar.tsx          # User/group avatar
│   │       ├── NewChatModal.tsx    # Start 1-on-1 chat
│   │       ├── CreateGroupModal.tsx
│   │       └── GroupInfoModal.tsx
│   ├── context/
│   │   └── AuthContext.tsx        # Firebase Auth context
│   ├── hooks/
│   │   ├── useChats.ts            # Realtime chats subscription
│   │   └── useMessages.ts         # Realtime messages subscription
│   └── lib/
│       ├── firebase.ts            # Firebase app init
│       └── firestore.ts           # Firestore helpers & types
├── firestore.rules                # Security rules
├── firestore.indexes.json         # Required indexes
├── firebase.json
├── vercel.json                    # Vercel config
├── netlify.toml                   # Netlify config
├── .env.local.example             # ← COPY THIS to .env.local
└── package.json
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd chatapp
npm install
```

### 2. Set Up Firebase

> ⏱ ~5 minutes

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"** → give it a name → click through
3. Go to **Build → Authentication**:
   - Click **"Get started"**
   - Enable **Google** provider → add your support email → Save
   - Enable **Email/Password** provider → Save
4. Go to **Build → Firestore Database**:
   - Click **"Create database"**
   - Choose **Production mode** (we'll deploy rules)
   - Select a region close to your users → Done
5. Go to **Project Settings** (gear icon) → **Your apps** → click `</>`
   - Register a web app (name it anything)
   - **Copy the config object** — you'll need it next

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# From step 5 above (Firebase web app config)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=my-chatapp.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=my-chatapp
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=my-chatapp.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Gmail OTP (see instructions below)
GMAIL_USER=youremail@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

### 4. Get Your Gmail App Password (for OTP emails)

> This is a special password for apps — NOT your regular Gmail password.

**Step-by-step:**

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Under **"How you sign in to Google"**, enable **2-Step Verification** (if not already)
3. Search for **"App passwords"** in the Google Account search bar
4. Select:
   - **App:** Mail
   - **Device:** Other → type `ChatApp`
5. Click **Generate**
6. Copy the **16-character password** shown (e.g., `abcd efgh ijkl mnop`)
7. Paste it as `GMAIL_APP_PASSWORD` in your `.env.local`

> ⚠️ This password is shown **only once**. Save it immediately!

### 5. Deploy Firestore Security Rules

```bash
# Install Firebase CLI (once)
npm install -g firebase-tools

# Login
firebase login

# Set your project ID in .firebaserc
# Edit .firebaserc → replace "YOUR_FIREBASE_PROJECT_ID"

# Deploy rules + indexes
firebase deploy --only firestore
```

### 6. Run Locally

```bash
npm run dev
# → Open http://localhost:3000
```

---

## 🌐 Deploy to Vercel

> Fastest option — recommended!

### Via Vercel Dashboard (Easiest)

1. Push your code to GitHub (make sure `.env.local` is in `.gitignore` ✅)
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repo
4. **Add environment variables** in the Vercel dashboard:
   - All `NEXT_PUBLIC_FIREBASE_*` vars
   - `GMAIL_USER`
   - `GMAIL_APP_PASSWORD`
5. Click **Deploy** — done! ✅

### Via CLI

```bash
npm install -g vercel
vercel
# Follow prompts, then add env vars in dashboard
```

---

## 🌐 Deploy to Netlify

### Via Netlify Dashboard

1. Push to GitHub
2. Go to [app.netlify.com/start](https://app.netlify.com/start)
3. Connect repo → it will auto-detect `netlify.toml`
4. Go to **Site settings → Environment variables** → add all env vars
5. Click **Deploy site**

> **Important:** Netlify requires `@netlify/plugin-nextjs` for API routes.
> It's already listed in `netlify.toml`. Make sure to install it:
> ```bash
> npm install @netlify/plugin-nextjs
> ```

### Firebase Auth — Add Your Domain

After deployment, add your production URL to Firebase:
1. Firebase Console → **Authentication → Settings → Authorized domains**
2. Add your Vercel/Netlify URL (e.g., `my-chatapp.vercel.app`)

---

## 🔧 Firebase Console — Enable Required Auth Providers

| Provider | Where to enable |
|---|---|
| Google | Auth → Sign-in method → Google |
| Email/Password | Auth → Sign-in method → Email/Password |

---

## 🗄 Firestore Data Model

### `users/{uid}`
```ts
{
  uid: string
  email: string
  displayName: string
  photoURL: string
  online: boolean
  createdAt: Timestamp
  lastSeen: Timestamp
}
```

### `chats/{chatId}`
```ts
{
  type: "direct" | "group"
  name?: string          // groups only
  members: string[]      // UIDs
  admins?: string[]      // groups only
  createdBy?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  lastMessage?: {
    text: string
    senderId: string
    senderName: string
    timestamp: Timestamp
  }
}
```

### `chats/{chatId}/messages/{messageId}`
```ts
{
  chatId: string
  senderId: string
  senderName: string
  senderPhotoURL: string
  text: string
  type: "text" | "system"
  timestamp: Timestamp
  readBy: string[]
}
```

### `otpCodes/{email}` *(server-only, blocked from clients)*
```ts
{
  otp: string
  expiresAt: number   // ms epoch, 10 min TTL
  attempts: number
  createdAt: Timestamp
}
```

---

## 🔐 API Routes

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/otp/send` | Generates OTP, stores in Firestore, emails it |
| `POST` | `/api/otp/verify` | Validates OTP, deletes record on success |

### Request / Response

**POST `/api/otp/send`**
```json
// Request
{ "email": "user@example.com" }

// Response (200)
{ "success": true, "isNewUser": false }
```

**POST `/api/otp/verify`**
```json
// Request
{ "email": "user@example.com", "otp": "123456" }

// Response (200)
{ "success": true }
```

---

## 🛡 Security Highlights

- OTP stored server-side in Firestore (clients can't read `otpCodes`)
- OTP expires in **10 minutes**, max **5 attempts**, then auto-deleted
- Rate limited: **3 sends per minute** per email
- Gmail App Password is a **server-only** env var (never exposed to client)
- Firestore Security Rules enforce auth on all collections
- HTTPS enforced by Vercel/Netlify

---

## 🔮 Recommended Next Steps

- [ ] File/image sharing (Firebase Storage)
- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Message reactions / emoji
- [ ] Message delete / edit
- [ ] Typing indicators
- [ ] Group admin controls (promote/demote)
- [ ] User profile editing
- [ ] Pagination for older messages
- [ ] End-to-end encryption (WebCrypto API)

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | Firebase Authentication |
| Database | Firebase Firestore (realtime) |
| Email | Nodemailer + Gmail SMTP |
| Deploy | Vercel / Netlify |

---

## 🐛 Troubleshooting

**"OTP email not received"**
- Check spam folder
- Verify `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set correctly
- Make sure 2FA is enabled on your Google account
- App passwords require 2FA to be active

**"Firebase: Error (auth/popup-blocked)"**
- Allow popups for your domain in browser settings
- Or use `signInWithRedirect` instead of `signInWithPopup`

**"Missing or insufficient permissions" (Firestore)**
- Deploy security rules: `firebase deploy --only firestore:rules`
- Check that the user is signed in

**"Module not found: nodemailer"**
- Run `npm install` again
- Vercel: nodemailer is listed in `serverExternalPackages` in `next.config.js`

---

*Built using Next.js + Firebase*
