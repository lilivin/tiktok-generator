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

interface OutroSceneProps {
  backgroundImage: string;
  audioFile?: string;
}

export const OutroScene: React.FC<OutroSceneProps> = ({
  backgroundImage,
  audioFile,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Ken Burns effect for background
  const backgroundScale = interpolate(
    frame,
    [0, durationInFrames],
    [1, 1.15],
    { extrapolateRight: 'clamp' }
  );

  // Text animation - delayed entrance for dramatic effect
  const textEntrance = spring({
    frame: frame - 20, // Delay by ~0.7 seconds
    fps,
    config: {
      damping: 15,
      stiffness: 180,
      mass: 0.6,
    },
  });

  const textScale = interpolate(textEntrance, [0, 1], [0.8, 1]);
  const textOpacity = interpolate(textEntrance, [0, 1], [0, 1]);

  // Continuous pulsing for call-to-action effect
  const pulse = interpolate(
    Math.sin((frame / fps) * Math.PI * 2.5), // ~1.25 cycles per second
    [-1, 1],
    [0.96, 1.04]
  );

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
            filter: 'brightness(0.7) contrast(1.2)',
          }}
        />
      </AbsoluteFill>

      {/* Gradient overlay for text readability */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(135deg, rgba(20,20,20,0.7) 0%, rgba(40,40,40,0.5) 100%)',
        }}
      />

      {/* Outro content */}
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
        {/* Main outro text */}
        <div
          style={{
            opacity: textOpacity,
            transform: `scale(${textScale * pulse})`,
            marginBottom: '40px',
          }}
        >
          <h1
            style={{
              fontSize: '52px',
              fontWeight: '800',
              fontFamily: 'Poppins, Arial, sans-serif',
              color: '#FFFFFF',
              textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
              lineHeight: '1.3',
              margin: 0,
              padding: '30px 40px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              borderRadius: '25px',
              backdropFilter: 'blur(5px)',
            }}
          >
            I jak Ci poszło?
          </h1>
        </div>

        {/* Call to action */}
        <div
          style={{
            opacity: textOpacity,
            transform: `scale(${textScale})`,
          }}
        >
          <h2
            style={{
              fontSize: '38px',
              fontWeight: '700',
              fontFamily: 'Poppins, Arial, sans-serif',
              color: '#FFD700',
              textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
              lineHeight: '1.3',
              margin: 0,
              padding: '25px 35px',
              backgroundColor: 'rgba(255,215,0,0.15)',
              borderRadius: '20px',
              border: '3px solid #FFD700',
              backdropFilter: 'blur(5px)',
              boxShadow: '0 0 25px rgba(255,215,0,0.3)',
            }}
          >
            Podziel się swoim wynikiem w komentarzu!
          </h2>
        </div>

        {/* Social media engagement elements */}
        <div
          style={{
            marginTop: '50px',
            opacity: textOpacity,
            transform: `scale(${textScale})`,
            display: 'flex',
            gap: '30px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontWeight: '600',
              fontFamily: 'Poppins, Arial, sans-serif',
              color: '#FFFFFF',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '10px 20px',
              borderRadius: '15px',
            }}
          >
            👍 LIKE
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: '600',
              fontFamily: 'Poppins, Arial, sans-serif',
              color: '#FFFFFF',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '10px 20px',
              borderRadius: '15px',
            }}
          >
            💬 KOMENTARZ
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: '600',
              fontFamily: 'Poppins, Arial, sans-serif',
              color: '#FFFFFF',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '10px 20px',
              borderRadius: '15px',
            }}
          >
            📤 UDOSTĘPNIJ
          </div>
        </div>
      </AbsoluteFill>

      {/* Audio track */}
      {audioFile && <Audio src={audioFile} volume={0.8} />}
    </AbsoluteFill>
  );
}; 