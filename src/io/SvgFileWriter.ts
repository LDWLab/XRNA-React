import { RnaComplexProps, SVG_ELEMENT_HTML_ID } from "../App";

export function svgFileWriter(
  rnaComplexProps : RnaComplexProps,
  complexDocumentName : string
) {
  let svgHtmlElement = document.getElementById(SVG_ELEMENT_HTML_ID);
  if (svgHtmlElement === null) {
    throw "svgHtmlElement should never be null.";
  }
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
  const left = Number.parseInt(regexMatch[0]);
  const tempTransform = svgHtmlElement.getAttribute("transform");
  svgHtmlElement.setAttribute("transform", `translate(${left * -0.5}, ${top * -0.5})`);
  svgHtmlElement.style.top = "0px";
  let returnValue = svgHtmlElement.outerHTML;
  svgHtmlElement.setAttribute("transform", tempTransform ?? "");
  svgHtmlElement.style.top = tempTop;
  return returnValue;
}