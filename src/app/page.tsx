export const dynamic = 'force-dynamic'
import { HeroSection } from '@/components/hero-section'
import { FeaturesSection } from '@/components/features-section'
import { StatsSection } from '@/components/stats-section'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
    </div>
  )
}


