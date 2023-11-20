import { useContext, useEffect, useMemo } from "react";
import { Context, NucleotideKeysToRerenderPerRnaMolecule } from "../../context/Context";
import Scaffolding from "../generic/Scaffolding";
import { Nucleotide } from "./Nucleotide";
import { SVG_PROPERTY_XRNA_RNA_MOLECULE_FIRST_NUCLEOTIDE_INDEX, SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME, SVG_PROPERTY_XRNA_TYPE, SvgPropertyXrnaType } from "../../io/SvgInputFileHandler";
import Color, { BLACK, areEqual } from "../../data_structures/Color";
import Font, { PartialFont, parseFontSize } from "../../data_structures/Font";

export namespace RnaMolecule {
  export type ExternalProps = {
    firstNucleotideIndex : number,
    nucleotideProps : Record<number, Nucleotide.ExternalProps>
  };

  export type Props = ExternalProps & {
    nucleotideKeysToRerender : NucleotideKeysToRerenderPerRnaMolecule
  };

  export function Component(props : Props) {
    const {
      firstNucleotideIndex,
      nucleotideProps,
      nucleotideKeysToRerender
    } = props;
    // Begin context data
    const name = useContext(Context.RnaMolecule.Name);
    const rnaComplexIndex = useContext(Context.RnaComplex.Index);
    const updateLabelContentDefaultStyle = useContext(Context.Label.Content.UpdateDefaultStyle);
    // Begin memo data
    const flattenedNucleotideProps = useMemo(
      function() {
        const flattenedNucleotideProps = Object.entries(nucleotideProps).map(function([
          nucleotideIndexAsString,
          singularNucleotideProps
        ]) {
          return {
            scaffoldingKey : Number.parseInt(nucleotideIndexAsString),
            props : singularNucleotideProps
          };
        });
        flattenedNucleotideProps.sort(function(
          singularFlattenedNucleotideProps0,
          singularFlattenedNucleotideProps1
        ) {
          return singularFlattenedNucleotideProps0.scaffoldingKey - singularFlattenedNucleotideProps1.scaffoldingKey
        });
        return flattenedNucleotideProps;
      },
      [nucleotideProps]
    );
    // Begin effects.
    useEffect(
      function() {
        type FontWithCount = { font : PartialFont, count : number };
        type ColorWithCount = { color : Color, count : number };

        const colorsWithCounts = new Array<ColorWithCount>();
        const fontsWithCounts = new Array<FontWithCount>();
        let fontSizeSum = 0;
        let countOfLabelContents = 0;
        for (const singularNucleotideProps of Object.values(nucleotideProps)) {
          const {
            labelContentProps
          } = singularNucleotideProps;
          if (labelContentProps !== undefined) {
            const {
              font,
              color
            } = labelContentProps;
            if (font !== undefined) {
              countOfLabelContents++;
              if (typeof font.size === "string") {
                fontSizeSum += parseFontSize(font.size);
              } else {
                fontSizeSum += font.size;
              }
              let foundFontFlag = false;
              for (const fontWithCount of fontsWithCounts) {
                if (PartialFont.areEqual(
                  font,
                  fontWithCount.font
                )) {
                  fontWithCount.count++;
                  foundFontFlag = true;
                  break;
                }
              }
              if (!foundFontFlag) {
                fontsWithCounts.push({
                  font,
                  count : 1
                });
              }
            }
            if (color !== undefined) {
              let foundColorFlag = false;
              for (const colorWithCount of colorsWithCounts) {
                if (areEqual(
                  color,
                  colorWithCount.color
                )) {
                  colorWithCount.count++;
                  foundColorFlag = true;
                  break;
                }
              }
              if (!foundColorFlag) {
                colorsWithCounts.push({
                  color,
                  count : 1
                });
              }
            }
          }
        }
        let mostCommonFont : FontWithCount = { font : structuredClone(Font.DEFAULT), count : 0 };
        for (const fontWithCount of fontsWithCounts) {
          if (fontWithCount.count > mostCommonFont.count) {
            mostCommonFont = fontWithCount;
          }
        }
        let mostCommonColor : ColorWithCount = { color : structuredClone(BLACK), count : 0 };
        for (const colorWithCount of colorsWithCounts) {
          if (colorWithCount.count < mostCommonColor.count) {
            mostCommonColor = colorWithCount;
          }
        }
        const averageFontSize = countOfLabelContents === 0 ? Font.DEFAULT_SIZE : fontSizeSum / countOfLabelContents;
        updateLabelContentDefaultStyle(
          rnaComplexIndex,
          name,
          {
            color : mostCommonColor.color,
            font : {
              ...mostCommonFont.font,
              size : averageFontSize
            }
          }
        );
      },
      [
        rnaComplexIndex,
        name,
        nucleotideProps
      ]
    );
    return <g
      {...{
        [SVG_PROPERTY_XRNA_TYPE] : SvgPropertyXrnaType.RNA_MOLECULE,
        [SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME] : name,
        [SVG_PROPERTY_XRNA_RNA_MOLECULE_FIRST_NUCLEOTIDE_INDEX] : firstNucleotideIndex
      }}
    >
      <Context.RnaMolecule.FirstNucleotideIndex.Provider
        value = {firstNucleotideIndex}
        // value = {flattenedNucleotideProps.length === 0 ? NaN : flattenedNucleotideProps[0].scaffoldingKey}
      >
        <Scaffolding.Component<number, Nucleotide.ExternalProps>
          sortedProps = {flattenedNucleotideProps}
          childComponent = {Nucleotide.Component}
          propsToRerenderKeys = {nucleotideKeysToRerender}
          comparator = {function(nucleotideIndex0, nucleotideIndex1) {
            return nucleotideIndex0 - nucleotideIndex1;
          }}
        />
      </Context.RnaMolecule.FirstNucleotideIndex.Provider>
    </g>;
  }
}