# 🎱 Snooker Tournament Platform

A modern, responsive web application for managing snooker tournaments, tracking scores, rankings, and season standings.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG-2.1%20AA-blue.svg)](https://www.w3.org/WAI/WCAG21/quickref/)

## ✨ Features

### Tournament Management
- **Multi-format tournaments**: Pool play and knockout rounds
- **Flexible configuration**: Customizable frames per match, pool sizes, and knockout bracket sizes
- **Best-of-N scoring**: Configurable frames (5, 7, 9, etc.) with automatic winner determination
- **Shootout tiebreakers**: Time-limited tiebreaker rounds when needed

### Live Scoring
- **Real-time frame-by-frame scoring**: Track points as matches progress
- **Century and high break tracking**: Automatic recording of significant breaks
- **Ball-by-ball breakdown**: Detailed scoring with red/color sequences

### Pool & Knockout Stages
- **Automatic pool generation**: Even distribution of players across pools
- **Dynamic standings calculation**: Points, frames won/lost, frame difference, head-to-head
- **Knockout bracket visualization**: Interactive bracket view with progression tracking
- **Loser's bracket support**: Double elimination tournament options

### Season & Rankings
- **Season standings**: Cumulative points across multiple tournaments
- **Break statistics**: Season-high breaks, century counts, average breaks
- **Masters Finale qualification**: Top 8 players qualify for end-of-season Masters

### Data Management
- **Local storage persistence**: Data saved automatically in browser
- **Export/Import**: Full tournament and season data as JSON files
- **Azure Blob Storage**: Optional cloud persistence for multi-device access

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ or **pnpm** 8+
- Modern browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/LennartMart/Snooker-Toernooi.git
cd snooker_tournament

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
snooker_tournament/
├── src/
│   ├── js/
│   │   ├── main.js              # Application entry point
│   │   ├── models/              # Data models (Player, Match, Frame, etc.)
│   │   ├── services/            # Business logic services
│   │   ├── storage/             # Storage adapters (LocalStorage, Azure)
│   │   ├── store/               # State management
│   │   ├── ui/
│   │   │   ├── Component.js     # Base rendering utilities
│   │   │   ├── LoadingStates.js # Loading/error/empty state components
│   │   │   ├── router.js        # SPA routing
│   │   │   ├── components/      # Reusable UI components
│   │   │   └── pages/           # Page components
│   │   └── utils/               # Utility functions
│   └── styles/
│       ├── main.css             # Main stylesheet (imports all)
│       ├── variables.css        # CSS custom properties
│       ├── responsive.css       # Responsive breakpoints
│       ├── accessibility.css    # WCAG 2.1 AA compliance
│       ├── loading-states.css   # Loading/error UI styles
│       └── components/          # Component-specific styles
├── tests/
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── fixtures/                # Test data fixtures
├── specs/                       # Feature specifications
│   └── 001-tournament-platform/
│       ├── spec.md              # Feature specification
│       ├── plan.md              # Technical implementation plan
│       ├── tasks.md             # Task breakdown
│       ├── data-model.md        # Entity definitions
│       └── contracts/           # JSON schemas
├── index.html                   # Application shell
├── vite.config.js               # Vite configuration
├── eslint.config.js             # ESLint configuration
└── package.json
```

## 🎮 Usage Guide

### Creating a Tournament

1. Navigate to **Create Tournament** from the home page
2. Configure tournament settings:
   - Tournament name and date
   - Number of pools and pool size
   - Frames per match (5, 7, 9, etc.)
   - Knockout bracket configuration
3. Select participating players
4. Review and create tournament

### Entering Match Scores

1. Navigate to the tournament's pool or knockout view
2. Click on a match to open the score entry
3. Enter frame scores (Best-of-N format)
4. Record breaks during play
5. Match completes automatically when a player wins enough frames

### Viewing Standings

- **Pool Standings**: View current standings per pool with points, frame difference
- **Knockout Brackets**: Visual bracket showing progression
- **Season Standings**: Overall season rankings across all tournaments

### Data Export/Import

1. Go to **Settings** → **Data Management**
2. **Export**: Download all data as JSON file
3. **Import**: Upload a JSON file to restore data

## ⚙️ Configuration

### Environment Variables

Create a `.env` file for optional Azure Storage:

```env
VITE_AZURE_STORAGE_URL=https://your-account.blob.core.windows.net
VITE_AZURE_CONTAINER_NAME=tournaments
VITE_AZURE_SAS_TOKEN=your-sas-token
```

### Tournament Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `framesPerMatch` | Frames needed to win (best-of-N = N*2-1) | 3 |
| `poolSize` | Players per pool | 4 |
| `numberOfPools` | Total pools in tournament | Auto |
| `knockoutSize` | Players advancing to knockout | 8 |
| `hasLosersBracket` | Enable double elimination | false |

## 🧪 Testing

```bash
# Run tests in watch mode
npm test

# Run tests once with coverage
npm run test:coverage

# Run specific test file
npm test -- src/js/services/MatchService.test.js
```

## 🎨 Styling & Theming

The application uses CSS custom properties for theming. Key variables are defined in `src/styles/variables.css`:

```css
:root {
  --color-primary: #1a5f1a;        /* Snooker table green */
  --color-secondary: #8b4513;       /* Wood brown */
  --color-accent: #ffd700;          /* Gold */
  --font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto...;
}
```

### Responsive Breakpoints

- **Extra Small**: 320px - 479px (Mobile portrait)
- **Small**: 480px - 767px (Mobile landscape)
- **Medium**: 768px - 1023px (Tablet)
- **Large**: 1024px - 1279px (Desktop)
- **Extra Large**: 1280px - 1535px (Large desktop)
- **Ultra Wide**: 2560px+ (4K displays)

## ♿ Accessibility

The application follows WCAG 2.1 AA guidelines:

- **Keyboard navigation**: Full keyboard support with visible focus indicators
- **Screen reader support**: ARIA labels, live regions, semantic HTML
- **Color contrast**: Minimum 4.5:1 ratio for text
- **Reduced motion**: Respects `prefers-reduced-motion` preference
- **High contrast**: Supports Windows High Contrast mode

## 🔧 Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build |
| `npm test` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Lint source files |
| `npm run format` | Format source files |

### Code Style

- **ES2022+**: Modern JavaScript features
- **No frameworks**: Vanilla JavaScript only
- **Component pattern**: Function-based components with createElement helpers
- **ESLint**: Consistent code style enforcement
- **Prettier**: Automatic code formatting

### Adding a New Feature

1. Create service in `src/js/services/`
2. Add UI component in `src/js/ui/components/`
3. Create page in `src/js/ui/pages/`
4. Add route in `src/js/main.js`
5. Add styles in `src/styles/components/`
6. Write tests in `tests/unit/`

## 📋 API Reference

### Services

| Service | Description |
|---------|-------------|
| `PlayerService` | Player CRUD operations |
| `TournamentService` | Tournament management |
| `MatchService` | Match score entry and status |
| `FrameService` | Frame-level scoring |
| `BreakService` | Break recording |
| `PoolGeneratorService` | Pool creation algorithms |
| `PoolStandingsService` | Pool standings calculation |
| `BracketGeneratorService` | Knockout bracket creation |
| `BracketProgressionService` | Bracket advancement |
| `RankingService` | Tournament rankings |
| `SeasonService` | Season management |
| `SeasonStandingsService` | Season standings |
| `ExportService` | Data export |
| `ImportService` | Data import |

### Models

| Model | Description |
|-------|-------------|
| `Player` | Player entity with name, ID |
| `Tournament` | Tournament configuration and state |
| `Match` | Match between two players |
| `Frame` | Single frame within a match |
| `Break` | Break (consecutive scoring sequence) |
| `Pool` | Pool of players for round-robin |
| `KnockoutRound` | Knockout bracket round |
| `Season` | Season containing tournaments |
| `Ranking` | Player ranking with points |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- All tests pass
- Code follows existing style
- New features include tests
- Documentation is updated

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Snooker ball colors and scoring rules based on official World Snooker Tour regulations
- Design inspired by professional tournament management systems
- Built with ❤️ for the snooker community

---

**Happy Potting! 🎱**
