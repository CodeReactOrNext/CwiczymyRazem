import { Button } from "assets/components/ui/button";
import { Kostek } from "components/Mascot/Kostek";
import { captureException } from "lib/sentry/sentryClient";
import { Home, RefreshCcw } from "lucide-react";
import Link from "next/link";
import type { ErrorInfo, ReactNode } from 'react';
import React, { Component } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    componentStack: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Ignore Google Translator + React DOM removeChild error (known issue, doesn't break functionality)
    if (error.name === 'NotFoundError' || error.message?.includes("removeChild")) {
      return { hasError: false, error: null, componentStack: null };
    }
    return { hasError: true, error, componentStack: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    captureException(error, {
      contexts: {
        react: { componentStack: errorInfo.componentStack },
      },
    });
    this.setState({ componentStack: errorInfo.componentStack ?? null });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center p-6 text-zinc-100 font-sans">
          <div className="max-w-md w-full space-y-8 animate-in fade-in duration-base">
            <div className="space-y-4">
              {/* Kostek short-circuits: spiral eyes, fizzing sparks, a nervous shake. */}
              <Kostek mood="error" className="h-28 md:h-40" />
              <h1 className="text-2xl font-bold tracking-tight">This screen crashed</h1>
              <p className="text-zinc-400">
                The error was reported to us automatically. Reloading brings the
                screen back in most cases.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={this.handleReset}
                className="flex-1">
                <RefreshCcw />
                Reload
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="flex-1">
                <Link href="/dashboard">
                  <Home />
                  Back to dashboard
                </Link>
              </Button>
            </div>

            {/* For a bug report — out of the way unless someone asks for it. */}
            {this.state.error && (
              <details className="group rounded-lg bg-zinc-900/40 p-4 text-left">
                <summary className="cursor-pointer text-xs font-medium text-zinc-500 hover:text-zinc-300">
                  Technical details
                </summary>
                <div className="mt-3 max-h-60 space-y-2 overflow-auto">
                  <p className="font-mono text-xs text-red-400">{this.state.error.toString()}</p>
                  {this.state.componentStack && (
                    <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-500">{this.state.componentStack}</pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
