
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltip } from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface TransactionData {
  name: string;
  value: number;
  amount: number;
  fill: string;
}

interface TransactionChartProps {
  data: TransactionData[];
}

const TransactionChart = ({ data }: TransactionChartProps) => {
  if (data.length === 0 || data.every(item => item.amount === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm sm:text-base">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
            Répartition des transactions
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Distribution entre achats et ventes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] sm:h-[300px] w-full flex items-center justify-center text-muted-foreground text-sm">
            Aucune transaction disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-sm sm:text-base">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
          Répartition des transactions
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Distribution entre achats et ventes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] sm:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => 
                  window.innerWidth < 640 
                    ? `${value}` 
                    : `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={window.innerWidth < 640 ? 60 : 80}
                dataKey="amount"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 sm:p-3 border rounded shadow text-xs sm:text-sm">
                        <p className="font-medium">{data.name}</p>
                        <p>Nombre: {data.value}</p>
                        <p>Montant: {data.amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionChart;
