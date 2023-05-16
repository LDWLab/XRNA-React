import { useState } from "react";

export namespace RnaComplexInteractionConstraintEditMenu {
  export type Props = {
    rnaComplexName : string
  };

  export function Component(props : Props) {
    // Begin state data.
    const [
      rnaComplexName,
      setRnaComplexName
    ] = useState(props.rnaComplexName);
    return <>
        Not yet implemented.
    </>;
  }
}