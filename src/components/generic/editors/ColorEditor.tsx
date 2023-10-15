import { useEffect, useState } from "react";
import Color, { BLACK, ColorFormat, DEFAULT_ALPHA, DEFAULT_COLOR_FORMAT, colorFormats, fromHexadecimal, toHexadecimal } from "../../../data_structures/Color";
import Wheel from '@uiw/react-color-wheel';
import { rgbaToHsva, hsvaToRgba } from '@uiw/color-convert';
import ShadeSlider from '@uiw/react-color-shade-slider';
import { Collapsible } from "../Collapsible";

export namespace ColorEditor {
  enum EditMode {
    RGBA = "RGBA",
    Hexadecimal = "Hexadecimal",
    ColorWheel = "Color wheel",
  }

  const editModes = Object.values(EditMode);

  export type Props = {
    setColorHelper : (color : Color) => void,
    color? : Color
  };

  export function Component(props : Props) {
    let {
      setColorHelper,
      color
    } = props;
    // Begin state data.
    const [
      editMode,
      setEditMode
    ] = useState(EditMode.ColorWheel);
    const [
      red,
      setRed
    ] = useState(0);
    const [
      green,
      setGreen
    ] = useState(0);
    const [
      blue,
      setBlue
    ] = useState(0);
    const [
      alpha,
      setAlpha
    ] = useState(0);
    const [
      hexadecimalEncoding,
      setHexadecimalEncoding
    ] = useState(DEFAULT_COLOR_FORMAT);
    const [
      hexadecimal,
      setHexadecimal
    ] = useState("");
    const [
      hsva,
      setHsva
    ] = useState({
      h : 0,
      s : 0,
      v : 100,
      a : 0
    });
    // Begin state-update helper functions.
    function setHexadecimalHelper(
      red : number,
      green : number,
      blue : number,
      alpha : number,
      colorFormat : ColorFormat
    ) {
      setHexadecimal(
        toHexadecimal(
          {
            red,
            green,
            blue,
            alpha
          },
          colorFormat,
          true
        )
      );
    }
    function updateColorWheelHelper(
      red : number,
      green : number,
      blue : number,
      alpha : number,
    ) {
      setHsva(rgbaToHsva({
        r : red,
        g : green,
        b : blue,
        a : alpha
      }));
    }
    // Begin effects.
    useEffect(
      function() {
        let localColor = color ?? BLACK;
        setRed(localColor.red);
        setGreen(localColor.green);
        setBlue(localColor.blue);
        const _alpha = localColor.alpha ?? DEFAULT_ALPHA;
        setAlpha(_alpha);
        setHexadecimalHelper(
          localColor.red,
          localColor.green,
          localColor.blue,
          _alpha,
          hexadecimalEncoding
        );
        updateColorWheelHelper(
          localColor.red,
          localColor.green,
          localColor.blue,
          _alpha
        );
      },
      [color]
    );
    // Begin render data.
    const modeRenderData : Record<EditMode, JSX.Element> = {
      [EditMode.RGBA] : <>
        <label>
          Red:&nbsp;
          <input
            type = "number"
            min = {0}
            max = {255}
            step = {1}
            value = {red}
            onChange = {function(e) {
              const newRed = Number.parseInt(e.target.value);
              setRed(newRed);
              setColorHelper({
                red : newRed,
                green,
                blue,
                alpha
              });
              setHexadecimalHelper(
                newRed,
                green,
                blue,
                alpha,
                hexadecimalEncoding
              );
              updateColorWheelHelper(
                newRed,
                green,
                blue,
                alpha
              );
            }}
          />
        </label>
        <br/>
        <label>
          Green:&nbsp;
          <input
            type = "number"
            min = {0}
            max = {255}
            step = {1}
            value = {green}
            onChange = {function(e) {
              const newGreen = Number.parseInt(e.target.value);
              setGreen(newGreen);
              setColorHelper({
                red,
                green : newGreen,
                blue,
                alpha
              });
              setHexadecimalHelper(
                red,
                newGreen,
                blue,
                alpha,
                hexadecimalEncoding
              );
              updateColorWheelHelper(
                red,
                newGreen,
                blue,
                alpha
              );
            }}
          />
        </label>
        <br/>
        <label>
          Blue:&nbsp;
          <input
            type = "number"
            min = {0}
            max = {255}
            step = {1}
            value = {blue}
            onChange = {function(e) {
              const newBlue = Number.parseInt(e.target.value);
              setBlue(newBlue);
              setColorHelper({
                red,
                green,
                blue : newBlue,
                alpha
              });
              setHexadecimalHelper(
                red,
                green,
                newBlue,
                alpha,
                hexadecimalEncoding
              );
              updateColorWheelHelper(
                red,
                green,
                newBlue,
                alpha
              );
            }}
          />
        </label>
        <br/>
        <label>
          Alpha:&nbsp;
          <input
            type = "number"
            min = {0}
            max = {255}
            step = {1}
            value = {alpha}
            onChange = {function(e) {
              const newAlpha = Number.parseInt(e.target.value);
              setAlpha(newAlpha);
              setColorHelper({
                red,
                green,
                blue,
                alpha : newAlpha
              });
              setHexadecimalHelper(
                red,
                green,
                blue,
                newAlpha,
                hexadecimalEncoding
              );
              updateColorWheelHelper(
                red,
                green,
                blue,
                newAlpha
              );
            }}
          />
        </label>
      </>,
      [EditMode.Hexadecimal] : <>
        <label>
          Encoding:&nbsp;
          <select
            value = {hexadecimalEncoding}
            onChange = {function(e) {
              const newHexadecimalEncoding = e.target.value as ColorFormat;
              setHexadecimalEncoding(newHexadecimalEncoding);
              const newColor = fromHexadecimal(
                hexadecimal,
                newHexadecimalEncoding
              );
              setRed(newColor.red);
              setGreen(newColor.green);
              setBlue(newColor.blue);
              setAlpha(newColor.alpha ?? DEFAULT_ALPHA);
              setColorHelper(newColor);
              updateColorWheelHelper(
                newColor.red,
                newColor.green,
                newColor.blue,
                newColor.alpha ?? DEFAULT_ALPHA
              );
            }}
          >
            {colorFormats.map(function(colorFormatI : ColorFormat) {
              return <option
                key = {colorFormatI}
              >
                {colorFormatI}
              </option>;
            })}
          </select>
        </label>
        <br/>
        <label>
          Hexadecimal:&nbsp;
          <input
            type = "text"
            value = {hexadecimal}
            onChange = {function(e) {
              const newHexadecimal = e.target.value;
              setHexadecimal(newHexadecimal);
              const newColor = fromHexadecimal(newHexadecimal, hexadecimalEncoding);
              setRed(newColor.red);
              setGreen(newColor.green);
              setBlue(newColor.blue);
              setAlpha(newColor.alpha ?? DEFAULT_ALPHA);
              setColorHelper(newColor);
              updateColorWheelHelper(
                newColor.red,
                newColor.green,
                newColor.blue,
                newColor.alpha ?? DEFAULT_ALPHA
              );
            }}
          />
        </label>
      </>,
      [EditMode.ColorWheel] : <>
        <Wheel
          color = {hsva}
          onChange = {function(color) {
            setHsva({
              ...hsva,
              ...color.hsva
            });
            const newColor = {
              red : color.rgba.r,
              green : color.rgba.g,
              blue : color.rgba.b,
              alpha
            };
            setColorHelper(newColor);
            setRed(newColor.red);
            setGreen(newColor.green);
            setBlue(newColor.blue);
            setAlpha(newColor.alpha);
            setHexadecimalHelper(
              newColor.red,
              newColor.green,
              newColor.blue,
              newColor.alpha,
              hexadecimalEncoding
            );
          }}
        />
        <br/>
        <ShadeSlider
          hsva = {hsva}
          onChange = {function(newShade) {
            const newHsva = {
              ...hsva,
              v : newShade.v
            };
            setHsva(newHsva);
            const newRgba = hsvaToRgba(newHsva);
            const newColor = {
              red : newRgba.r,
              green : newRgba.g,
              blue : newRgba.b,
              alpha
            };
            setColorHelper(newColor);
            setRed(newColor.red);
            setGreen(newColor.green);
            setBlue(newColor.blue);
            setAlpha(newColor.alpha);
            setHexadecimalHelper(
              newColor.red,
              newColor.green,
              newColor.blue,
              newColor.alpha,
              hexadecimalEncoding
            );
          }}
          width = "50%"
        />
      </>
    };
    return <>
      <Collapsible.Component
        title = "Color"
      >
        Edit mode:&nbsp;
        <select
          value = {editMode}
          onChange = {function(e) {
            const newEditMode = e.target.value;
            setEditMode(newEditMode as EditMode);
          }}
        >
          {editModes.map(function(editModeI : EditMode) {
            return <option
              key = {editModeI}
            >
              {editModeI}
            </option>;
          })}
        </select>
        {editModes.map(function(editModeI : EditMode) {
          return <div
            key = {editModeI}
            style = {{
              display : editMode === editModeI ? "block" : "none"
            }}
          >
            {modeRenderData[editModeI]}
          </div>;
        })}
      </Collapsible.Component>
    </>;
  }
}