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
    ] = useState(initialCollapsedFlag ?? false);
    return <>
      <button
        className = "collapsible"
        style = {{
          display : "flex",
          alignItems : "center",
          justifyContent : "space-between",
          ...buttonStyle
        }}
        onClick = {function() {
          const newCollapsedFlag = !collapsedFlag;
          setCollapsedFlag(newCollapsedFlag);
        }}
      >
        <span
          style = {{
            flex : 1,
            textAlign : "left",
            whiteSpace : "normal"
          }}
        >
          {title}
        </span>
        <span
          style = {{
            marginLeft : "1rem",
            textAlign : "right"
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