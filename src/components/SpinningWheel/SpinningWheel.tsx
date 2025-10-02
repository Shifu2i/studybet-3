import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { WheelSegment } from '../../types';

interface SpinningWheelProps {
  segments: WheelSegment[];
  onSpin: (result: WheelSegment) => void;
  isSpinning: boolean;
  canSpin: boolean;
}

export const SpinningWheel: React.FC<SpinningWheelProps> = ({
  segments,
  onSpin,
  isSpinning,
  canSpin,
}) => {
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const spinWheel = useCallback(() => {
    if (!canSpin || isSpinning) return;

    // More varied random force (2-8 full rotations with different speeds)
    const baseRotations = 2 + Math.random() * 6;
    const randomAngle = Math.random() * 360;
    const speedVariation = 0.8 + Math.random() * 0.4; // 0.8x to 1.2x speed
    const totalRotation = rotation + (baseRotations * 360) + randomAngle;

    setRotation(totalRotation);

    // Calculate which segment was selected
    const normalizedAngle = (360 - (totalRotation % 360)) % 360;
    const segmentAngle = 360 / segments.length;
    const selectedIndex = Math.floor(normalizedAngle / segmentAngle);
    const selectedSegment = segments[selectedIndex];

    // Call onSpin after animation completes (varied timing)
    const animationDuration = 3000 * speedVariation;
    setTimeout(() => {
      onSpin(selectedSegment);
    }, animationDuration);
  }, [canSpin, isSpinning, rotation, segments, onSpin]);

  const segmentAngle = 360 / segments.length;

  return (
    <div className="relative flex flex-col items-center">
      {/* Wheel Container */}
      <div className="relative">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
          <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-white drop-shadow-lg"></div>
        </div>

        {/* Wheel */}
        <motion.div
          ref={wheelRef}
          className="w-80 h-80 rounded-full relative overflow-hidden shadow-2xl border-8 border-white/20"
          animate={{ rotate: rotation }}
          transition={{
            duration: isSpinning ? 3 : 0,
            ease: isSpinning ? [0.25, 0.46, 0.45, 0.94] : 'linear',
          }}
        >
          {segments.map((segment, index) => {
            const startAngle = index * segmentAngle;
            const endAngle = (index + 1) * segmentAngle;
            const midAngle = (startAngle + endAngle) / 2;

            // Create SVG path for segment
            const radius = 160;
            const centerX = 160;
            const centerY = 160;

            const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
            const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
            const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
            const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

            const largeArcFlag = segmentAngle > 180 ? 1 : 0;

            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z',
            ].join(' ');

            // Text position
            const textRadius = radius * 0.7;
            const textX = centerX + textRadius * Math.cos((midAngle * Math.PI) / 180);
            const textY = centerY + textRadius * Math.sin((midAngle * Math.PI) / 180);

            return (
              <div key={segment.id} className="absolute inset-0">
                <svg className="w-full h-full">
                  <path
                    d={pathData}
                    fill={segment.color}
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="2"
                  />
                  <text
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-white font-bold text-sm"
                    transform={`rotate(${midAngle}, ${textX}, ${textY})`}
                  >
                    {segment.tokens}
                  </text>
                </svg>
              </div>
            );
          })}

          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
            <div className="text-white font-bold text-xs">SPIN</div>
          </div>
        </motion.div>
      </div>

      {/* Spin Button */}
      <motion.button
        whileHover={{ scale: canSpin ? 1.05 : 1 }}
        whileTap={{ scale: canSpin ? 0.95 : 1 }}
        onClick={spinWheel}
        disabled={!canSpin || isSpinning}
        className={`mt-8 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
          canSpin && !isSpinning
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isSpinning ? 'Spinning...' : 'SPIN THE WHEEL'}
      </motion.button>
    </div>
  );
};