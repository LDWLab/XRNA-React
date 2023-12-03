import { useContext, useMemo } from "react";
import { OrientationEditor } from "../../generic/editors/OrientationEditor";
import { Context } from "../../../context/Context";
import { Setting } from "../../../ui/Setting";
import { Collapsible } from "../../generic/Collapsible";
import { Nucleotide } from "../Nucleotide";
import { LabelLine } from "../LabelLine";

export namespace AppSpecificOrientationEditor {
  export type Props = Omit<OrientationEditor.Props, "useDegreesFlag">;

  export function Component(props : Props) {
    // Begin context data.
    const settingsRecord = useContext(Context.App.Settings);
    const useDegreesFlag = settingsRecord[Setting.USE_DEGREES] as boolean;
    const repositionAnnotationsFlag = settingsRecord[Setting.AUTOMATICALLY_REPOSITION_ANNOTATIONS];
    const {
      relativePositions,
      onUpdatePositions
    } = useMemo(
      function() {
        let relativePositions = undefined;
        let onUpdatePositions = props.onUpdatePositions;
        if (repositionAnnotationsFlag) {
          relativePositions = [];
          const labelLinePropsArray = new Array<LabelLine.ExternalProps>();
          for (const position of props.positions) {
            if ("symbol" in position && typeof position.symbol === "string" && Nucleotide.isSymbol(position.symbol)) {
              const {
                labelLineProps,
                labelContentProps
              } = position as Nucleotide.ExternalProps;
              if (labelContentProps !== undefined) {
                relativePositions.push(labelContentProps);
              }
              if (labelLineProps !== undefined) {
                labelLinePropsArray.push(labelLineProps);
                relativePositions.push(...labelLineProps.points);
              }
            }
          }
          onUpdatePositions = function() {
            for (const singularLabelLineProps of labelLinePropsArray) {
              // This causes a re-render of the LabelLine.
              singularLabelLineProps.points = [...singularLabelLineProps.points];
            }
            props.onUpdatePositions();
          }
        }
        return {
          relativePositions,
          onUpdatePositions
        };
      },
      [
        repositionAnnotationsFlag,
        props.positions,
        props.onUpdatePositions
      ]
    );
    return <>
      <Collapsible.Component
        title = "Positions"
      >
        <OrientationEditor.Component
          {...props}
          useDegreesFlag = {useDegreesFlag}
          relativePositions = {relativePositions}
          onUpdatePositions = {onUpdatePositions}
        />
      </Collapsible.Component>
    </>;
  }

  export type SimplifiedProps = Omit<OrientationEditor.SimplifiedProps, "useDegreesFlag">;

  export function Simplified(props : SimplifiedProps) {
    // Begin context data.
    const settingsRecord = useContext(Context.App.Settings);
    const useDegreesFlag = settingsRecord[Setting.USE_DEGREES] as boolean;
    const repositionAnnotationsFlag = settingsRecord[Setting.AUTOMATICALLY_REPOSITION_ANNOTATIONS];
    const {
      relativePositions,
      onUpdatePositions
    } = useMemo(
      function() {
        let relativePositions = undefined;
        let onUpdatePositions = props.onUpdatePositions;
        if (repositionAnnotationsFlag) {
          relativePositions = [];
          const labelLinePropsArray = new Array<LabelLine.ExternalProps>();
          for (const position of props.positions) {
            if ("symbol" in position && typeof position.symbol === "string" && Nucleotide.isSymbol(position.symbol)) {
              const {
                labelLineProps,
                labelContentProps
              } = position as Nucleotide.ExternalProps;
              if (labelContentProps !== undefined) {
                relativePositions.push(labelContentProps);
              }
              if (labelLineProps !== undefined) {
                labelLinePropsArray.push(labelLineProps);
                relativePositions.push(...labelLineProps.points);
              }
            }
          }
          onUpdatePositions = function() {
            for (const singularLabelLineProps of labelLinePropsArray) {
              // This causes a re-render of the LabelLine.
              singularLabelLineProps.points = [...singularLabelLineProps.points];
            }
            props.onUpdatePositions();
          }
        }
        return {
          relativePositions,
          onUpdatePositions
        };
      },
      [
        repositionAnnotationsFlag,
        props.positions,
        props.onUpdatePositions
      ]
    );
    return <>
      <Collapsible.Component
        title = "Positions"
      >
        <OrientationEditor.Simplified
          {...props}
          useDegreesFlag = {useDegreesFlag}
          relativePositions = {relativePositions}
          onUpdatePositions = {onUpdatePositions}
        />
      </Collapsible.Component>
    </>
  }
}