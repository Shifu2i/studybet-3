import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Trophy, Coins } from 'lucide-react';
import { SpinningWheel } from '../components/SpinningWheel/SpinningWheel';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';
import { WheelSegment } from '../types';

interface GamePageProps {
  onNavigateToLeaderboard: () => void;
}

const wheelSegments: WheelSegment[] = [
  { id: 1, label: '10', tokens: 10, color: '#FF6B6B', probability: 0.3 },
  { id: 2, label: '25', tokens: 25, color: '#4ECDC4', probability: 0.25 },
  { id: 3, label: '50', tokens: 50, color: '#45B7D1', probability: 0.2 },
  { id: 4, label: '100', tokens: 100, color: '#96CEB4', probability: 0.15 },
  { id: 5, label: '250', tokens: 250, color: '#FFEAA7', probability: 0.08 },
  { id: 6, label: '500', tokens: 500, color: '#DDA0DD', probability: 0.02 },
];

const sampleQuestions = {
  Mathematics: [
    "What is the derivative of x² + 3x + 2?",
    "Solve for x: 2x + 5 = 13",
    "What is the area of a circle with radius 5?",
  ],
  Science: [
    "What is the chemical formula for water?",
    "Explain the process of photosynthesis",
    "What is Newton's first law of motion?",
  ],
  History: [
    "When did World War II end?",
    "Who was the first President of the United States?",
    "What caused the fall of the Roman Empire?",
  ],
  Literature: [
    "Who wrote 'To Kill a Mockingbird'?",
    "What is the main theme of '1984' by George Orwell?",
    "Explain the concept of symbolism in literature",
  ],
  Psychology: [
    "What is classical conditioning?",
    "Explain Maslow's hierarchy of needs",
    "What is cognitive dissonance?",
  ],
  Art: [
    "Who painted the Mona Lisa?",
    "What is the difference between Renaissance and Baroque art?",
    "Explain the principles of color theory",
  ],
};

export const GamePage: React.FC<GamePageProps> = ({ onNavigateToLeaderboard }) => {
  const { signOut } = useAuth();
  const { profile, addTokens } = useUserProfile();
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastSpinResult, setLastSpinResult] = useState<WheelSegment | null>(null);

  const handleSpin = (result: WheelSegment) => {
    setIsSpinning(false);
    setLastSpinResult(result);
    
    // Add tokens to user's balance - ensure proper stacking
    if (profile) {
      addTokens(result.tokens);
    }
  };


  const handleSignOut = async () => {
    await signOut();
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-blue-900 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/20">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-bold text-lg">
                  {profile.balance.toLocaleString()} tokens
                </span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
              <div className="text-white text-sm">
                <div className="opacity-70">Total Won:</div>
                <div className="font-semibold">{profile.total_winnings.toLocaleString()}</div>
              </div>
            </div>
            <div className="text-white">
              <div className="text-sm opacity-70">Welcome back,</div>
              <div className="font-semibold">{profile.username}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNavigateToLeaderboard}
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-all duration-200 flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              Leaderboard
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignOut}
              className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-xl hover:bg-red-500/30 transition-all duration-200 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </motion.button>
          </div>
        </div>

      </div>

      {/* Game Area */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
          {/* Spinning Wheel */}
          <div className="flex-1 flex justify-center">
            <SpinningWheel
              segments={wheelSegments}
              onSpin={handleSpin}
              isSpinning={isSpinning}
              canSpin={true}
            />
          </div>

          {/* Game Info */}
          <div className="flex-1 max-w-md">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-white text-xl font-bold mb-4">How to Play</h3>
              <div className="space-y-3 text-white/80">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <p>Click the spin button to spin the wheel</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <p>Spin the wheel to earn tokens</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <p>Climb the leaderboard and compete with others</p>
                </div>
              </div>

              {lastSpinResult && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl"
                >
                  <div className="text-center">
                    <div className="text-green-300 font-semibold mb-1">You won!</div>
                    <div className="text-white text-2xl font-bold">
                      +{lastSpinResult.tokens} tokens
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};