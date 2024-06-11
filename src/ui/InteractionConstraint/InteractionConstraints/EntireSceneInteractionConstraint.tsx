import { RnaComplexProps, FullKeys, DragListener, FullKeysRecord } from "../../../App";
import { Tab } from "../../../app_data/Tab";
import { Nucleotide } from "../../../components/app_specific/Nucleotide";
import { compareBasePairKeys, selectRelevantBasePairKeys } from "../../../components/app_specific/RnaComplex";
import { BasePairsEditor } from "../../../components/app_specific/editors/BasePairsEditor";
import { NucleotideRegionsAnnotateMenu } from "../../../components/app_specific/menus/annotate_menus/NucleotideRegionsAnnotateMenu";
import { EntireSceneInteractionConstraintEditMenu } from "../../../components/app_specific/menus/edit_menus/EntireSceneInteractionConstraintEditMenu";
import { NucleotideKeysToRerender, BasePairKeysToRerender } from "../../../context/Context";
import { subtractNumbers } from "../../../utils/Utils";
import { AbstractInteractionConstraint } from "../AbstractInteractionConstraint";
import { linearDrag } from "../CommonDragListeners";
import { FilterHelicesMode, InteractionConstraint, iterateOverFreeNucleotidesAndHelicesPerRnaComplex, iterateOverFreeNucleotidesAndHelicesPerScene } from "../InteractionConstraints";

export class EntireSceneInteractionConstraint extends AbstractInteractionConstraint {
  private readonly editMenuProps : EntireSceneInteractionConstraintEditMenu.Props;
  private readonly initialBasePairs : BasePairsEditor.InitialBasePairs;
  private readonly dragListener : DragListener;

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
      setDebugVisualElements,
      indicesOfFrozenNucleotides
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
    const allNucleotides = new Array<Nucleotide.ExternalProps>;
    for (const [rnaComplexIndexAsString, {rnaMoleculeProps}] of Object.entries(rnaComplexProps)) {
      const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
      const indicesOfFrozenNucleotidesPerRnaComplex = rnaComplexIndex in indicesOfFrozenNucleotides ? indicesOfFrozenNucleotides[rnaComplexIndex] : {};
      nucleotideKeysToRerender[rnaComplexIndex] = {};
      const nucleotideKeysToRerenderPerRnaComplex = nucleotideKeysToRerender[rnaComplexIndex];
      basePairKeysToRerender[rnaComplexIndex] = [];
      const basePairKeysToRerenderPerRnaComplex = basePairKeysToRerender[rnaComplexIndex];
      const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
      const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
      for (const [rnaMoleculeName, {nucleotideProps}] of Object.entries(rnaMoleculeProps)) {
        const indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule = rnaMoleculeName in indicesOfFrozenNucleotidesPerRnaComplex ? indicesOfFrozenNucleotidesPerRnaComplex[rnaMoleculeName] : new Set<number>();
        nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName] = [];
        const nucleotideKeysToRerenderPerRnaMolecule = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName];
        const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
        const basePairsPerRnaMolecule = rnaMoleculeName in basePairsPerRnaComplex ? basePairsPerRnaComplex[rnaMoleculeName] : {};
        for (const nucleotideIndexAsString of Object.keys(nucleotideProps)) {
          const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
          this.addFullIndices({
            rnaComplexIndex,
            rnaMoleculeName,
            nucleotideIndex
          });
          if (!indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule.has(nucleotideIndex)) {
            nucleotideKeysToRerenderPerRnaMolecule.push(nucleotideIndex);
            const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
            allNucleotides.push(singularNucleotideProps);
          }
          if (nucleotideIndex in basePairsPerRnaMolecule) {
            basePairKeysToRerenderPerRnaComplex.push(selectRelevantBasePairKeys(
              {
                rnaMoleculeName,
                nucleotideIndex
              },
              basePairsPerRnaMolecule[nucleotideIndex]
            ));
          }
        }
      }
    }
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex
    } = fullKeys;
    const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
    const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
    const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
    for (const nucleotideKeysToRerenderPerRnaComplex of Object.values(nucleotideKeysToRerender)) {
      for (const nucleotideKeysToRerenderPerRnaMolecule of Object.values(nucleotideKeysToRerenderPerRnaComplex)) {
        nucleotideKeysToRerenderPerRnaMolecule.sort(subtractNumbers);
      }
    }
    for (const basePairKeysToRerenderPerRnaComplex of Object.values(basePairKeysToRerender)) {
      basePairKeysToRerenderPerRnaComplex.sort(compareBasePairKeys);
    }
    function rerender() {
      setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
      setBasePairKeysToRerender(structuredClone(basePairKeysToRerender));
    }
    this.dragListener = linearDrag(
      {
        x : singularNucleotideProps.x,
        y : singularNucleotideProps.y
      },
      allNucleotides,
      rerender
    );
  }

  public override drag() {
    return this.dragListener;
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
      case Tab.ANNOTATE : {
        const regions : NucleotideRegionsAnnotateMenu.Regions = {};
        for (const rnaComplexIndexAsString in this.rnaComplexProps) {
          const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);

          let indicesOfFrozenNucleotidesPerRnaComplex : Record<string, Set<number>> = {};
          if (rnaComplexIndex in this.indicesOfFrozenNucleotides) {
            indicesOfFrozenNucleotidesPerRnaComplex = this.indicesOfFrozenNucleotides[rnaComplexIndex];
          }

          regions[rnaComplexIndex] = {};
          const regionsPerRnaComplex = regions[rnaComplexIndex];
          const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
          for (const rnaMoleculeName in singularRnaComplexProps.rnaMoleculeProps) {
            regionsPerRnaComplex[rnaMoleculeName] = [];
            const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
            const regionsPerRnaMolecule = regionsPerRnaComplex[rnaMoleculeName];

            let indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule = new Set<number>();
            if (rnaMoleculeName in indicesOfFrozenNucleotidesPerRnaComplex) {
              indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule = indicesOfFrozenNucleotidesPerRnaComplex[rnaMoleculeName];
            }

            const allNucleotideIndices = new Array<number>();
            for (const nucleotideIndexAsString in singularRnaMoleculeProps.nucleotideProps) {
              const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
              allNucleotideIndices.push(nucleotideIndex);
              // if (nucleotideIndex < minimumNucleotideIndexInclusive) {
              //   minimumNucleotideIndexInclusive = nucleotideIndex;
              // }
              // if (nucleotideIndex > maximumNucleotideIndexInclusive) {
              //   maximumNucleotideIndexInclusive = nucleotideIndex;
              // }
            }
            NucleotideRegionsAnnotateMenu.populateRegions(
              indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule,
              allNucleotideIndices,
              regionsPerRnaMolecule
            );
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
      <b>
        {tab} entire scene:
      </b>
      <br/>
      {menu}
    </>;
  }
}