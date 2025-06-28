import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Composition,
  continueRender,
  delayRender,
  Img,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { VideoCompositionProps } from '../types';
import { IntroScene } from './scenes/IntroScene';
import { QuestionScene } from './scenes/QuestionScene';
import { TimerScene } from './scenes/TimerScene';
import { AnswerScene } from './scenes/AnswerScene';
import { OutroScene } from './scenes/OutroScene';

// Duration configuration (in frames at 30fps)
const INTRO_DURATION = 90; // 3 seconds
const QUESTION_DURATION = 120; // 4 seconds  
const TIMER_DURATION = 90; // 3 seconds
const ANSWER_DURATION = 90; // 3 seconds
const OUTRO_DURATION = 120; // 4 seconds

export const VideoQuizComposition: React.FC<VideoCompositionProps> = ({
  topic,
  questions,
  backgroundImages,
  audioFiles,
}) => {
  const { fps } = useVideoConfig();
  
  // Calculate total duration based on number of questions
  const totalDuration = INTRO_DURATION + 
    (questions.length * (QUESTION_DURATION + TIMER_DURATION + ANSWER_DURATION)) + 
    OUTRO_DURATION;

  let currentFrame = 0;

  return (
    <AbsoluteFill>
      {/* Background Music */}
      <Audio
        src={staticFile('background-music.mp3')}
        volume={0.3}
        loop
      />

      {/* Intro Scene */}
      <Sequence from={currentFrame} durationInFrames={INTRO_DURATION}>
        <IntroScene
          topic={topic}
          backgroundImage={backgroundImages[0] || ''}
          audioFile={audioFiles.intro}
        />
      </Sequence>
      {currentFrame += INTRO_DURATION}

      {/* Question Sequences */}
      {questions.map((question, index) => {
        const questionStart = currentFrame;
        const timerStart = questionStart + QUESTION_DURATION;
        const answerStart = timerStart + TIMER_DURATION;
        
        // Update currentFrame for next iteration
        const sequenceEnd = answerStart + ANSWER_DURATION;
        
        return (
          <React.Fragment key={`question-${index}`}>
            {/* Question Scene */}
            <Sequence from={questionStart} durationInFrames={QUESTION_DURATION}>
              <QuestionScene
                question={question.question}
                backgroundImage={backgroundImages[index + 1]}
                audioFile={audioFiles.questions[index]}
                questionNumber={index + 1}
              />
            </Sequence>

            {/* Timer Scene */}
            <Sequence from={timerStart} durationInFrames={TIMER_DURATION}>
              <TimerScene
                backgroundImage={backgroundImages[index + 1]}
                duration={TIMER_DURATION}
              />
            </Sequence>

            {/* Answer Scene */}
            <Sequence from={answerStart} durationInFrames={ANSWER_DURATION}>
              <AnswerScene
                answer={question.answer}
                backgroundImage={backgroundImages[index + 1]}
                audioFile={audioFiles.answers[index]}
              />
            </Sequence>
          </React.Fragment>
        );
      })}

      {/* Update currentFrame after all questions */}
      {(() => {
        currentFrame += questions.length * (QUESTION_DURATION + TIMER_DURATION + ANSWER_DURATION);
        return null;
      })()}

      {/* Outro Scene */}
      <Sequence from={currentFrame} durationInFrames={OUTRO_DURATION}>
        <OutroScene
          backgroundImage={backgroundImages[0]} // Reuse intro background
          audioFile={audioFiles.outro}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

// Composition definition for Remotion
export const VideoQuizCompositionConfig = {
  id: 'VideoQuiz',
  component: VideoQuizComposition,
  durationInFrames: (questionCount: number) => 
    INTRO_DURATION + 
    (questionCount * (QUESTION_DURATION + TIMER_DURATION + ANSWER_DURATION)) + 
    OUTRO_DURATION,
  fps: 30,
  width: 1080,
  height: 1920,
}; 