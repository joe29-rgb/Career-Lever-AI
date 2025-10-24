import { HeroSectionV2 } from '@/components/hero-section-v2'
import { FeaturesSection } from '@/components/features-section'
import { StatsSection } from '@/components/stats-section'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSectionV2 />
      <FeaturesSection />
      <StatsSection />
    </div>
  )
}


