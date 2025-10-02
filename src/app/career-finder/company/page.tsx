import CompanyResearch from '@/components/company-research'

export default function CareerFinderCompanyPage() {
  return (
    <div className="space-y-4">
      {/* Persist wizard progress */}
      <script dangerouslySetInnerHTML={{ __html: `try{localStorage.setItem('cf:progress', JSON.stringify({ step: 4, total: 7 }))}catch(e){}` }} />
      {/* Preload from selected job into local storage for CompanyResearch defaults */}
      <script dangerouslySetInnerHTML={{ __html: `
        try{
          const sel = JSON.parse(localStorage.getItem('cf:selectedJob')||'null');
          if(sel){
            if(sel.company) localStorage.setItem('job:company', sel.company);
            if(sel.title) localStorage.setItem('job:title', sel.title);
            if(sel.location) localStorage.setItem('job:location', sel.location);
            if(sel.url){
              try{ const u = new URL(sel.url); const host = u.hostname.replace(/^www\./,''); localStorage.setItem('job:website', 'https://' + host);}catch{}
            }
          }
        }catch{}
      ` }} />
      <CompanyResearch titleOverride="Company Insights" descriptionOverride="Auto-populated overview: social, description, LinkedIn, size, revenue, salaries, psychology, market intelligence, signals, sources, news." autoRun hideInputs hideActions />
      <div className="text-right">
        <a className="inline-block px-4 py-2 border rounded" href="/career-finder/optimizer">Next</a>
      </div>
    </div>
  )
}


