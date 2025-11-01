/**
 * COMPANY RESEARCH CARDS COMPONENT
 * Visual redesign for company pros/cons
 */

'use client'

import { ThumbsUp, ThumbsDown, Check, AlertCircle } from 'lucide-react'

interface CompanyResearchCardsProps {
  pros: string[]
  cons: string[]
}

export function CompanyResearchCards({ pros, cons }: CompanyResearchCardsProps) {
  return (
    <div className="company-research">
      {/* Pros Card */}
      <div className="company-card company-card--pros">
        <div className="flex items-center gap-3 mb-4">
          <ThumbsUp className="w-8 h-8 text-green-500" />
          <h4 className="text-lg font-semibold">Pros</h4>
        </div>
        {pros.length > 0 ? (
          <ul className="space-y-3">
            {pros.map((pro, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{pro}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No pros available</p>
        )}
      </div>

      {/* Cons Card */}
      <div className="company-card company-card--cons">
        <div className="flex items-center gap-3 mb-4">
          <ThumbsDown className="w-8 h-8 text-orange-500" />
          <h4 className="text-lg font-semibold">Cons</h4>
        </div>
        {cons.length > 0 ? (
          <ul className="space-y-3">
            {cons.map((con, index) => (
              <li key={index} className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{con}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No cons available</p>
        )}
      </div>
    </div>
  )
}
