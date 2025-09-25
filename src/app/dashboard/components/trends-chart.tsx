'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

export default function TrendsChart() {
  const data = useMemo(() => {
    return {
      labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
      datasets: [
        {
          label: 'Applications',
          data: [2, 4, 3, 6, 5, 7],
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.12)',
          tension: 0.4,
          fill: true,
          pointRadius: 0,
        },
      ],
    }
  }, [])

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Application Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <Line
          data={data}
          options={{
            responsive: true,
            plugins: { legend: { display: false }, tooltip: { enabled: true, backgroundColor: 'rgba(0,0,0,0.9)', titleColor: '#fff', bodyColor: '#fff', padding: 12, cornerRadius: 8 } },
            scales: { x: { display: true }, y: { display: true, ticks: { stepSize: 1 } } },
          }}
        />
      </CardContent>
    </Card>
  )
}


