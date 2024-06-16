import { useContext, useState } from "react";
import Font from "../../../data_structures/Font";
import { Collapsible } from "../Collapsible";
import { Context } from "../../../context/Context";

export namespace FontEditor {
  export type Props = Font & {
    setFont : (newFont : Font) => void
  };

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
      </label>
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