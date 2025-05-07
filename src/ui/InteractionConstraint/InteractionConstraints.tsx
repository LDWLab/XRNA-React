import { FunctionComponent, useContext, useState } from "react";
import { DragListener, FullKeys, FullKeysRecord, NucleotideKey, RnaComplexKey, RnaComplexProps, RnaMoleculeKey } from "../../App";
import { Tab } from "../../app_data/Tab";
import { compareBasePairKeys, isRelevantBasePairKeySetInPair, RnaComplex, selectRelevantBasePairKeys } from "../../components/app_specific/RnaComplex";
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
import { Collapsible } from "../../components/generic/Collapsible";
import { areEqual, BLACK } from "../../data_structures/Color";
import { subtractNumbers } from "../../utils/Utils";
import { BasePairsEditor } from "../../components/app_specific/editors/BasePairsEditor";
import BasePair from "../../components/app_specific/BasePair";
import { DEFAULT_SETTINGS, Setting } from "../Setting";

export type Extrema = {
  0 : number,
  1 : number
};

export type HelixDatum = {
  rnaMoleculeName1 : string,
  start : Extrema,
  stop : Extrema
};

export type HelixData = Array<HelixDatum>;

export type HelixDataPerRnaMolecule = {
  rnaMoleculeName0 : string,
  helixData : HelixData
};

export type HelixDataPerRnaComplex = {
  rnaComplexIndex : number,
  helixDataPerRnaMolecules : Array<HelixDataPerRnaMolecule>
}

export type HelixDataMap = Record<RnaMoleculeKey, Record<RnaMoleculeKey, Record<NucleotideKey, Record<NucleotideKey, HelixDatum>>>>;

type AllKeys = {
  keys0 : RnaComplex.BasePairKeys,
  keys1 : RnaComplex.BasePairKeys
};

type SortedBasePairKeys = Array<AllKeys & {
  mappedBasePair : RnaComplex.MappedBasePair
}>;

export function getSortedBasePairs(
  basePairsPerRnaComplex : RnaComplex.BasePairs,
  treatNoncanonicalBasePairsAsUnpairedFlag : boolean
) : SortedBasePairKeys {
  const sortedBasePairs : SortedBasePairKeys = [];
  for (const rnaMoleculeName of Object.keys(basePairsPerRnaComplex)) {
    const basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName];
    for (const nucleotideIndexAsString of Object.keys(basePairsPerRnaMolecule)) {
      const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
      const keys0 = {
        rnaMoleculeName,
        nucleotideIndex
      };
      const basePairsPerNucleotide = basePairsPerRnaMolecule[nucleotideIndex];
      for (const basePairPerNucleotide of basePairsPerNucleotide) {
        if (!BasePair.isEnabledBasePair(
          basePairPerNucleotide,
          treatNoncanonicalBasePairsAsUnpairedFlag
        )) {
          continue;
        }
        // Eliminate duplicates.
        if (isRelevantBasePairKeySetInPair(
          keys0,
          basePairPerNucleotide
        )) {
          sortedBasePairs.push({
            keys0,
            keys1 : basePairPerNucleotide,
            mappedBasePair : basePairPerNucleotide
          });
        }
      }
    }
  }
  sortedBasePairs.sort((allKeys0 : AllKeys, allKeys1 : AllKeys) => (
    compareBasePairKeys(
      allKeys0.keys0,
      allKeys1.keys0
    ) || 
    compareBasePairKeys(
      allKeys0.keys1,
      allKeys1.keys1
    )
  ));
  return sortedBasePairs;
}

export function iterateOverFreeNucleotidesAndHelicesPerScene(
  rnaComplexProps : RnaComplexProps,
  treatNoncanonicalBasePairsAsUnpairedFlag : boolean
) : Array<HelixDataPerRnaComplex> {
  const helixDataPerScene : Array<HelixDataPerRnaComplex> = [];
  for (const rnaComplexIndexAsString in rnaComplexProps) {
    const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
    const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
    const sortedBasePairs : SortedBasePairKeys = getSortedBasePairs(
      singularRnaComplexProps.basePairs,
      treatNoncanonicalBasePairsAsUnpairedFlag
    );
    helixDataPerScene.push(iterateOverFreeNucleotidesAndHelicesPerRnaComplex(
      rnaComplexIndex,
      rnaComplexProps[rnaComplexIndex],
      treatNoncanonicalBasePairsAsUnpairedFlag,
      sortedBasePairs
    ));
  }
  return helixDataPerScene;
}

