import { useState, ReactNode, CSSProperties } from "react";

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
    // Begin state data.
    const [
      collapsedFlag,
      setCollapsedFlag
    ] = useState(initialCollapsedFlag ?? true);
    return <>
      <button
        style = {{
          width : "100%",
          ...buttonStyle
        }}
        onClick = {function() {
          setCollapsedFlag(!collapsedFlag);
        }}
      >
        <span
          style = {{
            display : "inline-block",
            textAlign : "left",
            width : "50%"
          }}
        >
          <b>
            {title}
          </b>
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
        {children}
      </div>
    </>;
  }
}