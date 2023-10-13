import { useEffect, useMemo, useState } from "react";
import { FullKeys, RnaComplexProps } from "../../../../App";
import { LabelLine } from "../../LabelLine";
import { asAngle, magnitude, negate, orthogonalize } from "../../../../data_structures/Vector2D";
import InputWithValidator from "../../../generic/InputWithValidator";
import { ColorEditor } from "../../../generic/editors/ColorEditor";
import { Color } from "../../../../data_structures/Color";
import { AppSpecificOrientationEditor } from "../../editors/AppSpecificOrientationEditor";

export namespace LabelLineEditMenu {
  export type Props = {
    fullKeys : FullKeys,
    rnaComplexProps : RnaComplexProps,
    triggerRerender : () => void
  };
  
  export function Component(props : Props) {
    const {
      fullKeys,
      rnaComplexProps
    } = props;
    const _triggerRerender = props.triggerRerender;
    function triggerRerender(recalculateRenderDataFlag : boolean) {
      if (recalculateRenderDataFlag) {
        // Trigger re-calculation of renderData belonging to the LabelLine.Component.
        labelLineProps.points = [...labelLineProps.points];
      }
      _triggerRerender();
    }
    // Begin state data.
    const [
      pointIndex,
      setPointIndex
    ] = useState(1);
    const [
      x,
      setX
    ] = useState(0);
    const [
      y,
      setY
    ] = useState(0);
    const [
      orientationEditorProps,
      setOrientationEditorProps
    ] = useState<AppSpecificOrientationEditor.Props | undefined>(undefined);
    function updateOrientationEditorProps() {
      const point0 = points[0];
      setOrientationEditorProps({
        initialCenter : {
          x : 0,
          y : 0
        },
        positions : points,
        onUpdatePositions : function() {
          triggerRerender(true);
          setX(point.x);
          setY(point.y);
        },
        normal : orthogonalize(point0),
        initialAngle : asAngle(point0),
        initialScale : magnitude(point0)
      });
      // setOrientationEditorProps({
      //   boundingVector0 : negate(points[0]),
      //   boundingVector1 : structuredClone(points[0]),
      //   positions : points,
      //   onUpdatePositions : function() {
      //     triggerRerender(true);
      //     setX(point.x);
      //     setY(point.y);
      //   }
      // });
    }
    // Begin memo data.
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex,
      singularRnaComplexProps,
      singularRnaMoleculeProps,
      singularNucleotideProps,
      labelLineProps,
      points
    } = useMemo(
      function() {
        const {
          rnaComplexIndex,
          rnaMoleculeName,
          nucleotideIndex
        } = fullKeys;
        const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
        const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
        const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
        const labelLineProps = singularNucleotideProps.labelLineProps as LabelLine.ExternalProps;
        const points = labelLineProps.points;
        return {
          ...fullKeys,
          singularRnaComplexProps,
          singularRnaMoleculeProps,
          singularNucleotideProps,
          labelLineProps,
          points
        }
      },
      [fullKeys]
    );
    const point = useMemo(
      function() {
        const normalizedPointIndex = pointIndex - 1;
        return points[normalizedPointIndex];
      },
      [
        pointIndex,
        points
      ]
    );
    useEffect(
      updateOrientationEditorProps,
      [fullKeys]
    );
    // Begin effects.
    useEffect(
      function() {
        setX(point.x);
        setY(point.y);
      },
      [point]
    );
    useEffect(
      function() {
        if (pointIndex > points.length) {
          setPointIndex(points.length);
        }
      },
      [fullKeys]
    );
    return <>
      <b>
        Edit label line for nucleotide #{nucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex} in RNA molecule "{rnaMoleculeName}" in RNA complex "{singularRnaComplexProps.name}"
      </b>
      <br/>
      <label>
        Edit vertex #&nbsp;
        <InputWithValidator.Integer
          value = {pointIndex}
          setValue = {setPointIndex}
          min = {1}
          max = {points.length}
        />
      </label>
      <br/>
      <label>
        x:&nbsp;
        <InputWithValidator.Number
          value = {x}
          setValue = {function(newX) {
            setX(newX);
            point.x = newX;
            triggerRerender(true);
            updateOrientationEditorProps();
          }}
        />
      </label>
      <br/>
      <label>
        y:&nbsp;
        <InputWithValidator.Number
          value = {y}
          setValue = {function(newY) {
            setY(newY);
            point.y = newY;
            triggerRerender(true);
            updateOrientationEditorProps();
          }}
        />
      </label>
      {orientationEditorProps && <AppSpecificOrientationEditor.Component
        {...orientationEditorProps}
      />}
      {/* {orientationEditorProps && <AppSpecificOrientationEditor.Simplified
        {...orientationEditorProps}
      />} */}
      <ColorEditor.Component
        setColorHelper = {function(newColor : Color) {
          labelLineProps.color = newColor;
          triggerRerender(false);
        }}
        color = {labelLineProps.color}
      />
    </>;
    // const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
    // const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
    // const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
    // const labelLineProps = singularNucleotideProps.labelLineProps as LabelLine.ExternalProps;
    // // Begin context data.
    // const settingsRecord = useContext(Context.App.Settings);
    // // Begin state data.
    // const [
    //   x0,
    //   setX0
    // ] = useState(labelLineProps.x0);
    // const [
    //   y0,
    //   setY0
    // ] = useState(labelLineProps.y0);
    // const [
    //   x1,
    //   setX1
    // ] = useState(labelLineProps.x1);
    // const [
    //   y1,
    //   setY1
    // ] = useState(labelLineProps.y1);
    // const [
    //   midpointX,
    //   setMidpointX
    // ] = useState((labelLineProps.x0 + labelLineProps.x1) * 0.5);
    // const [
    //   midpointY,
    //   setMidpointY
    // ] = useState((labelLineProps.y0 + labelLineProps.y1) * 0.5);
    // const [
    //   angle,
    //   setAngle
    // ] = useState(0);
    // const [
    //   length,
    //   setLength
    // ] = useState(1);
    // // Begin state-relevant helper functions.
    // function updateFromRadialCoordinates(angle : number, length : number) {
    //   const radius = length * 0.5;
    //   const x0MinusMidpointX = Math.cos(angle) * radius;
    //   const y0MinusMidpointY = Math.sin(angle) * radius;
    //   const newX0 = midpointX + x0MinusMidpointX;
    //   const newY0 = midpointY + y0MinusMidpointY;
    //   const newX1 = midpointX - x0MinusMidpointX;
    //   const newY1 = midpointY - y0MinusMidpointY;
    //   labelLineProps.x0 = newX0;
    //   labelLineProps.y0 = newY0;
    //   labelLineProps.x1 = newX1;
    //   labelLineProps.y1 = newY1;
    //   triggerRerender();
    //   setX0(newX0);
    //   setY0(newY0);
    //   setX1(newX1);
    //   setY1(newY1);
    // }
    // // Begin effects.
    // useEffect(
    //   function() {
    //     const dv = subtract(
    //       {
    //         x : labelLineProps.x1,
    //         y : labelLineProps.y1
    //       },
    //       {
    //         x : labelLineProps.x0,
    //         y : labelLineProps.y0
    //       }
    //     );
    //     setAngle(asAngle(dv));
    //     setLength(magnitude(dv));
    //   },
    //   []
    // );
    // return <>
    //   <b>
    //     Edit label line for nucleotide #{nucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex} in RNA molecule "{rnaMoleculeName}" in RNA complex "{singularRnaComplexProps.name}":
    //   </b>
    //   <br/>
    //   <b>
    //     Endpoint 0:
    //   </b>
    //   <br/>
    //   <label>
    //     x:&nbsp;
    //     <InputWithValidator.Number
    //       value = {x0}
    //       setValue = {function(newX0) {
    //         setX0(newX0);
    //         setMidpointX((newX0 + x1) * 0.5);
    //         const dv = subtract(
    //           {
    //             x : x1,
    //             y : y1
    //           },
    //           {
    //             x : newX0,
    //             y : y0
    //           }
    //         );
    //         setLength(magnitude(dv));
    //         setAngle(asAngle(dv));
    //         labelLineProps.x0 = newX0;
    //         triggerRerender();
    //       }}
    //     />
    //   </label>
    //   <br/>
    //   <label>
    //     y:&nbsp;
    //     <InputWithValidator.Number
    //       value = {y0}
    //       setValue = {function(newY0) {
    //         setY0(newY0);
    //         setMidpointY((newY0 + y1) * 0.5);
    //         const dv = subtract(
    //           {
    //             x : x1,
    //             y : y1
    //           },
    //           {
    //             x : x0,
    //             y : newY0
    //           }
    //         );
    //         setLength(magnitude(dv));
    //         setAngle(asAngle(dv));
    //         labelLineProps.y0 = newY0;
    //         triggerRerender();
    //       }}
    //     />
    //   </label>
    //   <br/>
    //   <b>
    //     Endpoint 1:
    //   </b>
    //   <br/>
    //   <label>
    //     x:&nbsp;
    //     <InputWithValidator.Number
    //       value = {x1}
    //       setValue = {function(newX1) {
    //         setX1(newX1);
    //         setMidpointX((x0 + newX1) * 0.5);
    //         const dv = subtract(
    //           {
    //             x : newX1,
    //             y : y1
    //           },
    //           {
    //             x : x0,
    //             y : y0
    //           }
    //         );
    //         setLength(magnitude(dv));
    //         setAngle(asAngle(dv));
    //         labelLineProps.x1 = newX1;
    //         triggerRerender();
    //       }}
    //     />
    //   </label>
    //   <br/>
    //   <label>
    //     y:&nbsp;
    //     <InputWithValidator.Number
    //       value = {y1}
    //       setValue = {function(newY1) {
    //         setY1(newY1);
    //         setMidpointY((y0 + newY1) * 0.5);
    //         const dv = subtract(
    //           {
    //             x : x1,
    //             y : newY1
    //           },
    //           {
    //             x : x0,
    //             y : y0
    //           }
    //         );
    //         setLength(magnitude(dv));
    //         setAngle(asAngle(dv));
    //         labelLineProps.y1 = newY1;
    //         triggerRerender();
    //       }}
    //     />
    //   </label>
    //   <br/>
    //   <b>
    //     Midpoint:
    //   </b>
    //   <br/>
    //   <label>
    //     x:&nbsp;
    //     <InputWithValidator.Number
    //       value = {midpointX}
    //       setValue = {function(newMidpointX) {
    //         const newX0 = x0 - midpointX + newMidpointX;
    //         const newX1 = x1 - midpointX + newMidpointX;
    //         setMidpointX(newMidpointX);
    //         setX0(newX0);
    //         setX1(newX1);
    //         labelLineProps.x0 = newX0;
    //         labelLineProps.x1 = newX1;
    //         triggerRerender();
    //       }}
    //     />
    //   </label>
    //   <br/>
    //   <label>
    //     y:&nbsp;
    //     <InputWithValidator.Number
    //       value = {midpointY}
    //       setValue = {function(newMidpointY) {
    //         const newY0 = y0 - midpointY + newMidpointY;
    //         const newY1 = y1 - midpointY + newMidpointY;
    //         setMidpointY(newMidpointY);
    //         setY0(newY0);
    //         setY1(newY1);
    //         labelLineProps.y0 = newY0;
    //         labelLineProps.y1 = newY1;
    //         triggerRerender();
    //       }}
    //     />
    //   </label>
    //   <br/>
    //   <b>
    //     Radial:
    //   </b>
    //   <br/>
    //   <label>
    //     angle:&nbsp;
    //     <InputWithValidator.Angle
    //       value = {angle}
    //       setValue = {function(newAngle) {
    //         setAngle(newAngle);
    //         updateFromRadialCoordinates(
    //           newAngle,
    //           length
    //         );
    //       }}
    //       useDegreesFlag = {settingsRecord[Setting.USE_DEGREES] as boolean}
    //     />
    //   </label>
    //   <br/>
    //   <label>
    //     length:&nbsp;
    //     <InputWithValidator.Number
    //       value = {length}
    //       setValue = {function(newLength) {
    //         setLength(newLength);
    //         updateFromRadialCoordinates(
    //           angle,
    //           newLength
    //         );
    //       }}
    //       min = {0}
    //     />
    //   </label>
    //   <br/>
    //   <ColorEditor.Component
    //     setColorHelper = {function(newColor : Color) {
    //       labelLineProps.color = newColor;
    //       triggerRerender();
    //     }}
    //     color = {labelLineProps.color}
    //   />
    // </>;
  }
}