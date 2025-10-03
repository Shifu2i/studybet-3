import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Brain } from 'lucide-react';
import { Prompt } from '../../lib/supabase';

interface QuestionModalProps {
  isOpen: boolean;
  prompt: Prompt | null;
  onAnswer: (answer: string, timeTaken: number) => void;
  onClose: () => void;
  loading?: boolean;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  isOpen,
  prompt,
  onAnswer,
  onClose,
  loading = false,
}) => {
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    if (isOpen && prompt) {
      setAnswer('');
      setStartTime(Date.now());
      
      if (prompt.time_limit) {
        setTimeLeft(prompt.time_limit);
        
        const timer = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev === null || prev <= 1) {
              clearInterval(timer);
              handleSubmit(true); // Auto-submit on timeout
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      }
    }
  }, [isOpen, prompt]);

  const handleSubmit = (isTimeout = false) => {
    if (!prompt || loading) return;
    
    const timeTaken = Date.now() - startTime;
    const finalAnswer = isTimeout ? answer || 'No answer provided' : answer;
    
    if (!isTimeout && !finalAnswer.trim()) {
      return; // Don't submit empty answers unless timeout
    }
    
    onAnswer(finalAnswer, timeTaken);
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'text-green-400';
      case 2: return 'text-yellow-400';
      case 3: return 'text-orange-400';
      case 4: return 'text-red-400';
      case 5: return 'text-purple-400';
      default: return 'text-blue-400';
    }
  };

  const getDifficultyLabel = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'Beginner';
      case 2: return 'Easy';
      case 3: return 'Medium';
      case 4: return 'Hard';
      case 5: return 'Expert';
      default: return 'Unknown';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && prompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-2xl border border-white/20"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-cyan-400" />
                <div>
                  <h3 className="text-xl font-bold text-white">Answer to Spin</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white/60">Course:</span>
                    <span className="text-white font-medium">{prompt.course}</span>
                    <span className={`font-medium ${getDifficultyColor(prompt.difficulty)}`}>
                      {getDifficultyLabel(prompt.difficulty)}
                    </span>
                  </div>
                </div>
              </div>
              
              {timeLeft !== null && (
                <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                  timeLeft <= 10 ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'
                }`}>
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-bold">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* Question */}
            <div className="mb-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white text-lg leading-relaxed">
                  {prompt.prompt_text}
                </p>
              </div>
              
              {prompt.topic_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {prompt.topic_tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded-md text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Answer Input */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm font-medium mb-2">
                Your Answer:
              </label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full bg-white/10 border border-white/20 rounded-lg p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                rows={4}
                disabled={loading || timeLeft === 0}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="text-white/60 text-sm">
                {prompt.allowed_attempts > 1 && (
                  <span>Attempts allowed: {prompt.allowed_attempts}</span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSubmit()}
                  disabled={loading || !answer.trim() || timeLeft === 0}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Submit Answer
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Timeout Warning */}
            {timeLeft !== null && timeLeft <= 10 && timeLeft > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg"
              >
                <div className="flex items-center gap-2 text-red-300">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Time running out! Answer will be auto-submitted in {timeLeft} seconds.
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};