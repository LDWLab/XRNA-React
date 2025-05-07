import { DragListener, FullKeys, FullKeysRecord, RnaComplexProps } from "../../../App";
import { RnaMoleculeInteractionConstraintEditMenu } from "../../../components/app_specific/menus/edit_menus/RnaMoleculeInteractionConstraintEditMenu";
import { AppSpecificOrientationEditor } from "../../../components/app_specific/editors/AppSpecificOrientationEditor";
import { NucleotideKeysToRerender, BasePairKeysToRerender } from "../../../context/Context";
import { Vector2D } from "../../../data_structures/Vector2D";
import { parseInteger, range, subtractNumbers } from "../../../utils/Utils";
import { AbstractInteractionConstraint, InteractionConstraintError } from "../AbstractInteractionConstraint";
import { linearDrag } from "../CommonDragListeners";
import { InteractionConstraint, iterateOverFreeNucleotidesandHelicesPerRnaMolecule } from "../InteractionConstraints";
import { Tab } from "../../../app_data/Tab";
import { BasePairsEditor } from "../../../components/app_specific/editors/BasePairsEditor";
import { NucleotideRegionsAnnotateMenu } from "../../../components/app_specific/menus/annotate_menus/NucleotideRegionsAnnotateMenu";
import { compareBasePairKeys, selectRelevantBasePairKeys } from "../../../components/app_specific/RnaComplex";

export class RnaMoleculeInteractionConstraint extends AbstractInteractionConstraint {
  private readonly dragListener : DragListener;
  private readonly dragError? : InteractionConstraintError;
  private readonly editMenuProps : RnaMoleculeInteractionConstraintEditMenu.Props;
  private readonly initialBasePairs : BasePairsEditor.InitialBasePairs;

  constructor(
    rnaComplexProps : RnaComplexProps,
    setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void,
    setBasePairKeysToRerender : (basePairKeysToRerender : BasePairKeysToRerender) => void,
    setDebugVisualElements : (debugVisualElements : Array<JSX.Element>) => void,
    tab : Tab,
    indicesOfFrozenNucleotides : FullKeysRecord,
    { treatNoncanonicalBasePairsAsUnpairedFlag } : InteractionConstraint.Options,
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
    const indicesOfFrozenNucleotidesPerRnaComplex = rnaComplexIndex in indicesOfFrozenNucleotides ? indicesOfFrozenNucleotides[rnaComplexIndex] : {};
    const indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule = rnaMoleculeName in indicesOfFrozenNucleotidesPerRnaComplex ? indicesOfFrozenNucleotidesPerRnaComplex[rnaMoleculeName] : new Set<number>();
    for (let nucleotideIndex of nucleotideIndices) {
      this.addFullIndices({
        rnaComplexIndex,
        rnaMoleculeName,
        nucleotideIndex
      });
      if (!indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule.has(nucleotideIndex)) {
        toBeDragged.push(singularRnaMoleculeProps.nucleotideProps[nucleotideIndex]);
        nucleotideKeysToRerenderPerRnaMolecule.push(nucleotideIndex);
      }
      if (nucleotideIndex in basePairsPerRnaMolecule) {
        const basePairsPerNucleotide = basePairsPerRnaMolecule[nucleotideIndex];
        const keys0 = {
          rnaMoleculeName,
          nucleotideIndex
        };
        for (const basePairPerNucleotide of basePairsPerNucleotide) {
          basePairKeysToRerenderPerRnaComplex.push(selectRelevantBasePairKeys(
            keys0,
            basePairPerNucleotide
          ));
        }
        // for (const basePairPerNucleotide of basePairsPerNucleotide) {
        //   if (rnaMoleculeName !== basePairPerNucleotide.rnaMoleculeName) {
        //     this.dragError = {
        //       errorMessage : "A base pair with another RNA molecule was found. Cannot drag the clicked-on RNA molecule."
        //     };
        //     break;
        //   }
        // }
      }
    }
    basePairKeysToRerenderPerRnaComplex.sort(compareBasePairKeys);
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
      rnaComplexIndex : fullKeys0.rnaComplexIndex,
      rnaMoleculeName,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender
    };
    this.initialBasePairs = iterateOverFreeNucleotidesandHelicesPerRnaMolecule(
      singularRnaComplexProps,
      rnaMoleculeName,
      treatNoncanonicalBasePairsAsUnpairedFlag
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
    } = this.fullKeys0;
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
              const errorMessage = `This constraint expects base pairs to involve the clicked-on RNA molecule. The base pair on line #${i + 1} does not.`;
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
        const indicesOfFrozenNucleotidesPerRnaComplex = rnaComplexIndex in this.indicesOfFrozenNucleotides ? this.indicesOfFrozenNucleotides[rnaComplexIndex] : {};
        const indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule = rnaMoleculeName in indicesOfFrozenNucleotidesPerRnaComplex ? indicesOfFrozenNucleotidesPerRnaComplex[rnaMoleculeName] : new Set<number>();
        const regionsPerRnaMolecule : NucleotideRegionsAnnotateMenu.RegionsPerRnaMolecule = [];
        NucleotideRegionsAnnotateMenu.populateRegions(
          indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule,
          range(
            maximumNucleotideIndexInclusive + 1,
            0
          ),
          regionsPerRnaMolecule
        );
        menu = <NucleotideRegionsAnnotateMenu.Component
          regions = {{
            [rnaComplexIndex] : {
              [rnaMoleculeName] : regionsPerRnaMolecule
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