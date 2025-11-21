# Plateful

A modern full-stack grocery management app built with Expo React Native, Firebase, and Vercel.

🚨 **IMPORTANT: Package Manager Requirement** 🚨
- **MUST use npm 9.0+** - This project uses npm workspaces
- **DO NOT use pnpm, yarn, or other package managers**
- Using other package managers will cause build failures and dependency issues
- All commands in this documentation use npm

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Expo SDK](https://img.shields.io/badge/Expo-54.0-000020.svg)](https://expo.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-10.7-orange)](https://firebase.google.com/)
[![npm](https://img.shields.io/badge/npm-9.0+-red)](https://npmjs.com/)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Prerequisites](#prerequisites)
4. [Installation & Setup](#installation--setup)
5. [Development](#development)
6. [Project Structure](#project-structure)
7. [Key Features](#key-features)
8. [Deployment](#deployment)
9. [Debugging & Troubleshooting](#debugging--troubleshooting)
10. [Scripts Reference](#scripts-reference)
11. [Contributing](#contributing)

---

## Overview

**Plateful** is a serverless-first grocery management application that helps users organize their grocery lists, track pantry items, and manage their cooking ingredients efficiently.

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Mobile** | Expo SDK 54 + React Native 0.81 |
| **Language** | TypeScript 5.3 |
| **Routing** | Expo Router (file-based) |
| **Backend** | Firebase (Auth + Firestore + Storage) |
| **API** | Vercel Edge Functions + Hono |
| **Package Manager** | npm 9.0+ (workspaces) |
| **Build Tool** | Turbo (monorepo orchestration) |

### Monorepo Structure

```
plateful/
├── apps/
│   ├── mobile/          # Expo React Native app
│   └── api/             # Vercel serverless functions
├── packages/
│   ├── shared/          # Shared types and utilities
│   └── ui/              # Shared UI components
├── docs/                # Documentation
└── tools/               # Development tools (Figma sync)
```

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Expo React Native Mobile App                      │     │
│  │  • iOS / Android / Web                             │     │
│  │  • TypeScript + React 19                           │     │
│  │  • Expo Router (file-based navigation)             │     │
│  │  • @plateful/ui (shared components)                │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────┬───────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼───────┐    ┌────────▼────────┐
│  Firebase SDK │    │  Vercel API     │
│  (Client)     │    │  (REST/HTTP)    │
└───────┬───────┘    └────────┬────────┘
        │                     │
┌───────▼─────────────────────▼───────────────────────────────┐
│                    BACKEND LAYER                             │
│                                                              │
│  ┌────────────────────────┐    ┌─────────────────────────┐  │
│  │  Firebase Services     │    │  Vercel Edge Functions  │  │
│  │                        │    │                         │  │
│  │  • Authentication      │    │  • Custom Business      │  │
│  │    - Email/Password    │    │    Logic                │  │
│  │    - Google OAuth      │    │  • Third-party          │  │
│  │                        │    │    Integrations         │  │
│  │  • Firestore (NoSQL)   │    │  • Webhooks             │  │
│  │    - Real-time sync    │    │                         │  │
│  │    - Offline support   │    │  Runtime: Node 18.x     │  │
│  │                        │    │  Framework: Hono        │  │
│  │  • Cloud Storage       │    │                         │  │
│  │    - File uploads      │    │                         │  │
│  │    - Secure rules      │    │                         │  │
│  │                        │    │                         │  │
│  │  Region: us-central1   │    │  Region: Global Edge    │  │
│  └────────────────────────┘    └─────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

**Authentication:**
```
Mobile → Firebase Auth SDK → Firebase Auth Service → JWT Token → Mobile
```

**Data Operations:**
```
Mobile → Firestore SDK → Security Rules → Allow/Deny → Firestore DB
```

**Custom API:**
```
Mobile → HTTP Request → Vercel Function → Business Logic → Response
```

---

## Prerequisites

### Required Software

| Tool | Minimum Version | Installation |
|------|----------------|--------------|
| **Node.js** | 18.0.0+ | [nodejs.org](https://nodejs.org/) |
| **npm** | 9.0.0+ | Comes with Node.js (verify with `npm --version`) |
| **Expo CLI** | Latest | Installed automatically with dependencies |
| **Firebase CLI** | 12.0.0+ | `npm install -g firebase-tools` |
| **Vercel CLI** | Latest | `npm install -g vercel` (optional) |

⚠️ **CRITICAL: Package Manager Requirement**
- **MUST use npm** - Do NOT use pnpm, yarn, or other package managers
- This project uses npm workspaces and npm-specific configurations
- Using other package managers will cause build failures and dependency issues

### Platform-Specific Requirements

#### **For iOS Development:**
- macOS 12.0+
- Xcode 14.0+
- iOS Simulator or physical device
- CocoaPods (`sudo gem install cocoapods`)

#### **For Android Development:**
- Android Studio
- Android SDK (API 24+)
- Android Emulator or physical device
- Java Development Kit (JDK) 11+

### Accounts Required

- ✅ [Firebase Account](https://console.firebase.google.com) (free tier sufficient)
- ✅ [Vercel Account](https://vercel.com) (optional, for API deployment)
- ✅ [Expo Account](https://expo.dev) (optional, for EAS builds)

---

## Installation & Setup

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/yourusername/plateful-app.git
cd plateful-app

# Verify npm version (must be 9.0+)
npm --version

# Install all dependencies
npm install

# Verify installation
npm run type-check  # Should complete without errors
```

⚠️ **Note:** If you encounter dependency issues, ensure you're using npm:
```bash
# Verify you're using npm (not pnpm/yarn)
npm --version

# If you have pnpm installed, you can disable it
corepack disable

# Clean install with npm
rm -rf node_modules package-lock.json
npm install
```

**Project Configuration:**
- The `.npmrc` file enforces npm usage and workspace configuration
- This file ensures consistent package resolution across all environments
- Do not modify or delete this file

### Step 2: Firebase Setup

#### **2.1: Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" → Name: `plateful-mvp` (or your choice)
3. Choose region and enable/disable Google Analytics
4. **Note your Project ID** (e.g., `plateful-mvp-a1b2c`)

#### **2.2: Enable Firebase Services**

**Enable Authentication:**
```
Firebase Console → Authentication → Get Started
→ Sign-in method → Enable Email/Password
→ Sign-in method → Enable Google
```

**For Google OAuth:**
- Copy **Web client ID**, **iOS client ID**, and **Android client ID**
- Found in: Authentication → Sign-in method → Google → Web SDK configuration

**Enable Firestore:**
```
Firebase Console → Firestore Database → Create database
→ Start in production mode
→ Region: us-central1 (recommended)
```

⚠️ **Important:** Region cannot be changed after creation!

**Enable Cloud Storage:**
```
Firebase Console → Storage → Get started
→ Start in production mode
→ Location: Same as Firestore (us-central1)
```

#### **2.3: Get Firebase Configuration**

```
Firebase Console → Project Settings → General
→ Your apps → Add app → Web
→ Copy configuration values
```

### Step 3: Configure Environment Variables

#### **3.1: Mobile App Configuration**

```bash
# Navigate to mobile app
cd apps/mobile

# Copy example file
cp .env.example .env

# Edit .env with your values
nano .env  # or use your preferred editor
```

**Required Variables (`apps/mobile/.env`):**

```bash
# Firebase Configuration (from Firebase Console)
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=plateful-mvp.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=plateful-mvp
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=plateful-mvp.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456

# Google OAuth Client IDs (from Firebase Authentication)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123-abc.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=123-ios.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=123-android.apps.googleusercontent.com

# Optional: Figma Integration
FIGMA_ACCESS_TOKEN=figd_your_token_here
FIGMA_FILE_ID=YL6JUI6MAovP38M7iF7Xbw
```

✅ **Security Note:** `EXPO_PUBLIC_*` variables are bundled into the app. This is safe for Firebase config (protected by security rules), but never put actual secrets here.

#### **3.2: API Base URL Configuration**

Configure whether to use local development server or hosted Vercel API:

```bash
# In apps/mobile/.env
# Option 1: Use local development server (default)
EXPO_PUBLIC_API_MODE=local

# Option 2: Use hosted Vercel API
EXPO_PUBLIC_API_MODE=hosted

# Option 3: Direct URL override (optional)
EXPO_PUBLIC_API_BASE_URL=https://your-custom-api-url.com/api
```

**API Mode Options:**
- `local` (default): Uses `http://localhost:3001` (or `http://10.0.2.2:3001` for Android emulator)
- `hosted`: Uses `https://plateful-app.vercel.app/api`
- Direct URL: Overrides mode if `EXPO_PUBLIC_API_BASE_URL` is set

**Platform-Specific Local URLs:**
- Web/iOS: `http://localhost:3001`
- Android Emulator: `http://10.0.2.2:3001` (special IP for emulator)

#### **3.3: API Configuration** (Optional)

Only needed if deploying Vercel functions:

```bash
cd apps/api
cp .env.example .env.local
```

```bash
# Firebase Admin SDK (get from Firebase Console → Service Accounts)
FIREBASE_PROJECT_ID=plateful-mvp
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@plateful-mvp.iam.gserviceaccount.com

# YouTube Data API v3 (for tutorial video search)
# Get from: https://console.cloud.google.com/apis/credentials
YOUTUBE_API_KEY=your-youtube-api-key-here

# Anthropic API (for written tutorial search)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Azure Cosmos DB (optional, for chat/recipe storage)
COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
COSMOS_KEY=your-cosmos-db-primary-key
```

**Getting Your YouTube API Key:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**:
   - Navigate to **APIs & Services** → **Library**
   - Search for "YouTube Data API v3"
   - Click **Enable**
4. Create credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **API Key**
   - Copy the API key
5. (Optional) Restrict the API key:
   - Click on the key to edit
   - Under **API restrictions**, select "Restrict key"
   - Choose "YouTube Data API v3"
   - Save

### Step 4: Deploy Firebase Security Rules

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project (if not done)
firebase init firestore storage

# Select:
# - Firestore, Storage
# - Use existing project: plateful-mvp
# - Use existing firestore.rules and storage.rules files

# Deploy security rules
firebase deploy --only firestore:rules,storage:rules

# Expected output:
# ✔ Deploy complete!
# ✔ firestore:rules
# ✔ storage:rules
```

### Step 5: Verify Setup

```bash
# Return to project root
cd ../..

# Type check all packages
npm run type-check

# Expected: No errors

# Try running the mobile app
cd apps/mobile
npm run dev

# Expected: Metro bundler starts, QR code displays
```

---

## Development

### Quick Start

```bash
# From project root, run all apps simultaneously
npm run dev

# This starts:
# - Mobile app (Metro bundler on port 8081)
# - API (Vercel dev server on port 3000)
```

### Run Individual Apps

#### **Mobile App**

```bash
# Option 1: From root
npm run mobile

# Option 2: From apps/mobile
cd apps/mobile
npm run dev

# For specific platforms:
npm run android    # Android emulator
npm run ios        # iOS simulator (macOS only)
npm run web        # Web browser
```

**Using Development Build:**
```bash
# Install Expo development client on device
npx expo run:android  # or npx expo run:ios

# This builds and installs the app (~5-10 minutes first time)
```

#### **API**

```bash
# From root
npm run api

# Or from apps/api
cd apps/api
npm run dev

# API will be available at http://localhost:3000
# Test: curl http://localhost:3000/api/health
```

### Development Workflow

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Make changes to code:**
   - Mobile app: Fast Refresh applies changes automatically
   - API: Vercel dev server hot-reloads

3. **Type check:**
   ```bash
   npm run type-check
   ```

4. **Format code:**
   ```bash
   npm run format
   ```

5. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

### Testing on Devices

#### **Physical Device (Expo Go):**

**⚠️ Limitations:** Firebase Auth won't work in Expo Go. Use development build instead.

```bash
1. Install Expo Go app from App Store / Play Store
2. Run: npm run dev
3. Scan QR code with camera (iOS) or Expo Go app (Android)
```

#### **Physical Device (Development Build):**

```bash
# Build and install development build
npx expo run:android  # or npx expo run:ios

# App installs on device
# Metro bundler connects automatically
```

#### **Emulator/Simulator:**

```bash
# Android
npm run android

# iOS (macOS only)
npm run ios
```

---

## Project Structure

### Detailed File Organization

```
plateful/
├── apps/
│   ├── mobile/                        # Expo React Native app
│   │   ├── app/                       # Expo Router pages
│   │   │   ├── (auth)/               # Auth route group
│   │   │   │   ├── _layout.tsx       # Auth layout
│   │   │   │   ├── sign-in.tsx       # Sign-in screen
│   │   │   │   ├── register.tsx      # Registration screen
│   │   │   │   └── reset-password.tsx # Password reset
│   │   │   ├── (tabs)/               # Tab navigation group
│   │   │   │   ├── _layout.tsx       # Tab layout
│   │   │   │   ├── index.tsx         # Dashboard (Home)
│   │   │   │   ├── groceries.tsx     # Grocery lists
│   │   │   │   └── settings.tsx      # Settings
│   │   │   ├── _layout.tsx           # Root layout
│   │   │   └── index.tsx             # Entry point (auth check)
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── firebase.ts       # Firebase initialization
│   │   │   ├── services/
│   │   │   │   ├── auth.ts           # Auth operations
│   │   │   │   ├── firestore.ts      # Firestore operations
│   │   │   │   └── storage.ts        # Storage operations
│   │   │   └── theme/
│   │   │       └── index.ts          # Theme configuration
│   │   ├── theme/                    # Design tokens (from Figma)
│   │   │   ├── colors.ts
│   │   │   ├── typography.ts
│   │   │   ├── spacing.ts
│   │   │   └── shadows.ts
│   │   ├── .env                      # Environment variables (local)
│   │   ├── .env.example              # Environment template
│   │   ├── app.json                  # Expo configuration
│   │   ├── eas.json                  # EAS Build configuration
│   │   └── package.json
│   │
│   └── api/                          # Vercel serverless API
│       ├── api/
│       │   ├── health.ts             # Health check endpoint
│       │   └── [future routes]
│       ├── .env.example
│       ├── .env.local                # Local environment (not committed)
│       ├── vercel.json               # Vercel configuration
│       └── package.json
│
├── packages/
│   ├── shared/                       # Shared utilities & types
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── grocery.ts        # Grocery types
│   │   │   │   └── user.ts           # User types
│   │   │   └── utils/
│   │   │       └── validation.ts     # Validation helpers
│   │   └── package.json
│   │
│   └── ui/                           # Shared UI components
│       ├── src/
│       │   └── components/
│       │       ├── Button.tsx        # Reusable button
│       │       └── Input.tsx         # Reusable input
│       └── package.json
│
├── docs/                             # Documentation
│   ├── BACKEND_SETUP.md              # Backend setup guide
│   ├── AUTH_SCREENS_GUIDE.md         # Auth implementation
│   ├── FIGMA_INTEGRATION.md          # Design sync guide
│   └── FIREBASE_VERIFICATION.md      # Firebase verification
│
├── tools/                            # Development tools
│   └── figma/                        # Figma design sync
│       ├── scripts/
│       │   ├── extract-tokens.js     # Extract design tokens
│       │   └── download-assets.js    # Download assets
│       └── package.json
│
├── .cursorrules                      # AI assistant instructions
├── .firebaserc                       # Firebase project config
├── .gitignore                        # Git ignore rules
├── .npmrc                            # npm configuration (enforces npm usage)
├── firebase.json                     # Firebase services config
├── firestore.rules                   # Firestore security rules
├── firestore.indexes.json            # Firestore indexes
├── storage.rules                     # Storage security rules
├── package-lock.json                  # Dependency lock file
├── package.json                       # Root package.json
├── turbo.json                         # Turbo build configuration
└── README.md                          # This file
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `apps/mobile/app/` | Expo Router pages (file-based routing) |
| `apps/mobile/src/` | Shared mobile app code (services, config) |
| `apps/api/api/` | Vercel serverless function routes |
| `packages/shared/` | Shared types and utilities across apps |
| `packages/ui/` | Reusable UI components |
| `docs/` | Comprehensive documentation |
| `tools/figma/` | Figma design token extraction |

---

## Key Features

### ✨ Implemented Features

#### **Authentication**
- ✅ Email/Password sign-in
- ✅ Google OAuth (iOS/Android/Web)
- ✅ Password reset flow
- ✅ Secure token management
- ✅ Persistent sessions

#### **Grocery Management**
- ✅ Create multiple grocery lists
- ✅ Add/remove items
- ✅ Check off items
- ✅ Separate Pantry vs Grocery List tabs
- ✅ Real-time synchronization (Firestore)

#### **User Interface**
- ✅ Modern Figma-designed UI
- ✅ Orange/Blue color scheme
- ✅ Tab-based navigation
- ✅ Responsive layouts
- ✅ Loading states and error handling

#### **Backend Services**
- ✅ Firebase Authentication
- ✅ Firestore NoSQL database
- ✅ Cloud Storage for file uploads
- ✅ Security rules (user-based access control)
- ✅ Vercel API for custom logic

#### **Developer Experience**
- ✅ TypeScript throughout
- ✅ npm workspaces (fast installs)
- ✅ Turbo for monorepo builds
- ✅ Hot reload / Fast Refresh
- ✅ Comprehensive documentation

### 🚧 Planned Features

- [ ] Recipe management
- [ ] Meal planning
- [ ] Nutritional tracking
- [ ] Shopping list sharing
- [ ] Barcode scanning
- [ ] Price tracking
- [ ] Store location integration
- [ ] Push notifications
- [ ] Dark mode support

---

## Deployment

### Mobile App Deployment

#### **Prerequisites**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS Build
cd apps/mobile
eas build:configure
```

#### **Build for App Stores**

```bash
# iOS (TestFlight/App Store)
eas build --platform ios --profile production

# Android (Play Store)
eas build --platform android --profile production

# Both platforms
eas build --platform all --profile production
```

#### **Submit to Stores**

```bash
# iOS App Store
eas submit --platform ios

# Android Play Store
eas submit --platform android
```

### API Deployment (Vercel)

#### **Prerequisites**

- Vercel account (Pro plan recommended for better performance)
- Vercel CLI installed: `npm install -g vercel`

#### **First-Time Setup**

```bash
cd apps/api

# Login to Vercel
vercel login

# Deploy (will create project)
vercel

# Answer prompts:
# - Setup and deploy? Yes
# - Which scope? [Your account]
# - Link to existing project? No
# - Project name? plateful-app (or your project name)
# - In which directory? ./
# - Override settings? No
```

#### **Vercel Configuration**

The project includes two Vercel configuration files:

1. **Root `vercel.json`**: Routes API requests to serverless functions
2. **`apps/api/vercel.json`**: Configures serverless function runtime and settings

**Key Configuration:**
- Runtime: Node.js 18.x
- Max Duration: 30 seconds (Pro plan)
- Functions: All files in `apps/api/api/**/*.ts` are deployed as serverless functions

#### **Environment Variables on Vercel**

Set environment variables in Vercel Dashboard:

1. Go to your project → **Settings** → **Environment Variables**
2. Add the following variables for **Production**, **Preview**, and **Development**:

```bash
# Required for API functions
ANTHROPIC_API_KEY=sk-ant-api03-...
YOUTUBE_API_KEY=your-youtube-api-key

# Optional: Azure Cosmos DB (for chat/recipe storage)
COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
COSMOS_KEY=your-cosmos-db-primary-key

# Optional: Firebase Admin SDK (if using server-side Firebase)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project.iam.gserviceaccount.com
```

**Via CLI:**
```bash
cd apps/api

# Set environment variable
vercel env add ANTHROPIC_API_KEY production

# List all environment variables
vercel env ls
```

#### **Deploying Updates**

```bash
cd apps/api

# Deploy to production
vercel --prod

# Or deploy preview (for testing)
vercel
```

#### **Testing Deployment**

After deployment, test your API endpoints:

```bash
# Health check
curl https://plateful-app.vercel.app/api/health

# Example: Test chat endpoint (replace with your actual endpoint)
curl -X POST https://plateful-app.vercel.app/api/chat/conversation \
  -H "Content-Type: application/json" \
  -d '{"userID": "test-user"}'
```

#### **Local vs Hosted API Toggle**

The mobile app can switch between local and hosted API:

**For Local Development:**
```bash
# In apps/mobile/.env
EXPO_PUBLIC_API_MODE=local
```

**For Production/Testing Hosted API:**
```bash
# In apps/mobile/.env
EXPO_PUBLIC_API_MODE=hosted
```

The app will automatically use:
- Local: `http://localhost:3001` (or `http://10.0.2.2:3001` for Android emulator)
- Hosted: `https://plateful-app.vercel.app/api`

#### **Troubleshooting Vercel Deployment**

**Common Issues:**

1. **Build fails:**
   ```bash
   # Check build logs
   vercel logs [deployment-url]
   
   # Ensure TypeScript compiles
   cd apps/api
   npm run build
   ```

2. **Function timeout:**
   - Check `apps/api/vercel.json` for `maxDuration` setting
   - Pro plan allows up to 300 seconds

3. **Environment variables not working:**
   - Ensure variables are set for correct environment (Production/Preview/Development)
   - Redeploy after adding new variables: `vercel --prod`

# Expected: {"status":"ok","timestamp":"..."}
```

### Firebase Deployment

```bash
# Deploy security rules
firebase deploy --only firestore:rules,storage:rules

# Deploy with specific project
firebase deploy --only firestore:rules,storage:rules --project plateful-mvp
```

---

## Debugging & Troubleshooting

### Common Issues

#### **Issue 1: Metro Bundler Won't Start**

**Symptoms:**
```
Error: Cannot find module 'expo'
```

**Solutions:**
```bash
# Clear cache and reinstall
cd apps/mobile
rm -rf node_modules .expo
npm install
npm run start -- --clear
```

#### **Issue 2: Firebase "Component Not Registered"**

**Symptoms:**
```
Error: Firebase: Error (auth/component-not-registered)
```

**Cause:** Auth initialized incorrectly

**Solution:**
Check `apps/mobile/src/config/firebase.ts`:
```typescript
// ✅ Correct
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
```

#### **Issue 3: Expo Development Build Error**

**Symptoms:**
```
CommandError: No development build for this project
```

**Solution:**
```bash
# Build and install development build
npx expo run:android  # or npx expo run:ios

# Wait for build (~5-10 minutes first time)
# App will install and Metro will connect
```

#### **Issue 4: Firestore Permission Denied**

**Symptoms:**
```
Error: Missing or insufficient permissions
```

**Solutions:**
1. Verify security rules deployed:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. Check document `ownerId` matches `auth.uid`:
   ```typescript
   // Correct
   await addDoc(collection(db, 'groceryLists'), {
     ownerId: auth.currentUser.uid,  // Must match
     // ...
   });
   ```

3. Test rules in Firebase Console → Firestore → Rules → Playground

#### **Issue 5: Environment Variables Not Loading**

**Symptoms:**
```
process.env.EXPO_PUBLIC_FIREBASE_API_KEY is undefined
```

**Solutions:**
```bash
# 1. Verify .env file exists
ls apps/mobile/.env

# 2. Verify variables have EXPO_PUBLIC_ prefix
cat apps/mobile/.env | grep EXPO_PUBLIC

# 3. Restart Metro bundler
# Press Ctrl+C, then:
npm run dev -- --clear

# 4. For web, you may need to set in index.html or metro.config.js
```

#### **Issue 6: Package Manager Conflicts**

**Symptoms:**
```
Error: EEXIST: file already exists
Error: Cannot find module
```

**Solution:**
```bash
# Ensure you're using npm (not pnpm/yarn)
npm --version

# If you have pnpm installed, disable it
corepack disable

# Clean install with npm
rm -rf node_modules package-lock.json
npm install
```

#### **Issue 7: TypeScript Errors After Git Pull**

**Symptoms:**
```
Type errors in node_modules
```

**Solution:**
```bash
# Clean and rebuild
npm run clean
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm install
npm run build
npm run type-check
```

### Debug Logging

#### **Enable Firebase Debug Logs**

```typescript
// In apps/mobile/src/config/firebase.ts
import { setLogLevel } from 'firebase/app';

if (__DEV__) {
  setLogLevel('debug');
}
```

#### **Enable Metro Bundler Verbose Logging**

```bash
cd apps/mobile
EXPO_DEBUG=true npm run start
```

#### **View Vercel Function Logs**

```bash
# Real-time logs
vercel logs --follow

# Logs for specific deployment
vercel logs [deployment-url]
```

### Getting Help

1. **Check documentation:**
   - `docs/BACKEND_SETUP.md` - Backend issues
   - `docs/FIGMA_INTEGRATION.md` - Design sync issues
   - `docs/AUTH_SCREENS_GUIDE.md` - Authentication issues

2. **Check known issues below**

3. **Search GitHub Issues:**
   - [Expo Issues](https://github.com/expo/expo/issues)
   - [Firebase Issues](https://github.com/firebase/firebase-js-sdk/issues)
   - [React Native Issues](https://github.com/facebook/react-native/issues)

4. **Community support:**
   - [Expo Forums](https://forums.expo.dev/)
   - [Firebase Community](https://firebase.google.com/community)
   - [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

---

## Scripts Reference

### Root Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps in development mode |
| `npm run build` | Build all apps for production |
| `npm run type-check` | Type check all packages |
| `npm run lint` | Lint all packages |
| `npm run format` | Format code with Prettier |
| `npm run clean` | Clean build artifacts |
| `npm run mobile` | Run mobile app only |
| `npm run api` | Run API only |
| `npm run figma:sync` | Sync Figma designs (tokens + assets) |
| `npm run figma:tokens` | Extract design tokens from Figma |
| `npm run figma:assets` | Download assets from Figma |

### Mobile App Scripts

```bash
cd apps/mobile

# Development
npm run dev          # Start with development build
npm run start        # Start Metro bundler
npm run android      # Run on Android
npm run ios          # Run on iOS
npm run web          # Run in web browser

# Building
npm run build        # Export for production
npm run type-check   # Type check only
npm run clean        # Clean .expo directory
```

### API Scripts

```bash
cd apps/api

# Development
npm run dev          # Start Vercel dev server
npm run type-check   # Type check only
```

---

## Known Issues

### Expo SDK 54

- ⚠️ **React Native 0.81.4** - Some third-party libraries may have compatibility issues
- ⚠️ **Web support** - `react-native-web` needs to be installed separately:
  ```bash
  npx expo install react-native-web@^0.21.0
  ```

### Firebase v10

- ✅ **Resolved** - Firebase Auth works with React Native development builds
- ❌ **Limitation** - Firebase Auth does NOT work in Expo Go (use development build)
- ⚠️ **AsyncStorage** - Required for auth persistence:
  ```bash
  npm install @react-native-async-storage/async-storage
  ```

### Vercel Functions

- ⚠️ **Cold starts** - First request may take 50-100ms
- ⚠️ **Timeout** - Free tier: 10s max execution time
- ⚠️ **Region** - Deployed to all edge locations (may affect Firebase region latency)

### npm Workspaces

- ⚠️ **Package manager conflicts** - Must use npm, not pnpm/yarn
- ⚠️ **Symlink issues** - Some tools don't follow symlinks correctly
- ✅ **Workaround** - Use `npm run <command> --workspace=<package>` for package-specific commands

### Development Build

- ⚠️ **First build time** - 5-10 minutes for initial build
- ⚠️ **Requires rebuild** - After adding native dependencies or changing app.json
- ✅ **Caches** - Subsequent builds are much faster (~1-2 minutes)

---

## Contributing

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/plateful-app.git`
3. Follow installation steps above
4. Create a feature branch: `git checkout -b feature/your-feature-name`

### Code Standards

- ✅ TypeScript strict mode
- ✅ ESLint + Prettier formatting
- ✅ Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- ✅ Type check before committing: `npm run type-check`

### Pull Request Process

1. Update documentation if needed
2. Run `npm run type-check` and fix any errors
3. Run `npm run format` to format code
4. Write clear commit messages
5. Submit PR with description of changes

### Code Review Checklist

- [ ] TypeScript types are correct
- [ ] No console.logs in production code
- [ ] Error handling added where needed
- [ ] Security rules updated if data model changed
- [ ] Documentation updated
- [ ] Tests added (if applicable)

---

## Additional Documentation

- **[Backend Setup Guide](docs/BACKEND_SETUP.md)** - Comprehensive backend architecture and setup
