import { RnaComplexProps, FullKeys, DragListener } from "../../../App";
import { BasePairKeysToRerender, NucleotideKeysToRerender, NucleotideKeysToRerenderPerRnaMolecule } from "../../../context/Context";
import { Circle, getBoundingCircle } from "../../../data_structures/Geometry";
import { Vector2D, add, toCartesian, crossProduct, subtract, asAngle } from "../../../data_structures/Vector2D";
import { sign } from "../../../utils/Utils";
import { interpolationDrag, linearDrag } from "../CommonDragListeners";
import { AbstractInteractionConstraint, basePairedNucleotideError } from "../AbstractInteractionConstraint";
import { RnaSingleStrandInteractionConstraintEditMenu } from "../../../components/app_specific/edit_menus/RnaSingleStrandInteractionConstraintEditMenu";

export const TWO_PI = 2 * Math.PI;

type RepositioningData = {
  boundingCircle : Circle,
  angleTraversal : number,
  beginningAngle : number
}

function repositionNucleotidesHelper(
  repositioningData : RepositioningData,
  lowerBoundingNucleotideArrayIndex : number,
  upperBoundingNucleotideArrayIndex : number,
  toBeDragged : Array<Vector2D>
) {
  let angleDelta = repositioningData.angleTraversal / (upperBoundingNucleotideArrayIndex - lowerBoundingNucleotideArrayIndex);
  let angle = repositioningData.beginningAngle + angleDelta;
  toBeDragged.forEach((toBeDraggedI : Vector2D) => {
    const newPosition = add(
      repositioningData.boundingCircle.center,
      toCartesian({
        angle,
        radius : repositioningData.boundingCircle.radius
      })
    );
    toBeDraggedI.x = newPosition.x;
    toBeDraggedI.y = newPosition.y;
    angle += angleDelta;
  });
}

function calculateRepositioningData(
  clickedOnNucleotidePosition : Vector2D,
  lowerBoundingNucleotidePosition : Vector2D,
  upperBoundingNucleotidePosition : Vector2D,
  flipAngleTraversalCondition : () => boolean
) {
  let boundingCircle = getBoundingCircle(
    clickedOnNucleotidePosition,
    lowerBoundingNucleotidePosition,
    upperBoundingNucleotidePosition
  );
  return {
    ...getBeginningAngleAndAngleTraversalHelper(
      boundingCircle.center,
      lowerBoundingNucleotidePosition,
      upperBoundingNucleotidePosition,
      flipAngleTraversalCondition
    ),
    boundingCircle
  };
}

function flipAngleTraversalCondition(
  clickedOnNucleotidePosition : Vector2D,
  lowerBoundingNucleotidePosition : Vector2D,
  upperBoundingNucleotidePosition : Vector2D
) {
  return sign(
    crossProduct(
      subtract(
        clickedOnNucleotidePosition,
        lowerBoundingNucleotidePosition
      ),
      subtract(
        upperBoundingNucleotidePosition,
        lowerBoundingNucleotidePosition
      )
    )
  ) < 0;
}

function getBeginningAngleAndAngleTraversalHelper(
  boundingCircleCenter : Vector2D,
  lowerBoundingNucleotidePosition : Vector2D,
  upperBoundingNucleotidePosition : Vector2D,
  flipAngleTraversalCondition : (angleTraversal : number) => boolean
) {
  let lowerBoundingNucleotidePositionDifference = subtract(lowerBoundingNucleotidePosition, boundingCircleCenter);
  let upperBoundingNucleotidePositionDifference = subtract(upperBoundingNucleotidePosition, boundingCircleCenter);
  let beginningAngle = asAngle(lowerBoundingNucleotidePositionDifference);
  let endingAngle = asAngle(upperBoundingNucleotidePositionDifference);
  let angleTraversal = (endingAngle - beginningAngle + TWO_PI) % TWO_PI;
  if (flipAngleTraversalCondition(angleTraversal)) {
    angleTraversal = flipAngleTraversalHelper(angleTraversal);
  }
  return {
    beginningAngle,
    angleTraversal 
  };
}

function flipAngleTraversalHelper(angleTraversal : number) {
  if (angleTraversal < 0) {
    return angleTraversal + TWO_PI;
  } else {
    return angleTraversal - TWO_PI;
  }
}

export class RnaSingleStrandInteractionConstraint extends AbstractInteractionConstraint {
  private readonly dragListener : DragListener;

