import { useContext } from "react";
import { OrientationEditor } from "../../generic/editors/OrientationEditor";
import { Context } from "../../../context/Context";
import { Setting } from "../../../ui/Setting";
import { Collapsible } from "../../generic/Collapsible";

export namespace AppSpecificOrientationEditor {
  export type Props = Omit<OrientationEditor.Props, "useDegreesFlag">;

  export function Component(props : Props) {
    // Begin context data.
    const settingsRecord = useContext(Context.App.Settings);
    const useDegreesFlag = settingsRecord[Setting.USE_DEGREES] as boolean;
    return <>
      <Collapsible.Component
        title = "Orientation:"
      >
        <OrientationEditor.Component
          {...props}
          useDegreesFlag = {useDegreesFlag}
        />
      </Collapsible.Component>
    </>;
  }

  export type SimplifiedProps = Omit<OrientationEditor.SimplifiedProps, "useDegreesFlag">;

  export function Simplified(props : SimplifiedProps) {
    // Begin context data.
    const settingsRecord = useContext(Context.App.Settings);
    const useDegreesFlag = settingsRecord[Setting.USE_DEGREES] as boolean;
    return <>
      <Collapsible.Component
        title = "Orientation:"
      >
        <OrientationEditor.Simplified
          {...props}
          useDegreesFlag = {useDegreesFlag}
        />
      </Collapsible.Component>
    </>
  }
}