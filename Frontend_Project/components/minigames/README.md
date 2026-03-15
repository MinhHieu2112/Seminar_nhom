# Mini Games Module

A complete mini game system for the coding platform with three interactive games: Debug Challenge, Output Prediction Quiz, and Code Ordering Puzzle.

## Games

### 1. Debug Challenge
Find and click on the line number where bugs are located in code snippets.

**Features:**
- Click on line numbers to identify bugs
- Visual feedback for correct/incorrect answers
- Point penalties for wrong attempts
- Multiple bug scenarios

### 2. Output Prediction Quiz
Read code snippets and predict what the output will be.

**Features:**
- Multiple choice questions
- Code syntax highlighting
- Explanations for correct answers
- Partial credit for incorrect answers

### 3. Code Ordering Puzzle
Arrange code blocks in the correct execution order.

**Features:**
- Drag-free ordering with up/down buttons
- Visual feedback for correct positions
- Multiple puzzle scenarios
- Partial credit system

## Components

### GameBase
Base component that provides common game functionality:
- Timer with countdown
- Score tracking
- Progress indicator
- Game state management (playing, finished)
- Instructions display

### MinigameModule
Main wrapper component that:
- Integrates all three games
- Fetches rewards from `/api/minigames/{gameType}/rewards`
- Shows reward popup modals
- Handles game completion

## Usage

### Basic Usage

```tsx
import { MinigameModule } from '@/components/minigames'
import type { MinigameType } from '@/components/minigames'

function GamePage() {
  return (
    <MinigameModule 
      gameType="debug" 
      onExit={() => router.push('/mini-games')}
    />
  )
}
```

### Game Types
- `'debug'` - Debug Challenge
- `'output'` - Output Prediction Quiz
- `'ordering'` - Code Ordering Puzzle

### Routes

The games are accessible via:
- `/mini-games/debug` - Debug Challenge
- `/mini-games/output` - Output Prediction Quiz
- `/mini-games/ordering` - Code Ordering Puzzle

## API Integration

### Rewards Endpoint

Rewards are fetched from:
```
GET /api/minigames/{minigameId}/rewards?score={score}&timeSpent={timeSpent}
```

**Response:**
```json
{
  "data": {
    "xp": 50,
    "coins": 10
  }
}
```

The module automatically:
1. Fetches rewards when game completes
2. Shows reward popup modal
3. Integrates with the gamification system

### Fallback Rewards

If the API fails, the module uses fallback calculations:
- XP: `Math.floor(score / 10)`
- Coins: `Math.floor(score / 20)`

## Game Data Structure

### Debug Challenge
```typescript
interface Bug {
  id: string
  code: string
  description: string
  lineNumber: number
  correctFix: string
  points: number
}
```

### Output Prediction Quiz
```typescript
interface QuizQuestion {
  id: string
  code: string
  language: string
  options: string[]
  correctAnswer: string
  explanation?: string
  points: number
}
```

### Code Ordering Puzzle
```typescript
interface Puzzle {
  id: string
  title: string
  description: string
  blocks: CodeBlock[]
  points: number
}

interface CodeBlock {
  id: string
  code: string
  lineNumber: number // Correct position
}
```

## Features

### Timer
- Configurable time limit per game
- Visual countdown with progress bar
- Automatic game end when time runs out
- Warning animation when time is low (< 10 seconds)

### Score System
- Points awarded for correct answers
- Penalties for wrong answers (Debug Challenge)
- Partial credit for incorrect answers (Quiz & Puzzle)
- Real-time score updates

### Progress Tracking
- Current question/puzzle number
- Total questions/puzzles
- Progress bar visualization

### Reward Integration
- Automatic reward calculation based on score and time
- XP and coins rewards
- Reward popup modal integration
- Source attribution for rewards

## Customization

### Time Limits
Each game has configurable time limits:
- Debug Challenge: 300 seconds (5 minutes)
- Output Prediction Quiz: 180 seconds (3 minutes)
- Code Ordering Puzzle: 240 seconds (4 minutes)

### Point Values
Points are configurable per question/puzzle:
- Debug Challenge: 20-25 points per bug
- Output Prediction Quiz: 10-15 points per question
- Code Ordering Puzzle: 25-30 points per puzzle

## Integration with Gamification

The mini games automatically integrate with the gamification system:
- Rewards are shown via `RewardPopupModal`
- XP and coins are tracked
- Rewards are fetched from the API
- User stats are updated via React Query invalidation

## Example Implementation

See `/app/(platform)/mini-games/[gameType]/page.tsx` for a complete implementation example.