export function iterateOverFreeNucleotidesAndHelicesPerRnaComplex(
  rnaComplexIndex : number,
  singularRnaComplexProps : RnaComplex.ExternalProps,
  treatNoncanonicalBasePairsAsUnpairedFlag : boolean,
  sortedBasePairs : SortedBasePairKeys = getSortedBasePairs(
    singularRnaComplexProps.basePairs,
    treatNoncanonicalBasePairsAsUnpairedFlag
  )
) : HelixDataPerRnaComplex {
  const helixDataPerRnaMolecules : Array<HelixDataPerRnaMolecule> = [];
  for (let rnaMoleculeName in singularRnaComplexProps.rnaMoleculeProps) {
    const helixDatumPerRnaMolecule = iterateOverFreeNucleotidesandHelicesPerRnaMolecule(
      singularRnaComplexProps,
      rnaMoleculeName,
      treatNoncanonicalBasePairsAsUnpairedFlag,
      sortedBasePairs
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
  treatNoncanonicalBasePairsAsUnpairedFlag : boolean,
  sortedBasePairs : SortedBasePairKeys = getSortedBasePairs(
    singularRnaComplexProps.basePairs,
    treatNoncanonicalBasePairsAsUnpairedFlag
  )
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
    treatNoncanonicalBasePairsAsUnpairedFlag,
    sortedBasePairs
  );
}

export function iterateOverFreeNucleotidesAndHelicesPerNucleotideRange(
  singularRnaComplexProps : RnaComplex.ExternalProps,
  rnaMoleculeName : string,
  minimumNucleotideIndex : number,
  maximumNucleotideIndex : number,
  treatNoncanonicalBasePairsAsUnpairedFlag : boolean,
  sortedBasePairs : SortedBasePairKeys = getSortedBasePairs(
    singularRnaComplexProps.basePairs,
    treatNoncanonicalBasePairsAsUnpairedFlag
  )
) : HelixDataPerRnaMolecule {
  const helixData : HelixData = [];
  const helixDataMap : HelixDataMap = {};
  sortedBasePairs = sortedBasePairs.filter(({ keys0, keys1 }) => (
    (
      keys0.rnaMoleculeName === rnaMoleculeName &&
      keys0.nucleotideIndex >= minimumNucleotideIndex &&
      keys0.nucleotideIndex <= maximumNucleotideIndex
    ) ||
    (
      keys1.rnaMoleculeName === rnaMoleculeName &&
      keys1.nucleotideIndex >= minimumNucleotideIndex &&
      keys1.nucleotideIndex <= maximumNucleotideIndex
    )
  ));
  function insertHelix(
    helixDataMapPerRnaMolecule0PerRnaMolecule1 : Record<number, Record<number, HelixDatum>>,
    nucleotideIndex0 : number,
    nucleotideIndex1 : number,
    helix : HelixDatum
  ) {
    if (!(nucleotideIndex0 in helixDataMapPerRnaMolecule0PerRnaMolecule1)) {
      helixDataMapPerRnaMolecule0PerRnaMolecule1[nucleotideIndex0] = {};
    }
    const helixDataMapPerRnaMolecule0PerRnaMolecule1PerNucleotide0 = helixDataMapPerRnaMolecule0PerRnaMolecule1[nucleotideIndex0];
    if (!(nucleotideIndex1 in helixDataMapPerRnaMolecule0PerRnaMolecule1PerNucleotide0)) {
      helixDataMapPerRnaMolecule0PerRnaMolecule1PerNucleotide0[nucleotideIndex1] = helix;
    } 
  }
  for (const { keys0, keys1, mappedBasePair } of sortedBasePairs) {
    if (!(keys0.rnaMoleculeName in helixDataMap)) {
      helixDataMap[keys0.rnaMoleculeName] = {};
    }
    const helixDataMapPerRnaMolecule0 = helixDataMap[keys0.rnaMoleculeName];
    if (!(keys1.rnaMoleculeName in helixDataMapPerRnaMolecule0)) {
      helixDataMapPerRnaMolecule0[keys1.rnaMoleculeName] = {};
    }
    const helixDataMapPerRnaMolecule0PerRnaMolecule1 = helixDataMapPerRnaMolecule0[keys1.rnaMoleculeName];
    let foundHelixFlag = false;
    if (keys0.nucleotideIndex - 1 in helixDataMapPerRnaMolecule0PerRnaMolecule1) {
      const helixDataMapPerRnaMolecule0PerRnaMolecule1PerNucleotide0MinusOne = helixDataMapPerRnaMolecule0PerRnaMolecule1[keys0.nucleotideIndex - 1];
      /*if (keys1.nucleotideIndex - 1 in helixDataMapPerRnaMolecule0PerRnaMolecule1PerNucleotide0MinusOne) {
        const helix = helixDataMapPerRnaMolecule0PerRnaMolecule1PerNucleotide0MinusOne[keys1.nucleotideIndex - 1];
        if (Math.abs(helix.stop[0] + 1 - helix.start[0]) === Math.abs(helix.stop[1] + 1 - helix.start[1])) {
          helix.stop[0]++;
          helix.stop[1]++;
          insertHelix(
            helixDataMapPerRnaMolecule0PerRnaMolecule1,
            keys0.nucleotideIndex,
            keys1.nucleotideIndex,
            helix
          );
          foundHelixFlag = true;
        }
      } else*/ if (keys1.nucleotideIndex + 1 in helixDataMapPerRnaMolecule0PerRnaMolecule1PerNucleotide0MinusOne) {
        const helix = helixDataMapPerRnaMolecule0PerRnaMolecule1PerNucleotide0MinusOne[keys1.nucleotideIndex + 1];
        if (Math.abs(helix.stop[0] + 1 - helix.start[0]) === Math.abs(helix.stop[1] - 1 - helix.start[1])) {
          helix.stop[0]++;
          helix.stop[1]--;
          insertHelix(
            helixDataMapPerRnaMolecule0PerRnaMolecule1,
            keys0.nucleotideIndex,
            keys1.nucleotideIndex,
            helix
          )
          foundHelixFlag = true;
        }
      }
    }
    if (!foundHelixFlag) {
      const helixDatum = {
        start : {
          0 : keys0.nucleotideIndex,
          1 : keys1.nucleotideIndex
        },
        stop : {
          0 : keys0.nucleotideIndex,
          1 : keys1.nucleotideIndex
        },
        // These variable names are somewhat scrambled at this point. Because of the sorting process, "rnaMolecule1" from helix data is not necessarily the correct value for "rnaMoleculeName1".
        // The correct one is whichever mismatches rnaMoleculeName (if there is a mismatch at all).
        rnaMoleculeName1 : keys0.rnaMoleculeName === rnaMoleculeName ? keys1.rnaMoleculeName : keys0.rnaMoleculeName
      };
      helixData.push(helixDatum);
      insertHelix(
        helixDataMapPerRnaMolecule0PerRnaMolecule1,
        keys0.nucleotideIndex,
        keys1.nucleotideIndex,
        helixDatum
      )
    }
  }
  return {
    rnaMoleculeName0 : rnaMoleculeName,
    helixData
  };
}


export function checkExtremaForSingleStrand(
  extrema : Extrema,
  basePairsPerRnaMolecule : RnaComplex.BasePairsPerRnaMolecule,
  toBeDragged : Array<Vector2D>,
  singularRnaMoleculeProps : RnaMolecule.ExternalProps,
  nucleotideKeysToRerenderPerRnaMolecule : NucleotideKeysToRerenderPerRnaMolecule,
  treatNoncanonicalBasePairsAsUnpairedFlag : boolean
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
    if (
      nucleotideIndexI in basePairsPerRnaMolecule &&
      basePairsPerRnaMolecule[nucleotideIndexI].some((basePair) => BasePair.isEnabledBasePair(
        basePair,
        treatNoncanonicalBasePairsAsUnpairedFlag
      )
    )) {
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

export type HelixIterationReturnType = {
  extrema : Extrema
};

export function findHelix(
  singularRnaComplexProps : RnaComplex.ExternalProps,
  rnaMoleculeName0 : string,
  nucleotideIndex0 : number,
  rnaMoleculeName1 : string,
  nucleotideIndex1 : number,
  treatNoncanonicalBasePairsAsUnpairedFlag : boolean,
  forEachHelper : (
    keys : RnaComplex.BasePairKeys
  ) => void = () => { /* Do nothing. */ },
  sortedBasePairs = getSortedBasePairs(
    singularRnaComplexProps.basePairs,
    treatNoncanonicalBasePairsAsUnpairedFlag
  )
) : HelixDatum {
  const { helixData } = iterateOverFreeNucleotidesandHelicesPerRnaMolecule(
    singularRnaComplexProps,
    rnaMoleculeName0,
    treatNoncanonicalBasePairsAsUnpairedFlag,
    sortedBasePairs
  );
  const [
    keys0,
    keys1
  ] = [
    {
      rnaMoleculeName : rnaMoleculeName0,
      nucleotideIndex : nucleotideIndex0
    },
    {
      rnaMoleculeName : rnaMoleculeName1,
      nucleotideIndex : nucleotideIndex1
    }
  ].sort(compareBasePairKeys);
  for (const helixDatum of helixData) {
    const { start, stop } = helixDatum;
    const min0 = Math.min(start[0], stop[0]);
    const max0 = Math.max(start[0], stop[0]);
    const min1 = Math.min(start[1], stop[1]);
    const max1 = Math.max(start[1], stop[1]);
    if (
      rnaMoleculeName1 === helixDatum.rnaMoleculeName1 &&
      keys0.nucleotideIndex >= min0 &&
      keys0.nucleotideIndex <= max0 &&
      keys1.nucleotideIndex >= min1 &&
      keys1.nucleotideIndex <= max1
    ) {
      const { start, stop } = helixDatum;
      const min0 = Math.min(start[0], stop[0]);
      const max0 = Math.max(start[0], stop[0]);
      const min1 = Math.min(start[1], stop[1]);
      const max1 = Math.max(start[1], stop[1]);
      const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
      for (let nucleotideIndex0 = min0; nucleotideIndex0 <= max0; nucleotideIndex0++) {
        forEachHelper({
          rnaMoleculeName : keys0.rnaMoleculeName,
          nucleotideIndex : nucleotideIndex0
        });
      }
      for (let nucleotideIndex1 = min1; nucleotideIndex1 <= max1; nucleotideIndex1++) {
        forEachHelper({
          rnaMoleculeName : keys1.rnaMoleculeName,
          nucleotideIndex : nucleotideIndex1
        });
      }
      return helixDatum;
    }
  }
  throw "Could not find the relevant helix!";
}

export function populateToBeDraggedWithHelix(
  singularRnaComplexProps : RnaComplex.ExternalProps,
  rnaMoleculeName0 : string,
  nucleotideIndex0 : number,
  rnaMoleculeName1 : string,
  nucleotideIndex1 : number,
  toBeDragged : Array<Vector2D>,
  treatNoncanonicalBasePairsAsUnpairedFlag : boolean,
  basePairKeysToRerenderPerRnaComplex? : BasePairKeysToRerenderPerRnaComplex,
  forEachHelper : (
    keys : RnaComplex.BasePairKeys
  ) => void = () => { /* Do nothing. */ },
  sortedBasePairs = getSortedBasePairs(
    singularRnaComplexProps.basePairs,
    treatNoncanonicalBasePairsAsUnpairedFlag
  )
) {
  return findHelix(
    singularRnaComplexProps,
    rnaMoleculeName0,
    nucleotideIndex0,
    rnaMoleculeName1,
    nucleotideIndex1,
    treatNoncanonicalBasePairsAsUnpairedFlag,
    (keys) => {
      forEachHelper(keys);
      const {
        rnaMoleculeName,
        nucleotideIndex
      } = keys;
      const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
      toBeDragged.push(singularRnaMoleculeProps.nucleotideProps[nucleotideIndex]);
      if (basePairKeysToRerenderPerRnaComplex !== undefined) {
        const { basePairs } = singularRnaComplexProps;
        const basePairsPerRnaMolecule = basePairs[rnaMoleculeName];
        const basePairsPerNucleotide = basePairsPerRnaMolecule[nucleotideIndex];
        for (const basePairPerNucleotide of basePairsPerNucleotide) {
          basePairKeysToRerenderPerRnaComplex.push(selectRelevantBasePairKeys(
            keys,
            basePairPerNucleotide
          ));
        }
      }
    },
    sortedBasePairs
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
    RNA_SUB_DOMAIN = "RNA sub-domain",
    RNA_STACKED_HELIX = "RNA stacked helix",
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
    new (
      rnaComplexProps : RnaComplexProps,
      setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void,
      setBasePairKeysToRerender : (basePairKeysToRerender : BasePairKeysToRerender) => void,
      setDebugVisualElements : (debugVisualElements : Array<JSX.Element>) => void,
      tab : Tab,
      indicesOfFrozenNucleotides : FullKeysRecord,
      interactionConstraintOptions : Options,
      fullKeys0 : FullKeys,
      fullKeys1? : FullKeys

    ) => AbstractInteractionConstraint
  > = {
    [Enum.SINGLE_NUCLEOTIDE] : SingleNucleotideInteractionConstraint,
    [Enum.SINGLE_BASE_PAIR] : SingleBasePairInteractionConstraint,
    [Enum.RNA_SINGLE_STRAND] : RnaSingleStrandInteractionConstraint,
    [Enum.RNA_HELIX] : RnaHelixInteractionConstraint,
    [Enum.RNA_SUB_DOMAIN] : RnaSubdomainInteractionConstraint,
    [Enum.RNA_STACKED_HELIX] : RnaStackedHelixInteractionConstraint,
    [Enum.RNA_CYCLE] : RnaCycleInteractionConstraint,
    [Enum.RNA_MOLECULE] : RnaMoleculeInteractionConstraint,
    [Enum.RNA_COMPLEX] : RnaComplexInteractionConstraint,
    [Enum.SINGLE_COLOR] : SingleColorInteractionConstraint,
    [Enum.ENTIRE_SCENE] : EntireSceneInteractionConstraint
  };

  export const descriptionRecord : Record<Enum, JSX.Element> = {
    [Enum.SINGLE_NUCLEOTIDE] : <>
      This constraint allows the user to interact with a single nucleotide.
      <Collapsible.Component
        title = "Demo"
      >
        <iframe
          src = "https://youtube.com/embed/WDOMlZ5QaK4?start=150&end=168"
          allowFullScreen = {true}
          width = {960}
          height = {540}
        />
      </Collapsible.Component>
    </>,
    [Enum.SINGLE_BASE_PAIR] : <>
      This constraint allows the user to interact with a single base pair between two nucleotides.
      <Collapsible.Component
        title = "Demo"
      >
        <iframe
          src = "https://youtube.com/embed/WDOMlZ5QaK4?start=167&end=178"
          allowFullScreen = {true}
          width = {960}
          height = {540}
        />
      </Collapsible.Component>
    </>,
    [Enum.RNA_SINGLE_STRAND] : <>
      This constraint allows the user to interact with a contiguous series of single (non-basepaired) nucleotides.
      <Collapsible.Component
        title = "Demo"
      >
        <iframe
          src = "https://youtube.com/embed/WDOMlZ5QaK4?start=176&end=204"
          allowFullScreen = {true}
          width = {960}
          height = {540}
        />
      </Collapsible.Component>
    </>,
    [Enum.RNA_HELIX] : <>
      This constraint allows the user to interact with a contiguous series of base-paired nucleotides.
      <br/>
      "Helix" is defined as two series of nucleotides which are mutually base-paired without gaps.
      <br/>
      This involves at most two RNA molecules.
      <Collapsible.Component
        title = "Demo"
      >
        <iframe
          src = "https://youtube.com/embed/WDOMlZ5QaK4?start=202&end=214"
          allowFullScreen = {true}
          width = {960}
          height = {540}
        />
      </Collapsible.Component>
    </>,
    [Enum.RNA_SUB_DOMAIN] : <>
      This constraint allows the user to interact with a contiguous series of nucleotides constrainted by a helix.
      <br/>
      This constraint involves only one RNA molecule.
      <br/>
      This includes all nucleotides with nucleotide indices:
      <ul
        style = {{
          margin : 0
        }}
      >
        <li>
          Greater than or equal to the least nucleotide index in the helix
        </li>
        <li>
          Less than or equal to the greatest nucleotide index in the helix
        </li>
      </ul>
      <Collapsible.Component
        title = "Demo"
      >
        <iframe
          src = "https://youtube.com/embed/WDOMlZ5QaK4?start=212&end=243"
          allowFullScreen = {true}
          width = {960}
          height = {540}
        />
      </Collapsible.Component>
    </>,
    [Enum.RNA_STACKED_HELIX] : <>
      This constraint allows the user to interact with a contiguous series of helices between RNA molecules.
      <br/>
      These helices may be separated by single (non-basepaired) nucleotides, but their mutually-basepaired status must resume outside the single-stranded regions.
      <br/>
      This constraint involves at most two RNA molecules.
      <Collapsible.Component
        title = "Demo"
      >
        <iframe
          src = "https://youtube.com/embed/WDOMlZ5QaK4?start=243&end=269"
          allowFullScreen = {true}
          width = {960}
          height = {540}
        />
      </Collapsible.Component>
    </>,
    [Enum.RNA_CYCLE] : <>
      This constraint allows the user to interact with a cycle of nucleotides.
      <br/>
      An RNA cycle is calculated as follows:
      <ul
        style = {{
          margin : 0
        }}
      >
        <li>Treat the nucleotides as nodes in a graph</li>
        <li>Treat the following as edges in the graph:</li>
        <ul
          style = {{
            margin : 0
          }}
        >
          <li>Base pairs between nucleotides</li>
          <li>Neighboring nucleotides within a given RNA molecule (with nucleotide indices i, j such that abs(i - j) = 1)</li>
        </ul>
        <li>Calculate the smallest cycle within the graph involving the clicked-on nucleotide</li>
      </ul>
      <Collapsible.Component
        title = "Demo"
      >
        <iframe
          src = "https://youtube.com/embed/WDOMlZ5QaK4?start=269&end=298"
          allowFullScreen = {true}
          width = {960}
          height = {540}
        />
      </Collapsible.Component>
    </>,
    [Enum.RNA_MOLECULE] : <>
      This constraint allows the user to interact with a single RNA molecule.
      <Collapsible.Component
        title = "Demo"
      >
        <iframe
          src = "https://youtube.com/embed/WDOMlZ5QaK4?start=311&end=325"
          allowFullScreen = {true}
          width = {960}
          height = {540}
        />
      </Collapsible.Component>
    </>,
    [Enum.RNA_COMPLEX] : <>
      This constraint allows the user to interact with a single RNA complex (which may contain more than one RNA molecule).
      <Collapsible.Component
        title = "Demo"
      >
        <iframe
          src = "https://youtube.com/embed/WDOMlZ5QaK4?start=324&end=340"
          allowFullScreen = {true}
          width = {960}
          height = {540}
        />
      </Collapsible.Component>
    </>,
    [Enum.SINGLE_COLOR] : <>
      This constraint allows the user to interact with all nucleotides or labels with the same color
      <Collapsible.Component
        title = "Demo"
      >
        <iframe
          src = "https://youtube.com/embed/WDOMlZ5QaK4?start=340&end=358"
          allowFullScreen = {true}
          width = {960}
          height = {540}
        />
      </Collapsible.Component>
    </>,
    [Enum.ENTIRE_SCENE] : <>
      This constraint allows the user to interact with all nucleotides or labels within the scene (i.e. viewport)
      <Collapsible.Component
        title = "Demo"
      >
        <iframe
          src = "https://youtube.com/embed/WDOMlZ5QaK4?start=354"
          allowFullScreen = {true}
          width = {960}
          height = {540}
        />
      </Collapsible.Component>
    </>
  };

  function SingleBasePairOptionsMenu(props : {}) {
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

  function SingleStrandOptionsMenu(props : {}) {
    const interactionConstraintOptions = useContext(Context.App.InteractionConstraintOptions);
    const updateInteractionConstraintOptions = useContext(Context.App.UpdateInteractionConstraintOptions);
    const truncateRnaSingleStrandFlag = interactionConstraintOptions.truncateRnaSingleStrandFlag;
    return <label>
      Truncate Single Strand At Frozen Nucleotides:&nbsp;
      <input
        type = "checkbox"
        checked = {truncateRnaSingleStrandFlag}
        onChange = {function() {
          const newTruncateRnaSingleStrandFlag = !truncateRnaSingleStrandFlag;
          updateInteractionConstraintOptions({
            truncateRnaSingleStrandFlag : newTruncateRnaSingleStrandFlag
          });
        }}
      />
    </label>;
  }

  export const DEFAULT_OPTIONS : Options = {
    affectHairpinNucleotidesFlag : true,
    truncateRnaSingleStrandFlag : true,
    treatNoncanonicalBasePairsAsUnpairedFlag : DEFAULT_SETTINGS[Setting.TREAT_NON_CANONICAL_BASE_PAIRS_AS_UNPAIRED] as boolean
  };

  export type Options = {
    affectHairpinNucleotidesFlag : boolean,
    truncateRnaSingleStrandFlag : boolean,
    treatNoncanonicalBasePairsAsUnpairedFlag : boolean
  };

  export const optionsMenuRecord : Partial<Record<
    Enum,
    FunctionComponent<{}>
  >> = {
    [Enum.SINGLE_BASE_PAIR] : SingleBasePairOptionsMenu,
    [Enum.RNA_SINGLE_STRAND] : SingleStrandOptionsMenu
  };
}
function sort(
  fullKeys0 : FullKeys,
  fullKeys1 : FullKeys
) {
  return (
    (fullKeys0.rnaComplexIndex - fullKeys1.rnaComplexIndex) ||
    (fullKeys0.rnaMoleculeName.localeCompare(fullKeys1.rnaMoleculeName)) ||
    (fullKeys0.nucleotideIndex - fullKeys1.nucleotideIndex)
  );
}
export type InteractionConstraintAndFullKeys = { fullKeys : FullKeys, interactionConstraint : InteractionConstraint.Enum } | undefined;
export function getInteractionConstraintAndFullKeys(
  fullKeysArray : Array<FullKeys>,
  rnaComplexProps : RnaComplexProps,
  treatNoncanonicalBasePairsAsUnpairedFlag : boolean
) : InteractionConstraintAndFullKeys {
  function handleMultipleFullKeys() : InteractionConstraintAndFullKeys {
    fullKeysArray.sort(sort);

    const minimumFullKeys = fullKeysArray[0];
    const maximumFullKeys = fullKeysArray[fullKeysArray.length - 1];

    let singleRnaComplexFlag = true;
    let singleRnaMoleculeFlag = true;
    let dualRnaMoleculesFlag = false;
    let otherRnaMoleculeName : string | undefined = undefined;
    for (let i = 1; i < fullKeysArray.length; i++) {
      const {
        rnaComplexIndex,
        rnaMoleculeName,
      } = fullKeysArray[i];
      if (rnaComplexIndex !== minimumFullKeys.rnaComplexIndex) {
        singleRnaComplexFlag = false;
      }
      if (rnaMoleculeName !== minimumFullKeys.rnaMoleculeName) {
        singleRnaMoleculeFlag = false;
        if (otherRnaMoleculeName === undefined) {
          otherRnaMoleculeName = rnaMoleculeName;
          dualRnaMoleculesFlag = true;
        } else if (rnaMoleculeName !== otherRnaMoleculeName) {
          dualRnaMoleculesFlag = false;
        }
      }
    }

    if (!singleRnaComplexFlag) {
      singleRnaMoleculeFlag = false;
    }

    let allNucleotidesAreBasePairedFlag = true;
    let noNucleotidesAreBasePairedFlag = true;
    const basePairsPerNucleotides = fullKeysArray.map(function({
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex
    }) {
      const { basePairs } = rnaComplexProps[rnaComplexIndex];
      if (rnaMoleculeName in basePairs) {
        const basePairsPerRnaMolecule = basePairs[rnaMoleculeName];
        if (nucleotideIndex in basePairsPerRnaMolecule) {
          const basePairsPerNucleotide = basePairsPerRnaMolecule[nucleotideIndex];
          if (basePairsPerNucleotide.some((basePair) => BasePair.isEnabledBasePair(
            basePair,
            treatNoncanonicalBasePairsAsUnpairedFlag
          ))) {
            noNucleotidesAreBasePairedFlag = false;
            return basePairsPerRnaMolecule[nucleotideIndex];
          }
        }
      }
      allNucleotidesAreBasePairedFlag = false;
      return undefined;
    });

    function isSubdomain() {
      // BEGIN DETECTING InteractionConstraint.Enum.RNA_SUB_DOMAIN
      if (!singleRnaMoleculeFlag) {
        return false;
      }
      const basePairsPerNucleotide0 = basePairsPerNucleotides[0];
      if (
        basePairsPerNucleotide0 === undefined ||
        !basePairsPerNucleotide0.some(({ rnaMoleculeName, nucleotideIndex }) => (
          rnaMoleculeName === maximumFullKeys.rnaMoleculeName &&
          nucleotideIndex === maximumFullKeys.nucleotideIndex
        ))
      ) {
        return false;
      }
      const { basePairs } = rnaComplexProps[minimumFullKeys.rnaComplexIndex];
      const basePairsPerRnaMolecule = basePairs[minimumFullKeys.rnaMoleculeName];
      for (let nucleotideIndex = minimumFullKeys.nucleotideIndex + 1; nucleotideIndex < maximumFullKeys.nucleotideIndex; nucleotideIndex++) {
        const basePairsPerNucleotide = basePairsPerRnaMolecule[nucleotideIndex];
        if (
          basePairsPerNucleotide !== undefined &&
          basePairsPerNucleotide.some(({ rnaMoleculeName, nucleotideIndex }) => (
            rnaMoleculeName !== minimumFullKeys.rnaMoleculeName ||
            nucleotideIndex < minimumFullKeys.nucleotideIndex || 
            nucleotideIndex > maximumFullKeys.nucleotideIndex
          ))
        ) {
          return false;
        }
      }
      return true;
      // FINISH DETECTING InteractionConstraint.Enum.RNA_SUB_DOMAIN
    }

    function isStackedHelix(
      isRnaCycleFlag : boolean
    ) {
      // BEGIN DETECTING InteractionConstraint.Enum.RNA_STACKED_HELIX
      if (
        !isRnaCycleFlag ||
        (
          !singleRnaMoleculeFlag &&
          !dualRnaMoleculesFlag
        )
      ) {
        return false;
      }
      const basePairedNucleotidesOrdered = [];
      let previousFullKeys = fullKeysArray[0];
      let arrayIndex = 1;
      let previousNucleotideIsBasePairedFlag = basePairsPerNucleotides[0] !== undefined;
      let arrayIndexOfBreak : number | undefined = undefined;
      if (!previousNucleotideIsBasePairedFlag) {
        return false;
      }
      basePairedNucleotidesOrdered.push(previousFullKeys);
      for (; arrayIndex < fullKeysArray.length; arrayIndex++) {
        const currentFullKeys = fullKeysArray[arrayIndex];
        const { rnaMoleculeName, nucleotideIndex } = currentFullKeys;
        if (
          rnaMoleculeName !== previousFullKeys.rnaMoleculeName ||
          nucleotideIndex !== previousFullKeys.nucleotideIndex + 1
        ) {
          arrayIndexOfBreak = arrayIndex;
          break;
        }
        const currentNucleotideIsBasePairedFlag = basePairsPerNucleotides[arrayIndex] !== undefined;
        if (currentNucleotideIsBasePairedFlag) {
          basePairedNucleotidesOrdered.push(currentFullKeys);
        }
        previousNucleotideIsBasePairedFlag = currentNucleotideIsBasePairedFlag;
        previousFullKeys = currentFullKeys;
      }
      if (!previousNucleotideIsBasePairedFlag) {
        return false;
      }
      let basePairsPerNucleotide = basePairsPerNucleotides[arrayIndex];
      if (basePairsPerNucleotide === undefined) {
        return false;
      }
      if (!basePairsPerNucleotide.some(({ rnaMoleculeName, nucleotideIndex }) => (
        rnaMoleculeName === previousFullKeys.rnaMoleculeName &&
        nucleotideIndex === previousFullKeys.nucleotideIndex
      ))) {
        // It's possible that this list is backward. The helix is running in the other direction.
        // If not, the downstream algorithm will fail regardless.
        basePairedNucleotidesOrdered.reverse();
      }
      for (; arrayIndex < fullKeysArray.length; arrayIndex++) {
        const currentFullKeys = fullKeysArray[arrayIndex];
        const { rnaMoleculeName, nucleotideIndex } = currentFullKeys;
        if (
          arrayIndex !== arrayIndexOfBreak && (
            rnaMoleculeName !== previousFullKeys.rnaMoleculeName ||
            nucleotideIndex !== previousFullKeys.nucleotideIndex + 1
          )
        ) {
          return false;
        }
        const basePairsPerNucleotideI = basePairsPerNucleotides[arrayIndex];
        if (basePairsPerNucleotideI !== undefined) {
          const expectedBasePairedNucleotide = basePairedNucleotidesOrdered.pop();
          if (expectedBasePairedNucleotide === undefined) {
            return false;
          }
          if (!basePairsPerNucleotideI.some((basePairPerNucleotideI => (
            expectedBasePairedNucleotide.rnaMoleculeName === basePairPerNucleotideI.rnaMoleculeName,
            expectedBasePairedNucleotide.nucleotideIndex === basePairPerNucleotideI.nucleotideIndex
          )))) {
            return false;
          }
        }
        previousFullKeys = currentFullKeys;
      }
      return basePairsPerNucleotides[basePairsPerNucleotides.length - 1] !== undefined;
      /*if  (
        !singleRnaMoleculeFlag &&
        !dualRnaMoleculesFlag
      ) {
        return false;
      }
      const { basePairs } = rnaComplexProps[minimumFullKeys.rnaComplexIndex];
      const rnaMoleculeNames = new Set<string>();
      for (let i = 0; i < fullKeysArray.length; i++) {
        rnaMoleculeNames.add(fullKeysArray[i].rnaMoleculeName);
        const basePairsPerNucleotideI = basePairsPerNucleotides[i];
        if (basePairsPerNucleotideI !== undefined) {
          for (const { rnaMoleculeName } of basePairsPerNucleotideI) {
            rnaMoleculeNames.add(rnaMoleculeName);
          }
        }
      }
      if (rnaMoleculeNames.size > 2) {
        return false;
      }
      let encounteredBreakFlag = false;
      let previousFullKeys = fullKeysArray[0];
      let previousBasePairedNucleotideIndex : number | undefined = mappedBasePairInformationArray[0]?.nucleotideIndex;
      for (let i = 1; i < fullKeysArray.length; i++) {
        const currentFullKeys = fullKeysArray[i];
        const mappedBasePairInformationI = mappedBasePairInformationArray[i];
        if (
          currentFullKeys.rnaMoleculeName !== previousFullKeys.rnaMoleculeName ||
          currentFullKeys.nucleotideIndex - previousFullKeys.nucleotideIndex !== 1
        ) {
          if (encounteredBreakFlag) {
            return false;
          }
          encounteredBreakFlag = true;
          if (
            mappedBasePairInformationI === undefined ||
            mappedBasePairInformationI.rnaMoleculeName !== previousFullKeys.rnaMoleculeName ||
            mappedBasePairInformationI.nucleotideIndex !== previousFullKeys.nucleotideIndex
          ) {
            return false;
          }
          previousBasePairedNucleotideIndex = mappedBasePairInformationI.nucleotideIndex;
          const mappedBasePairInformationIMinusOne = mappedBasePairInformationArray[i - 1];
          if (
            mappedBasePairInformationIMinusOne !== undefined &&
            (
              mappedBasePairInformationI.rnaMoleculeName !== mappedBasePairInformationIMinusOne.rnaMoleculeName ||
              Math.abs(mappedBasePairInformationI.nucleotideIndex - mappedBasePairInformationIMinusOne.nucleotideIndex) !== 1
            )
          ) {
            return false;
          }
        } else if (mappedBasePairInformationI !== undefined) {
          const mappedBasePairInformationIMinusOne = mappedBasePairInformationArray[i - 1];
          if (
            mappedBasePairInformationIMinusOne !== undefined &&
            (
              mappedBasePairInformationI.rnaMoleculeName !== mappedBasePairInformationIMinusOne.rnaMoleculeName ||
              Math.abs(mappedBasePairInformationI.nucleotideIndex - mappedBasePairInformationIMinusOne.nucleotideIndex) !== 1
            )
          ) {
            return false;
          }
          if (previousBasePairedNucleotideIndex !== undefined) {
            const basePairsPerRnaMolecule = basePairs[mappedBasePairInformationI.rnaMoleculeName];
            const boundingNucleotides = [
              previousBasePairedNucleotideIndex,
              mappedBasePairInformationI.nucleotideIndex
            ].sort(subtractNumbers);
            const minimumNucleotideIndex = boundingNucleotides[0];
            const maximumNucleotideIndex = boundingNucleotides[1];
            for (let nucleotideIndex = minimumNucleotideIndex + 1; nucleotideIndex < maximumNucleotideIndex; nucleotideIndex++) {
              if (nucleotideIndex in basePairsPerRnaMolecule) {
                return false;
              }
            }
          }
          previousBasePairedNucleotideIndex = mappedBasePairInformationI.nucleotideIndex;
        }
        previousFullKeys = currentFullKeys;
      }
      return true;*/
      // FINISH DETECTING InteractionConstraint.Enum.RNA_STACKED_HELIX
    }

    function isRnaCycle() {
      // BEGIN DETECTING InteractionConstraint.Enum.RNA_CYCLE
      if (!singleRnaComplexFlag) {
        return false;
      }
      const keysRecord : Record<RnaMoleculeKey, Set<NucleotideKey>> = {};
      for (const { rnaMoleculeName, nucleotideIndex } of fullKeysArray) {
        if (!(rnaMoleculeName in keysRecord)) {
          keysRecord[rnaMoleculeName] = new Set<NucleotideKey>();
        }
        const keysPerRnaMolecule = keysRecord[rnaMoleculeName];
        keysPerRnaMolecule.add(nucleotideIndex);
      }
      const { rnaMoleculeProps, basePairs } = rnaComplexProps[minimumFullKeys.rnaComplexIndex];
      const encounteredKeysRecord : Record<RnaMoleculeKey, Set<NucleotideKey>> = {
        [minimumFullKeys.rnaMoleculeName] : new Set<NucleotideKey>([minimumFullKeys.nucleotideIndex])
      };
      const queue = new Array<RnaComplex.BasePairKeys>(minimumFullKeys);
      let count = 0;
      while (queue.length > 0) {
        count++;

        const {
          rnaMoleculeName,
          nucleotideIndex
        } = queue.shift() as RnaComplex.BasePairKeys;
        const { nucleotideProps } = rnaMoleculeProps[rnaMoleculeName];
        const basePairsPerRnaMolecule = basePairs[rnaMoleculeName];

        const neighbors = new Array<RnaComplex.BasePairKeys>();
        if (nucleotideIndex - 1 in nucleotideProps) {
          neighbors.push({
            rnaMoleculeName,
            nucleotideIndex : nucleotideIndex - 1
          });
        }
        if (nucleotideIndex + 1 in nucleotideProps) {
          neighbors.push({
            rnaMoleculeName,
            nucleotideIndex : nucleotideIndex + 1
          });
        }
        if (nucleotideIndex in basePairsPerRnaMolecule) {
          const basePairsPerNucleotide = basePairsPerRnaMolecule[nucleotideIndex].filter(
            (basePair) => BasePair.isEnabledBasePair(
              basePair,
              treatNoncanonicalBasePairsAsUnpairedFlag
            )
          );
          for (const basePairPerNucleotide of basePairsPerNucleotide) {
            neighbors.push(basePairPerNucleotide);
          }
        }
        for (const neighbor of neighbors) {
          const {
            rnaMoleculeName,
            nucleotideIndex
          } = neighbor;
          if (
            rnaMoleculeName in keysRecord &&
            keysRecord[rnaMoleculeName].has(nucleotideIndex) && (
              !(rnaMoleculeName in encounteredKeysRecord) ||
              !encounteredKeysRecord[rnaMoleculeName].has(nucleotideIndex)
            )
          ) {
            if (!(rnaMoleculeName in encounteredKeysRecord)) {
              encounteredKeysRecord[rnaMoleculeName] = new Set<NucleotideKey>();
            }
            const encounteredKeysPerRnaMolecule = encounteredKeysRecord[rnaMoleculeName];
            encounteredKeysPerRnaMolecule.add(nucleotideIndex);
            queue.push(neighbor);
          }
        }
      }
      return count === fullKeysArray.length;
      // FINISH DETECTING InteractionConstraint.Enum.RNA_CYCLE
    }

    const isRnaCycleFlag = isRnaCycle();

    if (noNucleotidesAreBasePairedFlag) {
      // BEGIN DETECTING InteractionConstraint.Enum.RNA_SINGLE_STRAND
      // let singleStrandFlag = true;
      // let previousFullKeys = fullKeysArray[0];
      // for (let i = 1; i < fullKeysArray.length; i++) {
      //   const currentFullKeys = fullKeysArray[i];
      //   if (
      //     previousFullKeys.rnaComplexIndex !== currentFullKeys.rnaComplexIndex ||
      //     previousFullKeys.rnaMoleculeName !== currentFullKeys.rnaMoleculeName ||
      //     Math.abs(previousFullKeys.nucleotideIndex - currentFullKeys.nucleotideIndex) !== 1
      //   ) {
      //     singleStrandFlag = false;
      //     break;
      //   }
      //   previousFullKeys = currentFullKeys;
      // }
      // if (singleStrandFlag) {
      //   return {
      //     fullKeys : previousFullKeys,
      //     interactionConstraint : InteractionConstraint.Enum.RNA_SINGLE_STRAND
      //   };
      // }
      if (isRnaCycleFlag) {
        return {
          fullKeys : minimumFullKeys,
          interactionConstraint : InteractionConstraint.Enum.RNA_SINGLE_STRAND
        };
      }
      // FINISH DETECTING InteractionConstraint.Enum.RNA_SINGLE_STRAND
    } else if (allNucleotidesAreBasePairedFlag) {
      // BEGIN DETECTING InteractionConstraint.Enum.RNA_HELIX
      // if (
      //   singleRnaComplexFlag && 
      //   (singleRnaMoleculeFlag || dualRnaMoleculesFlag)
      // ) {
      //   let encounteredBreakFlag = false;
      //   let singleHelixFlag = true;
      //   let previousFullKeys = fullKeysArray[0];
      //   for (let i = 1; i < fullKeysArray.length; i++) {
      //     const currentFullKeys = fullKeysArray[i];
      //     const basePairsPerNucleotideI = basePairsPerNucleotides[i];
      //     if (currentFullKeys.nucleotideIndex - previousFullKeys.nucleotideIndex !== 1) {
      //       if (encounteredBreakFlag) {
      //         singleHelixFlag = false;
      //         break;
      //       } else {
      //         encounteredBreakFlag = true;
      //         if (
      //           basePairsPerNucleotideI === undefined ||
      //           !basePairsPerNucleotideI.some(({ rnaMoleculeName, nucleotideIndex }) => (
      //             rnaMoleculeName !== previousFullKeys.rnaMoleculeName ||
      //             nucleotideIndex !== previousFullKeys.nucleotideIndex
      //           ))
      //         ) {
      //           singleHelixFlag = false;
      //           break;
      //         }
      //       }
      //     } else if (basePairsPerNucleotideI !== undefined) {
      //       const basePairsPerNucleotideIMinusOne = basePairsPerNucleotides[i - 1];
      //       if (
      //         basePairsPerNucleotideIMinusOne !== undefined &&
      //         !basePairsPerNucleotideI.some((basePairPerNucleotideI) => basePairsPerNucleotideIMinusOne.some((basePairPerNucleotideIMinusOne) => (
      //           basePairPerNucleotideI.rnaMoleculeName === basePairPerNucleotideIMinusOne.rnaMoleculeName &&
      //           Math.abs(basePairPerNucleotideI.nucleotideIndex - basePairPerNucleotideIMinusOne.nucleotideIndex) === 1
      //         )))
      //       ) {
      //         singleHelixFlag = false;
      //         break;
      //       }
      //     }
      //     previousFullKeys = currentFullKeys;
      //   }
      //   if (singleHelixFlag) {
      //     return {
      //       fullKeys : minimumFullKeys,
      //       interactionConstraint : InteractionConstraint.Enum.RNA_HELIX
      //     };
      //   }
      // }
      if (
        isRnaCycleFlag &&
        (
          singleRnaMoleculeFlag ||
          dualRnaMoleculesFlag
        )
      ) {
        return {
          fullKeys : minimumFullKeys,
          interactionConstraint : InteractionConstraint.Enum.RNA_HELIX
        };
      }
      // FINISH DETECTING InteractionConstraint.Enum.RNA_HELIX
      if (isSubdomain()) {
        return {
          fullKeys : minimumFullKeys,
          interactionConstraint : InteractionConstraint.Enum.RNA_SUB_DOMAIN
        };
      }
      if (isStackedHelix(isRnaCycleFlag)) {
        return {
          fullKeys : minimumFullKeys,
          interactionConstraint : InteractionConstraint.Enum.RNA_STACKED_HELIX
        };
      }
    } else {
      if (isSubdomain()) {
        return {
          fullKeys : minimumFullKeys,
          interactionConstraint : InteractionConstraint.Enum.RNA_SUB_DOMAIN
        };
      }
      if (isStackedHelix(isRnaCycleFlag)) {
        return {
          fullKeys : fullKeysArray.find(function(
            _fullKeys,
            i
          ) {
            return basePairsPerNucleotides[i] !== undefined;
          }) as FullKeys,
          interactionConstraint : InteractionConstraint.Enum.RNA_STACKED_HELIX
        };
      }
      if (isRnaCycleFlag) {
        return {
          fullKeys : fullKeysArray.find(function(
            _fullKeys,
            i
          ) {
            return basePairsPerNucleotides[i] === undefined;
          }) as FullKeys,
          interactionConstraint : InteractionConstraint.Enum.RNA_CYCLE
        }
      }
    }

    if (singleRnaMoleculeFlag) {
      return {
        fullKeys : minimumFullKeys,
        interactionConstraint : InteractionConstraint.Enum.RNA_MOLECULE
      };
    }

    if (singleRnaComplexFlag) {
      return {
        fullKeys : minimumFullKeys,
        interactionConstraint : InteractionConstraint.Enum.RNA_COMPLEX
      };
    }

    // BEGIN DETECTING InteractionConstraint.Enum.SINGLE_COLOR
    const singleColorCandidate = rnaComplexProps[minimumFullKeys.rnaComplexIndex].rnaMoleculeProps[minimumFullKeys.rnaMoleculeName].nucleotideProps[minimumFullKeys.nucleotideIndex].color ?? BLACK;
    let singleColorFlag = true;
    for (let i = 1; i < fullKeysArray.length; i++) {
      const {
        rnaComplexIndex,
        rnaMoleculeName,
        nucleotideIndex
      } = fullKeysArray[i];
      const color = rnaComplexProps[rnaComplexIndex].rnaMoleculeProps[rnaMoleculeName].nucleotideProps[nucleotideIndex].color ?? BLACK;
      if (!areEqual(
        singleColorCandidate,
        color
      )) {
        singleColorFlag = false;
        break;
      }
    }
    if (singleColorFlag) {
      return {
        fullKeys : minimumFullKeys,
        interactionConstraint : InteractionConstraint.Enum.SINGLE_COLOR
      };
    }
    // FINISH DETECTING InteractionConstraint.Enum.SINGLE_COLOR

    return {
      fullKeys : minimumFullKeys,
      interactionConstraint : InteractionConstraint.Enum.ENTIRE_SCENE
    };
  }
  switch (fullKeysArray.length) {
    case 0 : {
      return undefined;
    }
    case 1 : {
      const fullKeys = fullKeysArray[0];
      const {
        rnaComplexIndex,
        rnaMoleculeName,
        nucleotideIndex
      } = fullKeys;
      const { basePairs } = rnaComplexProps[rnaComplexIndex];
      let interactionConstraint = InteractionConstraint.Enum.SINGLE_NUCLEOTIDE;
      if (rnaMoleculeName in basePairs) {
        const basePairsPerRnaMolecule = basePairs[rnaMoleculeName];
        if (
          nucleotideIndex in basePairsPerRnaMolecule && basePairsPerRnaMolecule[nucleotideIndex].some((basePair) => BasePair.isEnabledBasePair(
            basePair,
            treatNoncanonicalBasePairsAsUnpairedFlag
          ))
        ) {
          interactionConstraint = InteractionConstraint.Enum.SINGLE_BASE_PAIR;
        }
      }
      return {
        fullKeys,
        interactionConstraint 
      };
    }
    case 2 : {
      const fullKeys0 = fullKeysArray[0];
      const fullKeys1 = fullKeysArray[1];

      const { basePairs } = rnaComplexProps[fullKeys0.rnaComplexIndex];
      let basePairsPerRnaMolecule : RnaComplex.BasePairsPerRnaMolecule;
      let basePairsPerNucleotide0 : RnaComplex.BasePairsPerNucleotide;
      
      if (
        fullKeys0.rnaComplexIndex === fullKeys1.rnaComplexIndex &&
        fullKeys0.rnaMoleculeName in basePairs &&
        fullKeys0.nucleotideIndex in (basePairsPerRnaMolecule = basePairs[fullKeys0.rnaMoleculeName]) && 
        (basePairsPerNucleotide0 = basePairsPerRnaMolecule[fullKeys0.nucleotideIndex]).some(({ rnaMoleculeName, nucleotideIndex }) => (
          fullKeys1.rnaMoleculeName === rnaMoleculeName &&
          fullKeys1.nucleotideIndex === nucleotideIndex && BasePair.isEnabledBasePair(
            { rnaMoleculeName, nucleotideIndex },
            treatNoncanonicalBasePairsAsUnpairedFlag
          )
        ))
      ) {
        return {
          fullKeys : fullKeys0,
          interactionConstraint : InteractionConstraint.Enum.SINGLE_BASE_PAIR
        };
      } else {
        return handleMultipleFullKeys();
      }
    }
    default : {
      return handleMultipleFullKeys();
    }
  }
}