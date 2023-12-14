import { useState, ReactNode, CSSProperties, useContext, useEffect } from "react";
import { Context } from "../../context/Context";

export namespace Collapsible {
  export type Props = {
    title : string,
    children : React.ReactNode,
    initialCollapsedFlag? : boolean,
    buttonStyle? : CSSProperties,
    divStyle? : CSSProperties
  };

  export function Component(props : Props) {
    const {
      initialCollapsedFlag,
      title,
      children,
      buttonStyle,
      divStyle
    } = props;
    // Begin context data.
    const widthFromContext = useContext(Context.Collapsible.Width);
    const widthAttribute = widthFromContext ?? "100%"
    // Begin state data.
    const [
      collapsedFlag,
      setCollapsedFlag
    ] = useState(initialCollapsedFlag ?? true);
    return <>
      <button
        className = "collapsible"
        style = {{
          width : widthAttribute,
          ...buttonStyle
        }}
        onClick = {function() {
          const newCollapsedFlag = !collapsedFlag;
          setCollapsedFlag(newCollapsedFlag);
        }}
      >
        <span
          style = {{
            display : "inline-block",
            textAlign : "left",
            width : "50%",
            whiteSpace : "nowrap"
          }}
        >
          {title}
        </span>
        <span
          style = {{
            display : "inline-block",
            textAlign : "right",
            width : "50%"
          }}
        >
          {collapsedFlag ? "+" : "-"}
        </span>
      </button>
      <br/>
      <div
        style = {{
          display : collapsedFlag ? "none" : "block",
          paddingLeft : "10px",
          ...divStyle
        }}
      >
        
        <Context.Collapsible.Width.Provider
          value = "100%"
        >
          {children}
        </Context.Collapsible.Width.Provider>
      </div>
    </>;
  }
}