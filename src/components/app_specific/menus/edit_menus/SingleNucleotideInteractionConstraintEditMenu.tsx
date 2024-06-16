import { useContext, useEffect, useMemo, useState } from "react";
import { RnaComplexProps, FullKeys } from "../../../../App";
import { Nucleotide } from "../../Nucleotide";
import { Vector2D, distance } from "../../../../data_structures/Vector2D";
import { DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT } from "../../../../utils/Constants";
import InputWithValidator from "../../../generic/InputWithValidator";
import { ColorEditor } from "../../../generic/editors/ColorEditor";
import { BLACK } from "../../../../data_structures/Color";
import { FontEditor } from "../../../generic/editors/FontEditor";
import Font from "../../../../data_structures/Font";
import { Context } from "../../../../context/Context";

export namespace SingleNucleotideInteractionConstraintEditMenu {
  export type Props = {
    rnaComplexProps : RnaComplexProps,
    fullKeys : FullKeys,
    triggerRerender : () => void
  };

  export function Component(props : Props) {
    const {
      rnaComplexProps,
      fullKeys,
      triggerRerender
    } = props;
    // Begin context data.
    const resetDataTrigger = useContext(Context.OrientationEditor.ResetDataTrigger);
    // Begin memo data.
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex,
      singularRnaComplexProps,
      singularRnaMoleculeProps,
      singularNucleotideProps
    } = useMemo(
      function() {
        const {
          rnaComplexIndex,
          rnaMoleculeName,
          nucleotideIndex
        } = fullKeys;
        const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
        const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
        const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
        return {
          ...fullKeys,
          singularRnaComplexProps,
          singularRnaMoleculeProps,
          singularNucleotideProps
        };
      },
      [fullKeys]
    );
    const {
    } = fullKeys;
    // Begin state data.
    const [
      symbol,
      _setSymbol
    ] = useState(singularNucleotideProps.symbol);
    const [
      x,
      _setX
    ] = useState(singularNucleotideProps.x);
    const [
      y,
      _setY
    ] = useState(singularNucleotideProps.y);
    const [
      color,
      setColor
    ] = useState(singularNucleotideProps.color ?? BLACK);
    const [
      font,
      setFont
    ] = useState(singularNucleotideProps.font ?? Font.DEFAULT);
    const [
      symbolChangedFlag,
      setSymbolChangedFlag
    ] = useState(false);
    const [
      positionChangedFlag,
      setPositionChangedFlag
    ] = useState(false);
    // Begin state-associated helper functions.
    function setSymbol(newSymbol : Nucleotide.Symbol) {
      if (!symbolChangedFlag) {
        pushtoUndoStack();
      }
      _setSymbol(newSymbol);
      setSymbolChangedFlag(true);
    }
    function setX(newX : number) {
      if (!positionChangedFlag) {
        pushtoUndoStack();
      }
      _setX(newX);
      setPositionChangedFlag(true);
    }
    function setY(newY : number) {
      if (!positionChangedFlag) {
        pushtoUndoStack();
      }
      _setY(newY);
      setPositionChangedFlag(true);
    }
    // Begin context data.
    const pushtoUndoStack = useContext(Context.App.PushToUndoStack);
    // Begin memo data.
    const previousNucleotidePosition : Vector2D | undefined = useMemo(
      function() {
        return (nucleotideIndex - 1) in singularRnaMoleculeProps.nucleotideProps ? singularRnaMoleculeProps.nucleotideProps[nucleotideIndex - 1] : undefined;
      },
      [nucleotideIndex]
    );
    const nextNucleotidePosition : Vector2D | undefined = useMemo(
      function() {
        return (nucleotideIndex + 1) in singularRnaMoleculeProps.nucleotideProps ? singularRnaMoleculeProps.nucleotideProps[nucleotideIndex + 1] : undefined
      },
      [nucleotideIndex]
    );
    const previousNucleotideDistanceJsx = useMemo(
      function() {
        return previousNucleotidePosition === undefined ? <></> : <>
          Distance to previous nucleotide: {distance(
            {
              x,
              y
            },
            previousNucleotidePosition
          ).toFixed(DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT)}
        </>
      },
      [
        previousNucleotidePosition,
        x,
        y
      ]
    );
    const nextNucleotideDistanceJsx = useMemo(
      function() {
        return nextNucleotidePosition === undefined ? <></> : <>
          <br/>
          Distance to next nucleotide: {distance(
            {
              x,
              y
            },
            nextNucleotidePosition
          ).toFixed(DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT)}
        </>;
      },
      [
        nextNucleotidePosition,
        x,
        y
      ]
    );
    // Begin effects.
    useEffect(
      function() {
        _setSymbol(singularNucleotideProps.symbol);
        _setX(singularNucleotideProps.x);
        _setY(singularNucleotideProps.y);
      },
      [
        fullKeys,
        resetDataTrigger
      ]
    );
    useEffect(
      function() {
        setColor(singularNucleotideProps.color ?? BLACK);
      },
      [singularNucleotideProps.color]
    );
    useEffect(
      function() {
        setFont(singularNucleotideProps.font ?? Font.DEFAULT);
      },
      [singularNucleotideProps.font]
    );
    return <>
      {previousNucleotideDistanceJsx}
      {nextNucleotideDistanceJsx}
      <br/>
      <label>
        Symbol:&nbsp;
        <select
          value = {symbol}
          onChange = {function(e) {
            const newSymbol = e.target.value as Nucleotide.Symbol;
            setSymbol(newSymbol);
            singularNucleotideProps.symbol = newSymbol;
            triggerRerender();
          }}
        >
          {Nucleotide.symbols.map(function(symbolI : Nucleotide.Symbol) {
            return <option
              key = {symbolI}
              value = {symbolI}
            >
              {symbolI}
            </option>;
          })}
        </select>
      </label>
      <br/>
      <label>
        x:&nbsp;
        <InputWithValidator.Number
          value = {x}
          setValue = {function(newX) {
            singularNucleotideProps.x = newX;
            setX(newX);
            triggerRerender();
          }}
        />
      </label>
      <br/>
      <label>
        y:&nbsp;
        <InputWithValidator.Number
          value = {y}
          setValue = {function(newY) {
            singularNucleotideProps.y = newY;
            setY(newY);
            triggerRerender();
          }}
        />
      </label>
      <br/>
      <ColorEditor.Component
        color = {color}
        setColorHelper = {function(newColor) {
          singularNucleotideProps.color = newColor;
          setColor(newColor);
          triggerRerender();
        }}
      />
      <FontEditor.Component
        {...font}
        setFont = {function(newFont) {
          singularNucleotideProps.font = newFont;
          setFont(newFont);
          triggerRerender();
        }}
      />
    </>;
  }
}