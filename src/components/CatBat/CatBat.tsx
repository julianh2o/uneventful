/** @jsxImportSource @emotion/react */
import React, { useState, ReactNode } from 'react';
import { Box } from '@mui/material';

interface CatBatProps {
  children: ReactNode;
  enabled?: boolean;
  onBat?: () => void;
}

export const CatBat = ({ children, enabled = true, onBat }: CatBatProps) => {
  const [isBatting, setIsBatting] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  const handleClick = (e: React.MouseEvent) => {
    if (!enabled) return;

    e.preventDefault();
    e.stopPropagation();

    setIsBatting(true);
    setAnimationKey(prev => prev + 1);

    if (onBat) {
      onBat();
    }

    // Cat animation: 1100ms (swipe in, bat, flip, leave) + 1500ms delay = 2600ms total
    setTimeout(() => {
      setIsBatting(false);
    }, 2600);
  };

  return (
    <Box sx={{ display: 'inline-block', position: 'relative' }}>
      {isBatting && (
        <Box
          key={`cat-${animationKey}`}
          sx={{
            position: 'absolute',
            left: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '2rem',
            zIndex: 10,
            animation: 'catSwipeAndLeave 1.1s ease-in-out forwards',
            pointerEvents: 'none',
            '@keyframes catSwipeAndLeave': {
              '0%': {
                left: 'calc(100% + 60px)',
                opacity: 0,
                transform: 'translateY(-50%) scaleX(1)',
              },
              '27%': {
                left: '100%',
                opacity: 1,
                transform: 'translateY(-50%) scaleX(1)',
              },
              '45%': {
                left: '100%',
                opacity: 1,
                transform: 'translateY(-50%) scaleX(1)',
              },
              '55%': {
                left: '100%',
                opacity: 1,
                transform: 'translateY(-50%) scaleX(-1)',
              },
              '100%': {
                left: 'calc(100% + 60px)',
                opacity: 0,
                transform: 'translateY(-50%) scaleX(-1)',
              },
            },
          }}
        >
          🐈
        </Box>
      )}
      <Box
        key={`content-${animationKey}`}
        onClick={enabled ? handleClick : undefined}
        sx={{
          cursor: enabled ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          ...(isBatting && {
            animation: 'pillFlyAway 0.8s ease-out',
            '@keyframes pillFlyAway': {
              '0%': {
                transform: 'translate(0, 0) rotate(0deg)',
                opacity: 1,
              },
              '30%': {
                transform: 'translate(5px, -5px) rotate(10deg)',
              },
              '100%': {
                transform: 'translate(300px, -200px) rotate(720deg)',
                opacity: 0,
              },
            },
          }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
