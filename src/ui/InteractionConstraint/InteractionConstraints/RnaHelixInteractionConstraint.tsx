import { RnaComplexProps, FullKeys, DragListener } from "../../../App";
import { Nucleotide } from "../../../components/app_specific/Nucleotide";
import { compareBasePairKeys, selectRelevantBasePairKeys } from "../../../components/app_specific/RnaComplex";
import { BasePairKeysToRerender, BasePairKeysToRerenderPerRnaComplex, NucleotideKeysToRerender, NucleotideKeysToRerenderPerRnaComplex, NucleotideKeysToRerenderPerRnaMolecule } from "../../../context/Context";
import { linearDrag } from "../CommonDragListeners";
import { AbstractInteractionConstraint, nonBasePairedNucleotideError, nonBasePairedNucleotideErrorMessage } from "../AbstractInteractionConstraint";
import { Extrema, InteractionConstraint, calculateExtremaMagnitudeDifference, checkExtremaForSingleStrand, populateToBeDraggedWithHelix } from "../InteractionConstraints";
import { parseInteger, subtractNumbers } from "../../../utils/Utils";
import { scaleUp, add, orthogonalizeLeft, subtract, asAngle, Vector2D } from "../../../data_structures/Vector2D";
import { AppSpecificOrientationEditor } from "../../../components/app_specific/editors/AppSpecificOrientationEditor";
import { Tab } from "../../../app_data/Tab";
import { BasePairsEditor } from "../../../components/app_specific/editors/BasePairsEditor";
import { NucleotideRegionsAnnotateMenu } from "../../../components/app_specific/menus/annotate_menus/NucleotideRegionsAnnotateMenu";
import { AllInOneEditor } from "./AllInOneEditor";
import { BLACK, areEqual } from "../../../data_structures/Color";

