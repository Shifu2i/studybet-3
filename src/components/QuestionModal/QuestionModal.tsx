import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle } from 'lucide-react';

interface QuestionModalProps {
  isOpen: boolean;
  question: string;
  topic: string;
  onAnswer: (answer: string, isCorrect: boolean) => void;
  onClose: () => void;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  isOpen,
  question,
  topic,
  onAnswer,
  onClose,
}) => {
  const [answer, setAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAnswer('');
      setIsSubmitted(false);
      setFeedback(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!answer.trim()) return;

    setIsSubmitted(true);

    // Simulate AI evaluation (replace with actual Ollama integration)
    const isCorrect = Math.random() > 0.3; // 70% chance of being correct for demo
    const message = isCorrect 
      ? "Great job! Your answer demonstrates good understanding."
      : "Not quite right, but keep learning! The correct approach would be...";

    setFeedback({ isCorrect, message });

    setTimeout(() => {
      onAnswer(answer, isCorrect);
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Question Time!</h2>
                <p className="text-white/70">Topic: {topic}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white text-lg leading-relaxed">{question}</p>
              </div>
            </div>

            {!isSubmitted ? (
              <div className="space-y-4">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-32 resize-none"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={!answer.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Answer
                </motion.button>
              </div>
            ) : (
              <div className="text-center">
                {feedback ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                      feedback.isCorrect 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {feedback.isCorrect ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                      <span className="font-semibold">
                        {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
                      </span>
                    </div>
                    <p className="text-white/80">{feedback.message}</p>
                  </motion.div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-white/70">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Evaluating your answer...</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};