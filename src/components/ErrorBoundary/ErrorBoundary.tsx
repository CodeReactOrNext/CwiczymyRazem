import { Button } from "assets/components/ui/button";
import { AlertTriangle, Home,RefreshCcw } from "lucide-react";
import Link from "next/link";
import type { ErrorInfo, ReactNode } from 'react';
import React, { Component } from 'react';
import * as Sentry from "@sentry/nextjs";

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
          <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center">
              <div className="p-4 rounded-3xl bg-red-500/10 border border-red-500/20 shadow-2xl shadow-red-500/5">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
              <p className="text-zinc-400">
                An unexpected error occurred in our application. We've been notified and are looking into it.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 text-left overflow-auto max-h-60 space-y-2">
                <p className="text-xs font-mono text-red-400">{this.state.error.toString()}</p>
                {this.state.componentStack && (
                  <pre className="text-xs font-mono text-zinc-400 whitespace-pre-wrap">{this.state.componentStack}</pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={this.handleReset}
                className="flex-1 bg-white hover:bg-zinc-200 text-black font-bold h-12 rounded-xl transition-all active:scale-95"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Link href="/" className="flex-1">
                <Button 
                  variant="outline"
                  className="w-full border-white/10 bg-zinc-900/50 hover:bg-zinc-800 text-white font-bold h-12 rounded-xl transition-all active:scale-95"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </Link>
            </div>
            
          
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
