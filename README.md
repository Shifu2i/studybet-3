# Enhanced Spinning Wheel Game

An interactive educational game where users answer questions to earn spins and collect tokens. Features authentication, leaderboards, and AI-powered question evaluation.

## Features

- 🎯 **Educational Gameplay**: Answer questions correctly to unlock wheel spins
- 🎡 **Dynamic Spinning Wheel**: Realistic physics with variable spin force
- 🏆 **Leaderboard System**: Compete with other players for the top spot
- 🔐 **Authentication**: Sign up with email/password or Google OAuth
- 💰 **Token System**: Earn and accumulate tokens, with daily minimum reset
- 🎨 **Beautiful UI**: Modern design with smooth animations
- 📱 **Responsive**: Works perfectly on all devices

## Setup Instructions

### 1. Supabase Setup

Before running the application, you need to set up Supabase:

1. Go to [Supabase](https://supabase.com) and create a new project
2. Click the "Connect to Supabase" button in the top right of this interface
3. Follow the setup instructions to configure your database

### 2. Environment Variables

Create a `.env` file in the root directory and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Database Schema

The following tables will be created automatically when you connect to Supabase:

- `users`: User profiles with token balances
- `spin_results`: History of spins and results
- `questions`: Database of questions by topic

### 4. Authentication Setup

In your Supabase dashboard:

1. Go to Authentication > Settings
2. Enable Google OAuth if desired
3. Configure your site URL and redirect URLs

## How to Play

1. **Sign Up/Sign In**: Create an account or sign in with existing credentials
2. **Choose Topic**: Select your study subject from the search bar
3. **Answer Questions**: Correctly answer questions to unlock spins
4. **Spin the Wheel**: Earn tokens based on where the wheel lands
5. **Climb the Leaderboard**: Compete with other players for the top position

## Token System

- Start with 100 tokens
- Earn tokens by spinning the wheel (10-500 tokens per spin)
- Daily reset ensures minimum 100 tokens if balance is lower
- Tokens determine your position on the leaderboard

## Technical Features

- **React + TypeScript**: Type-safe development
- **Supabase**: Backend-as-a-Service for authentication and database
- **Framer Motion**: Smooth animations and transitions
- **Tailwind CSS**: Utility-first styling
- **Responsive Design**: Mobile-first approach

## Future Enhancements

- Integration with Ollama for AI-powered question evaluation
- More question topics and difficulty levels
- Achievement system and badges
- Social features and friend challenges
- Advanced analytics and progress tracking

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for educational purposes.