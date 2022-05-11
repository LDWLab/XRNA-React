import { useState, createRef, useEffect } from 'react'
import { useResizeDetector } from 'react-resize-detector';
import inputFileReaders, { type FileReader } from './inputUI';
import outputFileWriters, { type FileWriter } from './outputUI';
import selectionConstraints from './selectionConstraints';
import { RNAComplex } from './RNAComplex'
import { RNAMolecule } from './RNAMolecule';
import { BasePairType, Nucleotide } from './Nucleotide';
import { Vector2D } from './Vector2D';

type ButtonData = {
  highlightColor : string
};

enum Tab {
  IMPORT_EXPORT = "Import/Export",
  EDIT = "Edit",
  ANNOTATE = "Annotate",
  SETTINGS = "Settings"
}

function App() {
  const buttonData : Record<Tab, ButtonData> = {
    [Tab.IMPORT_EXPORT] : {
      highlightColor : "rgb(24, 98, 24)"
    },
    [Tab.EDIT] : {
      highlightColor : "rgb(204, 85, 0)"
    },
    [Tab.ANNOTATE] : {
      highlightColor : "rgb(34, 34, 139)"
    },
    [Tab.SETTINGS] : {
      highlightColor : "purple"
    }
  };
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.IMPORT_EXPORT);
  const [showTabReminderFlag, setShowTabReminderFlag] = useState<boolean>(true);
  const [outputFileName, setOutputFileName] = useState<string>("");
  const [copyInputFileNameToOutputFileNameFlag, setCopyInputFileNameToOutputFileNameFlag] = useState<boolean>(true);
  const [copyInputFileExtensionToOutputFileExtensionFlag, setCopyInputFileExtensionToOutputFileExtensionFlag] = useState<boolean>(true);
  const [outputFileExtension, setOutputFileExtension] = useState<string>("");
  const [downloadAnchorHref, setDownloadAnchorHref] = useState<string>();
  const outputFileExtensionSelectRef = createRef<HTMLSelectElement>();
  const downloadAnchorRef = createRef<HTMLAnchorElement>();
  useEffect(() => {
    // Upon load:
    // * Initialize the output-file select.
    (outputFileExtensionSelectRef.current as HTMLSelectElement).selectedIndex = -1;
  }, []);
  useEffect(() => {
    (downloadAnchorRef.current as HTMLAnchorElement).click();
  }, [downloadAnchorHref]);
  const [zoomExponent, setZoomExponent] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const zoomBase = 1.1;
  const [showToolsFlag, setShowToolsFlag] = useState<boolean>(true);
  const parentDivDimensionsWatcher = useResizeDetector();
  const bannerDivDimensionsWatcher = useResizeDetector();
  const [invertColorsInViewFlag, setInvertColorsInViewFlag] = useState<boolean>(false);
  const [invertColorsInOutputFileFlag, setInvertColorsInOutputFileFlag] = useState<boolean>(false);
  // In pixels
  const tabReminderBorderWidth = 6;
  const [svgContent, setSvgContent] = useState<JSX.Element>(<g id="svgContent"></g>);
  const [svgTranslate, setSvgTranslate] = useState({x : 0, y : 0});
  useEffect(() => {
    let svgContentHtml = document.getElementById("svgContent") as HTMLElement;
    let svgContentBoundingClientRect = svgContentHtml.getBoundingClientRect();
    let svgHtml = document.getElementById("svg") as HTMLElement;
    let svgBoundingClientRect = svgHtml.getBoundingClientRect();
    setSvgTranslate({
      x : svgBoundingClientRect.x - svgContentBoundingClientRect.x,
      y : svgBoundingClientRect.y - svgContentBoundingClientRect.y
    });
    setSvgContentDimensions({
      width : svgContentBoundingClientRect.width,
      height : svgContentBoundingClientRect.height
    });
    document.querySelectorAll("text").forEach((textElement : SVGTextElement) => {
      let boundingRect = textElement.getBoundingClientRect();
      textElement.setAttribute("x", `${Number.parseFloat(textElement.getAttribute("x") ?? "0") - (boundingRect.width / 2)}`);
      textElement.setAttribute("y", `${Number.parseFloat(textElement.getAttribute("y") ?? "0") + (boundingRect.height / 4)}`);
    });
  }, [svgContent]);
  const [svgHeight, setSvgHeight] = useState(0);
  const [svgContentDimensions, setSvgContentDimensions] = useState({width : 1, height : 1});
  useEffect(() => {
    setSvgHeight((parentDivDimensionsWatcher.height as number) - (bannerDivDimensionsWatcher.height as number));
  }, [parentDivDimensionsWatcher.height, bannerDivDimensionsWatcher.height]);
  return (
    <div style={{
      border : showTabReminderFlag ? `solid ${(buttonData[currentTab] as ButtonData).highlightColor} 6px` : "none" ,
      color : "white",
      padding : 0,
      margin : 0,
      backgroundColor : "rgb(54, 64, 79)",
      width : showTabReminderFlag ? `calc(100% - ${2 * tabReminderBorderWidth}px)` : "100%",
      height : showTabReminderFlag ? `calc(100% - ${2 * tabReminderBorderWidth}px)` : "100%",
      position : "absolute",
      display : "block"
    }} ref={parentDivDimensionsWatcher.ref}>
      <div ref={bannerDivDimensionsWatcher.ref}>
        <div style={{
          display : showToolsFlag ? "block" : "none"
        }}>
          {Object.entries(buttonData).map(([tabName, buttonDatum]) => {
            return <button style={{
              border : "groove gray",
              color : currentTab === tabName ? "white" : "black",
              backgroundColor : currentTab === tabName ? buttonDatum.highlightColor : "white"
            }} key={tabName} onClick={() => setCurrentTab(tabName as Tab)}>{tabName}</button>;
          })}
          <div style={{
            display : currentTab === Tab.IMPORT_EXPORT ? "block" : "none"
          }}>
            <label>
              Upload an input file&nbsp;
              <input type="file" accept={Object.keys(inputFileReaders).map(inputFileExtension => "." + inputFileExtension).join(",")} onChange={event => {
                let files = event.target.files;
                if (files && files.length > 0) {
                  let inputFileName = (files[0] as File).name;
                  let lastIndexOfPeriod = inputFileName.lastIndexOf(".");
                  if (copyInputFileNameToOutputFileNameFlag) {
                    setOutputFileName(inputFileName.substring(0, lastIndexOfPeriod));
                  }
                  let outputFileExtension = inputFileName.substring(lastIndexOfPeriod + 1);
                  if (copyInputFileExtensionToOutputFileExtensionFlag) {
                    let newSelectedIndex = Array.from((outputFileExtensionSelectRef.current as HTMLSelectElement).children).findIndex(child => child.getAttribute("value") === outputFileExtension);
                    (outputFileExtensionSelectRef.current as HTMLSelectElement).selectedIndex = newSelectedIndex;
                    setOutputFileExtension(newSelectedIndex === -1 ? "" : outputFileExtension);
                  }
                  let reader = new FileReader();
                  reader.addEventListener("load", event => {
                    // Read the content of the input file.
                    let parsedInput = (inputFileReaders[outputFileExtension] as FileReader)((event.target as globalThis.FileReader).result as string);
                    let newSvg = <g id="svgContent">
                    {
                      parsedInput.rnaComplexes.map((rnaComplex : RNAComplex, index : number) => <g key={index} transform="scale(1 -1)">
                      {
                        rnaComplex.rnaMolecules.map((rnaMolecule : RNAMolecule, index : number) => <g key={index}>
                          {
                            Object.values(rnaMolecule.nucleotidesMap).map((nucleotide : Nucleotide, index : number) => {
                              let elements = [
                                <text id={[rnaComplex.name, rnaMolecule.name, index].join(":")} transform="scale(1 -1)" style={{
                                  fill : nucleotide.color.toCSS(),
                                  fontSize : nucleotide.font.size,
                                  fontWeight : nucleotide.font.weight,
                                  fontStyle : nucleotide.font.style,
                                  fontFamily : nucleotide.font.family
                                }} key="symbol">{nucleotide.symbol}</text>
                              ];
                              if (nucleotide.basePair !== null) {
                                switch (nucleotide.basePair.type) {
                                  case BasePairType.CANONICAL: {
                                    let basePairNucleotide = (rnaComplex.rnaMolecules[nucleotide.basePair.rnaMoleculeIndex] as RNAMolecule).nucleotidesMap[nucleotide.basePair.nucleotideIndex] as Nucleotide;
                                    let difference = Vector2D.subtract(basePairNucleotide.position, nucleotide.position);
                                    let interpolatedNucleotidePosition = Vector2D.scaleUp(difference, 0.3);
                                    let interpolatedBasePairNucleotidePosition = Vector2D.scaleUp(difference, 0.7)
                                    elements.push(
                                      <line x1={interpolatedNucleotidePosition.x} y1={interpolatedNucleotidePosition.y} x2={interpolatedBasePairNucleotidePosition.x} y2={interpolatedBasePairNucleotidePosition.y} stroke="black" key="bondLine" strokeWidth="0.2"/>
                                    );
                                    break;
                                  }
                                }
                              }
                              if (nucleotide.labelLine !== null) {
                                elements.push(<line x1={nucleotide.labelLine.endpoint0.x} y1={nucleotide.labelLine.endpoint0.y} x2={nucleotide.labelLine.endpoint1.x} y2={nucleotide.labelLine.endpoint1.y} strokeWidth={nucleotide.labelLine.strokeWidth} stroke={nucleotide.labelLine.color.toCSS()} key="labelLine"/>);
                              }
                              if (nucleotide.labelContent !== null) {
                                elements.push(<text x={nucleotide.labelContent.position.x} y={-nucleotide.labelContent.position.y} transform="scale(1 -1)" fill={nucleotide.labelContent.color.toCSS()} fontSize={nucleotide.labelContent.font.size} fontFamily={nucleotide.labelContent.font.family} fontStyle={nucleotide.labelContent.font.style} fontWeight={nucleotide.labelContent.font.weight  } key="labelContent">{nucleotide.labelContent.content}</text>);
                              }
                              return <g key={index} transform={`translate(${nucleotide.position.x} ${nucleotide.position.y})`}>
                                {elements}
                              </g>
                            })
                          }
                        </g>)
                      }
                      </g>)
                    }
                  </g>
                    setSvgContent(newSvg);
                  });
                  reader.readAsText(files[0] as File);
                }
              }}/>
            </label>
            <br />
            <label>
              Create a downloadable output file&nbsp;
              <input type="text" value={outputFileName} onChange={event => setOutputFileName(event.target.value)} />
            </label>
            <select onChange={event => setOutputFileExtension(event.target.value)} ref={outputFileExtensionSelectRef}>
              {Object.entries(outputFileWriters).map(([fileExtension, ]) => {
                return <option key={fileExtension} value={fileExtension}>{"." + fileExtension}</option>
              })}
            </select>
            <a href={downloadAnchorHref} download={outputFileName + "." + outputFileExtension} style={{
              display : "none"
            }} ref={downloadAnchorRef}></a>
            <button onClick={() => {
              setDownloadAnchorHref(`data:text/plain;charset=utf-8,${encodeURIComponent((outputFileWriters[outputFileExtension] as FileWriter)())}`);
            }} disabled={!outputFileName || !outputFileExtension}>Download</button>
          </div>
          <div style={{
            display : currentTab === Tab.EDIT ? "block" : "none"
          }}>

          </div>
          <div style={{
            display : currentTab === Tab.ANNOTATE ? "block" : "none"
          }}>

          </div>
          <div style={{
            display : currentTab === Tab.SETTINGS ? "block" : "none"
          }}>
            <label>
              Show tab reminder&nbsp;
              <input type="checkbox" onChange={() => setShowTabReminderFlag(!showTabReminderFlag)} checked={showTabReminderFlag} />
            </label>
            <br />
            <label>
              Copy input-file name and extension to output-file name&nbsp;
              <input type="checkbox" onChange={() => {
                setCopyInputFileNameToOutputFileNameFlag(!copyInputFileNameToOutputFileNameFlag);
                setCopyInputFileExtensionToOutputFileExtensionFlag(!copyInputFileNameToOutputFileNameFlag);
              }} checked={copyInputFileNameToOutputFileNameFlag} />
            </label>
            <label>
              &nbsp;and extension&nbsp;
              <input type="checkbox" onChange={() => setCopyInputFileExtensionToOutputFileExtensionFlag(!copyInputFileExtensionToOutputFileExtensionFlag)} checked={copyInputFileExtensionToOutputFileExtensionFlag} />
            </label>
            <br />
            <label>
              Dark mode (invert colors) in viewer&nbsp;
              <input type="checkbox" onChange={() => {
                setInvertColorsInViewFlag(!invertColorsInViewFlag);
                setInvertColorsInOutputFileFlag(!invertColorsInViewFlag);
              }} checked={invertColorsInViewFlag} />
            </label>
            <label>
            &nbsp;and in output file(s)&nbsp;
              <input type="checkbox" onChange={() => setInvertColorsInOutputFileFlag(!invertColorsInOutputFileFlag)} checked={invertColorsInOutputFileFlag} />
            </label>
          </div>
          <label>
            Selection Constraint&nbsp;
            <select>
              {Object.entries(selectionConstraints).map(([key, ]) => {
                return <option key={key}>{key}</option>
              })}
            </select>
          </label>
          <br />
          <label>
            Zoom&nbsp;
            <input type="range" value={zoomExponent} min={-50} max={50} onChange={event => {
              let newZoomExponent = Number.parseInt((event.target as HTMLInputElement).value);
              setZoomExponent(newZoomExponent);
              setZoom(Math.pow(zoomBase, newZoomExponent));
            }}/>
            <input type="number" value={zoom} onChange={event => {
              let newZoom = Number.parseFloat(event.target.value);
              setZoom(newZoom);
              setZoomExponent(Math.log(newZoom) / Math.log(zoomBase));
            }} step={0.01}/>
          </label>
        </div>
        <button style={{
          color : "white",
          backgroundColor : "inherit",
          border : "groove gray",
          width : "10%",
          display : "block",
          marginLeft : "auto",
          marginRight : "auto"
        }} onClick={() => setShowToolsFlag(!showToolsFlag)}>{showToolsFlag ? "↑" : "↓"}</button>
        
      </div>
      <svg id="svg" viewBox={`0 0 ${parentDivDimensionsWatcher.width ?? 0} ${svgHeight}`} version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" style={{
        backgroundColor : invertColorsInViewFlag ? "black" : "white",
        display : "block",
        width : "100%",
        height : svgHeight,
        position : "absolute"
      }}>
        <g transform={`scale(${zoom * Math.min((parentDivDimensionsWatcher.width ?? 1) / svgContentDimensions.width, svgHeight / svgContentDimensions.height)}) translate(${svgTranslate.x} ${svgTranslate.y})`}>
          {svgContent}
        </g>
      </svg>
    </div>
  );
}

export default App;