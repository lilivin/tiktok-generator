import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

interface QuestionSceneProps {
  question: string;
  backgroundImage: string;
  audioFile?: string;
  questionNumber: number;
  timerDuration?: number; // Duration of timer in seconds
  audioEndFrame?: number; // Frame when audio ends to start timer
}

export const QuestionScene: React.FC<QuestionSceneProps> = ({
  question,
  backgroundImage,
  audioFile,
  questionNumber,
  timerDuration = 15, // Default 15 seconds for timer
  audioEndFrame = 180, // Default 6 seconds at 30fps
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Calculate timer start frame (after audio ends)
  const timerStartFrame = audioEndFrame;
  const timerEndFrame = timerStartFrame + (timerDuration * fps);
  const isTimerActive = frame >= timerStartFrame && frame <= timerEndFrame;

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

  // Timer calculations
  const timerFrame = frame - timerStartFrame;
  const timerFramesLeft = timerEndFrame - frame;
  const secondsLeft = Math.ceil(timerFramesLeft / fps);
  const currentSecond = Math.max(0, Math.min(timerDuration, secondsLeft));

  // Debug logging for timer audio
  if (frame % 30 === 0) { // Log every second
    console.log(`Frame: ${frame}, TimerStartFrame: ${timerStartFrame}, TimerEndFrame: ${timerEndFrame}, IsTimerActive: ${isTimerActive}, StartFrom: ${timerStartFrame / fps}s, EndAt: ${timerEndFrame / fps}s`);
  }

  // Timer progress
  const timerProgress = isTimerActive ? timerFrame / (timerDuration * fps) : 0;
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference * (1 - timerProgress);

  // Timer animations
  const timerOpacity = isTimerActive 
    ? interpolate(timerFrame, [0, fps * 0.5], [0, 1], { extrapolateRight: 'clamp' })
    : 0;

  const numberScale = isTimerActive
    ? interpolate(
        timerFrame % fps,
        [0, fps * 0.2, fps * 0.4, fps],
        [1.2, 1, 1, 1.2],
        { extrapolateRight: 'clamp' }
      )
    : 1;

  const pulse = isTimerActive
    ? interpolate(
        Math.sin((timerFrame / fps) * Math.PI * 4),
        [-1, 1],
        [0.95, 1.05]
      )
    : 1;

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
            filter: isTimerActive ? 'blur(1px) brightness(0.8)' : 'none',
          }}
        />
      </AbsoluteFill>

      {/* Dark overlay */}
      <AbsoluteFill
        style={{
          background: isTimerActive 
            ? 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%)'
            : 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)',
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

      {/* Timer container - positioned absolutely above question */}
      {isTimerActive && (
        <AbsoluteFill
          style={{
            top: '300px',
            paddingTop: '80px',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              opacity: timerOpacity,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Timer circle and number */}
            <div
              style={{
                position: 'relative',
                transform: `scale(${pulse})`, // Removed the 0.7 scale down factor
              }}
            >
              {/* Background circle */}
              <svg width="250" height="250" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="125"
                  cy="125"
                  r="88"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Progress circle */}
                <circle
                  cx="125"
                  cy="125"
                  r="88"
                  stroke="#FFD700"
                  strokeWidth="10"
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={circumference * 1.45} // Adjusted for medium circle (88/35 * 0.58 ≈ 1.45)
                  strokeDashoffset={strokeDashoffset * 1.45}
                  style={{
                    filter: 'drop-shadow(0 0 8px #FFD700)',
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
                  fontSize: '80px',
                  fontWeight: '900',
                  fontFamily: 'Poppins, Arial, sans-serif',
                  color: '#FFFFFF',
                  textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
                  textAlign: 'center',
                }}
              >
                {currentSecond > 0 ? currentSecond : '⏰'}
              </div>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* Audio track for question */}
      {audioFile && <Audio src={audioFile} volume={0.8} />}
      
      {/* Timer Sound Effect */}
      {isTimerActive && (
        <Audio
          src={staticFile('timer-sound.wav')}
          volume={0.6}
          loop
        />
      )}
    </AbsoluteFill>
  );
}; 