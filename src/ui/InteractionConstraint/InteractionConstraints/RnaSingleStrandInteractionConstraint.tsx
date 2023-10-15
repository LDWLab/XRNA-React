import { RnaComplexProps, FullKeys, DragListener } from "../../../App";
import { BasePairKeysToRerender, NucleotideKeysToRerender, NucleotideKeysToRerenderPerRnaMolecule } from "../../../context/Context";
import { Circle, getBoundingCircle } from "../../../data_structures/Geometry";
import { Vector2D, add, toCartesian, crossProduct, subtract, asAngle, scaleDown, normalize, scaleUp, dotProduct, orthogonalizeRight, distance } from "../../../data_structures/Vector2D";
import { sign } from "../../../utils/Utils";
import { interpolationDrag, linearDrag } from "../CommonDragListeners";
import { AbstractInteractionConstraint, basePairedNucleotideError } from "../AbstractInteractionConstraint";
import { RnaSingleStrandInteractionConstraintEditMenu } from "../../../components/app_specific/menus/edit_menus/RnaSingleStrandInteractionConstraintEditMenu";
import { Nucleotide } from "../../../components/app_specific/Nucleotide";
import { InteractionConstraint } from "../InteractionConstraints";
import { Tab } from "../../../app_data/Tab";
import { BasePairsEditor } from "../../../components/app_specific/editors/BasePairsEditor";
import { NucleotideRegionsAnnotateMenu } from "../../../components/app_specific/menus/annotate_menus/NucleotideRegionsAnnotateMenu";
import Color, { BLACK, areEqual } from "../../../data_structures/Color";

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
  private readonly partialMenuHeader : JSX.Element;
  private readonly initialDisplacementAlongNormal : number;
  private readonly updateSingleStrandPositions : (
    orientation : RnaSingleStrandInteractionConstraintEditMenu.Orientation,
    displacementAlongNormal : number
  ) => void;
  private readonly updateSingleStrandColors : (newColor : Color) => void;
  private readonly formattedLowerBoundingNucleotideIndex : number;
  private readonly formattedUpperBoundingNucleotideIndex : number;
  private readonly lowerBoundingNucleotideIndex : number;
  private readonly upperBoundingNucleotideIndex : number;

  constructor(
    rnaComplexProps : RnaComplexProps,
    fullKeys : FullKeys,
    setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void,
    setBasePairKeysToRerender : (basePairKeysToRerender : BasePairKeysToRerender) => void,
    setDebugVisualElements : (debugVisualElements : Array<JSX.Element>) => void,
    tab : Tab
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
    const toBeDragged = new Array<Nucleotide.ExternalProps>();
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
    function rerender() {
      setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
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
        rerender
      );
    } else if (!lowerTerminalIsBasePairedFlag) {
      this.dragListener = linearDrag(
        initialDrag,
        toBeDragged,
        rerender
      );
    } else {
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
          rerender();
        }
      };
    }
    this.partialMenuHeader = <>
      {toBeDragged.length} nucleotides in the range ({lowerBoundingNucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex}, {upperBoundingNucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex})
      <br/>
      In RNA molecule "{rnaMoleculeName}"
      <br/>
      In RNA complex "{singularRnaComplexProps.name}"
      <br/>
    </>;
    let averageCircleCenter = {
      x : 0,
      y : 0
    };
    for (let toBeDraggedI of toBeDragged) {
      let circleCenterI = getBoundingCircle(
        toBeDraggedI,
        lowerBoundingNucleotidePosition,
        upperBoundingNucleotidePosition
      );
      averageCircleCenter = add(
        averageCircleCenter,
        circleCenterI.center
      );
    }
    averageCircleCenter = scaleDown(
      averageCircleCenter,
      toBeDragged.length
    );
    const boundingNucleotidePositionDelta = subtract(
      upperBoundingNucleotidePosition,
      lowerBoundingNucleotidePosition
    );
    const boundingNucleotidePositionCenter = scaleUp(
      add(
        upperBoundingNucleotidePosition,
        lowerBoundingNucleotidePosition
      ),
      0.5
    );
    const normalVector = normalize(
      orthogonalizeRight(boundingNucleotidePositionDelta)
    );
    this.initialDisplacementAlongNormal = dotProduct(
      subtract(
        averageCircleCenter,
        boundingNucleotidePositionCenter
      ),
      normalVector
    );
    this.lowerBoundingNucleotideIndex = lowerBoundingNucleotideIndex;
    this.upperBoundingNucleotideIndex = upperBoundingNucleotideIndex;
    this.updateSingleStrandPositions = function(
      orientation,
      displacementAlongNormal
    ) {
      function handleAngularOrientation(clockwiseFlag : boolean) {
        const center = add(
          boundingNucleotidePositionCenter,
          scaleUp(
            normalVector,
            displacementAlongNormal
          )
        );
        const radius = distance(
          center,
          lowerBoundingNucleotidePosition
        );
        repositionNucleotidesHelper(
          {
            ...getBeginningAngleAndAngleTraversalHelper(
              center,
              lowerBoundingNucleotidePosition,
              upperBoundingNucleotidePosition,
              function(angleTraversal) {
                return angleTraversal < 0 !== clockwiseFlag;
              }
            ),
            boundingCircle : {
              center,
              radius
            }
          },
          lowerBoundingNucleotideIndex,
          upperBoundingNucleotideIndex,
          toBeDragged
        );
        rerender();
      }
      switch (orientation) {
        case RnaSingleStrandInteractionConstraintEditMenu.Orientation.CLOCKWISE : {
          handleAngularOrientation(true);
          break;
        }
        case RnaSingleStrandInteractionConstraintEditMenu.Orientation.COUNTERCLOCKWISE : {
          handleAngularOrientation(false);
          break;
        }
        case RnaSingleStrandInteractionConstraintEditMenu.Orientation.STRAIGHT : {
          let positionDelta = scaleDown(
            subtract(
              upperBoundingNucleotidePosition,
              lowerBoundingNucleotidePosition
            ),
            toBeDragged.length + 1
          );
          let positionI = lowerBoundingNucleotidePosition;
          for (let nucleotideIndexI = lowerBoundingNucleotideIndex; nucleotideIndexI <= upperBoundingNucleotideIndex; nucleotideIndexI++) {
            let singularNucleotidePropsI = singularRnaMoleculeProps.nucleotideProps[nucleotideIndexI];
            singularNucleotidePropsI.x = positionI.x;
            singularNucleotidePropsI.y = positionI.y;
            positionI = add(positionI, positionDelta);
          }
          rerender();
          break;
        }
        default : {
          throw "Unrecognized orientation value.";
        }
      }
    };
    this.updateSingleStrandColors = function(newColor : Color) {
      for (let nucleotideIndexI = lowerBoundingNucleotideIndex; nucleotideIndexI <= upperBoundingNucleotideIndex; nucleotideIndexI++) {
        let singularNucleotidePropsI = singularRnaMoleculeProps.nucleotideProps[nucleotideIndexI];
        singularNucleotidePropsI.color = newColor;
      }
      rerender();
    };
    this.formattedLowerBoundingNucleotideIndex = lowerBoundingNucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex;
    this.formattedUpperBoundingNucleotideIndex = upperBoundingNucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex;
  }

  public override drag() {
    return this.dragListener;
  }

  public override createRightClickMenu(tab : InteractionConstraint.SupportedTab) {
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex
    } = this.fullKeys;
    const formattedLowerBoundingNucleotideIndex = this.formattedLowerBoundingNucleotideIndex;
    const formattedUpperBoundingNucleotideIndex = this.formattedUpperBoundingNucleotideIndex;
    const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
    const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
    const formattedNucleotideIndex = nucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex;
    const header = <>
      <b>
        {tab} single-stranded region:
      </b>
      <br/>
      {this.partialMenuHeader}
    </>;
    switch (tab) {
      case Tab.EDIT : {
        let singleColorFlag = true;
        const candidateSingleColor = singularRnaMoleculeProps.nucleotideProps[this.lowerBoundingNucleotideIndex].color ?? BLACK;
        for (let nucleotideIndexI = this.lowerBoundingNucleotideIndex + 1; nucleotideIndexI <= this.upperBoundingNucleotideIndex; nucleotideIndexI++) {
          const singularNucleotidePropsI = singularRnaMoleculeProps.nucleotideProps[nucleotideIndexI];
          if (!areEqual(
            singularNucleotidePropsI.color ?? BLACK,
            candidateSingleColor
          )) {
            singleColorFlag = false;
          }
        }
        return <>
          {header}
          <RnaSingleStrandInteractionConstraintEditMenu.Component
            initialDisplacementAlongNormal = {this.initialDisplacementAlongNormal}
            initialColor = {singleColorFlag ? candidateSingleColor : BLACK}
            updateSingleStrandPositions = {this.updateSingleStrandPositions}
            updateSingleStrandColors = {this.updateSingleStrandColors}
          />
        </>;
      }
      case Tab.FORMAT : {
        return <>
          {header}
          <BasePairsEditor.Component
            rnaComplexProps = {this.rnaComplexProps}
            initialBasePairs = {[
              {
                rnaComplexIndex,
                rnaMoleculeName0 : rnaMoleculeName,
                nucleotideIndex0 : formattedNucleotideIndex
              }
            ]}
            approveBasePairs = {function(basePairs) {
              for (let i = 0; i < basePairs.length; i++) {
                const basePair = basePairs[i];
                const errorMessage = `This interaction constraint expects base pairs to include the clicked-on single-stranded nucleotide region. The helix on line ${i + 1} does not.`;
                if (rnaComplexIndex !== basePair.rnaComplexIndex) {
                  throw errorMessage;
                }
                const rnaMoleculeName0MatchFlag = rnaMoleculeName === basePair.rnaMoleculeName0;
                const rnaMoleculeName1MatchFlag = rnaMoleculeName === basePair.rnaMoleculeName1;
                if (rnaMoleculeName0MatchFlag && rnaMoleculeName1MatchFlag) {
                  if (
                    (formattedUpperBoundingNucleotideIndex - 1 < basePair.nucleotideIndex0 || formattedLowerBoundingNucleotideIndex + 1 >= basePair.nucleotideIndex0 + basePair.length) &&
                    (formattedUpperBoundingNucleotideIndex - 1 <= basePair.nucleotideIndex1 - basePair.length || formattedLowerBoundingNucleotideIndex + 1 > basePair.nucleotideIndex1)
                  ) {
                    throw errorMessage;
                  }
                } else if (rnaMoleculeName0MatchFlag) {
                  if (formattedUpperBoundingNucleotideIndex - 1 < basePair.nucleotideIndex0 || formattedLowerBoundingNucleotideIndex + 1 >= basePair.nucleotideIndex0 + basePair.length) {
                    throw errorMessage;
                  }
                } else if (rnaMoleculeName1MatchFlag) {
                  if (formattedUpperBoundingNucleotideIndex - 1 <= basePair.nucleotideIndex1 - basePair.length || formattedLowerBoundingNucleotideIndex + 1 > basePair.nucleotideIndex1) {
                    throw errorMessage;
                  }
                } else {
                  throw errorMessage;
                }
              }
            }}
            defaultRnaComplexIndex = {rnaComplexIndex}
            defaultRnaMoleculeName0 = {rnaMoleculeName}
            defaultRnaMoleculeName1 = {rnaMoleculeName}
          />
        </>;
      }
      case Tab.ANNOTATE : {
        return <>
          {header}
          <NucleotideRegionsAnnotateMenu.Component
            regions = {{
              [rnaComplexIndex] : {
                [rnaMoleculeName] : [
                  {
                    minimumNucleotideIndexInclusive : formattedLowerBoundingNucleotideIndex - singularRnaMoleculeProps.firstNucleotideIndex + 1,
                    maximumNucleotideIndexInclusive : formattedUpperBoundingNucleotideIndex - singularRnaMoleculeProps.firstNucleotideIndex - 1
                  }
                ]
              }
            }}
            rnaComplexProps = {this.rnaComplexProps}
            setNucleotideKeysToRerender = {this.setNucleotideKeysToRerender}
          />
        </>;
      }
      default : {
        const error = {
          errorMessage : "Unhandled switch case."
        }
        throw error;
      }
    }
  }
}