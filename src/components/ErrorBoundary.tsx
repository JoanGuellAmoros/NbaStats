import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("NbaStats error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
            Error inesperat
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-white">
            Alguna cosa ha fallat
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Tanca i torna a obrir l&apos;app. Les dades desades no s&apos;han
            perdut.
          </p>
          <button
            type="button"
            className="btn-primary mt-6"
            onClick={() => window.location.reload()}
          >
            Recarrega
          </button>
          <pre className="mt-6 max-w-full overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-3 text-left text-[11px] text-zinc-500">
            {this.state.error.message}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
