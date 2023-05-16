import { DragListener, FullKeys, RnaComplexProps } from "../../App";
import { Tab } from "../../app_data/Tab";
import { compareBasePairKeys, RnaComplex, selectRelevantBasePairKeys } from "../../components/app_specific/RnaComplex";
import { RnaMolecule } from "../../components/app_specific/RnaMolecule";
import { BasePairKeysToRerender, BasePairKeysToRerenderPerRnaComplex, NucleotideKeysToRerender, NucleotideKeysToRerenderPerRnaMolecule } from "../../context/Context";
import { Vector2D } from "../../data_structures/Vector2D";
import { AbstractInteractionConstraint } from "./AbstractInteractionConstraint";
import { EntireSceneInteractionConstraint } from "./InteractionConstraints/EntireSceneInteractionConstraint";
import { RnaComplexInteractionConstraint } from "./InteractionConstraints/RnaComplexInteractionConstraint";
import { RnaCycleInteractionConstraint } from "./InteractionConstraints/RnaCycleInteractionConstraint";
import { RnaHelixInteractionConstraint } from "./InteractionConstraints/RnaHelixInteractionConstraint";
import { RnaMoleculeInteractionConstraint } from "./InteractionConstraints/RnaMoleculeInteractionConstraint";
import { RnaSingleStrandInteractionConstraint } from "./InteractionConstraints/RnaSingleStrandInteractionConstraint";
import { RnaStackedHelixInteractionConstraint } from "./InteractionConstraints/RnaStackedHelixInteractionConstraint";
import { RnaSubdomainInteractionConstraint } from "./InteractionConstraints/RnaSubdomainInteractionConstraint";
import { SingleBasePairInteractionConstraint } from "./InteractionConstraints/SingleBasePairInteractionConstraint";
import { SingleColorInteractionConstraint } from "./InteractionConstraints/SingleColorInteractionConstraint";
import { SingleNucleotideInteractionConstraint } from "./InteractionConstraints/SingleNucleotideInteractionConstraint";

export type Extrema = {
  0 : number,
  1 : number
}

export function checkExtremaForSingleStrand(
  extrema : Extrema,
  basePairsPerRnaMolecule : RnaComplex.BasePairsPerRnaMolecule,
  toBeDragged : Array<Vector2D>,
  singularRnaMoleculeProps : RnaMolecule.ExternalProps,
  nucleotideKeysToRerenderPerRnaMolecule : NucleotideKeysToRerenderPerRnaMolecule
) {
  const toBeDraggedNucleotideIndices = [];
  let minimumNucleotideIndex;
  let maximumNucleotideIndex;
  if (extrema[0] <= extrema[1]) {
    minimumNucleotideIndex = extrema[0];
    maximumNucleotideIndex = extrema[1];
  } else {
    minimumNucleotideIndex = extrema[1];
    maximumNucleotideIndex = extrema[0];
  }
  let singleStrandFlag = true;
  for (let nucleotideIndexI = minimumNucleotideIndex + 1; nucleotideIndexI < maximumNucleotideIndex; nucleotideIndexI++) {
    if (basePairsPerRnaMolecule[nucleotideIndexI]) {
      singleStrandFlag = false;
      break;
    }
    toBeDraggedNucleotideIndices.push(nucleotideIndexI);
  }
  if (singleStrandFlag) {
    nucleotideKeysToRerenderPerRnaMolecule.push(...toBeDraggedNucleotideIndices);
    toBeDragged.push(...toBeDraggedNucleotideIndices.map(function(nucleotideIndex) { return singularRnaMoleculeProps.nucleotideProps[nucleotideIndex]; }));
  }
}

export enum CauseOfTermination {
  EndOfMolecule = "End of molecule",
  NonBasePairedNucleotide = "Non-basepaired nucleotide",
  RnaMoleculeMismatch = "RNA molecule mismatch",
  NoncontiguousBasePair = "Non-contiguous basepair",
  HairpinLoop = "Hairpin loop"
}

export type PopulateToBeDraggedReturnType = {
  extrema : Extrema,
  causeOfTermination : CauseOfTermination
};

