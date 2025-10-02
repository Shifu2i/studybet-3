import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Minus, Plus } from 'lucide-react';
import { WheelSegment } from '../../types';

interface BettingBoardProps {
  segments: WheelSegment[];
  bets: Record<number, number>;
  onPlaceBet: (segmentId: number, amount: number) => void;
  onClearBets: () => void;
  playerBalance: number;
  isSpinning: boolean;
}

const betAmounts = [1, 5, 10, 25, 50, 100];

export const BettingBoard: React.FC<BettingBoardProps> = ({
  segments,
  bets,
  onPlaceBet,
  onClearBets,
  playerBalance,
  isSpinning,
}) => {
  const totalBetAmount = Object.values(bets).reduce((sum, bet) => sum + bet, 0);

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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {segments.map((segment) => {
          const currentBet = bets[segment.id] || 0;
          const canBet = playerBalance >= 1 && !isSpinning;

          return (
            <div
              key={segment.id}
              className="bg-white/5 rounded-xl p-4 border border-white/10"
            >
              <div className="text-center mb-3">
                <div
                  className="w-8 h-8 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: segment.color }}
                ></div>
                <div className="text-white font-bold text-lg">{segment.tokens}</div>
                <div className="text-white/60 text-xs">tokens</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <motion.button
                    whileHover={{ scale: canBet ? 1.1 : 1 }}
                    whileTap={{ scale: canBet ? 0.9 : 1 }}
                    onClick={() => currentBet > 0 && onPlaceBet(segment.id, -1)}
                    disabled={!canBet || currentBet === 0}
                    className="w-6 h-6 bg-red-500/20 border border-red-500/50 text-red-200 rounded-full flex items-center justify-center hover:bg-red-500/30 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-3 h-3" />
                  </motion.button>

                  <div className="bg-white/10 px-3 py-1 rounded-lg min-w-12 text-center">
                    <span className="text-white font-bold">{currentBet}</span>
                  </div>

                  <motion.button
                    whileHover={{ scale: canBet ? 1.1 : 1 }}
                    whileTap={{ scale: canBet ? 0.9 : 1 }}
                    onClick={() => onPlaceBet(segment.id, 1)}
                    disabled={!canBet}
                    className="w-6 h-6 bg-green-500/20 border border-green-500/50 text-green-200 rounded-full flex items-center justify-center hover:bg-green-500/30 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3" />
                  </motion.button>
                </div>

                {/* Quick bet buttons */}
                <div className="flex flex-wrap gap-1 justify-center">
                  {betAmounts.slice(0, 3).map((amount) => (
                    <motion.button
                      key={amount}
                      whileHover={{ scale: canBet && playerBalance >= amount ? 1.05 : 1 }}
                      whileTap={{ scale: canBet && playerBalance >= amount ? 0.95 : 1 }}
                      onClick={() => onPlaceBet(segment.id, amount)}
                      disabled={!canBet || playerBalance < amount}
                      className="bg-blue-500/20 border border-blue-500/50 text-blue-200 px-2 py-1 rounded text-xs hover:bg-blue-500/30 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
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
    </div>
  );
};