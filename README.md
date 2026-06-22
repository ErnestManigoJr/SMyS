# SMyS — See Myself
## Mobile PWA · Live Presence App

Your digital presence. Live with someone.

---

# INSTRUCTIONS
## How to build this — step by step, starting from nothing

These instructions work on **Windows with PowerShell**.
Read each step completely before you type anything.
If something says "type this", type it exactly as written.

---

## PART 1 — Install the tools you need

You only do Part 1 once. If you already have Node.js installed, skip to Part 2.

---

### Step 1 — Install Node.js

Node.js is the engine that runs the server and build tools.

1. Open your browser and go to: **https://nodejs.org**
2. Click the big green button that says **LTS** (it means "Long Term Support" — the stable version)
3. Download the Windows installer (it ends in `.msi`)
4. Run the installer. Click Next, Next, Next, Install. Leave all settings as default.
5. When it finishes, click Finish.

**Check it worked:**
Open PowerShell (press Windows key, type `powershell`, hit Enter) and type:

```powershell
node --version
```

You should see something like `v20.11.0` or higher.
Also type:

```powershell
npm --version
```

You should see something like `10.2.0` or higher.

If you see an error, close PowerShell and open it again, then try again.

---

### Step 2 — Install Git

Git saves your project and lets you share code.

1. Go to: **https://git-scm.com/download/win**
2. Click the download link for 64-bit Windows
3. Run the installer. Click Next through everything. Leave all settings as default.
4. When it finishes, close and reopen PowerShell.

**Check it worked:**

```powershell
git --version
```

You should see something like `git version 2.47.0`.

---

### Step 3 — Install VS Code (your code editor)

1. Go to: **https://code.visualstudio.com**
2. Click the blue Download button for Windows
3. Run the installer. Accept all defaults.
4. When installed, open VS Code to make sure it works.

---

## PART 2 — Set up the project

---

### Step 4 — Put the project folder in the right place

You downloaded or unzipped the `smys-mvp-v2` folder.

Move or copy it to your C drive so the path is:

```
C:\smys-mvp-v2
```

---

### Step 5 — Open PowerShell in the project folder

1. Press Windows key
2. Type `powershell` and press Enter
3. In PowerShell, type this to go to your project:

```powershell
cd C:\smys-mvp-v2
```

You should now see `PS C:\smys-mvp-v2>` in PowerShell.

---

### Step 6 — Install the server packages

The server is the backend. It manages rooms and voice tokens.

In PowerShell, type:

```powershell
cd server
npm install
```

This downloads all the code the server needs. It takes 1–2 minutes.
You will see a lot of text scrolling — that is normal.
Wait until you see the cursor back at `PS C:\smys-mvp-v2\server>`.

---

### Step 7 — Set up the server environment file

The server needs a settings file. It is not included for security reasons — you create it yourself.

In PowerShell, type:

```powershell
copy .env.example .env
```

Now open the `.env` file in VS Code. To do that, type:

```powershell
code .env
```

You will see this:

```
PORT=4000
ALLOWED_ORIGINS=http://localhost:5173
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

**For now, leave everything blank after the `=` signs.**
The app works without any API keys in demo mode.
You will fill in the API keys in Part 4 when you are ready to go live.

Save the file (Ctrl+S) and close it.

---

### Step 8 — Install the client packages

The client is the frontend — what people see in the browser.

In PowerShell, go back to the main folder:

```powershell
cd ..
cd client
npm install
```

This takes 2–5 minutes. More text will scroll — still normal.

---

### Step 9 — Set up the client environment file

```powershell
copy .env.example .env.local
```

Leave this file as-is for now. The defaults work for local development.

---

## PART 3 — Run the app locally

You need **two PowerShell windows** running at the same time — one for the server, one for the client.

---

### Step 10 — Start the server

In your first PowerShell window, go to the server folder:

```powershell
cd C:\smys-mvp-v2\server
node index.js
```

You should see:

```
SMyS server running at http://localhost:4000
```

**Do not close this window.** Leave it running.

> If you see `Error: listen EADDRINUSE :::4000` it means something else is already using port 4000.
> Open the `.env` file and change `PORT=4000` to `PORT=4001`.
> Then change `VITE_SERVER_URL=http://localhost:4000` in `client\.env.local` to `http://localhost:4001`.
> Save both files and try again.

---

### Step 11 — Start the client

Open a **second** PowerShell window (right-click the taskbar PowerShell, click New Window).

In the new window:

```powershell
cd C:\smys-mvp-v2\client
npm run dev
```

You should see something like:

```
  VITE v5.4.10  ready in 800 ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.x:5173/
```

**Do not close this window either.**

---

### Step 12 — Open the app

Open Chrome or Edge and go to:

```
http://localhost:5173
```

You should see the SMyS entrance screen.

**Try the full flow:**
1. Tap **Enter SMyS**
2. Take a selfie or upload a photo
3. Type your name
4. Create a room
5. Copy the invite link
6. Open it in a second tab to simulate a second person joining
7. Enter the room — you should see the 3D space with your face on the Twin

