import { FunctionComponent, useContext, useState } from "react";
import { DragListener, FullKeys, RnaComplexProps } from "../../App";
import { Tab } from "../../app_data/Tab";
import { compareBasePairKeys, RnaComplex, selectRelevantBasePairKeys } from "../../components/app_specific/RnaComplex";
import { RnaMolecule } from "../../components/app_specific/RnaMolecule";
import { BasePairKeysToRerender, BasePairKeysToRerenderPerRnaComplex, Context, NucleotideKeysToRerender, NucleotideKeysToRerenderPerRnaMolecule } from "../../context/Context";
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

export type HelixData = Array<{
  start : Extrema,
  stop : Extrema,
  rnaMoleculeName1 : string
}>;

export type HelixDataPerRnaMolecule = {
  rnaMoleculeName0 : string,
  helixData : HelixData
};

export type HelixDataPerRnaComplex = {
  rnaComplexIndex : number,
  helixDataPerRnaMolecules : Array<HelixDataPerRnaMolecule>
}

export enum FilterHelicesMode {
  NO_FILTER = "No filter",
  COMPARE_NUCLEOTIDE_INDICES = "Compare nucleotide indices",
  COMPARE_ALL_KEYS = "Compare all keys",
  RNA_MOLECULE_MODE = "RNA-molecule mode"
}

export function iterateOverFreeNucleotidesAndHelicesPerScene(
  rnaComplexProps : RnaComplexProps,
  filterHelicesMode : FilterHelicesMode
) : Array<HelixDataPerRnaComplex> {
  const helixDataPerScene : Array<HelixDataPerRnaComplex> = [];
  for (const rnaComplexIndexAsString in rnaComplexProps) {
    const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
    helixDataPerScene.push(iterateOverFreeNucleotidesAndHelicesPerRnaComplex(
      rnaComplexIndex,
      rnaComplexProps[rnaComplexIndex],
      filterHelicesMode
    ));
  }
  return helixDataPerScene;
}

export function iterateOverFreeNucleotidesAndHelicesPerRnaComplex(
  rnaComplexIndex : number,
  singularRnaComplexProps : RnaComplex.ExternalProps,
  filterHelicesMode : FilterHelicesMode 
) : HelixDataPerRnaComplex {
  const helixDataPerRnaMolecules : Array<HelixDataPerRnaMolecule> = [];
  for (let rnaMoleculeName in singularRnaComplexProps.rnaMoleculeProps) {
    const helixDatumPerRnaMolecule = iterateOverFreeNucleotidesandHelicesPerRnaMolecule(
      singularRnaComplexProps,
      rnaMoleculeName,
      filterHelicesMode
    );
    helixDataPerRnaMolecules.push(helixDatumPerRnaMolecule);
  }
  return {
    rnaComplexIndex,
    helixDataPerRnaMolecules
  };
}

export function iterateOverFreeNucleotidesandHelicesPerRnaMolecule(
  singularRnaComplexProps : RnaComplex.ExternalProps,
  rnaMoleculeName0 : string,
  filterHelicesMode : FilterHelicesMode 
) : HelixDataPerRnaMolecule {
  const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
  let minimumNucleotideIndex = Number.POSITIVE_INFINITY;
  let maximumNucleotideIndex = Number.NEGATIVE_INFINITY;
  for (const nucleotideIndexAsString in singularRnaMoleculeProps0.nucleotideProps) {
    const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
    if (nucleotideIndex < minimumNucleotideIndex) {
      minimumNucleotideIndex = nucleotideIndex;
    }
    if (nucleotideIndex > maximumNucleotideIndex) {
      maximumNucleotideIndex = nucleotideIndex;
    }
  }
  return iterateOverFreeNucleotidesAndHelicesPerNucleotideRange(
    singularRnaComplexProps,
    rnaMoleculeName0,
    minimumNucleotideIndex,
    maximumNucleotideIndex,
    filterHelicesMode
  );
}

