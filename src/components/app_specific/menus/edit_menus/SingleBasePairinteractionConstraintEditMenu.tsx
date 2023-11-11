import { useContext, useEffect, useMemo, useState } from "react";
import BasePair from "../../BasePair";
import { AppSpecificOrientationEditor } from "../../editors/AppSpecificOrientationEditor";
import Color, { BLACK } from "../../../../data_structures/Color";
import { ColorEditor } from "../../../generic/editors/ColorEditor";
import { Nucleotide } from "../../Nucleotide";
import { Context } from "../../../../context/Context";
import Font from "../../../../data_structures/Font";
import { FontEditor } from "../../../generic/editors/FontEditor";

export namespace SingleBasePairInteractionConstraintEditMenu {
  export type Props = AppSpecificOrientationEditor.SimplifiedProps & {
    basePairType : BasePair.Type,
    initialColor : Color,
    initialFont : Font,
    boundingNucleotides : Array<Nucleotide.ExternalProps>,
    allNucleotides : Array<Nucleotide.ExternalProps>
  };

  export function Component(props : Props) {
    const {
      initialColor,
      initialFont,
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
    ] = useState(initialColor ?? BLACK);
    const [
      font,
      setFont
    ] = useState(initialFont ?? Font.DEFAULT);
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
        setColor(initialColor);
      },
      [initialColor]
    );
    useEffect(
      function() {
        setFont(font);
      },
      [initialFont]
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
      <FontEditor.Component
        {...font}
        setFont = {function(newFont : Font) {
          for (const nucleotide of nucleotidesToAffect) {
            nucleotide.font = newFont;
          }
          onUpdatePositions();
          setFont(newFont);
        }}
      />
    </>;
  }
}