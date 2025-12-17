import { useContext, useEffect, useState } from "react";
import InputWithValidator from "../../../generic/InputWithValidator";
import { ColorEditor } from "../../../generic/editors/ColorEditor";
import Color, { BLACK } from "../../../../data_structures/Color";
import { FontEditor } from "../../../generic/editors/FontEditor";
import Font from "../../../../data_structures/Font";
import { Context } from "../../../../context/Context";
import { Setting } from "../../../../ui/Setting";
import { useTheme } from "../../../../context/ThemeContext";

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
    getOrientation : () => Orientation,
    nucleotideCount : number,
    formattedLowerBoundingNucleotideIndex : number,
    formattedUpperBoundingNucleotideIndex : number,
    rnaMoleculeName : string,
    rnaComplexName : string
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
      getOrientation,
      nucleotideCount,
      formattedLowerBoundingNucleotideIndex,
      formattedUpperBoundingNucleotideIndex,
      rnaMoleculeName,
      rnaComplexName
    } = props;
    const { theme } = useTheme();

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
    return <div
      style = {{
        display : "flex",
        flexDirection : "column",
        gap : 12,
        fontSize : theme.typography.fontSize.md,
        color : theme.colors.text,
      }}
    >
      <div
        style = {{
          padding : "12px 14px",
          borderRadius : 10,
          border : `1px solid ${theme.colors.borderLight}`,
          background : theme.colors.surface,
          fontSize : theme.typography.fontSize.sm,
          lineHeight : 1.5,
          display : "flex",
          flexDirection : "column",
          gap : 6,
        }}
      >
        <span
          style = {{
            fontSize : theme.typography.fontSize.lg,
            fontWeight : theme.typography.fontWeight.semibold,
            color : theme.colors.text,
          }}
        >
          Edit single-stranded region
        </span>
        <span
          style = {{
            fontSize : theme.typography.fontSize.sm,
            color : theme.colors.textSecondary,
          }}
        >
          {`${nucleotideCount} nucleotides in the range (${formattedLowerBoundingNucleotideIndex}, ${formattedUpperBoundingNucleotideIndex})`}
        </span>
        <span
          style = {{
            fontSize : theme.typography.fontSize.sm,
            color : theme.colors.textSecondary,
          }}
        >
          {`In RNA molecule "${rnaMoleculeName}"`}
        </span>
        <span
          style = {{
            fontSize : theme.typography.fontSize.sm,
            color : theme.colors.textSecondary,
          }}
        >
          {`In RNA complex "${rnaComplexName}"`}
        </span>
      </div>

      <div
        style = {{
          padding : "10px 12px",
          borderRadius : 10,
          border : `1px solid ${theme.colors.borderLight}`,
          background : theme.colors.surface,
        }}
      >
        <div
          style = {{
            marginBottom : 8,
            fontSize : theme.typography.fontSize.sm,
            color : theme.colors.textSecondary,
          }}
        >
          Orientation
        </div>
        <div
          style = {{
            display : "flex",
            flexDirection : "column",
            gap : 6,
          }}
        >
          <label
            style = {{
              display : "flex",
              alignItems : "center",
              gap : 8,
            }}
          >
            <input
              type = "radio"
              value = "clockwise"
              name = {radioButtonName}
              onChange = {function() {
                setOrientation(Orientation.CLOCKWISE);
              }}
              checked = {orientation === Orientation.CLOCKWISE}
            />
            <span>Clockwise</span>
          </label>
          <label
            style = {{
              display : "flex",
              alignItems : "center",
              gap : 8,
            }}
          >
            <input
              type = "radio"
              value = "straight"
              name = {radioButtonName}
              onChange = {function() {
                setOrientation(Orientation.STRAIGHT);
              }}
              checked = {orientation === Orientation.STRAIGHT}
            />
            <span>Straight</span>
          </label>
          <label
            style = {{
              display : "flex",
              alignItems : "center",
              gap : 8,
            }}
          >
            <input
              type = "radio"
              value = "counterclockwise"
              name = {radioButtonName}
              onChange = {function() {
                setOrientation(Orientation.COUNTERCLOCKWISE);
              }}
              checked = {orientation === Orientation.COUNTERCLOCKWISE}
            />
            <span>Counterclockwise</span>
          </label>
        </div>
      </div>

      {(orientation === Orientation.CLOCKWISE || orientation === Orientation.COUNTERCLOCKWISE) && (
        <div
          style = {{
            padding : "10px 12px",
            borderRadius : 10,
            border : `1px solid ${theme.colors.borderLight}`,
            background : theme.colors.surface,
          }}
        >
          <div
            style = {{
              marginBottom : 6,
              fontSize : theme.typography.fontSize.sm,
              color : theme.colors.textSecondary,
            }}
          >
            Displacement along normal
          </div>
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
        </div>
      )}

      <div
        style = {{
          display : "flex",
          flexDirection : "column",
          gap : 8,
          padding : "10px 12px",
          borderRadius : 10,
          border : `1px solid ${theme.colors.borderLight}`,
          background : theme.colors.surface,
        }}
      >
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
      </div>
    </div>;
  }
}