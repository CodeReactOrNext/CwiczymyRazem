import * as Sentry from "@sentry/nextjs";
import { Button } from "assets/components/ui/button";
import { AlertTriangle, Home,RefreshCcw } from "lucide-react";
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
    Sentry.captureException(error, {
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
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">This screen crashed</h1>
              <p className="text-zinc-400">
                The error was reported to us automatically. Reloading brings the
                screen back in most cases.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={this.handleReset}
                className="flex-1 h-10 rounded-lg bg-white font-bold text-black hover:bg-zinc-200">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reload
              </Button>
              <Button
                asChild
                variant="ghost"
                className="flex-1 h-10 rounded-lg bg-zinc-900/60 font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white">
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
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
