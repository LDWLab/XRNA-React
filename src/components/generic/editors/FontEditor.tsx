import { useContext, useState } from "react";
import Font from "../../../data_structures/Font";
import { Collapsible } from "../Collapsible";
import { Context } from "../../../context/Context";

export namespace FontEditor {
  export type Props = Font & {
    setFont : (newFont : Font) => void
  };

  export const commonFamilies = [
    {
      value : "serif",
      label : "Serif"
    },
    {
      value : "sans-serif",
      label : "Sans-serif"
    },
    {
      value : "monospace",
      label : "Monospace"
    },
    {
      value : "cursive",
      label : "Cursive"
    },
    {
      value : "fantasy",
      label : "Fantasy"
    },
    {
      value : "system-ui",
      label : "System"
    },
    {
      value : "Arial, sans-serif",
      label : "Arial"
    },
    {
      value : "Helvetica, Arial, sans-serif",
      label : "Helvetica"
    },
    {
      value : '"Times New Roman", Times, serif',
      label : "Times New Roman"
    },
    {
      value : "Georgia, serif",
      label : "Georgia"
    },
    {
      value : "Verdana, Geneva, sans-serif",
      label : "Verdana"
    },
    {
      value : "Tahoma, Geneva, sans-serif",
      label : "Tahoma"
    },
    {
      value : '"Courier New", Courier, monospace',
      label : "Courier New"
    },
    {
      value : 'Consolas, "Courier New", monospace',
      label : "Consolas"
    }
  ];

  export function Component(props : Props) {
    const {
      family,
      style,
      weight,
      size,
      setFont : _setFont
    } = props;
    const [
      pushedFontStateFlag,
      setPushedFontStateFlag
    ] = useState(false);
    function setFont(newFont : Font) {
      if (!pushedFontStateFlag) {
        pushToUndoStack();
      }
      _setFont(newFont);
      setPushedFontStateFlag(true);
    }
    const pushToUndoStack = useContext(Context.App.PushToUndoStack);
    return <Collapsible.Component
      title = "Font"
    >
      <label>
        Family:&nbsp;
        <br/>
        &nbsp;&nbsp;Common Families:&nbsp;
        <select
          value = {commonFamilies.some(commonFamily => commonFamily.value === family) ? family : ""}
          onChange = {e => {
            const newFamily = e.target.value;
            setFont({
              family : newFamily,
              style,
              weight,
              size
            });
          }}
        >
          <option
            value = ""
            disabled = {true}
            hidden = {false}
          >
            Pick One
          </option>
          {commonFamilies.map(({ value, label }) => <option
            key = {value}
            value = {value}
          >
            {label}
          </option>)}
        </select>
        <br/>
      </label>
      &nbsp;&nbsp;Custom:&nbsp;
      <input
        type = "text"
        value = {family}
        onChange = {function(e) {
          const newFamily = e.target.value;
          setFont({
            family : newFamily,
            style,
            weight,
            size
          });
        }}
      />
      <br/>
      <label>
        Style:&nbsp;
        <input
          type = "text"
          value = {style}
          onChange = {function(e) {
            const newStyle = e.target.value;
            setFont({
              family,
              style : newStyle,
              weight,
              size
            });
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
            const newWeight = e.target.value;
            setFont({
              family,
              style,
              weight : newWeight,
              size
            });
          }}
        />
      </label>
      <br/>
      <label>
        Size:&nbsp;
        <input
          type = "text"
          value = {size}
          onChange = {function(e) {
            const newSize = e.target.value;
            setFont({
              family,
              style,
              weight,
              size : newSize
            });
          }}
        />
      </label>
    </Collapsible.Component>;
  }
}