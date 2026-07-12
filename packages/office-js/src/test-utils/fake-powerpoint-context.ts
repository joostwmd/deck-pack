import type { PowerPointShapeProxy } from "../selection/read-selected-shapes";

export type FakeTextFrame = {
  hasText: boolean;
  autoSizeSetting: string;
  leftMargin: number;
  rightMargin: number;
  topMargin: number;
  bottomMargin: number;
  wordWrap: boolean;
  verticalAlignment: string;
  textRange: {
    text: string;
  };
};

export type FakeShape = PowerPointShapeProxy & {
  rotation: number;
  textFrame?: FakeTextFrame;
};

export type FakePowerPointFixture = {
  slideId: string;
  shapes: FakeShape[];
  syncCount: number;
  runner: <T>(callback: (context: PowerPoint.RequestContext) => Promise<T>) => Promise<T>;
  shape: (id: string) => FakeShape;
};

function createDefaultTextFrame(text = ""): FakeTextFrame {
  return {
    hasText: text.length > 0,
    autoSizeSetting: "AutoSizeNone",
    leftMargin: 10,
    rightMargin: 10,
    topMargin: 5,
    bottomMargin: 5,
    wordWrap: true,
    verticalAlignment: "Top",
    textRange: { text },
  };
}

export function fakePowerPointSelection(
  shapes: Array<Partial<FakeShape> & Pick<FakeShape, "id">>,
  slideId = "slide-1",
): FakePowerPointFixture {
  const store = new Map<string, FakeShape>(
    shapes.map((shape) => {
      const type = shape.type ?? "rectangle";
      const supportsText = type !== "line" && type !== "image" && type !== "table";

      return [
        shape.id,
        {
          id: shape.id,
          name: shape.name ?? shape.id,
          type,
          left: shape.left ?? 0,
          top: shape.top ?? 0,
          width: shape.width ?? 10,
          height: shape.height ?? 10,
          rotation: shape.rotation ?? 0,
          textFrame:
            shape.textFrame ?? (supportsText ? createDefaultTextFrame() : undefined),
        },
      ];
    }),
  );

  let syncCount = 0;

  const runner = async <T,>(callback: (context: PowerPoint.RequestContext) => Promise<T>) => {
    const context = createFakeContext(slideId, store, () => {
      syncCount += 1;
    });
    return callback(context as unknown as PowerPoint.RequestContext);
  };

  return {
    slideId,
    shapes: [...store.values()],
    get syncCount() {
      return syncCount;
    },
    runner,
    shape(id: string) {
      const shape = store.get(id);
      if (!shape) {
        throw new Error(`Shape not found: ${id}`);
      }
      return shape;
    },
  };
}

function createFakeContext(
  slideId: string,
  store: Map<string, FakeShape>,
  onSync: () => void,
) {
  const shapeItems = [...store.keys()].map((id) => createShapeProxy(store, id));

  const slide = {
    id: slideId,
    shapes: {
      getItem(id: string) {
        return createShapeProxy(store, id);
      },
    },
    load: () => undefined,
  };

  const presentation = {
    getSelectedSlides() {
      return {
        items: [slide],
        load: () => undefined,
      };
    },
    getSelectedShapes() {
      return {
        items: shapeItems,
        load: () => undefined,
      };
    },
  };

  return {
    presentation,
    sync: async () => {
      onSync();
    },
  };
}

function createShapeProxy(store: Map<string, FakeShape>, id: string) {
  const record = store.get(id)!;

  const textFrameRecord =
    record.textFrame ??
    (record.type !== "line" && record.type !== "image" && record.type !== "table"
      ? createDefaultTextFrame()
      : undefined);

  if (textFrameRecord && !record.textFrame) {
    record.textFrame = textFrameRecord;
  }

  const textFrameProxy = textFrameRecord
    ? {
        get hasText() {
          return textFrameRecord.hasText;
        },
        set hasText(value: boolean) {
          textFrameRecord.hasText = value;
        },
        get autoSizeSetting() {
          return textFrameRecord.autoSizeSetting;
        },
        set autoSizeSetting(value: string) {
          textFrameRecord.autoSizeSetting = value;
        },
        get leftMargin() {
          return textFrameRecord.leftMargin;
        },
        set leftMargin(value: number) {
          textFrameRecord.leftMargin = value;
        },
        get rightMargin() {
          return textFrameRecord.rightMargin;
        },
        set rightMargin(value: number) {
          textFrameRecord.rightMargin = value;
        },
        get topMargin() {
          return textFrameRecord.topMargin;
        },
        set topMargin(value: number) {
          textFrameRecord.topMargin = value;
        },
        get bottomMargin() {
          return textFrameRecord.bottomMargin;
        },
        set bottomMargin(value: number) {
          textFrameRecord.bottomMargin = value;
        },
        get wordWrap() {
          return textFrameRecord.wordWrap;
        },
        set wordWrap(value: boolean) {
          textFrameRecord.wordWrap = value;
        },
        get verticalAlignment() {
          return textFrameRecord.verticalAlignment;
        },
        set verticalAlignment(value: string) {
          textFrameRecord.verticalAlignment = value;
        },
        textRange: {
          get text() {
            return textFrameRecord.textRange.text;
          },
          set text(value: string) {
            textFrameRecord.textRange.text = value;
            textFrameRecord.hasText = value.length > 0;
          },
        },
      }
    : undefined;

  return {
    id: record.id,
    name: record.name,
    type: record.type,
    get left() {
      return record.left;
    },
    set left(value: number) {
      record.left = value;
    },
    get top() {
      return record.top;
    },
    set top(value: number) {
      record.top = value;
    },
    get width() {
      return record.width;
    },
    set width(value: number) {
      record.width = value;
    },
    get height() {
      return record.height;
    },
    set height(value: number) {
      record.height = value;
    },
    get rotation() {
      return record.rotation;
    },
    set rotation(value: number) {
      record.rotation = value;
    },
    get textFrame() {
      return textFrameProxy;
    },
    load: () => undefined,
  };
}
