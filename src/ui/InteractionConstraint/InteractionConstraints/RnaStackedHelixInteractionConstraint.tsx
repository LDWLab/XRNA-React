import { RnaComplexProps, FullKeys, DragListener } from "../../../App";
import { Tab } from "../../../app_data/Tab";
import { RnaComplex, compareBasePairKeys } from "../../../components/app_specific/RnaComplex";
import { RnaMolecule } from "../../../components/app_specific/RnaMolecule";
import { AppSpecificOrientationEditor } from "../../../components/app_specific/editors/AppSpecificOrientationEditor";
import { BasePairsEditor } from "../../../components/app_specific/editors/BasePairsEditor";
import { NucleotideRegionsAnnotateMenu } from "../../../components/app_specific/menus/annotate_menus/NucleotideRegionsAnnotateMenu";
import { NucleotideKeysToRerender, BasePairKeysToRerender, BasePairKeysToRerenderPerRnaComplex, NucleotideKeysToRerenderPerRnaMolecule } from "../../../context/Context";
import { Vector2D, add, asAngle, orthogonalizeLeft, scaleUp, subtract } from "../../../data_structures/Vector2D";
import { sign, subtractNumbers } from "../../../utils/Utils";
import { AbstractInteractionConstraint, InteractionConstraintError } from "../AbstractInteractionConstraint";
import { linearDrag } from "../CommonDragListeners";
import { Extrema, InteractionConstraint, HelixData, populateToBeDraggedWithHelix } from "../InteractionConstraints";
import { AllInOneEditor } from "./AllInOneEditor";

export class RnaStackedHelixInteractionConstraint extends AbstractInteractionConstraint {
  private readonly dragListener : DragListener;
  private readonly partialHeader : JSX.Element;
  private readonly editMenuProps : AppSpecificOrientationEditor.SimplifiedProps;
  private readonly initialBasePairs : BasePairsEditor.InitialBasePairs;
  private readonly rnaMoleculeName0 : string;
  private readonly rnaMoleculeName1 : string;

