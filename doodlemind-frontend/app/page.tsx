'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import PenModel from '@/models/pen.model';
import LineModel from '@/models/line.model';
import ToolsCard from '@/components/ToolsCard';
import { Tools } from '@/enums/Tools';
import EllipseModel from '@/models/ellipse.model';
import ArrowModel from '@/models/arrow.model';
import PolygonModel from '@/models/polygon.model';
import TextModel from '@/models/text.model';
import PropertiesCard from '@/components/properties-card';
import { StrokeVariant } from '@/enums/StrokeVariant';
import { FillColor, StrokeColor } from '@/enums/Colors';
import { ArrowHeads } from '@/enums/ArrowHeads';
import { Fonts } from '@/enums/Fonts';
import SelectionService from '@/services/selection.service';
import Store from '@/store/Store';
import { Cursors } from '@/enums/Cursors';
import EraserService from '@/services/eraser.service';
import MoveService from '@/services/move.service';
import { SelectionResize } from '@/enums/SelectionResize';
import ResizeService from '@/services/resize.service';
import ImageModel from '@/models/image.model';
import UndoRedoCard from '@/components/UndoRedoCard';
import UndoRedoService from '@/services/undo.redo.service';
import IconCard from '@/components/IconCard';
import ExportCard from '@/components/export/ExportCard';
import DarkSwitch from '@/components/theme-switch/Switch';
import { useTheme } from '@/providers/ThemeProvider';
import { Theme } from '@/enums/Theme';
import ActionsService from '@/services/actions.service';
import GithubCard from '@/components/GithubCard';
import PredictionsSidebar from '@/components/PredictionsSidebar';
import { playSmartNarration } from '@/utils/playSmartNarration';

export type Mouse = {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  down: boolean;
  cursor: Cursors;
  resizeState: SelectionResize;
  cursorState: 'move' | 'resize' | 'none';
};

const baseUrl = process.env.BACKEND_URL || 'http://127.0.0.1:5004';

