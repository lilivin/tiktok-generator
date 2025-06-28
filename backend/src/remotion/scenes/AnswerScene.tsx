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

interface AnswerSceneProps {
  answer: string;
  backgroundImage: string;
  audioFile?: string;
}

export const AnswerScene: React.FC<AnswerSceneProps> = ({
  answer,
  backgroundImage,
  audioFile,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Ken Burns effect for background
  const backgroundScale = interpolate(
    frame,
    [0, durationInFrames],
    [1.1, 1], // Reverse Ken Burns (zoom out)
    { extrapolateRight: 'clamp' }
  );

  // Text animation - dramatic reveal
  const textEntrance = spring({
    frame: frame - 5,
    fps,
    config: {
      damping: 10,
      stiffness: 250,
      mass: 0.8,
    },
  });

  const textScale = interpolate(textEntrance, [0, 1], [0.7, 1]);
  const textOpacity = interpolate(textEntrance, [0, 1], [0, 1]);

  // Pulsing effect for emphasis
  const pulse = interpolate(
    Math.sin((frame / fps) * Math.PI * 3), // 1.5 cycles per second
    [-1, 1],
    [0.98, 1.02]
  );

  return (
    <AbsoluteFill>
      {/* Background with reverse Ken Burns effect */}
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <Img
          src={backgroundImage}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${backgroundScale})`,
            filter: 'brightness(0.8) contrast(1.1)',
          }}
        />
      </AbsoluteFill>

      {/* Success overlay */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(135deg, rgba(0,150,0,0.3) 0%, rgba(0,100,0,0.1) 100%)',
        }}
      />

      {/* Answer content */}
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
        {/* "Odpowiedź to:" label */}
        <div
          style={{
            opacity: textOpacity,
            transform: `scale(${textScale})`,
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              fontSize: '32px',
              fontWeight: '600',
              fontFamily: 'Poppins, Arial, sans-serif',
              color: '#00FF00',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              backgroundColor: 'rgba(0,0,0,0.6)',
              padding: '15px 30px',
              borderRadius: '20px',
              border: '2px solid #00FF00',
            }}
          >
            ODPOWIEDŹ TO:
          </div>
        </div>

        {/* Answer text */}
        <div
          style={{
            opacity: textOpacity,
            transform: `scale(${textScale * pulse})`,
          }}
        >
          <h1
            style={{
              fontSize: '56px',
              fontWeight: '900',
              fontFamily: 'Poppins, Arial, sans-serif',
              color: '#FFFFFF',
              textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
              lineHeight: '1.2',
              margin: 0,
              padding: '40px',
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: '25px',
              backdropFilter: 'blur(5px)',
              border: '3px solid #FFD700',
              boxShadow: '0 0 30px rgba(255,215,0,0.5)',
            }}
          >
            {answer}
          </h1>
        </div>

        {/* Success indicator */}
        <div
          style={{
            marginTop: '40px',
            opacity: textOpacity,
            transform: `scale(${textScale})`,
          }}
        >
          <div
            style={{
              fontSize: '48px',
              color: '#00FF00',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            }}
          >
            ✓
          </div>
        </div>
      </AbsoluteFill>

      {/* Audio track */}
      {audioFile && <Audio src={audioFile} volume={0.8} />}
    </AbsoluteFill>
  );
}; 