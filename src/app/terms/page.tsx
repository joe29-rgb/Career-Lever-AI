import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Career Lever AI',
  description: 'Your agreement when using our AI-powered job search and recruitment automation platform.',
  robots: 'index, follow'
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-card rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-center text-blue-600 dark:text-blue-400 mb-4">
            Career Lever AI – Terms of Service
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            <strong>Last updated:</strong> October 24, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              By accessing or using the Career Lever AI website, mobile application, or any AI-based recruitment tools (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms") and our{' '}
              <a href="/privacy-policy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">2. About Career Lever AI</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Career Lever AI provides artificial intelligence–powered tools designed to streamline job discovery, resume optimization, recruiter outreach, and company intelligence analysis. The Service integrates authorized APIs, such as Perplexity and LinkedIn, to deliver accurate and personalized user experiences.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">3. Eligibility</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              You must be at least 18 years old to use Career Lever AI. By using this Service, you confirm that you meet the applicable age and legal requirements to form a binding contract.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">4. User Responsibilities</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Provide accurate and complete information when creating an account.</li>
              <li>Not share login credentials or misuse platform access tokens.</li>
              <li>Use the Service only for lawful job search or recruitment purposes.</li>
              <li>Refrain from scraping, reselling, or redistributing platform data.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">5. AI-Generated Content</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Career Lever AI uses artificial intelligence for job recommendations, company profiling, and outreach drafting. While we strive for accuracy, AI-generated results are informational only and not guaranteed to be free from error, bias, or incompleteness. Users are encouraged to verify facts before acting on recommendations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">6. Intellectual Property</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              All software, AI models, brand assets, and proprietary algorithms within the platform are owned or licensed by Career Lever AI. Users are granted a limited, non-exclusive license for personal or internal business use only.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">7. Third-Party Integrations</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Our Service may interface with third-party platforms, including job boards, LinkedIn, and email APIs. By authorizing such integrations, you grant permission for Career Lever AI to access only necessary data as defined by the third party's API policies. We never store third-party passwords.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              To the extent permitted by law, Career Lever AI and its affiliates are not liable for any indirect, incidental, or consequential damages resulting from:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Data inaccuracies in AI-generated insights or external job listings.</li>
              <li>Service downtime, loss of data, or technical errors.</li>
              <li>Unauthorized access despite standard security measures.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">9. Account Termination</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these Terms, misuse integrations, scrape data, or engage in unlawful behavior. You may delete your account anytime via platform settings or by contacting{' '}
              <a href="mailto:privacy@careerleverai.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                privacy@careerleverai.com
              </a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">10. Changes to Terms</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may update these Terms periodically. Continued use after notice constitutes acceptance of modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">11. Governing Law</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              These Terms of Service shall be governed by and construed in accordance with the laws of Canada and the province of Alberta.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Questions about these Terms or platform usage may be directed to:
            </p>
            <p className="text-gray-700 dark:text-gray-300 mt-3">
              📧 <a href="mailto:privacy@careerleverai.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                privacy@careerleverai.com
              </a><br />
              🌐 <a href="https://careerleverai.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                https://careerleverai.com
              </a>
            </p>
          </section>

          <footer className="text-center text-sm text-gray-500 dark:text-gray-400 mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            &copy; 2025 Career Lever AI. All rights reserved. |{' '}
            <a href="/privacy-policy" className="text-blue-600 dark:text-blue-400 hover:underline">
              Privacy Policy
            </a>
          </footer>
        </div>
      </div>
    </div>
  )
}



