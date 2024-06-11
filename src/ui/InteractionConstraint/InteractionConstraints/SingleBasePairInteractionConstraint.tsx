import { RnaComplex, compareBasePairKeys, selectRelevantBasePairKeys } from "../../../components/app_specific/RnaComplex";
import { NucleotideKeysToRerender, BasePairKeysToRerender, NucleotideKeysToRerenderPerRnaMolecule } from "../../../context/Context";
import { linearDrag } from "../CommonDragListeners";
import { AbstractInteractionConstraint, InteractionConstraintError, nonBasePairedNucleotideError } from "../AbstractInteractionConstraint";
import { InteractionConstraint } from "../InteractionConstraints";
import { RnaComplexProps, FullKeys, DragListener, FullKeysRecord } from "../../../App";
import { SingleBasePairInteractionConstraintEditMenu } from "../../../components/app_specific/menus/edit_menus/SingleBasePairinteractionConstraintEditMenu";
import BasePair, { getBasePairType } from "../../../components/app_specific/BasePair";
import { Vector2D, orthogonalizeLeft } from "../../../data_structures/Vector2D";
import { Tab } from "../../../app_data/Tab";
import { BasePairsEditor } from "../../../components/app_specific/editors/BasePairsEditor";
import { range } from "../../../utils/Utils";
import { NucleotideRegionsAnnotateMenu } from "../../../components/app_specific/menus/annotate_menus/NucleotideRegionsAnnotateMenu";
import { BLACK, areEqual } from "../../../data_structures/Color";
import Font from "../../../data_structures/Font";

export class SingleBasePairInteractionConstraint extends AbstractInteractionConstraint {
  private dragListener : DragListener;
  private editMenuProps : SingleBasePairInteractionConstraintEditMenu.Props;
  private partialHeader : JSX.Element;
  private initialBasePairs : BasePairsEditor.InitialBasePairs;
  private basePairedKeys : {
    rnaMoleculeName : string,
    nucleotideIndex : number
  };
  private nucleotideIndices : {
    rnaMoleculeName0 : string,
    nucleotideIndex0 : number,
    rnaMoleculeName1 : string
    nucleotideIndex1 : number
  }
  private readonly frozenFlag0 : boolean = false;
  private readonly frozenFlag1 : boolean = false;
  private readonly hairpinLoopFlag : boolean = false;
  private readonly indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule0 : Set<number>;

