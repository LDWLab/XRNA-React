import { useContext, useEffect, useMemo, useState } from "react";
import { FullKeysRecord, RnaComplexProps } from "../../../../App";
import { Nucleotide } from "../../Nucleotide";
import { LabelContent } from "../../LabelContent";
import { LabelLine } from "../../LabelLine";
import { Context, NucleotideKeysToRerender } from "../../../../context/Context";
import { ColorEditor } from "../../../generic/editors/ColorEditor";
import Color, { BLACK } from "../../../../data_structures/Color";
import { FontEditor } from "../../../generic/editors/FontEditor";
import Font from "../../../../data_structures/Font";
import { subtractNumbers } from "../../../../utils/Utils";
import { Collapsible } from "../../../generic/Collapsible";
import InputWithValidator from "../../../generic/InputWithValidator";
import { orthogonalize, asAngle, magnitude, Vector2D } from "../../../../data_structures/Vector2D";
import { AppSpecificOrientationEditor } from "../../editors/AppSpecificOrientationEditor";
import { OrientationEditor } from "../../../generic/editors/OrientationEditor";
import { Setting } from "../../../../ui/Setting";

export namespace LabelEditMenu {
  export type Props = {
    rnaComplexProps : RnaComplexProps,
    indicesOfAffectedNucleotides : FullKeysRecord,
    setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void
  };

  namespace SinglePositionEditor {
    function LabelContentEditor(props : { 
      singularNucleotideProps : Nucleotide.ExternalProps, rerender : (
        newX : number,
        newY : number,
        content : string
      ) => void }
    ) {
      const { singularNucleotideProps } = props;
      const labelContentProps = singularNucleotideProps.labelContentProps as LabelContent.ExternalProps;
      // Begin context data.
      const _triggerRerender = useContext(Context.OrientationEditor.ResetDataTrigger);
      const [
        x,
        setX
      ] = useState(labelContentProps.x);
      const [
        y,
        setY
      ] = useState(labelContentProps.y);
      const [
        content,
        setContent
      ] = useState(labelContentProps.content);
      useEffect(
        function() {
          setX(labelContentProps.x);
          setY(labelContentProps.y);
          setContent(labelContentProps.content);
        },
        [_triggerRerender]
      );
      return <Collapsible.Component
        title = "Content Positions"
      >
        <label>
          x:&nbsp;
          <InputWithValidator.Number
            value = {x}
            setValue = {function(newX) {
              setX(newX);
              props.rerender(
                newX,
                y,
                content
              );
            }}
          />
        </label>
        <br/>
        <label>
          y:&nbsp;
          <InputWithValidator.Number
            value = {y}
            setValue = {function(newY) {
              setY(newY);
              props.rerender(
                x,
                newY,
                content
              );
            }}
          />
        </label>
        <br/>
        <label>
          content:&nbsp;
          <input
            type = "text"
            value = {content}
            onChange = {function(e) {
              const newContent = e.target.value;
              setContent(newContent);
              props.rerender(
                x,
                y,
                newContent
              );
            }}
          />
        </label>
      </Collapsible.Component>;
    }