export function iterateOverFreeNucleotidesAndHelicesPerNucleotideRange(
  singularRnaComplexProps : RnaComplex.ExternalProps,
  rnaMoleculeName : string,
  minimumNucleotideIndex : number,
  maximumNucleotideIndex : number,
  filterHelicesMode : FilterHelicesMode 
) : HelixDataPerRnaMolecule {
  const rnaMoleculeName0 = rnaMoleculeName;
  const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
  const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
  const basePairsPerRnaMolecule0 = basePairsPerRnaComplex[rnaMoleculeName0];
  const helixData : HelixData = [];
  for (let nucleotideIndex0 = minimumNucleotideIndex; nucleotideIndex0 <= maximumNucleotideIndex;) {
    if (nucleotideIndex0 in basePairsPerRnaMolecule0) {
      const mappedBasePairInformation0 = basePairsPerRnaMolecule0[nucleotideIndex0];
      const nucleotideIndex1 = mappedBasePairInformation0.nucleotideIndex;
      const rnaMoleculeName1 = mappedBasePairInformation0.rnaMoleculeName;
      const stop = iterateOverHelix(
        1,
        nucleotideIndex0,
        nucleotideIndex1,
        basePairsPerRnaMolecule0,
        rnaMoleculeName1,
        singularRnaMoleculeProps0,
        true,
        function(
          nucleotideIndex0 : number,
          nucleotideIndex1 : number
        ) {
          // Do nothing.
        }
      ).extrema;
      let addHelixFlag = false;
      switch (filterHelicesMode) {
        case FilterHelicesMode.NO_FILTER : {
          addHelixFlag = true;
          break;
        }
        case FilterHelicesMode.COMPARE_NUCLEOTIDE_INDICES : {
          addHelixFlag = (nucleotideIndex0 - nucleotideIndex1) < 0;
          break;
        }
        case FilterHelicesMode.COMPARE_ALL_KEYS : {
          addHelixFlag = compareBasePairKeys(
            {
              rnaMoleculeName : rnaMoleculeName0,
              nucleotideIndex : nucleotideIndex0
            },
            {
              rnaMoleculeName : rnaMoleculeName1,
              nucleotideIndex : nucleotideIndex1
            }
          ) < 0;
          break;
        }
        case FilterHelicesMode.RNA_MOLECULE_MODE : {
          addHelixFlag = rnaMoleculeName0 !== rnaMoleculeName1 || (nucleotideIndex0 - nucleotideIndex1) < 0;
          break;
        } 
        default : {
          throw "Unhandled switch case."
        }
      }
      if (addHelixFlag) {
        helixData.push({
          start : {
            0 : nucleotideIndex0,
            1 : nucleotideIndex1
          },
          stop,
          rnaMoleculeName1
        });
      }
      nucleotideIndex0 = stop[0] + 1;
    } else {
      nucleotideIndex0++;
    }
  }
  return {
    rnaMoleculeName0,
    helixData
  };
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
    toBeDragged.push(...toBeDraggedNucleotideIndices.map(function(nucleotideIndex) {
      return singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
    }));
  }
}

export enum CauseOfTermination {
  EndOfMolecule = "End of molecule",
  NonBasePairedNucleotide = "Non-basepaired nucleotide",
  RnaMoleculeMismatch = "RNA molecule mismatch",
  NoncontiguousBasePair = "Non-contiguous basepair",
  HairpinLoop = "Hairpin loop"
}

export type HelixIterationReturnType = {
  extrema : Extrema,
  causeOfTermination : CauseOfTermination
};

