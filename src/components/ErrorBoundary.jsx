import React, { Component } from 'react';

/**
 * Global Error Boundary to catch rendering errors in the component tree.
 * It displays a friendly fallback UI and logs the error for debugging.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You could also send error info to an external monitoring service.
    console.error('ErrorBoundary caught an error', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Render a simple but polished fallback UI.
      return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-slate-100">
          <div className="max-w-md text-center space-y-4 p-6 bg-slate-800 rounded-xl shadow-lg">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-sm">
              An unexpected error occurred. Please try refreshing the page or contact support.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="whitespace-pre-wrap text-left text-xs mt-4">
                {this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