    function LabelLineEditor(props : { 
      singularNucleotideProps : Nucleotide.ExternalProps,
      rerender : (
        x : number,
        y : number,
        pointIndex : number
      ) => void }) {
      const { singularNucleotideProps } = props;
      const labelLineProps = singularNucleotideProps.labelLineProps as LabelLine.ExternalProps;
      const points = labelLineProps.points;
      // Begin context data.
      const _triggerRerender = useContext(Context.OrientationEditor.ResetDataTrigger);
      // Begin state data.
      const [
        pointIndex,
        setPointIndex
      ] = useState(0);
      const [
        x,
        setX
      ] = useState(0);
      const [
        y,
        setY
      ] = useState(0);
      const [
        orientationEditorProps,
        setOrientationEditorProps
      ] = useState<AppSpecificOrientationEditor.Props | undefined>(undefined);
      function updateOrientationEditorProps() {
        const point0 = points[0];
        setOrientationEditorProps({
          initialCenter : {
            x : 0,
            y : 0
          },
          positions : points,
          onUpdatePositions : function() {
            props.rerender(point.x, point.y, pointIndex);
            setX(point.x);
            setY(point.y);
          },
          normal : orthogonalize(point0),
          initialAngle : asAngle(point0),
          initialScale : magnitude(point0)
        });
      }
      // Begin memo data.
      // const {
      //   rnaComplexIndex,
      //   rnaMoleculeName,
      //   nucleotideIndex,
      //   singularRnaComplexProps,
      //   singularRnaMoleculeProps,
      //   singularNucleotideProps,
      //   labelLineProps,
      //   points
      // } = useMemo(
      //   function() {
      //     const {
      //       rnaComplexIndex,
      //       rnaMoleculeName,
      //       nucleotideIndex
      //     } = fullKeys;
      //     const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
      //     const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
      //     const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
      //     const labelLineProps = singularNucleotideProps.labelLineProps as LabelLine.ExternalProps;
      //     const points = labelLineProps.points;
      //     return {
      //       ...fullKeys,
      //       singularRnaComplexProps,
      //       singularRnaMoleculeProps,
      //       singularNucleotideProps,
      //       labelLineProps,
      //       points
      //     }
      //   },
      //   [
      //     fullKeys,
      //     _triggerRerender
      //   ]
      // );
      const point = useMemo(
        function() {
          return points[pointIndex];
        },
        [
          pointIndex,
          points
        ]
      );
      // Begin effects.
      // useEffect(
      //   updateOrientationEditorProps,
      //   [fullKeys]
      // );
      useEffect(
        function() {
          setX(point.x);
          setY(point.y);
        },
        [point]
      );
      // useEffect(
      //   function() {
      //     if (pointIndex > points.length) {
      //       setPointIndex(points.length);
      //     }
      //   },
      //   [fullKeys]
      // );
      useEffect(
        function() {
          setX(point.x);
          setY(point.y);
          updateOrientationEditorProps();
        },
        [_triggerRerender]
      );
      return <Collapsible.Component
        title = "Line Positions"
      >
        <label>
          Edit vertex #&nbsp;
          <InputWithValidator.Integer
            value = {pointIndex + 1}
            setValue = {function(newPointIndex) {
              const normalizedNewPointIndex = newPointIndex - 1;
              const newPoint = points[normalizedNewPointIndex];
              setPointIndex(normalizedNewPointIndex);
              setX(newPoint.x);
              setY(newPoint.y);
            }}
            min = {1}
            max = {points.length}
          />
        </label>
        <br/>
        <label>
          x:&nbsp;
          <InputWithValidator.Number
            value = {x}
            setValue = {function(newX) {
              setX(newX);
              point.x = newX;
              props.rerender(
                newX,
                y,
                pointIndex
              );
              updateOrientationEditorProps();
            }}
          />
        </label>
        <br/>
        <label>
          y:&nbsp;
          <InputWithValidator.Number
            value = {y}
            setValue = {function(newY) {
              setY(newY);
              point.y = newY;
              props.rerender(
                x,
                newY,
                pointIndex
              );
              updateOrientationEditorProps();
            }}
          />
        </label>
        {orientationEditorProps && <AppSpecificOrientationEditor.Component
          {...orientationEditorProps}
        />}
      </Collapsible.Component>;
    }

    export type Props = {
      rerender : () => void,
      singularNucleotideWithLabelContentProps? : Nucleotide.ExternalProps,
      singularNucleotideWithLabelLineProps? : Nucleotide.ExternalProps
    };

    export function Component(props : Props) {
      const {
        singularNucleotideWithLabelContentProps,
        singularNucleotideWithLabelLineProps,
        rerender
      } = props;
      return <>
        {singularNucleotideWithLabelContentProps !== undefined && <LabelContentEditor
          singularNucleotideProps = {singularNucleotideWithLabelContentProps}
          rerender = {function(
            x,
            y,
            content
          ) {
            singularNucleotideWithLabelContentProps.labelContentProps = {
              ...singularNucleotideWithLabelContentProps.labelContentProps,
              x,
              y,
              content
            };
            rerender();
          }}
        />}
        {singularNucleotideWithLabelLineProps !== undefined && <LabelLineEditor
          singularNucleotideProps = {singularNucleotideWithLabelLineProps}
          rerender = {function(
            x,
            y,
            pointIndex
          ) {
            const points = (singularNucleotideWithLabelLineProps.labelLineProps as LabelLine.ExternalProps).points;
            const point = points[pointIndex];
            point.x = x;
            point.y = y;

            singularNucleotideWithLabelLineProps.labelLineProps = {
              ...singularNucleotideWithLabelLineProps.labelLineProps,
              points : [...points]
            };
            rerender();
          }}
        />}
      </>;
    }
  }

  namespace MultiplePositionsEditor {
    export type Props = {
      rerender : () => void,
      labelContentProps : Array<LabelContent.ExternalProps>,
      labelLineProps : Array<LabelLine.ExternalProps>
    };