  public constructor(
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
    const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
    const rnaMoleculeName0 = rnaMoleculeName;
    const nucleotideIndex0 = nucleotideIndex;
    if (!(rnaMoleculeName0 in basePairsPerRnaComplex)) {
      const error : InteractionConstraintError = {
        errorMessage : "Cannot interact with a non-base-paired nucleotide using this constraint."
      };
      throw error;
    }
    const basePairsPerRnaMolecule0 = basePairsPerRnaComplex[rnaMoleculeName0];
    if (!(nucleotideIndex0 in basePairsPerRnaMolecule0)) {
      const error : InteractionConstraintError = {
        errorMessage : "Cannot interact with a non-base-paired nucleotide using this constraint."
      };
      throw error;
    }
    const originalMappedBasePairInformation = basePairsPerRnaMolecule0[nucleotideIndex0];
    const rnaMoleculeName1 = originalMappedBasePairInformation.rnaMoleculeName;
    const basePairsPerRnaMolecule1 = basePairsPerRnaComplex[rnaMoleculeName1];
    const nucleotideIndex1 = originalMappedBasePairInformation.nucleotideIndex;
    const toBeDragged = new Array<Vector2D>();
    const nucleotideKeysToRerender : NucleotideKeysToRerender = {
      [rnaComplexIndex] : {
        [rnaMoleculeName0] : [],
        [rnaMoleculeName1] : []
      }
    };
    const nucleotideKeysToRerenderPerRnaComplex = nucleotideKeysToRerender[rnaComplexIndex];
    const nucleotideKeysToRerenderPerRnaMolecule0 = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName0];
    const nucleotideKeysToRerenderPerRnaMolecule1 = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName1];
    const basePairKeysToRerender : BasePairKeysToRerender = {
      [rnaComplexIndex] : []
    };
    const basePairKeysToRerenderPerRnaComplex = basePairKeysToRerender[rnaComplexIndex];
    const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
    const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];

    const helixData : HelixData = [];
    const extremaWithCauseOfTerminationIncremented = populateToBeDraggedWithHelix(
      1,
      nucleotideIndex0,
      nucleotideIndex1,
      basePairsPerRnaMolecule0,
      rnaMoleculeName0,
      rnaMoleculeName1,
      toBeDragged,
      singularRnaMoleculeProps0,
      singularRnaMoleculeProps1,
      nucleotideKeysToRerenderPerRnaMolecule0,
      nucleotideKeysToRerenderPerRnaMolecule1,
      basePairKeysToRerenderPerRnaComplex,
      true,
    );
    const extremaWithCauseOfTerminationDecremented = populateToBeDraggedWithHelix(
      -1,
      nucleotideIndex0,
      nucleotideIndex1,
      basePairsPerRnaMolecule0,
      rnaMoleculeName0,
      rnaMoleculeName1,
      toBeDragged,
      singularRnaMoleculeProps0,
      singularRnaMoleculeProps1,
      nucleotideKeysToRerenderPerRnaMolecule0,
      nucleotideKeysToRerenderPerRnaMolecule1,
      basePairKeysToRerenderPerRnaComplex,
      false,
    );
    let extremaIncremented = extremaWithCauseOfTerminationIncremented.extrema;
    let extremaDecremented = extremaWithCauseOfTerminationDecremented.extrema;
    helixData.push({
      start : extremaDecremented,
      stop : extremaIncremented,
      rnaMoleculeName1
    });
    let nucleotideIndex1Delta = sign(extremaIncremented[1] - extremaDecremented[1]);
    if (nucleotideIndex1Delta === 0) {
      outerLoop: for (let nucleotideIndex0Delta of [-1, 1]) {
        let nucleotideIndex0I = nucleotideIndex0;
        while (true) {
          nucleotideIndex0I += nucleotideIndex0Delta;
          if (!(nucleotideIndex0I in singularRnaMoleculeProps0.nucleotideProps)) {
            continue outerLoop;
          }
          if (nucleotideIndex0I in basePairsPerRnaMolecule0) {
            const mappedBasePairInformation = basePairsPerRnaMolecule0[nucleotideIndex0I];
            if (mappedBasePairInformation.rnaMoleculeName !== rnaMoleculeName1) {
              continue outerLoop;
            }
            const nucleotideIndex1Start = nucleotideIndex1;
            const nucleotideIndex1End = mappedBasePairInformation.nucleotideIndex;
            let minimumNucleotideIndex1 : number;
            let maximumNucleotideIndex1 : number;
            if (nucleotideIndex1Start > nucleotideIndex1End) {
              minimumNucleotideIndex1 = nucleotideIndex1End;
              maximumNucleotideIndex1 = nucleotideIndex1Start;
            } else {
              minimumNucleotideIndex1 = nucleotideIndex1Start;
              maximumNucleotideIndex1 = nucleotideIndex1End;
            }
            let singleStrandFlag = true;
            for (let nucleotideIndex1I = minimumNucleotideIndex1 + 1; nucleotideIndex1I < maximumNucleotideIndex1; nucleotideIndex1I++) {
              if (!(nucleotideIndex1I in singularRnaMoleculeProps0.nucleotideProps) || nucleotideIndex1 in basePairsPerRnaMolecule0) {
                singleStrandFlag = false;
                break;
              }
            }
            if (singleStrandFlag) {
              nucleotideIndex1Delta = (sign(nucleotideIndex1End - nucleotideIndex1Start) * nucleotideIndex0Delta) as -1 | 0 | 1;
            }
            break;
          }
        }
      }
    }

    function populateToBeDragged(
      nucleotideIndex0Delta : -1 | 1,
      nucleotideIndex1Delta : -1 | 1,
      nucleotideIndex0 : number,
      nucleotideIndex1 : number,
      basePairsPerRnaMolecule0 : RnaComplex.BasePairsPerRnaMolecule,
      basePairsPerRnaMolecule1 : RnaComplex.BasePairsPerRnaMolecule,
      rnaMoleculeName0 : string,
      rnaMoleculeName1 : string,
      toBeDragged : Array<Vector2D>,
      singularRnaMoleculeProps0 : RnaMolecule.ExternalProps,
      singularRnaMoleculeProps1 : RnaMolecule.ExternalProps,
      basePairKeysToRerenderPerRnaComplex : BasePairKeysToRerenderPerRnaComplex,
    ) : HelixData {
      const helixData : HelixData = [];
      outer: while (true) {
        let lastBasePairedNucleotideIndex0 = nucleotideIndex0;
        let temporaryNucleotideKeysToRerenderPerRnaMolecule0 : NucleotideKeysToRerenderPerRnaMolecule = [];
        let temporaryNucleotideKeysToRerenderPerRnaMolecule1 : NucleotideKeysToRerenderPerRnaMolecule = [];
        let temporaryToBeDragged0 = new Array<Vector2D>();
        let temporaryToBeDragged1 = new Array<Vector2D>();
        inner: while (true) {
          nucleotideIndex0 += nucleotideIndex0Delta;
          if (!(nucleotideIndex0 in singularRnaMoleculeProps0.nucleotideProps)) {
            break outer;
          }
          const singularNucleotideProps0 = singularRnaMoleculeProps0.nucleotideProps[nucleotideIndex0];
          if (nucleotideIndex0 in basePairsPerRnaMolecule0) {
            break inner;
          }
          temporaryToBeDragged0.push(singularNucleotideProps0);
          temporaryNucleotideKeysToRerenderPerRnaMolecule0.push(nucleotideIndex0);
        }
        inner: while(true) {
          nucleotideIndex1 += nucleotideIndex1Delta;
          if (!(nucleotideIndex1 in singularRnaMoleculeProps1.nucleotideProps)) {
            break outer;
          }
          const singularNucleotideProps1 = singularRnaMoleculeProps1.nucleotideProps[nucleotideIndex1];
          if (nucleotideIndex1 in basePairsPerRnaMolecule1) {
            break inner;
          }
          temporaryToBeDragged1.push(singularNucleotideProps1);
          temporaryNucleotideKeysToRerenderPerRnaMolecule1.push(nucleotideIndex1);
        }
        if (nucleotideIndex1 === lastBasePairedNucleotideIndex0) {
          toBeDragged.push(...temporaryToBeDragged0);
          nucleotideKeysToRerenderPerRnaMolecule0.push(...temporaryNucleotideKeysToRerenderPerRnaMolecule0);
          break outer;
        }
        const mappedBasePairInformation = basePairsPerRnaMolecule0[nucleotideIndex0];
        if (mappedBasePairInformation.rnaMoleculeName !== rnaMoleculeName1) {
          break outer;
        }
        if (mappedBasePairInformation.nucleotideIndex !== nucleotideIndex1) {
          break outer;
        }
        toBeDragged.push(
          ...temporaryToBeDragged0,
          ...temporaryToBeDragged1
        );
        nucleotideKeysToRerenderPerRnaMolecule0.push(...temporaryNucleotideKeysToRerenderPerRnaMolecule0);
        nucleotideKeysToRerenderPerRnaMolecule1.push(...temporaryNucleotideKeysToRerenderPerRnaMolecule1);
        const extremaWithCauseOfTermination = populateToBeDraggedWithHelix(
          nucleotideIndex0Delta,
          nucleotideIndex0,
          nucleotideIndex1,
          basePairsPerRnaMolecule0,
          rnaMoleculeName0,
          rnaMoleculeName1,
          toBeDragged,
          singularRnaMoleculeProps0,
          singularRnaMoleculeProps1,
          nucleotideKeysToRerenderPerRnaMolecule0,
          nucleotideKeysToRerenderPerRnaMolecule1,
          basePairKeysToRerenderPerRnaComplex,
          true
        );
        const extrema = extremaWithCauseOfTermination.extrema;
        helixData.push({
          start : {
            0 : nucleotideIndex0,
            1 : nucleotideIndex1
          },
          stop : extrema,
          rnaMoleculeName1
        });
        nucleotideIndex0 = extrema[0];
        nucleotideIndex1 = extrema[1];
      }
      return helixData;
    }

    let boundingNucleotide0 : Vector2D;
    let boundingNucleotide1 : Vector2D;
    if (nucleotideIndex1Delta !== 0) {
      const incrementedHelixData = populateToBeDragged(
        1,
        nucleotideIndex1Delta,
        extremaIncremented[0],
        extremaIncremented[1],
        basePairsPerRnaMolecule0,
        basePairsPerRnaMolecule1,
        rnaMoleculeName0,
        rnaMoleculeName1,
        toBeDragged,
        singularRnaMoleculeProps0,
        singularRnaMoleculeProps1,
        basePairKeysToRerenderPerRnaComplex
      );
      if (incrementedHelixData.length > 0) {
        extremaIncremented = incrementedHelixData[incrementedHelixData.length - 1].stop;
        helixData.push(...incrementedHelixData);
      }
      const decrementedHelixData = populateToBeDragged(
        -1,
        -nucleotideIndex1Delta as -1 | 1,
        extremaDecremented[0],
        extremaDecremented[1],
        basePairsPerRnaMolecule0,
        basePairsPerRnaMolecule1,
        rnaMoleculeName0,
        rnaMoleculeName1,
        toBeDragged,
        singularRnaMoleculeProps0,
        singularRnaMoleculeProps1,
        basePairKeysToRerenderPerRnaComplex
      );
      if (decrementedHelixData.length > 0) {
        extremaDecremented = decrementedHelixData[decrementedHelixData.length - 1].stop;
        helixData.unshift(...decrementedHelixData.reverse().map(function({start, stop}) {
          return {
            start : stop,
            stop : start,
            rnaMoleculeName1
          };
        }));
      }
      
      let boundingNucleotideIndex0 : number;
      let boundingNucleotideIndex1 : number;
      boundingNucleotideIndex0 = Math.min(
        extremaDecremented[0],
        extremaDecremented[1],
        extremaIncremented[0],
        extremaIncremented[1]
      );
      switch (boundingNucleotideIndex0) {
        case extremaDecremented[0] : {
          boundingNucleotideIndex1 = extremaDecremented[1];
          break;
        }
        case extremaDecremented[1] : {
          boundingNucleotideIndex1 = extremaDecremented[0];
          break;
        }
        case extremaIncremented[0] : {
          boundingNucleotideIndex1 = extremaIncremented[1];
          break;
        }
        case extremaIncremented[1] : {
          boundingNucleotideIndex1 = extremaIncremented[0];
          break;
        }
        default : {
          throw "This case should be impossible.";
        }
      }
      boundingNucleotide0 = singularRnaMoleculeProps0.nucleotideProps[boundingNucleotideIndex0];
      boundingNucleotide1 = singularRnaMoleculeProps0.nucleotideProps[boundingNucleotideIndex1];
    } else {
      boundingNucleotide0 = singularRnaMoleculeProps0.nucleotideProps[nucleotideIndex0];
      boundingNucleotide1 = singularRnaMoleculeProps0.nucleotideProps[nucleotideIndex1];
    }

    const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
    const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];

    nucleotideKeysToRerenderPerRnaMolecule0.sort(subtractNumbers);
    nucleotideKeysToRerenderPerRnaMolecule1.sort(subtractNumbers);
    basePairKeysToRerenderPerRnaComplex.sort(compareBasePairKeys);

    function rerender() {
      setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
      setBasePairKeysToRerender(structuredClone(basePairKeysToRerender));
    }

    this.dragListener = linearDrag(
      structuredClone(singularNucleotideProps),
      toBeDragged,
      rerender
    );
    let nucleotideRange0Text = `Nucleotides [${extremaDecremented[0] + singularRnaMoleculeProps0.firstNucleotideIndex}, ${extremaIncremented[0] + singularRnaMoleculeProps0.firstNucleotideIndex}]`;
    let nucleotideRange1Text = `Nucleotides [${extremaDecremented[1] + singularRnaMoleculeProps1.firstNucleotideIndex}, ${extremaIncremented[1] + singularRnaMoleculeProps1.firstNucleotideIndex}]`;
    let nucleotideAndRnaMoleculeJsx : JSX.Element;
    if (rnaMoleculeName0 === rnaMoleculeName1) {
      nucleotideAndRnaMoleculeJsx = <>
        {nucleotideRange0Text}
        <br/>
        Bound to
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
    const boundingNucleotideCenter = scaleUp(
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
      {nucleotideAndRnaMoleculeJsx}
      <br/>
      In RNA complex "{singularRnaComplexProps.name}"
      <br/>
    </>;
    this.editMenuProps = {
      boundingVector0 : boundingNucleotide0,
      boundingVector1 : boundingNucleotide1,
      positions : toBeDragged,
      onUpdatePositions : rerender,
      initialAngle : asAngle(normalVector)
    };
    const initialBasePairs : Array<BasePairsEditor.BasePair> = helixData.map(function(helixDatum) {
      const nucleotideIndex1Start = helixDatum.start[1];
      const nucleotideIndex1Stop = helixDatum.stop[1];
      const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
      const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
      const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
      return {
        rnaComplexIndex,
        rnaMoleculeName0,
        rnaMoleculeName1,
        nucleotideIndex0 : helixDatum.start[0] + singularRnaMoleculeProps0.firstNucleotideIndex,
        nucleotideIndex1 : Math.max(nucleotideIndex1Start, nucleotideIndex1Stop) + singularRnaMoleculeProps1.firstNucleotideIndex,
        length : Math.abs(nucleotideIndex1Start - nucleotideIndex1Stop) + 1
      };
    });
    this.initialBasePairs = initialBasePairs;
    this.rnaMoleculeName0 = rnaMoleculeName0;
    this.rnaMoleculeName1 = rnaMoleculeName1;
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
    const rnaMoleculeName0 = this.rnaMoleculeName0;
    const rnaMoleculeName1 = this.rnaMoleculeName1;
    const header = <>
      <b>
        {tab} stacked helices:
      </b>
      <br/>
      {this.partialHeader}
    </>;
    switch (tab) {
      case Tab.EDIT : {
        return <>
          {header}
          <AllInOneEditor.Simplified
            {...this.editMenuProps}
          />
        </>;
      }
      case Tab.FORMAT : {
        return <>
          {header}
          <BasePairsEditor.Component
            rnaComplexProps = {this.rnaComplexProps}
            initialBasePairs = {this.initialBasePairs}
            approveBasePairs = {function(basePairs) {
              for (const basePair of basePairs) {
                if (
                  !(rnaMoleculeName0 === basePair.rnaMoleculeName0 && rnaMoleculeName1 === basePair.rnaMoleculeName1) &&
                  !(rnaMoleculeName1 === basePair.rnaMoleculeName0 && rnaMoleculeName0 === basePair.rnaMoleculeName1)
                ) {
                  let errorMessage : string;
                  if (rnaMoleculeName0 === rnaMoleculeName1) {
                    errorMessage = `This constraint exclusively expects base-pairs between RNA molecule "${rnaMoleculeName0}" and RNA molecule "${rnaMoleculeName1}".`
                  } else {
                    errorMessage = `This constraint exclusivley expects base-pairs within RNA molecule "${rnaMoleculeName0}"`;
                  }
                  throw errorMessage;
                }
              }
            }}
            defaultRnaComplexIndex = {rnaComplexIndex}
            defaultRnaMoleculeName0 = {rnaMoleculeName}
            defaultRnaMoleculeName1 = {rnaMoleculeName}
          />
        </>;
      }
      case Tab.ANNOTATE : {
        const regions : NucleotideRegionsAnnotateMenu.Regions = {
          [rnaComplexIndex] : {
            [rnaMoleculeName0] : [],
            [rnaMoleculeName1] : []
          }
        };
        const regionsPerRnaComplex = regions[rnaComplexIndex];
        const regionsPerRnaMoleculeName0 = regionsPerRnaComplex[rnaMoleculeName0];
        const regionsPerRnaMoleculeName1 = regionsPerRnaComplex[rnaMoleculeName1];

        const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
        const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
        const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
        for (const initialBasePair of this.initialBasePairs) {
          const {
            nucleotideIndex0,
            nucleotideIndex1,
            length
          } = initialBasePair as Required<BasePairsEditor.BasePair>;
          const minimumNucleotideIndexInclusive0 = nucleotideIndex0 - singularRnaMoleculeProps0.firstNucleotideIndex;
          const maximumNucleotideIndexInclusive1 = nucleotideIndex1 - singularRnaMoleculeProps1.firstNucleotideIndex;
          regionsPerRnaMoleculeName0.push({
            minimumNucleotideIndexInclusive : minimumNucleotideIndexInclusive0,
            maximumNucleotideIndexInclusive : minimumNucleotideIndexInclusive0 + length - 1
          });
          regionsPerRnaMoleculeName1.push({
            minimumNucleotideIndexInclusive : maximumNucleotideIndexInclusive1 - length + 1,
            maximumNucleotideIndexInclusive : maximumNucleotideIndexInclusive1
          });
        }

        return <>
          {header}
          <NucleotideRegionsAnnotateMenu.Component
            regions = {regions}
            rnaComplexProps = {this.rnaComplexProps}
            setNucleotideKeysToRerender = {this.setNucleotideKeysToRerender}
          />
        </>;
      }
      default : {
        throw "Unhandled switch case";
      }
    }
  }
}