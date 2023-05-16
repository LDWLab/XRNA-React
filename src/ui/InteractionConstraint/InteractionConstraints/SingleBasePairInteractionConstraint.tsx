import { RnaComplex, compareBasePairKeys } from "../../../components/app_specific/RnaComplex";
import { NucleotideKeysToRerender, BasePairKeysToRerender, NucleotideKeysToRerenderPerRnaMolecule } from "../../../context/Context";
import { linearDrag } from "../CommonDragListeners";
import { AbstractInteractionConstraint, nonBasePairedNucleotideError } from "../AbstractInteractionConstraint";
import { InteractionConstraint } from "../InteractionConstraints";
import { RnaComplexProps, FullKeys, DragListener } from "../../../App";
import { RnaMolecule } from "../../../components/app_specific/RnaMolecule";
import { Nucleotide } from "../../../components/app_specific/Nucleotide";
import { SingleBasePairInteractionConstraintEditMenu } from "../../../components/app_specific/edit_menus/SingleBasePairinteractionConstraintEditMenu";
import BasePair, { getBasePairType } from "../../../components/app_specific/BasePair";
import { Vector2D, add, asAngle, distance, magnitude, normalize, scaleUp, subtract, toCartesian, toPolar } from "../../../data_structures/Vector2D";

export class SingleBasePairInteractionConstraint extends AbstractInteractionConstraint {
  private singularRnaComplexProps : RnaComplex.ExternalProps;
  private basePairedSingularRnaMoleculeProps : RnaMolecule.ExternalProps;
  private singularRnaMoleculeProps : RnaMolecule.ExternalProps;
  private basePairedSingularNucleotideProps : Nucleotide.ExternalProps;
  private singularNucleotideProps : Nucleotide.ExternalProps;
  private dragListener : DragListener;
  private mappedBasePair : RnaComplex.MappedBasePair;
  private toBeDragged : Array<Vector2D>;
  private rerender : () => void;

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
    const nucleotideKeysToRerender : NucleotideKeysToRerender = {};
    const basePairKeysToRerender : BasePairKeysToRerender = {};
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex
    } = this.fullKeys;
    this.singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
    const {
      basePairs
    } = this.singularRnaComplexProps;
    if (!(rnaMoleculeName in basePairs && nucleotideIndex in basePairs[rnaMoleculeName])) {
      throw nonBasePairedNucleotideError;
    }
    const basePairKeys = {
      rnaMoleculeName,
      nucleotideIndex
    };
    this.mappedBasePair = basePairs[rnaMoleculeName][nucleotideIndex];
    this.singularRnaMoleculeProps = this.singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
    this.singularNucleotideProps = this.singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
    this.basePairedSingularRnaMoleculeProps = this.singularRnaComplexProps.rnaMoleculeProps[this.mappedBasePair.rnaMoleculeName];
    this.basePairedSingularNucleotideProps = this.basePairedSingularRnaMoleculeProps.nucleotideProps[this.mappedBasePair.nucleotideIndex];
    let lesserKeys : RnaComplex.BasePairKeys;
    let greaterKeys : RnaComplex.BasePairKeys;
    if (compareBasePairKeys(basePairKeys, this.mappedBasePair) <= 0) {
      lesserKeys = basePairKeys;
      greaterKeys = this.mappedBasePair;
    } else {
      lesserKeys = this.mappedBasePair;
      greaterKeys = basePairKeys;
    }
    basePairKeysToRerender[rnaComplexIndex] = [
      lesserKeys
    ];
    const initialDrag = {
      x : this.singularNucleotideProps.x,
      y : this.singularNucleotideProps.y
    };
    const toBeDragged = [
      this.singularNucleotideProps,
      this.basePairedSingularNucleotideProps
    ];
    this.toBeDragged = toBeDragged;
    if (rnaMoleculeName === this.mappedBasePair.rnaMoleculeName) {
      const nucleotideKeysToRerenderPerRnaMolecule : NucleotideKeysToRerenderPerRnaMolecule = [];
      nucleotideKeysToRerender[rnaComplexIndex] = {
        [rnaMoleculeName] : nucleotideKeysToRerenderPerRnaMolecule
      }
      nucleotideKeysToRerenderPerRnaMolecule.push(lesserKeys.nucleotideIndex);
      for (let nucleotideIndex = lesserKeys.nucleotideIndex + 1; nucleotideIndex < greaterKeys.nucleotideIndex; nucleotideIndex++) {
        if (nucleotideIndex in this.singularRnaMoleculeProps.nucleotideProps) {
          nucleotideKeysToRerenderPerRnaMolecule.push(nucleotideIndex);
          toBeDragged.push(this.singularRnaMoleculeProps.nucleotideProps[nucleotideIndex]);
        }
      }
      nucleotideKeysToRerenderPerRnaMolecule.push(greaterKeys.nucleotideIndex);
    }
    this.rerender = function() {
      setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
      setBasePairKeysToRerender(structuredClone(basePairKeysToRerender));
    };
    this.dragListener = linearDrag(
      initialDrag,
      toBeDragged,
      this.rerender
    );
  }

  public override drag() {
    return this.dragListener;
  }

  public override createRightClickMenu(tab: InteractionConstraint.SupportedTab) {
    const {
      rnaMoleculeName,
      nucleotideIndex
    } = this.fullKeys;
    const mappedBasePair = this.mappedBasePair;
    const rerender = this.rerender;
    const center = scaleUp(
      add(
        this.singularNucleotideProps,
        this.basePairedSingularNucleotideProps
      ),
      0.5
    );
    const difference = subtract(
      this.singularNucleotideProps,
      this.basePairedSingularNucleotideProps
    );
    const originalDistance = magnitude(difference);
    console.log(`originalDistance: ${originalDistance}`);
    const oneOverOriginalDistance = 1 / originalDistance;
    const originalAngle = asAngle(difference);
    const normalizedPolarCoordinateData = this.toBeDragged.map(function(position) {
      const polarCoordinate = toPolar(subtract(position, center));
      polarCoordinate.angle -= originalAngle;
      polarCoordinate.radius *= oneOverOriginalDistance;
      return polarCoordinate;
    });
    console.log(normalizedPolarCoordinateData);
    const polarRerender = (newAngle : number, newDistance : number) => {
      for (let i = 0; i < normalizedPolarCoordinateData.length; i++) {
        const normalizedPolarCoordinateDatum = normalizedPolarCoordinateData[i];
        const toBeDraggedI = this.toBeDragged[i];
        const cartesianCoordinate = add(
          toCartesian({
            angle : normalizedPolarCoordinateDatum.angle + newAngle,
            radius : normalizedPolarCoordinateDatum.radius * newDistance
          }),
          center
        );
        toBeDraggedI.x = cartesianCoordinate.x;
        toBeDraggedI.y = cartesianCoordinate.y;
      }
      rerender();
    };
    // const onChangeBasePairDistance = (newBasePairDistance : number) => {
    //   const basePairDistanceOverTwo = newBasePairDistance * 0.5;
    //   const dv = scaleUp(axis, basePairDistanceOverTwo);
    //   const newV0 = add(center, dv);
    //   const newV1 = subtract(center, dv);
    //   this.singularNucleotideProps.x = newV0.x;
    //   this.singularNucleotideProps.y = newV0.y;
    //   this.basePairedSingularNucleotideProps.x = newV1.x;
    //   this.basePairedSingularNucleotideProps.y = newV1.y;
    //   rerender();
    // }
    return <>
      <b>
        Edit menu for single base pair:
      </b>
      <br/>
      Nucleotide #{nucleotideIndex + this.basePairedSingularRnaMoleculeProps.firstNucleotideIndex} ({this.singularNucleotideProps.symbol})
      <br/>
      In RNA molecule "{rnaMoleculeName}"
      <br/>
      Base-paired to:
      <br/>
      Nucleotide #{this.mappedBasePair.nucleotideIndex + this.basePairedSingularRnaMoleculeProps.firstNucleotideIndex} ({this.basePairedSingularNucleotideProps.symbol})
      <br/>
      In RNA molecule "{this.mappedBasePair.rnaMoleculeName}"
      <br/>
      In RNA complex "{this.singularRnaComplexProps.name}"
      <br/>
      <SingleBasePairInteractionConstraintEditMenu.Component
        basePairType = {this.mappedBasePair.basePairType ?? getBasePairType(this.singularNucleotideProps.symbol, this.basePairedSingularNucleotideProps.symbol)}
        basePairDistance = {originalDistance}
        basePairAngle = {originalAngle}
        onChangeBasePairType = {function(newBasePairType : BasePair.Type) {
          mappedBasePair.basePairType = newBasePairType;
          rerender();
        }}
        polarRerender = {polarRerender}
      />
    </>;
  }
}