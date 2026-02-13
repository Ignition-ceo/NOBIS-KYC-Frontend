import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface TransactionsChartProps {
  used: number;
  total?: number;
}

export function TransactionsChart({ used, total = 100 }: TransactionsChartProps) {
  const percentage = Math.min((used / total) * 100, 100);
  const remaining = 100 - percentage;

  const data = [
    { name: "Used", value: percentage },
    { name: "Remaining", value: remaining },
  ];

  return (
    <div className="stat-card">
      <h3 className="text-lg font-semibold text-foreground mb-4">Transactions Used</h3>
      <div className="relative w-32 h-32 mx-auto">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={60}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill="hsl(217, 91%, 50%)" />
              <Cell fill="hsl(220, 14%, 92%)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{used}</span>
          <span className="text-xs text-muted-foreground">Transactions</span>
        </div>
      </div>
    </div>
  );
}
