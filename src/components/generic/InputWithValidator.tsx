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
    max? : string | number,
    disabledFlag? : boolean | undefined
  };

  export type AngleProps<T> = CoreProps<T> & {
    useDegreesFlag : boolean,
    step? : string | number
  };

  export type Error = {
    errorMessage : string
  };

  export type NonCoreProps<T> = {
    valueToString : (value : T) => string,
    stringToValue : (valueAsString : string) => T | undefined | Error,
    htmlInputType? : HTMLInputTypeAttribute
  };

  export type Props<T> = CoreProps<T> & NonCoreProps<T>;

  export type BuiltInProps<T> = CoreProps<T> & Partial<NonCoreProps<T>>;

  export enum StringToValueReturnType {
    VALUE = "value",
    UNDEFINED = "undefined",
    ERROR = "error"
  };

  function getType<T>(arg : T | undefined) : StringToValueReturnType {
    if (arg === undefined) {
      return StringToValueReturnType.UNDEFINED;
    }
    if (arg !== null && typeof arg === "object" && "errorMessage" in arg) {
      return StringToValueReturnType.ERROR;
    }
    return StringToValueReturnType.VALUE;
  }

  export function Component<T>(props : Props<T>) {
    const {
      disabledFlag
    } = props;
    // Begin state data.
    const [
      valueAsText, 
      setValueAsText
    ] = useState(props.valueToString(props.value));
    const [
      valueAsTextValidityFlag,
      setValueAsTextValidityFlag
    ] = useState(true);
    const [
      listenForValueChangeFlag,
      setListenForValueChangeFlag
    ] = useState(true);
    const [
      errorMessage,
      setErrorMessage
    ] = useState<string | undefined>(undefined);
    // Begin effects.
    useEffect(function() {
      if (listenForValueChangeFlag) {
        setValueAsText(props.valueToString(props.value));
      } else {
        // Ignore changes made to <props.value> originating from within this Component.
        setListenForValueChangeFlag(true);
        setValueAsTextValidityFlag(true);
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
        switch (getType(toValueAttempt)) {
          case StringToValueReturnType.VALUE : {
            props.setValue(toValueAttempt as T);
            setValueAsTextValidityFlag(true);
            break;
          }
          case StringToValueReturnType.UNDEFINED : {
            setValueAsTextValidityFlag(false);
            break;
          }
          case StringToValueReturnType.ERROR : {
            setValueAsTextValidityFlag(false);
            setErrorMessage((toValueAttempt as Error).errorMessage);
            break;
          }
        }
      }}
      step = {props.step}
      min = {props.min}
      max = {props.max}
      title = {errorMessage}
      disabled = {disabledFlag}
    />;
  }

  export function Number(props : CoreProps<number>) {
    return <Component<number>
      valueToString = {numberToFormattedStringHelper}
      stringToValue = {parseFloatReturnUndefinedOnFail}
      htmlInputType = "number"
      {...props}
    />
  }

  export function Integer(props : CoreProps<number>) {
    return <Component<number>
      valueToString = {function(n : number) {
        return n.toString();
      }}
      stringToValue = {parseIntReturnUndefinedOnFail}
      htmlInputType = "number"
      {...props}
    />
  }

  export function Angle(props : AngleProps<number>) {
    const step = useMemo(
      function() {
        return props.step ?? props.useDegreesFlag ? 1 : degreesToRadians(1);
      },
      [props.step]
    );
    return <>
      <Component<number>
        valueToString = {function(value : number) {
          let formattedValue = props.useDegreesFlag ? radiansToDegrees(value) : value;
          return numberToFormattedStringHelper(formattedValue);
        }}
        stringToValue = {function(valueAsString : string) {
          let parsedUnformattedValue = parseFloatReturnUndefinedOnFail(valueAsString);
          if (parsedUnformattedValue === undefined) {
            return undefined;
          }
          return props.useDegreesFlag ? degreesToRadians(parsedUnformattedValue) : parsedUnformattedValue;
        }}
        htmlInputType= "number"
        step = {step}
        {...props}
      />
      {props.useDegreesFlag ? "°" : "radians"}
    </>
  }
}

export default InputWithValidator;