export class RnaHelixInteractionConstraint extends AbstractInteractionConstraint {
  private readonly dragListener : DragListener;
  private readonly partialHeader : JSX.Element;
  private readonly editMenuProps : AllInOneEditor.SimplifiedProps;
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
    const rnaMoleculeName0 = rnaMoleculeName;
    const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
    const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
    const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
    const singularNucleotideProps0 = singularRnaMoleculeProps0.nucleotideProps[nucleotideIndex];
    if (!(rnaMoleculeName0 in basePairsPerRnaComplex)) {
      throw nonBasePairedNucleotideError;
    }
    const basePairsPerRnaMolecule0 = basePairsPerRnaComplex[rnaMoleculeName0];
    if (!(nucleotideIndex in basePairsPerRnaMolecule0)) {
      throw nonBasePairedNucleotideError;
    }
    const originalMappedBasePairInformation = basePairsPerRnaMolecule0[nucleotideIndex];
    const rnaMoleculeName1 = originalMappedBasePairInformation.rnaMoleculeName;
    const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
    const singularNucleotideProps1 = singularRnaMoleculeProps1.nucleotideProps[originalMappedBasePairInformation.nucleotideIndex];
    const allNucleotides = new Array<Nucleotide.ExternalProps>();
    const nucleotideKeysToRerenderPerRnaComplex : NucleotideKeysToRerenderPerRnaComplex = {
      [rnaMoleculeName0] : [],
      [rnaMoleculeName1] : []
    };
    const nucleotideKeysToRerenderPerRnaMolecule0 = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName0];
    const nucleotideKeysToRerenderPerRnaMolecule1 = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName1];
    nucleotideKeysToRerenderPerRnaMolecule0.push(nucleotideIndex);
    nucleotideKeysToRerenderPerRnaMolecule1.push(originalMappedBasePairInformation.nucleotideIndex);
    const nucleotideKeysToRerender : NucleotideKeysToRerender = {
      [rnaComplexIndex] : nucleotideKeysToRerenderPerRnaComplex
    };
    const basePairKeysToRerender : BasePairKeysToRerender = {
      [rnaComplexIndex] : []
    };
    const basePairKeysToRerenderPerRnaComplex = basePairKeysToRerender[rnaComplexIndex];
    basePairKeysToRerenderPerRnaComplex.push(selectRelevantBasePairKeys(
      {
        rnaMoleculeName : rnaMoleculeName0,
        nucleotideIndex : nucleotideIndex
      },
      {
        rnaMoleculeName : rnaMoleculeName1,
        nucleotideIndex : originalMappedBasePairInformation.nucleotideIndex
      }
    ));
    const nucleotideIndex0 = nucleotideIndex;
    const nucleotideIndex1 = originalMappedBasePairInformation.nucleotideIndex;
    const extrema0 = populateToBeDraggedWithHelix(
      -1,
      nucleotideIndex0,
      nucleotideIndex1,
      basePairsPerRnaMolecule0,
      rnaMoleculeName0,
      rnaMoleculeName1,
      allNucleotides,
      singularRnaMoleculeProps0,
      singularRnaMoleculeProps1,
      nucleotideKeysToRerenderPerRnaMolecule0,
      nucleotideKeysToRerenderPerRnaMolecule1,
      basePairKeysToRerenderPerRnaComplex
    ).extrema;
    const extrema1 = populateToBeDraggedWithHelix(
      1,
      nucleotideIndex0,
      nucleotideIndex1,
      basePairsPerRnaMolecule0,
      rnaMoleculeName0,
      rnaMoleculeName1,
      allNucleotides,
      singularRnaMoleculeProps0,
      singularRnaMoleculeProps1,
      nucleotideKeysToRerenderPerRnaMolecule0,
      nucleotideKeysToRerenderPerRnaMolecule1,
      basePairKeysToRerenderPerRnaComplex,
      false
    ).extrema;
    if (rnaMoleculeName0 === rnaMoleculeName1) {
      const extremaMagnitudeDifference = calculateExtremaMagnitudeDifference(extrema0, extrema1);
      // Check whether the helix strands are oriented in parallel (as compared to anti-parallel).
      if (extremaMagnitudeDifference === 0) {
        checkExtremaForSingleStrand(
          extrema0,
          basePairsPerRnaMolecule0,
          allNucleotides,
          singularRnaMoleculeProps0,
          nucleotideKeysToRerenderPerRnaMolecule0
        );
        if (extrema0[0] !== extrema1[0]) {
          // This check removes duplicates from toBeDragged.
          checkExtremaForSingleStrand(
            extrema1,
            basePairsPerRnaMolecule0,
            allNucleotides,
            singularRnaMoleculeProps0,
            nucleotideKeysToRerenderPerRnaMolecule0
          );
        }
      } else if (extremaMagnitudeDifference < 0) {
        checkExtremaForSingleStrand(
          extrema0,
          basePairsPerRnaMolecule0,
          allNucleotides,
          singularRnaMoleculeProps0,
          nucleotideKeysToRerenderPerRnaMolecule0
        );
      } else {
        checkExtremaForSingleStrand(
          extrema1,
          basePairsPerRnaMolecule0,
          allNucleotides,
          singularRnaMoleculeProps0,
          nucleotideKeysToRerenderPerRnaMolecule0
        );
      }
    }
    nucleotideKeysToRerenderPerRnaMolecule0.sort(subtractNumbers);
    nucleotideKeysToRerenderPerRnaMolecule1.sort(subtractNumbers);
    basePairKeysToRerenderPerRnaComplex.sort(compareBasePairKeys);
    function rerender() {
      setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
      setBasePairKeysToRerender(structuredClone(basePairKeysToRerender));
    }
    this.dragListener = linearDrag(
      {
        x : singularNucleotideProps0.x,
        y : singularNucleotideProps0.y
      },
      allNucleotides,
      rerender
    );
    const nucleotideRange0Text = `Nucleotides [${extrema0[0] + singularRnaMoleculeProps0.firstNucleotideIndex}, ${extrema1[0] + singularRnaMoleculeProps0.firstNucleotideIndex}]`;
    const nucleotideRange1Text = `Nucleotides [${extrema0[1] + singularRnaMoleculeProps1.firstNucleotideIndex}, ${extrema1[1] + singularRnaMoleculeProps1.firstNucleotideIndex}]`;
    let nucleotideAndRnaMoleculeJsx : JSX.Element;
    if (rnaMoleculeName0 === rnaMoleculeName1) {
      nucleotideAndRnaMoleculeJsx = <>
        {nucleotideRange0Text}
        <br/>
        Contiguously bound to
        <br/>
        {nucleotideRange1Text}
        <br/>
        In RNA molecule "{rnaMoleculeName0}"
      </>;
    } else {
      nucleotideAndRnaMoleculeJsx = <>
        {nucleotideRange0Text}
        <br/>
        In RNA molecule "{rnaMoleculeName0}"
        <br/>
        {nucleotideRange1Text}
        <br/>
        In RNA molecule "{rnaMoleculeName1}"
      </>;
    }
    let boundingNucleotide0 : Vector2D;
    let boundingNucleotide1 : Vector2D;
    if (rnaMoleculeName0 === rnaMoleculeName1) {
      let boundingNucleotideIndex0 = Math.min(
        extrema0[0],
        extrema0[1],
        extrema1[0],
        extrema1[1]
      );
      let boundingNucleotideIndex1 : number;
      switch (boundingNucleotideIndex0) {
        case extrema0[0] : {
          boundingNucleotideIndex1 = extrema0[1];
          break;
        }
        case extrema0[1] : {
          boundingNucleotideIndex1 = extrema0[0];
          break;
        }
        case extrema1[0] : {
          boundingNucleotideIndex1 = extrema1[1];
          break;
        }
        case extrema1[1] : {
          boundingNucleotideIndex1 = extrema1[0];
          break;
        }
        default : {
          throw "This condition should be impossible.";
        }
      }
      boundingNucleotide0 = singularRnaMoleculeProps0.nucleotideProps[boundingNucleotideIndex0];
      boundingNucleotide1 = singularRnaMoleculeProps0.nucleotideProps[boundingNucleotideIndex1];
    } else {
      boundingNucleotide0 = singularNucleotideProps0;
      boundingNucleotide1 = singularNucleotideProps1;
    }
    const boundingCenter = scaleUp(
      add(
        boundingNucleotide0,
        boundingNucleotide1
      ),
      0.5
    );
    const normalVector = orthogonalizeLeft(subtract(
      boundingNucleotide1,
      boundingNucleotide0
    ));
    this.partialHeader = <>
      <br/>
      {nucleotideAndRnaMoleculeJsx}
      <br/>
      In RNA complex "{singularRnaComplexProps.name}"
      <br/>
    </>;
    let singleColorFlag = true;
    const singleColorCandidate = allNucleotides[0].color ?? BLACK;
    for (let i = 1; i < allNucleotides.length; i++) {
      if (!areEqual(
        singleColorCandidate,
        allNucleotides[i].color ?? BLACK
      )) {
        singleColorFlag = false;
        break;
      }
    }
    this.editMenuProps = {
      positions : allNucleotides,
      onUpdatePositions : rerender,
      boundingVector0 : boundingNucleotide0,
      boundingVector1 : boundingNucleotide1
    };
    // this.editMenuProps = {
    //   initialCenter : boundingCenter,
    //   positions : toBeDragged,
    //   onUpdatePositions : rerender,
    //   normal : normalVector,
    //   initialAngle : asAngle(normalVector)
    // };
    const initialBasePair : BasePairsEditor.BasePair = {
      rnaComplexIndex,
      rnaMoleculeName0,
      rnaMoleculeName1,
      nucleotideIndex0 : Math.min(extrema0[0], extrema1[0]) + singularRnaMoleculeProps0.firstNucleotideIndex,
      nucleotideIndex1 : Math.max(extrema0[1], extrema1[1]) + singularRnaMoleculeProps1.firstNucleotideIndex,
      length : extrema1[0] - extrema0[0] + 1,
    };
    this.initialBasePairs = [initialBasePair];
    this.addFullIndicesPerNucleotideKeysToRerender(nucleotideKeysToRerender);
  }

  public override drag() {
    return this.dragListener;
  }

  public override createRightClickMenu(tab : InteractionConstraint.SupportedTab) {
    const {
      rnaComplexIndex,
      rnaMoleculeName
    } = this.fullKeys;
    let menu : JSX.Element;
    const header = <>
      <b>
        {tab} helix:
      </b>
      {this.partialHeader}
    </>;
    switch (tab) {
      case Tab.EDIT : {
        menu = <>
          <AllInOneEditor.Simplified
            {...this.editMenuProps}
          />
        </>;
        break;
      }
      case Tab.FORMAT : {
        menu = <BasePairsEditor.Component
          rnaComplexProps = {this.rnaComplexProps}
          approveBasePairs = {function(basePairs : Array<BasePairsEditor.BasePair>) {
            // Do nothing.
          }}
          initialBasePairs = {this.initialBasePairs}
          defaultRnaComplexIndex = {rnaComplexIndex}
          defaultRnaMoleculeName0 = {rnaMoleculeName}
          defaultRnaMoleculeName1 = {rnaMoleculeName}
        />;
        break;
      }
      case Tab.ANNOTATE : {
        const initialBasePairs0 = this.initialBasePairs[0];
        const {
          rnaMoleculeName0,
          rnaMoleculeName1,
          nucleotideIndex0,
          nucleotideIndex1,
          length
        } = initialBasePairs0 as Required<BasePairsEditor.BasePair>;
        const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
        const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
        const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
        let regions : NucleotideRegionsAnnotateMenu.Regions;
        const minimumNucleotideIndexInclusive0 = nucleotideIndex0 - singularRnaMoleculeProps0.firstNucleotideIndex;
        const maximumNucleotideIndexInclusive1 = nucleotideIndex1 - singularRnaMoleculeProps1.firstNucleotideIndex;
        const region0 = {
          minimumNucleotideIndexInclusive : minimumNucleotideIndexInclusive0,
          maximumNucleotideIndexInclusive : minimumNucleotideIndexInclusive0 + length - 1
        };
        const region1 = {
          minimumNucleotideIndexInclusive : maximumNucleotideIndexInclusive1 - length + 1,
          maximumNucleotideIndexInclusive : maximumNucleotideIndexInclusive1
        };
        if (rnaMoleculeName0 === rnaMoleculeName1) {
          regions = {
            [rnaComplexIndex] : {
              [rnaMoleculeName0] : [
                region0,
                region1
              ]
            }
          };
        } else {
          regions = {
            [rnaComplexIndex] : {
              [rnaMoleculeName0] : [region0],
              [rnaMoleculeName1] : [region1]
            }
          };
        }
        menu = <NucleotideRegionsAnnotateMenu.Component
          regions = {regions}
          rnaComplexProps = {this.rnaComplexProps}
          setNucleotideKeysToRerender = {this.setNucleotideKeysToRerender}
        />;
        break;
      }
      default : {
        throw "Unrecognized Tab";
      }
    }
    return <>
      {header}
      {menu}
    </>
  }
}