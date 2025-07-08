import { RnaComplexProps, FullKeys, DragListener, FullKeysRecord } from "../../../App";
import { Tab } from "../../../app_data/Tab";
import BasePair, { getBasePairType } from "../../../components/app_specific/BasePair";
import { Nucleotide } from "../../../components/app_specific/Nucleotide";
import { RnaComplex, compareBasePairKeys, selectRelevantBasePairKeys } from "../../../components/app_specific/RnaComplex";
import { RnaMolecule } from "../../../components/app_specific/RnaMolecule";
import { AppSpecificOrientationEditor } from "../../../components/app_specific/editors/AppSpecificOrientationEditor";
import { BasePairsEditor } from "../../../components/app_specific/editors/BasePairsEditor";
import { NucleotideRegionsAnnotateMenu } from "../../../components/app_specific/menus/annotate_menus/NucleotideRegionsAnnotateMenu";
import { NucleotideKeysToRerender, BasePairKeysToRerender, BasePairKeysToRerenderPerRnaComplex, NucleotideKeysToRerenderPerRnaMolecule } from "../../../context/Context";
import { Vector2D, add, asAngle, orthogonalizeLeft, scaleUp, subtract } from "../../../data_structures/Vector2D";
import { range, sign, subtractNumbers } from "../../../utils/Utils";
import { AbstractInteractionConstraint, InteractionConstraintError, multipleBasePairsNucleotideError, nonBasePairedNucleotideError } from "../AbstractInteractionConstraint";
import { linearDrag } from "../CommonDragListeners";
import { Extrema, InteractionConstraint, iterateOverFreeNucleotidesandHelicesPerRnaMolecule } from "../InteractionConstraints";
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

    const singularRnaComplexProps = rnaComplexProps[fullKeys0.rnaComplexIndex];
    const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
    const basePairsPerRnaMolecule0 = basePairsPerRnaComplex[fullKeys0.rnaMoleculeName];
    if (!(fullKeys0.nucleotideIndex in basePairsPerRnaMolecule0)) {
      throw nonBasePairedNucleotideError;
    }
    const basePairsPerNucleotide0 = basePairsPerRnaMolecule0[fullKeys0.nucleotideIndex].filter(
      (basePair) => BasePair.isEnabledBasePair(
        basePair.basePairType ?? getBasePairType(
          singularRnaComplexProps.rnaMoleculeProps[fullKeys0.rnaMoleculeName].nucleotideProps[fullKeys0.nucleotideIndex].symbol,
          singularRnaComplexProps.rnaMoleculeProps[basePair.rnaMoleculeName].nucleotideProps[basePair.nucleotideIndex].symbol
        ),
        treatNoncanonicalBasePairsAsUnpairedFlag
      )
    );
    if (basePairsPerNucleotide0.length === 0) {
      throw nonBasePairedNucleotideError;
    }
    let basePairPerNucleotide0;
    if (basePairsPerNucleotide0.length > 1) {
      if (fullKeys1 === undefined) {
        throw multipleBasePairsNucleotideError;
      } else {
        basePairPerNucleotide0 = basePairsPerNucleotide0.find((basePair) => (
          basePair.rnaMoleculeName === fullKeys1.rnaMoleculeName &&
          basePair.nucleotideIndex === fullKeys1.nucleotideIndex
        ))!;
      }
    } else {
      basePairPerNucleotide0 = basePairsPerNucleotide0[0];
    }
    this.rnaMoleculeName0 = fullKeys0.rnaMoleculeName;
    this.rnaMoleculeName1 = basePairPerNucleotide0.rnaMoleculeName;

    const visited : Record<string, Set<number>> = {
      [this.rnaMoleculeName0]: new Set<number>(),
      [this.rnaMoleculeName1]: new Set<number>()
    };
    type Node = {rnaMoleculeName : string, nucleotideIndex : number};
    type Queue = Array<Node>;
    const adjacentByOne : Queue = [
      fullKeys0,
      basePairPerNucleotide0
    ];
    const adjacentByBasePairs : Queue = [];
    while (
      adjacentByOne.length > 0 ||
      adjacentByBasePairs.length > 0
    ) {
      let current : Node;
      if (adjacentByOne.length > 0) {
        current = adjacentByOne.shift()!;
      } else {
        current = adjacentByBasePairs.shift()!;
        if (
          !(visited[current.rnaMoleculeName].has(current.nucleotideIndex - 1)) &&
          !(visited[current.rnaMoleculeName].has(current.nucleotideIndex + 1))
        ) {
          continue;
        }
      }
      const { rnaMoleculeName, nucleotideIndex } = current;
      if (visited[rnaMoleculeName].has(nucleotideIndex)) {
        continue;
      }
      visited[rnaMoleculeName].add(nucleotideIndex);
      for (const adjacent of [
        {
          rnaMoleculeName,
          nucleotideIndex: nucleotideIndex - 1
        },
        {
          rnaMoleculeName,
          nucleotideIndex: nucleotideIndex + 1
        }
      ]) {
        if (!(adjacent.nucleotideIndex in singularRnaComplexProps.rnaMoleculeProps[adjacent.rnaMoleculeName].nucleotideProps)) {
          continue;
        }
        let enabledBasePairs : Array<RnaComplex.MappedBasePair> = [];
        const nucleotideIsBasePairedFlag = (
          adjacent.nucleotideIndex in singularRnaComplexProps.basePairs[adjacent.rnaMoleculeName] &&
          (enabledBasePairs = singularRnaComplexProps.basePairs[adjacent.rnaMoleculeName][adjacent.nucleotideIndex]).filter((basePair) => (
            BasePair.isEnabledBasePair(
              basePair.basePairType ?? getBasePairType(
                singularRnaComplexProps.rnaMoleculeProps[adjacent.rnaMoleculeName].nucleotideProps[adjacent.nucleotideIndex].symbol,
                singularRnaComplexProps.rnaMoleculeProps[basePair.rnaMoleculeName].nucleotideProps[basePair.nucleotideIndex].symbol
              ),
              treatNoncanonicalBasePairsAsUnpairedFlag
            )
          )).length > 0
        );
        if (!nucleotideIsBasePairedFlag) {
          // Unpaired nucleotides are always allowed.
          adjacentByOne.push(adjacent);
        } else {
          const relevantBasePairs = enabledBasePairs.filter((basePair) => (
            basePair.rnaMoleculeName === this.rnaMoleculeName0 ||
            basePair.rnaMoleculeName === this.rnaMoleculeName1
          ));
          const condition = (basePair : Node) => visited[basePair.rnaMoleculeName].has(basePair.nucleotideIndex - 1) || visited[basePair.rnaMoleculeName].has(basePair.nucleotideIndex + 1);
          adjacentByOne.push(...relevantBasePairs.filter(condition));
          adjacentByBasePairs.push(...relevantBasePairs.filter((basePair) => !condition(basePair)));
        }
      }
      if (nucleotideIndex in basePairsPerRnaComplex[rnaMoleculeName]) {
        adjacentByBasePairs.push(...basePairsPerRnaComplex[rnaMoleculeName][nucleotideIndex].filter((basePair) => (
          (
            basePair.rnaMoleculeName === this.rnaMoleculeName0 ||
            basePair.rnaMoleculeName === this.rnaMoleculeName1
          ) &&
          BasePair.isEnabledBasePair(
            basePair.basePairType ?? getBasePairType(
              singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName].nucleotideProps[nucleotideIndex].symbol,
              singularRnaComplexProps.rnaMoleculeProps[basePair.rnaMoleculeName].nucleotideProps[basePair.nucleotideIndex].symbol
            ),
            treatNoncanonicalBasePairsAsUnpairedFlag
          )
        )));
      }
    }

    const nucleotideKeysToRerender : NucleotideKeysToRerender = {
      [fullKeys0.rnaComplexIndex] : {
        [this.rnaMoleculeName0] : [],
        [this.rnaMoleculeName1] : []
      }
    };
    const nucleotideKeysToRerenderPerRnaComplex = nucleotideKeysToRerender[fullKeys0.rnaComplexIndex];
    const nucleotideKeysToRerenderPerRnaMolecule0 = nucleotideKeysToRerenderPerRnaComplex[this.rnaMoleculeName0];
    const nucleotideKeysToRerenderPerRnaMolecule1 = nucleotideKeysToRerenderPerRnaComplex[this.rnaMoleculeName1];
    const basePairKeysToRerender : BasePairKeysToRerender = {
      [fullKeys0.rnaComplexIndex] : []
    };
    const basePairKeysToRerenderPerRnaComplex = basePairKeysToRerender[fullKeys0.rnaComplexIndex];
    let allNucleotides : Array<Nucleotide.ExternalProps> = [];
    const boundingIndices : Record<string, [number, number]> = {};
    const finalizedIndices : Record<string, Array<number>> = {};
    for (const rnaMoleculeName of [this.rnaMoleculeName0, this.rnaMoleculeName1]) {
      let nucleotideIndices = Array.from(visited[rnaMoleculeName]);
      nucleotideIndices.sort(subtractNumbers);
      function isBasePaired(arrayIndex : number) {
        const nucleotideIndex = nucleotideIndices[arrayIndex];
        return (
          (nucleotideIndex in singularRnaComplexProps.basePairs[rnaMoleculeName]) &&
          singularRnaComplexProps.basePairs[rnaMoleculeName][nucleotideIndex].some((basePair) => BasePair.isEnabledBasePair(
            basePair.basePairType ?? getBasePairType(
              singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName].nucleotideProps[nucleotideIndex].symbol,
              singularRnaComplexProps.rnaMoleculeProps[basePair.rnaMoleculeName].nucleotideProps[basePair.nucleotideIndex].symbol
            ),
            treatNoncanonicalBasePairsAsUnpairedFlag
          ))
        );
      }
      while (!isBasePaired(0)) {
        nucleotideIndices.shift();
      }
      while (!isBasePaired(nucleotideIndices.length - 1)) {
        nucleotideIndices.pop();
      }
      for (let arrayIndex = 0; arrayIndex < nucleotideIndices.length - 1;) {
        if (isBasePaired(arrayIndex)) {
          arrayIndex++;
          continue;
        }
        const nucleotideIndex = nucleotideIndices[arrayIndex];
        const nextNucleotideIndex = nucleotideIndices[arrayIndex + 1];
        if (nucleotideIndex !== nextNucleotideIndex - 1) {
          nucleotideIndices.splice(arrayIndex, 1);
          arrayIndex--;
        } else {
          arrayIndex++;
        }
      }
      for (let arrayIndex = nucleotideIndices.length - 1; arrayIndex > 0;) {
        if (isBasePaired(arrayIndex)) {
          arrayIndex--;
          continue;
        }
        const nucleotideIndex = nucleotideIndices[arrayIndex];
        const previousNucleotideIndex = nucleotideIndices[arrayIndex - 1];
        if (nucleotideIndex !== previousNucleotideIndex + 1) {
          nucleotideIndices.splice(arrayIndex, 1);
          arrayIndex++;
        } else {
          arrayIndex--;
        }
      }
      allNucleotides.push(...nucleotideIndices.map((nucleotideIndex) => (
        singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName].nucleotideProps[nucleotideIndex]
      )));
      nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName].push(...nucleotideIndices);
      const basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName];
      for (const nucleotideIndex of nucleotideIndices) {
        if (!(nucleotideIndex in basePairsPerRnaMolecule)) {
          continue;
        }
        const basePairsPerNucleotide = basePairsPerRnaMolecule[nucleotideIndex];
        for (const basePair of basePairsPerNucleotide) {
          basePairKeysToRerenderPerRnaComplex.push(selectRelevantBasePairKeys(
            {
              rnaMoleculeName,
              nucleotideIndex
            },
            basePair
          ));
        }
      }
      finalizedIndices[rnaMoleculeName] = nucleotideIndices;
      const min = Math.min(...nucleotideIndices);
      const max = Math.max(...nucleotideIndices);
      boundingIndices[rnaMoleculeName] = [min, max];
    }
    const indicesOfBoundingNucleotide0 = selectRelevantBasePairKeys(
      {
        rnaMoleculeName : this.rnaMoleculeName0,
        nucleotideIndex : boundingIndices[this.rnaMoleculeName0][0]
      },
      {
        rnaMoleculeName : this.rnaMoleculeName1,
        nucleotideIndex : boundingIndices[this.rnaMoleculeName1][0]
      }
    );
    const boundingNucleotide0 = singularRnaComplexProps.rnaMoleculeProps[indicesOfBoundingNucleotide0.rnaMoleculeName].nucleotideProps[indicesOfBoundingNucleotide0.nucleotideIndex];
    const relevantBasePairsOfBoundingNucleotide0 = basePairsPerRnaComplex[indicesOfBoundingNucleotide0.rnaMoleculeName][indicesOfBoundingNucleotide0.nucleotideIndex].filter((basePair) => (
      (
        basePair.rnaMoleculeName === this.rnaMoleculeName0 ||
        basePair.rnaMoleculeName === this.rnaMoleculeName1
      ) &&
      finalizedIndices[basePair.rnaMoleculeName].includes(basePair.nucleotideIndex) &&
      BasePair.isEnabledBasePair(
        basePair.basePairType ?? getBasePairType(
          singularRnaComplexProps.rnaMoleculeProps[indicesOfBoundingNucleotide0.rnaMoleculeName].nucleotideProps[indicesOfBoundingNucleotide0.nucleotideIndex].symbol,
          singularRnaComplexProps.rnaMoleculeProps[basePair.rnaMoleculeName].nucleotideProps[basePair.nucleotideIndex].symbol
        ),
        treatNoncanonicalBasePairsAsUnpairedFlag
      )
    ));
    const indicesOfBoundingNucleotide1 = relevantBasePairsOfBoundingNucleotide0.sort(compareBasePairKeys)[relevantBasePairsOfBoundingNucleotide0.length - 1];
    const boundingNucleotide1 = singularRnaComplexProps.rnaMoleculeProps[indicesOfBoundingNucleotide1.rnaMoleculeName].nucleotideProps[indicesOfBoundingNucleotide1.nucleotideIndex];
    const normalVector = orthogonalizeLeft(subtract(
      boundingNucleotide1,
      boundingNucleotide0
    ));
    this.editMenuProps = {
      boundingVector0 : boundingNucleotide0,
      boundingVector1 : boundingNucleotide1,
      positions : allNucleotides,
      onUpdatePositions : rerender,
      initialAngle : asAngle(normalVector)
    };
    nucleotideKeysToRerenderPerRnaMolecule0.sort(subtractNumbers);
    nucleotideKeysToRerenderPerRnaMolecule1.sort(subtractNumbers);
    basePairKeysToRerenderPerRnaComplex.sort(compareBasePairKeys);
    function rerender() {
      setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
      setBasePairKeysToRerender(structuredClone(basePairKeysToRerender));
    }
    this.dragListener = linearDrag(
      structuredClone(rnaComplexProps[fullKeys0.rnaComplexIndex].rnaMoleculeProps[fullKeys0.rnaMoleculeName].nucleotideProps[fullKeys0.nucleotideIndex]),
      allNucleotides,
      rerender
    );
    const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[this.rnaMoleculeName0];
    const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[this.rnaMoleculeName1];

    // This is a lazy method for finding the helix data. Probably should be replaced later.
    const helixDataPerRnaMolecule = iterateOverFreeNucleotidesandHelicesPerRnaMolecule(
      singularRnaComplexProps,
      this.rnaMoleculeName0,
      treatNoncanonicalBasePairsAsUnpairedFlag
    )
    const rnaMoleculeName0 = this.rnaMoleculeName0;
    const rnaMoleculeName1 = this.rnaMoleculeName1;
    this.initialBasePairs = helixDataPerRnaMolecule.helixData.filter(
      (helixDatum) => helixDatum.rnaMoleculeName1 === this.rnaMoleculeName1 &&
      finalizedIndices[this.rnaMoleculeName0].includes(helixDatum.start[0]) &&
      finalizedIndices[this.rnaMoleculeName1].includes(helixDatum.start[1]) &&
      finalizedIndices[this.rnaMoleculeName0].includes(helixDatum.stop[0]) &&
      finalizedIndices[this.rnaMoleculeName1].includes(helixDatum.stop[1])
    ).map(function(helixDatum) {
      return {
        rnaComplexIndex : fullKeys0.rnaComplexIndex,
        rnaMoleculeName0,
        rnaMoleculeName1,
        nucleotideIndex0 : helixDatum.start[0] + singularRnaMoleculeProps0.firstNucleotideIndex,
        nucleotideIndex1 : Math.max(helixDatum.start[1], helixDatum.stop[1]) + singularRnaMoleculeProps1.firstNucleotideIndex,
        length : Math.abs(helixDatum.start[0] - helixDatum.stop[0]) + 1
      };
    });

    function getNucleotideIndexOfBasePairedNucleotide(
      nucleotideIndex : number
    ) {
      const basePairsPerRnaMolecule0 = singularRnaComplexProps.basePairs[rnaMoleculeName0];
      if (!(nucleotideIndex in basePairsPerRnaMolecule0)) {
        throw "An unpaired nucleotide was passed to getNucleotideIndexOfBasePairedNucleotide";
      }
      const basePairsPerNucleotide = basePairsPerRnaMolecule0[nucleotideIndex].filter(
        (basePair) => BasePair.isEnabledBasePair(
          basePair.basePairType ?? getBasePairType(
            singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0].nucleotideProps[nucleotideIndex].symbol,
            singularRnaComplexProps.rnaMoleculeProps[basePair.rnaMoleculeName].nucleotideProps[basePair.nucleotideIndex].symbol
          ),
          treatNoncanonicalBasePairsAsUnpairedFlag
        ) && 
        basePair.rnaMoleculeName === rnaMoleculeName1 &&
        finalizedIndices[rnaMoleculeName1].includes(basePair.nucleotideIndex)
      );
      if (basePairsPerNucleotide.length === 0) {
        throw "An unpaired nucleotide was passed to getNucleotideIndexOfBasePairedNucleotide";
      }
      return basePairsPerNucleotide[0].nucleotideIndex;
    }
    const boundingNucleotideIndex0 = boundingIndices[this.rnaMoleculeName0][0];
    const boundingNucleotideIndex1 = finalizedIndices[this.rnaMoleculeName0].find((nucleotideIndex, arrayIndex) => (nucleotideIndex !== finalizedIndices[this.rnaMoleculeName0][arrayIndex + 1] - 1))!;
    let nucleotideRange0Text = `Nucleotides [${boundingNucleotideIndex0 + singularRnaMoleculeProps0.firstNucleotideIndex}, ${boundingNucleotideIndex1 + singularRnaMoleculeProps0.firstNucleotideIndex}]`;
    let nucleotideRange1Text = `Nucleotides [${getNucleotideIndexOfBasePairedNucleotide(boundingNucleotideIndex0) + singularRnaMoleculeProps1.firstNucleotideIndex}, ${getNucleotideIndexOfBasePairedNucleotide(boundingNucleotideIndex1) + singularRnaMoleculeProps1.firstNucleotideIndex}]`;
    let nucleotideAndRnaMoleculeJsx : JSX.Element;
    if (this.rnaMoleculeName0 === this.rnaMoleculeName1) {
      nucleotideAndRnaMoleculeJsx = <>
        {nucleotideRange0Text}
        <br/>
        Bound to
        <br/>
        {nucleotideRange1Text}
        <br/>
        In RNA molecule "{this.rnaMoleculeName0}"
      </>;
    } else {
      nucleotideAndRnaMoleculeJsx = <>
        {nucleotideRange0Text}
        <br/>
        In RNA molecule "{this.rnaMoleculeName0}"
        <br/>
        {nucleotideRange1Text}
        <br/>
        In RNA molecule "{this.rnaMoleculeName1}"
      </>;
    }
    this.partialHeader = <>
      {nucleotideAndRnaMoleculeJsx}
      <br/>
      In RNA complex "{singularRnaComplexProps.name}"
      <br/>
    </>;
  }

  public override drag() {
    return this.dragListener;
  }

  public override createRightClickMenu(tab : InteractionConstraint.SupportedTab) {
    const {
      rnaComplexIndex,
      rnaMoleculeName
    } = this.fullKeys0;
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
        const regionsPerRnaMolecule0 = regionsPerRnaComplex[rnaMoleculeName0];
        const regionsPerRnaMolecule1 = regionsPerRnaComplex[rnaMoleculeName1];

        const singularRnaComplexProps = this.rnaComplexProps[rnaComplexIndex];
        const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
        const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];

        let minimumNucleotideIndexPerRnaMolecule0 = Number.POSITIVE_INFINITY;
        let maximumNucleotideIndexPerRnaMolecule0 = Number.NEGATIVE_INFINITY;
        let minimumNucleotideIndexPerRnaMolecule1 = Number.POSITIVE_INFINITY;
        let maximumNucleotideIndexPerRnaMolecule1 = Number.NEGATIVE_INFINITY;

        const indicesOfFrozenNucleotidesPerRnaComplex = rnaComplexIndex in this.indicesOfFrozenNucleotides ? this.indicesOfFrozenNucleotides[rnaComplexIndex]: {};
        const indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule0 = rnaMoleculeName0 in indicesOfFrozenNucleotidesPerRnaComplex ? indicesOfFrozenNucleotidesPerRnaComplex[rnaMoleculeName0] : new Set<number>();
        const indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule1 = rnaMoleculeName1 in indicesOfFrozenNucleotidesPerRnaComplex ? indicesOfFrozenNucleotidesPerRnaComplex[rnaMoleculeName1] : new Set<number>();

        for (const basePair of this.initialBasePairs) {
          const {
            nucleotideIndex0,
            nucleotideIndex1,
            length
          } = basePair as Required<BasePairsEditor.BasePair>;
          const lesserNucleotideIndex0 = nucleotideIndex0 - singularRnaMoleculeProps0.firstNucleotideIndex;
          const greaterNucleotideIndex0 = lesserNucleotideIndex0 + length - 1;
          if (lesserNucleotideIndex0 < minimumNucleotideIndexPerRnaMolecule0) {
            minimumNucleotideIndexPerRnaMolecule0 = lesserNucleotideIndex0;
          }
          if (greaterNucleotideIndex0 > maximumNucleotideIndexPerRnaMolecule0) {
            maximumNucleotideIndexPerRnaMolecule0 = greaterNucleotideIndex0;
          }

          const greaterNucleotideIndex1 = nucleotideIndex1 - singularRnaMoleculeProps1.firstNucleotideIndex;
          const lesserNucleotideIndex1 = greaterNucleotideIndex1 - length + 1;
          if (lesserNucleotideIndex1 < minimumNucleotideIndexPerRnaMolecule1) {
            minimumNucleotideIndexPerRnaMolecule1 = lesserNucleotideIndex1;
          }
          if (greaterNucleotideIndex1 > maximumNucleotideIndexPerRnaMolecule1) {
            maximumNucleotideIndexPerRnaMolecule1 = greaterNucleotideIndex1;
          }
        }
        if (rnaMoleculeName0 === rnaMoleculeName1) {
          maximumNucleotideIndexPerRnaMolecule0 = Math.max(
            maximumNucleotideIndexPerRnaMolecule0,
            maximumNucleotideIndexPerRnaMolecule1
          );
          minimumNucleotideIndexPerRnaMolecule0 = Math.min(
            minimumNucleotideIndexPerRnaMolecule0,
            minimumNucleotideIndexPerRnaMolecule1
          );
          NucleotideRegionsAnnotateMenu.populateRegions(
            indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule0,
            range(
              maximumNucleotideIndexPerRnaMolecule0 + 1,
              minimumNucleotideIndexPerRnaMolecule0
            ),
            regionsPerRnaMolecule0
          );
        } else {
          NucleotideRegionsAnnotateMenu.populateRegions(
            indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule0,
            range(
              maximumNucleotideIndexPerRnaMolecule0 + 1,
              minimumNucleotideIndexPerRnaMolecule0
            ),
            regionsPerRnaMolecule0
          );
          NucleotideRegionsAnnotateMenu.populateRegions(
            indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule1,
            range(
              maximumNucleotideIndexPerRnaMolecule1 + 1,
              minimumNucleotideIndexPerRnaMolecule1
            ),
            regionsPerRnaMolecule1
          );
        }
        // for (const initialBasePair of this.initialBasePairs) {
        //   const {
        //     nucleotideIndex0,
        //     nucleotideIndex1,
        //     length
        //   } = initialBasePair as Required<BasePairsEditor.BasePair>;
        //   const minimumNucleotideIndexInclusive0 = nucleotideIndex0 - singularRnaMoleculeProps0.firstNucleotideIndex;
        //   const maximumNucleotideIndexInclusive1 = nucleotideIndex1 - singularRnaMoleculeProps1.firstNucleotideIndex;
        //   regionsPerRnaMolecule0.push({
        //     minimumNucleotideIndexInclusive : minimumNucleotideIndexInclusive0,
        //     maximumNucleotideIndexInclusive : minimumNucleotideIndexInclusive0 + length - 1
        //   });
        //   regionsPerRnaMolecule1.push({
        //     minimumNucleotideIndexInclusive : maximumNucleotideIndexInclusive1 - length + 1,
        //     maximumNucleotideIndexInclusive : maximumNucleotideIndexInclusive1
        //   });
        // }

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