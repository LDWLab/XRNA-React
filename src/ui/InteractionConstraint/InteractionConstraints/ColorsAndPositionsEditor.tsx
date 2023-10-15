import { useEffect, useState } from "react";
import Color, { BLACK, areEqual } from "../../../data_structures/Color";
import { AppSpecificOrientationEditor } from "../../../components/app_specific/editors/AppSpecificOrientationEditor";
import { Nucleotide } from "../../../components/app_specific/Nucleotide";
import { ColorEditor } from "../../../components/generic/editors/ColorEditor";

export namespace ColorsAndPositionsEditor {
  export type Props = AppSpecificOrientationEditor.SimplifiedProps;

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
    // Begin effects.
    useEffect(
      function() {
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
        setColor(singleColorFlag ? singleColorCandidate : BLACK);
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
    </>;
  }
}