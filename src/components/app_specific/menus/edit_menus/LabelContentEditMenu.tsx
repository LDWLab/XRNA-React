import { useContext, useEffect, useMemo, useState } from "react";
import { FullKeys, RnaComplexProps } from "../../../../App";
import { LabelContent } from "../../LabelContent";
import Font from "../../../../data_structures/Font";
import { DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT, DEFAULT_STROKE_WIDTH } from "../../../../utils/Constants";
import { ColorEditor } from "../../../generic/editors/ColorEditor";
import Color from "../../../../data_structures/Color";
import InputWithValidator from "../../../generic/InputWithValidator";
import { Collapsible } from "../../../generic/Collapsible";
import { Context } from "../../../../context/Context";

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
    // Begin context data.
    const _triggerRerender = useContext(Context.OrientationEditor.ResetDataTrigger);
    // Begin memo data.
    const {
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex,
      singularRnaComplexProps,
      singularRnaMoleculeProps,
      singularNucleotideProps,
      labelContentProps
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
        const labelContentProps = singularNucleotideProps.labelContentProps as LabelContent.ExternalProps;
        return {
          rnaComplexIndex,
          rnaMoleculeName,
          nucleotideIndex,
          singularRnaComplexProps,
          singularRnaMoleculeProps,
          singularNucleotideProps,
          labelContentProps
        };
      },
      [fullKeys]
    );
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
    // Begin effects.
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
    useEffect(
      function() {
        let {
          content,
          strokeWidth,
          x,
          y,
          font
        } = labelContentProps;
        if (font === undefined) {
          font = Font.DEFAULT;
        }
        setContent(content);
        setStrokeWidth(strokeWidth ?? DEFAULT_STROKE_WIDTH);
        setX(x);
        setY(y);
        setSize(typeof font.size === "string" ? font.size : font.size.toFixed(DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT));
        setStyle(font.style);
        setWeight(font.weight);
        setFamily(font.family);
      },
      [labelContentProps]
    );
    useEffect(
      function() {
        setX(labelContentProps.x);
        setY(labelContentProps.y);
      },
      [_triggerRerender]
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
      <Collapsible.Component
        title = "Style"
      >
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
      </Collapsible.Component>
      <ColorEditor.Component
        setColorHelper = {function(newColor : Color) {
          labelContentProps.color = newColor;
          triggerRerender();
        }}
        color = {labelContentProps.color}
      />
      <Collapsible.Component
        title = "Position"
      >
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
      </Collapsible.Component>
    </>;
  }
}