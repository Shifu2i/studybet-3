import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Minus, Plus } from 'lucide-react';

interface BettingBoardProps {
  bets: Record<string, number>;
  onPlaceBet: (number: string, amount: number) => void;
  onClearBets: () => void;
  playerBalance: number;
  isSpinning: boolean;
}

const betAmounts = [1, 5, 10, 25, 50];

// Traditional roulette numbers with colors
const getNumberColor = (num: string) => {
  if (num === '0' || num === '00') return 'green';
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return redNumbers.includes(parseInt(num)) ? 'red' : 'black';
};

const getColorClass = (color: string) => {
  switch (color) {
    case 'red': return 'bg-red-600 text-white';
    case 'black': return 'bg-gray-900 text-white';
    case 'green': return 'bg-green-600 text-white';
    default: return 'bg-gray-600 text-white';
  }
};

export const BettingBoard: React.FC<BettingBoardProps> = ({
  bets,
  onPlaceBet,
  onClearBets,
  playerBalance,
  isSpinning,
}) => {
  const totalBetAmount = Object.values(bets).reduce((sum, bet) => sum + bet, 0);
  
  // Create array of all roulette numbers
  const rouletteNumbers = ['0', '00', ...Array.from({ length: 36 }, (_, i) => (i + 1).toString())];

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white text-xl font-bold">Place Your Bets</h3>
        <div className="flex items-center gap-4">
          <div className="text-white text-sm">
            <span className="opacity-70">Total Bet: </span>
            <span className="font-bold">{totalBetAmount}</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClearBets}
            disabled={isSpinning || totalBetAmount === 0}
            className="bg-red-500/20 border border-red-500/50 text-red-200 px-3 py-1 rounded-lg hover:bg-red-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Clear All
          </motion.button>
        </div>
      </div>

      {/* Betting Grid */}
      <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 mb-6 max-h-96 overflow-y-auto">
        {rouletteNumbers.map((number) => {
          const currentBet = bets[number] || 0;
          const canBet = playerBalance >= 1 && !isSpinning;
          const color = getNumberColor(number);
          const colorClass = getColorClass(color);

          return (
            <div
              key={number}
              className="bg-white/5 rounded-lg p-3 border border-white/10"
            >
              <div className="text-center mb-2">
                <div
                  className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-sm font-bold ${colorClass}`}
                >
                  {number}
                </div>
                <div className="text-white/60 text-xs">{color}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-1">
                  <motion.button
                    whileHover={{ scale: canBet ? 1.1 : 1 }}
                    whileTap={{ scale: canBet ? 0.9 : 1 }}
                    onClick={() => currentBet > 0 && onPlaceBet(number, -1)}
                    disabled={!canBet || currentBet === 0}
                    className="w-5 h-5 bg-red-500/20 border border-red-500/50 text-red-200 rounded-full flex items-center justify-center hover:bg-red-500/30 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                  >
                    <Minus className="w-2 h-2" />
                  </motion.button>

                  <div className="bg-white/10 px-2 py-1 rounded text-center min-w-8">
                    <span className="text-white font-bold text-xs">{currentBet}</span>
                  </div>

                  <motion.button
                    whileHover={{ scale: canBet ? 1.1 : 1 }}
                    whileTap={{ scale: canBet ? 0.9 : 1 }}
                    onClick={() => onPlaceBet(number, 1)}
                    disabled={!canBet}
                    className="w-5 h-5 bg-green-500/20 border border-green-500/50 text-green-200 rounded-full flex items-center justify-center hover:bg-green-500/30 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                  >
                    <Plus className="w-2 h-2" />
                  </motion.button>
                </div>

                {/* Quick bet buttons */}
                <div className="flex flex-wrap gap-1 justify-center">
                  {betAmounts.slice(0, 2).map((amount) => (
                    <motion.button
                      key={amount}
                      whileHover={{ scale: canBet && playerBalance >= amount ? 1.05 : 1 }}
                      whileTap={{ scale: canBet && playerBalance >= amount ? 0.95 : 1 }}
                      onClick={() => onPlaceBet(number, amount)}
                      disabled={!canBet || playerBalance < amount}
                      className="bg-blue-500/20 border border-blue-500/50 text-blue-200 px-1 py-0.5 rounded text-xs hover:bg-blue-500/30 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      +{amount}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Betting Summary */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-sm">Balance:</span>
            <span className="font-bold">{playerBalance}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Total Bet:</span>
            <span className="font-bold text-red-300">{totalBetAmount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">After Bet:</span>
            <span className="font-bold text-green-300">{playerBalance - totalBetAmount}</span>
          </div>
        </div>
      </div>

      {/* Color Legend */}
      <div className="mt-4 flex justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 rounded-full"></div>
          <span className="text-white/70">Red (35:1)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-900 rounded-full"></div>
          <span className="text-white/70">Black (35:1)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 rounded-full"></div>
          <span className="text-white/70">Green (35:1)</span>
        </div>
      </div>
    </div>
  );
};