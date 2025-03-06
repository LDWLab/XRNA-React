import { Fragment, createElement, useContext, useEffect, useMemo } from "react";
import { Context, NucleotideKeysToRerenderPerRnaMolecule } from "../../context/Context";
import Scaffolding from "../generic/Scaffolding";
import { Nucleotide } from "./Nucleotide";
import { SVG_PROPERTY_XRNA_RNA_MOLECULE_FIRST_NUCLEOTIDE_INDEX, SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME, SVG_PROPERTY_XRNA_TYPE, SvgPropertyXrnaType } from "../../io/SvgInputFileHandler";
import Color, { BLACK, areEqual } from "../../data_structures/Color";
import Font, { PartialFont, parseFontSize } from "../../data_structures/Font";
import { Setting } from "../../ui/Setting";
import { DEFAULT_STROKE_WIDTH } from "../../utils/Constants";

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
    const settingsRecord = useContext(Context.App.Settings);
    const displayContourLineFlag = settingsRecord[Setting.REPLACE_NUCLEOTIDES_WITH_CONTOUR_LINE] as boolean;
    const contourLineWidth = settingsRecord[Setting.CONTOUR_LINE_WIDTH] as number;
    // Begin memo data
    // const flattenedNucleotideProps = useMemo(
    //   function() {
    //     const flattenedNucleotideProps = Object.entries(nucleotideProps).map(function([
    //       nucleotideIndexAsString,
    //       singularNucleotideProps
    //     ]) {
    //       return {
    //         scaffoldingKey : Number.parseInt(nucleotideIndexAsString),
    //         props : singularNucleotideProps
    //       };
    //     });
    //     flattenedNucleotideProps.sort(function(
    //       singularFlattenedNucleotideProps0,
    //       singularFlattenedNucleotideProps1
    //     ) {
    //       return singularFlattenedNucleotideProps0.scaffoldingKey - singularFlattenedNucleotideProps1.scaffoldingKey
    //     });
    //     return flattenedNucleotideProps;
    //   },
    //   [nucleotideProps]
    // );
    // const renderedNucleotides = useMemo(
    //   function() {
    //     return flattenedNucleotideProps.map(function({ scaffoldingKey, props }) {
    //       const finalizedProps = props as Nucleotide.Props & { scaffoldingKey : number };
    //       finalizedProps.scaffoldingKey = scaffoldingKey;
    //       return <Fragment
    //         key = {scaffoldingKey}
    //       >
    //         {createElement(
    //           Nucleotide.Component,
    //           finalizedProps
    //         )}
    //       </Fragment>
    //     });
    //   },
    //   [flattenedNucleotideProps]
    // );
    
    const flattenedNucleotideProps = useMemo(
      function() {
        const flattenedNucleotideProps = Object.entries(nucleotideProps).map(function([
          nucleotideIndexAsString,
          singularNucleotideProps
        ]) {
          const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
          const finalizedProps = singularNucleotideProps as Nucleotide.ExternalProps & { nucleotideIndex : number, key : number };
          finalizedProps.key = nucleotideIndex;
          finalizedProps.nucleotideIndex = nucleotideIndex;
          return finalizedProps;
        });
        flattenedNucleotideProps.sort(function(
          singularFlattenedNucleotideProps0,
          singularFlattenedNucleotideProps1
        ) {
          return singularFlattenedNucleotideProps0.nucleotideIndex - singularFlattenedNucleotideProps1.nucleotideIndex
        });
        return flattenedNucleotideProps;
      },
      [nucleotideProps]
    );
    // const renderedNucleotides = useMemo(
    //   function() {
      // return renderedNucleotides;
    //   },
    //   [nucleotideProps]
    // );
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
      {displayContourLineFlag && <polyline
        points = {flattenedNucleotideProps.map(function({ x, y }) {
          return `${x},${y}`;
        }).join(" ")}
        pointerEvents = "none"
        stroke = "black"
        strokeWidth = {contourLineWidth}
        fill = "none"
      />}
      {!displayContourLineFlag && <Context.RnaMolecule.FirstNucleotideIndex.Provider
        value = {firstNucleotideIndex}
        // value = {flattenedNucleotideProps.length === 0 ? NaN : flattenedNucleotideProps[0].scaffoldingKey}
      >
        {flattenedNucleotideProps.map(function(finalizedProps) {
          return createElement(
            Nucleotide.MemoizedComponent,
            finalizedProps
          );
        })}
      </Context.RnaMolecule.FirstNucleotideIndex.Provider>}
    </g>;
  }
}