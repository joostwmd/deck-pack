export class FormattingUnavailableError extends Error {
  readonly code: string;
  readonly reason: string;

  constructor(code: string, reason: string) {
    super(reason);
    this.name = "FormattingUnavailableError";
    this.code = code;
    this.reason = reason;
  }
}

export class FormattingExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormattingExecutionError";
  }
}