---

## PART 4 — Get the real API keys (to go live)

This part makes the audio work and enables all features.
You can do this any time after Part 3 works.

---

### Step 13 — LiveKit (real-time audio and video)

LiveKit is what lets two people hear each other in the room.

1. Go to: **https://cloud.livekit.io**
2. Click **Sign Up** — it is free to start
3. Create a project and give it any name (e.g. `smys`)
4. Go to **Settings** → **API Keys**
5. Click **Add Key**
6. Copy these three things:
   - **API Key** (looks like `API...`)
   - **API Secret** (a long random string)
   - **WebSocket URL** (looks like `wss://yourproject.livekit.cloud`)

Open `C:\smys-mvp-v2\server\.env` and fill them in:

```
LIVEKIT_API_KEY=APIxxxxxxxxxxx
LIVEKIT_API_SECRET=your-secret-here
LIVEKIT_URL=wss://yourproject.livekit.cloud
```

Open `C:\smys-mvp-v2\client\.env.local` and add:

```
VITE_LIVEKIT_URL=wss://yourproject.livekit.cloud
```

Save both files. Restart both servers (Ctrl+C to stop, then run again).

---

### Step 14 — OpenAI (Whisper rephrasing)

OpenAI makes the Whisper feature smart — it rephrases your private thoughts naturally.

1. Go to: **https://platform.openai.com**
2. Sign in or sign up
3. Click your profile icon (top right) → **API keys**
4. Click **Create new secret key**
5. Copy the key (it starts with `sk-...`)

Open `C:\smys-mvp-v2\server\.env` and add:

```
OPENAI_API_KEY=sk-xxxxxxxxxxxx
```

Save and restart the server.

---

### Step 15 — Supabase (save clips permanently)

Supabase stores your recordings so they do not disappear when the server restarts.

1. Go to: **https://supabase.com**
2. Click **Start your project** — free tier is fine
3. Create a new project (give it any name, pick a region close to you)
4. Wait for it to set up (takes about 2 minutes)
5. Go to **Project Settings** → **API**
6. Copy these three values:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)
   - **service_role secret key** (another long string)

Open `C:\smys-mvp-v2\server\.env` and add them:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

---

## PART 5 — Deploy to the internet (Azure)

This makes the app accessible from any phone, anywhere.

---

### Step 16 — Create a free Azure account

1. Go to: **https://azure.microsoft.com/free**
2. Click **Start free**
3. Sign in with a Microsoft account (or create one)
4. Fill in your details — a free account gives you $200 credit and free tiers

---

### Step 17 — Install Azure CLI

The Azure CLI is a tool that lets you control Azure from PowerShell.

1. Go to: **https://learn.microsoft.com/en-us/cli/azure/install-azure-cli-windows**
2. Download and run the installer
3. After installing, close and reopen PowerShell
4. Type this to log in to Azure:

```powershell
az login
```

A browser window will open. Sign in with your Microsoft account.

---

### Step 18 — Deploy the server to Azure (App Service)

In PowerShell:

```powershell
cd C:\smys-mvp-v2\server

# Create a resource group (a folder in Azure)
az group create --name smys-rg --location eastus

# Create a hosting plan (the machine that runs your code)
az appservice plan create --name smys-plan --resource-group smys-rg --sku B1 --is-linux

# Create the web app
az webapp create --resource-group smys-rg --plan smys-plan --name smys-server-YOUR-NAME --runtime "NODE:20-lts"
```

Replace `YOUR-NAME` with something unique like your name or initials (e.g. `smys-server-ernest`).

**Set your environment variables on Azure:**

```powershell
az webapp config appsettings set --resource-group smys-rg --name smys-server-YOUR-NAME --settings `
  PORT=8080 `
  ALLOWED_ORIGINS="https://smys-YOUR-NAME.azurestaticapps.net" `
  LIVEKIT_API_KEY="your-key" `
  LIVEKIT_API_SECRET="your-secret" `
  LIVEKIT_URL="wss://yourproject.livekit.cloud" `
  OPENAI_API_KEY="sk-your-key"
```

**Deploy the code:**

```powershell
az webapp up --resource-group smys-rg --name smys-server-YOUR-NAME --runtime "NODE:20-lts"
```

When it finishes you will see a URL like `https://smys-server-YOUR-NAME.azurewebsites.net`.
Test it by going to that URL + `/health` in your browser.
You should see `{"ok":true}`.

---

### Step 19 — Deploy the frontend to Azure Static Web Apps

First, update the client `.env.local` so it points to your live server:

```
VITE_SERVER_URL=https://smys-server-YOUR-NAME.azurewebsites.net
VITE_LIVEKIT_URL=wss://yourproject.livekit.cloud
```

Build the frontend:

```powershell
cd C:\smys-mvp-v2\client
npm run build
```

