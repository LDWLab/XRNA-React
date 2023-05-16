import { RnaComplexProps, FullKeys, DragListener } from "../../../App";
import { RnaComplex, compareBasePairKeys } from "../../../components/app_specific/RnaComplex";
import { RnaMolecule } from "../../../components/app_specific/RnaMolecule";
import { NucleotideKeysToRerender, BasePairKeysToRerender, BasePairKeysToRerenderPerRnaComplex, NucleotideKeysToRerenderPerRnaMolecule } from "../../../context/Context";
import { Vector2D } from "../../../data_structures/Vector2D";
import { sign, subtractNumbers } from "../../../utils/Utils";
import { AbstractInteractionConstraint, InteractionConstraintError } from "../AbstractInteractionConstraint";
import { linearDrag } from "../CommonDragListeners";
import { InteractionConstraint, populateToBeDraggedWithHelix } from "../InteractionConstraints";

export class RnaStackedHelixInteractionConstraint extends AbstractInteractionConstraint {
  private readonly dragListener : DragListener;

  public constructor(
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
    const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
    const rnaMoleculeName0 = rnaMoleculeName;
    const nucleotideIndex0 = nucleotideIndex;
    if (!(rnaMoleculeName0 in basePairsPerRnaComplex)) {
      const error : InteractionConstraintError = {
        errorMessage : "Cannot drag a non-base-paired nucleotide using this interaction constraint."
      };
      throw error;
    }
    const basePairsPerRnaMolecule0 = basePairsPerRnaComplex[rnaMoleculeName0];
    if (!(nucleotideIndex0 in basePairsPerRnaMolecule0)) {
      const error : InteractionConstraintError = {
        errorMessage : "Cannot drag a non-base-paired nucleotide using this interaction constraint."
      };
      throw error;
    }
    const originalMappedBasePairInformation = basePairsPerRnaMolecule0[nucleotideIndex0];
    const rnaMoleculeName1 = originalMappedBasePairInformation.rnaMoleculeName;
    const basePairsPerRnaMolecule1 = basePairsPerRnaComplex[rnaMoleculeName1];
    const nucleotideIndex1 = originalMappedBasePairInformation.nucleotideIndex;
    const toBeDragged = new Array<Vector2D>();
    const nucleotideKeysToRerender : NucleotideKeysToRerender = {
      [rnaComplexIndex] : {
        [rnaMoleculeName0] : [],
        [rnaMoleculeName1] : []
      }
    };
    const nucleotideKeysToRerenderPerRnaComplex = nucleotideKeysToRerender[rnaComplexIndex];
    const nucleotideKeysToRerenderPerRnaMolecule0 = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName0];
    const nucleotideKeysToRerenderPerRnaMolecule1 = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName1];
    const basePairKeysToRerender : BasePairKeysToRerender = {
      [rnaComplexIndex] : []
    };
    const basePairKeysToRerenderPerRnaComplex = basePairKeysToRerender[rnaComplexIndex];
    const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
    const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];

    const extremaWithCauseOfTerminationIncremented = populateToBeDraggedWithHelix(
      1,
      nucleotideIndex0,
      nucleotideIndex1,
      basePairsPerRnaMolecule0,
      rnaMoleculeName0,
      rnaMoleculeName1,
      toBeDragged,
      singularRnaMoleculeProps0,
      singularRnaMoleculeProps1,
      nucleotideKeysToRerenderPerRnaMolecule0,
      nucleotideKeysToRerenderPerRnaMolecule1,
      basePairKeysToRerenderPerRnaComplex,
      true,
    );
    const extremaWithCauseOfTerminationDecremented = populateToBeDraggedWithHelix(
      -1,
      nucleotideIndex0,
      nucleotideIndex1,
      basePairsPerRnaMolecule0,
      rnaMoleculeName0,
      rnaMoleculeName1,
      toBeDragged,
      singularRnaMoleculeProps0,
      singularRnaMoleculeProps1,
      nucleotideKeysToRerenderPerRnaMolecule0,
      nucleotideKeysToRerenderPerRnaMolecule1,
      basePairKeysToRerenderPerRnaComplex,
      false,
    );
    const extremaIncremented = extremaWithCauseOfTerminationIncremented.extrema;
    const extremaDecremented = extremaWithCauseOfTerminationDecremented.extrema;
    let nucleotideIndex1Delta = sign(extremaIncremented[1] - extremaDecremented[1]);
    if (nucleotideIndex1Delta === 0) {
      outerLoop: for (let nucleotideIndex0Delta of [-1, 1]) {
        let nucleotideIndex0I = nucleotideIndex0;
        while (true) {
          nucleotideIndex0I += nucleotideIndex0Delta;
          if (!(nucleotideIndex0I in singularRnaMoleculeProps0.nucleotideProps)) {
            continue outerLoop;
          }
          if (nucleotideIndex0I in basePairsPerRnaMolecule0) {
            const mappedBasePairInformation = basePairsPerRnaMolecule0[nucleotideIndex0I];
            if (mappedBasePairInformation.rnaMoleculeName !== rnaMoleculeName1) {
              continue outerLoop;
            }
            const nucleotideIndex1Start = nucleotideIndex1;
            const nucleotideIndex1End = nucleotideIndex1;
            let minimumNucleotideIndex1 : number;
            let maximumNucleotideIndex1 : number;
            if (nucleotideIndex1Start > nucleotideIndex1End) {
              minimumNucleotideIndex1 = nucleotideIndex1End;
              maximumNucleotideIndex1 = nucleotideIndex1Start;
            } else {
              minimumNucleotideIndex1 = nucleotideIndex1Start;
              maximumNucleotideIndex1 = nucleotideIndex1End;
            }
            break;
          }
          // const singularNucleotideProps0 = singularRnaMoleculeProps0.nucleotideProps[nucleotideIndex0I];
        }
      }
    }

    if (nucleotideIndex1Delta === 0) {

    }

    function populateToBeDragged(
      nucleotideIndex0Delta : -1 | 1,
      nucleotideIndex1Delta : -1 | 1,
      nucleotideIndex0 : number,
      nucleotideIndex1 : number,
      basePairsPerRnaMolecule0 : RnaComplex.BasePairsPerRnaMolecule,
      basePairsPerRnaMolecule1 : RnaComplex.BasePairsPerRnaMolecule,
      rnaMoleculeName0 : string,
      rnaMoleculeName1 : string,
      toBeDragged : Array<Vector2D>,
      singularRnaMoleculeProps0 : RnaMolecule.ExternalProps,
      singularRnaMoleculeProps1 : RnaMolecule.ExternalProps,
      basePairKeysToRerenderPerRnaComplex : BasePairKeysToRerenderPerRnaComplex,
    ) {
      let temporaryToBeDragged = new Array<Vector2D>();
      let temporaryNucleotideKeysToRerenderPerRnaMolecule0 : NucleotideKeysToRerenderPerRnaMolecule = [];
      let temporaryNucleotideKeysToRerenderPerRnaMolecule1 : NucleotideKeysToRerenderPerRnaMolecule = [];
      outer: while (true) {
        inner: while (true) {
          nucleotideIndex0 += nucleotideIndex0Delta;
          if (!(nucleotideIndex0 in singularRnaMoleculeProps0.nucleotideProps)) {
            break outer;
          }
          const singularNucleotideProps0 = singularRnaMoleculeProps0.nucleotideProps[nucleotideIndex0];
          if (nucleotideIndex0 in basePairsPerRnaMolecule0) {
            break inner;
          }
          temporaryToBeDragged.push(singularNucleotideProps0);
          temporaryNucleotideKeysToRerenderPerRnaMolecule0.push(nucleotideIndex0);
        }
        inner: while(true) {
          nucleotideIndex1 += nucleotideIndex1Delta;
          if (!(nucleotideIndex1 in singularRnaMoleculeProps1.nucleotideProps)) {
            break outer;
          }
          const singularNucleotideProps1 = singularRnaMoleculeProps1.nucleotideProps[nucleotideIndex1];
          if (nucleotideIndex1 in basePairsPerRnaMolecule1) {
            break inner;
          }
          temporaryToBeDragged.push(singularNucleotideProps1);
          temporaryNucleotideKeysToRerenderPerRnaMolecule1.push(nucleotideIndex1);
        }
        const mappedBasePairInformation = basePairsPerRnaMolecule0[nucleotideIndex0];
        if (mappedBasePairInformation.rnaMoleculeName !== rnaMoleculeName1) {
          break outer;
        }
        if (mappedBasePairInformation.nucleotideIndex !== nucleotideIndex1) {
          break outer;
        }
        toBeDragged.push(...temporaryToBeDragged);
        nucleotideKeysToRerenderPerRnaMolecule0.push(...temporaryNucleotideKeysToRerenderPerRnaMolecule0);
        nucleotideKeysToRerenderPerRnaMolecule1.push(...temporaryNucleotideKeysToRerenderPerRnaMolecule1);
        const extremaWithCauseOfTermination = populateToBeDraggedWithHelix(
          nucleotideIndex0Delta,
          nucleotideIndex0,
          nucleotideIndex1,
          basePairsPerRnaMolecule0,
          rnaMoleculeName0,
          rnaMoleculeName1,
          toBeDragged,
          singularRnaMoleculeProps0,
          singularRnaMoleculeProps1,
          nucleotideKeysToRerenderPerRnaMolecule0,
          nucleotideKeysToRerenderPerRnaMolecule1,
          basePairKeysToRerenderPerRnaComplex,
          true
        );
        const extrema = extremaWithCauseOfTermination.extrema;
        nucleotideIndex0 = extrema[0];
        nucleotideIndex1 = extrema[1];
      }
    }

    for (let nucleotideIndexDeltas of [{ 0 : 1, 1 : nucleotideIndex1Delta}, { 0 : -1, 1 : -nucleotideIndex1Delta }]) {
      populateToBeDragged(
        nucleotideIndexDeltas[0] as -1 | 1,
        nucleotideIndexDeltas[1] as -1 | 1,
        nucleotideIndex0,
        nucleotideIndex1,
        basePairsPerRnaMolecule0,
        basePairsPerRnaMolecule1,
        rnaMoleculeName0,
        rnaMoleculeName1,
        toBeDragged,
        singularRnaMoleculeProps0,
        singularRnaMoleculeProps1,
        basePairKeysToRerenderPerRnaComplex
      );
    }

    const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
    const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];

    nucleotideKeysToRerenderPerRnaMolecule0.sort(subtractNumbers);
    nucleotideKeysToRerenderPerRnaMolecule1.sort(subtractNumbers);
    basePairKeysToRerenderPerRnaComplex.sort(compareBasePairKeys);

    this.dragListener = linearDrag(
      structuredClone(singularNucleotideProps),
      toBeDragged,
      function() {
        setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
        setBasePairKeysToRerender(structuredClone(basePairKeysToRerender));
      }
    );
  }

  public override drag() {
    return this.dragListener;
  }

  public override createRightClickMenu(tab: InteractionConstraint.SupportedTab) {
    return <>Not yet implemented.</>;
  }
}