import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, BookOpen, Tag, TrendingUp } from 'lucide-react';
import { supabase, Course, Prompt } from '../../lib/supabase';

interface CourseSelectorProps {
  selectedCourse: string | null;
  onCourseSelect: (course: string) => void;
  onPromptSelect: (prompt: Prompt) => void;
}

export const CourseSelector: React.FC<CourseSelectorProps> = ({
  selectedCourse,
  onCourseSelect,
  onPromptSelect,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchPrompts();
    }
  }, [selectedCourse, searchQuery, selectedDifficulty, selectedTags]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrompts = async () => {
    try {
      let query = supabase
        .from('prompts')
        .select('*')
        .eq('is_active', true)
        .eq('course', selectedCourse);

      if (searchQuery) {
        query = query.ilike('prompt_text', `%${searchQuery}%`);
      }

      if (selectedDifficulty) {
        query = query.eq('difficulty', selectedDifficulty);
      }

      if (selectedTags.length > 0) {
        query = query.overlaps('topic_tags', selectedTags);
      }

      const { data, error } = await query.order('difficulty').limit(20);

      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    }
  };

  const getAllTags = () => {
    const allTags = new Set<string>();
    courses.forEach(course => {
      course.topic_tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-green-500/20 text-green-300';
      case 2: return 'bg-yellow-500/20 text-yellow-300';
      case 3: return 'bg-orange-500/20 text-orange-300';
      case 4: return 'bg-red-500/20 text-red-300';
      case 5: return 'bg-purple-500/20 text-purple-300';
      default: return 'bg-blue-500/20 text-blue-300';
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/20 rounded w-1/3"></div>
          <div className="h-10 bg-white/20 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-white/20 rounded"></div>
            <div className="h-20 bg-white/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-6 h-6 text-cyan-400" />
        <h3 className="text-xl font-bold text-white">Choose Your Learning Path</h3>
      </div>

      {/* Course Selection */}
      <div className="mb-6">
        <label className="block text-white/80 text-sm font-medium mb-3">
          Select Course:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {courses.map((course) => (
            <motion.button
              key={course.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCourseSelect(course.name)}
              className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                selectedCourse === course.name
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-white'
                  : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
              }`}
            >
              <div className="font-semibold mb-1">{course.name}</div>
              {course.description && (
                <div className="text-sm opacity-70 mb-2">{course.description}</div>
              )}
              <div className="flex flex-wrap gap-1">
                {course.topic_tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-white/10 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {course.topic_tags.length > 3 && (
                  <span className="px-2 py-1 bg-white/10 rounded text-xs">
                    +{course.topic_tags.length - 3}
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {selectedCourse && (
        <>
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Difficulty:
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedDifficulty(null)}
                  className={`px-3 py-1 rounded-lg text-sm transition-all ${
                    selectedDifficulty === null
                      ? 'bg-white/20 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  All
                </button>
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedDifficulty(level)}
                    className={`px-3 py-1 rounded-lg text-sm transition-all ${
                      selectedDifficulty === level
                        ? getDifficultyColor(level)
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    Level {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Tags */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Topics:
              </label>
              <div className="flex flex-wrap gap-2">
                {getAllTags().map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-lg text-sm transition-all flex items-center gap-1 ${
                      selectedTags.includes(tag)
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Question List */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-3">
              Available Questions ({prompts.length}):
            </label>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {prompts.map((prompt) => (
                <motion.button
                  key={prompt.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onPromptSelect(prompt)}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200 text-left"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-white text-sm leading-relaxed">
                        {prompt.prompt_text.length > 100
                          ? `${prompt.prompt_text.substring(0, 100)}...`
                          : prompt.prompt_text
                        }
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ml-3 ${getDifficultyColor(prompt.difficulty)}`}>
                      L{prompt.difficulty}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {prompt.topic_tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-white/10 text-white/70 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 text-white/60 text-xs">
                      {prompt.time_limit && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {prompt.time_limit}s
                        </span>
                      )}
                      <span>{prompt.allowed_attempts} attempts</span>
                    </div>
                  </div>
                </motion.button>
              ))}
              
              {prompts.length === 0 && (
                <div className="text-center py-8 text-white/60">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No questions found matching your criteria.</p>
                  <p className="text-sm mt-1">Try adjusting your filters.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};