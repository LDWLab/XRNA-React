import { ReactNode, useMemo } from "react";
import { RnaComplexProps, FullKeys, DragListener, NucleotideKey, RnaMoleculeKey, FullKeysRecord } from "../../../App";
import { NucleotideKeysToRerender, BasePairKeysToRerender } from "../../../context/Context";
import { AbstractInteractionConstraint, basePairedNucleotideError, InteractionConstraintError } from "../AbstractInteractionConstraint";
import { InteractionConstraint } from "../InteractionConstraints";
import { RnaCycleInteractionConstraintEditMenu } from "./RnaCycleInteractionConstraintEditMenu";
import { PolarVector2D, Vector2D, add, angleBetween, asAngle, crossProduct, distance, dotProduct, magnitude, negate, normalize, orthogonalizeLeft, scaleUp, subtract, toCartesian, toNormalCartesian, toPolar } from "../../../data_structures/Vector2D";
import { getBoundingCircle } from "../../../data_structures/Geometry";
import { areEqual, sign, subtractNumbers } from "../../../utils/Utils";
import { compareBasePairKeys } from "../../../components/app_specific/RnaComplex";
import { Tab } from "../../../app_data/Tab";
import { NucleotideRegionsAnnotateMenu } from "../../../components/app_specific/menus/annotate_menus/NucleotideRegionsAnnotateMenu";
import { Nucleotide } from "../../../components/app_specific/Nucleotide";
import Color from "../../../data_structures/Color";

const EPSILON = 0.01;

const noCycleFoundError = {
  errorMessage : "The clicked-on nucleotide is not part of an RNA cycle."
};

export class RnaCycleInteractionConstraint extends AbstractInteractionConstraint {
  private readonly rnaCycleBoundsText : ReactNode;
  private readonly editMenuProps : RnaCycleInteractionConstraintEditMenu.Props;
  private readonly cycleIndices : Array<{
    rnaMoleculeName : RnaMoleculeKey,
    nucleotideIndex : NucleotideKey
  }>;
  private readonly initialDrag : Vector2D;
  private readonly boundingVector0 : Vector2D;
  private readonly boundingVector1 : Vector2D;
  private readonly updatePositionsHelper : (
    newRadius : number,
    repositionAnnotationsFlag : boolean
  ) => void;
  private readonly minimumRadius : number;

  public constructor(
    rnaComplexProps : RnaComplexProps,
    setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void,
    setBasePairKeysToRerender : (basePairKeysToRerender : BasePairKeysToRerender) => void,
    setDebugVisualElements : (debugVisualElements : Array<JSX.Element>) => void,
    tab : Tab,
    indicesOfFrozenNucleotides : FullKeysRecord,
    interactionConstraintOptions : InteractionConstraint.Options,
    fullKeys0 : FullKeys,
    fullKeys1? : FullKeys,
) {
    super(
      rnaComplexProps,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements,
      indicesOfFrozenNucleotides,
      fullKeys0,
      fullKeys1
    );
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex
    } = this.fullKeys0;
    const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
    const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
    const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
    this.initialDrag = structuredClone(singularNucleotideProps);

