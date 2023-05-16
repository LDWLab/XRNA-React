import { RnaComplexProps, FullKeys, DragListener } from "../../../App";
import { Nucleotide } from "../../../components/app_specific/Nucleotide";
import { RnaComplex, compareBasePairKeys, isRelevantBasePairKeySetInPair } from "../../../components/app_specific/RnaComplex";
import { NucleotideKeysToRerender, BasePairKeysToRerender, BasePairKeysToRerenderPerRnaComplex, NucleotideKeysToRerenderPerRnaMolecule, NucleotideKeysToRerenderPerRnaComplex } from "../../../context/Context";
import { subtractNumbers } from "../../../utils/Utils";
import { AbstractInteractionConstraint, InteractionConstraintError, nonBasePairedNucleotideError } from "../AbstractInteractionConstraint";
import { linearDrag } from "../CommonDragListeners";
import { InteractionConstraint, populateToBeDraggedWithHelix } from "../InteractionConstraints";

export class RnaSubdomainInteractionConstraint extends AbstractInteractionConstraint {
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
    const rnaMoleculeName0 = rnaMoleculeName;
    const nucleotideIndex0 = nucleotideIndex;
    const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
    const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
    const singularNucleotideProps0 = singularRnaMoleculeProps0.nucleotideProps[nucleotideIndex];
    const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
    if (!(rnaMoleculeName0 in basePairsPerRnaComplex)) {
      throw nonBasePairedNucleotideError
    }
    const basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName0];
    const originalMappedBasePairInformation = basePairsPerRnaMolecule[nucleotideIndex];
    const rnaMoleculeName1 = originalMappedBasePairInformation.rnaMoleculeName;
    if (rnaMoleculeName0 !== rnaMoleculeName1) {
      const error : InteractionConstraintError = {
        errorMessage : "Cannot interact with a base pair between two distinct rna molecules using this interaction constraint."
      }
      throw error;
    }
    const nucleotideIndex1 = originalMappedBasePairInformation.nucleotideIndex;
    const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
    const toBeDragged = new Array<Nucleotide.ExternalProps>();
    const nucleotideKeysToRerender : NucleotideKeysToRerender = {
      [rnaComplexIndex] : {
        [rnaMoleculeName0] : []
      }
    };
    const nucleotideKeysToRerenderPerRnaComplex : NucleotideKeysToRerenderPerRnaComplex = nucleotideKeysToRerender[rnaComplexIndex];
    const nucleotideKeysToRerenderPerRnaMolecule = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName0];
    const basePairKeysToRerenderPerRnaComplex : BasePairKeysToRerenderPerRnaComplex = [];
    const basePairKeysToRerender : BasePairKeysToRerender = {
      [rnaComplexIndex] : basePairKeysToRerenderPerRnaComplex
    };
    const listOfNucleotideIndices : Array<number> = [];
    function pushToListOfNucleotideIndices(keys : RnaComplex.BasePairKeys) {
      listOfNucleotideIndices.push(keys.nucleotideIndex);
    }
    populateToBeDraggedWithHelix(
      1,
      nucleotideIndex0,
      nucleotideIndex1,
      basePairsPerRnaMolecule,
      rnaMoleculeName0,
      rnaMoleculeName1,
      toBeDragged,
      singularRnaMoleculeProps0,
      singularRnaMoleculeProps1,
      nucleotideKeysToRerenderPerRnaMolecule,
      nucleotideKeysToRerenderPerRnaMolecule,
      basePairKeysToRerenderPerRnaComplex,
      true,
      pushToListOfNucleotideIndices
    );
    populateToBeDraggedWithHelix(
      -1,
      nucleotideIndex0,
      nucleotideIndex1,
      basePairsPerRnaMolecule,
      rnaMoleculeName0,
      rnaMoleculeName1,
      toBeDragged,
      singularRnaMoleculeProps0,
      singularRnaMoleculeProps1,
      nucleotideKeysToRerenderPerRnaMolecule,
      nucleotideKeysToRerenderPerRnaMolecule,
      basePairKeysToRerenderPerRnaComplex,
      false,
      pushToListOfNucleotideIndices
    );
    listOfNucleotideIndices.sort(subtractNumbers);
    let startingNucleotideIndex = listOfNucleotideIndices[(listOfNucleotideIndices.length - 1) >> 1];
    let endingNucleotideIndex = listOfNucleotideIndices[listOfNucleotideIndices.length >> 1];
    for (let nucleotideIndex = startingNucleotideIndex + 1; nucleotideIndex < endingNucleotideIndex; nucleotideIndex++) {
      toBeDragged.push(singularRnaMoleculeProps0.nucleotideProps[nucleotideIndex]);
      nucleotideKeysToRerenderPerRnaMolecule.push(nucleotideIndex);
      if (nucleotideIndex in basePairsPerRnaMolecule) {
        let keys0 = {
          rnaMoleculeName,
          nucleotideIndex
        }
        if (isRelevantBasePairKeySetInPair(keys0, basePairsPerRnaMolecule[nucleotideIndex])) {
          basePairKeysToRerenderPerRnaComplex.push(keys0);
        }
      }
    }
    nucleotideKeysToRerenderPerRnaMolecule.sort(subtractNumbers);
    basePairKeysToRerenderPerRnaComplex.sort(compareBasePairKeys);
    this.dragListener = linearDrag(
      structuredClone(singularNucleotideProps0),
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
// import { RnaComplexProps, FullKeys } from "../../../App";
// import { NucleotideKeysToRerender, BasePairKeysToRerender } from "../../../context/Context";
// import { Vector2D } from "../../../data_structures/Vector2D";
// import { AbstractInteractionConstraint } from "../AbstractInteractionConstraint";
// import { linearDrag } from "../CommonDragListeners";
// import { InteractionConstraint, populateToBeDraggedWithHelix } from "../InteractionConstraints";

// export class RnaSubdomainInteractionConstraint extends AbstractInteractionConstraint {
//   constructor(
//     rnaComplexProps : RnaComplexProps,
//     fullKeys : FullKeys,
//     setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void,
//     setBasePairKeysToRerender : (basePairKeysToRerender : BasePairKeysToRerender) => void,
//     setDebugVisualElements : (debugVisualElements : Array<JSX.Element>) => void
//   ) {
//     super(
//       rnaComplexProps,
//       fullKeys,
//       setNucleotideKeysToRerender,
//       setBasePairKeysToRerender,
//       setDebugVisualElements
//     );
//   }

//   public override drag() {
//     const {
//       rnaComplexIndex,
//       rnaMoleculeName,
//       nucleotideIndex
//     } = this.fullKeys;
//     const rnaMoleculeName0 = rnaMoleculeName;
//     const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
//     const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
//     const singularNucleotideProps0 = singularRnaMoleculeProps0.nucleotideProps[nucleotideIndex];
//     const noBasePairErrorMessage = `Cannot interact with a non-basepaired nucleotide using interaction constraint "${InteractionConstraint.Enum.RNA_SUB_DOMAIN}"`;
//     const basePairs = singularRnaComplexProps.basePairs;
//     if (!(rnaMoleculeName0 in basePairs)) {
//       return noBasePairErrorMessage;
//     }
//     const basePairsPerRnaMolecule = basePairs[rnaMoleculeName0];
//     if (!(nucleotideIndex in basePairsPerRnaMolecule)) {
//       return noBasePairErrorMessage;
//     }
//     const originalMappedBasePairInformation = basePairsPerRnaMolecule[nucleotideIndex];
//     const rnaMoleculeName1 = originalMappedBasePairInformation.rnaMoleculeName;
//     const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
//     const basePairsPerRnaMolecule1 = basePairs[rnaMoleculeName1];
//     const toBeDragged = new Array<Vector2D>();
//     const nucleotideKeysToRerender : NucleotideKeysToRerender = {
//       [rnaComplexIndex] : {
//         [rnaMoleculeName0] : [],
//         [rnaMoleculeName1] : []
//       }
//     };
//     const nucleotideKeysToRerenderPerRnaComplex = nucleotideKeysToRerender[rnaComplexIndex];
//     const nucleotideKeysToRerenderPerRnaMolecule0 = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName0];
//     const nucleotideKeysToRerenderPerRnaMolecule1 = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName1];
//     const basePairKeysToRerender : BasePairKeysToRerender = {
//       [rnaComplexIndex] : []
//     }
//     const basePairKeysToRerenderPerRnaComplex = basePairKeysToRerender[rnaComplexIndex];
//     const extrema0 = populateToBeDraggedWithHelix(
//       -1,
//       nucleotideIndex,
//       originalMappedBasePairInformation.nucleotideIndex,
//       basePairsPerRnaMolecule,
//       rnaMoleculeName0,
//       rnaMoleculeName1,
//       toBeDragged,
//       singularRnaMoleculeProps0,
//       singularRnaMoleculeProps1,
//       nucleotideKeysToRerenderPerRnaMolecule0,
//       nucleotideKeysToRerenderPerRnaMolecule1,
//       basePairKeysToRerenderPerRnaComplex
//     );
//     const extrema1 = populateToBeDraggedWithHelix(
//       1,
//       nucleotideIndex,
//       originalMappedBasePairInformation.nucleotideIndex,
//       basePairsPerRnaMolecule,
//       rnaMoleculeName0,
//       rnaMoleculeName1,
//       toBeDragged,
//       singularRnaMoleculeProps0,
//       singularRnaMoleculeProps1,
//       nucleotideKeysToRerenderPerRnaMolecule0,
//       nucleotideKeysToRerenderPerRnaMolecule1,
//       basePairKeysToRerenderPerRnaComplex
//     );
//     const setNucleotideKeysToRerender = this.setNucleotideKeysToRerender;
//     const setBasePairKeysToRerender = this.setBasePairKeysToRerender;
//     return linearDrag(
//       {
//         x : singularNucleotideProps0.x,
//         y : singularNucleotideProps0.y
//       },
//       toBeDragged,
//       function() {
//         setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
//       },
//       function() {
//         setBasePairKeysToRerender(structuredClone(basePairKeysToRerender));
//       }
//     );
//   }

//   public override createRightClickMenu(tab : InteractionConstraint.SupportedTab) {
//     return "Not yet implemented";
//   }
// }