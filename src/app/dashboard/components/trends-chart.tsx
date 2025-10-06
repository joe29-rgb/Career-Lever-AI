'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Simple trends display without external chart library
export default function TrendsChart() {
  const weeklyData = [
    { week: 'W1', applications: 2 },
    { week: 'W2', applications: 4 },
    { week: 'W3', applications: 3 },
    { week: 'W4', applications: 6 },
    { week: 'W5', applications: 5 },
    { week: 'W6', applications: 7 },
  ]

  const maxApps = Math.max(...weeklyData.map(d => d.applications))

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Application Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {weeklyData.map((data) => (
            <div key={data.week} className="flex items-center gap-3">
              <span className="text-sm font-medium w-8 text-muted-foreground">{data.week}</span>
              <div className="flex-1 h-8 bg-secondary rounded-lg overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(data.applications / maxApps) * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold w-8 text-right">{data.applications}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Total Applications: <span className="font-semibold text-foreground">{weeklyData.reduce((sum, d) => sum + d.applications, 0)}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}


