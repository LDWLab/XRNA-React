import { RnaComplexProps, FullKeys, FullKeysRecord } from "../../../App";
import { NucleotideKeysToRerender, BasePairKeysToRerender } from "../../../context/Context";
import { Vector2D } from "../../../data_structures/Vector2D";
import { AbstractInteractionConstraint, InteractionConstraintError, basePairedNucleotideError } from "../AbstractInteractionConstraint";
import { SingleNucleotideInteractionConstraintEditMenu } from "../../../components/app_specific/menus/edit_menus/SingleNucleotideInteractionConstraintEditMenu";
import { Nucleotide } from "../../../components/app_specific/Nucleotide";
import { Helix, InteractionConstraint } from "../InteractionConstraints";
import { Tab } from "../../../app_data/Tab";
import { BasePairsEditor } from "../../../components/app_specific/editors/BasePairsEditor";
import { NucleotideRegionsAnnotateMenu } from "../../../components/app_specific/menus/annotate_menus/NucleotideRegionsAnnotateMenu";
import { RnaComplex, isRelevantBasePairKeySetInPair, selectRelevantBasePairKeys } from "../../../components/app_specific/RnaComplex";

export class SingleNucleotideInteractionConstraint extends AbstractInteractionConstraint {
  private readonly singularNucleotideProps : Nucleotide.ExternalProps;
  private readonly error? : InteractionConstraintError;
  private readonly rerender : () => void;

  constructor(
    rnaComplexProps : RnaComplexProps,
    setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void,
    setBasePairKeysToRerender : (basePairKeysToRerender : BasePairKeysToRerender) => void,
    setDebugVisualElements : (debugVisualElements : Array<JSX.Element>) => void,
    tab : Tab,
    indicesOfFrozenNucleotides : FullKeysRecord,
    interactionConstraintOptions : InteractionConstraint.Options,
    fullKeys0 : FullKeys,
    fullKeys1? : FullKeys,
  ) {
    super(
      rnaComplexProps,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      setDebugVisualElements,
      indicesOfFrozenNucleotides,
      fullKeys0,
      fullKeys1
    );
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex
    } = this.fullKeys0;
    const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
    const {
      basePairs
    } = singularRnaComplexProps;
    this.singularNucleotideProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName].nucleotideProps[nucleotideIndex];

    this.addFullIndices(fullKeys0);
    let basePairsPerRnaMolecule : RnaComplex.BasePairsPerRnaMolecule;
    if (rnaMoleculeName in basePairs && nucleotideIndex in (basePairsPerRnaMolecule = basePairs[rnaMoleculeName])) {
      const mappedBasePairInformation = basePairsPerRnaMolecule[nucleotideIndex];
      this.error = basePairedNucleotideError;
      this.rerender = function() {
        setNucleotideKeysToRerender({
          [rnaComplexIndex] : {
            [rnaMoleculeName] : [nucleotideIndex]
          }
        });
        const keys = {
          rnaMoleculeName,
          nucleotideIndex
        };
        let basePairKeysToRerender : BasePairKeysToRerender = {
          [rnaComplexIndex] : []
        };
        const basePairKeysToRerenderPerRnaComplex = basePairKeysToRerender[rnaComplexIndex];
        const basePairsPerNucleotide = basePairsPerRnaMolecule[nucleotideIndex];
        for (const basePairPerNucleotide of basePairsPerNucleotide) {
          basePairKeysToRerenderPerRnaComplex.push(selectRelevantBasePairKeys(
            keys,
            basePairPerNucleotide
          ));
        }
        setBasePairKeysToRerender(basePairKeysToRerender);
      }
    } else {
      this.rerender = function() {
        setNucleotideKeysToRerender({
          [rnaComplexIndex] : {
            [rnaMoleculeName] : [nucleotideIndex]
          }
        });
      }
    }
    if (rnaComplexIndex in indicesOfFrozenNucleotides) {
      const indicesOfFrozenNucleotidesPerRnaComplex = indicesOfFrozenNucleotides[rnaComplexIndex];
      if (rnaMoleculeName in indicesOfFrozenNucleotidesPerRnaComplex) {
        const indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule = indicesOfFrozenNucleotidesPerRnaComplex[rnaMoleculeName];
        if (indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule.has(nucleotideIndex)) {
          this.error = {
            errorMessage : "Cannot interact with this frozen nucleotide."
          };
        }
      }
    }
  }

  public override drag() {
    if (this.error !== undefined && this.error !== basePairedNucleotideError) {
      throw this.error;
    }
    const singularNucleotideProps = this.singularNucleotideProps;
    const rerender = this.rerender;
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
        rerender();
      }
    };
  }
  
  public override createRightClickMenu(tab : InteractionConstraint.SupportedTab) {
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex
    } = this.fullKeys0;
    const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
    const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
    const rerender = this.rerender;

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
    if (this.error !== undefined && this.error !== basePairedNucleotideError) {
      throw this.error;
    }
    switch (tab) {
      case Tab.EDIT : {
        menu = <SingleNucleotideInteractionConstraintEditMenu.Component
          rnaComplexProps = {this.rnaComplexProps}
          fullKeys = {this.fullKeys0}
          triggerRerender = {rerender}
        />;
        break;
      }
      case Tab.FORMAT : {
        if (this.error !== undefined) {
          throw this.error;
        }
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
            switch (parsedBasePairs.length) {
              case 0 : {
                // Do nothing.
                break;
              }
              case 1 : {
                const parsedBasePair = parsedBasePairs[0];
                if (parsedBasePair.length > 1) {
                  throw "This constraint expects at most one base pair.";
                }
                const errorMessage = "This constraint expects a base pair involving the clicked-on nucleotide.";
                if (
                  parsedBasePair.rnaComplexIndex !== rnaComplexIndex ||
                  ![parsedBasePair.rnaMoleculeName0, parsedBasePair.rnaMoleculeName1].includes(rnaMoleculeName) ||
                  ![parsedBasePair.nucleotideIndex0, parsedBasePair.nucleotideIndex1].includes(formattedNucleotideIndex0)
                ) {
                  throw errorMessage;
                }
                break;
              }
              default : {
                throw "This constraint expects at most one base pair.";
              }
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
          setNucleotideKeysToRerender = {this.setNucleotideKeysToRerender}
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

  public override getHelices() {
    return [];
  }
};