    const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
    const basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName];
    // if (nucleotideIndex in basePairsPerRnaMolecule) {
    //   throw basePairedNucleotideError;
    // }

    if (
      !(nucleotideIndex in basePairsPerRnaMolecule) &&
      !((nucleotideIndex + 1 in singularRnaMoleculeProps.nucleotideProps) && (nucleotideIndex - 1 in singularRnaMoleculeProps.nucleotideProps))
    ) {
      throw noCycleFoundError;
    }
    // if (!((nucleotideIndex + 1 in singularRnaMoleculeProps.nucleotideProps) && (nucleotideIndex - 1 in singularRnaMoleculeProps.nucleotideProps))) {
    //   throw noCycleFoundError;
    // }
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
        const basePairsPerNucleotide = basePairsPerRnaMolecule[nucleotideIndex];
        for (const basePairPerNucleotide of basePairsPerNucleotide) {
          neighborNodes.push({
            rnaMoleculeName : basePairPerNucleotide.rnaMoleculeName,
            nucleotideIndex : basePairPerNucleotide.nucleotideIndex
          });
        }
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
      throw noCycleFoundError;
    }
    this.cycleIndices = cycleGraphNodes;
    const cycleGraphNucleotides = cycleGraphNodes.map(function(graphNode : GraphNode) {
      const {
        rnaMoleculeName,
        nucleotideIndex
      } = graphNode;
      
      return rnaMoleculeProps[rnaMoleculeName].nucleotideProps[nucleotideIndex];
    });
    for (const { rnaMoleculeName, nucleotideIndex } of cycleGraphNodes) {
      this.addFullIndices({
        rnaComplexIndex,
        rnaMoleculeName,
        nucleotideIndex
      });
    }

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
    /* Proof that the minimum nucleotide in a cycle has a base pair:
    * Each nucleotide in a cycle is connected to >= 2 nucleotides which are also part of the cycle
    * If we assume that the minimum nucleotide in a cycle has no basepair, then those two connected nucleotides must be:
      * the next nucleotide in the RNA molecule
      * the previous nucleotide in the RNA molecule
        * Therefore, the previous nucleotide is in the cycle
        * By definition, this previous nucleotide is < the minimum nucleotide.
          * Proof by contradiciton.
    */
    const basePairsPerNucleotide = basePairsPerRnaComplex[minimumGraphNode.rnaMoleculeName][minimumGraphNode.nucleotideIndex];
    const filteredBasePairsPerNucleotide = basePairsPerNucleotide.filter(basePairPerNucleotide => (cycleGraphNodes as GraphNode[]).some(cycleGraphNode => basePairPerNucleotide.rnaMoleculeName === cycleGraphNode.rnaMoleculeName && basePairPerNucleotide.nucleotideIndex === cycleGraphNode.nucleotideIndex));
    const relevantBasePair = filteredBasePairsPerNucleotide.reduce((keys0, keys1) => {
      const comparison = compareBasePairKeys(
        keys0,
        keys1
      );
      return comparison < 0 ? keys1 : keys0;
    });
    const boundingVector0 = cycleGraphNucleotides[boundingVector0ArrayIndex];
    const boundingVector1 = rnaMoleculeProps[relevantBasePair.rnaMoleculeName].nucleotideProps[relevantBasePair.nucleotideIndex];
    this.boundingVector0 = boundingVector0;
    this.boundingVector1 = boundingVector1;
    const incrementedCycleGraphNode = cycleGraphNodes[(boundingVector0ArrayIndex + 1) % cycleGraphNodes.length];
    const boundingVectorsIncrementedFlag = (
      incrementedCycleGraphNode.rnaMoleculeName === relevantBasePair.rnaMoleculeName &&
      incrementedCycleGraphNode.nucleotideIndex === relevantBasePair.nucleotideIndex
    );
    const arrayIndexIncrement = boundingVectorsIncrementedFlag ? -1 : 1;
    const boundingVector1ArrayIndex = (boundingVector0ArrayIndex - arrayIndexIncrement + cycleGraphNodes.length) % cycleGraphNodes.length;

    let minimumRadius = distance(boundingVector0, boundingVector1) * 0.5 + EPSILON;
    if (areEqual(
      minimumRadius,
      0,
      EPSILON * 2
    )) {
      throw {
        errorMessage : "Cannot determine repositioning data for this cycle, because its anchoring vector positions are exactly equal."
      };
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
    function getRadius() {
      return Math.max(
        getBoundingCircle(
          cycleGraphNucleotides[0],
          boundingVector0,
          boundingVector1
        ).radius,
        minimumRadius
      );
    }
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
      singularNucleotideProps : Nucleotide.ExternalProps,
      polarWithAngleSubtracted : PolarVector2D,
      annotationData? : {
        subtractedAnnotationAngle : number,
        positionsWithMagnitudes : Array<{
          position : Vector2D,
          magnitude : number
        }>
      }
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
        const loopKeys = [
          {
            rnaMoleculeName : rnaMoleculeName0,
            nucleotideIndex : initialNucleotideIndex0 + nucleotideIndexIncrement0,
            otherRnaMoleculeName : rnaMoleculeName1,
            otherInitialNucleotideIndex : initialNucleotideIndex1,
            nucleotideProps : nucleotideProps0,
            nucleotideKeysToRerenderPerRnaMolecule : nucleotideKeysToRerenderPerRnaMolecule0,
            basePairsPerRnaMolecule : basePairsPerRnaMolecule0,
            nucleotideIndexIncrement : nucleotideIndexIncrement0,
            otherNucleotideIndexIncrement : nucleotideIndexIncrement1
          },
          {
            rnaMoleculeName : rnaMoleculeName1,
            nucleotideIndex : initialNucleotideIndex1 + nucleotideIndexIncrement1,
            otherRnaMoleculeName : rnaMoleculeName0,
            otherInitialNucleotideIndex : initialNucleotideIndex0,
            nucleotideProps : nucleotideProps1,
            nucleotideKeysToRerenderPerRnaMolecule : nucleotideKeysToRerenderPerRnaMolecule1,
            basePairsPerRnaMolecule : basePairsPerRnaMolecule1,
            nucleotideIndexIncrement : nucleotideIndexIncrement1,
            otherNucleotideIndexIncrement : nucleotideIndexIncrement0
          }
        ];
        for (let {
          rnaMoleculeName,
          nucleotideIndex,
          otherRnaMoleculeName,
          otherInitialNucleotideIndex,
          nucleotideProps,
          nucleotideKeysToRerenderPerRnaMolecule,
          basePairsPerRnaMolecule,
          nucleotideIndexIncrement,
          otherNucleotideIndexIncrement
        } of loopKeys) {
          while (nucleotideIndex) {
            if (rnaMoleculeName === otherRnaMoleculeName && nucleotideIndex === otherInitialNucleotideIndex) {
              break;
            }
            if (!(nucleotideIndex in nucleotideProps)) {
              break;
            }
            this.addFullIndices({
              rnaComplexIndex,
              rnaMoleculeName,
              nucleotideIndex
            });
            const singularNucleotideProps = nucleotideProps[nucleotideIndex];
            const polar = toPolar(subtract(
              singularNucleotideProps,
              midpoint
            ));
            polar.angle -= normalAngle;
            let subtractedAnnotationAngle : number | undefined = undefined;
            const positionsWithMagnitudes = new Array<{position : Vector2D, magnitude : number}>();
            if (singularNucleotideProps.labelContentProps !== undefined) {
              subtractedAnnotationAngle = asAngle(singularNucleotideProps.labelContentProps);
              positionsWithMagnitudes.push({
                position : singularNucleotideProps.labelContentProps,
                magnitude : magnitude(singularNucleotideProps.labelContentProps)
              });
            }
            if (singularNucleotideProps.labelLineProps !== undefined) {{
              const points = singularNucleotideProps.labelLineProps.points;
              subtractedAnnotationAngle = asAngle(points[0]);
              positionsWithMagnitudes.push(...points.map(function(point) {
                return {
                  position : point,
                  magnitude : magnitude(point)
                };
              }));
            }}
            if (subtractedAnnotationAngle !== undefined) {
              subtractedAnnotationAngle -= normalAngle;
            }
            positionsToEdit.push({
              singularNucleotideProps,
              polarWithAngleSubtracted : polar,
              annotationData : subtractedAnnotationAngle === undefined ? undefined : {
                subtractedAnnotationAngle,
                positionsWithMagnitudes
              }
            });
            nucleotideKeysToRerenderPerRnaMolecule.push(nucleotideIndex);
            // if (nucleotideIndex in basePairsPerRnaMolecule) {
            //   const basePairsPerNucleotide = basePairsPerRnaMolecule[nucleotideIndex];
            //   for (const basePairPerNucleotide of basePairsPerNucleotide) {
            //     if (basePairPerNucleotide.rnaMoleculeName !== otherRnaMoleculeName || (basePairPerNucleotide.nucleotideIndex - otherInitialNucleotideIndex) * otherNucleotideIndexIncrement < 0) {
            //       throw {
            //         errorMessage : "Cannot interact with this RNA cycle; it contains complex base-pair arrangements."
            //       };
            //     }
            //   }
            // }
            nucleotideIndex += nucleotideIndexIncrement;
          }
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

    const frozenNucleotides = new Array<Vector2D>();
    for (const [rnaComplexIndexAsString, indicesOfFrozenNucleotidesPerRnaComplex] of Object.entries(indicesOfFrozenNucleotides)) {
      const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
      for (const [rnaMoleculeName, indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule] of Object.entries(indicesOfFrozenNucleotidesPerRnaComplex)) {
        const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
        for (const nucleotideIndex of Array.from(indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule)) {
          const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
          frozenNucleotides.push(singularNucleotideProps);
        }
      }
    }
    this.updatePositionsHelper = function(
      newRadius : number,
      repositionAnnotationsFlag : boolean
    ) {
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
      const cycleData = new Array<{
        angle : number,
        singularNucleotideProps : Nucleotide.ExternalProps
      }>();
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
        cycleData.push({
          angle,
          singularNucleotideProps : cycleGraphPositionI
        });
        if (!frozenNucleotides.includes(cycleGraphPositionI)) {
          cycleGraphPositionI.x = newPosition.x;
          cycleGraphPositionI.y = newPosition.y;
        }
      }
      if (repositionAnnotationsFlag) {
        for (const { angle, singularNucleotideProps } of cycleData) {
          if (!frozenNucleotides.includes(singularNucleotideProps)) {
            const direction = toNormalCartesian(angle);
            const positions = [];
            if (singularNucleotideProps.labelContentProps !== undefined) {
              positions.push(singularNucleotideProps.labelContentProps);
            }
            if (singularNucleotideProps.labelLineProps !== undefined) {
              // This causes the LabelLine.Component to be re-rendered properly.
              singularNucleotideProps.labelLineProps.points = [...singularNucleotideProps.labelLineProps.points];
              positions.push(...singularNucleotideProps.labelLineProps.points);
            }
            for (const position of positions) {
              const newPosition = scaleUp(
                direction,
                magnitude(position)
              );
              position.x = newPosition.x;
              position.y = newPosition.y;
            }
          }
        }
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
        if (!frozenNucleotides.includes(positionAtArrayIndex)) {
          positionAtArrayIndex.x = newPositionAtArrayIndex.x;
          positionAtArrayIndex.y = newPositionAtArrayIndex.y;
        }
        if (!frozenNucleotides.includes(positionAtArrayIndexIncremented)) {
          positionAtArrayIndexIncremented.x = newPositionAtArrayIndexIncremented.x;
          positionAtArrayIndexIncremented.y = newPositionAtArrayIndexIncremented.y;
        }
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
          singularNucleotideProps,
          polarWithAngleSubtracted
        }) {
          const polar = {
            ...polarWithAngleSubtracted
          };
          polar.angle += newAngle;
          return {
            singularNucleotideProps,
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
        for (let { singularNucleotideProps, dv } of newPositionData) {
          const newPosition = addOrSubtract(
            midpoint,
            dv 
          );
          if (!frozenNucleotides.includes(singularNucleotideProps)) {
            singularNucleotideProps.x = newPosition.x;
            singularNucleotideProps.y = newPosition.y;
          }
        }
        if (repositionAnnotationsFlag) {
          for (const { singularNucleotideProps, annotationData } of positionsToEdit) {
            if (annotationData !== undefined) {
              let newAnnotationAngle = negatePositionsFlag ? newAngle - annotationData.subtractedAnnotationAngle : newAngle + annotationData.subtractedAnnotationAngle;
              if (singularNucleotideProps.labelLineProps !== undefined) {
                // This causes the LabelLine.Component to re-render properly.
                singularNucleotideProps.labelLineProps.points = [...singularNucleotideProps.labelLineProps.points];
              }

              const direction = toNormalCartesian(newAnnotationAngle);
              for (const { position, magnitude } of annotationData.positionsWithMagnitudes) {
                const newPosition = scaleUp(
                  direction,
                  magnitude
                );
                if (!frozenNucleotides.includes(position)) {
                  position.x = newPosition.x;
                  position.y = newPosition.y;
                }
              }
            }
          }
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
    this.rnaCycleBoundsText = <>
      Anchored by:
      <br/>
      Nucleotide #{nucleotideIndices0.nucleotideIndex + singularRnaMoleculeProps0.firstNucleotideIndex}
      <br/>
      In RNA molecule "{rnaMoleculeName0}"
      <br/>
      And
      <br/>
      Nucleotide #{nucleotideIndices1.nucleotideIndex + singularRnaMoleculeProps1.firstNucleotideIndex}
      <br/>
      In RNA molecule "{rnaMoleculeName1}"
      <br/>
      In RNA complex "{singularRnaComplexProps.name}"
    </>;
    const branchNucleotides = new Array<Nucleotide.ExternalProps>();
    for (const { positionsToEdit } of branches) {
      for (const positionToEdit of positionsToEdit) {
        const { singularNucleotideProps } = positionToEdit;
        branchNucleotides.push(singularNucleotideProps);
      }
    }
    minimumRadius = branches.reduce((minimumRadius, { originalBasePairDistanceOverTwo }) => Math.max(
      minimumRadius,
      originalBasePairDistanceOverTwo + EPSILON
    ), minimumRadius);
    this.minimumRadius = minimumRadius;
    this.editMenuProps = {
      initialRadius,
      minimumRadius,
      updatePositionsHelper : this.updatePositionsHelper,
      cycleGraphNucleotides : cycleGraphNucleotides.filter(function(cycleGraphNucleotide) { return !frozenNucleotides.includes(cycleGraphNucleotide); }),
      branchNucleotides : branchNucleotides.filter(function(branchNucleotide) { return !frozenNucleotides.includes(branchNucleotide); }),
      rerender,
      getRadius
    };
  }

  public override drag() : DragListener {
    const initialDrag = this.initialDrag;
    const updatePositionsHelper = this.updatePositionsHelper;
    const boundingVector0 = this.boundingVector0;
    const boundingVector1 = this.boundingVector1;
    const minimumRadius = this.minimumRadius;
    return {
      initiateDrag() {
        return initialDrag;
      },
      continueDrag(
        totalDrag,
        repositionAnnotationsFlag
      ) {
        updatePositionsHelper(
          Math.max(
            getBoundingCircle(
              boundingVector0,
              boundingVector1,
              totalDrag
            ).radius,
            minimumRadius
          ),
          repositionAnnotationsFlag
        );
      },
    };
  }

  public override createRightClickMenu(tab: InteractionConstraint.SupportedTab) {
    const {
      rnaComplexIndex,
      rnaMoleculeName
    } = this.fullKeys0;
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
          errorMessage : "This constraint does not support the format menu."
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
        const indicesOfFrozenNucleotidesPerRnaComplex = rnaComplexIndex in this.indicesOfFrozenNucleotides ? this.indicesOfFrozenNucleotides[rnaComplexIndex] : {};
        for (const cycleIndices of this.cycleIndices) {
          const {
            rnaMoleculeName,
            nucleotideIndex
          } = cycleIndices;
          if (!(rnaMoleculeName in regionsPerRnaComplex)) {
            regionsPerRnaComplex[rnaMoleculeName] = [];
          }
          const indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule = rnaMoleculeName in indicesOfFrozenNucleotidesPerRnaComplex ? indicesOfFrozenNucleotidesPerRnaComplex[rnaMoleculeName] : new Set<number>();
          const regionsPerRnaMolecule = regionsPerRnaComplex[rnaMoleculeName];
          if (!indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule.has(nucleotideIndex)) {
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
        {tab} RNA cycle:
      </b>
      <br/>
      {this.rnaCycleBoundsText}
      <br/>
      {menu}
    </>;
  }
}