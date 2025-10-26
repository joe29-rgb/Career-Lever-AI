'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CareerFinderBackButton } from '@/components/career-finder-back-button'
import { DollarSign, TrendingUp, Target, Download, Loader2, CheckCircle } from 'lucide-react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface Application {
  id: string
  company: string
  jobTitle: string
  location?: string
  status: string
  hasSalaryData: boolean
}

interface SalaryData {
  marketMin: number
  marketMedian: number
  marketMax: number
  userTarget: number
  negotiationTips: string[]
  factors?: string
  company: string
  jobTitle: string
  location?: string
}

export default function SalaryNegotiationPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [salaryData, setSalaryData] = useState<SalaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      const response = await fetch('/api/applications/list')
      if (response.ok) {
        const apps = await response.json()
        setApplications(apps)
        console.log('[SALARY] Loaded', apps.length, 'applications')
      }
    } catch (error) {
      console.error('[SALARY] Error loading applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSalaryGuide = async () => {
    if (!selectedApp) return

    setGenerating(true)
    try {
      const response = await fetch('/api/salary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          yearsExperience: 5 // TODO: Get from user profile
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSalaryData(data.salary)
        console.log('[SALARY] ✅ Generated salary range:', data.salary.marketMin, '-', data.salary.marketMax)
      } else {
        console.error('[SALARY] Failed to generate salary data')
      }
    } catch (error) {
      console.error('[SALARY] Error:', error)
    } finally {
      setGenerating(false)
    }
  }

  const chartData = salaryData ? {
    labels: ['25th Percentile', 'Median (50th)', '75th Percentile', 'Your Target'],
    datasets: [
      {
        label: 'Salary ($)',
        data: [
          salaryData.marketMin,
          salaryData.marketMedian,
          salaryData.marketMax,
          salaryData.userTarget
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.5)',
          'rgba(16, 185, 129, 0.5)',
          'rgba(245, 158, 11, 0.5)',
          'rgba(139, 92, 246, 0.8)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(139, 92, 246)'
        ],
        borderWidth: 2
      }
    ]
  } : null

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Market Salary Range',
        font: {
          size: 18,
          weight: 'bold' as const
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return '$' + context.parsed.y.toLocaleString()
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + (value / 1000) + 'K'
          }
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-hero p-8 rounded-b-3xl shadow-2xl mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <CareerFinderBackButton />
          </div>
          <h1 className="text-4xl font-bold text-foreground text-center mb-3">💰 Salary Negotiation</h1>
          <p className="text-foreground/90 text-center text-lg">
            Market data and negotiation strategies for your offers
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-2xl font-bold mb-2">No Applications Yet</h3>
            <p className="text-muted-foreground mb-6">
              Apply to jobs first to get salary benchmarks
            </p>
            <button
              onClick={() => router.push('/career-finder/search')}
              className="btn-primary"
            >
              Find Jobs
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Application Selection */}
            <div className="lg:col-span-1">
              <div className="gradient-border-card">
                <h3 className="text-xl font-bold mb-4">Your Applications</h3>
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedApp?.id === app.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-border hover:border-green-300'
                      }`}
                    >
                      <h4 className="font-bold text-foreground">{app.jobTitle}</h4>
                      <p className="text-sm text-muted-foreground">{app.company}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          app.status === 'applied' ? 'bg-green-100 text-green-700' :
                          app.status === 'offer_received' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {app.status.replace('_', ' ')}
                        </span>
                        {app.hasSalaryData && (
                          <span className="text-xs text-green-600">✓ Data Ready</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Salary Data */}
            <div className="lg:col-span-2">
              {!selectedApp ? (
                <div className="gradient-border-card text-center py-12">
                  <DollarSign className="w-16 h-16 mx-auto text-green-500 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Select an Application</h3>
                  <p className="text-muted-foreground">
                    Choose an application to get salary benchmarks
                  </p>
                </div>
              ) : !salaryData ? (
                <div className="gradient-border-card text-center py-12">
                  <TrendingUp className="w-16 h-16 mx-auto text-green-500 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Get Salary Benchmarks</h3>
                  <p className="text-muted-foreground mb-6">
                    AI will analyze market data for<br />
                    <strong>{selectedApp.jobTitle}</strong> at <strong>{selectedApp.company}</strong>
                  </p>
                  <button
                    onClick={generateSalaryGuide}
                    disabled={generating}
                    className="btn-primary"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Analyzing Market...
                      </>
                    ) : (
                      <>
                        <Target className="w-5 h-5 mr-2" />
                        Generate Salary Guide
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="gradient-border-card">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold">{salaryData.jobTitle}</h2>
                        <p className="text-muted-foreground">{salaryData.company}</p>
                        {salaryData.location && (
                          <p className="text-sm text-muted-foreground">📍 {salaryData.location}</p>
                        )}
                      </div>
                      <button className="btn-secondary">
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </button>
                    </div>
                  </div>

                  {/* Salary Chart */}
                  <div className="gradient-border-card">
                    <h3 className="text-xl font-bold mb-4">Market Salary Range</h3>
                    {chartData && (
                      <div className="bg-card p-4 rounded-lg">
                        <Bar data={chartData} options={chartOptions} />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">25th Percentile</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ${(salaryData.marketMin / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Median</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${(salaryData.marketMedian / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">75th Percentile</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          ${(salaryData.marketMax / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg border-2 border-purple-500">
                        <p className="text-sm text-muted-foreground mb-1">Your Target</p>
                        <p className="text-2xl font-bold text-purple-600">
                          ${(salaryData.userTarget / 1000).toFixed(0)}K
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Negotiation Tips */}
                  <div className="gradient-border-card">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Negotiation Strategy
                    </h3>
                    <div className="space-y-3">
                      {salaryData.negotiationTips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                          <span className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                            {i + 1}
                          </span>
                          <p className="flex-1 text-foreground pt-1">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <button onClick={generateSalaryGuide} className="btn-secondary flex-1">
                      🔄 Refresh Data
                    </button>
                    <button
                      onClick={() => router.push('/career-finder/applications')}
                      className="btn-primary flex-1"
                    >
                      View All Applications →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
