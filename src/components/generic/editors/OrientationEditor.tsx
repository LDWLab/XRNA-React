import { useContext, useEffect, useMemo, useState } from "react";
import { Vector2D, add, asAngle, distance, orthogonalizeLeft, projectAndReject, scaleUp, subtract, toCartesian, toPolar } from "../../../data_structures/Vector2D";
import InputWithValidator from "../InputWithValidator";
import { Context } from "../../../context/Context";

export namespace OrientationEditor {
  export type Props = {
    initialCenter : Vector2D,
    positions : Array<Vector2D>,
    onUpdatePositions : () => void,
    useDegreesFlag : boolean,
    normal : Vector2D,
    initialAngle? : number | undefined,
    initialScale? : number | undefined,
    disabledFlag? : boolean | undefined,
    relativePositions? : Array<Vector2D>,
    applyCenterToRelativePositionsFlag? : boolean
  };

  export function Component(props : Props) {
    const {
      initialCenter,
      positions,
      onUpdatePositions,
      useDegreesFlag,
      normal,
      initialAngle,
      initialScale,
      disabledFlag,
      relativePositions,
      applyCenterToRelativePositionsFlag
    } = props;
    // Begin context data.
    const resetDataTrigger = useContext(Context.OrientationEditor.ResetDataTrigger);
    // Begin memo data.
    const initialAngleNullCoalesced = useMemo(
      function() {
        return initialAngle ?? 0;
      },
      [initialAngle]
    );
    const initialScaleNullCoalesced = useMemo(
      function() {
        return initialScale ?? 1;
      },
      [initialScale]
    );
    const initialScaleNullCoalescedReciprocal = useMemo(
      function() {
        return 1 / initialScaleNullCoalesced;
      },
      [initialScaleNullCoalesced]
    );
    const polarCoordinates = useMemo(
      function() {
        return positions.map(function(position : Vector2D) {
          const transform = toPolar(subtract(
            position,
            initialCenter
          ));
          return transform;
        });
      },
      [
        initialCenter,
        positions
      ]
    );
    const polarCoordinatesOfRelativeCoordinates = useMemo(
      function() {
        return (relativePositions ?? []).map(toPolar);
      },
      [
        relativePositions,
        resetDataTrigger
      ]
    );
    const disabledFlagNullCoalesced = useMemo(
      function() {
        return disabledFlag ?? false
      },
      [disabledFlag]
    );
    // Begin state data.
    const [
      angle,
      setAngle
    ] = useState(initialAngleNullCoalesced);
    const [
      scale,
      setScale
    ] = useState(initialScaleNullCoalesced);
    const [
      centerX,
      setCenterX
    ] = useState(initialCenter.x);
    const [
      centerY,
      setCenterY
    ] = useState(initialCenter.y);
    const [
      flipPositionsFlag,
      setFlipPositionsFlag
    ] = useState(false);
    function updatePositionsHelper(
      centerX : number,
      centerY : number,
      angle : number,
      scale : number,
      flipPositions : boolean
    ) {
      const angleDelta = angle - initialAngleNullCoalesced;
      const totalScale = scale * initialScaleNullCoalescedReciprocal;
      const cartesianCenter = {
        x : centerX,
        y : centerY
      };
      const metaArray = [
        { 
          cartesian : positions,
          polar : polarCoordinates,
          cartesianCenter
        }
      ];
      if (relativePositions !== undefined) {
        metaArray.push({
          cartesian : relativePositions,
          polar : polarCoordinatesOfRelativeCoordinates,
          cartesianCenter : applyCenterToRelativePositionsFlag ? cartesianCenter : {
            x : 0,
            y : 0
          }
        });
      }
      for (const { cartesian, polar, cartesianCenter } of metaArray) {
        for (let i = 0; i < cartesian.length; i++) {
          let cartesianI = cartesian[i];
          let polarI = structuredClone(polar[i]);
          polarI.angle += angleDelta;
          polarI.radius *= totalScale;
          let recenteredCartesianI = add(
            toCartesian(polarI),
            cartesianCenter
          );
          cartesianI.x = recenteredCartesianI.x;
          cartesianI.y = recenteredCartesianI.y;
        }
        if (flipPositions) {
          // rotate(x) = R(theta) * x

          // = [cos(theta) -sin(theta)] * [x]
          //   [sin(theta)  cos(theta)]   [y]

          // = [x * cos(theta) - y * sin(theta)]
          //   [x * sin(theta) + y * cos(theta)]
          const cos = Math.cos(angleDelta);
          const sin = Math.sin(angleDelta);
          const rotatedNormal : Vector2D = {
            x : normal.x * cos - normal.y * sin,
            y : normal.x * sin + normal.y * cos
          };
          for (let i = 0; i < cartesian.length; i++) {
            // This position has already been rotated.
            let cartesianI = cartesian[i];
            let projectionAndRejection = projectAndReject(
              subtract(
                cartesianI,
                cartesianCenter
              ),
              rotatedNormal
            );
            let flippedPositionI = add(
              subtract(
                projectionAndRejection.projection,
                projectionAndRejection.rejection
              ),
              cartesianCenter
            );
            cartesianI.x = flippedPositionI.x;
            cartesianI.y = flippedPositionI.y;
          }
        }
      }
      onUpdatePositions();
    }
    // Begin effects.
    useEffect(
      function() {
        setAngle(initialAngleNullCoalesced);
      },
      [initialAngleNullCoalesced]
    );
    useEffect(
      function() {
        setScale(initialScaleNullCoalesced);
      },
      [initialScaleNullCoalesced]
    );
    useEffect(
      function() {
        setCenterX(initialCenter.x);
        setCenterY(initialCenter.y);
      },
      [initialCenter]
    );
    useEffect(
      function() {
        setFlipPositionsFlag(false);
        setAngle(initialAngleNullCoalesced);
        setScale(initialScaleNullCoalesced);
        setCenterX(initialCenter.x);
        setCenterY(initialCenter.y);
      },
      [resetDataTrigger]
    );
    return <>
      <label>
        x:&nbsp;
        <InputWithValidator.Number
          value = {centerX}
          setValue = {function(newCenterX : number) {
            setCenterX(newCenterX);
            updatePositionsHelper(
              newCenterX,
              centerY,
              angle,
              scale,
              flipPositionsFlag
            );
          }}
          disabledFlag = {disabledFlagNullCoalesced}
        />
      </label>
      <br/>
      <label>
        y:&nbsp;
        <InputWithValidator.Number
          value = {centerY}
          setValue = {function(newCenterY : number) {
            setCenterY(newCenterY);
            updatePositionsHelper(
              centerX,
              newCenterY,
              angle,
              scale,
              flipPositionsFlag
            );
          }}
          disabledFlag = {disabledFlagNullCoalesced}
        />
      </label>
      <br/>
      <label>
        θ:&nbsp;
        <InputWithValidator.Angle
          value = {angle}
          setValue = {function(newAngle : number) {
            setAngle(newAngle);
            updatePositionsHelper(
              centerX,
              centerY,
              newAngle,
              scale,
              flipPositionsFlag
            );
          }}
          useDegreesFlag = {useDegreesFlag}
          disabledFlag = {disabledFlagNullCoalesced}
        />
      </label>
      <br/>
      <label>
        scale:&nbsp;
        <InputWithValidator.Number
          value = {scale}
          setValue = {function(newScale : number) {
            setScale(newScale);
            updatePositionsHelper(
              centerX,
              centerY,
              angle,
              newScale,
              flipPositionsFlag
            );
          }}
          disabledFlag = {disabledFlagNullCoalesced}
        />
      </label>
      <br/>
      <button
        onClick = {function() {
          const newFlipPositionsFlag = !flipPositionsFlag;
          setFlipPositionsFlag(newFlipPositionsFlag)
          updatePositionsHelper(
            centerX,
            centerY,
            angle,
            scale,
            newFlipPositionsFlag
          );
        }}
        disabled = {disabledFlagNullCoalesced}
      >
        Flip
      </button>
    </>;
  }

