import { MOUSE_OVER_TEXT_HTML_ID, RnaComplexProps, SVG_ELEMENT_HTML_ID } from "../App";

export function svgFileWriter(
  rnaComplexProps : RnaComplexProps,
  complexDocumentName : string
) {
  let svgHtmlElement = document.getElementById(SVG_ELEMENT_HTML_ID);
  if (svgHtmlElement === null) {
    throw "svgHtmlElement should never be null.";
  }
  svgHtmlElement.setAttribute("stroke", "none");
  const tempTop = svgHtmlElement.style.top;
  let regexMatch = /^(\d+)/.exec(tempTop);
  if (regexMatch === null) {
    throw "regexMatch should never be null.";
  }
  const top = Number.parseInt(regexMatch[0]);
  regexMatch = /^(\d+)/.exec(svgHtmlElement.style.left);
  if (regexMatch === null) {
    throw "regexMatch should never be null.";
  }
  const mouseOverTextGroup = svgHtmlElement.querySelector(`#${MOUSE_OVER_TEXT_HTML_ID}`)
  const left = Number.parseInt(regexMatch[0]);
  const tempTransform = svgHtmlElement.getAttribute("transform");
  const tempStroke = svgHtmlElement.getAttribute("stroke");
  svgHtmlElement.setAttribute("transform", `translate(${left * -0.5}, ${top * -0.5})`);
  svgHtmlElement.style.top = "0px";
  svgHtmlElement.setAttribute("stroke", "none");
  if (mouseOverTextGroup !== null) {
    mouseOverTextGroup.setAttribute("visibility", "hidden");
  }
  let returnValue = svgHtmlElement.outerHTML;
  svgHtmlElement.setAttribute("transform", tempTransform ?? "");
  svgHtmlElement.style.top = tempTop;
  svgHtmlElement.setAttribute("stroke", tempStroke ?? "none");
  if (mouseOverTextGroup !== null) {
    mouseOverTextGroup.setAttribute("visibility", "visible");
  }
  return returnValue;
}