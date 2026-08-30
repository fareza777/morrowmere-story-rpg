import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  readonly children: ReactNode;
  readonly onReset: () => void;
}

interface State {
  readonly failed: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Morrowmere rendering failure', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ failed: false });
    this.props.onReset();
  };

  render() {
    if (this.state.failed) {
      return (
        <main className="error-screen">
          <p className="eyebrow">The Chronicle faltered</p>
          <h1>The page went dark.</h1>
          <p>Your last autosave remains on this device. Return to the title and continue from there.</p>
          <button className="button button-primary" type="button" onClick={this.reset}>
            Return to title
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
