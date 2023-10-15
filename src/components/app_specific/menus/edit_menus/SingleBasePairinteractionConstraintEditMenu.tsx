import { useContext, useEffect, useMemo, useState } from "react";
import BasePair from "../../BasePair";
import { AppSpecificOrientationEditor } from "../../editors/AppSpecificOrientationEditor";
import Color, { BLACK } from "../../../../data_structures/Color";
import { ColorEditor } from "../../../generic/editors/ColorEditor";
import { Nucleotide } from "../../Nucleotide";
import { Context } from "../../../../context/Context";

export namespace SingleBasePairInteractionConstraintEditMenu {
  export type Props = AppSpecificOrientationEditor.SimplifiedProps & {
    basePairType : BasePair.Type,
    initialColor : Color,
    boundingNucleotides : Array<Nucleotide.ExternalProps>,
    allNucleotides : Array<Nucleotide.ExternalProps>
  };

  export function Component(props : Props) {
    const {
      initialColor,
      onUpdatePositions,
      boundingNucleotides,
      allNucleotides
    } = props;
    // Begin context data.
    const interactionConstraintOptions = useContext(Context.App.InteractionConstraintOptions);
    const {
      affectHairpinNucleotidesFlag
    } = interactionConstraintOptions;
    // Begin state data.
    const [
      color,
      setColor
    ] = useState(BLACK);
    // Begin memo data.
    const nucleotidesToAffect = useMemo(
      function() {
        return affectHairpinNucleotidesFlag ? allNucleotides : boundingNucleotides
      },
      [affectHairpinNucleotidesFlag]
    );
    // Begin effects.
    useEffect(
      function() {
        setColor(color);
      },
      [initialColor]
    );
    return <>
      Base-pair type: {props.basePairType.toLocaleLowerCase()}
      <br/>
      <AppSpecificOrientationEditor.Simplified
        {...props}
        positions = {nucleotidesToAffect}
      />
      <ColorEditor.Component
        color = {color}
        setColorHelper = {function(newColor) {
          for (const nucleotide of nucleotidesToAffect) {
            nucleotide.color = newColor;
          }
          onUpdatePositions();
          setColor(newColor);
        }}
      />
    </>;
  }
}