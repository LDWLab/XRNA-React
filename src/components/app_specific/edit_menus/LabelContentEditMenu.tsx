import { useEffect, useState } from "react";
import { FullKeys, RnaComplexProps } from "../../../App";
import { LabelContent } from "../LabelContent";
import Font from "../../../data_structures/Font";
import { DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT, DEFAULT_STROKE_WIDTH } from "../../../utils/Constants";
import { ColorEditor } from "./ColorEditor";
import Color from "../../../data_structures/Color";
import InputWithValidator from "../../generic/InputWithValidator";

export namespace LabelContentEditMenu {
  export type Props = {
    fullKeys : FullKeys,
    rnaComplexProps : RnaComplexProps,
    triggerRerender : () => void
  };

  export function Component(props : Props) {
    const {
      fullKeys,
      rnaComplexProps,
      triggerRerender,
    } = props;
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex
    } = fullKeys;
    const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
    const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
    const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
    const labelContentProps = singularNucleotideProps.labelContentProps as LabelContent.ExternalProps;
    // Begin state data.
    const [
      content,
      setContent
    ] = useState(labelContentProps.content);
    const [
      size,
      setSize
    ] = useState<string | number>("");
    const [
      style,
      setStyle
    ] = useState("");
    const [
      weight,
      setWeight
    ] = useState("");
    const [
      family,
      setFamily
    ] = useState("");
    const [
      strokeWidth,
      setStrokeWidth
    ] = useState(labelContentProps.strokeWidth ?? DEFAULT_STROKE_WIDTH);
    const [
      x,
      setX
    ] = useState(labelContentProps.x);
    const [
      y,
      setY
    ] = useState(labelContentProps.y);
    useEffect(
      function() {
        const font = labelContentProps.font ?? Font.DEFAULT;
        setSize(typeof font.size === "string" ? font.size : font.size.toFixed(DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT));
        setStyle(font.style);
        setWeight(font.weight);
        setFamily(font.family);
      },
      []
    );
    return <>
      <b>
        Edit label content for nucleotide #{nucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex} in RNA molecule "{rnaMoleculeName}" in RNA complex "{singularRnaComplexProps.name}":
      </b>
      <br/>
      <label>
        Content:&nbsp;
        <input
          type = "text"
          value = {content}
          onChange = {function(e) {
            setContent(e.target.value);
            labelContentProps.content = e.target.value;
            triggerRerender();
          }}
        />
      </label>
      <br/>
      <b>
        Style:
      </b>
      <br/>
      <label>
        Size:&nbsp;
        <input
          type = "text"
          value = {size}
          onChange = {function(e) {
            setSize(e.target.value);
            labelContentProps.font = {
              ...Font.DEFAULT,
              ...labelContentProps.font,
              size : e.target.value
            };
            triggerRerender();
          }}
        />
      </label>
      <br/>
      <label>
        Style:&nbsp;
        <input
          type = "text"
          value = {style}
          onChange = {function(e) {
            setStyle(e.target.value);
            labelContentProps.font = {
              ...Font.DEFAULT,
              ...labelContentProps.font,
              style : e.target.value
            };
            triggerRerender();
          }}
        />
      </label>
      <br/>
      <label>
        Weight:&nbsp;
        <input
          type = "text"
          value = {weight}
          onChange = {function(e) {
            setWeight(e.target.value);
            labelContentProps.font = {
              ...Font.DEFAULT,
              ...labelContentProps.font,
              weight : e.target.value
            };
            triggerRerender();
          }}
        />
      </label>
      <br/>
      <label>
        Family:&nbsp;
        <input
          type = "text"
          value = {family}
          onChange = {function(e) {
            setFamily(e.target.value);
            labelContentProps.font = {
              ...Font.DEFAULT,
              ...labelContentProps.font,
              family : e.target.value
            }
            triggerRerender();
          }}
        />
      </label>
      <br/>
      <label>
        Stroke width:&nbsp;
        <InputWithValidator.Number
          value = {strokeWidth}
          setValue = {function(newStrokeWidth) {
            setStrokeWidth(newStrokeWidth);
            labelContentProps.strokeWidth = newStrokeWidth;
            triggerRerender();
          }}
        />
      </label>
      <br/>
      <ColorEditor.Component
        setColorHelper = {function(newColor : Color) {
          labelContentProps.color = newColor;
          triggerRerender();
        }}
        color = {labelContentProps.color}
      />
      <b>
        Position:
      </b>
      <br/>
      <label>
        x:&nbsp;
        <InputWithValidator.Number
          value = {x}
          setValue = {function(newX) {
            setX(newX);
            labelContentProps.x = newX;
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
            setY(newY);
            labelContentProps.y = newY;
            triggerRerender();
          }}
        />
      </label>
    </>;
  }
}