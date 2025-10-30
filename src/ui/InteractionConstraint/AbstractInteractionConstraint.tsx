import { RnaComplexProps, FullKeys, DragListener, FullKeysRecord } from "../../App";
import { BasePairsEditor } from "../../components/app_specific/editors/BasePairsEditor";
import { NucleotideKeysToRerender, BasePairKeysToRerender } from "../../context/Context";
import { Helix, InteractionConstraint } from "./InteractionConstraints";

export const basePairedNucleotideError : InteractionConstraintError = {
  errorMessage : "Cannot interact with a base-paired nucleotide using this constraint."
};
export const nonBasePairedNucleotideError : InteractionConstraintError = {
  errorMessage : "Cannot interact with a non-base-paired nucleotide using this constraint."
};
export const multipleBasePairsNucleotideError : InteractionConstraintError = {
  errorMessage : "Cannot apply this constraint to a nucleotide with multiple base pairs. Try right-clicking on a base pair instead."
};

export abstract class AbstractInteractionConstraint {
  public readonly indicesOfAffectedNucleotides : FullKeysRecord = {};
  protected readonly rnaComplexProps : RnaComplexProps;
  protected readonly fullKeys0 : FullKeys;
  protected readonly fullKeys1? : FullKeys;
  protected readonly setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void;
  protected readonly setBasePairKeysToRerender : (basePairKeysToRerender : BasePairKeysToRerender) => void;
  protected readonly setDebugVisualElements : (debugVisualElements : Array<JSX.Element>) => void;
  protected readonly indicesOfFrozenNucleotides : FullKeysRecord;

  constructor(
    rnaComplexProps : RnaComplexProps,
    setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void,
    setBasePairKeysToRerender : (basePairKeysToRerender : BasePairKeysToRerender) => void,
    setDebugVisualElements : (debugVisualElements : Array<JSX.Element>) => void,
    indicesOfFrozenNucleotides : FullKeysRecord,
    fullKeys0 : FullKeys,
    fullKeys1? : FullKeys
  ) {
    this.rnaComplexProps = rnaComplexProps;
    this.fullKeys0 = fullKeys0;
    this.fullKeys1 = fullKeys1;
    this.setNucleotideKeysToRerender = setNucleotideKeysToRerender;
    this.setBasePairKeysToRerender = setBasePairKeysToRerender;
    this.setDebugVisualElements = setDebugVisualElements;
    this.indicesOfFrozenNucleotides = indicesOfFrozenNucleotides;
  }

  abstract drag() : DragListener | undefined;

  abstract createRightClickMenu(tab : InteractionConstraint.SupportedTab) : JSX.Element;

  abstract getHelices() : Array<Helix>;

  constrainRelevantHelices(helices : Array<Helix>) : Array<Helix> {
    return helices.filter(({ rnaComplexIndex, rnaMoleculeName0, rnaMoleculeName1, start, stop }) => {
      const length = Math.abs(stop[0] - start[0]) + 1;
      const increment0 = Math.sign(stop[0] - start[0]);
      const increment1 = Math.sign(stop[1] - start[1]);
      let nucleotideIndex0 = start[0];
      let nucleotideIndex1 = start[1];
      for (let i = 0; i < length; i++) {
        if (rnaComplexIndex in this.indicesOfAffectedNucleotides) {
          const indicesOfAffectedNucleotidesPerRnaComplex = this.indicesOfAffectedNucleotides[rnaComplexIndex];
          if (rnaMoleculeName0 in indicesOfAffectedNucleotidesPerRnaComplex) {
            if (indicesOfAffectedNucleotidesPerRnaComplex[rnaMoleculeName0].has(nucleotideIndex0)) {
              return true;
            }
          }
          if (rnaMoleculeName1 in indicesOfAffectedNucleotidesPerRnaComplex) {
            if (indicesOfAffectedNucleotidesPerRnaComplex[rnaMoleculeName1].has(nucleotideIndex1)) {
              return true;
            }
          }
        }
        nucleotideIndex0 += increment0;
        nucleotideIndex1 += increment1;
      }
      return false;
    });
  }

  addFullIndices(...fullKeysSets : Array<FullKeys>) {
    for (const fullKeys0 of fullKeysSets) {
      const {
        rnaComplexIndex,
        rnaMoleculeName,
        nucleotideIndex
      } = fullKeys0;
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