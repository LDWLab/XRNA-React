import { DragListener } from "../../App";
import { Vector2D, add, scaleUp, subtract } from "../../data_structures/Vector2D";

export function linearDrag(
  initialDrag : Vector2D,
  toBeDragged : Array<Vector2D>,
  rerender : () => void
) : DragListener {
  const deltas = toBeDragged.map(function(toBeDraggedI) {
    return subtract(toBeDraggedI, initialDrag);
  });
  const length = toBeDragged.length;
  return {
    initiateDrag() {
      return initialDrag;
    },
    continueDrag(totalDrag) {
      for (let i = 0; i < length; i++) {
        const delta = deltas[i];
        const toBeDraggedI = toBeDragged[i];
        toBeDraggedI.x = totalDrag.x + delta.x;
        toBeDraggedI.y = totalDrag.y + delta.y;
      }
      rerender();
    }
  };
}

export function interpolationDrag(
  initialDrag : Vector2D,
  toBeDragged : Array<Vector2D>,
  indexWithinToBeDragged : number,
  anchor : Vector2D,
  rerender : () => void
) : DragListener {
  const differenceScalar = 1 / (indexWithinToBeDragged + 1);
  const length = toBeDragged.length;
  return {
    initiateDrag() {
      return initialDrag;
    },
    continueDrag(totalDrag) {
      const difference = subtract(totalDrag, anchor);
      const differenceDelta = scaleUp(difference, differenceScalar);
      let position = anchor;
      for (let i = 0; i < length; i++) {
        const toBeDraggedI = toBeDragged[i];
        toBeDraggedI.x = position.x;
        toBeDraggedI.y = position.y;
        position = add(position, differenceDelta);
        toBeDraggedI.x = position.x;
        toBeDraggedI.y = position.y;
      }
      rerender();
    }
  };
};