import { Component, ReactNode } from "react";
import { DatabaseBootstrapError } from "@/components/database/database-bootstrap-error";

type DatabaseBootstrapErrorBoundaryProps = {
  children: ReactNode;
};

type DatabaseBootstrapErrorBoundaryState = {
  error: Error | null;
};

export class DatabaseBootstrapErrorBoundary extends Component<
  DatabaseBootstrapErrorBoundaryProps,
  DatabaseBootstrapErrorBoundaryState
> {
  state: DatabaseBootstrapErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(
    error: Error,
  ): DatabaseBootstrapErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <DatabaseBootstrapError message={this.state.error.message} />;
    }

    return this.props.children;
  }
}
