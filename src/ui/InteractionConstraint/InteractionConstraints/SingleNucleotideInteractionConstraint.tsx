import { RnaComplexProps, FullKeys } from "../../../App";
import { NucleotideKeysToRerender, BasePairKeysToRerender } from "../../../context/Context";
import { Vector2D } from "../../../data_structures/Vector2D";
import { AbstractInteractionConstraint, InteractionConstraintError, basePairedNucleotideError } from "../AbstractInteractionConstraint";
import { SingleNucleotideInteractionConstraintEditMenu } from "../../../components/app_specific/menus/edit_menus/SingleNucleotideInteractionConstraintEditMenu";
import { Nucleotide } from "../../../components/app_specific/Nucleotide";
import { InteractionConstraint } from "../InteractionConstraints";
import { Tab } from "../../../app_data/Tab";
import { BasePairsEditor } from "../../../components/app_specific/editors/BasePairsEditor";
import { NucleotideRegionsAnnotateMenu } from "../../../components/app_specific/menus/annotate_menus/NucleotideRegionsAnnotateMenu";

export class SingleNucleotideInteractionConstraint extends AbstractInteractionConstraint {
  private readonly singularNucleotideProps : Nucleotide.ExternalProps;

  constructor(
    rnaComplexProps : RnaComplexProps,
    fullKeys : FullKeys,
    setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void,
    setBasePairKeysToRerender : (basePairKeysToRerender : BasePairKeysToRerender) => void,
    setDebugVisualElements : (debugVisualElements : Array<JSX.Element>) => void,
    tab : Tab
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
    if (tab !== Tab.ANNOTATE && rnaMoleculeName in basePairs && nucleotideIndex in basePairs[rnaMoleculeName]) {
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
      <br/>
    </>;
    let menu : JSX.Element;
    switch (tab) {
      case Tab.EDIT : {
        menu = <SingleNucleotideInteractionConstraintEditMenu.Component
          rnaComplexProps = {this.rnaComplexProps}
          fullKeys = {this.fullKeys}
          triggerRerender = {function() {
            setNucleotideKeysToRerender({
              [rnaComplexIndex] : {
                [rnaMoleculeName] : [nucleotideIndex]
              }
            });
          }}
        />;
        break;
      }
      case Tab.FORMAT : {
        const formattedNucleotideIndex0 = nucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex;
        menu = <BasePairsEditor.Component
          rnaComplexProps = {this.rnaComplexProps}
          initialBasePairs = {[
            {
              rnaComplexIndex,
              rnaMoleculeName0 : rnaMoleculeName,
              nucleotideIndex0 : formattedNucleotideIndex0,
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
            const errorMessage = "This interaction constraint expects a base pair involving the clicked-on nucleotide.";
            if (
              parsedBasePair.rnaComplexIndex !== rnaComplexIndex ||
              ![parsedBasePair.rnaMoleculeName0, parsedBasePair.rnaMoleculeName1].includes(rnaMoleculeName) ||
              ![parsedBasePair.nucleotideIndex0, parsedBasePair.nucleotideIndex1].includes(formattedNucleotideIndex0)
            ) {
              throw errorMessage;
            }
          }}
          defaultRnaComplexIndex = {rnaComplexIndex}
          defaultRnaMoleculeName0 = {rnaMoleculeName}
          defaultRnaMoleculeName1 = {rnaMoleculeName}
        />;
        break;
      }
      case Tab.ANNOTATE : {
        menu = <NucleotideRegionsAnnotateMenu.Component
          regions = {{
            [rnaComplexIndex] : {
              [rnaMoleculeName] : [{
                minimumNucleotideIndexInclusive : nucleotideIndex,
                maximumNucleotideIndexInclusive : nucleotideIndex
              }]
            }
          }}
          rnaComplexProps = {this.rnaComplexProps}
          setNucleotideKeysToRerender = {setNucleotideKeysToRerender}
        />;
        break;
      }
      default : {
        const error : InteractionConstraintError = {
          errorMessage : "Not yet implemented."
        };
        throw error;
      }
    }
    return <>
      {header}
      {menu}
    </>;
  }
};