    export function Component(props : Props) {
      const {
        rerender,
        labelContentProps,
        labelLineProps
      } = props;

      const settingsRecord = useContext(Context.App.Settings);
      const useDegreesFlag = settingsRecord[Setting.USE_DEGREES] as boolean;
      const {
        initialCenter,
        positions,
        normal,
        relativePositions,
      } = useMemo(
        function() {
          const relativePositions = new Array<Vector2D>();
          relativePositions.push(...labelContentProps);
          for (const { points } of labelLineProps) {
            relativePositions.push(...points);
          }
          return {
            initialCenter : {
              x : 0,
              y : 0
            },
            positions : [],
            normal : {
              x : 1,
              y : 0
            },
            relativePositions
          };
        },
        [
          labelContentProps,
          labelLineProps
        ]
      );
      return <Collapsible.Component
        title = "Positions"
      >
        <OrientationEditor.Component
          initialCenter = {initialCenter}
          positions = {positions}
          onUpdatePositions = {function() {
            const newPosition = relativePositions[0];
            labelContentProps[0].x = newPosition.x;
            labelContentProps[0].y = newPosition.y;
            rerender();
          }}
          normal = {normal}
          relativePositions = {relativePositions}
          useDegreesFlag = {useDegreesFlag}
          applyCenterToRelativePositionsFlag = {true}
        />
      </Collapsible.Component>;
    }
  }

