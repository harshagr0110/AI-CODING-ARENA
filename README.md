# Multiplayer AI Coding Arena 🏆

A production-ready, real-time coding competition platform. Compete with friends or strangers in live AI-generated coding challenges, with instant feedback and a simple, human-friendly interface.

---

## 🚀 Features 

- **Real-time Multiplayer Rooms**: Join, create, or enter rooms for live coding battles
- **AI-Generated Problems**: Every game features a unique, automatically generated coding challenge (Google Gemini)
- **Instant Feedback**: Submissions are evaluated by AI for correctness, efficiency, and style
- **Game Timer**: Each game has a countdown; the first correct solution wins, or the game ends when time runs out
- **Simple Points System**: Winner gets +5, all others get -5
- **Minimalist UI**: No unnecessary badges, win rates, or AI points—just code, compete, and win
- **Private & Public Rooms**: Compete with friends or open your room to the world
- **Mobile Friendly**: Works great on all devices
- **Production Deployed**: Runs on Vercel (Next.js) and a dedicated Socket.IO server
- **About Page**: See `/about` for a project overview

---

## 🏗️ Tech Stack & Architecture

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Real-time**: Socket.IO (standalone server)
- **AI**: Google Gemini 2.0 Flash
- **Authentication**: Clerk
- **Styling**: Tailwind CSS, shadcn/ui
- **Code Editor**: Monaco Editor

---

## 🏆 How It Works

1. **Create or Join a Room**: Use a join code or browse your rooms
2. **Start a Game**: Host selects difficulty and duration
3. **AI Generates a Problem**: Gemini creates a unique challenge
4. **Coding Phase**: All players code in real time
5. **Submit Solution**: First correct submission ends the game, or the timer runs out
6. **Scoring**: Winner gets +5 points, all others get -5
7. **Results**: See your global rank instantly on the leaderboard page

---

## 🎮 Game Rules & Points

- **Winner**: First player to submit a correct solution
- **Points**: Winner +5, all others -5
- **Leaderboard**: Sorted by total points across all games
- **No AI bonus points or win rate**: Simple, fair scoring
- **Game ends automatically when time runs out**

---

## 📦 Project Structure

```
multiplayer-ai-coding-arena/
├── app/                  # Next.js App Router
│   ├── api/              # API Routes
│   ├── dashboard/        # User dashboard
│   ├── leaderboard/      # Global leaderboard
│   ├── rooms/            # Room management
│   ├── about/            # About page
│   └── sign-in/          # Auth pages
├── components/           # UI components
├── lib/                  # Utility libraries
├── hooks/                # Custom React hooks
├── prisma/               # Database schema
├── socket-server.js      # Socket.IO server
└── scripts/              # Setup scripts
```

---

## 🌐 Deployment & Setup

This project is fully deployed and production-ready. To run locally:

### Prerequisites
- Node.js 18+
- PostgreSQL
- Google Gemini API key
- Clerk authentication keys

### Environment Variables
```
DATABASE_URL=postgresql://...
GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-key
CLERK_SECRET_KEY=your-clerk-secret
```

### Installation
```bash
git clone <repository-url>
cd multiplayer-ai-coding-arena
npm install --legacy-peer-deps
npx prisma generate
npx prisma db push
npm run dev          # Next.js app (port 3000)
node socket-server.js # Socket.IO server (port 3003)
```

---

## 👤 User Guide

- **Sign Up / Log In**: Secure authentication with Clerk
- **Create Room**: Set max players, privacy, and get a join code
- **Join Room**: Enter a join code or browse your rooms
- **Start Game**: Host selects difficulty and duration
- **Solve Challenge**: Use the code editor, submit when ready
- **See Results**: Winner and points are shown instantly
- **Track Progress**: Check your global rank on the leaderboard
- **About**: See `/about` for a project overview

---

## 🛠️ Admin Guide

- **Room Management**: Delete or manage your created rooms
- **Game Management**: Games end automatically on correct solution or timer
- **Database**: All data is managed via Prisma and PostgreSQL

---

## ✨ Unique Features

- **AI-Generated Problems**: No two games are the same
- **Simple, Human UI**: No unnecessary badges, win rates, or AI points
- **Instant Results**: Game ends as soon as a correct solution is submitted or timer ends
- **Minimalist Leaderboard**: Only total points, games played, and games won
- **Mobile Friendly**: Works great on all devices
- **About Page**: `/about` for a full project summary


## ❓ FAQ & Troubleshooting

**Q: The leaderboard or results are slow to load.**
A: The app now only fetches the top 10-20 records for speed. If you have a huge database, consider adding pagination.

**Q: How do I reset all points?**
A: Use Prisma Studio or a SQL command: `UPDATE "users" SET "total_score" = 0;`

**Q: Can I add more languages?**
A: Yes! Update the code editor and AI prompt to support more languages.

**Q: How do I deploy?**
A: This project is already deployed, but you can use Vercel for the Next.js app and any Node server for Socket.IO.


## 🙏 Credits

- Google Gemini for AI challenge generation
- Clerk for authentication
- Prisma & PostgreSQL for database
- Socket.IO for real-time features
- shadcn/ui & Tailwind for UI
