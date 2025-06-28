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

interface QuestionSceneProps {
  question: string;
  backgroundImage: string;
  audioFile?: string;
  questionNumber: number;
}

export const QuestionScene: React.FC<QuestionSceneProps> = ({
  question,
  backgroundImage,
  audioFile,
  questionNumber,
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
    frame: frame - 10,
    fps,
    config: {
      damping: 15,
      stiffness: 200,
      mass: 0.5,
    },
  });

  const textScale = interpolate(textEntrance, [0, 1], [0.9, 1]);
  const textOpacity = interpolate(textEntrance, [0, 1], [0, 1]);

  return (
    <AbsoluteFill>
      {/* Background with Ken Burns effect */}
      <AbsoluteFill style={{ overflow: 'hidden' }}>
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

      {/* Dark overlay */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)',
        }}
      />

      {/* Question content */}
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
        {/* Question number */}
        <div
          style={{
            opacity: textOpacity,
            transform: `scale(${textScale})`,
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              fontSize: '36px',
              fontWeight: '700',
              fontFamily: 'Poppins, Arial, sans-serif',
              color: '#FFD700',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              backgroundColor: 'rgba(0,0,0,0.6)',
              padding: '15px 30px',
              borderRadius: '25px',
              border: '2px solid #FFD700',
            }}
          >
            PYTANIE {questionNumber}
          </div>
        </div>

        {/* Question text */}
        <div
          style={{
            opacity: textOpacity,
            transform: `scale(${textScale})`,
          }}
        >
          <h1
            style={{
              fontSize: '48px',
              fontWeight: '800',
              fontFamily: 'Poppins, Arial, sans-serif',
              color: '#FFFFFF',
              textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
              lineHeight: '1.2',
              margin: 0,
              padding: '30px',
              backgroundColor: 'rgba(0,0,0,0.4)',
              borderRadius: '20px',
              backdropFilter: 'blur(5px)',
            }}
          >
            {question}
          </h1>
        </div>
      </AbsoluteFill>

      {/* Audio track */}
      {audioFile && <Audio src={audioFile} volume={0.8} />}
    </AbsoluteFill>
  );
}; 