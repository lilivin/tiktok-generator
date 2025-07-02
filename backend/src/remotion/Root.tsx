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
      { question: 'Lorem upsum dsods lasds uniniuiun sdnidasd sdoimdsa dj sdjsad jdsa asdsad  sadsad sad sdasdsad', answer: 'Sample answer 1' },
      { question: 'Sample question 2 with image?', answer: 'Sample answer 2' },
      { question: 'Sample question 3?', answer: 'Sample answer 3' },
    ],
    backgroundImages: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
      'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=1920&h=1080&fit=crop',
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&h=1080&fit=crop',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&h=1080&fit=crop',
      'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=1920&h=1080&fit=crop',
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&h=1080&fit=crop',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&h=1080&fit=crop',
    ],
    questionImages: [
      'https://images.unsplash.com/photo-1750711642160-efc6e052751a?q=80&w=3028&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // No image for first question
      'https://images.unsplash.com/photo-1750711642160-efc6e052751a?q=80&w=3028&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Sample image for second question
      '', // No image for third question
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