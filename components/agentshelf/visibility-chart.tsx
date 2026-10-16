"use client";
import { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
export default function VisibilityChart({
  data,
}: {
  data: { period: string; mentions: number | null }[];
}) {
  const container = useRef<HTMLDivElement>(null),
    [width, setWidth] = useState(500);
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const update = () =>
      setWidth(Math.max(220, Math.round(el.getBoundingClientRect().width)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={container}
      style={{ width: "100%", height: 280, overflow: "hidden" }}
    >
      <LineChart width={width} height={270} data={data} accessibilityLayer>
        <CartesianGrid stroke="#ffffff10" vertical={false} />
        <XAxis dataKey="period" stroke="#aaa7b5" fontSize={10} />
        <YAxis domain={[0, 100]} stroke="#aaa7b5" fontSize={10} />
        <Tooltip
          contentStyle={{
            background: "#17151d",
            border: "1px solid #ffffff30",
          }}
        />
        <Line
          type="monotone"
          dataKey="mentions"
          name="Mention rate (%)"
          stroke="#c6a66b"
          strokeWidth={2}
          dot={{ r: 4 }}
          isAnimationActive={false}
        />
      </LineChart>
    </div>
  );
}
