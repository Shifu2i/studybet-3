import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Trophy, Coins } from 'lucide-react';
import { RouletteWheel } from '../components/RouletteWheel/RouletteWheel';
import { BettingBoard } from '../components/BettingBoard/BettingBoard';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';

interface GamePageProps {
  onNavigateToLeaderboard: () => void;
}

export const GamePage: React.FC<GamePageProps> = ({ onNavigateToLeaderboard }) => {
  const { signOut } = useAuth();
  const { profile, updateTokens } = useUserProfile();
  const [isSpinning, setIsSpinning] = useState(false);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [lastSpinResult, setLastSpinResult] = useState<{
    number: string;
    color: string;
    winnings: number;
    totalBet: number;
  } | null>(null);
  const [showResult, setShowResult] = useState(false);

  const totalBetAmount = Object.values(bets).reduce((sum, bet) => sum + bet, 0);

  const handlePlaceBet = (number: string, amount: number) => {
    if (!profile || isSpinning) return;

    setBets(prev => {
      const currentBet = prev[number] || 0;
      const newBet = Math.max(0, currentBet + amount);
      
      // Check if player has enough balance for the bet
      const currentTotal = Object.values(prev).reduce((sum, bet) => sum + bet, 0);
      const newTotal = currentTotal - currentBet + newBet;
      
      if (newTotal > profile.balance) {
        return prev; // Don't allow bet if insufficient balance
      }

      return {
        ...prev,
        [number]: newBet,
      };
    });
  };

  const handleClearBets = () => {
    if (!isSpinning) {
      setBets({});
    }
  };

  const handleSpinComplete = (result: { number: string; color: string; payout: number }) => {
    if (!profile) return;

    const winningBet = bets[result.number] || 0;
    const winnings = winningBet * (result.payout + 1); // 35:1 payout means you get 36x your bet
    const netResult = winnings - totalBetAmount;

    // Update player balance
    const newBalance = profile.balance + netResult;
    updateTokens(newBalance);

    setLastSpinResult({
      number: result.number,
      color: result.color,
      winnings,
      totalBet: totalBetAmount,
    });

    setShowResult(true);
    setBets({}); // Clear all bets after spin

    // Hide result after 5 seconds
    setTimeout(() => {
      setShowResult(false);
      setLastSpinResult(null);
    }, 5000);
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

  const canSpin = totalBetAmount > 0 && totalBetAmount <= profile.balance && !isSpinning;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-blue-900 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
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
                <div className="opacity-70">Games:</div>
                <div className="font-semibold">{profile.games_played}</div>
              </div>
            </div>
            <div className="text-white">
              <div className="text-sm opacity-70">Welcome,</div>
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
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Roulette Wheel */}
          <div className="flex flex-col items-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-6">
              <RouletteWheel
                onSpinComplete={handleSpinComplete}
                isSpinning={isSpinning}
                setIsSpinning={setIsSpinning}
              />
              
              {!canSpin && totalBetAmount === 0 && (
                <div className="mt-4 text-center text-white/70">
                  Place your bets to spin the wheel
                </div>
              )}
              
              {!canSpin && totalBetAmount > profile.balance && (
                <div className="mt-4 text-center text-red-300">
                  Insufficient balance for current bets
                </div>
              )}
            </div>

            {/* Result Display */}
            {showResult && lastSpinResult && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 w-full max-w-md"
              >
                <div className="text-center">
                  <div className="text-white text-lg font-bold mb-2">
                    Landed on: {lastSpinResult.number} ({lastSpinResult.color})
                  </div>
                  <div className="space-y-2">
                    <div className="text-white/80">
                      Your bet on {lastSpinResult.number}: {bets[lastSpinResult.number] || 0} tokens
                    </div>
                    <div className="text-white/80">
                      Total bet: {lastSpinResult.totalBet} tokens
                    </div>
                    <div className={`text-xl font-bold ${
                      lastSpinResult.winnings > 0 ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {lastSpinResult.winnings > 0 
                        ? `Won: ${lastSpinResult.winnings} tokens!`
                        : 'No win this time'
                      }
                    </div>
                    <div className={`text-lg ${
                      lastSpinResult.winnings - lastSpinResult.totalBet > 0 
                        ? 'text-green-300' 
                        : 'text-red-300'
                    }`}>
                      Net: {lastSpinResult.winnings - lastSpinResult.totalBet > 0 ? '+' : ''}
                      {lastSpinResult.winnings - lastSpinResult.totalBet} tokens
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Betting Board */}
          <div>
            <BettingBoard
              bets={bets}
              onPlaceBet={handlePlaceBet}
              onClearBets={handleClearBets}
              playerBalance={profile.balance}
              isSpinning={isSpinning}
            />

            {/* Game Instructions */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mt-6">
              <h3 className="text-white text-lg font-bold mb-4">American Roulette</h3>
              <div className="space-y-2 text-white/80 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <p>Place bets on any number (0, 00, 1-36)</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <p>Spin the wheel when ready</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <p>Win 35:1 payout if your number hits!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};