  constructor(
    rnaComplexProps : RnaComplexProps,
    fullKeys : FullKeys,
    setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void,
    setBasePairKeysToRerender : (basePairKeysToRerender : BasePairKeysToRerender) => void,
    setDebugVisualElements : (debugVisualElements : Array<JSX.Element>) => void,
    tab : Tab,
    indicesOfFrozenNucleotides : FullKeysRecord,
    { affectHairpinNucleotidesFlag } : InteractionConstraint.Options
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
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex
    } = this.fullKeys;
    const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
    const {
      basePairs
    } = singularRnaComplexProps;
    if (!(rnaMoleculeName in basePairs && nucleotideIndex in basePairs[rnaMoleculeName])) {
      throw nonBasePairedNucleotideError;
    }
    const basePairKeys = {
      rnaMoleculeName,
      nucleotideIndex
    };
    const mappedBasePair = basePairs[rnaMoleculeName][nucleotideIndex];
    const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
    const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
    const basePairedSingularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[mappedBasePair.rnaMoleculeName];
    const basePairedSingularNucleotideProps = basePairedSingularRnaMoleculeProps.nucleotideProps[mappedBasePair.nucleotideIndex];
    let lesserKeys : RnaComplex.BasePairKeys;
    let greaterKeys : RnaComplex.BasePairKeys;
    if (compareBasePairKeys(basePairKeys, mappedBasePair) <= 0) {
      lesserKeys = basePairKeys;
      greaterKeys = mappedBasePair;
    } else {
      lesserKeys = mappedBasePair;
      greaterKeys = basePairKeys;
    }
    basePairKeysToRerender[rnaComplexIndex] = [
      lesserKeys
    ];
    const basePairKeysToRerenderPerRnaComplex = basePairKeysToRerender[rnaComplexIndex];
    const initialDrag = {
      x : singularNucleotideProps.x,
      y : singularNucleotideProps.y
    };
    const nucleotideIndex0 = nucleotideIndex;
    const nucleotideIndex1 = mappedBasePair.nucleotideIndex;
    const rnaMoleculeName0 = rnaMoleculeName;
    const rnaMoleculeName1 = mappedBasePair.rnaMoleculeName;
    this.indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule0 = new Set<number>();
    if (rnaComplexIndex in indicesOfFrozenNucleotides) {
      const indicesOfFrozenNucleotidesPerRnaComplex = indicesOfFrozenNucleotides[rnaComplexIndex];
      if (rnaMoleculeName0 in indicesOfFrozenNucleotidesPerRnaComplex) {
        this.indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule0 = indicesOfFrozenNucleotidesPerRnaComplex[rnaMoleculeName0];
        this.frozenFlag0 = this.indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule0.has(nucleotideIndex0);
      }
      if (rnaMoleculeName1 in indicesOfFrozenNucleotidesPerRnaComplex) {
        const indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule1 = indicesOfFrozenNucleotidesPerRnaComplex[rnaMoleculeName1];
        this.frozenFlag1 = indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule1.has(nucleotideIndex1);
      }
    }
    const allNucleotides = [];
    if (!this.frozenFlag0) {
      allNucleotides.push(singularNucleotideProps);
    }
    if (!this.frozenFlag1) {
      allNucleotides.push(basePairedSingularNucleotideProps);
    }
    this.nucleotideIndices = {
      rnaMoleculeName0,
      nucleotideIndex0,
      rnaMoleculeName1,
      nucleotideIndex1
    };
    const basePairsPerRnaMolecule0 = basePairs[rnaMoleculeName0];
    // for (const nucleotideIndex0IncrementOrDecrement of [-1, 1]) {
    //   const incrementedOrDecrementedNucleotideIndex0 = nucleotideIndex0 + nucleotideIndex0IncrementOrDecrement;
    //   if (incrementedOrDecrementedNucleotideIndex0 in basePairsPerRnaMolecule0) {
    //     const mappedBasePairInformation = basePairsPerRnaMolecule0[incrementedOrDecrementedNucleotideIndex0];
    //     const {
    //       rnaMoleculeName,
    //       nucleotideIndex
    //     } = mappedBasePairInformation;
    //     if (rnaMoleculeName === rnaMoleculeName1 && Math.abs(nucleotideIndex - nucleotideIndex1) === 1) {
    //       const error : InteractionConstraintError = {
    //         errorMessage : "Cannot interact with a single base pair that is part of a larger helix."
    //       };
    //       throw error;
    //     }
    //   }
    // }
    if (rnaMoleculeName0 === rnaMoleculeName1) {
      const nucleotideKeysToRerenderPerRnaMolecule : NucleotideKeysToRerenderPerRnaMolecule = [];
      nucleotideKeysToRerender[rnaComplexIndex] = {
        [rnaMoleculeName] : nucleotideKeysToRerenderPerRnaMolecule
      }
      nucleotideKeysToRerenderPerRnaMolecule.push(lesserKeys.nucleotideIndex);
      this.hairpinLoopFlag = true;
      const temporaryNucleotideData = [];
      for (let nucleotideIndex = lesserKeys.nucleotideIndex + 1; nucleotideIndex < greaterKeys.nucleotideIndex; nucleotideIndex++) {
        if (nucleotideIndex in basePairsPerRnaMolecule0) {
          this.hairpinLoopFlag = false;
          break;
        }
        temporaryNucleotideData.push({
          index : nucleotideIndex,
          props : singularRnaMoleculeProps.nucleotideProps[nucleotideIndex]
        });
      }
      this.hairpinLoopFlag &&= affectHairpinNucleotidesFlag;
      if (this.hairpinLoopFlag) {
        for (const {
          index,
          props
        } of temporaryNucleotideData) {
          this.addFullIndices({
            rnaComplexIndex,
            rnaMoleculeName,
            nucleotideIndex : index
          });
          if (!(this.indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule0.has(index))) {
            nucleotideKeysToRerenderPerRnaMolecule.push(index);
            allNucleotides.push(props);
          }
        }
      }
      // for (let nucleotideIndex = lesserKeys.nucleotideIndex + 1; nucleotideIndex < greaterKeys.nucleotideIndex; nucleotideIndex++) {
      //   if (nucleotideIndex in singularRnaMoleculeProps.nucleotideProps) {
      //     nucleotideKeysToRerenderPerRnaMolecule.push(nucleotideIndex);
      //     allNucleotides.push(singularRnaMoleculeProps.nucleotideProps[nucleotideIndex]);
      //   }
      //   if (nucleotideIndex in basePairsPerRnaMolecule0) {
      //     const basePairKeys0 = {
      //       rnaMoleculeName : rnaMoleculeName0,
      //       nucleotideIndex : nucleotideIndex
      //     };
      //     const mappedBasePairInformation = basePairsPerRnaMolecule0[nucleotideIndex];
      //     const basePairKeys1 = {
      //       rnaMoleculeName : mappedBasePairInformation.rnaMoleculeName,
      //       nucleotideIndex : mappedBasePairInformation.nucleotideIndex
      //     };
      //     basePairKeysToRerenderPerRnaComplex.push(selectRelevantBasePairKeys(
      //       basePairKeys0,
      //       basePairKeys1
      //     ));
      //   }
      // }
      nucleotideKeysToRerenderPerRnaMolecule.push(greaterKeys.nucleotideIndex);
    }
    function rerender() {
      setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
      setBasePairKeysToRerender(structuredClone(basePairKeysToRerender));
    };
    const boundingNucleotides = [
      singularNucleotideProps,
      basePairedSingularNucleotideProps
    ];
    this.dragListener = affectHairpinNucleotidesFlag ? linearDrag(
      initialDrag,
      allNucleotides,
      rerender
    ) : linearDrag(
      initialDrag,
      [
        singularNucleotideProps,
        basePairedSingularNucleotideProps
      ],
      rerender
    );
    this.partialHeader = <>
      Nucleotide #{nucleotideIndex + basePairedSingularRnaMoleculeProps.firstNucleotideIndex} ({singularNucleotideProps.symbol})
      <br/>
      In RNA molecule "{rnaMoleculeName}"
      <br/>
      Base-paired to:
      <br/>
      Nucleotide #{mappedBasePair.nucleotideIndex + basePairedSingularRnaMoleculeProps.firstNucleotideIndex} ({basePairedSingularNucleotideProps.symbol})
      <br/>
      In RNA molecule "{mappedBasePair.rnaMoleculeName}"
      <br/>
      In RNA complex "{singularRnaComplexProps.name}"
      <br/>
    </>;
    let boundingVector0 : Vector2D;
    let boundingVector1 : Vector2D;
    if (rnaMoleculeName0 === rnaMoleculeName1) {
      let lesserNucleotideIndex;
      let greaterNucleotideIndex;
      if (nucleotideIndex0 < nucleotideIndex1) {
        lesserNucleotideIndex = nucleotideIndex0;
        greaterNucleotideIndex = nucleotideIndex1;
      } else {
        lesserNucleotideIndex = nucleotideIndex1;
        greaterNucleotideIndex = nucleotideIndex0;
      }
      boundingVector0 = singularRnaMoleculeProps.nucleotideProps[lesserNucleotideIndex];
      boundingVector1 = singularRnaMoleculeProps.nucleotideProps[greaterNucleotideIndex];
    } else {
      boundingVector0 = singularNucleotideProps;
      boundingVector1 = basePairedSingularNucleotideProps;
    }
    const basePairType = mappedBasePair.basePairType ?? getBasePairType(
      singularNucleotideProps.symbol,
      basePairedSingularNucleotideProps.symbol
    );
    const color0 = singularNucleotideProps.color ?? BLACK;
    const color1 = basePairedSingularNucleotideProps.color ?? BLACK;

