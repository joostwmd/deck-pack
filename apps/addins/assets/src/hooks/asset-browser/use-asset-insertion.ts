import { useCallback, useRef, useState } from "react";

export function useAssetInsertion() {
  const insertingRef = useRef(false);
  const [isInserting, setIsInserting] = useState(false);

  const runInsertion = useCallback(async (action: () => Promise<void>) => {
    if (insertingRef.current) {
      return false;
    }

    insertingRef.current = true;
    setIsInserting(true);

    try {
      await action();
      return true;
    } finally {
      insertingRef.current = false;
      setIsInserting(false);
    }
  }, []);

  return {
    isInserting,
    runInsertion,
  };
}
