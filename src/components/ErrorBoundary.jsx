import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Apple Pay diagnostic UI failed to render.', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="page-shell">
          <section className="details-panel details-panel--error">
            <h1>Something went wrong while rendering the diagnostics.</h1>
            <p className="details-panel__copy">
              The page hit an unexpected UI error. Refresh the page to retry after any local
              changes.
            </p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
