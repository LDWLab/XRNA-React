import { DragListener, FullKeys, RnaComplexProps } from "../../../App";
import { RnaMoleculeInteractionConstraintEditMenu } from "../../../components/app_specific/menus/edit_menus/RnaMoleculeInteractionConstraintEditMenu";
import { AppSpecificOrientationEditor } from "../../../components/app_specific/editors/AppSpecificOrientationEditor";
import { NucleotideKeysToRerender, BasePairKeysToRerender } from "../../../context/Context";
import { Vector2D } from "../../../data_structures/Vector2D";
import { parseInteger, subtractNumbers } from "../../../utils/Utils";
import { AbstractInteractionConstraint, InteractionConstraintError } from "../AbstractInteractionConstraint";
import { linearDrag } from "../CommonDragListeners";
import { FilterHelicesMode, InteractionConstraint, iterateOverFreeNucleotidesandHelicesPerRnaMolecule } from "../InteractionConstraints";
import { Tab } from "../../../app_data/Tab";
import { BasePairsEditor } from "../../../components/app_specific/editors/BasePairsEditor";
import { NucleotideRegionsAnnotateMenu } from "../../../components/app_specific/menus/annotate_menus/NucleotideRegionsAnnotateMenu";

export class RnaMoleculeInteractionConstraint extends AbstractInteractionConstraint {
  private readonly dragListener : DragListener;
  private readonly dragError? : InteractionConstraintError;
  private readonly editMenuProps : RnaMoleculeInteractionConstraintEditMenu.Props;
  private readonly initialBasePairs : BasePairsEditor.InitialBasePairs;

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
    const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
    const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
    const toBeDragged = new Array<Vector2D>();
    const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
    const basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName];
    const nucleotideKeysToRerender : NucleotideKeysToRerender = {
      [rnaComplexIndex] : {
        [rnaMoleculeName] : []
      }
    };
    const nucleotideKeysToRerenderPerRnaComplex = nucleotideKeysToRerender[rnaComplexIndex];
    const nucleotideKeysToRerenderPerRnaMolecule = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName];
    const basePairKeysToRerender : BasePairKeysToRerender = {
      [rnaComplexIndex] : []
    };
    const basePairKeysToRerenderPerRnaComplex = basePairKeysToRerender[rnaComplexIndex];
    const nucleotideIndices = Object.keys(singularRnaMoleculeProps.nucleotideProps).map(parseInteger);
    nucleotideIndices.sort(subtractNumbers);
    for (let nucleotideIndex of nucleotideIndices) {
      this.addFullIndices({
        rnaComplexIndex,
        rnaMoleculeName,
        nucleotideIndex
      });
      toBeDragged.push(singularRnaMoleculeProps.nucleotideProps[nucleotideIndex]);
      nucleotideKeysToRerenderPerRnaMolecule.push(nucleotideIndex);
      if (nucleotideIndex in basePairsPerRnaMolecule) {
        const mappedBasePairInformation = basePairsPerRnaMolecule[nucleotideIndex];
        basePairKeysToRerenderPerRnaComplex.push({
          rnaMoleculeName,
          nucleotideIndex
        });
        if (rnaMoleculeName !== mappedBasePairInformation.rnaMoleculeName) {
          this.dragError = {
            errorMessage : "A base pair with another RNA molecule was found. Cannot drag the clicked-on RNA molecule."
          };
          break;
        }
      }
    }
    this.dragListener = linearDrag(
      structuredClone(singularNucleotideProps),
      toBeDragged,
      function() {
        setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
        setBasePairKeysToRerender(structuredClone(basePairKeysToRerender));
      }
    );
    this.editMenuProps = {
      initialName : rnaMoleculeName,
      rnaComplexProps : rnaComplexProps,
      rnaComplexIndex : fullKeys.rnaComplexIndex,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender
    };
    this.initialBasePairs = iterateOverFreeNucleotidesandHelicesPerRnaMolecule(
      singularRnaComplexProps,
      rnaMoleculeName,
      FilterHelicesMode.RNA_MOLECULE_MODE 
    ).helixData.map(function(helixDatum) {
      return {
        rnaComplexIndex,
        rnaMoleculeName0 : rnaMoleculeName,
        rnaMoleculeName1 : helixDatum.rnaMoleculeName1,
        nucleotideIndex0 : helixDatum.start[0] + singularRnaMoleculeProps.firstNucleotideIndex,
        nucleotideIndex1 : Math.max(helixDatum.start[1], helixDatum.stop[1]) + singularRnaMoleculeProps.firstNucleotideIndex,
        length : Math.abs(helixDatum.start[0] - helixDatum.stop[0]) + 1
      };
    });
  }

  public override drag() {
    if (this.dragError !== undefined) {
      throw this.dragError;
    }
    return this.dragListener;
  }

  public override createRightClickMenu(tab: InteractionConstraint.SupportedTab) {
    const {
      rnaComplexIndex,
      rnaMoleculeName
    } = this.fullKeys;
    let header : JSX.Element = <b>
      {tab} RNA molecule "{rnaMoleculeName}":
      <br/>
    </b>;
    let menu : JSX.Element;
    switch (tab) {
      case Tab.EDIT : {
        header = <>
          <b>
            {tab} RNA molecule:
          </b>
          <br/>
        </>;
        menu = <RnaMoleculeInteractionConstraintEditMenu.Component
          {...this.editMenuProps}
        />;
        break;
      }
      case Tab.FORMAT : {
        menu = <BasePairsEditor.Component
          rnaComplexProps = {this.rnaComplexProps}
          initialBasePairs = {this.initialBasePairs}
          approveBasePairs = {function(basePairs) {
            for (let i = 0; i < basePairs.length; i++) {
              const basePair = basePairs[i];
              const errorMessage = `This interaction constraint expects base pairs to involve the clicked-on RNA molecule. The base pair on line #${i + 1} does not.`;
              if (
                rnaComplexIndex !== basePair.rnaComplexIndex ||
                (rnaMoleculeName !== basePair.rnaMoleculeName0 && rnaMoleculeName !== basePair.rnaMoleculeName1)
              ) {
                throw errorMessage;
              }
            }
          }}
        />;
        break;
      }
      case Tab.ANNOTATE : {
        const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
        const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
        const maximumNucleotideIndexInclusive = Math.max(...Object.keys(singularRnaMoleculeProps.nucleotideProps).map(parseInteger));
        menu = <NucleotideRegionsAnnotateMenu.Component
          regions = {{
            [rnaComplexIndex] : {
              [rnaMoleculeName] : [
                {
                  minimumNucleotideIndexInclusive : 0,
                  maximumNucleotideIndexInclusive
                }
              ]
            }
          }}
          rnaComplexProps = {this.rnaComplexProps}
          setNucleotideKeysToRerender = {this.setNucleotideKeysToRerender}
        />;
        break;
      }
      default : {
        throw "Unhandled switch case.";
      }
    }
    return <>
      {header}
      {menu}
    </>;
  }
}