    const font0 = singularNucleotideProps.font ?? Font.DEFAULT;
    const font1 = basePairedSingularNucleotideProps.font ?? Font.DEFAULT;

    this.editMenuProps = {
      boundingVector0,
      boundingVector1,
      positions : allNucleotides,
      onUpdatePositions : rerender,
      orthogonalizeHelper : orthogonalizeLeft,
      basePairType,
      initialColor : areEqual(color0, color1) ? color0 : BLACK,
      initialFont : Font.areEqual(font0, font1) ? font0 : Font.DEFAULT,
      boundingNucleotides,
      allNucleotides
    };
    this.initialBasePairs = [{
      rnaComplexIndex,
      rnaMoleculeName0,
      rnaMoleculeName1,
      nucleotideIndex0 : nucleotideIndex0 + singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0].firstNucleotideIndex,
      nucleotideIndex1 : nucleotideIndex1 + singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1].firstNucleotideIndex,
      length : 1,
      type : basePairType
    }];
    this.basePairedKeys = {
      rnaMoleculeName : rnaMoleculeName1,
      nucleotideIndex : nucleotideIndex1
    }
    this.addFullIndices(
      fullKeys,
      {
        rnaComplexIndex,
        ...mappedBasePair
      }
    );
  }

  public override drag() {
    return this.dragListener;
  }

  public override createRightClickMenu(tab : InteractionConstraint.SupportedTab) {
    const {
      rnaComplexIndex,
      rnaMoleculeName
    } = this.fullKeys;
    const fullKeys = this.fullKeys;
    const basePairedKeys = this.basePairedKeys;
    const nucleotideIndices = this.nucleotideIndices;
    let menu : JSX.Element = <></>;
    switch (tab) {
      case Tab.EDIT : {
        menu = <SingleBasePairInteractionConstraintEditMenu.Component
          {...this.editMenuProps}
        />;
        break;
      }
      case Tab.FORMAT : {
        menu = <BasePairsEditor.Component
          rnaComplexProps = {this.rnaComplexProps}
          initialBasePairs = {this.initialBasePairs}
          approveBasePairs = {function(parsedBasePairs : Array<BasePairsEditor.BasePair>) {
            if (parsedBasePairs.length > 1) {
              throw "This constraint expects at most one base pair.";
            }
            if (parsedBasePairs.length === 1) {
              const parsedBasePair = parsedBasePairs[0];
              if (parsedBasePair.length > 1) {
                throw "This constraint expects at most one base pair.";
              }
              // for (let {rnaMoleculeName, nucleotideIndex} of [fullKeys, basePairedKeys]) {
              //   if (
              //     (rnaMoleculeName !== parsedBasePair.rnaMoleculeName0 || nucleotideIndex !== parsedBasePair.nucleotideIndex0) &&
              //     (rnaMoleculeName !== parsedBasePair.rnaMoleculeName1 || nucleotideIndex !== parsedBasePair.nucleotideIndex1)
              //   ) {
              //     throw "This constraint expects a base pair strictly between the original nucleotides.";
              //   }
              // }
            }
          }}
          defaultRnaComplexIndex = {rnaComplexIndex}
          defaultRnaMoleculeName0 = {rnaMoleculeName}
          defaultRnaMoleculeName1 = {rnaMoleculeName}
        />;
        break;
      }
      case Tab.ANNOTATE : {
        let regions : NucleotideRegionsAnnotateMenu.Regions;
        const region0 = {
          minimumNucleotideIndexInclusive : nucleotideIndices.nucleotideIndex0,
          maximumNucleotideIndexInclusive : nucleotideIndices.nucleotideIndex0
        };
        const region1 = {
          minimumNucleotideIndexInclusive : nucleotideIndices.nucleotideIndex1,
          maximumNucleotideIndexInclusive : nucleotideIndices.nucleotideIndex1
        };
        if (nucleotideIndices.rnaMoleculeName0 === nucleotideIndices.rnaMoleculeName1) {
          const regionsPerRnaMolecule : NucleotideRegionsAnnotateMenu.RegionsPerRnaMolecule = [];
          const minimumNucleotideIndex = Math.min(
            nucleotideIndices.nucleotideIndex0,
            nucleotideIndices.nucleotideIndex1
          );
          const maximumNucleotideIndex = Math.max(
            nucleotideIndices.nucleotideIndex0,
            nucleotideIndices.nucleotideIndex1
          );
          if (this.hairpinLoopFlag) {
            NucleotideRegionsAnnotateMenu.populateRegions(
              this.indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule0,
              range(
                maximumNucleotideIndex + 1,
                minimumNucleotideIndex
              ),
              regionsPerRnaMolecule
            );
          } else {
            if (!this.frozenFlag0) {
              regionsPerRnaMolecule.push(region0);
            }
            if (!this.frozenFlag1) {
              regionsPerRnaMolecule.push(region1);
            }
          }
          regions = {
            [rnaComplexIndex] : {
              [nucleotideIndices.rnaMoleculeName0] : regionsPerRnaMolecule
            }
          };
        } else {
          const regionsPerRnaComplex : NucleotideRegionsAnnotateMenu.RegionsPerRnaComplex = {};
          if (!this.frozenFlag0) {
            regionsPerRnaComplex[nucleotideIndices.rnaMoleculeName0] = [region0];
          }
          if (!this.frozenFlag1) {
            regionsPerRnaComplex[nucleotideIndices.rnaMoleculeName1] = [region1];
          }
          regions = {
            [rnaComplexIndex] : regionsPerRnaComplex
          };
        }
        menu = <NucleotideRegionsAnnotateMenu.Component
          regions = {regions}
          rnaComplexProps = {this.rnaComplexProps}
          setNucleotideKeysToRerender = {this.setNucleotideKeysToRerender}
        />
        break;
      }
    }
    return <>
      <b>
        {tab} single base pair:
      </b>
      <br/>
      {this.partialHeader}
      {menu}
    </>;
  }
}