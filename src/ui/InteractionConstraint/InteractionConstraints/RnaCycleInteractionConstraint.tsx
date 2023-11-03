import { useMemo } from "react";
import { RnaComplexProps, FullKeys, DragListener, NucleotideKey, RnaMoleculeKey } from "../../../App";
import { NucleotideKeysToRerender, BasePairKeysToRerender } from "../../../context/Context";
import { AbstractInteractionConstraint, InteractionConstraintError } from "../AbstractInteractionConstraint";
import { InteractionConstraint } from "../InteractionConstraints";
import { RnaCycleInteractionConstraintEditMenu } from "./RnaCycleInteractionConstraintEditMenu";
import { PolarVector2D, Vector2D, add, angleBetween, asAngle, crossProduct, distance, dotProduct, negate, normalize, orthogonalizeLeft, scaleUp, subtract, toCartesian, toPolar } from "../../../data_structures/Vector2D";
import { getBoundingCircle } from "../../../data_structures/Geometry";
import { DEFAULT_EPSILON, areEqual, sign, subtractNumbers } from "../../../utils/Utils";
import { compareBasePairKeys } from "../../../components/app_specific/RnaComplex";
import { Tab } from "../../../app_data/Tab";
import { NucleotideRegionsAnnotateMenu } from "../../../components/app_specific/menus/annotate_menus/NucleotideRegionsAnnotateMenu";
import { Nucleotide } from "../../../components/app_specific/Nucleotide";
import Color from "../../../data_structures/Color";

export class RnaCycleInteractionConstraint extends AbstractInteractionConstraint {
  private readonly rnaCycleBoundsText : string;
  private readonly editMenuProps : RnaCycleInteractionConstraintEditMenu.Props;
  private readonly cycleIndices : Array<{
    rnaMoleculeName : RnaMoleculeKey,
    nucleotideIndex : NucleotideKey
  }>;
  private readonly cycleGraphNucleotides : Array<Nucleotide.ExternalProps>;

  public constructor(
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
    const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
    const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];

