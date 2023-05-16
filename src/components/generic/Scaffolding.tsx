import { useEffect, useMemo, useState, FunctionComponent, createElement } from "react";
import { binarySearch } from "../../utils/Utils";

namespace Scaffolding {
  export type SortedProps<Key, Props extends {}> = Array<{
    scaffoldingKey : Key,
    props : Props
  }>;

  export type Props<Key, Props extends {}> = {
    sortedProps : SortedProps<Key, Props>,
    childComponent : FunctionComponent<Props & {scaffoldingKey : Key}>,
    propsToRerenderKeys? : Array<Key>,
    comparator : (props0 : Key, props1 : Key) => number
  };

  export function Component<Key, Props extends {}>(props : Scaffolding.Props<Key, Props>) {
    const {
      sortedProps,
      childComponent,
      propsToRerenderKeys,
      comparator
    } = props;
    // Begin state data.
    const [
      leftPartitionRerenderTrigger,
      setLeftPartitionRerenderTrigger
    ] = useState(false);
    const [
      rightPartitionRerenderTrigger,
      setRightPartitionRerenderTrigger
    ] = useState(false);
    // Begin state-update helper functions.
    function triggerLeftPartitionRerender() {
      setLeftPartitionRerenderTrigger(!leftPartitionRerenderTrigger);
    }
    function triggerRightPartitionRerender() {
      setRightPartitionRerenderTrigger(!rightPartitionRerenderTrigger);
    }
    // Begin memo data.
    const {
      leftPropsPartition,
      rightPropsPartition
    } = useMemo(
      function() {
        const lengthOverTwo = sortedProps.length >> 1;
        return {
          leftPropsPartition : sortedProps.slice(0, lengthOverTwo),
          rightPropsPartition : sortedProps.slice(lengthOverTwo)
        };
      },
      [sortedProps]
    );
    const leftPartition = useMemo(
      function() {
        switch (leftPropsPartition.length) {
          case 0 : {
            return <></>;
          }
          case 1 : {
            const {
              props,
              scaffoldingKey
            } = leftPropsPartition[0];
            return createElement(
              childComponent,
              {
                ...props,
                scaffoldingKey
              }
            );
          }
          default : {
            return <Scaffolding.Component<Key, Props>
              sortedProps = {leftPropsPartition}
              childComponent = {childComponent}
              propsToRerenderKeys = {propsToRerenderKeys}
              comparator = {comparator}
            />;
          }
        }
      },
      [leftPartitionRerenderTrigger]
    );
    const rightPartition = useMemo(
      function() {
        switch (rightPropsPartition.length) {
          case 0 : {
            return <></>;
          }
          case 1 : {
            const {
              props,
              scaffoldingKey
            } = rightPropsPartition[0];
            return createElement(
              childComponent,
              {
                ...props,
                scaffoldingKey
              }
            );
          }
          default : {
            return <Scaffolding.Component<Key, Props>
              sortedProps = {rightPropsPartition}
              childComponent = {childComponent}
              propsToRerenderKeys = {propsToRerenderKeys}
              comparator = {comparator}
            />
          }
        }
      },
      [rightPartitionRerenderTrigger]
    );
    // Begin effects.
    useEffect(
      function() {
        if (propsToRerenderKeys === undefined) {
          triggerLeftPartitionRerender();
          triggerRightPartitionRerender();
        } else {
          [
            {
              partition : leftPropsPartition,
              triggerPartitionRerender : triggerLeftPartitionRerender
            },
            {
              partition : rightPropsPartition,
              triggerPartitionRerender : triggerRightPartitionRerender
            }
          ].forEach(function({
            partition,
            triggerPartitionRerender
          }) {
            let collisionFlag = false;
            for (let i = 0; i < partition.length; i++) {
              if (binarySearch(propsToRerenderKeys, (key : Key) => comparator(key, partition[i].scaffoldingKey)) !== null) {
                collisionFlag = true;
                break;
              }
            }
            if (collisionFlag) {
              triggerPartitionRerender();
            }
          });
        }
      },
      [propsToRerenderKeys]
    );
    return <>
      {leftPartition}
      {rightPartition}
    </>;
  }
}

export default Scaffolding;