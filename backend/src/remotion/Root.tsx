import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { VideoQuizComposition, VideoQuizCompositionConfig } from './VideoQuizComposition';
import { IntroScene } from './scenes/IntroScene';

// Import video composition props type
import type { VideoCompositionProps } from '../types';

export const RemotionRoot: React.FC = () => {
  // Default timing for sample composition
  const defaultTiming = {
    intro: 3,
    questions: [4, 4, 4], // 4 seconds per question
    timer: 3,
    answers: [3, 3, 3], // 3 seconds per answer
    outro: 4
  };

  const sampleProps: VideoCompositionProps = {
    topic: 'Sample Quiz',
    questions: [
      { question: 'Sample question 1?', answer: 'Sample answer 1' },
      { question: 'Sample question 2?', answer: 'Sample answer 2' },
      { question: 'Sample question 3?', answer: 'Sample answer 3' },
    ],
    backgroundImages: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
      'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=1920&h=1080&fit=crop',
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&h=1080&fit=crop',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&h=1080&fit=crop',
    ],
    audioFiles: {
      intro: undefined, // Wyłączone dla testów
      questions: [],
      answers: [],
      outro: undefined,
    },
    timing: defaultTiming
  };

  return (
    <>
      <Composition
        id={VideoQuizCompositionConfig.id}
        component={VideoQuizComposition as any}
        durationInFrames={VideoQuizCompositionConfig.durationInFrames(defaultTiming, 3)} // Default dla development/preview
        fps={VideoQuizCompositionConfig.fps}
        width={VideoQuizCompositionConfig.width}
        height={VideoQuizCompositionConfig.height}
        defaultProps={sampleProps}
      />
    </>
  );
};

// Register the root component with Remotion
registerRoot(RemotionRoot); 