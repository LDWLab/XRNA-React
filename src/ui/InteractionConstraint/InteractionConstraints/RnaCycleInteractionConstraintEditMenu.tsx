import { useEffect, useMemo, useState } from "react";
import InputWithValidator from "../../../components/generic/InputWithValidator";
import { ColorEditor } from "../../../components/generic/editors/ColorEditor";
import Color, { BLACK, areEqual } from "../../../data_structures/Color";
import { Nucleotide } from "../../../components/app_specific/Nucleotide";

export namespace RnaCycleInteractionConstraintEditMenu {
  export type Props = {
    initialRadius : number,
    minimumRadius : number,
    updatePositionsHelper : (newRadius : number) => void,
    cycleGraphNucleotides : Array<Nucleotide.ExternalProps>,
    rerender : () => void
  };

  export function Component(props : Props) {
    const {
      initialRadius,
      minimumRadius,
      updatePositionsHelper,
      cycleGraphNucleotides,
      rerender
    } = props;
    // Begin state data.
    const [
      radius,
      setRadius
    ] = useState(initialRadius);
    const [
      color,
      setColor
    ] = useState(structuredClone(BLACK));
    // Begin effects.
    useEffect(
      function() {
        setRadius(initialRadius);
      },
      [initialRadius]
    );
    useEffect(
      function() {
        let singleColorFlag = true;
        const singleColorCandidate = cycleGraphNucleotides[0].color ?? BLACK;
        for (let i = 0; i < cycleGraphNucleotides.length; i++) {
          const singularNucleotideProps = cycleGraphNucleotides[i];
          if (!areEqual(singleColorCandidate, singularNucleotideProps.color ?? BLACK)) {
            singleColorFlag = false;
            break;
          }
        }
      },
      [cycleGraphNucleotides]
    );
    return <>
      <button
        onClick = {function() {
          updatePositionsHelper(radius);
        }}
      >
        Normalize
      </button>
      <br/>
      <label>
        Radius:&nbsp;
        <InputWithValidator.Number
          value = {radius}
          setValue = {function(newRadius : number) {
            setRadius(newRadius);
            updatePositionsHelper(newRadius);
          }}
          min = {minimumRadius}
        />
      </label>
      <ColorEditor.Component
        color = {color}
        setColorHelper = {function(newColor) {
          setColor(newColor);
          for (const singularNucleotideProps of cycleGraphNucleotides) {
            singularNucleotideProps.color = newColor;
          }
          rerender();
        }}
      />
    </>;
  }
};