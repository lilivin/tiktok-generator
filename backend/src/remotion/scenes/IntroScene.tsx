import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

interface IntroSceneProps {
  topic: string;
  backgroundImage: string;
  audioFile?: string;
}

export const IntroScene: React.FC<IntroSceneProps> = ({
  topic,
  backgroundImage,
  audioFile,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Ken Burns effect for background
  const backgroundScale = interpolate(
    frame,
    [0, durationInFrames],
    [1, 1.1],
    { extrapolateRight: 'clamp' }
  );

  // Text animation - spring entrance
  const textEntrance = spring({
    frame: frame - 15, // Delay entrance by 0.5 seconds
    fps,
    config: {
      damping: 12,
      stiffness: 150,
      mass: 0.5,
    },
  });

  // Scale animation for dynamic entrance
  const textScale = interpolate(textEntrance, [0, 1], [0.8, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Opacity animation
  const textOpacity = interpolate(textEntrance, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtle pulse animation for micromotion
  const pulse = interpolate(
    Math.sin((frame / fps) * Math.PI * 2), // 1 cycle per second
    [-1, 1],
    [0.98, 1.02]
  );

  return (
    <AbsoluteFill>
      {/* Background with Ken Burns effect */}
      <AbsoluteFill
        style={{
          overflow: 'hidden',
        }}
      >
        <Img
          src={backgroundImage}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${backgroundScale})`,
          }}
        />
      </AbsoluteFill>

      {/* Dark overlay for text readability */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%)',
        }}
      />

      {/* Main text content */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px 40px',
          textAlign: 'center',
        }}
      >
        {/* Title "Nie zgadniesz, odpadasz" */}
        <div
          style={{
            opacity: textOpacity,
            transform: `scale(${textScale * pulse})`,
            marginBottom: '30px',
          }}
        >
          <h1
            style={{
              fontSize: '68px',
              fontWeight: '900',
              fontFamily: 'Poppins, Arial, sans-serif',
              color: '#FFFFFF',
              textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
              lineHeight: '1.1',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            NIE ZGADNIESZ
          </h1>
          <h2
            style={{
              fontSize: '100px',
              fontWeight: '800',
              fontFamily: 'Poppins, Arial, sans-serif',
              color: '#FFD700', // Golden color for emphasis
              textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
              margin: '10px 0 50px 0',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            ODPADASZ
          </h2>
        </div>

        {/* Topic */}
        <div
          style={{
            opacity: textOpacity,
            transform: `scale(${textScale * pulse})`,
          }}
        >
          <h3
            style={{
              fontSize: '56px',
              fontWeight: '700',
              fontFamily: 'Poppins, Arial, sans-serif',
              color: '#FFFFFF',
              textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
              margin: 0,
              padding: '20px 30px',
              backgroundColor: 'rgba(255, 215, 0, 0.15)',
              borderRadius: '25px',
              border: '3px solid #FFD700',
              backdropFilter: 'blur(5px)',
            }}
          >
            {topic}
          </h3>
        </div>
      </AbsoluteFill>

      {/* Audio track */}
      {audioFile && (
        <Audio src={audioFile} volume={0.8} />
      )}
    </AbsoluteFill>
  );
}; 