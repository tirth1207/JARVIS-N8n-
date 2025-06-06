import React, { useMemo } from "react";
import "./styles.css";
import { SvgElements } from "../SvgElements/SvgElements";
import { colorPalettes } from "../colorPalettes";
import {
  baseOrbSize,
  baseShapeSize,
  defaultAnimationSpeedBase,
  defaultAnimationSpeedHue,
  defaultBlobAOpacity,
  defaultBlobBOpacity,
  defaultHueRotation,
  defaultMainOrbHueAnimation,
  defaultNoShadowValue,
  defaultSize,
} from "../constants";
import { ReactAIOrbProps } from "../types";

export const Orb = ({
  palette = colorPalettes.cosmicNebula,
  size = defaultSize,
  animationSpeedBase = defaultAnimationSpeedBase,
  animationSpeedHue = defaultAnimationSpeedHue,
  hueRotation = defaultHueRotation,
  mainOrbHueAnimation = defaultMainOrbHueAnimation,
  blobAOpacity = defaultBlobAOpacity,
  blobBOpacity = defaultBlobBOpacity,
  noShadow = defaultNoShadowValue,
  status = 'idle', // <=== NEW
}: ReactAIOrbProps & { status: 'speaking' | 'listening' | 'idle' }) => {
  const cssVariables = useMemo(() => {
    let dynamicRotationSpeed = 1 / (animationSpeedBase * 0.5);
    let dynamicHueSpeed = 1 / (animationSpeedHue * 0.5);
    let dynamicBlobAOpacity = blobAOpacity;
    let dynamicBlobBOpacity = blobBOpacity;
    let dynamicShadow = "";
  
    if (!noShadow) {
      if (status === "speaking") {
        dynamicRotationSpeed *= 3;
        dynamicHueSpeed *= 3;
        dynamicBlobAOpacity = 0.8;
        dynamicBlobBOpacity = 0.8;
      } else if (status === "listening") {
        dynamicRotationSpeed *= 1.5;
        dynamicHueSpeed *= 2;
        dynamicBlobAOpacity = 0.6;
        dynamicBlobBOpacity = 0.6;
      } else {
        dynamicRotationSpeed *= 0.5;
        dynamicHueSpeed *= 0.5;
        dynamicBlobAOpacity = 0.3;
        dynamicBlobBOpacity = 0.3;
      }
  
      dynamicShadow = `
        var(--shadow-color-1) 0px 4px 6px 0px,
        var(--shadow-color-2) 0px 5px 10px 0px,
        var(--shadow-color-3) 0px 0px 1px 0px inset,
        var(--shadow-color-4) 0px 1px 7px 0px inset
      `;
    }
  
    return {
      "--react-ai-orb-size": `${size * baseOrbSize}px`,
      "--shapes-size": `${size * baseShapeSize}px`,
      "--main-bg-start": palette.mainBgStart,
      "--main-bg-end": palette.mainBgEnd,
      "--shadow-color-1": palette.shadowColor1,
      "--shadow-color-2": palette.shadowColor2,
      "--shadow-color-3": palette.shadowColor3,
      "--shadow-color-4": palette.shadowColor4,
      "--main-shadow": noShadow ? "none" : dynamicShadow,
      "--shape-a-start": palette.shapeAStart,
      "--shape-a-end": palette.shapeAEnd,
      "--shape-b-start": palette.shapeBStart,
      "--shape-b-middle": palette.shapeBMiddle,
      "--shape-b-end": palette.shapeBEnd,
      "--shape-c-start": palette.shapeCStart,
      "--shape-c-middle": palette.shapeCMiddle,
      "--shape-c-end": palette.shapeCEnd,
      "--shape-d-start": palette.shapeDStart,
      "--shape-d-middle": palette.shapeDMiddle,
      "--shape-d-end": palette.shapeDEnd,
      "--blob-a-opacity": dynamicBlobAOpacity,
      "--blob-b-opacity": dynamicBlobBOpacity,
      "--animation-rotation-speed-base": `${dynamicRotationSpeed}s`,
      "--animation-hue-speed-base": `${dynamicHueSpeed}s`,
      "--hue-rotation": `${hueRotation}deg`,
      "--main-hue-animation": mainOrbHueAnimation
        ? "hueShift var(--animation-hue-speed-base) linear infinite"
        : "none",
    } as React.CSSProperties;
  }, [
    palette,
    size,
    animationSpeedBase,
    animationSpeedHue,
    hueRotation,
    mainOrbHueAnimation,
    blobAOpacity,
    blobBOpacity,
    noShadow,
    status, // <=== NEW DEPENDENCY
  ]);
  

  return (
    <div
      style={{
        ...cssVariables,
      }}
    >
      <div className="orb-main">
        <div className="glass loc-glass" />
        <div className="shape-a loc-a" />
        <div className="shape-b loc-b" />
        <div className="shape-c loc-c" />
        <div className="shape-d loc-d" />

        <SvgElements color1={palette.mainBgStart} color2={palette.mainBgEnd} />
      </div>
    </div>
  );
};

export default Orb;
