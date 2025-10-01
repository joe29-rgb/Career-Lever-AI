import CompanyResearch from '@/components/company-research'

export default function CareerFinderCompanyPage() {
  return (
    <div className="space-y-4">
      <CompanyResearch titleOverride="Company Insights" descriptionOverride="Auto-populated overview: social, description, LinkedIn, size, revenue, salaries, psychology, market intelligence, signals, sources, news." />
      <div className="text-right">
        <a className="inline-block px-4 py-2 border rounded" href="/career-finder/optimizer">Next</a>
      </div>
    </div>
  )
}


