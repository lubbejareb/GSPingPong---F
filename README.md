# 🏓 Ping Pong Pro

A comprehensive ping pong matchmaking, ranking, and live betting platform built with React, TypeScript, and Vite.

## Features

### 🎯 Player Management
- Add and manage players
- Delete players with confirmation
- Real-time player statistics
- Automatic ELO rating system

### ⚔️ Matchmaking System
- Create matches between any two players
- Smart player selection (prevents self-matches)
- Match preview with win probabilities
- Queue system for pending matches

### 📊 ELO Rating System
- Based on chess.com's ELO implementation
- K-factor of 32 for standard rating changes
- Starting ELO of 1200 for new players
- Automatic rating updates after each match

### 🎰 Live Betting
- Real-time betting during active matches
- Simple odds calculation based on ELO difference
- Track all bets with bettor names and amounts
- Automatic bet resolution when matches complete

### 🏆 Leaderboard & Statistics
- Real-time ranking based on ELO ratings
- Visual rank indicators (gold, silver, bronze)
- Recent match history with ELO changes
- Platform-wide statistics

### 🎨 Modern UI/UX
- Responsive design with Tailwind CSS
- Intuitive navigation between sections
- Real-time match timer
- Beautiful gradient designs and animations

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context + useReducer
- **ID Generation**: UUID

## Getting Started

### Prerequisites
- Node.js (v20.19+ or v22.12+)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## How to Use

### 1. Add Players
- Go to the "Players" tab
- Add player names using the input form
- Players automatically start with 1200 ELO rating

### 2. Create Matches
- Navigate to "Matchmaking"
- Select two different players
- View match preview with win probabilities
- Create the match to add it to the queue

### 3. Start a Live Match
- Start a pending match from the Matchmaking section
- The match becomes active and appears in the "Live Match" tab
- Timer starts automatically

### 4. Place Bets
- During an active match, go to "Live Match"
- Enter your name, bet amount, and predicted winner
- View all active bets in real-time

### 5. Complete Matches
- Click the winner's button to complete the match
- ELO ratings are automatically updated
- Bets are resolved (won/lost)
- Match appears in match history

### 6. View Rankings
- Check the "Leaderboard" tab for current rankings
- View recent match history
- See platform statistics

## ELO Rating System

The platform uses the standard ELO rating system with these parameters:

- **Starting Rating**: 1200
- **K-Factor**: 32
- **Formula**: New Rating = Old Rating + K × (Actual Score - Expected Score)
- **Expected Score**: 1 / (1 + 10^((Opponent ELO - Player ELO) / 400))

### Example ELO Calculation:
- Player A (1200 ELO) vs Player B (1300 ELO)
- Player A expected score: ~0.36 (36% chance to win)
- If Player A wins: +23 ELO, Player B: -23 ELO
- If Player B wins: Player A: -9 ELO, Player B: +9 ELO

## Features in Detail

### Player Statistics
Each player tracks:
- Current ELO rating
- Total wins and losses
- Win rate percentage
- Total games played
- Account creation date

### Match System
- **Pending**: Match created but not started
- **In-Progress**: Active match with live betting
- **Completed**: Finished match with results
- **Cancelled**: Cancelled matches (no ELO changes)

### Betting System
- Odds calculated based on ELO difference
- Real-time bet tracking
- Automatic payout calculation
- Bet history preservation

## Development

### Project Structure
```
src/
├── components/          # React components
│   ├── Navigation.tsx   # Main navigation
│   ├── PlayerManagement.tsx
│   ├── Matchmaking.tsx
│   ├── LiveMatch.tsx
│   └── Leaderboard.tsx
├── context/            # React Context for state management
│   └── AppContext.tsx
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   └── eloSystem.ts    # ELO calculation logic
└── App.tsx             # Main application component
```

### Key Design Decisions

1. **State Management**: Used React Context + useReducer for simple, centralized state management
2. **ELO System**: Implemented standard chess ELO with K=32 for appropriate rating volatility
3. **Real-time Updates**: All components react to state changes automatically
4. **Accessibility**: Added ARIA labels and proper form handling
5. **Responsive Design**: Mobile-first approach with Tailwind CSS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for your own ping pong tournaments!

---

**Built with ❤️ for ping pong enthusiasts everywhere!** 🏓