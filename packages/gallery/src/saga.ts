/**
 * LIFO compensation stack for multi-system operations (e.g. blob + DB).
 * Not atomic — a failed compensation is swallowed so later ones still run.
 */
export class Saga {
  private readonly compensations: Array<() => Promise<void>> = [];

  onRollback(compensate: () => Promise<void>): void {
    this.compensations.push(compensate);
  }

  async rollback(): Promise<void> {
    for (const compensate of this.compensations.reverse()) {
      try {
        await compensate();
      } catch {
        // swallow — a failed compensation must not block the others
      }
    }
  }
}
