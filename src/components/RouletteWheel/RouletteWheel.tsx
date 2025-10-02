import React, { useState, useCallback } from 'react';
import { Wheel } from 'react-custom-roulette';
import { motion } from 'framer-motion';
import { WheelSegment } from '../../types';

interface RouletteWheelProps {
  segments: WheelSegment[];
  onSpinComplete: (result: WheelSegment) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
}

export const RouletteWheel: React.FC<RouletteWheelProps> = ({
  segments,
  onSpinComplete,
  isSpinning,
  setIsSpinning,
}) => {
  const [prizeNumber, setPrizeNumber] = useState(0);

  const data = segments.map((segment, index) => ({
    option: segment.label,
    style: { 
      backgroundColor: segment.color,
      textColor: '#ffffff',
      fontSize: 16,
    },
    optionSize: segment.probability * 100,
  }));

  const handleSpinClick = () => {
    if (!isSpinning) {
      const newPrizeNumber = Math.floor(Math.random() * segments.length);
      setPrizeNumber(newPrizeNumber);
      setIsSpinning(true);
    }
  };

  const handleStopSpinning = useCallback(() => {
    setIsSpinning(false);
    const winningSegment = segments[prizeNumber];
    onSpinComplete(winningSegment);
  }, [prizeNumber, segments, onSpinComplete, setIsSpinning]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <Wheel
          mustStartSpinning={isSpinning}
          prizeNumber={prizeNumber}
          data={data}
          onStopSpinning={handleStopSpinning}
          backgroundColors={['#3e3e3e', '#df3428']}
          textColors={['#ffffff']}
          outerBorderColor="#ffffff"
          outerBorderWidth={8}
          innerBorderColor="#ffffff"
          innerBorderWidth={2}
          innerRadius={30}
          radiusLineColor="#ffffff"
          radiusLineWidth={2}
          fontSize={16}
          textDistance={70}
          spinDuration={0.8}
        />
      </div>

      <motion.button
        whileHover={{ scale: isSpinning ? 1 : 1.05 }}
        whileTap={{ scale: isSpinning ? 1 : 0.95 }}
        onClick={handleSpinClick}
        disabled={isSpinning}
        className={`mt-8 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
          !isSpinning
            ? 'bg-gradient-to-r from-red-600 to-red-800 text-white hover:from-red-700 hover:to-red-900 shadow-lg'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isSpinning ? 'SPINNING...' : 'SPIN'}
      </motion.button>
    </div>
  );
};