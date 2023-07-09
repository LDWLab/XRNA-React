import { useContext, useState } from "react";
import BasePair from "../../BasePair";
import { AppSpecificOrientationEditor } from "../../editors/AppSpecificOrientationEditor";

export namespace SingleBasePairInteractionConstraintEditMenu {
  export type Props = AppSpecificOrientationEditor.SimplifiedProps & {
    basePairType : BasePair.Type,
    onChangeBasePairType : (newBasePairType : BasePair.Type) => void
  };

  export function Component(props : Props) {
    const {
      onChangeBasePairType
    } = props;
    // Begin state data.
    const [
      basePairType,
      setBasePairType
    ] = useState(props.basePairType);
    return <>
      <label>
        Base-pair type:&nbsp;
        <select
          value = {basePairType}
          onChange = {function(e) {
            const newBasePairType = e.target.value as BasePair.Type;
            setBasePairType(newBasePairType);
            onChangeBasePairType(newBasePairType);
          }}
        >
          {BasePair.types.map(function(basePairTypeI : BasePair.Type) {
            return <option
              key = {basePairTypeI}
              value = {basePairTypeI}
            >
              {basePairTypeI}
            </option>
          })}
        </select>
      </label>
      <br/>
      <AppSpecificOrientationEditor.Simplified
        {...props}
      />
    </>;
  }
}