import { RnaComplexProps, FullKeys } from "../../../App";
import { NucleotideKeysToRerender, BasePairKeysToRerender } from "../../../context/Context";
import { Vector2D } from "../../../data_structures/Vector2D";
import { AbstractInteractionConstraint, InteractionConstraintError, basePairedNucleotideError } from "../AbstractInteractionConstraint";
import { SingleNucleotideInteractionConstraintEditMenu } from "../../../components/app_specific/menus/edit_menus/SingleNucleotideInteractionConstraintEditMenu";
import { Nucleotide } from "../../../components/app_specific/Nucleotide";
import { InteractionConstraint } from "../InteractionConstraints";
import { Tab } from "../../../app_data/Tab";
import { BasePairsEditor } from "../../../components/app_specific/editors/BasePairsEditor";

export class SingleNucleotideInteractionConstraint extends AbstractInteractionConstraint {
  private readonly singularNucleotideProps : Nucleotide.ExternalProps;

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
    const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
    const {
      basePairs
    } = singularRnaComplexProps;
    if (rnaMoleculeName in basePairs && nucleotideIndex in basePairs[rnaMoleculeName]) {
      throw basePairedNucleotideError;
    }
    this.singularNucleotideProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName].nucleotideProps[nucleotideIndex];
  }

  public override drag() {
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex
    } = this.fullKeys;
    const singularNucleotideProps = this.singularNucleotideProps;
    const setNucleotideKeysToRerender = this.setNucleotideKeysToRerender;
    return {
      initiateDrag() {
        return {
          x : singularNucleotideProps.x,
          y : singularNucleotideProps.y
        };
      },
      continueDrag(totalDrag : Vector2D) {
        singularNucleotideProps.x = totalDrag.x;
        singularNucleotideProps.y = totalDrag.y;
        setNucleotideKeysToRerender({
          [rnaComplexIndex] : {
            [rnaMoleculeName] : [nucleotideIndex]
          }
        });
      }
    };
  }
  
  public override createRightClickMenu(tab : InteractionConstraint.SupportedTab) {
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex
    } = this.fullKeys;
    const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
    const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
    const setNucleotideKeysToRerender = this.setNucleotideKeysToRerender;
    const setBasePairKeysToRerender = this.setBasePairKeysToRerender;

    const header = <>
      <b>
        {tab} nucleotide #{singularRnaMoleculeProps.firstNucleotideIndex + nucleotideIndex}
      </b>
      <br/>
      In RNA molecule "{rnaMoleculeName}"
      <br/>
      In RNA complex "{singularRnaComplexProps.name}"
    </>;
    switch (tab) {
      case Tab.EDIT : {
        return <>
          {header}
          <br/>
          <SingleNucleotideInteractionConstraintEditMenu.Component
            rnaComplexProps = {this.rnaComplexProps}
            fullKeys = {this.fullKeys}
            triggerRerender = {function() {
              setNucleotideKeysToRerender({
                [rnaComplexIndex] : {
                  [rnaMoleculeName] : [nucleotideIndex]
                }
              });
            }}
          />
        </>;
      }
      case Tab.FORMAT : {
        return <>
          {header}
          <br/>
          <BasePairsEditor.Component
            rnaComplexProps = {this.rnaComplexProps}
            initialBasePairs = {[
              {
                rnaComplexIndex,
                rnaMoleculeName0 : rnaMoleculeName,
                rnaMoleculeName1 : rnaMoleculeName,
                nucleotideIndex0 : nucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex,
                length : 1
              }
            ]}
            approveBasePairs = {function(parsedBasePairs : Array<BasePairsEditor.BasePair>) {
              if (parsedBasePairs.length > 1) {
                throw "This interaction constraint expects at most one base pair.";
              }
              const parsedBasePair = parsedBasePairs[0];
              if (parsedBasePair.length > 1) {
                throw "This interaction constraint expects at most one base pair.";
              }
            }}
          />
        </>;
      }
      default : {
        const error : InteractionConstraintError = {
          errorMessage : "Not yet implemented."
        };
        throw error;
      }
    }
  }
};