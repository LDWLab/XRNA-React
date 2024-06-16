import { useContext, useEffect, useState } from "react";
import InputWithValidator from "../../../generic/InputWithValidator";
import { ColorEditor } from "../../../generic/editors/ColorEditor";
import Color, { BLACK } from "../../../../data_structures/Color";
import { FontEditor } from "../../../generic/editors/FontEditor";
import Font from "../../../../data_structures/Font";
import { Context } from "../../../../context/Context";
import { Setting } from "../../../../ui/Setting";

export namespace RnaSingleStrandInteractionConstraintEditMenu {
  export type Props = {
    updateSingleStrandPositions : (
      orientation : Orientation,
      displacementAlongNormal : number,
      repositionAnnotationsFlag : boolean
    ) => void,
    updateSingleStrandColors : (newColor : Color) => void,
    updateSingleStrandFonts : (newFont : Font) => void,
    initialColor : Color,
    initialFont : Font,
    getDisplacementAlongNormal : () => number,
    getOrientation : () => Orientation
  };

  export enum Orientation {
    CLOCKWISE = "clockwise",
    COUNTERCLOCKWISE = "counterclockwise",
    STRAIGHT = "straight"
  }

  export function Component(props : Props) {
    const {
      updateSingleStrandPositions,
      updateSingleStrandColors,
      updateSingleStrandFonts,
      initialColor,
      initialFont,
      getDisplacementAlongNormal,
      getOrientation
    } = props;
    // Begin context data.
    const resetDataTrigger = useContext(Context.OrientationEditor.ResetDataTrigger);
    const settingsRecord = useContext(Context.App.Settings);
    const repositionAnnotationsFlag = settingsRecord[Setting.AUTOMATICALLY_REPOSITION_ANNOTATIONS] as boolean;
    const pushToUndoStack = useContext(Context.App.PushToUndoStack);
    // Begin state data.
    const [
      orientation,
      _setOrientation
    ] = useState<Orientation>(getOrientation());
    const [
      displacementAlongNormal,
      _setDisplacementAlongNormal
    ] = useState(getDisplacementAlongNormal());
    const [
      color,
      setColor
    ] = useState(initialColor);
    const [
      font,
      setFont
    ] = useState(initialFont);
    const [
      displacementAlongNormalChangedFlag,
      setDisplacementAlongNormalChangedFlag
    ] = useState(false);
    const [
      orientationChangedFlag,
      setOrientationChangedFlag
    ] = useState(false);
    // Begin effects
    useEffect(
      function() {
        _setDisplacementAlongNormal(getDisplacementAlongNormal());
        _setOrientation(getOrientation());
      },
      [resetDataTrigger]
    );
    const radioButtonName = "orientation";
    function setOrientation(
      newOrientation : Orientation
    ) {
      if (!orientationChangedFlag) {
        pushToUndoStack();
      }
      _setOrientation(newOrientation);
      setOrientationChangedFlag(true);
      updateSingleStrandPositions(
        newOrientation,
        displacementAlongNormal,
        repositionAnnotationsFlag
      );
    }
    function setDisplacementAlongNormal(newDisplacementAlongNormal : number) {
      if (!displacementAlongNormalChangedFlag) {
        pushToUndoStack();
      }
      _setDisplacementAlongNormal(newDisplacementAlongNormal);
      setDisplacementAlongNormalChangedFlag(true);
    }
    useEffect(
      function() {
        setColor(initialColor);
      },
      [initialColor]
    );
    useEffect(
      function() {
        setFont(initialFont);
      },
      [initialFont]
    );
    return <>
      <b>
        Orientation:
      </b>
      <br/>
      <label>
        Clockwise:&nbsp;
        <input
          type = "radio"
          value = "clockwise"
          name = {radioButtonName}
          onChange = {function() {
            setOrientation(Orientation.CLOCKWISE);
          }}
          checked = {orientation === Orientation.CLOCKWISE}
        />
      </label>
      <br/>
      <label>
        Straight:&nbsp;
        <input
          type = "radio"
          value = "straight"
          name = {radioButtonName}
          onChange = {function() {
            setOrientation(Orientation.STRAIGHT);
          }}
          checked = {orientation === Orientation.STRAIGHT}
        />
      </label>
      <br/>
      <label>
        Counterclockwise:&nbsp;
        <input
          type = "radio"
          value = "counterclockwise"
          name = {radioButtonName}
          onChange = {function() {
            setOrientation(Orientation.COUNTERCLOCKWISE);
          }}
          checked = {orientation === Orientation.COUNTERCLOCKWISE}
        />
      </label>
      <br/>
      <label
        style = {{
          display : orientation === Orientation.CLOCKWISE || orientation === Orientation.COUNTERCLOCKWISE ? "block" : "none"
        }}
      >
        Displacement along normal:&nbsp;
        <InputWithValidator.Number
          value = {displacementAlongNormal}
          setValue = {function(newDisplacementAlongNormal) {
            setDisplacementAlongNormal(newDisplacementAlongNormal);
            updateSingleStrandPositions(
              orientation,
              newDisplacementAlongNormal,
              repositionAnnotationsFlag
            );
          }}
        />
      </label>
      <ColorEditor.Component
        color = {color}
        setColorHelper = {function(newColor) {
          updateSingleStrandColors(newColor);
          setColor(newColor);
        }}
      />
      <FontEditor.Component
        {...font}
        setFont = {function(newFont) {
          setFont(newFont);
          updateSingleStrandFonts(newFont);
        }}
      />
    </>;
  }
}