export function populateToBeDraggedWithHelix(
  nucleotideIndex0Delta : -1 | 1,
  initialNucleotideIndex0 : number,
  initialNucleotideIndex1 : number,
  basePairsPerRnaMolecule0 : RnaComplex.BasePairsPerRnaMolecule,
  rnaMoleculeName0 : string,
  rnaMoleculeName1 : string,
  toBeDragged : Array<Vector2D>,
  singularRnaMoleculeProps0 : RnaMolecule.ExternalProps,
  singularRnaMoleculeProps1 : RnaMolecule.ExternalProps,
  nucleotideKeysToRerenderPerRnaMolecule0 : NucleotideKeysToRerenderPerRnaMolecule,
  nucleotideKeysToRerenderPerRnaMolecule1 : NucleotideKeysToRerenderPerRnaMolecule,
  basePairKeysToRerenderPerRnaComplex : BasePairKeysToRerenderPerRnaComplex,
  includeInitialIndicesFlag = true,
  helper = function(keys : RnaComplex.BasePairKeys) {
    // Do nothing.
  }
) : PopulateToBeDraggedReturnType {
  let nucleotideIndex0 = initialNucleotideIndex0;
  let previousNucleotideIndex1 = initialNucleotideIndex1;
  let extrema = {
    0 : nucleotideIndex0,
    1 : previousNucleotideIndex1
  };
  let causeOfTermination : CauseOfTermination;
  function pushNucleotideIndices(
    nucleotideIndex0 : number,
    nucleotideIndex1 : number
  ) {
    toBeDragged.push(
      singularRnaMoleculeProps0.nucleotideProps[nucleotideIndex0],
      singularRnaMoleculeProps1.nucleotideProps[nucleotideIndex1]
    );
    let keys0 = {
      rnaMoleculeName : rnaMoleculeName0,
      nucleotideIndex : nucleotideIndex0
    };
    let keys1 = {
      rnaMoleculeName : rnaMoleculeName1,
      nucleotideIndex : nucleotideIndex1
    };
    helper(keys0);
    helper(keys1);
    nucleotideKeysToRerenderPerRnaMolecule0.push(nucleotideIndex0);
    nucleotideKeysToRerenderPerRnaMolecule1.push(nucleotideIndex1);
    basePairKeysToRerenderPerRnaComplex.push(selectRelevantBasePairKeys(
      keys0,
      keys1
    ));
  }
  if (includeInitialIndicesFlag) {
    pushNucleotideIndices(
      initialNucleotideIndex0,
      initialNucleotideIndex1
    );
  }
  for (;;) {
    nucleotideIndex0 += nucleotideIndex0Delta;
    if (!(nucleotideIndex0 in singularRnaMoleculeProps0.nucleotideProps)) {
      causeOfTermination = CauseOfTermination.EndOfMolecule;
      break;
    }
    if (!(nucleotideIndex0 in basePairsPerRnaMolecule0)) {
      causeOfTermination = CauseOfTermination.NonBasePairedNucleotide;
      break;
    }
    let mappedBasePairInformation = basePairsPerRnaMolecule0[nucleotideIndex0];
    const nucleotideIndex1 = mappedBasePairInformation.nucleotideIndex;
    if (mappedBasePairInformation.rnaMoleculeName !== rnaMoleculeName1) {
      causeOfTermination = CauseOfTermination.RnaMoleculeMismatch;
      break;
    }
    const nucleotideIndex1Delta = previousNucleotideIndex1 - nucleotideIndex1;
    if (Math.abs(nucleotideIndex1Delta) != 1) {
      causeOfTermination = CauseOfTermination.NoncontiguousBasePair;
      break;
    }
    pushNucleotideIndices(
      nucleotideIndex0,
      nucleotideIndex1
    );
    previousNucleotideIndex1 = nucleotideIndex1;
    extrema = {
      0 : nucleotideIndex0,
      1 : previousNucleotideIndex1
    };
  }
  return {
    extrema,
    causeOfTermination
  };
}

export function calculateExtremaMagnitudeDifference(
  extrema0 : Extrema,
  extrema1 : Extrema
) {
  return Math.abs(extrema0[0] - extrema0[1]) - Math.abs(extrema1[0] - extrema1[1]);
}

