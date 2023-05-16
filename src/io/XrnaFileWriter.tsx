import { RnaComplexProps } from "../App";
import { compareBasePairKeys } from "../components/app_specific/RnaComplex";
import { BLACK, toHexadecimal } from "../data_structures/Color";
import Font, { PartialFont } from "../data_structures/Font";
import { DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT, DEFAULT_STROKE_WIDTH } from "../utils/Constants";

export function xrnaFileWriter(
  rnaComplexProps : RnaComplexProps,
  complexDocumentName : string
) : string {
  const xml = document.implementation.createDocument(
    null,
    null,
    null
  );
  const complexDocumentElement = xml.createElement("ComplexDocument");
  complexDocumentElement.setAttribute("Name", complexDocumentName);
  xml.appendChild(complexDocumentElement);

  const sceneNodeGeomElement = xml.createElement("SceneNodeGeom");
  sceneNodeGeomElement.setAttribute("CenterX", "0");
  sceneNodeGeomElement.setAttribute("CenterY", "0");
  sceneNodeGeomElement.setAttribute("Scale", "1");
  complexDocumentElement.appendChild(sceneNodeGeomElement);

  Object.values(rnaComplexProps).forEach(function(singularRnaComplexProps) {
    const complexElement = xml.createElement("Complex");
    complexElement.setAttribute(
      "Name",
      singularRnaComplexProps.name
    );
    complexDocumentElement.appendChild(complexElement);

    const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;

    Object.entries(singularRnaComplexProps.rnaMoleculeProps).forEach(function([
      rnaMoleculeName,
      singularRnaMoleculeProps
    ]) {
      const firstNucleotideIndex = singularRnaMoleculeProps.firstNucleotideIndex;
      const rnaMoleculeElement = xml.createElement("RNAMolecule");
      rnaMoleculeElement.setAttribute(
        "Name",
        rnaMoleculeName
      );
      complexElement.appendChild(rnaMoleculeElement);

      const nucListDataElement = xml.createElement("NucListData");
      nucListDataElement.setAttribute("StartNucID", `${firstNucleotideIndex}`);
      nucListDataElement.setAttribute("DataType", "NucChar.NucID.XPos.YPos");
      const flattenedNucleotideProps = Object.entries(singularRnaMoleculeProps.nucleotideProps).map(function([
        nucleotideIndexAsString,
        singularNucleotideProps
      ]) {
        return {
          nucleotideIndex : Number.parseInt(nucleotideIndexAsString),
          singularNucleotideProps
        };
      });
      nucListDataElement.innerHTML = flattenedNucleotideProps.map(function({
        nucleotideIndex,
        singularNucleotideProps
      }) {
        return [
          singularNucleotideProps.symbol,
          `${nucleotideIndex + firstNucleotideIndex}`,
          singularNucleotideProps.x.toFixed(DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT),
          singularNucleotideProps.y.toFixed(DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT)
        ].join(" ");
      }).join("\n");
      rnaMoleculeElement.appendChild(nucListDataElement);

      let nucElement = xml.createElement("Nuc");
      nucElement.setAttribute("RefIDs", `${firstNucleotideIndex}-${firstNucleotideIndex + flattenedNucleotideProps.length - 1}`);
      nucElement.setAttribute("Color", "0");
      nucElement.setAttribute("FontID", "0");
      nucElement.setAttribute("FontSize", "8");
      rnaMoleculeElement.appendChild(nucElement);

      flattenedNucleotideProps.forEach(function({
        nucleotideIndex,
        singularNucleotideProps
      }) {
        const formattedNucleotideIndex = firstNucleotideIndex + nucleotideIndex;
        const font = singularNucleotideProps.font ?? Font.DEFAULT;
        nucElement = xml.createElement("Nuc");
        nucElement.setAttribute("RefID", `${formattedNucleotideIndex}`);
        nucElement.setAttribute("Color", toHexadecimal(singularNucleotideProps.color ?? BLACK));
        nucElement.setAttribute("FontID", PartialFont.toFontId(font).toString());
        nucElement.setAttribute("FontSize", font.size.toString());
        rnaMoleculeElement.appendChild(nucElement);

        if (singularNucleotideProps.labelLineProps !== undefined || singularNucleotideProps.labelContentProps !== undefined) {
          nucElement = xml.createElement("Nuc");
          nucElement.setAttribute("RefID", `${formattedNucleotideIndex}`);
          rnaMoleculeElement.appendChild(nucElement);

          const labelListElement = xml.createElement("LabelList");
          let innerHtmlArray = [];
          if (singularNucleotideProps.labelLineProps !== undefined) {
            const labelLineProps = singularNucleotideProps.labelLineProps;
            innerHtmlArray.push([
              "l",
              labelLineProps.x0.toFixed(DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT),
              labelLineProps.y0.toFixed(DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT),
              labelLineProps.x1.toFixed(DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT),
              labelLineProps.y1.toFixed(DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT),
              (labelLineProps.strokeWidth ?? DEFAULT_STROKE_WIDTH).toFixed(DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT),
              toHexadecimal(labelLineProps.color ?? BLACK),
              "0.0",
              "0",
              "0",
              "0",
              "0"
            ].join(" "));
          }
          if (singularNucleotideProps.labelContentProps !== undefined) {
            const labelContentProps = singularNucleotideProps.labelContentProps;
            const font = labelContentProps.font ?? Font.DEFAULT;
            innerHtmlArray.push([
              "s",
              labelContentProps.x.toFixed(DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT),
              labelContentProps.y.toFixed(DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT),
              "0.0",
              font.size,
              PartialFont.toFontId(font),
              toHexadecimal(labelContentProps.color ?? BLACK),
              `"${labelContentProps.content}"`
            ].join(" "));
          }
          labelListElement.innerHTML = innerHtmlArray.join("\n");
          nucElement.appendChild(labelListElement);
        }
      });

      const basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName];
      Object.entries(basePairsPerRnaMolecule).forEach(function([
        nucleotideIndexAsString,
        mappedBasePairInformation
      ]) {
        const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
        if (compareBasePairKeys(
          {
            nucleotideIndex : nucleotideIndex,
            rnaMoleculeName
          },
          mappedBasePairInformation
        ) <= 0) {
          const basePairsElement = xml.createElement("BasePairs");
          basePairsElement.setAttribute("nucID", (nucleotideIndex + firstNucleotideIndex).toString());
          basePairsElement.setAttribute("length", "1");
          basePairsElement.setAttribute("bpNucID", (mappedBasePairInformation.nucleotideIndex + firstNucleotideIndex).toString());
          basePairsElement.setAttribute("bpName", mappedBasePairInformation.rnaMoleculeName);
          rnaMoleculeElement.appendChild(basePairsElement);
        }
      });
    })
  });
  return new XMLSerializer().serializeToString(xml.documentElement);
}