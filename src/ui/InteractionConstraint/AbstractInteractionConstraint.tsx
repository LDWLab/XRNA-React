import { RnaComplexProps, FullKeys, DragListener } from "../../App";
import { Tab } from "../../app_data/Tab";
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

  abstract drag() : DragListener | undefined;

  abstract createRightClickMenu(tab : InteractionConstraint.SupportedTab) : JSX.Element;
};

export type InteractionConstraintError = {
  errorMessage : string
};