import { useContext, useState } from "react";
import Font from "../../../data_structures/Font";
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
    return <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 2 }}>Font</div>
      <div
        style = {{
          display : "flex",
          alignItems : "center",
          gap : 8
        }}
      >
        <span>Common Families:</span>
        <select
          style = {{
            flex : 1
          }}
          value = {commonFamilies.some(commonFamily => commonFamily.value === family) ? family : ""}
          onChange = {e => {
            const newFamily = e.target.value;
            if (newFamily) {
              setFont({
                family : newFamily,
                style,
                weight,
                size
              });
            }
          }}
        >
          <option value = "">-</option>
          {commonFamilies.map(({ value, label }) => <option
            key = {value}
            value = {value}
          >
            {label}
          </option>)}
        </select>
      </div>

      <div
        style = {{
          display : "flex",
          alignItems : "center",
          gap : 8
        }}
      >
        <span>Custom Font:</span>
        <input
          type = "text"
          style = {{
            flex : 1
          }}
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
      </div>

      <div
        style = {{
          display : "flex",
          alignItems : "center",
          gap : 8
        }}
      >
        <span>Size:</span>
        <input
          type = "number"
          step = {0.5}
          min = {1}
          style = {{
            width : 60
          }}
          value = {size || "8.0"}
          onChange = {function(e) {
            const val = parseFloat(e.target.value);
            const newSize = isNaN(val) || val < 1 ? "8.0" : val.toFixed(1);
            setFont({
              family,
              style,
              weight,
              size : newSize
            });
          }}
        />
        <span>Style:</span>
        <select
          style = {{
            flex : 1
          }}
          value = {style}
          onChange = {function(e) {
            setFont({
              family,
              style : e.target.value,
              weight,
              size
            });
          }}
        >
          <option value = "normal">Normal</option>
          <option value = "italic">Italic</option>
          <option value = "oblique">Oblique</option>
        </select>
        <span>Weight:</span>
        <select
          style = {{
            width : 80
          }}
          value = {weight}
          onChange = {function(e) {
            setFont({
              family,
              style,
              weight : e.target.value,
              size
            });
          }}
        >
          <option value = "normal">Normal</option>
          <option value = "bold">Bold</option>
          <option value = "100">100</option>
          <option value = "200">200</option>
          <option value = "300">300</option>
          <option value = "400">400</option>
          <option value = "500">500</option>
          <option value = "600">600</option>
          <option value = "700">700</option>
          <option value = "800">800</option>
          <option value = "900">900</option>
        </select>
      </div>
    </div>;
  }
}