import type { PowerPointShapeProxy } from "../selection/read-selected-shapes";

export type FakeShape = PowerPointShapeProxy & {
  rotation: number;
};

export type FakePowerPointFixture = {
  slideId: string;
  shapes: FakeShape[];
  syncCount: number;
  runner: <T>(callback: (context: PowerPoint.RequestContext) => Promise<T>) => Promise<T>;
  shape: (id: string) => FakeShape;
};

export function fakePowerPointSelection(
  shapes: Array<Partial<FakeShape> & Pick<FakeShape, "id">>,
  slideId = "slide-1",
): FakePowerPointFixture {
  const store = new Map<string, FakeShape>(
    shapes.map((shape) => [
      shape.id,
      {
        id: shape.id,
        name: shape.name ?? shape.id,
        type: shape.type ?? "rectangle",
        left: shape.left ?? 0,
        top: shape.top ?? 0,
        width: shape.width ?? 10,
        height: shape.height ?? 10,
        rotation: shape.rotation ?? 0,
      },
    ]),
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
    load: () => undefined,
  };
}
