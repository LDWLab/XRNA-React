import { useEffect, useMemo, useState } from "react";
import { RnaComplexProps, FullKeys } from "../../../../App";
import { Nucleotide } from "../../Nucleotide";
import { Vector2D, distance } from "../../../../data_structures/Vector2D";
import { DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT } from "../../../../utils/Constants";
import InputWithValidator from "../../../generic/InputWithValidator";
import { ColorEditor } from "../../../generic/editors/ColorEditor";
import { BLACK } from "../../../../data_structures/Color";
import { FontEditor } from "../../../generic/editors/FontEditor";
import Font from "../../../../data_structures/Font";

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
      setSymbol
    ] = useState(singularNucleotideProps.symbol);
    const [
      x,
      setX
    ] = useState(singularNucleotideProps.x);
    const [
      y,
      setY
    ] = useState(singularNucleotideProps.y);
    const [
      color,
      setColor
    ] = useState(singularNucleotideProps.color ?? BLACK);
    const [
      font,
      setFont
    ] = useState(singularNucleotideProps.font ?? Font.DEFAULT);
    // Begin memo data.
    const previousNucleotidePosition : Vector2D | undefined = useMemo(
      function() {
        return (nucleotideIndex - 1) in singularRnaMoleculeProps.nucleotideProps ? singularRnaMoleculeProps.nucleotideProps[nucleotideIndex - 1] : undefined;
      },
      [fullKeys]
    );
    const nextNucleotidePosition : Vector2D | undefined = useMemo(
      function() {
        return (nucleotideIndex + 1) in singularRnaMoleculeProps.nucleotideProps ? singularRnaMoleculeProps.nucleotideProps[nucleotideIndex + 1] : undefined
      },
      [fullKeys]
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
        setSymbol(singularNucleotideProps.symbol);
        setX(singularNucleotideProps.x);
        setY(singularNucleotideProps.y);
      },
      [fullKeys]
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