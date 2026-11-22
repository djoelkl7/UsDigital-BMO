import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

export const FinancialGrowthChart: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="morningBlueBalanceArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4A90C6" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#4A90C6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2EAF1" vertical={false} />
          <XAxis dataKey="name" stroke="#68798A" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#68798A" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#28658F',
              border: 'none',
              borderRadius: '10px',
              color: '#FFFFFF',
              fontSize: '12px'
            }}
            itemStyle={{ color: '#FFFFFF' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#4A90C6"
            fillOpacity={1}
            fill="url(#morningBlueBalanceArea)"
            strokeWidth={2.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const YearlyStatsBarChart: React.FC<{
  data: { name: string; value: number; active?: boolean }[];
  activeIndex?: number;
}> = ({ data, activeIndex = 2 }) => {
  return (
    <div className="h-[190px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <XAxis dataKey="name" stroke="#68798A" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: 'rgba(74, 144, 198, 0.08)' }}
            contentStyle={{
              backgroundColor: '#28658F',
              border: 'none',
              borderRadius: '10px',
              color: '#FFFFFF',
              fontSize: '12px'
            }}
            formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Demo Volume']}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={26}>
            {data.map((entry, idx) => (
              <Cell
                key={`bar-${idx}`}
                fill={entry.active || idx === activeIndex ? '#4A90C6' : '#DCEAF5'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SpendingPieChart: React.FC<{ data: any[] }> = ({ data }) => {
  const COLORS = ['#4A90C6', '#367EAF', '#16865B', '#D99A20', '#68798A'];
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={82}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#28658F',
              border: 'none',
              borderRadius: '10px',
              color: '#FFFFFF',
              fontSize: '12px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CashFlowChart: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2EAF1" vertical={false} />
          <XAxis dataKey="name" stroke="#68798A" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#68798A" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#28658F',
              border: 'none',
              borderRadius: '10px',
              color: '#FFFFFF',
              fontSize: '12px'
            }}
          />
          <Bar dataKey="income" fill="#16865B" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expense" fill="#4A90C6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
