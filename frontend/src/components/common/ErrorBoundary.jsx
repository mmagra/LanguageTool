import React from 'react';

// App-wide safety net: a render error in any page used to blank the whole app
// (white screen). This catches it, shows a readable message + recovery, and
// logs the real error so it can be diagnosed.
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('Render error caught by ErrorBoundary:', error, info?.componentStack);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-inter">
                    <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-8 max-w-md text-center">
                        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 text-2xl">!</div>
                        <h2 className="text-lg font-bold text-slate-900">Something went wrong</h2>
                        <p className="text-sm text-slate-500 mt-1.5">
                            This page hit an unexpected error. Try reloading — your data is safe.
                        </p>
                        {this.state.error?.message && (
                            <pre className="mt-3 text-left text-[11px] text-slate-400 bg-slate-50 border border-slate-100 rounded-lg p-3 overflow-auto max-h-32 whitespace-pre-wrap">
                                {String(this.state.error.message)}
                            </pre>
                        )}
                        <button
                            onClick={this.handleReload}
                            className="mt-4 px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                        >
                            Reload page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
