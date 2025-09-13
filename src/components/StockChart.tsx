
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Package } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";

interface StockData {
  name: string;
  stock: number;
  alert: number;
}

interface StockChartProps {
  data: StockData[];
}

const chartConfig = {
  stock: {
    label: "Stock actuel",
    color: "#3b82f6"
  },
  alert: {
    label: "Seuil d'alerte", 
    color: "#f59e0b"
  }
};

const StockChart = ({ data }: StockChartProps) => {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm sm:text-base">
            <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
            Niveau de stock par produit
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Stock actuel vs seuil d'alerte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] sm:h-[300px] w-full flex items-center justify-center text-muted-foreground text-sm">
            Aucun produit disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-sm sm:text-base">
          <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
          Niveau de stock par produit
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Stock actuel vs seuil d'alerte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              margin={{ 
                top: 20, 
                right: 15, 
                left: 10, 
                bottom: window.innerWidth < 640 ? 40 : 60 
              }}
            >
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: window.innerWidth < 640 ? 8 : 10 }}
                angle={-45}
                textAnchor="end"
                height={window.innerWidth < 640 ? 40 : 60}
                interval={0}
              />
              <YAxis tick={{ fontSize: window.innerWidth < 640 ? 8 : 10 }} />
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-2 sm:p-3 border rounded shadow text-xs sm:text-sm">
                        <p className="font-medium">{label}</p>
                        {payload.map((item, index) => (
                          <p key={index} style={{ color: item.color }}>
                            {item.name}: {item.value}
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="stock" fill="#3b82f6" name="Stock actuel" />
              <Bar dataKey="alert" fill="#f59e0b" name="Seuil d'alerte" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default StockChart;
