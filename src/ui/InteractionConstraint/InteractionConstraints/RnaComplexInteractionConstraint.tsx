import { DragListener, FullKeys, FullKeysRecord, RnaComplexProps } from "../../../App";
import { Tab } from "../../../app_data/Tab";
import { compareBasePairKeys } from "../../../components/app_specific/RnaComplex";
import { BasePairsEditor } from "../../../components/app_specific/editors/BasePairsEditor";
import { NucleotideRegionsAnnotateMenu } from "../../../components/app_specific/menus/annotate_menus/NucleotideRegionsAnnotateMenu";
import { RnaComplexInteractionConstraintEditMenu } from "../../../components/app_specific/menus/edit_menus/RnaComplexInteractionConstraintEditMenu";
import { NucleotideKeysToRerender, BasePairKeysToRerender, NucleotideKeysToRerenderPerRnaMolecule } from "../../../context/Context";
import { Vector2D } from "../../../data_structures/Vector2D";
import { parseInteger } from "../../../utils/Utils";
import { AbstractInteractionConstraint } from "../AbstractInteractionConstraint";
import { linearDrag } from "../CommonDragListeners";
import { FilterHelicesMode, InteractionConstraint, iterateOverFreeNucleotidesAndHelicesPerRnaComplex } from "../InteractionConstraints";

export class RnaComplexInteractionConstraint extends AbstractInteractionConstraint {
  private readonly dragListener : DragListener;
  private readonly editMenuProps : RnaComplexInteractionConstraintEditMenu.Props;
  private readonly initialBasePairs : BasePairsEditor.InitialBasePairs;

  public constructor(
    rnaComplexProps : RnaComplexProps,
    fullKeys : FullKeys,
    setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void,
    setBasePairKeysToRerender : (basePairKeysToRerender : BasePairKeysToRerender) => void,
    setDebugVisualElements : (debugVisualElements : Array<JSX.Element>) => void,
    tab : Tab,
    indicesOfFrozenNucleotides : FullKeysRecord
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
    const nucleotideKeysToRerender : NucleotideKeysToRerender = {
      [rnaComplexIndex] : {}
    };
    const nucleotideKeysToRerenderPerRnaComplex = nucleotideKeysToRerender[rnaComplexIndex];
    const basePairKeysToRerender : BasePairKeysToRerender = {
      [rnaComplexIndex] : []
    };
    const basePairKeysToRerenderPerRnaComplex = basePairKeysToRerender[rnaComplexIndex];
    const toBeDragged = new Array<Vector2D>();
    const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
    const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
    for (let rnaMoleculeName of Object.keys(singularRnaComplexProps.rnaMoleculeProps)) {
      nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName] = [];
      const nucleotideKeysToRerenderPerRnaMolecule : NucleotideKeysToRerenderPerRnaMolecule = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName];
      const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
      const basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName];
      const nucleotideIndices = Object.keys(singularRnaMoleculeProps.nucleotideProps).map(parseInteger);
      for (let nucleotideIndex of nucleotideIndices) {
        this.addFullIndices({
          rnaComplexIndex,
          rnaMoleculeName,
          nucleotideIndex
        });
        const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
        toBeDragged.push(singularNucleotideProps);
        nucleotideKeysToRerenderPerRnaMolecule.push(nucleotideIndex);
        if (nucleotideIndex in basePairsPerRnaMolecule) {
          basePairKeysToRerenderPerRnaComplex.push({
            rnaMoleculeName,
            nucleotideIndex
          });
        }
      }
    }
    basePairKeysToRerenderPerRnaComplex.sort(compareBasePairKeys);
    const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
    const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
    function rerender() {
      setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
      setBasePairKeysToRerender(structuredClone(basePairKeysToRerender));
    }
    this.dragListener = linearDrag(
      structuredClone(singularNucleotideProps),
      toBeDragged,
      rerender
    );
    this.editMenuProps = {
      rerender,
      singularRnaComplexProps
    };
    const initialBasePairs : BasePairsEditor.InitialBasePairs = [];
    iterateOverFreeNucleotidesAndHelicesPerRnaComplex(
      rnaComplexIndex,
      singularRnaComplexProps,
      FilterHelicesMode.COMPARE_ALL_KEYS 
    ).helixDataPerRnaMolecules.forEach(function(helixDataPerRnaMolecule) {
      const rnaMoleculeName0 = helixDataPerRnaMolecule.rnaMoleculeName0;
      const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
      initialBasePairs.push(...helixDataPerRnaMolecule.helixData.map(function(helixDatum) {
        const rnaMoleculeName1 = helixDatum.rnaMoleculeName1;
        const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
        return {
          rnaComplexIndex,
          rnaMoleculeName0,
          rnaMoleculeName1,
          nucleotideIndex0 : helixDatum.start[0] + singularRnaMoleculeProps0.firstNucleotideIndex,
          nucleotideIndex1 : Math.max(helixDatum.start[1], helixDatum.stop[1]) + singularRnaMoleculeProps1.firstNucleotideIndex,
          length : Math.abs(helixDatum.start[0] - helixDatum.stop[0]) + 1
        };
      }));
    });
    this.initialBasePairs = initialBasePairs;
  }

  public override drag() {
    return this.dragListener;
  }

  public override createRightClickMenu(tab: InteractionConstraint.SupportedTab) {
    const {
      rnaComplexIndex
    } = this.fullKeys;
    const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
    let header : JSX.Element = <b>
      {tab} RNA complex "{singularRnaComplexProps.name}":
    </b>;
    let menu : JSX.Element;
    switch (tab) {
      case Tab.EDIT : {
        header = <b>
          {tab} RNA complex:
        </b>
        menu = <RnaComplexInteractionConstraintEditMenu.Component
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
              if (rnaComplexIndex !== basePair.rnaComplexIndex) {
                throw `This constraint expects base pairs to be placed within the clicked-on RNA complex. The base pair(s) on line ${i + 1} do not.`;
              }
            }
          }}
        />;
        break;
      }
      case Tab.ANNOTATE : {
        const regions : NucleotideRegionsAnnotateMenu.Regions = {
          [rnaComplexIndex] : {}
        };
        const regionsPerRnaComplex = regions[rnaComplexIndex];

        for (const rnaComplexIndexAsString in this.rnaComplexProps) {
          const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
          const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
          for (const rnaMoleculeName in singularRnaComplexProps.rnaMoleculeProps) {
            regionsPerRnaComplex[rnaMoleculeName] = [];
            const regionsPerRnaMolecule = regionsPerRnaComplex[rnaMoleculeName];
            const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
            let minimumNucleotideIndexInclusive = Number.POSITIVE_INFINITY;
            let maximumNucleotideIndexInclusive = Number.NEGATIVE_INFINITY;
            for (const nucleotideIndexAsString in singularRnaMoleculeProps.nucleotideProps) {
              const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
              if (nucleotideIndex < minimumNucleotideIndexInclusive) {
                minimumNucleotideIndexInclusive = nucleotideIndex;
              }
              if (nucleotideIndex > maximumNucleotideIndexInclusive) {
                maximumNucleotideIndexInclusive = nucleotideIndex;
              }
            }
            regionsPerRnaMolecule.push({
              minimumNucleotideIndexInclusive,
              maximumNucleotideIndexInclusive
            });
          }
        }
        menu = <NucleotideRegionsAnnotateMenu.Component
          regions = {regions}
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
      <br/>
      {menu}
    </>;
  }
}