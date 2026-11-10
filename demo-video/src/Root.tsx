import React from "react";
import { Composition } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { recordingSeconds } from "./components/Recording";
import { Demo } from "./scenes/Demo";
import { Hook } from "./scenes/Hook";
import { Intro } from "./scenes/Intro";
import { Outro } from "./scenes/Outro";
import { Workflow } from "./scenes/Workflow";
import { demo1, demo2, hook, intro, outro, TRANSITION_SEC, workflow, type Recording } from "./script";
import { FPS, sec } from "./theme";

const WIDTH = 1920;
const HEIGHT = 1080;
const MAX_SEC = 180;

const demoSeconds = (d: { durationSec: number; recording: Recording }) =>
  d.recording.ready ? recordingSeconds(d.recording) : d.durationSec;

const SCENES = [
  { id: "Hook", seconds: hook.durationSec, node: <Hook /> },
  { id: "Intro", seconds: intro.durationSec, node: <Intro /> },
  { id: "Demo1", seconds: demoSeconds(demo1), node: <Demo demo={demo1} /> },
  { id: "Demo2", seconds: demoSeconds(demo2), node: <Demo demo={demo2} /> },
  { id: "Workflow", seconds: demoSeconds(workflow), node: <Workflow /> },
  { id: "Outro", seconds: outro.durationSec, node: <Outro /> },
];

const transition = sec(TRANSITION_SEC);
const totalFrames = SCENES.reduce((sum, s) => sum + sec(s.seconds), 0) - transition * (SCENES.length - 1);

if (totalFrames > MAX_SEC * FPS) {
  console.warn(`데모 영상이 ${(totalFrames / FPS).toFixed(1)}초예요. 제출 기준 ${MAX_SEC}초를 넘었어요.`);
}

const DemoVideo: React.FC = () => (
  <TransitionSeries>
    {SCENES.flatMap((s, i) => {
      const items = [
        <TransitionSeries.Sequence key={s.id} durationInFrames={sec(s.seconds)}>
          {s.node}
        </TransitionSeries.Sequence>,
      ];
      if (i < SCENES.length - 1) {
        items.push(
          <TransitionSeries.Transition
            key={`${s.id}-t`}
            presentation={fade()}
            timing={linearTiming({ durationInFrames: transition })}
          />,
        );
      }
      return items;
    })}
  </TransitionSeries>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="DemoVideo" component={DemoVideo} durationInFrames={totalFrames} fps={FPS} width={WIDTH} height={HEIGHT} />
    {SCENES.map((s) => (
      <Composition
        key={s.id}
        id={`Scene-${s.id}`}
        component={() => s.node}
        durationInFrames={sec(s.seconds)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    ))}
  </>
);