  constructor(
    rnaComplexProps : RnaComplexProps,
    fullKeys : FullKeys,
    setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void,
    setBasePairKeysToRerender : (basePairKeysToRerender : BasePairKeysToRerender) => void,
    setDebugVisualElements : (debugVisualElements : Array<JSX.Element>) => void
  ) {
    super(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements
    );
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex
    } = this.fullKeys;
    const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
    const basePairsPerRnaMolecule = singularRnaComplexProps.basePairs[rnaMoleculeName] ?? {};
    if (nucleotideIndex in basePairsPerRnaMolecule) {
      throw basePairedNucleotideError;
    }
    const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
    const toBeDragged = new Array<Vector2D>();
    const nucleotideKeysToRerenderPerRnaMolecule : NucleotideKeysToRerenderPerRnaMolecule = [];
    const nucleotideKeysToRerender : NucleotideKeysToRerender = {
      [rnaComplexIndex] : {
        [rnaMoleculeName] : nucleotideKeysToRerenderPerRnaMolecule
      }
    };
    let lowerBoundingNucleotideIndex = nucleotideIndex;
    let lowerTerminalIsBasePairedFlag : boolean;
    let lowerBoundingNucleotidePosition : Vector2D = {
      x : 0,
      y : 0
    };
    for (;;) {
      let decremented = lowerBoundingNucleotideIndex - 1;
      lowerBoundingNucleotideIndex = decremented;
      if (!(decremented in singularRnaMoleculeProps.nucleotideProps)) {
        lowerTerminalIsBasePairedFlag = false;
        break;
      }
      const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[decremented];
      if (decremented in basePairsPerRnaMolecule) {
        lowerBoundingNucleotidePosition = singularNucleotideProps;
        lowerTerminalIsBasePairedFlag = true;
        break;
      }
      nucleotideKeysToRerenderPerRnaMolecule.unshift(decremented);
      toBeDragged.unshift(singularNucleotideProps);
    }
    let indexWithinToBeDragged = toBeDragged.length;
    nucleotideKeysToRerenderPerRnaMolecule.push(nucleotideIndex);
    toBeDragged.push(singularRnaMoleculeProps.nucleotideProps[nucleotideIndex]);
    let upperBoundingNucleotideIndex = nucleotideIndex;
    let upperTerminalIsBasePairedFlag : boolean;
    let upperBoundingNucleotidePosition : Vector2D = {
      x : 0,
      y : 0
    };
    for (;;) {
      let incremented = upperBoundingNucleotideIndex + 1;
      upperBoundingNucleotideIndex = incremented;
      if (!(incremented in singularRnaMoleculeProps.nucleotideProps)) {
        upperTerminalIsBasePairedFlag = false;
        break;
      }
      const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[incremented];
      if (incremented in basePairsPerRnaMolecule) {
        upperBoundingNucleotidePosition = singularNucleotideProps;
        upperTerminalIsBasePairedFlag = true;
        break;
      }
      nucleotideKeysToRerenderPerRnaMolecule.push(incremented);
      toBeDragged.push(singularNucleotideProps);
    }
    const draggedNucleotideProps = toBeDragged[indexWithinToBeDragged];
    const initialDrag = {
      x : draggedNucleotideProps.x,
      y : draggedNucleotideProps.y
    };
    if (lowerTerminalIsBasePairedFlag !== upperTerminalIsBasePairedFlag) {
      let anchor : Vector2D;
      if (lowerTerminalIsBasePairedFlag) {
        anchor = lowerBoundingNucleotidePosition;
      } else {
        // Reverse toBeDragged, indexWithinToBeDragged,
        toBeDragged.reverse();
        indexWithinToBeDragged = toBeDragged.length - indexWithinToBeDragged - 1;
        anchor = upperBoundingNucleotidePosition;
      }
      this.dragListener = interpolationDrag(
        initialDrag,
        toBeDragged,
        indexWithinToBeDragged,
        anchor,
        function() {
          setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
        }
      );
    }
    if (!lowerTerminalIsBasePairedFlag) {
      this.dragListener = linearDrag(
        initialDrag,
        toBeDragged,
        function() {
          setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender))
        }
      );
    }
    this.dragListener = {
      initiateDrag() {
        return initialDrag;
      },
      continueDrag(totalDrag : Vector2D) {
        const repositioningData = calculateRepositioningData(
          totalDrag,
          lowerBoundingNucleotidePosition,
          upperBoundingNucleotidePosition,
          function() {
            return flipAngleTraversalCondition(
              totalDrag,
              lowerBoundingNucleotidePosition,
              upperBoundingNucleotidePosition
            );
          }
        );
        repositionNucleotidesHelper(
          repositioningData,
          lowerBoundingNucleotideIndex,
          upperBoundingNucleotideIndex,
          toBeDragged
        );
        setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
      }
    };
  }

  public override drag() {
    return this.dragListener;
  }

  public override createRightClickMenu() {
    return <RnaSingleStrandInteractionConstraintEditMenu.Component
    />;
  }
}