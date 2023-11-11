import React, { CSSProperties, HTMLInputTypeAttribute, useState, useEffect, useMemo } from "react";
import { numberToFormattedStringHelper, parseFloatReturnUndefinedOnFail, parseIntReturnUndefinedOnFail } from "../../utils/Constants";
import { degreesToRadians, radiansToDegrees } from "../../utils/Utils";

namespace InputWithValidator {
  export type CoreProps<T> = {
    value : T,
    setValue : (newValue : T) => void,
    style? : CSSProperties,
    step? : string | number
    min? : number,
    max? : number,
    disabledFlag? : boolean | undefined
  };

  export type NonCoreProps<T> = {
    valueToString : (value : T) => string,
    stringToValue : (valueAsString : string) => T | undefined | Error,
    htmlInputType? : HTMLInputTypeAttribute
  };

  export type PropsForBuiltIns<T> = CoreProps<T> & Partial<NonCoreProps<T>>;

  export type AngleProps<T> = PropsForBuiltIns<T> & {
    useDegreesFlag : boolean,
    step? : string | number
  };

  export type Error = {
    errorMessage : string
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
            setErrorMessage(undefined);
            setValueAsTextValidityFlag(true);
            break;
          }
          case StringToValueReturnType.UNDEFINED : {
            setValueAsTextValidityFlag(false);
            setErrorMessage(undefined);
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

  export function Number(props : PropsForBuiltIns<number>) {
    return <Component<number>
      style = {props.style}
      valueToString = {props.valueToString ?? numberToFormattedStringHelper}
      stringToValue = {props.stringToValue ?? function(valueAsString : string) {
        const toValueAttempt = parseFloatReturnUndefinedOnFail(valueAsString);
        if (toValueAttempt !== undefined) {
          if (props.min !== undefined && toValueAttempt < props.min) {
            return {
              errorMessage : "Input value is less than the minimum."
            };
          }
          if (props.max !== undefined && toValueAttempt > props.max) {
            return {
              errorMessage : "Input value is greater than the maximum."
            }
          }
        }
        return toValueAttempt;
      }}
      htmlInputType = {props.htmlInputType ?? "number"}
      {...props}
    />
  }

  export function Integer(props : PropsForBuiltIns<number>) {
    return <Component<number>
      style = {props.style}
      valueToString = {props.valueToString ?? function(n : number) {
        return n.toString();
      }}
      stringToValue = {props.stringToValue ?? function(valueAsString : string) {
        const toValueAttempt = parseIntReturnUndefinedOnFail(valueAsString);
        if (toValueAttempt !== undefined) {
          if (props.min !== undefined && toValueAttempt < props.min) {
            return {
              errorMessage : "Input value is less than the minimum."
            };
          }
          if (props.max !== undefined && toValueAttempt > props.max) {
            return {
              errorMessage : "Input value is greater than the maximum."
            }
          }
        }
        return toValueAttempt;
      }}
      htmlInputType = {props.htmlInputType ?? "number"}
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
        style = {props.style}
        valueToString = {props.valueToString ?? function(value : number) {
          let formattedValue = props.useDegreesFlag ? radiansToDegrees(value) : value;
          return numberToFormattedStringHelper(formattedValue);
        }}
        stringToValue = {props.stringToValue ?? function(valueAsString : string) {
          let toValueAttempt = parseFloatReturnUndefinedOnFail(valueAsString);
          if (toValueAttempt === undefined) {
            return undefined;
          } else {
            if (props.min !== undefined && toValueAttempt < props.min) {
              return {
                errorMessage : "Input value is less than the minimum."
              };
            }
            if (props.max !== undefined && toValueAttempt > props.max) {
              return {
                errorMessage : "Input value is greater than the maximum."
              }
            }
          }
          return props.useDegreesFlag ? degreesToRadians(toValueAttempt) : toValueAttempt;
        }}
        htmlInputType = {props.htmlInputType ?? "number"}
        step = {step}
        {...props}
      />
      {props.useDegreesFlag ? "°" : "radians"}
    </>
  }
}

export default InputWithValidator;