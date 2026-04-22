import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200 max-w-lg w-full text-center relative overflow-hidden">
            {/* Decorative background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100 shadow-sm animate-in zoom-in duration-300">
                <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                We encountered an unexpected error while loading this page. Our team has been notified.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
                <button
                  onClick={() => window.history.back()}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Go Back
                </button>
                <button
                  onClick={this.handleReload}
                  className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-sm transition-all hover:shadow hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;