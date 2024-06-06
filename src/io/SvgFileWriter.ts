import { MOUSE_OVER_TEXT_HTML_ID, PARENT_DIV_HTML_ID, RnaComplexProps, SVG_BACKGROUND_HTML_ID, SVG_ELEMENT_HTML_ID, SVG_SCENE_GROUP_HTML_ID, VIEWPORT_SCALE_GROUP_0_HTML_ID, VIEWPORT_SCALE_GROUP_1_HTML_ID, VIEWPORT_TRANSLATE_GROUP_0_HTML_ID, VIEWPORT_TRANSLATE_GROUP_1_HTML_ID } from "../App";

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
  const sceneGroupHtmlElement = svgHtmlElement.querySelector(`#${SVG_SCENE_GROUP_HTML_ID}`) as SVGGElement;
  const sceneBounds = sceneGroupHtmlElement.getBBox();
  const mouseOverTextGroup = svgHtmlElement.querySelector(`#${MOUSE_OVER_TEXT_HTML_ID}`);
  const left = Number.parseInt(regexMatch[0]);
  const tempTransform = svgHtmlElement.getAttribute("transform");
  const tempStroke = svgHtmlElement.getAttribute("stroke");
  const viewportScaleGroup0 = document.getElementById(VIEWPORT_SCALE_GROUP_0_HTML_ID) as HTMLElement;
  const viewportScaleGroup1 = document.getElementById(VIEWPORT_SCALE_GROUP_1_HTML_ID) as HTMLElement;
  const tempScaleTransform0 = viewportScaleGroup0.getAttribute("transform") as string;
  const tempScaleTransform1 = viewportScaleGroup1.getAttribute("transform") as string;
  const viewportTranslateGroup0 = document.getElementById(VIEWPORT_TRANSLATE_GROUP_0_HTML_ID) as HTMLElement;
  const tempTranslateTransform0 = viewportTranslateGroup0.getAttribute("transform") as string;
  const viewportTranslateGroup1 = document.getElementById(VIEWPORT_TRANSLATE_GROUP_1_HTML_ID) as HTMLElement;
  const tempTranslateTransform1 = viewportTranslateGroup1.getAttribute("transform") as string;
  const tempFilter = svgHtmlElement.getAttribute("filter") as string;
  svgHtmlElement.setAttribute("transform", `translate(${left * -0.5}, ${top * -0.5})`);
  svgHtmlElement.style.left = "0px";
  svgHtmlElement.setAttribute("stroke", "none");
  if (mouseOverTextGroup !== null) {
    mouseOverTextGroup.setAttribute("visibility", "hidden");
  }
  viewportScaleGroup0.setAttribute("transform", `scale(${Math.min(
    (window as any).widthScale / sceneBounds.width,
    (window as any).heightScale / sceneBounds.height
  )})`)
  viewportScaleGroup1.setAttribute("transform", "");
  viewportTranslateGroup0.setAttribute("transform", `scale(1, -1) translate(${-sceneBounds.x}, ${-(sceneBounds.y + sceneBounds.height)})`);
  viewportTranslateGroup1.setAttribute("transform", "");
  svgHtmlElement.setAttribute("filter", parentDiv.style.filter);

  const svgBackgroundHtmlElement = svgHtmlElement.querySelector(`#${SVG_BACKGROUND_HTML_ID}`)!;
  const tempSvgBackgroundVisibility = svgBackgroundHtmlElement.getAttribute("visibility");
  svgBackgroundHtmlElement.setAttribute("visibility", "none");

  let returnValue = svgHtmlElement.outerHTML;

  svgHtmlElement.setAttribute("transform", tempTransform ?? "");
  svgHtmlElement.style.left = tempLeft;
  svgHtmlElement.setAttribute("stroke", tempStroke ?? "none");
  if (mouseOverTextGroup !== null) {
    mouseOverTextGroup.setAttribute("visibility", "visible");
  }
  viewportScaleGroup0.setAttribute("transform", tempScaleTransform0);
  viewportScaleGroup1.setAttribute("transform", tempScaleTransform1);
  viewportTranslateGroup0.setAttribute("transform", tempTranslateTransform0);
  viewportTranslateGroup1.setAttribute("transform", tempTranslateTransform1);
  svgHtmlElement.setAttribute("filter", tempFilter);
  svgBackgroundHtmlElement.setAttribute("visibility", tempSvgBackgroundVisibility ?? "visible");
  return returnValue;
}