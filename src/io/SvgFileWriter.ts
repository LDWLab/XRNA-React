import { MOUSE_OVER_TEXT_HTML_ID, PARENT_DIV_HTML_ID, RnaComplexProps, SVG_ELEMENT_HTML_ID, VIEWPORT_SCALE_GROUP_HTML_ID, VIEWPORT_TRANSLATE_GROUP_HTML_ID } from "../App";

export function svgFileWriter(
  rnaComplexProps : RnaComplexProps,
  complexDocumentName : string
) {
  const parentDiv = document.getElementById(PARENT_DIV_HTML_ID);
  if (parentDiv === null) {
    throw "parentDiv should never be null.";
  }
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
  const tempLeft = svgHtmlElement.style.left;
  regexMatch = /^(\d+)/.exec(tempLeft);
  if (regexMatch === null) {
    throw "regexMatch should never be null.";
  }
  const mouseOverTextGroup = svgHtmlElement.querySelector(`#${MOUSE_OVER_TEXT_HTML_ID}`)
  const left = Number.parseInt(regexMatch[0]);
  const tempTransform = svgHtmlElement.getAttribute("transform");
  const tempStroke = svgHtmlElement.getAttribute("stroke");
  const viewportScaleGroup = document.getElementById(VIEWPORT_SCALE_GROUP_HTML_ID) as HTMLElement;
  const tempScaleTransform = viewportScaleGroup.getAttribute("transform") as string;
  const viewportTranslateGroup = document.getElementById(VIEWPORT_TRANSLATE_GROUP_HTML_ID) as HTMLElement;
  const tempTranslateTransform = viewportTranslateGroup.getAttribute("transform") as string;
  const tempFilter = svgHtmlElement.getAttribute("filter") as string;
  svgHtmlElement.setAttribute("transform", `translate(${left * -0.5}, ${top * -0.5})`);
  svgHtmlElement.style.left = "0px";
  svgHtmlElement.setAttribute("stroke", "none");
  if (mouseOverTextGroup !== null) {
    mouseOverTextGroup.setAttribute("visibility", "hidden");
  }
  viewportScaleGroup.setAttribute("transform", "");
  viewportTranslateGroup.setAttribute("transform", "");
  svgHtmlElement.setAttribute("filter", parentDiv.style.filter);

  let returnValue = svgHtmlElement.outerHTML;

  svgHtmlElement.setAttribute("transform", tempTransform ?? "");
  svgHtmlElement.style.left = tempLeft;
  svgHtmlElement.setAttribute("stroke", tempStroke ?? "none");
  if (mouseOverTextGroup !== null) {
    mouseOverTextGroup.setAttribute("visibility", "visible");
  }
  viewportScaleGroup.setAttribute("transform", tempScaleTransform);
  viewportTranslateGroup.setAttribute("transform", tempTranslateTransform);
  svgHtmlElement.setAttribute("filter", tempFilter);
  return returnValue;
}