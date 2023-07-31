import { useContext } from "react";
import { OrientationEditor } from "../../generic/editors/OrientationEditor";
import { Context } from "../../../context/Context";
import { Setting } from "../../../ui/Setting";

export namespace AppSpecificOrientationEditor {
  export type Props = Omit<OrientationEditor.Props, "useDegreesFlag">;

  export function Component(props : Props) {
    // Begin context data.
    const settingsRecord = useContext(Context.App.Settings);
    const useDegreesFlag = settingsRecord[Setting.USE_DEGREES] as boolean;
    return <>
      <b>
        Orientation:
      </b>
      <br/>
      <OrientationEditor.Component
        {...props}
        useDegreesFlag = {useDegreesFlag}
      />
    </>;
  }

  export type SimplifiedProps = Omit<OrientationEditor.SimplifiedProps, "useDegreesFlag">;

  export function Simplified(props : SimplifiedProps) {
    // Begin context data.
    const settingsRecord = useContext(Context.App.Settings);
    const useDegreesFlag = settingsRecord[Setting.USE_DEGREES] as boolean;
    return <>
      <b>
        Orientation:
      </b>
      <br/>
      <OrientationEditor.Simplified
        {...props}
        useDegreesFlag = {useDegreesFlag}
      />
    </>
  }
}