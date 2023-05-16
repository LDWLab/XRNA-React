import { useContext, useState } from "react";
import BasePair from "../BasePair";
import InputWithValidator from "../../generic/InputWithValidator";
import { Context } from "../../../context/Context";
import { Setting } from "../../../ui/Setting";

export namespace SingleBasePairInteractionConstraintEditMenu {
  export type Props = {
    basePairType : BasePair.Type,
    basePairDistance : number,
    basePairAngle : number,
    onChangeBasePairType : (newBasePairType : BasePair.Type) => void,
    polarRerender : (newAngle : number, newBasePairDistance : number) => void
  };

  export function Component(props : Props) {
    // Begin context data.
    const useDegrees = useContext(Context.App.Settings)[Setting.USE_DEGREES];
    // Begin state data.
    const {
      onChangeBasePairType,
      polarRerender
    } = props;
    // Begin state data.
    const [
      basePairType,
      setBasePairType
    ] = useState(props.basePairType);
    const [
      basePairDistance,
      setBasePairDistance
    ] = useState(props.basePairDistance);
    const [
      angle,
      setAngle
    ] = useState(props.basePairAngle);
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
      <label>
        Base-pair distance:&nbsp;
        <InputWithValidator.Number
          value = {basePairDistance}
          setValue = {function(newBasePairDistance) {
            setBasePairDistance(newBasePairDistance);
            polarRerender(angle, newBasePairDistance);
          }}
        />
      </label>
      <br/>
      <label>
        Angle:&nbsp;
        <InputWithValidator.Angle
          value = {angle}
          setValue = {function(newAngle) {
            setAngle(newAngle);
            polarRerender(newAngle, basePairDistance);
          }}
          useDegrees = {useDegrees}
        />
      </label>
    </>;
  }
}