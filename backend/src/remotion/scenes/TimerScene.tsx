import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

interface TimerSceneProps {
  backgroundImage: string;
  duration: number; // Duration in frames
}

export const TimerScene: React.FC<TimerSceneProps> = ({
  backgroundImage,
  duration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate countdown (3, 2, 1)
  const secondsLeft = Math.ceil((duration - frame) / fps);
  const currentSecond = Math.max(0, Math.min(3, secondsLeft));

  // Progress for circular timer
  const progress = frame / duration;

  // Timer ring animation
  const circumference = 2 * Math.PI * 60; // radius = 60
  const strokeDashoffset = circumference * (1 - progress);

  // Scale animation for numbers
  const numberScale = interpolate(
    frame % fps,
    [0, fps * 0.2, fps * 0.4, fps],
    [1.2, 1, 1, 1.2],
    { extrapolateRight: 'clamp' }
  );

  // Pulsing effect
  const pulse = interpolate(
    Math.sin((frame / fps) * Math.PI * 4), // 2 cycles per second
    [-1, 1],
    [0.95, 1.05]
  );

  return (
    <AbsoluteFill>
      {/* Background */}
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <Img
          src={backgroundImage}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(2px) brightness(0.7)',
          }}
        />
      </AbsoluteFill>

      {/* Timer container */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Timer circle and number */}
        <div
          style={{
            position: 'relative',
            transform: `scale(${pulse})`,
          }}
        >
          {/* Background circle */}
          <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="80"
              cy="80"
              r="60"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              cx="80"
              cy="80"
              r="60"
              stroke="#FFD700"
              strokeWidth="8"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                filter: 'drop-shadow(0 0 10px #FFD700)',
              }}
            />
          </svg>

          {/* Timer number */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${numberScale})`,
              fontSize: '72px',
              fontWeight: '900',
              fontFamily: 'Poppins, Arial, sans-serif',
              color: '#FFFFFF',
              textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
              textAlign: 'center',
            }}
          >
            {currentSecond > 0 ? currentSecond : '⏰'}
          </div>
        </div>

        {/* Instructions text */}
        <div
          style={{
            marginTop: '40px',
            fontSize: '32px',
            fontWeight: '600',
            fontFamily: 'Poppins, Arial, sans-serif',
            color: '#FFFFFF',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            textAlign: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: '15px 30px',
            borderRadius: '15px',
            backdropFilter: 'blur(5px)',
          }}
        >
          {currentSecond > 0 ? 'Pomyśl nad odpowiedzią...' : 'Czas!'}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}; 