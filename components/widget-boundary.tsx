"use client";
import { Component, type ReactNode } from "react";

export class WidgetBoundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidUpdate(previous: Readonly<{ children: ReactNode; resetKey: string }>) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    if (this.state.failed) return <div className="instrument-empty" role="alert"><strong>This widget couldn’t render.</strong><p>Your board and other widgets are safe. Retry, or edit this widget’s settings.</p><button onClick={() => this.setState({ failed: false })}>Retry widget</button></div>;
    return this.props.children;
  }
}
