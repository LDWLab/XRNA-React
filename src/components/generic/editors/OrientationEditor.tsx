import { useEffect, useMemo, useState } from "react";
import { Vector2D, add, asAngle, distance, orthogonalizeLeft, projectAndReject, scaleUp, subtract, toCartesian, toPolar } from "../../../data_structures/Vector2D";
import InputWithValidator from "../InputWithValidator";

export namespace OrientationEditor {
  export type Props = {
    initialCenter : Vector2D,
    positions : Array<Vector2D>,
    onUpdatePositions : () => void,
    useDegreesFlag : boolean,
    normal : Vector2D,
    initialAngle? : number | undefined,
    initialScale? : number | undefined,
    disabledFlag? : boolean | undefined
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
      disabledFlag
    } = props;
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
      const center = {
        x : centerX,
        y : centerY
      };
      const angleDelta = angle - initialAngleNullCoalesced;
      const totalScale = scale * initialScaleNullCoalescedReciprocal;
      for (let i = 0; i < positions.length; i++) {
        let positionI = positions[i];
        let polarCoordinateI = {
          ...polarCoordinates[i]
        };
        polarCoordinateI.angle += angleDelta;
        polarCoordinateI.radius *= totalScale;
        let cartesianI = add(
          toCartesian(polarCoordinateI),
          center
        );
        positionI.x = cartesianI.x;
        positionI.y = cartesianI.y;
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
        for (let i = 0; i < positions.length; i++) {
          // This position has already been rotated.
          let positionI = positions[i];
          let projectionAndRejection = projectAndReject(
            subtract(
              positionI,
              center
            ),
            rotatedNormal
          );
          let flippedPositionI = add(
            subtract(
              projectionAndRejection.projection,
              projectionAndRejection.rejection
            ),
            center
          );
          positionI.x = flippedPositionI.x;
          positionI.y = flippedPositionI.y;
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
    disabledFlag? : boolean | undefined
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
      disabledFlag
    } = props;
    const normal = (orthogonalizeHelper ?? orthogonalizeLeft)(subtract(
      boundingVector1,
      boundingVector0
    ));
    // Begin memo data.
    const initialCenter = useMemo(
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
        boundingVector1
      ]
    );
    return <Component
      initialCenter = {initialCenter}
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
    />
  }
}