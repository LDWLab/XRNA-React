import { RnaComplexProps, FullKeys, DragListener, FullKeysRecord } from "../../App";
import { BasePairsEditor } from "../../components/app_specific/editors/BasePairsEditor";
import { NucleotideKeysToRerender, BasePairKeysToRerender } from "../../context/Context";
import { InteractionConstraint } from "./InteractionConstraints";

export const basePairedNucleotideErrorMessage = "Cannot interact with a base-paired nucleotide using this interaction constraint.";
export const nonBasePairedNucleotideErrorMessage = "Cannot interact with a non-base-paired nucleotide using this interaction constraint.";

export const basePairedNucleotideError : InteractionConstraintError = {
  errorMessage : basePairedNucleotideErrorMessage
};
export const nonBasePairedNucleotideError : InteractionConstraintError = {
  errorMessage : nonBasePairedNucleotideErrorMessage
};

export abstract class AbstractInteractionConstraint {
  public readonly indicesOfAffectedNucleotides : FullKeysRecord = {};
  protected readonly rnaComplexProps : RnaComplexProps;
  protected readonly fullKeys : FullKeys;
  protected readonly setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void;
  protected readonly setBasePairKeysToRerender : (basePairKeysToRerender : BasePairKeysToRerender) => void;
  protected readonly setDebugVisualElements : (debugVisualElements : Array<JSX.Element>) => void;

  constructor(
    rnaComplexProps : RnaComplexProps,
    fullKeys : FullKeys,
    setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void,
    setBasePairKeysToRerender : (basePairKeysToRerender : BasePairKeysToRerender) => void,
    setDebugVisualElements : (debugVisualElements : Array<JSX.Element>) => void
  ) {
    this.rnaComplexProps = rnaComplexProps;
    this.fullKeys = fullKeys;
    this.setNucleotideKeysToRerender = setNucleotideKeysToRerender;
    this.setBasePairKeysToRerender = setBasePairKeysToRerender;
    this.setDebugVisualElements = setDebugVisualElements;
  }

  abstract drag(interactionConstraintOptions : InteractionConstraint.Options) : DragListener | undefined;

  abstract createRightClickMenu(tab : InteractionConstraint.SupportedTab) : JSX.Element;

  addFullIndices(...fullKeysSets : Array<FullKeys>) {
    for (const fullKeys of fullKeysSets) {
      const {
        rnaComplexIndex,
        rnaMoleculeName,
        nucleotideIndex
      } = fullKeys;
      if (!(rnaComplexIndex in this.indicesOfAffectedNucleotides)) {
        this.indicesOfAffectedNucleotides[rnaComplexIndex] = {};
      }
      const indicesOfAffectedNucleotidesPerRnaComplex = this.indicesOfAffectedNucleotides[rnaComplexIndex];
      if (!(rnaMoleculeName in indicesOfAffectedNucleotidesPerRnaComplex)) {
        indicesOfAffectedNucleotidesPerRnaComplex[rnaMoleculeName] = new Set<number>();
      }
      const indicesOfAffectedNucleotidesPerRnaMolecule = indicesOfAffectedNucleotidesPerRnaComplex[rnaMoleculeName];
      indicesOfAffectedNucleotidesPerRnaMolecule.add(nucleotideIndex);
    }
  }

  addFullIndicesPerHelices(
    firstNucleotideIndexPerRnaMolecule0 : number,
    firstNucleotideIndexPerRnaMolecule1 : number,
    ...basePairs : Array<BasePairsEditor.BasePair>
  ) {
    for (const basePair of basePairs) {
      const {
        rnaComplexIndex,
        rnaMoleculeName0,
        rnaMoleculeName1,
        nucleotideIndex0,
        nucleotideIndex1,
        length
      } = basePair;
      for (let i = 0; i < length; i++) {
        this.addFullIndices(
          {
            rnaComplexIndex,
            rnaMoleculeName : rnaMoleculeName0,
            nucleotideIndex : nucleotideIndex0 + i - firstNucleotideIndexPerRnaMolecule0
          },
          {
            rnaComplexIndex,
            rnaMoleculeName : rnaMoleculeName1,
            nucleotideIndex : nucleotideIndex1 - i - firstNucleotideIndexPerRnaMolecule1
          }
        );
      }
    }
  }

  addFullIndicesPerNucleotideKeysToRerender(nucleotideKeysToRerender : NucleotideKeysToRerender) {
    for (const [rnaComplexIndexAsString, nucleotideKeysToRerenderPerRnaComplex] of Object.entries(nucleotideKeysToRerender) ) {
      const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
      for (const [rnaMoleculeName, nucleotideKeysToRerenderPerRnaMolecule] of Object.entries(nucleotideKeysToRerenderPerRnaComplex)) {
        for (const nucleotideIndex of nucleotideKeysToRerenderPerRnaMolecule) {
          this.addFullIndices({
            rnaComplexIndex,
            rnaMoleculeName,
            nucleotideIndex
          });
        }
      }
    }
  }
};

export type InteractionConstraintError = {
  errorMessage : string
};