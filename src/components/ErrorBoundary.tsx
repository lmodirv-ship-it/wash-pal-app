import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#030308] p-6">
          <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-destructive/20 bg-[#060612]">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground">حدث خطأ غير متوقع</h2>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || "يرجى إعادة المحاولة"}
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <Button onClick={this.reset} variant="default" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                إعادة المحاولة
              </Button>
              <Button onClick={() => (window.location.href = "/")} variant="outline">
                الصفحة الرئيسية
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;