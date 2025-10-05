import React, { useState, useCallback, useEffect } from 'react';
import { Wheel } from 'react-custom-roulette';
import { motion } from 'framer-motion';

interface RouletteWheelProps {
  onSpinComplete: (result: { number: string; color: string; payout: number }) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  canSpin: boolean;
  onSpinRequest: () => void;
}

// Traditional American Roulette wheel data with proper colors
const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const createRouletteData = () => {
  const segments = [];

  segments.push({
    option: '0',
    style: {
      backgroundColor: '#008000',
      textColor: '#ffffff',
      fontSize: 16
    },
    number: '0',
    color: 'green',
    payout: 35
  });

  segments.push({
    option: '00',
    style: {
      backgroundColor: '#008000',
      textColor: '#ffffff',
      fontSize: 16
    },
    number: '00',
    color: 'green',
    payout: 35
  });

  for (let i = 1; i <= 36; i++) {
    const backgroundColor = redNumbers.includes(i) ? '#DC143C' : '#000000';
    const color = redNumbers.includes(i) ? 'red' : 'black';

    segments.push({
      option: i.toString(),
      style: {
        backgroundColor,
        textColor: '#ffffff',
        fontSize: 16
      },
      number: i.toString(),
      color,
      payout: 35
    });
  }

  return segments;
};

const rouletteData = createRouletteData();

export const RouletteWheel: React.FC<RouletteWheelProps> = ({
  onSpinComplete,
  isSpinning,
  setIsSpinning,
  canSpin,
  onSpinRequest,
}) => {
  const [prizeNumber, setPrizeNumber] = useState(0);

  useEffect(() => {
    if (isSpinning && prizeNumber === 0) {
      const newPrizeNumber = Math.floor(Math.random() * rouletteData.length);
      setPrizeNumber(newPrizeNumber);
    }
  }, [isSpinning, prizeNumber]);

  const handleStopSpinning = useCallback(() => {
    setIsSpinning(false);
    const winningSegment = rouletteData[prizeNumber];
    onSpinComplete({
      number: winningSegment.number,
      color: winningSegment.color,
      payout: winningSegment.payout
    });
    setPrizeNumber(0);
  }, [prizeNumber, rouletteData, onSpinComplete, setIsSpinning]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <Wheel
          mustStartSpinning={isSpinning}
          prizeNumber={prizeNumber}
          data={rouletteData}
          onStopSpinning={handleStopSpinning}
          backgroundColors={['#3e3e3e']}
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
          spinDuration={3}
        />
      </div>

      <motion.button
        whileHover={{ scale: canSpin && !isSpinning ? 1.05 : 1 }}
        whileTap={{ scale: canSpin && !isSpinning ? 0.95 : 1 }}
        onClick={onSpinRequest}
        disabled={!canSpin || isSpinning}
        className={`mt-8 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
          canSpin && !isSpinning
            ? 'bg-gradient-to-r from-red-600 to-red-800 text-white hover:from-red-700 hover:to-red-900 shadow-lg'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isSpinning ? 'SPINNING...' : 'SPIN'}
      </motion.button>
    </div>
  );
};