    const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
    const basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName];
    if (nucleotideIndex in basePairsPerRnaMolecule) {
      const error : InteractionConstraintError = {
        errorMessage : "Cannot interact with a base-paired nucleotide."
      };
      throw error;
    }

    let nucleotideIndexIncremented = nucleotideIndex + 1;
    let nucleotideIndexDecremented = nucleotideIndex - 1;

    if (!((nucleotideIndexIncremented in singularRnaMoleculeProps.nucleotideProps) && (nucleotideIndexDecremented in singularRnaMoleculeProps.nucleotideProps))) {
      const error : InteractionConstraintError = {
        errorMessage : "The clicked-on nucleotide is not part of an RNA cycle."
      };
      throw error;
    }
    const rnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps;
    
    type GraphNode = {
      rnaMoleculeName : RnaMoleculeKey,
      nucleotideIndex : NucleotideKey
    };

    const visited : Record<RnaMoleculeKey, Set<NucleotideKey>> = {};
    const trackBack : Record<RnaMoleculeKey, Record<NucleotideKey, GraphNode>> = {};

    function graphNodeHasBeenVisited(graphNode : GraphNode) {
      return graphNode.rnaMoleculeName in visited && visited[rnaMoleculeName].has(graphNode.nucleotideIndex);
    }
    function getTrackBack(graphNode : GraphNode) {
      const returnValue = new Array<GraphNode>();
      while (true) {
        returnValue.push(graphNode);
        const {
          rnaMoleculeName,
          nucleotideIndex
        } = graphNode;
        if (!(rnaMoleculeName in trackBack)) {
          break;
        }
        const trackBackPerRnaMolecule = trackBack[rnaMoleculeName];
        if (!(nucleotideIndex in trackBackPerRnaMolecule)) {
          break;
        }
        graphNode = trackBackPerRnaMolecule[nucleotideIndex];
      }
      return returnValue;
    }

    const toBeVisited = new Array<GraphNode>();
    toBeVisited.push({
      rnaMoleculeName,
      nucleotideIndex
    });

    let cycleGraphNodes : Array<GraphNode> | undefined = undefined;
    outer: while (toBeVisited.length > 0) {
      const currentNode = toBeVisited.shift() as GraphNode;
      const trackBackOfCurrentNode = getTrackBack(currentNode);
      const {
        rnaMoleculeName,
        nucleotideIndex
      } = currentNode;
      const singularRnaMoleculeProps = rnaMoleculeProps[rnaMoleculeName];
      const nucleotideProps = singularRnaMoleculeProps.nucleotideProps;
      if (!(rnaMoleculeName in visited)) {
        visited[rnaMoleculeName] = new Set<NucleotideKey>();
      }
      const visitedPerRnaMolecule = visited[rnaMoleculeName];
      visitedPerRnaMolecule.add(nucleotideIndex);

      const neighborNodes = new Array<GraphNode>();

      const decrementedNucleotideIndex = nucleotideIndex - 1;
      if (decrementedNucleotideIndex in nucleotideProps) {
        neighborNodes.push({
          rnaMoleculeName,
          nucleotideIndex : decrementedNucleotideIndex
        });
      }
      
      const incrementedNucleotideIndex = nucleotideIndex + 1;
      if (incrementedNucleotideIndex in nucleotideProps) {
        neighborNodes.push({
          rnaMoleculeName,
          nucleotideIndex : incrementedNucleotideIndex
        });
      }

      const basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName];
      if (nucleotideIndex in basePairsPerRnaMolecule) {
        const mappedBasePairInformation = basePairsPerRnaMolecule[nucleotideIndex];
        neighborNodes.push({
          rnaMoleculeName : mappedBasePairInformation.rnaMoleculeName,
          nucleotideIndex : mappedBasePairInformation.nucleotideIndex
        });
      }

      for (let neighborNode of neighborNodes) {
        const {
          rnaMoleculeName,
          nucleotideIndex
        } = neighborNode;
        if (graphNodeHasBeenVisited(neighborNode)) {
          continue;
        }
        toBeVisited.push(neighborNode);

        if (rnaMoleculeName in trackBack) {
          const trackBackOfNeighborNode = getTrackBack(neighborNode);
          const trackBackCollision = trackBackOfNeighborNode.filter(function(trackBackOfNeighborNodeI : GraphNode) {
            return trackBackOfCurrentNode.includes(trackBackOfNeighborNodeI);
          });
          if (trackBackCollision.length === 1) {
            trackBackOfNeighborNode.reverse();
            trackBackOfNeighborNode.shift();
            cycleGraphNodes = [
              ...trackBackOfCurrentNode,
              ...trackBackOfNeighborNode
            ];
            break outer;
          }
        } else {
          trackBack[rnaMoleculeName] = {};
        }
        trackBack[rnaMoleculeName][nucleotideIndex] = currentNode;
      }
    }

    if (cycleGraphNodes === undefined) {
      const error : InteractionConstraintError = {
        errorMessage : "The clicked-on nucleotide is not part of an RNA cycle."
      };
      throw error;
    }
    this.cycleIndices = cycleGraphNodes;
    const cycleGraphNucleotides = cycleGraphNodes.map(function(graphNode : GraphNode) {
      const {
        rnaMoleculeName,
        nucleotideIndex
      } = graphNode;
      return rnaMoleculeProps[rnaMoleculeName].nucleotideProps[nucleotideIndex];
    });
    this.cycleGraphNucleotides = cycleGraphNucleotides;

    let minimumGraphNode = cycleGraphNodes[0];
    let boundingVector0ArrayIndex = 0;
    for (let i = 1; i < cycleGraphNodes.length; i++) {
      let cycleGraphNodeI = cycleGraphNodes[i];
      let comparison = cycleGraphNodeI.rnaMoleculeName.localeCompare(minimumGraphNode.rnaMoleculeName) || (cycleGraphNodeI.nucleotideIndex - minimumGraphNode.nucleotideIndex);
      if (comparison < 0) {
        minimumGraphNode = cycleGraphNodeI;
        boundingVector0ArrayIndex = i;
      }
    }
    const mappedBasePairInformation = basePairsPerRnaComplex[minimumGraphNode.rnaMoleculeName][minimumGraphNode.nucleotideIndex];
    const boundingVector0 = cycleGraphNucleotides[boundingVector0ArrayIndex];
    const boundingVector1 = rnaMoleculeProps[mappedBasePairInformation.rnaMoleculeName].nucleotideProps[mappedBasePairInformation.nucleotideIndex];
    const incrementedCycleGraphNode = cycleGraphNodes[(boundingVector0ArrayIndex + 1) % cycleGraphNodes.length];
    const boundingVectorsIncrementedFlag = incrementedCycleGraphNode.rnaMoleculeName === mappedBasePairInformation.rnaMoleculeName && incrementedCycleGraphNode.nucleotideIndex === mappedBasePairInformation.nucleotideIndex;
    const arrayIndexIncrement = boundingVectorsIncrementedFlag ? -1 : 1;
    const boundingVector1ArrayIndex = (boundingVector0ArrayIndex - arrayIndexIncrement + cycleGraphNodes.length) % cycleGraphNodes.length;

    const minimumRadius = distance(boundingVector0, boundingVector1) * 0.5 + DEFAULT_EPSILON;
    if (minimumRadius === 0) {
      const error : InteractionConstraintError = {
        errorMessage : "Cannot determine repositioning data for this cycle, because its anchoring vector positions are exactly equal."
      };
      throw error;
    }

    const boundingVectorsMidpoint = scaleUp(
      add(
        boundingVector0,
        boundingVector1
      ),
      0.5
    );
    const normal = orthogonalizeLeft(
      subtract(
        boundingVector1,
        boundingVector0
      )
    );

    const x0 = boundingVector0.x;
    const y0 = boundingVector0.y;
    const x1 = boundingVector1.x;
    const y1 = boundingVector1.y;
    const x0Squared = x0 * x0;
    const y0Squared = y0 * y0;

    let getCenterFromRadius : (radius : number) => Vector2D;
    const dx = x1 - x0;
    if (areEqual(dx, 0)) {
      const denominatorReciprocal = 1 / (y1 - y0);
      const z = (x0 - x1) * denominatorReciprocal;
      const w = (x1 * x1 - x0Squared + y1 * y1 - y0Squared) * denominatorReciprocal * 0.5;
      const a = (1 + z * z);
      const twoAReciprocal = 1 / (2 * a);
      const fourA = 4 * a;
      const b = 2 * (-x0 + z * (-y0 + w));
      const negativeB = -b;
      const bSquared = b * b;
      const cPlusRadiusSquared = x0Squared + y0Squared + w * (w - 2 * y0);
      const dxReciprocal = 1 / normal.x;
      
      getCenterFromRadius = function(radius : number) {
        const c = cPlusRadiusSquared - radius * radius;
        // Assume that radius is sufficiently large. This ensures a non-negative discriminant.
        // This is enforced by the minimumRadius variable.
        const centerXCandidate = (negativeB + Math.sqrt(bSquared - fourA * c)) * twoAReciprocal;
        // x = xMidpoint + dx * t
        // x - xMidpoint = dx * t
        // t = (x - xMidpoint) / dx
        // abs() ensures that t is positive. This selects a single center from the two candidate centers.
        const t = Math.abs((centerXCandidate - boundingVectorsMidpoint.x) * dxReciprocal);
        return add(
          boundingVectorsMidpoint,
          scaleUp(
            normal,
            t
          )
        );
      }
    } else {
      const denominatorReciprocal = 1 / dx;
      const z = (y0 - y1) * denominatorReciprocal;
      const w = (x1 * x1 - x0Squared + y1 * y1 - y0Squared) * denominatorReciprocal * 0.5;
      const a = (1 + z * z);
      const twoAReciprocal = 1 / (2 * a);
      const fourA = 4 * a;
      const b = 2 * (-y0 + z * (-x0 + w));
      const negativeB = -b;
      const bSquared = b * b;
      const cPlusRadiusSquared = x0Squared + y0Squared + w * (w - 2 * x0);
      const dyReciprocal = 1 / normal.y;
      
      getCenterFromRadius = function(radius : number) {
        const c = cPlusRadiusSquared - radius * radius;
        // Assume that radius is sufficiently large. This ensures a non-negative discriminant.
        // This is enforced by the minimumRadius variable.
        const centerYCandidate = (negativeB + Math.sqrt(bSquared - fourA * c)) * twoAReciprocal;
        // y = yMidpoint + dy * t
        // y - yMidpoint = dy * t
        // t = (y - yMidpoint) / dy
        // abs() ensures that t is positive. This selects a single center from the two candidate centers.
        const t = Math.abs((centerYCandidate - boundingVectorsMidpoint.y) * dyReciprocal);
        return add(
          boundingVectorsMidpoint,
          scaleUp(
            normal,
            t
          )
        );
      }
    }

    const initialCandidateRadii = cycleGraphNucleotides.map(function(cycleGraphPositionI) {
      return getBoundingCircle(
        boundingVector0,
        boundingVector1,
        cycleGraphPositionI
      ).radius;
    });
    // The initialRadius is max(minimumRadius, avg. radius)
    const initialRadius = Math.max(
      minimumRadius,
      initialCandidateRadii.reduce(
        function(
          initialCandidateRadius0 : number,
          initialCandidateRadius1 : number
        ) {
          return initialCandidateRadius0 + initialCandidateRadius1;
        },
        0
      ) / initialCandidateRadii.length
    );
    const initialCenter = getCenterFromRadius(initialRadius);

    const nucleotideKeysToRerender : NucleotideKeysToRerender = {
      [rnaComplexIndex] : {}
    };
    const nucleotideKeysToRerenderPerRnaComplex = nucleotideKeysToRerender[rnaComplexIndex];
    const basePairKeysToRerender : BasePairKeysToRerender = {
      [rnaComplexIndex] : []
    };
    const basePairKeysToRerenderPerRnaComplex = basePairKeysToRerender[rnaComplexIndex];

    for (let graphNode of cycleGraphNodes) {
      const { rnaMoleculeName, nucleotideIndex } = graphNode;
      if (!(rnaMoleculeName in nucleotideKeysToRerenderPerRnaComplex)) {
        nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName] = [];
      }
      nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName].push(nucleotideIndex);

      if (rnaMoleculeName in basePairsPerRnaComplex) {
        const basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName];
        if (nucleotideIndex in basePairsPerRnaMolecule && !(rnaMoleculeName in basePairKeysToRerenderPerRnaComplex)) {
          basePairKeysToRerenderPerRnaComplex.push(graphNode);
        }
      }
    }
    type PositionToEdit = {
      position : Vector2D,
      polarWithAngleSubtracted : PolarVector2D
    };
    const branches = new Array<{
      arrayIndex : number,
      positionsToEdit : Array<PositionToEdit>,
      originalBasePairDistanceOverTwo : number
    }>();
    for (let i = 0; i < cycleGraphNodes.length; i++) {
      if (i === boundingVector0ArrayIndex || i === boundingVector1ArrayIndex) {
        continue;
      }
      const cycleGraphNodeI : GraphNode = cycleGraphNodes[i];
      const arrayIndexIncremented = (i + 1) % cycleGraphNodes.length;
      const cycleGraphNodeIncremented : GraphNode = cycleGraphNodes[arrayIndexIncremented];
      const position = cycleGraphNucleotides[i];
      const incrementedPosition = cycleGraphNucleotides[arrayIndexIncremented];
      const midpoint = scaleUp(
        add(
          position,
          incrementedPosition
        ),
        0.5
      );
      let normal = orthogonalizeLeft(
        subtract(
          incrementedPosition,
          position
        )
      );
      // Neither orthogonalizeLeft nor orthogonalizeRight is always correct. The normal vector should point out, away from the circle center.
      if (dotProduct(
        normal,
        subtract(
          midpoint,
          initialCenter
        )
      ) < 0) {
        normal = negate(normal);
      }
      const normalAngle = asAngle(normal);
      if (cycleGraphNodeI.rnaMoleculeName !== cycleGraphNodeIncremented.rnaMoleculeName || Math.abs(cycleGraphNodeI.nucleotideIndex - cycleGraphNodeIncremented.nucleotideIndex) !== 1) {
        // A base pair exists between these two graph nodes.
        const originalBasePairDistanceOverTwo = 0.5 * distance(
          position,
          incrementedPosition
        );
        const rnaMoleculeName0 = cycleGraphNodeI.rnaMoleculeName;
        const rnaMoleculeName1 = cycleGraphNodeIncremented.rnaMoleculeName;
        const initialNucleotideIndex0 = cycleGraphNodeI.nucleotideIndex;
        const initialNucleotideIndex1 = cycleGraphNodeIncremented.nucleotideIndex;
        const singularRnaMoleculeProps0 = rnaMoleculeProps[rnaMoleculeName0];
        const singularRnaMoleculeProps1 = rnaMoleculeProps[rnaMoleculeName1];
        const nucleotideProps0 = singularRnaMoleculeProps0.nucleotideProps;
        const nucleotideProps1 = singularRnaMoleculeProps1.nucleotideProps;
        const basePairsPerRnaMolecule0 = basePairsPerRnaComplex[rnaMoleculeName0];
        const basePairsPerRnaMolecule1 = basePairsPerRnaComplex[rnaMoleculeName1];
        if (!(rnaMoleculeName0 in nucleotideKeysToRerenderPerRnaComplex)) {
          nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName0] = [];
        }
        const nucleotideKeysToRerenderPerRnaMolecule0 = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName0];
        if (!(rnaMoleculeName1 in nucleotideKeysToRerenderPerRnaComplex)) {
          nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName1] = [];
        }
        const nucleotideKeysToRerenderPerRnaMolecule1 = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName1];
        const positionsToEdit = new Array<PositionToEdit>();
        const nucleotideIndexIncrement0 : number = initialNucleotideIndex0 - cycleGraphNodes[(i - 1 + cycleGraphNodes.length) % cycleGraphNodes.length].nucleotideIndex;
        const nucleotideIndexIncrement1 : number = initialNucleotideIndex1 - cycleGraphNodes[(i + 2) % cycleGraphNodes.length].nucleotideIndex;
        let nucleotideIndex0 = initialNucleotideIndex0 + nucleotideIndexIncrement0;
        while (nucleotideIndex0) {
          if (rnaMoleculeName0 === rnaMoleculeName1 && nucleotideIndex0 === initialNucleotideIndex1) {
            break;
          }
          const position = nucleotideProps0[nucleotideIndex0];
          const polar = toPolar(subtract(
            position,
            midpoint
          ));
          polar.angle -= normalAngle;
          positionsToEdit.push({
            position,
            polarWithAngleSubtracted : polar
          });
          nucleotideKeysToRerenderPerRnaMolecule0.push(nucleotideIndex0);
          if (nucleotideIndex0 in basePairsPerRnaMolecule0) {
            const mappedBasePairInformation = basePairsPerRnaMolecule0[nucleotideIndex0];
            if (mappedBasePairInformation.rnaMoleculeName !== rnaMoleculeName1 || (mappedBasePairInformation.nucleotideIndex - initialNucleotideIndex1) * nucleotideIndexIncrement1 < 0) {
              const error : InteractionConstraintError = {
                errorMessage : "Cannot interact with this RNA cycle; it contains complex base-pair arrangements."
              };
              throw error;
            }
            basePairKeysToRerenderPerRnaComplex.push({
              rnaMoleculeName : rnaMoleculeName0,
              nucleotideIndex : nucleotideIndex0
            });
          }
          nucleotideIndex0 += nucleotideIndexIncrement0;
        }
        let nucleotideIndex1 = initialNucleotideIndex1 + nucleotideIndexIncrement1;
        while (nucleotideIndex1) {
          if (rnaMoleculeName0 === rnaMoleculeName1 && nucleotideIndex1 === initialNucleotideIndex0) {
            break;
          }
          const position = nucleotideProps1[nucleotideIndex1];
          const polar = toPolar(subtract(
            position,
            midpoint
          ));
          polar.angle -= normalAngle;
          positionsToEdit.push({
            position,
            polarWithAngleSubtracted : polar
          });
          nucleotideKeysToRerenderPerRnaMolecule1.push(nucleotideIndex1);
          if (nucleotideIndex1 in basePairsPerRnaMolecule1) {
            const mappedBasePairInformation = basePairsPerRnaMolecule1[nucleotideIndex1];
            if (mappedBasePairInformation.rnaMoleculeName !== rnaMoleculeName0 || (mappedBasePairInformation.nucleotideIndex - initialNucleotideIndex0) * nucleotideIndexIncrement0 < 0) {
              const error : InteractionConstraintError = {
                errorMessage : "Cannot interact with this RNA cycle; it contains complex base-pair arrangements."
              };
              throw error;
            }
            basePairKeysToRerenderPerRnaComplex.push({
              rnaMoleculeName : rnaMoleculeName1,
              nucleotideIndex : nucleotideIndex1
            });
          }
          nucleotideIndex1 += nucleotideIndexIncrement1;
        }
        branches.push({
          arrayIndex : i,
          positionsToEdit,
          originalBasePairDistanceOverTwo
        });
      }
    }
    for (let nucleotideKeysToRerenderPerRnaMolecule of Object.values(nucleotideKeysToRerenderPerRnaComplex)) {
      nucleotideKeysToRerenderPerRnaMolecule.sort(subtractNumbers);
    }
    basePairKeysToRerenderPerRnaComplex.sort(compareBasePairKeys);
    
    function rerender() {
      setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
      setBasePairKeysToRerender(structuredClone(basePairKeysToRerender))
    }

    function updatePositionsHelper(newRadius : number) {
      const center = getCenterFromRadius(newRadius);

      const dv0 = subtract(
        boundingVector0,
        center
      );
      const dv1 = subtract(
        boundingVector1,
        center
      );
      const angleMagnitude = angleBetween(dv0, dv1);
      const initialAngle = asAngle(dv0);
      const angleDelta = (2 * Math.PI - angleMagnitude) / (cycleGraphNucleotides.length - 1) * sign(crossProduct(dv1, dv0));
      let angle = initialAngle;
      let arrayIndex = boundingVector0ArrayIndex;
      for (let i = 0; i < cycleGraphNucleotides.length - 2; i++) {
        angle += angleDelta;
        arrayIndex = (arrayIndex + arrayIndexIncrement + cycleGraphNucleotides.length) % cycleGraphNucleotides.length;
        const newPosition = add(
          center,
          toCartesian(
            {
              radius : newRadius,
              angle
            }
          )
        );
        const cycleGraphPositionI = cycleGraphNucleotides[arrayIndex];
        cycleGraphPositionI.x = newPosition.x;
        cycleGraphPositionI.y = newPosition.y;
      }
      for (let branch of branches) {
        const {
          arrayIndex,
          positionsToEdit,
          originalBasePairDistanceOverTwo
        } = branch;
        const positionAtArrayIndex = cycleGraphNucleotides[arrayIndex];
        const positionAtArrayIndexIncremented = cycleGraphNucleotides[(arrayIndex + 1) % cycleGraphNucleotides.length];
        let midpoint = scaleUp(
          add(
            positionAtArrayIndex,
            positionAtArrayIndexIncremented
          ),
          0.5
        );
        const newAngle = asAngle(subtract(
          midpoint,
          center
        ));
        const ratio = originalBasePairDistanceOverTwo / newRadius;
        const choordCenter = add(
          toCartesian({
            angle : newAngle,
            radius : newRadius * Math.sqrt(1 - ratio * ratio)
          }),
          center
        );
        const dv = scaleUp(
          normalize(subtract(
            positionAtArrayIndex,
            midpoint
          )),
          originalBasePairDistanceOverTwo
        );
        const newPositionAtArrayIndex = add(
          choordCenter,
          dv
        );
        const newPositionAtArrayIndexIncremented = subtract(
          choordCenter,
          dv
        );
        positionAtArrayIndex.x = newPositionAtArrayIndex.x;
        positionAtArrayIndex.y = newPositionAtArrayIndex.y;
        positionAtArrayIndexIncremented.x = newPositionAtArrayIndexIncremented.x;
        positionAtArrayIndexIncremented.y = newPositionAtArrayIndexIncremented.y;
        midpoint = scaleUp(
          add(
            newPositionAtArrayIndex,
            newPositionAtArrayIndexIncremented
          ),
          0.5
        );
        if (positionsToEdit.length === 0) {
          continue;
        }
        const newPositionData = positionsToEdit.map(function({
          position,
          polarWithAngleSubtracted
        }) {
          const polar = {
            ...polarWithAngleSubtracted
          };
          polar.angle += newAngle;
          return {
            position,
            dv : toCartesian(polar)
          };
        });
        const negatePositionsFlag = dotProduct(
          subtract(
            midpoint,
            center
          ),
          newPositionData[0].dv
        ) < 0;
        const addOrSubtract = negatePositionsFlag ? subtract : add;
        for (let { position, dv } of newPositionData) {
          const newPosition = addOrSubtract(
            midpoint,
            dv 
          );
          position.x = newPosition.x;
          position.y = newPosition.y;
        }
      }
      rerender();
    }

    const nucleotideIndices0 = cycleGraphNodes[boundingVector0ArrayIndex];
    const rnaMoleculeName0 = nucleotideIndices0.rnaMoleculeName;
    const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
    const nucleotideIndices1 = cycleGraphNodes[boundingVector1ArrayIndex];
    const rnaMoleculeName1 = nucleotideIndices1.rnaMoleculeName;
    const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
    this.rnaCycleBoundsText = `RNA cycle anchored by nucleotide #${nucleotideIndices0.nucleotideIndex + singularRnaMoleculeProps0.firstNucleotideIndex} in RNA molecule "${rnaMoleculeName0}" and nucleotide #${nucleotideIndices1.nucleotideIndex + singularRnaMoleculeProps1.firstNucleotideIndex} in RNA molecule "${rnaMoleculeName1}"`;
    this.editMenuProps = {
      initialRadius,
      minimumRadius,
      updatePositionsHelper,
      cycleGraphNucleotides,
      rerender
    };
  }

  public override drag() : DragListener {
    const error : InteractionConstraintError = {
      errorMessage : "This interaction constraint does not support dragging."
    };
    throw error;
  }

  public override createRightClickMenu(tab: InteractionConstraint.SupportedTab) {
    const {
      rnaComplexIndex,
      rnaMoleculeName
    } = this.fullKeys;
    let menu : JSX.Element;
    switch (tab) {
      case Tab.EDIT : {
        menu = <RnaCycleInteractionConstraintEditMenu.Component
          {...this.editMenuProps}
        />;
        break;
      }
      case Tab.FORMAT : {
        throw {
          errorMessage : "This interaction-constraint does not support the format menu."
        };
      }
      case Tab.ANNOTATE : {
        const regions : NucleotideRegionsAnnotateMenu.Regions = {
          [rnaComplexIndex] : {}
        };
        const regionsPerRnaComplex = regions[rnaComplexIndex];
        let previousCycleIndices = {
          // This is deliberate. I want the rnaMoleculeName comparison to fail on the first iteration.
          rnaMoleculeName : undefined as any as string
        };
        for (const cycleIndices of this.cycleIndices) {
          const {
            rnaMoleculeName,
            nucleotideIndex
          } = cycleIndices;
          if (!(rnaMoleculeName in regionsPerRnaComplex)) {
            regionsPerRnaComplex[rnaMoleculeName] = [];
          }
          const regionsPerRnaMolecule = regionsPerRnaComplex[rnaMoleculeName];
          if (rnaMoleculeName === previousCycleIndices.rnaMoleculeName && regionsPerRnaMolecule.length > 0) {
            const previouslyAddedRegion = regionsPerRnaMolecule[regionsPerRnaMolecule.length - 1];
            if (nucleotideIndex === previouslyAddedRegion.minimumNucleotideIndexInclusive - 1) {
              previouslyAddedRegion.minimumNucleotideIndexInclusive = nucleotideIndex;
            } else if (nucleotideIndex === previouslyAddedRegion.maximumNucleotideIndexInclusive + 1) {
              previouslyAddedRegion.maximumNucleotideIndexInclusive = nucleotideIndex;
            } else {
              regionsPerRnaMolecule.push({
                minimumNucleotideIndexInclusive : nucleotideIndex,
                maximumNucleotideIndexInclusive : nucleotideIndex
              });
            }
          } else {
            regionsPerRnaMolecule.push({
              minimumNucleotideIndexInclusive : nucleotideIndex,
              maximumNucleotideIndexInclusive : nucleotideIndex
            });
          }
        }
        
        menu = <NucleotideRegionsAnnotateMenu.Component
          regions = {regions}
          rnaComplexProps = {this.rnaComplexProps}
          setNucleotideKeysToRerender = {this.setNucleotideKeysToRerender}
        />;
        break;
      }
      default : {
        throw "Unhandled switch case";
      }
    }
    return <>
      <b>
        {tab} {this.rnaCycleBoundsText}:
      </b>
      <br/>
      {menu}
    </>;
  }
}