export namespace InteractionConstraint {
  export type SupportedTab = Extract<Tab, Tab.EDIT | Tab.FORMAT | Tab.ANNOTATE>;
  export const supportedTabs : Record<SupportedTab, Tab> = {
    [Tab.EDIT] : Tab.EDIT,
    [Tab.FORMAT] : Tab.FORMAT,
    [Tab.ANNOTATE] : Tab.ANNOTATE
  };

  export enum Enum {
    SINGLE_NUCLEOTIDE = "Single nucleotide",
    SINGLE_BASE_PAIR = "Single basepair",
    RNA_SINGLE_STRAND = "RNA single strand",
    RNA_HELIX = "RNA helix",
    RNA_STACKED_HELIX = "RNA stacked helix",
    RNA_SUB_DOMAIN = "RNA sub-domain",
    RNA_CYCLE = "RNA cycle",
    RNA_MOLECULE = "RNA molecule",
    RNA_COMPLEX = "RNA complex",
    SINGLE_COLOR = "Single color",
    // CUSTOM_RANGE = "Custom range",
    // NAMED_GROUP = "Named group",
    ENTIRE_SCENE = "Entire scene"
  }
    
  export const all = Object.values(Enum);

  export const record : Record<
    Enum,
    (
      rnaComplexProps : RnaComplexProps,
      fullKeys : FullKeys,
      setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void,
      setBasePairKeysToRerender : (basePairKeysToRerender : BasePairKeysToRerender) => void,
      setDebugVisualElements : (debugVisualElements : Array<JSX.Element>) => void
    ) => AbstractInteractionConstraint
  > = {
    [Enum.SINGLE_NUCLEOTIDE] : function(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements
    ) {
      return new SingleNucleotideInteractionConstraint(
        rnaComplexProps,
        fullKeys,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender,
        setDebugVisualElements
      ); 
    },
    [Enum.SINGLE_BASE_PAIR] : function(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements
    ) {
      return new SingleBasePairInteractionConstraint(
        rnaComplexProps,
        fullKeys,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender,
        setDebugVisualElements
      );
    },
    [Enum.RNA_SINGLE_STRAND] : function(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements
    ) {
      return new RnaSingleStrandInteractionConstraint(
        rnaComplexProps,
        fullKeys,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender,
        setDebugVisualElements
      );
    },
    [Enum.RNA_HELIX] : function(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements
    ) {
      return new RnaHelixInteractionConstraint(
        rnaComplexProps,
        fullKeys,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender,
        setDebugVisualElements
      );
    },
    [Enum.RNA_STACKED_HELIX] : function(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements
    ) {
      return new RnaStackedHelixInteractionConstraint(
        rnaComplexProps,
        fullKeys,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender,
        setDebugVisualElements
      );
    },
    [Enum.RNA_CYCLE] : function(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements
    ) {
      return new RnaCycleInteractionConstraint(
        rnaComplexProps,
        fullKeys,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender,
        setDebugVisualElements
      );
    },
    [Enum.RNA_SUB_DOMAIN] : function(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements
    ) {
      return new RnaSubdomainInteractionConstraint(
        rnaComplexProps,
        fullKeys,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender,
        setDebugVisualElements
      );
    },
    [Enum.RNA_MOLECULE] : function(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements
    ) {
      return new RnaMoleculeInteractionConstraint(
        rnaComplexProps,
        fullKeys,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender,
        setDebugVisualElements
      );
    },
    [Enum.RNA_COMPLEX] : function(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements
    ) {
      return new RnaComplexInteractionConstraint(
        rnaComplexProps,
        fullKeys,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender,
        setDebugVisualElements
      );
    },
    [Enum.SINGLE_COLOR] : function(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements
    ) {
      return new SingleColorInteractionConstraint(
        rnaComplexProps,
        fullKeys,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender,
        setDebugVisualElements
      );
    },
    [Enum.ENTIRE_SCENE] : function(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements
    ) {
      return new EntireSceneInteractionConstraint(
        rnaComplexProps,
        fullKeys,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender,
        setDebugVisualElements
      );
    }
  };
}