import { useEffect, useState } from "react";
import Color, { BLACK, areEqual } from "../../../data_structures/Color";
import { AppSpecificOrientationEditor } from "../../../components/app_specific/editors/AppSpecificOrientationEditor";
import { Nucleotide } from "../../../components/app_specific/Nucleotide";
import { ColorEditor } from "../../../components/generic/editors/ColorEditor";
import Font from "../../../data_structures/Font";
import { FontEditor } from "../../../components/generic/editors/FontEditor";

export namespace AllInOneEditor {
  export type Props = AppSpecificOrientationEditor.Props;

  export function Component(props : Props) {
    const {
      positions,
      onUpdatePositions
    } = props;
    const allNucleotides = positions as Array<Nucleotide.ExternalProps>;
    // Begin state data.
    const [
      color,
      setColor
    ] = useState(BLACK);
    const [
      font,
      setFont
    ] = useState(Font.DEFAULT);
    // Begin effects.
    useEffect(
      function() {
        if (allNucleotides.length === 0) {
          return;
        }

        let singleColorFlag = true;
        const singularNucleotideProps0 = allNucleotides[0];
        const singleColorCandidate = singularNucleotideProps0.color ?? BLACK;
        for (let i = 1; i < allNucleotides.length; i++) {
          if (!areEqual(
            singleColorCandidate,
            allNucleotides[i].color ?? BLACK
          )) {
            singleColorFlag = false;
            break;
          }
        }
        let singleFontFlag = true;
        const singleFontCandidate = singularNucleotideProps0.font ?? Font.DEFAULT;
        for (let i = 1; i < allNucleotides.length; i++) {
          if (!Font.areEqual(
            singleFontCandidate,
            allNucleotides[i].font ?? Font.DEFAULT
          )) {
            singleFontFlag = false;
            break;
          }
        }
        setColor(singleColorFlag ? singleColorCandidate : BLACK);
        setFont(singleFontFlag ? singleFontCandidate : Font.DEFAULT);
      },
      [positions]
    );
    return <>
      <AppSpecificOrientationEditor.Component
        {...props}
      />
      <ColorEditor.Component
        color = {color}
        setColorHelper = {function(newColor) {
          for (const singularNucleotideProps of allNucleotides) {
            singularNucleotideProps.color = newColor;
          }
          setColor(newColor);
          onUpdatePositions();
        }}
      />
      <FontEditor.Component
        {...font}
        setFont = {function(newFont) {
          for (const singularNucleotideProps of allNucleotides) {
            singularNucleotideProps.font = newFont;
          }
          setFont(newFont);
          onUpdatePositions();
        }}
      />
    </>;
  }

  export type SimplifiedProps = AppSpecificOrientationEditor.SimplifiedProps;

  export function Simplified(props : SimplifiedProps) {
    const {
      positions,
      onUpdatePositions
    } = props;
    const allNucleotides = positions as Array<Nucleotide.ExternalProps>;
    // Begin state data.
    const [
      color,
      setColor
    ] = useState(BLACK);
    const [
      font,
      setFont
    ] = useState(Font.DEFAULT);
    // Begin effects.
    useEffect(
      function() {
        if (allNucleotides.length === 0) {
          return;
        }
        let singleColorFlag = true;
        const singularNucleotideProps0 = allNucleotides[0];
        const singleColorCandidate = singularNucleotideProps0.color ?? BLACK;
        for (let i = 1; i < allNucleotides.length; i++) {
          if (!areEqual(
            singleColorCandidate,
            allNucleotides[i].color ?? BLACK
          )) {
            singleColorFlag = false;
            break;
          }
        }
        let singleFontFlag = true;
        const singleFontCandidate = singularNucleotideProps0.font ?? Font.DEFAULT;
        for (let i = 1; i < allNucleotides.length; i++) {
          if (!Font.areEqual(
            singleFontCandidate,
            allNucleotides[i].font ?? Font.DEFAULT
          )) {
            singleFontFlag = false;
            break;
          }
        }
        setColor(singleColorFlag ? singleColorCandidate : BLACK);
        setFont(singleFontFlag ? singleFontCandidate : Font.DEFAULT);
      },
      [positions]
    );
    return <>
      <AppSpecificOrientationEditor.Simplified
        {...props}
      />
      <ColorEditor.Component
        color = {color}
        setColorHelper = {function(newColor) {
          for (const singularNucleotideProps of allNucleotides) {
            singularNucleotideProps.color = newColor;
          }
          setColor(newColor);
          onUpdatePositions();
        }}
      />
      <FontEditor.Component
        {...font}
        setFont = {function(newFont) {
          for (const singularNucleotideProps of allNucleotides) {
            singularNucleotideProps.font = newFont;
          }
          setFont(newFont);
          onUpdatePositions();
        }}
      />
    </>;
  }
}