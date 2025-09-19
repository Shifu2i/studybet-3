import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Brain, Calculator, Globe, Atom, Palette } from 'lucide-react';

interface SearchBarProps {
  onTopicSelect: (topic: string) => void;
  selectedTopic: string;
}

const topics = [
  { name: 'Mathematics', icon: Calculator, color: 'from-blue-500 to-cyan-500' },
  { name: 'Science', icon: Atom, color: 'from-green-500 to-emerald-500' },
  { name: 'History', icon: Globe, color: 'from-amber-500 to-orange-500' },
  { name: 'Literature', icon: BookOpen, color: 'from-purple-500 to-violet-500' },
  { name: 'Psychology', icon: Brain, color: 'from-pink-500 to-rose-500' },
  { name: 'Art', icon: Palette, color: 'from-indigo-500 to-blue-500' },
];

export const SearchBar: React.FC<SearchBarProps> = ({ onTopicSelect, selectedTopic }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(selectedTopic);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredTopics = topics.filter(topic =>
    topic.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTopicSelect = (topic: string) => {
    setSearchTerm(topic);
    onTopicSelect(topic);
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md mx-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for a topic..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
          />
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full mt-2 w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden shadow-2xl z-50"
            >
              <div className="p-2">
                {filteredTopics.length > 0 ? (
                  filteredTopics.map((topic, index) => {
                    const Icon = topic.icon;
                    return (
                      <motion.button
                        key={topic.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleTopicSelect(topic.name)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all duration-200 group"
                      >
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${topic.color} group-hover:scale-110 transition-transform duration-200`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white font-medium">{topic.name}</span>
                      </motion.button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-white/60">
                    No topics found
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};