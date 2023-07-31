import { useContext } from "react";
import InputWithValidator from "../../generic/InputWithValidator"
import { Context } from "../../../context/Context";
import { Setting } from "../../../ui/Setting";

export namespace AppSpecificAngleEditor {
  export type Props = {
    value : number,
    setValue : (newValue : number) => void
  }

  export function Component(props : Props) {
    const {
      value,
      setValue
    } = props;
    const settingsRecord = useContext(Context.App.Settings);
    const useDegreesFlag = settingsRecord[Setting.USE_DEGREES] as boolean;
    return <InputWithValidator.Angle
      value = {value}
      setValue = {setValue}
      useDegreesFlag = {useDegreesFlag}
    />
  }
}