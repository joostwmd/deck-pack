import type { InsertImageOptions, InsertSlidesOptions, ShapeMetadata } from "./types";
import {
  detectOffice,
  isOfficeDocumentAvailable,
  isOfficeReady,
  isPowerPointApiAvailable,
  runOfficeAsync,
  runPowerPoint,
} from "./utils";

export class OfficeClient {
  private detectedAvailability: boolean | null = null;

  async detect(): Promise<boolean> {
    this.detectedAvailability = await detectOffice();
    return this.detectedAvailability;
  }

  get isAvailable(): boolean {
    if (this.detectedAvailability !== null) {
      return this.detectedAvailability;
    }

    return isOfficeDocumentAvailable();
  }

  get isLoaded(): boolean {
    return isOfficeReady();
  }

  async insertImage(base64: string, options: InsertImageOptions = {}): Promise<void> {
    return runOfficeAsync(
      (Office) =>
        new Promise((resolve, reject) => {
          const asyncOptions: Office.SetSelectedDataOptions = {
            coercionType: Office.CoercionType.Image,
          };

          if (options.left !== undefined) asyncOptions.imageLeft = options.left;
          if (options.top !== undefined) asyncOptions.imageTop = options.top;
          if (options.width !== undefined) asyncOptions.imageWidth = options.width;
          if (options.height !== undefined) asyncOptions.imageHeight = options.height;

          Office.context.document.setSelectedDataAsync(
            base64,
            asyncOptions,
            (result: Office.AsyncResult<void>) => {
            if (result.status === Office.AsyncResultStatus.Failed) {
              reject(new Error(result.error?.message ?? "Failed to insert image"));
              return;
            }

            resolve();
          });
        }),
    );
  }

  async insertImageWithMetadata(
    base64: string,
    metadata: ShapeMetadata,
    options: InsertImageOptions = {},
  ): Promise<string> {
    const existingShapeIds = await this.getShapeIdsOnCurrentSlide();
    await this.insertImage(base64, options);

    const currentShapeIds = await this.getShapeIdsOnCurrentSlide();
    const newShapeId = currentShapeIds.find((id) => !existingShapeIds.includes(id));

    if (!newShapeId) {
      throw new Error("Failed to find inserted shape");
    }

    await this.addMetadataToShapeById(newShapeId, metadata);
    return newShapeId;
  }

  async insertSvg(svg: string): Promise<void> {
    return runOfficeAsync(
      (Office) =>
        new Promise((resolve, reject) => {
          Office.context.document.setSelectedDataAsync(
            svg,
            { coercionType: Office.CoercionType.XmlSvg },
            (result: Office.AsyncResult<void>) => {
              if (result.status === Office.AsyncResultStatus.Failed) {
                reject(new Error(result.error?.message ?? "Failed to insert SVG"));
                return;
              }

              resolve();
            },
          );
        }),
    );
  }

  async insertSvgWithMetadata(
    svg: string,
    metadata: ShapeMetadata,
  ): Promise<string> {
    const existingShapeIds = await this.getShapeIdsOnCurrentSlide();
    await this.insertSvg(svg);

    const currentShapeIds = await this.getShapeIdsOnCurrentSlide();
    const newShapeId = currentShapeIds.find((id) => !existingShapeIds.includes(id));

    if (!newShapeId) {
      throw new Error("Failed to find inserted shape");
    }

    await this.addMetadataToShapeById(newShapeId, metadata);
    return newShapeId;
  }

  async insertSlidesFromBase64(
    base64: string,
    options: InsertSlidesOptions = {},
  ): Promise<void> {
    if (!isPowerPointApiAvailable("1.2")) {
      throw new Error(
        "Slide insertion requires PowerPointApi 1.2 or later. Update your Office client and try again.",
      );
    }

    return runPowerPoint(async (context) => {
      const selectedSlides = context.presentation.getSelectedSlides();
      selectedSlides.load("items/id");
      await context.sync();

      if (selectedSlides.items.length === 0) {
        throw new Error("Select a slide in your presentation before inserting a library slide.");
      }

      const targetSlideId = options.targetSlideId ?? selectedSlides.items[0]!.id;

      context.presentation.insertSlidesFromBase64(base64, {
        formatting:
          options.formatting ?? PowerPoint.InsertSlideFormatting.keepSourceFormatting,
        targetSlideId,
      });

      await context.sync();
    });
  }

  private async getShapeIdsOnCurrentSlide(): Promise<string[]> {
    return runPowerPoint(async (context) => {
      const slide = context.presentation.getSelectedSlides().getItemAt(0);
      const shapes = slide.shapes;
      shapes.load("items/id");
      await context.sync();
      return shapes.items.map((shape: PowerPoint.Shape) => shape.id);
    });
  }

  private async addMetadataToShapeById(
    shapeId: string,
    metadata: ShapeMetadata,
  ): Promise<void> {
    return runPowerPoint(async (context) => {
      const slide = context.presentation.getSelectedSlides().getItemAt(0);
      const shape = slide.shapes.getItem(shapeId);

      shape.tags.add("SOURCE", "DECKPACK");
      shape.tags.add("INSERTED_DATE", new Date().toISOString());

      for (const [key, value] of Object.entries(metadata)) {
        shape.tags.add(key.toUpperCase(), value);
      }

      await context.sync();
    });
  }
}

export const officeClient = new OfficeClient();
