import React from 'react';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('App Error:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
          <p className="text-muted-foreground mb-6">Please refresh the page and try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-md bg-primary text-primary-foreground"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
