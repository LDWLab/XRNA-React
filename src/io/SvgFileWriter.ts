import { MOUSE_OVER_TEXT_HTML_ID, PARENT_DIV_HTML_ID, RnaComplexProps, SVG_BACKGROUND_HTML_ID, SVG_ELEMENT_HTML_ID, SVG_SCENE_GROUP_HTML_ID, VIEWPORT_SCALE_GROUP_0_HTML_ID, VIEWPORT_SCALE_GROUP_1_HTML_ID, VIEWPORT_TRANSLATE_GROUP_0_HTML_ID, VIEWPORT_TRANSLATE_GROUP_1_HTML_ID } from "../App";
import { AffineMatrix, affineMatrixToString, identity, multiplyAffineMatrices, parseAffineMatrix } from "../data_structures/AffineMatrix";
import { SVG_PROPERTY_XRNA_TYPE, SvgPropertyXrnaType } from "./SvgInputFileHandler";

export function svgFileWriter(
  rnaComplexProps : RnaComplexProps,
  complexDocumentName : string
) {
  const sceneBounds = (document.querySelector(`#${SVG_SCENE_GROUP_HTML_ID}`) as SVGGElement).getBBox();
  let svgHtmlElement = document.getElementById(SVG_ELEMENT_HTML_ID)!;
  // Clone the svg HTML element to avoid changing XRNA.js
  const svgHtmlElementClone = <HTMLElement>svgHtmlElement.cloneNode(true);
  // Remove unnecessary elements.
  (<HTMLElement>svgHtmlElementClone.querySelector(`#${SVG_BACKGROUND_HTML_ID}`)).remove();
  (<HTMLElement>svgHtmlElementClone.querySelector(`#${MOUSE_OVER_TEXT_HTML_ID}`)).remove();

  svgHtmlElementClone.setAttribute("filter", "none");
  svgHtmlElementClone.setAttribute("stroke", "none");

  const tempLeft = svgHtmlElement.style.left;
  let regexMatch = /^(\d+)/.exec(tempLeft);
  if (regexMatch === null) {
    throw "regexMatch should never be null.";
  }
  const left = Number.parseInt(regexMatch[0]);
  const tempTop = svgHtmlElementClone.style.top;
  regexMatch = /^(\d+)/.exec(tempTop);
  if (regexMatch === null) {
    throw "regexMatch should never be null.";
  }
  const top = Number.parseInt(regexMatch[0]);
  svgHtmlElementClone.setAttribute("transform", `translate(${left * -0.5}, ${top * -0.5})`);
  svgHtmlElementClone.style.left = "0px";

  const svgSceneGroup = <SVGGElement>svgHtmlElementClone.querySelector(`#${SVG_SCENE_GROUP_HTML_ID}`);
  svgSceneGroup.setAttribute("transform", `scale(${Math.min((window as any).widthScale / sceneBounds.width, (window as any).heightScale / sceneBounds.height)}) scale(1, -1) translate(${-sceneBounds.x}, ${-(sceneBounds.y + sceneBounds.height)})`);

  const LABELS = "Labels";
  const MISCELLANEOUS = "Miscellaneous";
  const xrnaTypeToGroupHtmlIdMap : Partial<Record<SvgPropertyXrnaType, string>> = {
    [SvgPropertyXrnaType.BASE_PAIR] : "BasePairs",
    [SvgPropertyXrnaType.LABEL_CONTENT] : LABELS,
    [SvgPropertyXrnaType.LABEL_LINE] : LABELS,
    [SvgPropertyXrnaType.NUCLEOTIDE] : "Nucleotides"
  };
  const htmlIdToGroupMap : Record<string, HTMLElement>  = {};
  for (const htmlId of [...Object.values(xrnaTypeToGroupHtmlIdMap), MISCELLANEOUS]) {
    const group = document.createElement("g");
    group.setAttribute("id", htmlId);
    htmlIdToGroupMap[htmlId] = group;
  }

  function recurseOverGroups(
    cumulativeTransform : AffineMatrix,
    element : Element
  ) {
    const transform = element.getAttribute("transform");
    let transformAsMatrix = identity();
    if (transform !== null) {
      const transformComponents = transform.replaceAll(/\)\s*(?!$)/g, ")|").split("|");
      for (const transformComponent of transformComponents) {
        transformAsMatrix = multiplyAffineMatrices(
          transformAsMatrix,
          parseAffineMatrix(transformComponent)
        )
      }
    }
    cumulativeTransform = multiplyAffineMatrices(
      cumulativeTransform,
      transformAsMatrix
    );
    const xrnaType = <SvgPropertyXrnaType | null>element.getAttribute(SVG_PROPERTY_XRNA_TYPE);
    if (element.tagName === "g" && !((<Array<String>>[SvgPropertyXrnaType.BASE_PAIR, SvgPropertyXrnaType.LABEL_LINE]).includes(xrnaType ?? "")) ) {
      for (const childElement of Array.from(element.children)) {
        recurseOverGroups(
          cumulativeTransform,
          childElement
        );
      }
    } else {
      let group : HTMLElement;
      if (xrnaType !== null && xrnaType in xrnaTypeToGroupHtmlIdMap) {
        group = htmlIdToGroupMap[<string>xrnaTypeToGroupHtmlIdMap[xrnaType]];
      } else {
        group = htmlIdToGroupMap[MISCELLANEOUS];
      }
      element.setAttribute("transform", affineMatrixToString(cumulativeTransform));
      group.appendChild(element);
    }
  }

  for (const childElement of Array.from(svgSceneGroup.children)) {
    // Unpack grouped elements.
    recurseOverGroups(
      identity(),
      childElement
    );
    // Remove unnecessary groups/duplicates.
    childElement.remove();
  }
  for (const group of Object.values(htmlIdToGroupMap)) {
    if (group.children.length > 0) {
      svgSceneGroup.appendChild(group);
    }
  }
  svgHtmlElementClone.innerHTML = svgSceneGroup.outerHTML;
  return svgHtmlElementClone.outerHTML;

  // const parentDiv = document.getElementById(PARENT_DIV_HTML_ID);
  // if (parentDiv === null) {
  //   throw "parentDiv should never be null.";
  // }
  // let svgHtmlElement = document.getElementById(SVG_ELEMENT_HTML_ID);
  // if (svgHtmlElement === null) {
  //   throw "svgHtmlElement should never be null.";
  // }
  // svgHtmlElement.setAttribute("stroke", "none");
  // const tempTop = svgHtmlElement.style.top;
  // let regexMatch = /^(\d+)/.exec(tempTop);
  // if (regexMatch === null) {
  //   throw "regexMatch should never be null.";
  // }
  // const top = Number.parseInt(regexMatch[0]);
  // const tempLeft = svgHtmlElement.style.left;
  // regexMatch = /^(\d+)/.exec(tempLeft);
  // if (regexMatch === null) {
  //   throw "regexMatch should never be null.";
  // }
  // const sceneGroupHtmlElement = svgHtmlElement.querySelector(`#${SVG_SCENE_GROUP_HTML_ID}`) as SVGGElement;
  // const sceneBounds = sceneGroupHtmlElement.getBBox();
  // const mouseOverTextGroup = svgHtmlElement.querySelector(`#${MOUSE_OVER_TEXT_HTML_ID}`);
  // const left = Number.parseInt(regexMatch[0]);
  // const tempTransform = svgHtmlElement.getAttribute("transform");
  // const tempStroke = svgHtmlElement.getAttribute("stroke");
  // const viewportScaleGroup0 = document.getElementById(VIEWPORT_SCALE_GROUP_0_HTML_ID) as HTMLElement;
  // const viewportScaleGroup1 = document.getElementById(VIEWPORT_SCALE_GROUP_1_HTML_ID) as HTMLElement;
  // const tempScaleTransform0 = viewportScaleGroup0.getAttribute("transform") as string;
  // const tempScaleTransform1 = viewportScaleGroup1.getAttribute("transform") as string;
  // const viewportTranslateGroup0 = document.getElementById(VIEWPORT_TRANSLATE_GROUP_0_HTML_ID) as HTMLElement;
  // const tempTranslateTransform0 = viewportTranslateGroup0.getAttribute("transform") as string;
  // const viewportTranslateGroup1 = document.getElementById(VIEWPORT_TRANSLATE_GROUP_1_HTML_ID) as HTMLElement;
  // const tempTranslateTransform1 = viewportTranslateGroup1.getAttribute("transform") as string;
  // const tempFilter = svgHtmlElement.getAttribute("filter") as string;
  // svgHtmlElement.setAttribute("transform", `translate(${left * -0.5}, ${top * -0.5})`);
  // svgHtmlElement.style.left = "0px";
  // svgHtmlElement.setAttribute("stroke", "none");
  // if (mouseOverTextGroup !== null) {
  //   mouseOverTextGroup.setAttribute("visibility", "hidden");
  // }
  // viewportScaleGroup0.setAttribute("transform", `scale(${Math.min(
  //   (window as any).widthScale / sceneBounds.width,
  //   (window as any).heightScale / sceneBounds.height
  // )})`)
  // viewportScaleGroup1.setAttribute("transform", "");
  // viewportTranslateGroup0.setAttribute("transform", `scale(1, -1) translate(${-sceneBounds.x}, ${-(sceneBounds.y + sceneBounds.height)})`);
  // viewportTranslateGroup1.setAttribute("transform", "");
  // svgHtmlElement.setAttribute("filter", parentDiv.style.filter);

  // const svgBackgroundHtmlElement = svgHtmlElement.querySelector(`#${SVG_BACKGROUND_HTML_ID}`)!;
  // const tempSvgBackgroundVisibility = svgBackgroundHtmlElement.getAttribute("visibility");
  // svgBackgroundHtmlElement.setAttribute("visibility", "none");

  // let returnValue = svgHtmlElement.outerHTML;

  // svgHtmlElement.setAttribute("transform", tempTransform ?? "");
  // svgHtmlElement.style.left = tempLeft;
  // svgHtmlElement.setAttribute("stroke", tempStroke ?? "none");
  // if (mouseOverTextGroup !== null) {
  //   mouseOverTextGroup.setAttribute("visibility", "visible");
  // }
  // viewportScaleGroup0.setAttribute("transform", tempScaleTransform0);
  // viewportScaleGroup1.setAttribute("transform", tempScaleTransform1);
  // viewportTranslateGroup0.setAttribute("transform", tempTranslateTransform0);
  // viewportTranslateGroup1.setAttribute("transform", tempTranslateTransform1);
  // svgHtmlElement.setAttribute("filter", tempFilter);
  // svgBackgroundHtmlElement.setAttribute("visibility", tempSvgBackgroundVisibility ?? "visible");
  // return returnValue;
}