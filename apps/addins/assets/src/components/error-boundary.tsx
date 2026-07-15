import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    const { error } = this.state;

    if (error) {
      return (
        <div style={{ padding: "12px", fontFamily: "monospace", fontSize: "12px", color: "#c00" }}>
          <strong>Error: {error.message}</strong>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: "8px", color: "#333" }}>
            {error.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