export function iterateOverHelix(
  nucleotideIndex0Delta : -1 | 1,
  initialNucleotideIndex0 : number,
  initialNucleotideIndex1 : number,
  basePairsPerRnaMolecule0 : RnaComplex.BasePairsPerRnaMolecule,
  rnaMoleculeName1 : string,
  singularRnaMoleculeProps0 : RnaMolecule.ExternalProps,
  includeInitialIndicesFlag = true,
  helper = function(
    nucleotideIndex0 : number,
    nucleotideIndex1 : number
  ) {
    // Do nothing.
  }
) : HelixIterationReturnType {
  let nucleotideIndex0 = initialNucleotideIndex0;
  let previousNucleotideIndex1 = initialNucleotideIndex1;
  let extrema = {
    0 : nucleotideIndex0,
    1 : previousNucleotideIndex1
  };
  let causeOfTermination : CauseOfTermination;
  if (includeInitialIndicesFlag) {
    helper(
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
    helper(
      nucleotideIndex0,
      nucleotideIndex1
    );
    previousNucleotideIndex1 = nucleotideIndex1;
    extrema = {
      0 : nucleotideIndex0,
      1 : nucleotideIndex1
    };
  }
  return {
    extrema,
    causeOfTermination
  };
}

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
) : HelixIterationReturnType {
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
  return iterateOverHelix(
    nucleotideIndex0Delta,
    initialNucleotideIndex0,
    initialNucleotideIndex1,
    basePairsPerRnaMolecule0,
    rnaMoleculeName1,
    singularRnaMoleculeProps0,
    includeInitialIndicesFlag,
    pushNucleotideIndices
  );
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

  export function isSupportedTab(tab : Tab) : tab is SupportedTab {
    return tab in supportedTabs;
  }

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

  export function isEnum(enumCandidate : string) : enumCandidate is Enum {
    return (all as Array<string>).includes(enumCandidate);
  }

  export const record : Record<
    Enum,
    (
      rnaComplexProps : RnaComplexProps,
      fullKeys : FullKeys,
      setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void,
      setBasePairKeysToRerender : (basePairKeysToRerender : BasePairKeysToRerender) => void,
      setDebugVisualElements : (debugVisualElements : Array<JSX.Element>) => void,
      tab : Tab
    ) => AbstractInteractionConstraint
  > = {
    [Enum.SINGLE_NUCLEOTIDE] : function(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements,
      tab
    ) {
      return new SingleNucleotideInteractionConstraint(
        rnaComplexProps,
        fullKeys,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender,
        setDebugVisualElements,
        tab
      ); 
    },
    [Enum.SINGLE_BASE_PAIR] : function(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements,
      tab
    ) {
      return new SingleBasePairInteractionConstraint(
        rnaComplexProps,
        fullKeys,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender,
        setDebugVisualElements,
        tab
      );
    },
    [Enum.RNA_SINGLE_STRAND] : function(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements,
      tab
    ) {
      return new RnaSingleStrandInteractionConstraint(
        rnaComplexProps,
        fullKeys,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender,
        setDebugVisualElements,
        tab
      );
    },
    [Enum.RNA_HELIX] : function(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements,
      tab
    ) {
      return new RnaHelixInteractionConstraint(
        rnaComplexProps,
        fullKeys,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender,
        setDebugVisualElements,
        tab
      );
    },
    [Enum.RNA_STACKED_HELIX] : function(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements,
      tab
    ) {
      return new RnaStackedHelixInteractionConstraint(
        rnaComplexProps,
        fullKeys,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender,
        setDebugVisualElements,
        tab
      );
    },
    [Enum.RNA_CYCLE] : function(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements,
      tab
    ) {
      return new RnaCycleInteractionConstraint(
        rnaComplexProps,
        fullKeys,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender,
        setDebugVisualElements,
        tab
      );
    },
    [Enum.RNA_SUB_DOMAIN] : function(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements,
      tab
    ) {
      return new RnaSubdomainInteractionConstraint(
        rnaComplexProps,
        fullKeys,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender,
        setDebugVisualElements,
        tab
      );
    },
    [Enum.RNA_MOLECULE] : function(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements,
      tab
    ) {
      return new RnaMoleculeInteractionConstraint(
        rnaComplexProps,
        fullKeys,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender,
        setDebugVisualElements,
        tab
      );
    },
    [Enum.RNA_COMPLEX] : function(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements,
      tab
    ) {
      return new RnaComplexInteractionConstraint(
        rnaComplexProps,
        fullKeys,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender,
        setDebugVisualElements,
        tab
      );
    },
    [Enum.SINGLE_COLOR] : function(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements,
      tab
    ) {
      return new SingleColorInteractionConstraint(
        rnaComplexProps,
        fullKeys,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender,
        setDebugVisualElements,
        tab
      );
    },
    [Enum.ENTIRE_SCENE] : function(
      rnaComplexProps,
      fullKeys,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements,
      tab
    ) {
      return new EntireSceneInteractionConstraint(
        rnaComplexProps,
        fullKeys,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender,
        setDebugVisualElements,
        tab
      );
    }
  };

  function BasePairOptionsMenu(props : {}) {
    const interactionConstraintOptions = useContext(Context.App.InteractionConstraintOptions);
    const updateInteractionConstraintOptions = useContext(Context.App.UpdateInteractionConstraintOptions);
    const affectHairpinNucleotidesFlag = interactionConstraintOptions.affectHairpinNucleotidesFlag;
    return <>
      <label>
        Affect hairpin-loop nucleotides:&nbsp;
        <input
          type = "checkbox"
          checked = {affectHairpinNucleotidesFlag}
          onChange = {function() {
            const newAffectHairpinNucleotidesFlag = !affectHairpinNucleotidesFlag;
            updateInteractionConstraintOptions({
              affectHairpinNucleotidesFlag : newAffectHairpinNucleotidesFlag
            });
          }}
        />
      </label>
    </>;
  }

  export const DEFAULT_OPTIONS : Options = {
    affectHairpinNucleotidesFlag : true
  };

  export type Options = {
    affectHairpinNucleotidesFlag : boolean
  };

  export const optionsMenuRecord : Partial<Record<
    Enum,
    FunctionComponent<{}>
  >> = {
    [Enum.SINGLE_BASE_PAIR] : BasePairOptionsMenu
  };
}