export type SelectionChangeHandler = () => void;

export type SelectionSubscription = {
  unsubscribe: () => Promise<void>;
};

export type OfficeDocumentPort = {
  addHandlerAsync: (
    eventType: string,
    handler: SelectionChangeHandler,
    callback?: (result: { status: string; error?: { message?: string } }) => void,
  ) => void;
  removeHandlerAsync: (
    eventType: string,
    options: { handler: SelectionChangeHandler },
    callback?: (result: { status: string; error?: { message?: string } }) => void,
  ) => void;
};

export type OfficeContextPort = {
  document: OfficeDocumentPort;
};

const DOCUMENT_SELECTION_CHANGED = "documentSelectionChanged";

export function subscribeToSelectionChanges(
  officeContext: OfficeContextPort,
  handler: SelectionChangeHandler,
): Promise<SelectionSubscription> {
  return new Promise((resolve, reject) => {
    officeContext.document.addHandlerAsync(
      DOCUMENT_SELECTION_CHANGED,
      handler,
      (result) => {
        if (result.status !== "succeeded") {
          reject(new Error(result.error?.message ?? "Failed to subscribe to selection changes"));
          return;
        }

        resolve({
          unsubscribe: () =>
            new Promise((unsubscribeResolve, unsubscribeReject) => {
              officeContext.document.removeHandlerAsync(
                DOCUMENT_SELECTION_CHANGED,
                { handler },
                (removeResult) => {
                  if (removeResult.status !== "succeeded") {
                    unsubscribeReject(
                      new Error(removeResult.error?.message ?? "Failed to unsubscribe from selection changes"),
                    );
                    return;
                  }

                  unsubscribeResolve();
                },
              );
            }),
        });
      },
    );
  });
}
