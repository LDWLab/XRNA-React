import { useContext, useEffect, useState } from "react";
import Color, { BLACK, areEqual } from "../../../data_structures/Color";
import { AppSpecificOrientationEditor } from "../../../components/app_specific/editors/AppSpecificOrientationEditor";
import { Nucleotide } from "../../../components/app_specific/Nucleotide";
import { ColorEditor } from "../../../components/generic/editors/ColorEditor";
import Font from "../../../data_structures/Font";
import { FontEditor } from "../../../components/generic/editors/FontEditor";
import { PathEditor } from "../../../components/generic/editors/PathEditor";
import { Context } from "../../../context/Context";
import { DEFAULT_STROKE_WIDTH } from "../../../utils/Constants";

export namespace AllInOneEditor {
  export type Props = AppSpecificOrientationEditor.Props

  export function Component(props : Props) {
    const {
      positions,
      onUpdatePositions : _onUpdatePositions
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
    const [
      pathStyle,
      setPathStyle
    ] = useState<PathEditor.PathStyle>({
      pathColor: BLACK,
      pathLineWidth: DEFAULT_STROKE_WIDTH,
      pathCurvature: 0
    });
    const [
      positionsChangedFlag,
      setPositionsChangedFlag
    ] = useState(false);
    function onUpdatePositions(pushToUndoStackFlag : boolean) {
      if (!positionsChangedFlag && pushToUndoStackFlag) {
        pushToUndoStack();
      }
      _onUpdatePositions(false);
      setPositionsChangedFlag(true);
    }
    // Begin context data.
    const pushToUndoStack = useContext(Context.App.PushToUndoStack);
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
        
        // Check for single path style
        let singlePathColorFlag = true;
        const singlePathColorCandidate = singularNucleotideProps0.pathColor ?? BLACK;
        for (let i = 1; i < allNucleotides.length; i++) {
          if (!areEqual(
            singlePathColorCandidate,
            allNucleotides[i].pathColor ?? BLACK
          )) {
            singlePathColorFlag = false;
            break;
          }
        }
        
        let singlePathLineWidthFlag = true;
        const singlePathLineWidthCandidate = singularNucleotideProps0.pathLineWidth ?? DEFAULT_STROKE_WIDTH;
        for (let i = 1; i < allNucleotides.length; i++) {
          if (singlePathLineWidthCandidate !== (allNucleotides[i].pathLineWidth ?? DEFAULT_STROKE_WIDTH)) {
            singlePathLineWidthFlag = false;
            break;
          }
        }
        
        let singlePathCurvatureFlag = true;
        const singlePathCurvatureCandidate = singularNucleotideProps0.pathCurvature ?? 0;
        for (let i = 1; i < allNucleotides.length; i++) {
          if (singlePathCurvatureCandidate !== (allNucleotides[i].pathCurvature ?? 0)) {
            singlePathCurvatureFlag = false;
            break;
          }
        }
        
        setColor(singleColorFlag ? singleColorCandidate : BLACK);
        setFont(singleFontFlag ? singleFontCandidate : Font.DEFAULT);
        setPathStyle({
          pathColor: singlePathColorFlag ? singlePathColorCandidate : BLACK,
          pathLineWidth: singlePathLineWidthFlag ? singlePathLineWidthCandidate : DEFAULT_STROKE_WIDTH,
          pathCurvature: singlePathCurvatureFlag ? singlePathCurvatureCandidate : 0
        });
      },
      [positions]
    );
    return <>
      <AppSpecificOrientationEditor.Component
        {...props}
        onUpdatePositions = {onUpdatePositions}
      />
      <ColorEditor.Component
        color = {color}
        setColorHelper = {function(newColor) {
          for (const singularNucleotideProps of allNucleotides) {
            singularNucleotideProps.color = newColor;
          }
          setColor(newColor);
          _onUpdatePositions(false);
        }}
      />
      <FontEditor.Component
        {...font}
        setFont = {function(newFont) {
          for (const singularNucleotideProps of allNucleotides) {
            singularNucleotideProps.font = newFont;
          }
          setFont(newFont);
          _onUpdatePositions(false);
        }}
      />
      <PathEditor.Component
        pathStyle = {pathStyle}
        setPathStyle = {function(newPathStyle) {
          for (const singularNucleotideProps of allNucleotides) {
            if (newPathStyle.pathColor !== undefined) {
              singularNucleotideProps.pathColor = newPathStyle.pathColor;
            }
            if (newPathStyle.pathLineWidth !== undefined) {
              singularNucleotideProps.pathLineWidth = newPathStyle.pathLineWidth;
            }
            if (newPathStyle.pathCurvature !== undefined) {
              singularNucleotideProps.pathCurvature = newPathStyle.pathCurvature;
            }
          }
          setPathStyle(newPathStyle);
          _onUpdatePositions(false);
        }}
      />
    </>;
  }

  export type SimplifiedProps = AppSpecificOrientationEditor.SimplifiedProps;

  export function Simplified(props : SimplifiedProps) {
    const {
      positions,
      onUpdatePositions : _onUpdatePositions
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
    const [
      pathStyle,
      setPathStyle
    ] = useState<PathEditor.PathStyle>({
      pathColor: BLACK,
      pathLineWidth: DEFAULT_STROKE_WIDTH,
      pathCurvature: 0
    });
    const [
      positionsChangedFlag,
      setPositionsChangedFlag
    ] = useState(false);
    function onUpdatePositions(pushToUndoStackFlag : boolean) {
      if (!positionsChangedFlag && pushToUndoStackFlag) {
        pushToUndoStack();
      }
      _onUpdatePositions(false);
      setPositionsChangedFlag(true);
    }
    // Begin context data.
    const pushToUndoStack = useContext(Context.App.PushToUndoStack);
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
        
        // Check for single path style
        let singlePathColorFlag = true;
        const singlePathColorCandidate = singularNucleotideProps0.pathColor ?? BLACK;
        for (let i = 1; i < allNucleotides.length; i++) {
          if (!areEqual(
            singlePathColorCandidate,
            allNucleotides[i].pathColor ?? BLACK
          )) {
            singlePathColorFlag = false;
            break;
          }
        }
        
        let singlePathLineWidthFlag = true;
        const singlePathLineWidthCandidate = singularNucleotideProps0.pathLineWidth ?? DEFAULT_STROKE_WIDTH;
        for (let i = 1; i < allNucleotides.length; i++) {
          if (singlePathLineWidthCandidate !== (allNucleotides[i].pathLineWidth ?? DEFAULT_STROKE_WIDTH)) {
            singlePathLineWidthFlag = false;
            break;
          }
        }
        
        let singlePathCurvatureFlag = true;
        const singlePathCurvatureCandidate = singularNucleotideProps0.pathCurvature ?? 0;
        for (let i = 1; i < allNucleotides.length; i++) {
          if (singlePathCurvatureCandidate !== (allNucleotides[i].pathCurvature ?? 0)) {
            singlePathCurvatureFlag = false;
            break;
          }
        }
        
        setColor(singleColorFlag ? singleColorCandidate : BLACK);
        setFont(singleFontFlag ? singleFontCandidate : Font.DEFAULT);
        setPathStyle({
          pathColor: singlePathColorFlag ? singlePathColorCandidate : BLACK,
          pathLineWidth: singlePathLineWidthFlag ? singlePathLineWidthCandidate : DEFAULT_STROKE_WIDTH,
          pathCurvature: singlePathCurvatureFlag ? singlePathCurvatureCandidate : 0
        });
      },
      [positions]
    );
    return <>
      <AppSpecificOrientationEditor.Simplified
        {...props}
        onUpdatePositions = {onUpdatePositions}
      />
      <ColorEditor.Component
        color = {color}
        setColorHelper = {function(newColor) {
          for (const singularNucleotideProps of allNucleotides) {
            singularNucleotideProps.color = newColor;
          }
          setColor(newColor);
          _onUpdatePositions(false);
        }}
      />
      <FontEditor.Component
        {...font}
        setFont = {function(newFont) {
          for (const singularNucleotideProps of allNucleotides) {
            singularNucleotideProps.font = newFont;
          }
          setFont(newFont);
          _onUpdatePositions(false);
        }}
      />
      <PathEditor.Component
        pathStyle = {pathStyle}
        setPathStyle = {function(newPathStyle) {
          for (const singularNucleotideProps of allNucleotides) {
            if (newPathStyle.pathColor !== undefined) {
              singularNucleotideProps.pathColor = newPathStyle.pathColor;
            }
            if (newPathStyle.pathLineWidth !== undefined) {
              singularNucleotideProps.pathLineWidth = newPathStyle.pathLineWidth;
            }
            if (newPathStyle.pathCurvature !== undefined) {
              singularNucleotideProps.pathCurvature = newPathStyle.pathCurvature;
            }
          }
          setPathStyle(newPathStyle);
          _onUpdatePositions(false);
        }}
      />
    </>;
  }
}