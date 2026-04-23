"use client";

import { TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { TrendResponse } from "@/integrations/endpoints/admin/erp/vardiya_analizi_admin.endpoints";

type Props = {
  gunSayisi: 7 | 30;
  onGunSayisiChange: (value: 7 | 30) => void;
  data?: TrendResponse;
  isLoading: boolean;
};

export default function TrendPaneli({ gunSayisi, onGunSayisiChange, data, isLoading }: Props) {

  const gunler = data?.gunler ?? [];
  const chartData = gunler.map((g) => ({
    tarih: g.tarih.slice(5), // MM-DD
    Uretim: g.toplamUretim,
    Duruş_Dk: g.toplamDurusDk,
    OEE: Math.round(g.oee * 100),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="size-4" />
            Trend — Son {gunSayisi} Gün
          </CardTitle>
          <div className="flex rounded-md border p-0.5">
            <Button
              size="sm"
              variant={gunSayisi === 7 ? "default" : "ghost"}
              className="h-7 px-3"
              onClick={() => onGunSayisiChange(7)}
            >
              7 Gün
            </Button>
            <Button
              size="sm"
              variant={gunSayisi === 30 ? "default" : "ghost"}
              className="h-7 px-3"
              onClick={() => onGunSayisiChange(30)}
            >
              30 Gün
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-60" />
        ) : chartData.every((d) => d.Uretim === 0 && d.Duruş_Dk === 0) ? (
          <p className="py-10 text-center text-muted-foreground text-sm">
            Son {gunSayisi} günde veri bulunmuyor
          </p>
        ) : (
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="tarih" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="Uretim"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="Duruş_Dk"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="OEE"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
