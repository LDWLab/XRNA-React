import { useContext, useEffect, useMemo, useState } from "react";
import InputWithValidator from "../../../components/generic/InputWithValidator";
import { ColorEditor } from "../../../components/generic/editors/ColorEditor";
import Color, { BLACK, areEqual } from "../../../data_structures/Color";
import { Nucleotide } from "../../../components/app_specific/Nucleotide";
import { FontEditor } from "../../../components/generic/editors/FontEditor";
import Font from "../../../data_structures/Font";
import { Context } from "../../../context/Context";
import { Setting } from "../../Setting";

export namespace RnaCycleInteractionConstraintEditMenu {
  export type Props = {
    initialRadius : number,
    minimumRadius : number,
    updatePositionsHelper : (
      newRadius : number,
      repositionAnnotationsFlag : boolean
    ) => void,
    cycleGraphNucleotides : Array<Nucleotide.ExternalProps>,
    branchNucleotides : Array<Nucleotide.ExternalProps>,
    rerender : () => void,
    getRadius : () => number
  };

  export function Component(props : Props) {
    const {
      initialRadius,
      minimumRadius,
      updatePositionsHelper : _updatePositionsHelper,
      cycleGraphNucleotides,
      branchNucleotides,
      rerender,
      getRadius
    } = props;
    // Begin context data.
    const resetDataTrigger = useContext(Context.OrientationEditor.ResetDataTrigger);
    const settingsRecord = useContext(Context.App.Settings);
    const repositionAnnotationsFlag = settingsRecord[Setting.AUTOMATICALLY_REPOSITION_ANNOTATIONS] as boolean;
    const pushToUndoStack = useContext(Context.App.PushToUndoStack);
    // Begin state data.
    const [
      radius,
      setRadius
    ] = useState(initialRadius);
    const [
      color,
      setColor
    ] = useState(structuredClone(BLACK));
    const [
      font,
      setFont
    ] = useState(structuredClone(Font.DEFAULT));
    const [
      positionsHaveBeenUpdatedFlag,
      setPositionsHaveBeenUpdatedFlag
    ] = useState(false);
    function updatePositionsHelper(
      newRadius : number,
      repositionAnnotationsFlag : boolean
    ) {
      if (!positionsHaveBeenUpdatedFlag) {
        pushToUndoStack();
      }
      _updatePositionsHelper(
        newRadius,
        repositionAnnotationsFlag
      );
      setPositionsHaveBeenUpdatedFlag(true);
    }
    // Begin effects.
    useEffect(
      function() {
        setRadius(getRadius());
      },
      [resetDataTrigger]
    );
    useEffect(
      function() {
        let singleColorFlag = true;
        const singleColorCandidate = cycleGraphNucleotides.length === 0 ? BLACK : cycleGraphNucleotides[0].color ?? BLACK;
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
          updatePositionsHelper(
            radius,
            repositionAnnotationsFlag
          );
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
            updatePositionsHelper(
              newRadius,
              repositionAnnotationsFlag
            );
          }}
          min = {minimumRadius}
        />
      </label>
      <br/>
      <ColorEditor.Component
        color = {color}
        setColorHelper = {function(newColor) {
          setColor(newColor);
          for (const singularNucleotideProps of cycleGraphNucleotides) {
            singularNucleotideProps.color = newColor;
          }
          for (const singularNucleotideProps of branchNucleotides) {
            singularNucleotideProps.color = newColor;
          }
          rerender();
        }}
      />
      <FontEditor.Component
        {...font}
        setFont = {function(newFont) {
          setFont(newFont);
          for (const singularNucleotideProps of cycleGraphNucleotides) {
            singularNucleotideProps.font = newFont;
          }
          for (const singularNucleotideProps of branchNucleotides) {
            singularNucleotideProps.font = newFont;
          }
          rerender();
        }}
      />
    </>;
  }
};