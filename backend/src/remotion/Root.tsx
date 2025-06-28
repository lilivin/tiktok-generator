import React from 'react';
import { Composition } from 'remotion';
import { VideoQuizComposition, VideoQuizCompositionConfig } from './VideoQuizComposition';

// Import video composition props type
import type { VideoCompositionProps } from '../types';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={VideoQuizCompositionConfig.id}
        component={VideoQuizComposition as any}
        durationInFrames={VideoQuizCompositionConfig.durationInFrames(3)} // Default for 3 questions
        fps={VideoQuizCompositionConfig.fps}
        width={VideoQuizCompositionConfig.width}
        height={VideoQuizCompositionConfig.height}
        defaultProps={{
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
            intro: 'path/to/intro.mp3',
            questions: [
              'path/to/question1.mp3',
              'path/to/question2.mp3', 
              'path/to/question3.mp3',
            ],
            answers: [
              'path/to/answer1.mp3',
              'path/to/answer2.mp3',
              'path/to/answer3.mp3',
            ],
            outro: 'path/to/outro.mp3',
          },
        } as VideoCompositionProps}
      />
    </>
  );
}; 