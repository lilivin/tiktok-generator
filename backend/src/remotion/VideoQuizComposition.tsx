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
import { AnswerScene } from './scenes/AnswerScene';
import { OutroScene } from './scenes/OutroScene';

export const VideoQuizComposition: React.FC<VideoCompositionProps> = ({
  topic,
  questions,
  backgroundImages,
  audioFiles,
  timing,
}) => {
  const { fps } = useVideoConfig();
  
  // Convert timing from seconds to frames
  const introDurationFrames = Math.round(timing.intro * fps);
  const questionDurationFrames = timing.questions.map(d => Math.round(d * fps));
  const timerDurationFrames = Math.round(timing.timer * fps);
  const answerDurationFrames = timing.answers.map(d => Math.round(d * fps));
  const outroDurationFrames = Math.round(timing.outro * fps);
  
  // Calculate total duration - now questions include timer
  const totalDuration = introDurationFrames + 
    questions.reduce((total, _, index) => 
      total + questionDurationFrames[index] + timerDurationFrames + answerDurationFrames[index], 0
    ) + outroDurationFrames;

  console.log('🎬 Video timing conversion (seconds → frames @ 30fps):');
  console.log(`  Intro: ${timing.intro}s → ${introDurationFrames} frames`);
  timing.questions.forEach((seconds, i) => {
    console.log(`  Question ${i + 1}: ${seconds}s → ${questionDurationFrames[i]} frames`);
  });
  console.log(`  Timer: ${timing.timer}s → ${timerDurationFrames} frames (integrated in questions)`);
  timing.answers.forEach((seconds, i) => {
    console.log(`  Answer ${i + 1}: ${seconds}s → ${answerDurationFrames[i]} frames`);
  });
  console.log(`  Outro: ${timing.outro}s → ${outroDurationFrames} frames`);
  console.log(`  Total: ${totalDuration} frames (${(totalDuration / fps).toFixed(2)}s)`);

  let currentFrame = 0;

  return (
    <AbsoluteFill>
      {/* Background Music - commented out as file doesn't exist
      <Audio
        src={staticFile('background-music.mp3')}
        volume={0.3}
        loop
      />
      */}

      {/* Intro Scene */}
      <Sequence from={currentFrame} durationInFrames={introDurationFrames}>
        <IntroScene
          topic={topic}
          backgroundImage={backgroundImages[0] || ''}
          audioFile={audioFiles.intro?.path}
        />
      </Sequence>
      {currentFrame += introDurationFrames}

      {/* Question Sequences - now with integrated timer */}
      {questions.map((question, index) => {
        const questionStart = currentFrame;
        const questionDuration = questionDurationFrames[index];
        const questionWithTimerDuration = questionDuration + timerDurationFrames;
        const answerStart = questionStart + questionWithTimerDuration;
        const answerDuration = answerDurationFrames[index];
        
        // Update currentFrame for next iteration
        currentFrame += questionWithTimerDuration + answerDuration;
        
        return (
          <React.Fragment key={`question-${index}`}>
            {/* Question Scene with integrated timer */}
            <Sequence from={questionStart} durationInFrames={questionWithTimerDuration}>
              <QuestionScene
                question={question.question}
                backgroundImage={backgroundImages[index + 1]}
                audioFile={audioFiles.questions[index]?.path}
                questionNumber={index + 1}
                timerDuration={timing.timer}
                audioEndFrame={questionDuration}
              />
            </Sequence>

            {/* Answer Scene */}
            <Sequence from={answerStart} durationInFrames={answerDuration}>
              <AnswerScene
                answer={question.answer}
                backgroundImage={backgroundImages[index + 1]}
                audioFile={audioFiles.answers[index]?.path}
              />
            </Sequence>
          </React.Fragment>
        );
      })}

      {/* Outro Scene */}
      <Sequence from={currentFrame} durationInFrames={outroDurationFrames}>
        <OutroScene
          backgroundImage={backgroundImages[backgroundImages.length - 1]} // Use dedicated outro background
          audioFile={audioFiles.outro?.path}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

// Composition definition for Remotion with dynamic duration calculation
export const VideoQuizCompositionConfig = {
  id: 'VideoQuiz',
  component: VideoQuizComposition,
  durationInFrames: (timing: any, questionCount: number, fps: number = 30) => {
    console.log('timing', timing);
    if (!timing) {
      // Fallback to default durations if timing not provided
      return 90 + (questionCount * (120 + 90 + 90)) + 120; // Old hardcoded values
    }
    
    const introDuration = Math.round(timing.intro * fps);
    const outroDuration = Math.round(timing.outro * fps);
    const timerDuration = Math.round(timing.timer * fps);
    
    const questionsDuration = timing.questions.reduce((total: number, duration: number) => 
      total + Math.round(duration * fps), 0);
    const answersDuration = timing.answers.reduce((total: number, duration: number) => 
      total + Math.round(duration * fps), 0);

    // Timer is now integrated in questions, not separate
    console.log({
      "introDuration": introDuration,
      "questionsDuration": questionsDuration,
      "integratedTimerDuration": timerDuration * questionCount,
      "answersDuration": answersDuration,
      outroDuration,
    })
    
    return introDuration + questionsDuration + (questionCount * timerDuration) + answersDuration + outroDuration;
  },
  fps: 30,
  width: 1080,
  height: 1920,
}; 