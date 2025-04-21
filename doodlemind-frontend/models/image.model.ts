import Store from '@/store/Store';
import { Tools } from '@/enums/Tools';
import React from 'react';
import { Mouse } from '@/app/page';
import SelectionService from '@/services/selection.service';
import ResizeService from '@/services/resize.service';
import UndoRedoService, { UndoRedoEventType } from '@/services/undo.redo.service';

let browsed = false;

class ImageModel {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  image: HTMLImageElement;
  horizontalInverted: boolean = false;
  verticalInverted: boolean = false;
  isSelected: boolean = false;
  originalSVGText?: string;
  currentSVGText?: string;
  fillColor: string = 'transparent';

  setIsSelected(isSelected: boolean) {
    this.isSelected = isSelected;
  }

  constructor(x1: number, y1: number, x2: number, y2: number, image: HTMLImageElement) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.image = image;
  }

  static pasteImage(
    setSelectedTool: React.Dispatch<React.SetStateAction<Tools>>,
    parentRef: React.MutableRefObject<HTMLElement | null>,
    event: ClipboardEvent
  ) {
    const items = event?.clipboardData?.items;

    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') === -1) {
        continue;
      }
      const blob = items[i].getAsFile();
      if (!blob) continue;
      this.getImageFromUrl(blob, parentRef);
      setSelectedTool(Tools.Select);
      break;
    }
  }

  static openFileChooser(
    setSelectedTool: React.Dispatch<React.SetStateAction<Tools>>,
    parentRef: React.MutableRefObject<HTMLElement | null>
  ) {
    if (browsed) {
      return;
    }
    browsed = true;

    //open file dialog'
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';

    // Listen for the change event to get the selected file
    input.addEventListener('change', (event) => {
      setSelectedTool(Tools.Select);
      browsed = false;
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        this.getImageFromUrl(file, parentRef);
      }
    });

    input.addEventListener('cancel', () => {
      setSelectedTool(Tools.Select);
      browsed = false;
    });

    input.click();
  }

  private static getImageFromUrl(
    blob: Blob,
    parentRef: React.MutableRefObject<HTMLElement | null>
  ) {
    // Read the file as a data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      // Create a new ImageModel instance with the image data
      const imageElement = new Image();
      imageElement.onload = () => {
        let imageWidth = imageElement.width;
        let imageHeight = imageElement.height;
        const parentWidth = parentRef.current?.clientWidth as number;
        const parentHeight = parentRef.current?.clientHeight as number;

        if (imageWidth > parentWidth || imageHeight > parentHeight) {
          const aspectRatio = imageWidth / imageHeight;
          if (imageWidth > imageHeight) {
            imageWidth = parentWidth / 2;
            imageHeight = imageWidth / aspectRatio;
          } else {
            imageHeight = parentHeight / 2;
            imageWidth = imageHeight * aspectRatio;
          }
        }

        const image = new ImageModel(
          (parentWidth - imageWidth) / 2,
          (parentHeight - imageHeight) / 2,
          imageWidth,
          imageHeight,
          imageElement
        );
        image.setIsSelected(true);

        // Add the image to the Store
        Store.allShapes.push(image);
        UndoRedoService.push({
          type: UndoRedoEventType.CREATE,
          index: Store.allShapes.length - 1,
          shape: {
            from: null,
            to: Store.allShapes[Store.allShapes.length - 1],
          },
        });
      };
      imageElement.src = e.target?.result as string;
    };
    reader.readAsDataURL(blob);
  }

  static drawStoredImage(ctx: CanvasRenderingContext2D, image: ImageModel) {
    if (image.x1 === image.x2 && image.y1 === image.y2) return;

    ctx.save();

    // Draw background fill
    if (image.fillColor && image.fillColor !== 'transparent') {
      ctx.fillStyle = image.fillColor;
      ctx.fillRect(image.x1, image.y1, image.x2, image.y2);
    }

    // Positioning and drawing image
    ctx.translate(image.x1 + image.x2 / 2, image.y1 + image.y2 / 2);
    ctx.scale(image.x1 > image.x1 + image.x2 ? -1 : 1, image.y1 > image.y1 + image.y2 ? -1 : 1);
    ctx.drawImage(image.image, -image.x2 / 2, -image.y2 / 2, image.x2, image.y2);

    ctx.restore();

    if (image.isSelected) {
      SelectionService.drawImageSelectionBox(ctx, image, true);
    }
  }

  static isImageHovered(image: ImageModel, mouseRef: React.MutableRefObject<Mouse>) {
    const minX = Math.min(image.x1, image.x1 + image.x2);
    const maxX = Math.max(image.x1, image.x1 + image.x2);
    const minY = Math.min(image.y1, image.y1 + image.y2);
    const maxY = Math.max(image.y1, image.y1 + image.y2);

    return (
      mouseRef.current.x >= minX &&
      mouseRef.current.x <= maxX &&
      mouseRef.current.y >= minY &&
      mouseRef.current.y <= maxY
    );
  }

  static isImageSelectionHovered(image: ImageModel, mouseRef: React.MutableRefObject<Mouse>) {
    const tolerance = 5;

    const minX = Math.min(image.x1, image.x1 + image.x2);
    const maxX = Math.max(image.x1, image.x1 + image.x2);
    const minY = Math.min(image.y1, image.y1 + image.y2);
    const maxY = Math.max(image.y1, image.y1 + image.y2);

    return (
      mouseRef.current.x >= minX - tolerance &&
      mouseRef.current.x <= maxX + tolerance &&
      mouseRef.current.y >= minY - tolerance &&
      mouseRef.current.y <= maxY + tolerance
    );
  }

  static getHoveredEdgeOrCorner(image: ImageModel, mouseRef: React.MutableRefObject<Mouse>) {
    const points = [
      { x: image.x1, y: image.y1 },
      { x: image.x1 + image.x2, y: image.y1 + image.y2 },
    ];

    image.horizontalInverted = image.x1 > image.x1 + image.x2;
    image.verticalInverted = image.y1 > image.y1 + image.y2;

    return ResizeService.detectRectangleResizeSelection(mouseRef, points);
  }

  updateStrokeColor(newColor: string) {
    if (!this.originalSVGText) return;

    // Always base modifications off the original
    if (!this.currentSVGText) this.currentSVGText = this.originalSVGText;

    const updatedSVGText = this.currentSVGText.replace(
      /stroke\s*:\s*[^;"}]+/gi,
      `stroke:${newColor}`
    );

    this.currentSVGText = updatedSVGText; // For future updates if needed

    const blob = new Blob([updatedSVGText], { type: 'image/svg+xml' });
    const blobUrl = URL.createObjectURL(blob);

    const newImg = new Image();
    newImg.crossOrigin = 'anonymous';
    newImg.src = blobUrl;
    newImg.onload = () => {
      this.image = newImg;
      console.log('✅ Stroke color updated to', newColor);
    };
    newImg.onerror = () => {
      console.error('❌ Failed to update stroke color.');
    };
  }

  updateFillColor(newColor: string) {
    if (!this.originalSVGText) return;

    if (!this.currentSVGText) this.currentSVGText = this.originalSVGText;

    console.log('originalSVGText (before fill update):', this.originalSVGText);

    // Replace all fill declarations (e.g., fill:#fff, fill:rgba(...), fill:none) in CSS style blocks
    const updatedSVGText = this.currentSVGText.replace(/fill\s*:\s*[^;"}]+/gi, `fill:${newColor}`);

    // Optionally store this as the current version (if you want to support further chaining)
    this.currentSVGText = updatedSVGText;

    console.log('updatedSVGText (after fill update):', updatedSVGText);

    const blob = new Blob([updatedSVGText], { type: 'image/svg+xml' });
    const blobUrl = URL.createObjectURL(blob);

    const newImg = new Image();
    newImg.crossOrigin = 'anonymous';
    newImg.src = blobUrl;

    newImg.onload = () => {
      this.image = newImg;
      console.log('✅ Image fill color updated to', newColor);
    };

    newImg.onerror = () => {
      console.error('❌ Failed to update image fill color.');
    };
  }

  static getImageFromURL(
    url: string,
    parentRef: React.MutableRefObject<HTMLElement | null>,
    insertX: number,
    insertY: number
  ) {
    // Check if the URL is an SVG (you can enhance this check as needed)
    if (url.endsWith('.svg')) {
      fetch(url)
        .then((res) => res.text())
        .then((svgText) => {
          // Replace white fills (for #fff and #ffffff) in style blocks with none.
          const modifiedSvgText = svgText
            .replace(/fill\s*:\s*#fff(\b)/gi, 'fill:none$1')
            .replace(/fill\s*:\s*#ffffff(\b)/gi, 'fill:none$1');

          const blob = new Blob([modifiedSvgText], { type: 'image/svg+xml' });
          const blobUrl = URL.createObjectURL(blob);

          const imageElement = new Image();
          imageElement.crossOrigin = 'anonymous';
          imageElement.src = blobUrl;
          imageElement.onload = () => {
            let imageWidth = imageElement.width;
            let imageHeight = imageElement.height;
            const parentWidth = parentRef.current?.clientWidth || 500;
            const parentHeight = parentRef.current?.clientHeight || 500;

            // Scale the image if it's too large for the parent
            if (imageWidth > parentWidth || imageHeight > parentHeight) {
              const aspectRatio = imageWidth / imageHeight;
              if (imageWidth > imageHeight) {
                imageWidth = parentWidth / 2;
                imageHeight = imageWidth / aspectRatio;
              } else {
                imageHeight = parentHeight / 2;
                imageWidth = imageHeight * aspectRatio;
              }
            }

            const image = new ImageModel(
              insertX - imageWidth / 2,
              insertY - imageHeight / 2,

              imageWidth, // width (x2)
              imageHeight, // height (y2)
              imageElement
            );
            image.setIsSelected(true);
            image.originalSVGText = modifiedSvgText; // Save the original SVG text for later updates

            // Add the image to the store
            Store.allShapes.push(image);
            UndoRedoService.push({
              type: UndoRedoEventType.CREATE,
              index: Store.allShapes.length - 1,
              shape: {
                from: null,
                to: image,
              },
            });
            console.log('Image inserted into store:', image);
          };

          imageElement.onerror = () => {
            console.error('Failed to load modified SVG from URL:', url);
          };
        })
        .catch((error) => {
          console.error('Error fetching SVG:', error);
        });
    } else {
      // Fallback for non-SVG images (using your existing logic)
      const imageElement = new Image();
      imageElement.crossOrigin = 'anonymous';
      imageElement.src = url;
      imageElement.onload = () => {
        let imageWidth = imageElement.width;
        let imageHeight = imageElement.height;
        const parentWidth = parentRef.current?.clientWidth || 500;
        const parentHeight = parentRef.current?.clientHeight || 500;

        if (imageWidth > parentWidth || imageHeight > parentHeight) {
          const aspectRatio = imageWidth / imageHeight;
          if (imageWidth > imageHeight) {
            imageWidth = parentWidth / 2;
            imageHeight = imageWidth / aspectRatio;
          } else {
            imageHeight = parentHeight / 2;
            imageWidth = imageHeight * aspectRatio;
          }
        }

        const image = new ImageModel(
          insertX - imageWidth / 2,
          insertY - imageHeight / 2,
          imageWidth,
          imageHeight,
          imageElement
        );
        image.setIsSelected(true);

        Store.allShapes.push(image);
        UndoRedoService.push({
          type: UndoRedoEventType.CREATE,
          index: Store.allShapes.length - 1,
          shape: {
            from: null,
            to: image,
          },
        });
        console.log('Image inserted into store:', image);
      };

      imageElement.onerror = () => {
        console.error('Failed to load image from URL:', url);
      };
    }
  }
}

export default ImageModel;
