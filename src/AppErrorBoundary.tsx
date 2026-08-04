import { BatteryCharging, RefreshCw, RotateCcw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
  retryKey: number;
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: null,
    retryKey: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<AppErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ZyloXP workspace error', error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState((state) => ({
      error: null,
      retryKey: state.retryKey + 1,
    }));
  };

  render() {
    if (!this.state.error) {
      return <div key={this.state.retryKey}>{this.props.children}</div>;
    }

    return (
      <main className="appRecovery" role="alert">
        <div className="appRecoveryBrand">
          <span>
            <BatteryCharging aria-hidden="true" size={24} strokeWidth={2.4} />
          </span>
          <strong>ZyloXP</strong>
        </div>
        <div className="appRecoveryContent">
          <p>Workspace recovery</p>
          <h1>ZyloXP needs a quick reset</h1>
          <span>
            This workspace did not finish loading. Progress already saved on
            this device is still available.
          </span>
          <div className="appRecoveryActions">
            <button
              className="secondaryButton"
              onClick={this.handleRetry}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={18} />
              Try again
            </button>
            <button
              className="primaryButton"
              onClick={() => window.location.reload()}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={18} />
              Reload app
            </button>
          </div>
        </div>
      </main>
    );
  }
}
