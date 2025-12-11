"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VibeChartProps {
  metrics: {
    energy: number;
    popularity: number;
    tempo: number;
    mood: number;
  };
}

export function VibeChart({ metrics }: VibeChartProps) {
  const data = [
    { subject: "Energy", A: metrics.energy, fullMark: 100 },
    { subject: "Popularity", A: metrics.popularity, fullMark: 100 },
    { subject: "Tempo", A: metrics.tempo, fullMark: 100 },
    { subject: "Mood", A: metrics.mood, fullMark: 100 },
  ];

  return (
    <Card className="bg-surface/50 border-white/5 h-full">
      <CardHeader>
        <CardTitle className="text-center text-deezer-purple">Vibe Analysis</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#333" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
            <Radar
              name="Vibe"
              dataKey="A"
              stroke="#8f00fe"
              strokeWidth={3}
              fill="#8f00fe"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

