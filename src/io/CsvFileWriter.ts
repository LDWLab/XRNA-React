import { RnaComplexProps } from "../App";
import { Nucleotide, getLabelContentHtmlElementId } from "../components/app_specific/Nucleotide";
import Color, { BLACK, toHexadecimal } from "../data_structures/Color";
import Font from "../data_structures/Font";
import { DEFAULT_STROKE_WIDTH, numberToFormattedStringHelper } from "../utils/Constants";

// Note that these values are arbitrary, but they come from the XRNA Java program.
export const CSV_OUTPUT_BOUNDS = {
  x : {
    max : 576,
    min : 36
  },
  y : {
    max : 756,
    min : 36
  }
};
export const CSV_OUTPUT_MIDPOINT = {
  x : (CSV_OUTPUT_BOUNDS.x.min + CSV_OUTPUT_BOUNDS.x.max) * 0.5,
  y : (CSV_OUTPUT_BOUNDS.y.min + CSV_OUTPUT_BOUNDS.y.max) * 0.5
};
export const CSV_NUCLEOTIDE_FONT_SCALAR = 1.2;

export function csvFileWriter(
  rnaComplexProps : RnaComplexProps,
  complexDocumentName : string
) {
  const titles = [
    "resNum",
    "unModResName",
    "X",
    "Y",
    "resColor",
    "FontSize",
    "LineX1",
    "LineY1",
    "LineX2",
    "LineY2",
    "LineThickness",
    "LineColor",
    "LabelX",
    "LabelY",
    "LabelSymbol",
    "LabelFontSize",
    "LabelColor",
    "rnaComplexName"
  ];
  const outputLines = [
    titles.join(",")
  ];
  function getFontSize(font : Font | undefined) {
    if (font === undefined) {
      font = Font.DEFAULT;
    }
    let fontSize = 0;
    if (typeof font.size === "number") {
      fontSize = font.size;
    } else {
      const regexMatch = /^-?[\d.]+/.exec(font.size);
      if (regexMatch === null) {
        throw `Unrecognized font-size format: ${font.size}`;
      }
      fontSize = Number.parseFloat(regexMatch[0]);
    }
    fontSize = Math.abs(scaleY) * fontSize;
    return fontSize;
  }
  function colorToString(color : Color | undefined) {
    if (color === undefined) {
      color = BLACK;
    }
    return toHexadecimal(color).toLocaleLowerCase();
  }
  const nucleotideBounds = {
    x : {
      min : Number.POSITIVE_INFINITY,
      max : Number.NEGATIVE_INFINITY
    },
    y : {
      min : Number.POSITIVE_INFINITY,
      max : Number.NEGATIVE_INFINITY
    }
  };
  for (let rnaComplexIndexAsString in rnaComplexProps) {
    const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
    const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
    for (let rnaMoleculeName in singularRnaComplexProps.rnaMoleculeProps) {
      const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
      for (let nucleotideIndexAsString in singularRnaMoleculeProps.nucleotideProps) {
        const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
        const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
        const x = singularNucleotideProps.x;
        const y = singularNucleotideProps.y;
        if (x < nucleotideBounds.x.min) {
          nucleotideBounds.x.min = x;
        }
        if (x > nucleotideBounds.x.max) {
          nucleotideBounds.x.max = x;
        }
        if (y < nucleotideBounds.y.min) {
          nucleotideBounds.y.min = y;
        }
        if (y > nucleotideBounds.y.max) {
          nucleotideBounds.y.max = y;
        }
      }
    }
  }
  const scaleX = Math.min(
    (CSV_OUTPUT_BOUNDS.x.max - CSV_OUTPUT_BOUNDS.x.min) / (nucleotideBounds.x.max - nucleotideBounds.x.min),
    (CSV_OUTPUT_BOUNDS.y.max - CSV_OUTPUT_BOUNDS.y.min) / (nucleotideBounds.y.max  - nucleotideBounds.y.min)
  );
  const scaleY = -scaleX;
  const inputMidpoint = {
    x : (nucleotideBounds.x.min + nucleotideBounds.x.max) * 0.5,
    y : (nucleotideBounds.y.min + nucleotideBounds.y.max) * 0.5
  };
  for (let rnaComplexIndexAsString in rnaComplexProps) {
    const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
    const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
    for (let rnaMoleculeName in singularRnaComplexProps.rnaMoleculeProps) {
      const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
      for (let nucleotideIndexAsString in singularRnaMoleculeProps.nucleotideProps) {
        const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
        const formattedNucleotideIndex = nucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex;
        const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
        const singularLabelLineProps = singularNucleotideProps.labelLineProps;
        let outputFromLabelLine = Array(6).fill("");
        const x = scaleX * (singularNucleotideProps.x - inputMidpoint.x) + CSV_OUTPUT_MIDPOINT.x;
        const y = scaleY * (singularNucleotideProps.y - inputMidpoint.y) + CSV_OUTPUT_MIDPOINT.y;
        const nucleotideFontSize = Math.round(getFontSize(singularNucleotideProps.font) * CSV_NUCLEOTIDE_FONT_SCALAR);
        if (singularLabelLineProps !== undefined) {
          const point0 = singularLabelLineProps.points[0];
          const point1 = singularLabelLineProps.points[1];
          outputFromLabelLine = [
            numberToFormattedStringHelper(x + scaleX * point0.x),
            numberToFormattedStringHelper(y + scaleY * point0.y),
            ...(point1 === undefined ? ["", ""] : [numberToFormattedStringHelper(x + scaleX * point1.x), numberToFormattedStringHelper(y + scaleY * point1.y)]),
            numberToFormattedStringHelper(singularLabelLineProps.strokeWidth ?? DEFAULT_STROKE_WIDTH),
            colorToString(singularLabelLineProps.color)
          ];
        }
        const singularLabelContentProps = singularNucleotideProps.labelContentProps;
        let outputFromLabelContent = Array(5).fill("");
        if (singularLabelContentProps !== undefined) {
          const labelContentSvgElement = document.getElementById(getLabelContentHtmlElementId(
            rnaComplexIndex,
            rnaMoleculeName,
            nucleotideIndex
          ));
          if (labelContentSvgElement === null) {
            throw "Unfound LabelContent SVG element.";
          }
          const labelContentHtmlElementBounds = labelContentSvgElement.getBoundingClientRect();
          const labelContentFontSize = Math.round(getFontSize(singularLabelContentProps.font));
          outputFromLabelContent = [
            numberToFormattedStringHelper(x + scaleX * (singularLabelContentProps.x - labelContentHtmlElementBounds.width * 0.5)),
            numberToFormattedStringHelper(y + scaleY * singularLabelContentProps.y + nucleotideFontSize * 0.5),
            singularLabelContentProps.content,
            `${labelContentFontSize}`,
            colorToString(singularLabelContentProps.color)
          ];
        }
        outputLines.push([
          `${rnaMoleculeName}:${formattedNucleotideIndex}`,
          singularNucleotideProps.symbol,
          numberToFormattedStringHelper(x, 3),
          numberToFormattedStringHelper(y, 3),
          colorToString(singularNucleotideProps.color),
          `${nucleotideFontSize}`,
          ...outputFromLabelLine,
          ...outputFromLabelContent,
          singularRnaComplexProps.name
        ].join(","));
      }
    }
  }
  return outputLines.join("\n");
};