import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Crown, Users } from 'lucide-react';
import { getLeaderboard } from '../../lib/storage';
import { User } from '../../types';

export const Leaderboard: React.FC = () => {
  const [leaders, setLeaders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const leaderboardData = getLeaderboard(10);
      setLeaders(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Trophy className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <Award className="w-5 h-5 text-blue-400" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-orange-500';
      case 2:
        return 'from-gray-300 to-gray-500';
      case 3:
        return 'from-amber-400 to-amber-600';
      default:
        return 'from-blue-400 to-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-blue-900 flex items-center justify-center">
        <div className="flex items-center gap-2 text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="text-xl">Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-blue-900 p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Users className="w-8 h-8 text-white" />
            <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
          </div>
          <p className="text-white/70 text-lg">Top players by token count</p>
        </motion.div>

        <div className="space-y-4">
          {leaders.map((user, index) => {
            const rank = index + 1;
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 ${
                  rank <= 3 ? 'ring-2 ring-white/30' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r ${getRankColor(rank)}`}>
                      {rank <= 3 ? (
                        getRankIcon(rank)
                      ) : (
                        <span className="text-white font-bold text-lg">#{rank}</span>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-white">{user.username}</h3>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-bold text-white mb-1">
                      {user.balance.toLocaleString()}
                    </div>
                    <div className="text-white/60 text-sm">tokens</div>
                  </div>
                </div>

                {rank <= 3 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-white/80">
                      {rank === 1 && (
                        <>
                          <Crown className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm font-medium">Champion</span>
                        </>
                      )}
                      {rank === 2 && (
                        <>
                          <Trophy className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Runner-up</span>
                        </>
                      )}
                      {rank === 3 && (
                        <>
                          <Medal className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium">Third Place</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {leaders.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No players yet</h3>
            <p className="text-white/60">Be the first to start spinning and earning tokens!</p>
          </div>
        )}
      </div>
    </div>
  );
};