  export type SimplifiedProps = {
    boundingVector0 : Vector2D,
    boundingVector1 : Vector2D,
    positions : Array<Vector2D>,
    onUpdatePositions : () => void,
    useDegreesFlag : boolean,
    orthogonalizeHelper? : ((v : Vector2D) => Vector2D) | undefined,
    initialAngle? : number | undefined,
    initialScale? : number | undefined,
    disabledFlag? : boolean | undefined,
    relativePositions? : Array<Vector2D>
  };

  export function Simplified(props : SimplifiedProps) {
    const {
      boundingVector0,
      boundingVector1,
      positions,
      onUpdatePositions,
      useDegreesFlag,
      orthogonalizeHelper,
      initialAngle,
      initialScale,
      disabledFlag,
      relativePositions
    } = props;
    // Begin context data.
    const resetDataTrigger = useContext(Context.OrientationEditor.ResetDataTrigger);
    // Begin memo data.
    const normal = useMemo(
      function() {
        return (orthogonalizeHelper ?? orthogonalizeLeft)(subtract(
          boundingVector1,
          boundingVector0
        ));
      },
      [
        orthogonalizeHelper,
        boundingVector0,
        boundingVector1,
        resetDataTrigger
      ]
    );
    const center = useMemo(
      function() {
        return scaleUp(
          add(
            boundingVector0,
            boundingVector1
          ),
          0.5
        );
      },
      [
        boundingVector0,
        boundingVector1,
        resetDataTrigger
      ]
    );
    return <Component
      initialCenter = {center}
      positions = {positions}
      onUpdatePositions = {onUpdatePositions}
      useDegreesFlag = {useDegreesFlag}
      normal = {normal}
      initialAngle = {initialAngle ?? asAngle(normal)}
      initialScale = {initialScale ?? distance(
        boundingVector0,
        boundingVector1
      )}
      disabledFlag = {disabledFlag}
      relativePositions = {relativePositions}
    />
  }
}