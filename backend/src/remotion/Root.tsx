import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { VideoQuizComposition, VideoQuizCompositionConfig } from './VideoQuizComposition';

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
      'path/to/intro-bg.jpg',
      'path/to/question1-bg.jpg', 
      'path/to/question2-bg.jpg',
      'path/to/question3-bg.jpg',
    ],
    audioFiles: {
      intro: { path: 'path/to/intro.mp3', duration: 3 },
      questions: [
        { path: 'path/to/question1.mp3', duration: 4 },
        { path: 'path/to/question2.mp3', duration: 4 },
        { path: 'path/to/question3.mp3', duration: 4 },
      ],
      answers: [
        { path: 'path/to/answer1.mp3', duration: 3 },
        { path: 'path/to/answer2.mp3', duration: 3 },
        { path: 'path/to/answer3.mp3', duration: 3 },
      ],
      outro: { path: 'path/to/outro.mp3', duration: 4 },
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