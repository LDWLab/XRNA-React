import { RnaComplexProps, FullKeys, DragListener } from "../../../App";
import { Nucleotide } from "../../../components/app_specific/Nucleotide";
import { compareBasePairKeys, selectRelevantBasePairKeys } from "../../../components/app_specific/RnaComplex";
import { BasePairKeysToRerender, BasePairKeysToRerenderPerRnaComplex, NucleotideKeysToRerender, NucleotideKeysToRerenderPerRnaComplex, NucleotideKeysToRerenderPerRnaMolecule } from "../../../context/Context";
import { linearDrag } from "../CommonDragListeners";
import { AbstractInteractionConstraint, nonBasePairedNucleotideError, nonBasePairedNucleotideErrorMessage } from "../AbstractInteractionConstraint";
import { Extrema, InteractionConstraint, calculateExtremaMagnitudeDifference, checkExtremaForSingleStrand, populateToBeDraggedWithHelix } from "../InteractionConstraints";
import { subtractNumbers } from "../../../utils/Utils";
import { scaleUp, add, orthogonalizeLeft, subtract, asAngle, Vector2D } from "../../../data_structures/Vector2D";
import { AppSpecificOrientationEditor } from "../../../components/app_specific/editors/AppSpecificOrientationEditor";

export class RnaHelixInteractionConstraint extends AbstractInteractionConstraint {
  private readonly dragListener : DragListener;
  private readonly editMenuHeader : JSX.Element;
  private readonly editMenuProps : AppSpecificOrientationEditor.Props;

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
    const rnaMoleculeName0 = rnaMoleculeName;
    const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
    const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
    const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
    const singularNucleotideProps0 = singularRnaMoleculeProps0.nucleotideProps[nucleotideIndex];
    if (!(rnaMoleculeName0 in basePairsPerRnaComplex)) {
      throw nonBasePairedNucleotideError;
    }
    const basePairsPerRnaMolecule0 = basePairsPerRnaComplex[rnaMoleculeName0];
    if (!(nucleotideIndex in basePairsPerRnaMolecule0)) {
      throw nonBasePairedNucleotideError;
    }
    const originalMappedBasePairInformation = basePairsPerRnaMolecule0[nucleotideIndex];
    const rnaMoleculeName1 = originalMappedBasePairInformation.rnaMoleculeName;
    const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
    const singularNucleotideProps1 = singularRnaMoleculeProps1.nucleotideProps[originalMappedBasePairInformation.nucleotideIndex];
    const toBeDragged = new Array<Nucleotide.ExternalProps>();
    const nucleotideKeysToRerenderPerRnaComplex : NucleotideKeysToRerenderPerRnaComplex = {
      [rnaMoleculeName0] : [],
      [rnaMoleculeName1] : []
    };
    const nucleotideKeysToRerenderPerRnaMolecule0 = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName0];
    const nucleotideKeysToRerenderPerRnaMolecule1 = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName1];
    nucleotideKeysToRerenderPerRnaMolecule0.push(nucleotideIndex);
    nucleotideKeysToRerenderPerRnaMolecule1.push(originalMappedBasePairInformation.nucleotideIndex);
    const nucleotideKeysToRerender : NucleotideKeysToRerender = {
      [rnaComplexIndex] : nucleotideKeysToRerenderPerRnaComplex
    };
    const basePairKeysToRerender : BasePairKeysToRerender = {
      [rnaComplexIndex] : []
    };
    const basePairKeysToRerenderPerRnaComplex = basePairKeysToRerender[rnaComplexIndex];
    basePairKeysToRerenderPerRnaComplex.push(selectRelevantBasePairKeys(
      {
        rnaMoleculeName : rnaMoleculeName0,
        nucleotideIndex : nucleotideIndex
      },
      {
        rnaMoleculeName : rnaMoleculeName1,
        nucleotideIndex : originalMappedBasePairInformation.nucleotideIndex
      }
    ));
    // toBeDragged.push(
    //   singularNucleotideProps0,
    //   singularNucleotideProps1
    // );
    const extrema0 = populateToBeDraggedWithHelix(
      -1,
      nucleotideIndex,
      originalMappedBasePairInformation.nucleotideIndex,
      basePairsPerRnaMolecule0,
      rnaMoleculeName0,
      rnaMoleculeName1,
      toBeDragged,
      singularRnaMoleculeProps0,
      singularRnaMoleculeProps1,
      nucleotideKeysToRerenderPerRnaMolecule0,
      nucleotideKeysToRerenderPerRnaMolecule1,
      basePairKeysToRerenderPerRnaComplex
    ).extrema;
    const extrema1 = populateToBeDraggedWithHelix(
      1,
      nucleotideIndex,
      originalMappedBasePairInformation.nucleotideIndex,
      basePairsPerRnaMolecule0,
      rnaMoleculeName0,
      rnaMoleculeName1,
      toBeDragged,
      singularRnaMoleculeProps0,
      singularRnaMoleculeProps1,
      nucleotideKeysToRerenderPerRnaMolecule0,
      nucleotideKeysToRerenderPerRnaMolecule1,
      basePairKeysToRerenderPerRnaComplex,
      false
    ).extrema;
    if (rnaMoleculeName0 === rnaMoleculeName1) {
      const extremaMagnitudeDifference = calculateExtremaMagnitudeDifference(extrema0, extrema1);
      // Check whether the helix strands are oriented in parallel (as compared to anti-parallel).
      if (extremaMagnitudeDifference === 0) {
        checkExtremaForSingleStrand(
          extrema0,
          basePairsPerRnaMolecule0,
          toBeDragged,
          singularRnaMoleculeProps0,
          nucleotideKeysToRerenderPerRnaMolecule0
        );
        if (extrema0[0] !== extrema1[0]) {
          // This check removes duplicates from toBeDragged.
          checkExtremaForSingleStrand(
            extrema1,
            basePairsPerRnaMolecule0,
            toBeDragged,
            singularRnaMoleculeProps0,
            nucleotideKeysToRerenderPerRnaMolecule0
          );
        }
      } else if (extremaMagnitudeDifference < 0) {
        checkExtremaForSingleStrand(
          extrema0,
          basePairsPerRnaMolecule0,
          toBeDragged,
          singularRnaMoleculeProps0,
          nucleotideKeysToRerenderPerRnaMolecule0
        );
      } else {
        checkExtremaForSingleStrand(
          extrema1,
          basePairsPerRnaMolecule0,
          toBeDragged,
          singularRnaMoleculeProps0,
          nucleotideKeysToRerenderPerRnaMolecule0
        );
      }
    }
    nucleotideKeysToRerenderPerRnaMolecule0.sort(subtractNumbers);
    nucleotideKeysToRerenderPerRnaMolecule1.sort(subtractNumbers);
    basePairKeysToRerenderPerRnaComplex.sort(compareBasePairKeys);
    function rerender() {
      setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
      setBasePairKeysToRerender(structuredClone(basePairKeysToRerender));
    }
    this.dragListener = linearDrag(
      {
        x : singularNucleotideProps0.x,
        y : singularNucleotideProps0.y
      },
      toBeDragged,
      rerender
    );
    const nucleotideRange0Text = `Nucleotides [${extrema0[0] + singularRnaMoleculeProps0.firstNucleotideIndex}, ${extrema1[0] + singularRnaMoleculeProps0.firstNucleotideIndex}]`;
    const nucleotideRange1Text = `Nucleotides [${extrema0[1] + singularRnaMoleculeProps1.firstNucleotideIndex}, ${extrema1[1] + singularRnaMoleculeProps1.firstNucleotideIndex}]`;
    let nucleotideAndRnaMoleculeJsx : JSX.Element;
    if (rnaMoleculeName0 === rnaMoleculeName1) {
      nucleotideAndRnaMoleculeJsx = <>
        {nucleotideRange0Text}
        <br/>
        Contiguously bound to
        <br/>
        {nucleotideRange1Text}
        <br/>
        In RNA molecule "{rnaMoleculeName0}"
      </>;
    } else {
      nucleotideAndRnaMoleculeJsx = <>
        {nucleotideRange0Text}
        <br/>
        In RNA molecule "{rnaMoleculeName0}"
        <br/>
        {nucleotideRange1Text}
        <br/>
        In RNA molecule "{rnaMoleculeName1}"
      </>;
    }
    let boundingNucleotide0 : Vector2D;
    let boundingNucleotide1 : Vector2D;
    if (rnaMoleculeName0 === rnaMoleculeName1) {
      let boundingNucleotideIndex0 = Math.min(
        extrema0[0],
        extrema0[1],
        extrema1[0],
        extrema1[1]
      );
      let boundingNucleotideIndex1 : number;
      switch (boundingNucleotideIndex0) {
        case extrema0[0] : {
          boundingNucleotideIndex1 = extrema0[1];
          break;
        }
        case extrema0[1] : {
          boundingNucleotideIndex1 = extrema0[0];
          break;
        }
        case extrema1[0] : {
          boundingNucleotideIndex1 = extrema1[1];
          break;
        }
        case extrema1[1] : {
          boundingNucleotideIndex1 = extrema1[0];
          break;
        }
        default : {
          throw "This condition should be impossible.";
        }
      }
      boundingNucleotide0 = singularRnaMoleculeProps0.nucleotideProps[boundingNucleotideIndex0];
      boundingNucleotide1 = singularRnaMoleculeProps0.nucleotideProps[boundingNucleotideIndex1];
    } else {
      boundingNucleotide0 = singularNucleotideProps0;
      boundingNucleotide1 = singularNucleotideProps1;
    }
    const boundingCenter = scaleUp(
      add(
        boundingNucleotide0,
        boundingNucleotide1
      ),
      0.5
    );
    const normalVector = orthogonalizeLeft(subtract(
      boundingNucleotide1,
      boundingNucleotide0
    ));
    this.editMenuHeader = <>
      <b>
        Edit helix:
      </b>
      <br/>
      {nucleotideAndRnaMoleculeJsx}
      <br/>
      In RNA complex "{singularRnaComplexProps.name}"
      <br/>
    </>;
    this.editMenuProps = {
      initialCenter : boundingCenter,
      positions : toBeDragged,
      onUpdatePositions : rerender,
      normal : normalVector,
      initialAngle : asAngle(normalVector)
    };
  }

  public override drag() {
    return this.dragListener;
  }

  public override createRightClickMenu(tab: InteractionConstraint.SupportedTab) {
    return <>
      {this.editMenuHeader}
      <AppSpecificOrientationEditor.Component
        {...this.editMenuProps}
      />
    </>;
  }
}