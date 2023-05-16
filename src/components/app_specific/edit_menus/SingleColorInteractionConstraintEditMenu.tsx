import { useMemo, useState } from "react";
import InputWithValidator from "../../generic/InputWithValidator";
import { Vector2D, add, subtract } from "../../../data_structures/Vector2D";

export namespace SingleColorInteractionConstraintEditMenu {
  export type Props = Vector2D & {
    toBeDragged : Array<Vector2D>,
    rerender : () => void
  };

  export function Component(props : Props) {
    const {
      toBeDragged,
      rerender
    } = props;
    // Begin state data.
    const [
      x,
      setX
    ] = useState(props.x);
    const [
      y,
      setY
    ] = useState(props.y);
    const deltas = useMemo(
      function() {
        return props.toBeDragged.map(function(toBeDraggedI) {
          return subtract(
            toBeDraggedI,
            props
          );
        });
      },
      []
    );
    return <>
      <label>
        x:&nbsp;
        <InputWithValidator.Number
          value = {x}
          setValue = {function(newX : number) {
            setX(newX);
            for (let i = 0; i < toBeDragged.length; i++) {
              toBeDragged[i].x = newX + deltas[i].x;
            }
            rerender();
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
            for (let i = 0; i < toBeDragged.length; i++) {
              toBeDragged[i].y = newY + deltas[i].y;
            }
            rerender();
          }}
        />
      </label>
    </>;
  }
}