  export function Component(props : Props) {
    const {
      rnaComplexProps,
      indicesOfAffectedNucleotides,
      setNucleotideKeysToRerender
    } = props;
    // Begin memo data.
    const {
      nucleotidePropsWithLabelContentProps,
      nucleotidePropsWithLabelLineProps,
      nucleotideKeysToRerender,
      initialColor,
      initialFont,
      positionsEditor
    } = useMemo(
      function() {
        const nucleotidePropsWithLabelContentProps = new Array<Nucleotide.ExternalProps>();
        const nucleotidePropsWithLabelLineProps = new Array<Nucleotide.ExternalProps>();
        const nucleotideKeysToRerender : NucleotideKeysToRerender = {};
        let initialColor : Color | undefined = undefined;
        for (const [rnaComplexIndexAsString, indicesOfAffectedNucleotidesPerRnaComplex] of Object.entries(indicesOfAffectedNucleotides)) {
          const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
          const { rnaMoleculeProps } = rnaComplexProps[rnaComplexIndex];
          if (!(rnaComplexIndex in nucleotideKeysToRerender)) {
            nucleotideKeysToRerender[rnaComplexIndex] = {};
          }
          const nucleotideKeysToRerenderPerRnaComplex = nucleotideKeysToRerender[rnaComplexIndex];
          for (const [rnaMoleculeName, indicesOfAffectedNucleotidesPerRnaMolecule] of Object.entries(indicesOfAffectedNucleotidesPerRnaComplex)) {
            const { nucleotideProps } = rnaMoleculeProps[rnaMoleculeName];
            if (!(rnaMoleculeName in nucleotideKeysToRerenderPerRnaComplex)) {
              nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName] = [];
            }
            const nucleotideKeysToRerenderPerRnaMolecule = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName];
            for (const nucleotideIndex of indicesOfAffectedNucleotidesPerRnaMolecule.values()) {
              const singularNucleotideProps = nucleotideProps[nucleotideIndex];
              const {
                labelContentProps,
                labelLineProps
              } = singularNucleotideProps;
              let rerenderNucleotideFlag = false;
              if (labelContentProps !== undefined) {
                nucleotidePropsWithLabelContentProps.push(singularNucleotideProps);
                rerenderNucleotideFlag = true;
              }
              if (labelLineProps !== undefined) {
                nucleotidePropsWithLabelLineProps.push(singularNucleotideProps);
                rerenderNucleotideFlag = true;
              }
              if (rerenderNucleotideFlag) {
                nucleotideKeysToRerenderPerRnaMolecule.push(nucleotideIndex);
              }
            }
            nucleotideKeysToRerenderPerRnaMolecule.sort(subtractNumbers);
          }
        }
        let initialFont : Font | undefined = undefined;
        if (nucleotidePropsWithLabelContentProps.length > 0) {
          initialFont = (nucleotidePropsWithLabelContentProps[0].labelContentProps as LabelContent.ExternalProps).font ?? Font.DEFAULT;
          for (let i = 1; i < nucleotidePropsWithLabelContentProps.length; i++) {
            const font = (nucleotidePropsWithLabelContentProps[i].labelContentProps as LabelContent.ExternalProps).font;
            if (!Font.areEqual(
              initialFont,
              font ?? Font.DEFAULT
            )) {
              initialFont = undefined;
              break;
            }
          }
        }

        const labelContentCount = nucleotidePropsWithLabelContentProps.length;
        const labelLineCount = nucleotidePropsWithLabelLineProps.length;
        let positionsEditor : JSX.Element;
        switch (Math.max(labelContentCount, labelLineCount)) {
          case 0 : {
            positionsEditor = <></>;
            break;
          }
          case 1 : {
            positionsEditor = <SinglePositionEditor.Component
              rerender = {rerender}
              singularNucleotideWithLabelContentProps = {nucleotidePropsWithLabelContentProps[0]}
              singularNucleotideWithLabelLineProps = {nucleotidePropsWithLabelLineProps[0]}
            />;
            break;
          }
          default : {
            const labelContentPositions = nucleotidePropsWithLabelContentProps.map(function({ labelContentProps }) {
              return labelContentProps as LabelContent.ExternalProps;
            });
            const labelLinePositions = nucleotidePropsWithLabelLineProps.map(function({ labelLineProps }) {
              return (labelLineProps as LabelLine.ExternalProps).points;
            });
            positionsEditor = <MultiplePositionsEditor.Component
              rerender = {function() {
                for (let i = 0; i < nucleotidePropsWithLabelContentProps.length; i++) {
                  const singularNucleotideProps = nucleotidePropsWithLabelContentProps[i];
                  const newPosition = labelContentPositions[i];
                  singularNucleotideProps.labelContentProps = {
                    ...(singularNucleotideProps.labelContentProps as LabelContent.ExternalProps),
                    x : newPosition.x,
                    y : newPosition.y
                  };
                }
                for (let i = 0; i < nucleotidePropsWithLabelLineProps.length; i++) {
                  const singularNucleotideProps = nucleotidePropsWithLabelLineProps[i];
                  const newPoints = labelLinePositions[i];
                  singularNucleotideProps.labelLineProps = {
                    ...(singularNucleotideProps.labelLineProps as LabelLine.ExternalProps),
                    points : [...labelLinePositions[i]]
                  };
                }
                rerender();
              }}
              labelContentProps = {nucleotidePropsWithLabelContentProps.map(function({ labelContentProps }) { return labelContentProps as LabelContent.ExternalProps; })}
              labelLineProps = {nucleotidePropsWithLabelLineProps.map(function({ labelLineProps }) { return labelLineProps as LabelLine.ExternalProps; })}
            />;
            break;
          }
        }
        return {
          nucleotidePropsWithLabelContentProps,
          nucleotidePropsWithLabelLineProps,
          nucleotideKeysToRerender,
          initialColor : initialColor ?? BLACK,
          initialFont : initialFont ?? Font.DEFAULT,
          positionsEditor
        };
      },
      [indicesOfAffectedNucleotides]
    );
    // Begin state data.
    const [
      affectLabelTextColorsFlag,
      setAffectLabelTextColorsFlag
    ] = useState(true);
    const [
      affectLabelLineColorsFlag,
      setAffectLabelLineColorsFlag
    ] = useState(true);
    const [
      font,
      setFont
    ] = useState(initialFont);
    function rerender() {
      setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
    }
    return <>
      <b>
        Edit label(s) per interaction constraint:
      </b>
      <ColorEditor.Component
        color = {initialColor}
        setColorHelper = {function(color) {
          if (affectLabelTextColorsFlag) {
            for (const singularNucleotideProps of nucleotidePropsWithLabelContentProps) {
              singularNucleotideProps.labelContentProps = {
                ...singularNucleotideProps.labelContentProps as LabelContent.ExternalProps,
                color
              };
            }
          }
          if (affectLabelLineColorsFlag) {
            for (const singularNucleotideProps of nucleotidePropsWithLabelLineProps) {
              singularNucleotideProps.labelLineProps = {
                ...singularNucleotideProps.labelLineProps as LabelLine.ExternalProps,
                color
              };
            }
          }
          rerender();
        }}
      >
        <b>Recolor:</b>
        <ul
          style = {{
            margin : 0
          }}
        >
          <li>
            <label>
              Text&nbsp;
              <input
                type = "checkbox"
                checked = {affectLabelTextColorsFlag}
                onChange = {function() {
                  setAffectLabelTextColorsFlag(!affectLabelTextColorsFlag);
                }}
              />
            </label>
          </li>
          <li>
            <label>
              Lines&nbsp;
              <input
                type = "checkbox"
                checked = {affectLabelLineColorsFlag}
                onChange = {function() {
                  setAffectLabelLineColorsFlag(!affectLabelLineColorsFlag);
                }}
              />
            </label>
          </li>
        </ul>
      </ColorEditor.Component>
      <FontEditor.Component
        {...font}
        setFont = {function(newFont : Font) {
          for (const singularNucleotideProps of nucleotidePropsWithLabelContentProps) {
            singularNucleotideProps.labelContentProps = {
              ...(singularNucleotideProps.labelContentProps as LabelContent.ExternalProps),
              font : newFont
            };
          }
          setFont(structuredClone(newFont));
          rerender();
        }}
      />
      {positionsEditor}
    </>;
  }
};