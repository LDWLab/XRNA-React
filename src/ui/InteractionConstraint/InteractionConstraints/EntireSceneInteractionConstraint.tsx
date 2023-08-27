import { RnaComplexProps, FullKeys, DragListener } from "../../../App";
import { Tab } from "../../../app_data/Tab";
import { BasePairsEditor } from "../../../components/app_specific/editors/BasePairsEditor";
import { EntireSceneInteractionConstraintEditMenu } from "../../../components/app_specific/menus/edit_menus/EntireSceneInteractionConstraintEditMenu";
import { NucleotideKeysToRerender, BasePairKeysToRerender } from "../../../context/Context";
import { AbstractInteractionConstraint } from "../AbstractInteractionConstraint";
import { FilterHelicesMode, InteractionConstraint, iterateOverFreeNucleotidesAndHelicesPerRnaComplex, iterateOverFreeNucleotidesAndHelicesPerScene } from "../InteractionConstraints";

export class EntireSceneInteractionConstraint extends AbstractInteractionConstraint {
  private readonly editMenuProps : EntireSceneInteractionConstraintEditMenu.Props;
  private readonly initialBasePairs : BasePairsEditor.InitialBasePairs;

  public constructor(
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
    const nucleotideKeysToRerender : NucleotideKeysToRerender = {};
    const basePairKeysToRerender : BasePairKeysToRerender = {};
    this.editMenuProps = {
      rnaComplexProps : this.rnaComplexProps,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender
    };
    const initialBasePairs : BasePairsEditor.InitialBasePairs = [];
    iterateOverFreeNucleotidesAndHelicesPerScene(
      rnaComplexProps,
      FilterHelicesMode.COMPARE_ALL_KEYS 
    ).forEach(function(helixDataPerRnaComplex) {
      const rnaComplexIndex = helixDataPerRnaComplex.rnaComplexIndex;
      const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
      helixDataPerRnaComplex.helixDataPerRnaMolecules.forEach(function(helixDataPerRnaMolecule) {
      const rnaMoleculeName0 = helixDataPerRnaMolecule.rnaMoleculeName0;
      const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
      initialBasePairs.push(...helixDataPerRnaMolecule.helixData.map(function(helixDatum) {
        const rnaMoleculeName1 = helixDatum.rnaMoleculeName1;
        const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
        return {
          rnaComplexIndex,
          rnaMoleculeName0,
          rnaMoleculeName1 : helixDatum.rnaMoleculeName1,
          nucleotideIndex0 : helixDatum.start[0] + singularRnaMoleculeProps0.firstNucleotideIndex,
          nucleotideIndex1 : Math.max(helixDatum.start[1], helixDatum.stop[1]) + singularRnaMoleculeProps1.firstNucleotideIndex,
          length : Math.abs(helixDatum.start[0] - helixDatum.stop[0]) + 1
        };
      }));
    })
    });
    this.initialBasePairs = initialBasePairs;
  }

  public override drag() {
    return undefined;
  }

  public override createRightClickMenu(tab : InteractionConstraint.SupportedTab) {
    let menu : JSX.Element;
    switch (tab) {
      case Tab.EDIT : {
        menu = <EntireSceneInteractionConstraintEditMenu.Component
          {...this.editMenuProps}
        />;
        break;
      }
      case Tab.FORMAT : {
        menu = <BasePairsEditor.Component
          rnaComplexProps = {this.rnaComplexProps}
          initialBasePairs = {this.initialBasePairs}
          approveBasePairs = {function(basePairs) {
            // Do nothing.
          }}
        />;
        break;
      }
      default : {
        throw "Unhandled switch case.";
      }
    }
    return <>
      <b>
        {tab} entire scene:
      </b>
      <br/>
      {menu}
    </>;
  }
}