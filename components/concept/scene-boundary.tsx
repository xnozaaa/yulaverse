"use client";

import { Component, type ReactNode } from "react";

export type SceneStatus = "loading" | "ready" | "fallback";

export class SceneBoundary extends Component<
  { children: ReactNode; onStatus: (status: SceneStatus) => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onStatus("fallback");
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