This creates a `dist` folder with the finished app.

Now deploy it:

```powershell
az staticwebapp create --name smys-YOUR-NAME --resource-group smys-rg --location eastus2 --source . --output-location dist
```

When it finishes you will get a URL like `https://smys-YOUR-NAME.azurestaticapps.net`.

Open that URL on your phone. It should work like a mobile app.

---

### Step 20 — Test the full flow from your phone

1. Open Chrome on your phone
2. Go to `https://smys-YOUR-NAME.azurestaticapps.net`
3. When Chrome asks if you want to install the app, tap **Add to home screen**
4. Now tap the SMyS icon on your home screen
5. Go through the full flow: selfie → setup → create room
6. Copy the invite link and text it to someone
7. When they tap it, you both hear each other

---

## PART 6 — What each file does

If you ever get confused about what a file is for, look here.

```
smys-mvp-v2/
│
├── client/                     Everything the user sees in the browser
│   ├── public/                 App icons and PWA manifest
│   ├── src/
│   │   ├── App.jsx             Main app — decides which screen to show
│   │   ├── styles.css          All the visual design
│   │   │
│   │   ├── screens/            The 6 screens the user moves through
│   │   │   ├── Entrance.jsx    The opening screen — SMyS logo + Enter button
│   │   │   ├── Selfie.jsx      Take or upload your photo
│   │   │   ├── Setup.jsx       Choose your name and voice
│   │   │   ├── RoomChoice.jsx  Create a new room
│   │   │   ├── Invite.jsx      Get the link to share with someone
│   │   │   └── Room.jsx        The live room — 3D space, voice, whisper, record
│   │   │
│   │   ├── room/               The 3D space
│   │   │   ├── Scene.jsx       The Three.js canvas — builds the whole 3D room
│   │   │   ├── Person.jsx      One person in the room — your Twin or theirs
│   │   │   ├── Screen.jsx      The shared screen on the wall
│   │   │   └── CameraRig.jsx   Moves the camera slightly with mouse/finger movement
│   │   │
│   │   ├── voice/
│   │   │   ├── livekit.js      Connects to LiveKit for real audio
│   │   │   └── audioState.js   Plays a line of speech (TTS fallback)
│   │   │
│   │   ├── whisper/
│   │   │   ├── WhisperDrawer   The private thought drawer that slides up
│   │   │   └── whisperStore    Connects to the main store
│   │   │
│   │   ├── recording/
│   │   │   ├── RecordButton    The button that says "Save this moment"
│   │   │   └── ClipReview      Watch and download your recorded clip
│   │   │
│   │   └── store/
│   │       └── useAppStore     Central memory of the app (all state lives here)
│   │
│   ├── vite.config.js          Build settings + PWA plugin
│   └── index.html              The HTML shell the app loads into
│
├── server/                     The backend — runs on Node.js
│   ├── index.js                Main server — handles all routes
│   ├── livekitToken.js         Creates secure join tokens for LiveKit rooms
│   ├── whisperQueue.js         Stores whispers and rephrases them with OpenAI
│   └── recording.js            Saves clips (in-memory for now, Supabase later)
│
└── README.md                   This file
```

---

## Common errors and fixes

**`Error: EADDRINUSE :::4000`**
Port 4000 is already in use. Change `PORT=4000` to `PORT=4001` in `server/.env`.

**`npm : command not found`**
Node.js was not installed correctly. Restart PowerShell and try `node --version` again.

**`npm ERR! ERESOLVE`**
Run `npm install --legacy-peer-deps` instead of `npm install`.

**Black screen in the room**
Three.js takes a moment to load. Wait 3–5 seconds. If it stays black, open browser console (F12) and look for errors.

**Camera permission denied**
Your browser needs permission. Click the camera icon in the browser address bar and allow it.

**LiveKit connection failed**
Check that you filled in all three LiveKit values correctly in both `.env` files. The URL must start with `wss://` not `https://`.

**The invite link does not work**
The invite link only works when the server is running. On localhost, both people need to be on the same network. For real use, deploy to Azure first.

---

## What to build next (after MVP works)

These are not in this package. Build them in this order:

1. **Avaturn avatar** — replace the box-head Twin with a real 3D avatar from avaturn.dev
2. **Mixamo animations** — add idle, talk, and react animations to the avatar
3. **OpenAI Realtime voice agent** — connect a voice agent that listens and occasionally speaks naturally
4. **Whisper timing intelligence** — build the room director that decides when to use a whisper
5. **Social export** — add FFmpeg to convert .webm clips to 9:16 vertical video for TikTok/Reels

---

## The MVP success test

The MVP is successful when this happens:

```
You are already inside.
You text Sonja the link.
She taps it.
The app opens like a mobile app.
She creates hers.
She joins you.
You hear each other.
The room is visible.
The bodies move naturally.
The screen is there.
You can privately guide what yours says.
You can save the moment as a clip.
```

That is the build.
