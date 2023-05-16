import { useContext, useEffect, useState } from "react";
import { FullKeys, RnaComplexProps } from "../../../App";
import { LabelLine } from "../LabelLine";
import { asAngle, distance, magnitude, subtract } from "../../../data_structures/Vector2D";
import { Context } from "../../../context/Context";
import { DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT } from "../../../utils/Constants";
import InputWithValidator from "../../generic/InputWithValidator";
import { Setting } from "../../../ui/Setting";
import { ColorEditor } from "./ColorEditor";
import { Color } from "../../../data_structures/Color";

export namespace LabelLineEditMenu {
  export type Props = {
    fullKeys : FullKeys,
    rnaComplexProps : RnaComplexProps,
    triggerRerender : () => void
  };
  
  export function Component(props : Props) {
    const {
      fullKeys,
      rnaComplexProps,
      triggerRerender
    } = props;
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex
    } = fullKeys;
    const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
    const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
    const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
    const labelLineProps = singularNucleotideProps.labelLineProps as LabelLine.ExternalProps;
    // Begin context data.
    const settingsRecord = useContext(Context.App.Settings);
    // Begin state data.
    const [
      x0,
      setX0
    ] = useState(labelLineProps.x0);
    const [
      y0,
      setY0
    ] = useState(labelLineProps.y0);
    const [
      x1,
      setX1
    ] = useState(labelLineProps.x1);
    const [
      y1,
      setY1
    ] = useState(labelLineProps.y1);
    const [
      midpointX,
      setMidpointX
    ] = useState((labelLineProps.x0 + labelLineProps.x1) * 0.5);
    const [
      midpointY,
      setMidpointY
    ] = useState((labelLineProps.y0 + labelLineProps.y1) * 0.5);
    const [
      angle,
      setAngle
    ] = useState(0);
    const [
      length,
      setLength
    ] = useState(1);
    // Begin state-relevant helper functions.
    function updateFromRadialCoordinates(angle : number, length : number) {
      const radius = length * 0.5;
      const x0MinusMidpointX = Math.cos(angle) * radius;
      const y0MinusMidpointY = Math.sin(angle) * radius;
      const newX0 = midpointX + x0MinusMidpointX;
      const newY0 = midpointY + y0MinusMidpointY;
      const newX1 = midpointX - x0MinusMidpointX;
      const newY1 = midpointY - y0MinusMidpointY;
      labelLineProps.x0 = newX0;
      labelLineProps.y0 = newY0;
      labelLineProps.x1 = newX1;
      labelLineProps.y1 = newY1;
      triggerRerender();
      setX0(newX0);
      setY0(newY0);
      setX1(newX1);
      setY1(newY1);
    }
    // Begin effects.
    useEffect(
      function() {
        const dv = subtract(
          {
            x : labelLineProps.x1,
            y : labelLineProps.y1
          },
          {
            x : labelLineProps.x0,
            y : labelLineProps.y0
          }
        );
        setAngle(asAngle(dv));
        setLength(magnitude(dv));
      },
      []
    );
    return <>
      <b>
        Edit label line for nucleotide #{nucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex} in RNA molecule "{rnaMoleculeName}" in RNA complex "{singularRnaComplexProps.name}":
      </b>
      <br/>
      <b>
        Endpoint 0:
      </b>
      <br/>
      <label>
        x:&nbsp;
        <InputWithValidator.Number
          value = {x0}
          setValue = {function(newX0) {
            setX0(newX0);
            setMidpointX((newX0 + x1) * 0.5);
            const dv = subtract(
              {
                x : x1,
                y : y1
              },
              {
                x : newX0,
                y : y0
              }
            );
            setLength(magnitude(dv));
            setAngle(asAngle(dv));
            labelLineProps.x0 = newX0;
            triggerRerender();
          }}
        />
      </label>
      <br/>
      <label>
        y:&nbsp;
        <InputWithValidator.Number
          value = {y0}
          setValue = {function(newY0) {
            setY0(newY0);
            setMidpointY((newY0 + y1) * 0.5);
            const dv = subtract(
              {
                x : x1,
                y : y1
              },
              {
                x : x0,
                y : newY0
              }
            );
            setLength(magnitude(dv));
            setAngle(asAngle(dv));
            labelLineProps.y0 = newY0;
            triggerRerender();
          }}
        />
      </label>
      <br/>
      <b>
        Endpoint 1:
      </b>
      <br/>
      <label>
        x:&nbsp;
        <InputWithValidator.Number
          value = {x1}
          setValue = {function(newX1) {
            setX1(newX1);
            setMidpointX((x0 + newX1) * 0.5);
            const dv = subtract(
              {
                x : newX1,
                y : y1
              },
              {
                x : x0,
                y : y0
              }
            );
            setLength(magnitude(dv));
            setAngle(asAngle(dv));
            labelLineProps.x1 = newX1;
            triggerRerender();
          }}
        />
      </label>
      <br/>
      <label>
        y:&nbsp;
        <InputWithValidator.Number
          value = {y1}
          setValue = {function(newY1) {
            setY1(newY1);
            setMidpointY((y0 + newY1) * 0.5);
            const dv = subtract(
              {
                x : x1,
                y : newY1
              },
              {
                x : x0,
                y : y0
              }
            );
            setLength(magnitude(dv));
            setAngle(asAngle(dv));
            labelLineProps.y1 = newY1;
            triggerRerender();
          }}
        />
      </label>
      <br/>
      <b>
        Midpoint:
      </b>
      <br/>
      <label>
        x:&nbsp;
        <InputWithValidator.Number
          value = {midpointX}
          setValue = {function(newMidpointX) {
            const newX0 = x0 - midpointX + newMidpointX;
            const newX1 = x1 - midpointX + newMidpointX;
            setMidpointX(newMidpointX);
            setX0(newX0);
            setX1(newX1);
            labelLineProps.x0 = newX0;
            labelLineProps.x1 = newX1;
            triggerRerender();
          }}
        />
      </label>
      <br/>
      <label>
        y:&nbsp;
        <InputWithValidator.Number
          value = {midpointY}
          setValue = {function(newMidpointY) {
            const newY0 = y0 - midpointY + newMidpointY;
            const newY1 = y1 - midpointY + newMidpointY;
            setMidpointY(newMidpointY);
            setY0(newY0);
            setY1(newY1);
            labelLineProps.y0 = newY0;
            labelLineProps.y1 = newY1;
            triggerRerender();
          }}
        />
      </label>
      <br/>
      <b>
        Radial:
      </b>
      <br/>
      <label>
        angle:&nbsp;
        <InputWithValidator.Angle
          value = {angle}
          setValue = {function(newAngle) {
            setAngle(newAngle);
            updateFromRadialCoordinates(
              newAngle,
              length
            );
          }}
          useDegrees = {settingsRecord[Setting.USE_DEGREES]}
        />
      </label>
      <br/>
      <label>
        length:&nbsp;
        <InputWithValidator.Number
          value = {length}
          setValue = {function(newLength) {
            setLength(newLength);
            updateFromRadialCoordinates(
              angle,
              newLength
            );
          }}
          min = {0}
        />
      </label>
      <br/>
      <ColorEditor.Component
        setColorHelper = {function(newColor : Color) {
          labelLineProps.color = newColor;
          triggerRerender();
        }}
        color = {labelLineProps.color}
      />
    </>;
  }
}