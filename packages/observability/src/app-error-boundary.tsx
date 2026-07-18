import * as Sentry from "@sentry/react";
import { Component, type ErrorInfo, type ReactNode } from "react";

type AppErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

function DefaultFallback({ error, onReset }: { error: Error; onReset?: () => void }) {
  return (
    <div
      role="alert"
      style={{
        padding: "24px",
        fontFamily: "system-ui, sans-serif",
        maxWidth: "480px",
        margin: "24px auto",
      }}
    >
      <h1 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px" }}>Something went wrong</h1>
      <p style={{ fontSize: "14px", color: "#555", margin: "0 0 16px" }}>
        An unexpected error occurred. Try reloading the page.
      </p>
      {import.meta.env.DEV ? (
        <pre
          style={{
            fontSize: "12px",
            whiteSpace: "pre-wrap",
            background: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
            overflow: "auto",
          }}
        >
          {error.message}
        </pre>
      ) : null}
      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    Sentry.captureReactException(error, info);
  }

  handleReset = (): void => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    const { error } = this.state;

    if (error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <DefaultFallback error={error} onReset={this.props.onReset ? this.handleReset : undefined} />;
    }

    return this.props.children;
  }
}