export default function Home() {
  const { theme } = useTheme();

  const parentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<Mouse>({
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    down: false,
    cursor: Cursors.DEFAULT,
    resizeState: SelectionResize.None,
    cursorState: 'none',
  });

  const [currentStroke, setCurrentStroke] = useState<{ x: number[]; y: number[] }>({
    x: [],
    y: [],
  });
  const [strokes, setStrokes] = useState<Array<[number[], number[]]>>([]);
  const [undoneStrokes, setUndoneStrokes] = useState<Array<[number[], number[]]>>([]);
  const currentStrokeRef = useRef<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const [predictionResult, setPredictionResult] = useState<any>(null);

  const [selectedTool, setSelectedTool] = useState<Tools>(Tools.Pen);
  const [selectedShapeType, setSelectedShapeType] = useState<
    | Tools.Pen
    | Tools.Line
    | Tools.Polygon
    | Tools.Ellipse
    | Tools.Arrow
    | Tools.Text
    | Tools.Image
    | null
  >(null);

  const [selectedStrokeColor, setSelectedStrokeColor] = useState<StrokeColor>(
    theme === Theme.Dark ? StrokeColor.White : StrokeColor.Black
  );
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState<number>(3);
  const [selectedStrokeVariant, setSelectedStrokeVariant] = useState<StrokeVariant>(
    StrokeVariant.Solid
  );

  //shape controls
  const [selectedFillColor, setSelectedFillColor] = useState<FillColor>(FillColor.Transparent);
  const [selectedShapeSides, setSelectedShapeSides] = useState<number>(4);
  const [selectedShapeRotation, setSelectedShapeRotation] = useState<number>(45);

  //arrow head controls
  const [selectedLeftArrowHead, setSelectedLeftArrowHead] = useState<ArrowHeads>(ArrowHeads.Line);
  const [selectedRightArrowHead, setSelectedRightArrowHead] = useState<ArrowHeads>(
    ArrowHeads.Arrow
  );

  //text controls
  const [selectedFontSize, setSelectedFontSize] = useState<number>(30);
  const [selectedFontFamily, setSelectedFontFamily] = useState<string>(Fonts.Arial);

  const initCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const ratio = Math.ceil(window.devicePixelRatio);
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }, []);

  const detectSelectedShape = useCallback(() => {
    const allShapes = Store.allShapes;
    const selectedShape = allShapes.find((shape) => shape.isSelected);

    if (!selectedShape) {
      setSelectedShapeType(null);
      return;
    }

    switch (selectedShape.constructor) {
      case PenModel:
        setSelectedShapeType(Tools.Pen);
        break;
      case LineModel:
        setSelectedShapeType(Tools.Line);
        break;
      case EllipseModel:
        setSelectedShapeType(Tools.Ellipse);
        break;
      case ArrowModel:
        setSelectedShapeType(Tools.Arrow);
        break;
      case PolygonModel:
        setSelectedShapeType(Tools.Polygon);
        break;
      case TextModel:
        setSelectedShapeType(Tools.Text);
        break;
      case ImageModel:
        setSelectedShapeType(Tools.Image);
        break;
      default:
        setSelectedShapeType(null);
    }
  }, []);

  // Warming up the endpoint
  useEffect(() => {
    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'warming up' }),
    }).catch(() => {});
  }, []);

  
  const draw = useCallback(
    (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, drawFn: () => void) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      //filter all empty shapes except that is selected
      Store.filterEmptyShapes(selectedTool);
      UndoRedoService.filterEmptyShapes(selectedTool);

      //draw all shapes
      Store.drawAllShapes(ctx);

      detectSelectedShape();

      drawFn();
    },
    [detectSelectedShape, selectedTool]
  );

  const keyDownHandler = useCallback(
    (e: KeyboardEvent) => {
      //handle tool selection from 1 to 9
      if (
        //do not change tool if any text input is focused
        !(
          selectedTool === Tools.Text &&
          TextModel.isAnyTextFocused(parentRef.current as HTMLElement)
        )
      ) {
        Object.values(Tools).forEach((tool, index) => {
          if (e.key === (index + 1).toString()) setSelectedTool(tool);
        });
      }

      //do not handle undo redo if any text input is focused
      if (TextModel.isAnyTextFocused(parentRef.current as HTMLElement)) return;

      //handle undo redo
      if (e.key === 'z' && e.ctrlKey) {
        e.preventDefault();

        setStrokes((prevStrokes) => {
          if (prevStrokes.length === 0) return prevStrokes;
          const removedStroke = prevStrokes[prevStrokes.length - 1];
          setUndoneStrokes((prevUndone) => [...prevUndone, removedStroke]);
          // Reset stroke accumulator if needed
          currentStrokeRef.current = { x: [], y: [] };
          console.log('undo', prevStrokes.slice(0, -1), removedStroke);
          return prevStrokes.slice(0, -1);
        });

        UndoRedoService.undo(selectedTool);
      } else if (e.key === 'y' && e.ctrlKey) {
        setUndoneStrokes((prevUndone) => {
          if (prevUndone.length === 0) return prevUndone;
          // Get the last undone stroke
          const lastUndoneStroke = prevUndone[prevUndone.length - 1];
          // Remove it from undoneStrokes and add it to strokes
          setStrokes((prevStrokes) => [...prevStrokes, lastUndoneStroke]);
          return prevUndone.slice(0, -1);
        });
        UndoRedoService.redo(selectedTool);
      }

      //handle copy
      if (e.key === 'c' && e.ctrlKey) {
        ActionsService.copySelectedShape();
      }

      //handle delete
      if (e.key === 'Delete') {
        ActionsService.deleteSelectedShape();
      }
    },
    [selectedTool]
  );

  const pasteImageHandler = useCallback((e: ClipboardEvent) => {
    ImageModel.pasteImage(setSelectedTool, parentRef, e);
  }, []);

  useEffect(() => {
    initCanvas();

    let animateId: number;

    const canvas = canvasRef.current as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    //offscreen canvas
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
    const offscreenCtx = offscreenCanvas.getContext('2d');

    if (!offscreenCtx) return;

    const animate = () => {
      animateId = requestAnimationFrame(animate);

      //conversion to HTML or canvas happen before drawing anything else
      if (selectedTool === Tools.Text) {
        TextModel.convertToHtml(parentRef.current as HTMLElement);
      } else {
        TextModel.convertToCanvas(parentRef.current as HTMLElement);
      }

      //clear all selections if the selected tool is not select before drawing anything
      if (selectedTool !== Tools.Select) {
        SelectionService.clearAllSelections();
      }

      switch (selectedTool) {
        case Tools.Select:
          mouseRef.current.cursor = Cursors.DEFAULT;
          draw(
            canvas,
            offscreenCtx,
            SelectionService.drawSelectionBoxes.bind(null, offscreenCtx, mouseRef)
          );
          MoveService.moveSelectedShape(mouseRef);
          ResizeService.resizeSelectedShape(mouseRef);
          break;
        case Tools.Pen:
          draw(
            canvas,
            offscreenCtx,
            PenModel.drawCurrentPen.bind(
              null,
              mouseRef,
              selectedStrokeColor,
              selectedStrokeWidth,
              selectedStrokeVariant
            )
          );
          mouseRef.current.cursor = Cursors.CROSSHAIR;
          break;
        case Tools.Line:
          draw(
            canvas,
            offscreenCtx,
            LineModel.drawCurrentLine.bind(
              null,
              mouseRef,
              selectedStrokeColor,
              selectedStrokeWidth,
              selectedStrokeVariant
            )
          );
          mouseRef.current.cursor = Cursors.CROSSHAIR;
          break;
        case Tools.Ellipse:
          draw(
            canvas,
            offscreenCtx,
            EllipseModel.drawCurrentEllipse.bind(
              null,
              mouseRef,
              selectedStrokeColor,
              selectedStrokeWidth,
              selectedStrokeVariant,
              selectedFillColor
            )
          );
          mouseRef.current.cursor = Cursors.CROSSHAIR;
          break;
        case Tools.Polygon:
          draw(
            canvas,
            offscreenCtx,
            PolygonModel.drawCurrentPolygon.bind(
              null,
              mouseRef,
              selectedStrokeColor,
              selectedStrokeWidth,
              selectedStrokeVariant,
              selectedShapeSides,
              selectedShapeRotation,
              selectedFillColor
            )
          );
          mouseRef.current.cursor = Cursors.CROSSHAIR;
          break;
        case Tools.Arrow:
          draw(
            canvas,
            offscreenCtx,
            ArrowModel.drawCurrentArrow.bind(
              null,
              mouseRef,
              selectedStrokeColor,
              selectedStrokeWidth,
              selectedStrokeVariant,
              selectedLeftArrowHead,
              selectedRightArrowHead
            )
          );
          mouseRef.current.cursor = Cursors.CROSSHAIR;
          break;
        case Tools.Text:
          draw(
            canvas,
            offscreenCtx,
            TextModel.drawCurrentText.bind(
              null,
              mouseRef,
              parentRef,
              selectedFontSize,
              selectedStrokeColor,
              selectedFontFamily,
              Store.allShapes.length
            )
          );
          mouseRef.current.cursor = Cursors.TEXT;
          break;
        case Tools.Image:
          draw(
            canvas,
            offscreenCtx,
            ImageModel.openFileChooser.bind(ImageModel, setSelectedTool, parentRef)
          );
          break;
        case Tools.Eraser:
          draw(
            canvas,
            offscreenCtx,
            EraserService.drawEraser.bind(null, mouseRef, offscreenCtx, theme)
          );
          mouseRef.current.cursor = Cursors.NONE;
          break;
      }

      canvas.style.cursor = mouseRef.current.cursor;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(offscreenCanvas, 0, 0);
    };

    animate();

    //change theme of existing shapes
    Store.changeTheme(theme, parentRef.current as HTMLElement);
    UndoRedoService.changeTheme(theme);

    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('paste', pasteImageHandler);
    return () => {
      window.cancelAnimationFrame(animateId);
      document.removeEventListener('keydown', keyDownHandler);
      document.removeEventListener('paste', pasteImageHandler);
    };
  }, [
    draw,
    initCanvas,
    selectedStrokeColor,
    selectedStrokeVariant,
    selectedStrokeWidth,
    selectedTool,
    selectedShapeType,
    selectedFillColor,
    selectedShapeSides,
    selectedShapeRotation,
    selectedLeftArrowHead,
    selectedRightArrowHead,
    selectedFontSize,
    selectedFontFamily,
    keyDownHandler,
    pasteImageHandler,
    theme,
  ]);

  const throttle = (callback: Function, delay: number) => {
    let previousCall = new Date().getTime();
    return function (this: any) {
      const time = new Date().getTime();
      if (time - previousCall >= delay) {
        previousCall = time;
        callback.apply(this, arguments);
      }
    };
  };

  const handleMouseMove = throttle(
    (e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        prevX: mouseRef.current.x,
        prevY: mouseRef.current.y,
        down: mouseRef.current.down,
        cursor: mouseRef.current.cursor,
        resizeState: mouseRef.current.resizeState,
        cursorState: mouseRef.current.cursorState,
      };

      if (mouseRef.current.down && selectedTool == Tools.Pen) {
        // Accumulate stroke coordinates in the ref without causing a re-render
        currentStrokeRef.current.x.push(mouseRef.current.x);
        currentStrokeRef.current.y.push(mouseRef.current.y);
      }
    },
    selectedTool === Tools.Eraser ? 0 : 5
  );

  const handleMouseDown = () => {
    mouseRef.current.down = true;

    if (selectedTool == Tools.Pen) currentStrokeRef.current = { x: [], y: [] };
  };

  const handleMouseUp = () => {
    if (!mouseRef.current.down) return;

    mouseRef.current.down = false;
    mouseRef.current.cursorState = 'none';

    scaleAndPredict();
  };

  const scaleAndPredict = () => {
    if (
      currentStrokeRef.current.x.length > 0 &&
      currentStrokeRef.current.y.length > 0 &&
      selectedTool == Tools.Pen
    ) {
      const updatedStrokes: [number[], number[]][] = [
        ...strokes,
        [currentStrokeRef.current.x, currentStrokeRef.current.y],
      ];

      // Apply scaling and centering
      const processedData = scaleAndCenterStrokes(updatedStrokes, 256);

      // Update state with unprocessed strokes
      setStrokes(updatedStrokes);

      handlePredict(processedData);

      setCurrentStroke({ ...currentStrokeRef.current });
    }
  };

  const scaleAndCenterStrokes = (strokesData: Array<[number[], number[]]>, targetSize: number) => {
    if (strokesData.length === 0) return [];

    let allX: number[] = [];
    let allY: number[] = [];

    strokesData.forEach(([xCoords, yCoords]) => {
      allX.push(...xCoords);
      allY.push(...yCoords);
    });

    if (allX.length === 0 || allY.length === 0) return strokesData;

    // Compute bounding box of the drawing
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);

    const drawingWidth = maxX - minX;
    const drawingHeight = maxY - minY;

    if (drawingWidth === 0 || drawingHeight === 0) {
      return strokesData; // Avoid division by zero
    }

    // Maintain aspect ratio by using a single scale factor
    const scale = targetSize / Math.max(drawingWidth, drawingHeight);

    // Compute shift to center the drawing
    const shiftX = (targetSize - drawingWidth * scale) / 2;
    const shiftY = (targetSize - drawingHeight * scale) / 2;

    // Apply transformation (scaling & centering)
    return strokesData.map(([xCoords, yCoords]) => {
      const scaledX = xCoords.map((x) =>
        Math.max(0, Math.min(targetSize - 1, Math.round((x - minX) * scale + shiftX)))
      );
      const scaledY = yCoords.map((y) =>
        Math.max(0, Math.min(targetSize - 1, Math.round((y - minY) * scale + shiftY)))
      );
      return [scaledX, scaledY];
    });
  };

  // Call the backend API with scaled stroke data
  const handlePredict = async (updatedStrokes: number[][][]) => {
    const payload = { drawing: JSON.stringify(updatedStrokes) };

    console.log('Sending API request with payload:', payload);

    try {
      const response = await fetch(`${baseUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Prediction Response:', data); // Log the response

      // After prediction
      playSmartNarration(data.prediction, data.confidence);

      setPredictionResult(data); // Store the result in state if needed
    } catch (error) {
      console.error('Error during prediction:', error);
    }
  };

  // This function clears all pen strokes and then inserts the image from the URL.
  // const replaceStrokesWithImage = () => {
  //   // Check if there are any strokes drawn by the pen tool.
  //   if (strokes.length > 0 || currentStrokeRef.current.x.length > 0) {
  //     // Clear the strokes state and current stroke ref.
  //     setStrokes([]);
  //     currentStrokeRef.current = { x: [], y: [] };

  //     // Remove all pen-drawn shapes from the global store.
  //     // Assuming that pen strokes are stored as instances of PenModel,
  //     // adjust this filter if your implementation is different.
  //     Store.allShapes = Store.allShapes.filter((shape) => !(shape instanceof PenModel));
  //   }
  // };
  const replaceStrokesWithImage = () => {
    let insertX = 100; // default fallback
    let insertY = 100;

    // Combine x and y points from all strokes
    const allX = [...currentStrokeRef.current.x, ...strokes.flatMap(([x]) => x)];
    const allY = [...currentStrokeRef.current.y, ...strokes.flatMap(([, y]) => y)];

    if (allX.length > 0 && allY.length > 0) {
      // Get the center of all points
      const minX = Math.min(...allX);
      const maxX = Math.max(...allX);
      const minY = Math.min(...allY);
      const maxY = Math.max(...allY);

      insertX = (minX + maxX) / 2;
      insertY = (minY + maxY) / 2;
    }

    // Now clear strokes
    setStrokes([]);
    currentStrokeRef.current = { x: [], y: [] };
    Store.allShapes = Store.allShapes.filter((shape) => !(shape instanceof PenModel));

    return { x: insertX, y: insertY };
  };

  const onTouchMove = throttle(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
        prevX: mouseRef.current.x,
        prevY: mouseRef.current.y,
        down: mouseRef.current.down,
        cursor: mouseRef.current.cursor,
        resizeState: mouseRef.current.resizeState,
        cursorState: mouseRef.current.cursorState,
      };

      if (mouseRef.current.down && selectedTool == Tools.Pen) {
        // Accumulate stroke coordinates in the ref without causing a re-render
        currentStrokeRef.current.x.push(mouseRef.current.x);
        currentStrokeRef.current.y.push(mouseRef.current.y);
      }
    },
    selectedTool === Tools.Eraser ? 0 : 5
  );

  const onTouchStart = () => {
    mouseRef.current.down = true;

    if (selectedTool == Tools.Pen) currentStrokeRef.current = { x: [], y: [] };
  };

  const onTouchEnd = () => {
    if (!mouseRef.current.down) return;

    mouseRef.current.down = false;
    mouseRef.current.cursorState = 'none';

    scaleAndPredict();
  };

  // THIS IS TO PREVENT SCROLLING ON TOUCH DEVICES (SWIPE DOWN TO REFRESH)
  useEffect(() => {
    // Function to prevent default behavior
    const preventDefault = (e: any) => e.preventDefault();

    // Attach event listeners when the canvas is touched
    const onTouchStartGlobal = () => {
      document.addEventListener('touchmove', preventDefault, { passive: false });
      document.addEventListener('touchend', onTouchEndGlobal, { passive: false });
    };

    // Remove event listeners when touch interaction ends
    const onTouchEndGlobal = () => {
      document.removeEventListener('touchmove', preventDefault);
      document.removeEventListener('touchend', onTouchEndGlobal);
    };

    // Attach these handlers to the canvas
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', onTouchStartGlobal, { passive: false });
    }

    // Cleanup function to remove global event listeners
    return () => {
      if (canvas) {
        canvas.removeEventListener('touchstart', onTouchStartGlobal);
      }
      document.removeEventListener('touchmove', preventDefault);
      document.removeEventListener('touchend', onTouchEndGlobal);
    };
  }, []);

  const getCanvasData = useCallback(() => {
    return canvasRef.current?.toDataURL();
  }, []);

  return (
    <div className={`${theme} h-full bg-white relative overflow-hidden`} ref={parentRef}>
      {![Tools.Eraser, Tools.Image].includes(selectedTool) &&
        ((selectedTool === Tools.Select && selectedShapeType !== null) ||
          (selectedTool !== Tools.Select && selectedShapeType === null)) && (
          <PropertiesCard
            selectedTool={selectedTool}
            selectedShapeType={selectedShapeType}
            selectedStrokeColor={selectedStrokeColor}
            setSelectedStrokeColor={(color) => {
              setSelectedStrokeColor(color as StrokeColor);
            }}
            selectedStrokeWidth={selectedStrokeWidth}
            setSelectedStrokeWidth={setSelectedStrokeWidth}
            selectedStrokeVariant={selectedStrokeVariant}
            setSelectedStrokeVariant={(variant) => {
              setSelectedStrokeVariant(variant as StrokeVariant);
            }}
            selectedFillColor={selectedFillColor}
            setSelectedFillColor={(color) => {
              setSelectedFillColor(color as FillColor);
            }}
            selectedShapeSides={selectedShapeSides}
            setSelectedShapeSides={setSelectedShapeSides}
            selectedShapeRotation={selectedShapeRotation}
            setSelectedShapeRotation={setSelectedShapeRotation}
            selectedLeftArrowHead={selectedLeftArrowHead}
            setSelectedLeftArrowHead={(arrowHead) => {
              setSelectedLeftArrowHead(arrowHead as ArrowHeads);
            }}
            selectedRightArrowHead={selectedRightArrowHead}
            setSelectedRightArrowHead={(arrowHead) => {
              setSelectedRightArrowHead(arrowHead as ArrowHeads);
            }}
            selectedFontSize={selectedFontSize}
            setSelectedFontSize={setSelectedFontSize}
            selectedFontFamily={selectedFontFamily}
            setSelectedFontFamily={setSelectedFontFamily}
          />
        )}
      <UndoRedoCard />
      <ToolsCard onToolSelect={setSelectedTool} selectedTool={selectedTool} />
      <IconCard />
      {/* <GithubCard /> */}
      <ExportCard getCanvasData={getCanvasData} />
      <DarkSwitch />
      <PredictionsSidebar
        prediction={predictionResult}
        parentRef={parentRef}
        setSelectedTool={setSelectedTool}
        replaceStrokesWithImage={replaceStrokesWithImage}
      />

      <canvas
        style={{
          background: theme === Theme.Dark ? '#21242c' : '#f9fafb',
        }}
        className={'h-full w-full'}
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={onTouchMove}
        onTouchStart={() => {
          onTouchStart();
        }}
        onTouchEnd={onTouchEnd}
      />
    </div>
  );
}
