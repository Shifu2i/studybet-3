import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Trophy, Coins, Settings, Brain, Target } from 'lucide-react';
import { RouletteWheel } from '../components/RouletteWheel/RouletteWheel';
import { BettingBoard } from '../components/BettingBoard/BettingBoard';
import { QuestionModal } from '../components/Game/QuestionModal';
import { CourseSelector } from '../components/Game/CourseSelector';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { supabase, Prompt } from '../lib/supabase';

interface GamePageProps {
  onNavigateToLeaderboard: () => void;
  onNavigateToSettings: () => void;
}

export const GamePage: React.FC<GamePageProps> = ({ 
  onNavigateToLeaderboard, 
  onNavigateToSettings 
}) => {
  const { profile, signOut, updateTokens } = useSupabaseAuth();
  const [isSpinning, setIsSpinning] = useState(false);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [pendingQuestionResult, setPendingQuestionResult] = useState<{
    isCorrect: boolean;
    answerId: string;
  } | null>(null);
  const [lastSpinResult, setLastSpinResult] = useState<{
    number: string;
    color: string;
    winnings: number;
    totalBet: number;
    questionCorrect?: boolean;
    actualPayout: number;
  } | null>(null);
  const [showResult, setShowResult] = useState(false);

  const totalBetAmount = Object.values(bets).reduce((sum, bet) => sum + bet, 0);

  const handlePlaceBet = (number: string, amount: number) => {
    if (!profile || isSpinning) return;

    setBets(prev => {
      const currentBet = prev[number] || 0;
      const newBet = Math.max(0, currentBet + amount);
      
      const currentTotal = Object.values(prev).reduce((sum, bet) => sum + bet, 0);
      const newTotal = currentTotal - currentBet + newBet;
      
      if (newTotal > profile.current_tokens) {
        return prev;
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

  const handleSpinRequest = () => {
    if (!profile || totalBetAmount === 0 || totalBetAmount > profile.current_tokens) return;

    if (currentPrompt) {
      setShowQuestionModal(true);
    } else {
      setIsSpinning(true);
    }
  };

  const handleQuestionAnswer = async (answer: string, timeTaken: number) => {
    if (!currentPrompt || !profile) return;

    setQuestionLoading(true);
    
    try {
      // Simulate AI evaluation (replace with actual Ollama integration)
      const isCorrect = await evaluateAnswer(currentPrompt, answer);
      
      // Record the answer
      const { data: answerData, error: answerError } = await supabase
        .from('spin_answers')
        .insert({
          prompt_id: currentPrompt.id,
          user_id: profile.id,
          user_answer: answer,
          is_correct: isCorrect,
          score: isCorrect ? 1.0 : 0.0,
          time_taken: timeTaken,
          attempt_number: 1,
          evaluation: { ai_response: 'Simulated evaluation', confidence: 0.9 }
        })
        .select()
        .single();

      if (answerError) throw answerError;

      setPendingQuestionResult({
        isCorrect,
        answerId: answerData.id
      });

      setShowQuestionModal(false);
      setIsSpinning(true);

    } catch (error) {
      console.error('Error evaluating answer:', error);
      setShowQuestionModal(false);
    } finally {
      setQuestionLoading(false);
    }
  };

  const evaluateAnswer = async (prompt: Prompt, answer: string): Promise<boolean> => {
    // Simulate AI evaluation - replace with actual Ollama integration
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simple keyword matching for demo (replace with AI)
    const correctAnswers: Record<string, string[]> = {
      'What is 15 × 8?': ['120'],
      'What is the chemical symbol for gold?': ['au', 'gold'],
      'In what year did World War II end?': ['1945'],
      'Solve for x: 2x + 5 = 17': ['6', 'x = 6', 'x=6'],
      'What is the area of a circle with radius 5?': ['78.5', '25π', '25*π', '25 * π'],
      'What is the speed of light in a vacuum?': ['299792458', '3*10^8', '300000000'],
      'How many electrons does a carbon atom have?': ['6']
    };

    const possibleAnswers = correctAnswers[prompt.prompt_text] || [];
    const normalizedAnswer = answer.toLowerCase().trim();
    
    return possibleAnswers.some(correct => 
      normalizedAnswer.includes(correct.toLowerCase())
    );
  };

  const handleSpinComplete = async (result: { number: string; color: string; payout: number }) => {
    if (!profile) return;

    const winningBet = bets[result.number] || 0;
    const baseWinnings = winningBet * (result.payout + 1);

    let questionCorrect: boolean | undefined = undefined;
    let answerId: string | undefined = undefined;

    if (pendingQuestionResult) {
      questionCorrect = pendingQuestionResult.isCorrect;
      answerId = pendingQuestionResult.answerId;
      setPendingQuestionResult(null);
    }

    let actualPayout = 0;
    if (questionCorrect === true) {
      actualPayout = baseWinnings;
    } else if (questionCorrect === false) {
      actualPayout = Math.floor(baseWinnings * 0.3);
    } else {
      actualPayout = Math.floor(baseWinnings * 0.5);
    }

    const netResult = actualPayout - totalBetAmount;

    try {
      const { error: spinError } = await supabase
        .from('spins')
        .insert({
          user_id: profile.id,
          bet_data: bets,
          spin_force: Math.random() * 10 + 5,
          spin_duration: 3000,
          result_number: result.number,
          result_color: result.color,
          total_bet: totalBetAmount,
          total_payout: actualPayout,
          net_result: netResult,
          prompt_id: currentPrompt?.id,
          answer_id: answerId,
          wheel_type: 'american'
        });

      if (spinError) throw spinError;

      const newBalance = profile.current_tokens + netResult;
      await updateTokens(newBalance, netResult > 0 ? 'payout' : 'bet', `Spin result: ${result.number}`);

      setLastSpinResult({
        number: result.number,
        color: result.color,
        winnings: baseWinnings,
        totalBet: totalBetAmount,
        questionCorrect,
        actualPayout
      });

      setShowResult(true);
      setBets({});
      setCurrentPrompt(null);

      setTimeout(() => {
        setShowResult(false);
        setLastSpinResult(null);
      }, 5000);

    } catch (error) {
      console.error('Error recording spin:', error);
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

  const canSpin = totalBetAmount > 0 && totalBetAmount <= profile.current_tokens && !isSpinning;

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
                  {profile.current_tokens.toLocaleString()} tokens
                </span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
              <div className="text-white text-sm">
                <div className="opacity-70">Spins:</div>
                <div className="font-semibold">{profile.total_spins}</div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
              <div className="text-white text-sm">
                <div className="opacity-70">AI Score:</div>
                <div className="font-semibold">{(profile.ai_correctness_score * 100).toFixed(1)}%</div>
              </div>
            </div>
            <div className="text-white">
              <div className="text-sm opacity-70">Welcome,</div>
              <div className="font-semibold">{profile.display_name || profile.username}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNavigateToSettings}
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-all duration-200 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </motion.button>
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
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Course Selection */}
          <div className="xl:col-span-1">
            <CourseSelector
              selectedCourse={selectedCourse}
              onCourseSelect={setSelectedCourse}
              onPromptSelect={(prompt) => {
                setCurrentPrompt(prompt);
                setSelectedCourse(prompt.course);
              }}
            />
            
            {currentPrompt && (
              <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-5 h-5 text-cyan-400" />
                  <span className="text-white font-semibold">Selected Question</span>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-white/90 text-sm leading-relaxed">
                    {currentPrompt.prompt_text.length > 120
                      ? `${currentPrompt.prompt_text.substring(0, 120)}...`
                      : currentPrompt.prompt_text
                    }
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-cyan-300 text-xs font-medium">
                      {currentPrompt.course}
                    </span>
                    <span className="text-white/60 text-xs">
                      Level {currentPrompt.difficulty}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentPrompt(null)}
                  className="mt-2 text-red-300 hover:text-red-200 text-xs"
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>

          {/* Roulette and Betting */}
          <div className="xl:col-span-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Roulette Wheel */}
              <div className="flex flex-col items-center">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-6">
                  <RouletteWheel
                    onSpinComplete={handleSpinComplete}
                    isSpinning={isSpinning}
                    setIsSpinning={setIsSpinning}
                    canSpin={canSpin}
                    onSpinRequest={handleSpinRequest}
                  />
                  
                  {!canSpin && totalBetAmount === 0 && (
                    <div className="mt-4 text-center text-white/70">
                      Place your bets to spin the wheel
                    </div>
                  )}
                  
                  {!canSpin && totalBetAmount > profile.current_tokens && (
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
                        <div className="text-white/80">
                          Base winnings: {lastSpinResult.winnings} tokens
                        </div>
                        {lastSpinResult.questionCorrect !== undefined && (
                          <div className={`text-sm font-medium ${
                            lastSpinResult.questionCorrect ? 'text-green-300' : 'text-red-300'
                          }`}>
                            Question: {lastSpinResult.questionCorrect ? 'Correct! Full payout' : 'Incorrect - 30% payout'}
                          </div>
                        )}
                        <div className={`text-xl font-bold ${
                          lastSpinResult.actualPayout > 0 ? 'text-green-300' : 'text-red-300'
                        }`}>
                          {lastSpinResult.actualPayout > 0 
                            ? `Won: ${lastSpinResult.actualPayout} tokens!`
                            : 'No win this time'
                          }
                        </div>
                        <div className={`text-lg ${
                          lastSpinResult.actualPayout - lastSpinResult.totalBet > 0 
                            ? 'text-green-300' 
                            : 'text-red-300'
                        }`}>
                          Net: {lastSpinResult.actualPayout - lastSpinResult.totalBet > 0 ? '+' : ''}
                          {lastSpinResult.actualPayout - lastSpinResult.totalBet} tokens
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
                  playerBalance={profile.current_tokens}
                  isSpinning={isSpinning}
                />

                {/* Game Instructions */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mt-6">
                  <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    How to Play
                  </h3>
                  <div className="space-y-2 text-white/80 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <p>Select a course and question (optional but recommended)</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <p>Place bets on any number (0, 00, 1-36)</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <p>Answer the question correctly for full payout (35:1)!</p>
                    </div>
                    <div className="mt-3 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                      <p className="text-cyan-300 text-xs">
                        <strong>Payout Rules:</strong> Correct answer = 100% payout, Wrong answer = 30% payout, No question = 50% payout
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Modal */}
      <QuestionModal
        isOpen={showQuestionModal}
        prompt={currentPrompt}
        onAnswer={handleQuestionAnswer}
        onClose={() => setShowQuestionModal(false)}
        loading={questionLoading}
      />
    </div>
  );
};