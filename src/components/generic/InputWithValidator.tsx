import React, { CSSProperties, HTMLInputTypeAttribute, useState, useEffect, useMemo } from "react";
import { numberToFormattedStringHelper, parseFloatReturnUndefinedOnFail, parseIntReturnUndefinedOnFail } from "../../utils/Constants";
import { degreesToRadians, radiansToDegrees } from "../../utils/Utils";

namespace InputWithValidator {
  export type CoreProps<T> = {
    value : T,
    setValue : (newValue : T) => void,
    style? : CSSProperties,
    step? : string | number
    min? : string | number,
    max? : string | number
  };

  export type AngleProps<T> = CoreProps<T> & {
    useDegrees : boolean,
    step? : string | number
  };

  export type Props<T> = CoreProps<T> & {
    valueToString : (value : T) => string,
    stringToValue : (valueAsString : string) => T | undefined,
    htmlInputType? : HTMLInputTypeAttribute
  };

  function isValueType<T>(arg : T | undefined) : arg is T {
    return arg !== undefined;
  }

  export function Component<T>(props : Props<T>) {
    // Begin state data.
    const [
      valueAsText, 
      setValueAsText
    ] = useState(props.valueToString(props.value));
    const [
      valueAsTextValidityFlag,
      setValueAsTExtValidityFlag
    ] = useState(true);
    const [
      listenForValueChangeFlag,
      setListenForValueChangeFlag
    ] = useState(true);
    // Begin effects.
    useEffect(function() {
      if (listenForValueChangeFlag) {
        setValueAsText(props.valueToString(props.value));
      } else {
        // Ignore changes made to <props.value> originating from within this Component.
        setListenForValueChangeFlag(true);
      }
    }, [props.value]);
    // Begin render.
    return <input
      style = {{
        border : `1px solid ${valueAsTextValidityFlag ? "black" : "red"}`,
        ...props.style
      }}
      type = {props.htmlInputType}
      value = {valueAsText}
      onChange = {function(e) {
        setListenForValueChangeFlag(false);
        let newValueAsText = e.target.value;
        setValueAsText(newValueAsText);
        let toValueAttempt = props.stringToValue(newValueAsText);
        let valueAsTextValidityFlag = isValueType(toValueAttempt);
        setValueAsTExtValidityFlag(valueAsTextValidityFlag);
        if (valueAsTextValidityFlag) {
          props.setValue(toValueAttempt as T);
        }
      }}
      step = {props.step}
      min = {props.min}
      max = {props.max}
    />;
  }

  export function Number(props : CoreProps<number>) {
    return <Component<number>
      {...props}
      valueToString = {numberToFormattedStringHelper}
      stringToValue = {parseFloatReturnUndefinedOnFail}
      htmlInputType = "number"
    />
  }

  export function Integer(props : CoreProps<number>) {
    return <Component<number>
      {...props}
      valueToString = {function(n : number) {
        return n.toString();
      }}
      stringToValue = {parseIntReturnUndefinedOnFail}
      htmlInputType = "number"
    />
  }

  export function Angle(props : AngleProps<number>) {
    const step = useMemo(
      function() {
        return props.step ?? props.useDegrees ? 1 : degreesToRadians(1);
      },
      [props.step]
    );
    return <>
      <Component<number>
        {...props}
        valueToString = {function(value : number) {
          let formattedValue = props.useDegrees ? radiansToDegrees(value) : value;
          return numberToFormattedStringHelper(formattedValue);
        }}
        stringToValue = {function(valueAsString : string) {
          let parsedUnformattedValue = parseFloatReturnUndefinedOnFail(valueAsString);
          if (parsedUnformattedValue === undefined) {
            return undefined;
          }
          return props.useDegrees ? degreesToRadians(parsedUnformattedValue) : parsedUnformattedValue;
        }}
        htmlInputType= "number"
        step = {step}
      />
      {props.useDegrees ? "°" : "radians"}
    </>
  }
}

export default InputWithValidator;