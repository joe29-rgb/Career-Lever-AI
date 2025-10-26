import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Career Lever AI',
  description: 'Learn how Career Lever AI collects, uses, and protects your personal and professional information.',
  robots: 'index, follow'
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-card rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-center text-blue-600 dark:text-blue-400 mb-4">
            Career Lever AI Privacy Policy
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            <strong>Last Updated:</strong> October 24, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">1. Introduction</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Career Lever AI ("we", "our", "us") is committed to respecting and protecting your privacy.
              This Privacy Policy describes how we collect, use, store, and protect your personal information
              when using our website, platform, and integrated services ("Service").
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">2. Information We Collect</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>Personal Information:</strong> Your name, email, job application data, resumes, and LinkedIn profile details (if authorized).</li>
              <li><strong>Automatically Collected:</strong> Browser type, device info, cookies, IP address, session duration, and usage analytics.</li>
              <li><strong>Third-Party Sources:</strong> Public company insights, recruiter LinkedIn profiles, and verified job postings from APIs and boards such as Indeed, Workopolis, and LinkedIn Jobs.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">3. How We Use Information</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              We use data to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Match your resume and skills with open jobs and employers.</li>
              <li>Generate custom insights, cover letters, and analytics for your applications.</li>
              <li>Improve predictive career recommendations and system performance.</li>
              <li>Communicate updates and support messages.</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3 font-semibold">
              We do not rent or sell your personal data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">4. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              We may share aggregated or anonymized datasets with analytics vendors or employers you directly interact with.
              Personal info is disclosed only:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>With your consent to connect you to employers or recruiters.</li>
              <li>With cloud and analytics partners who comply with equivalent security standards.</li>
              <li>If required by law or lawful subpoena.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">5. Data Retention</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We store data securely using encrypted cloud infrastructure (AWS, Supabase, Vercel) and retain it
              only as long as required to provide services or as required by law.
              Users can delete data anytime by contacting:{' '}
              <a href="mailto:privacy@careerleverai.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                privacy@careerleverai.com
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">6. LinkedIn and API Integrations</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              If you link your account to LinkedIn:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>We access limited profile fields (name, picture, experience summary, and email if authorized).</li>
              <li>LinkedIn OAuth 2.0 is used for secure token-based login (we never store your LinkedIn password).</li>
              <li>Data access can be revoked from your LinkedIn settings at any time.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">7. Cookies and Analytics</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We use cookies for authentication, session management, and usage analytics via tools like Google
              Analytics and Vercel Insights. You may disable cookies through your browser but some features may be limited.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">8. Data Security</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We protect user data with encrypted communications (HTTPS/TLS), access control, and periodic
              vulnerability monitoring. No method of online transfer or storage is entirely risk-free, but we maintain industry-grade security standards.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">9. Your Privacy Rights</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              Depending on your location, you may have rights to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Access or request deletion of your personal data.</li>
              <li>Withdraw consent for data usage.</li>
              <li>Receive a copy of your data in a portable format.</li>
              <li>Contact your local data authority under GDPR or CCPA compliance.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">10. International Transfers</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Personal Information may be transferred to servers outside your region. When this occurs, we ensure appropriate data protection safeguards are maintained.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">11. Updates to Privacy Policy</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may update this policy periodically. Updated versions will include a "Last Updated" date at the top of the page.
              Material changes will be communicated via email or platform notifications.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              For privacy concerns, data requests, or legal inquiries:
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
            <a href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
              Back to Home
            </a>
          </footer>
        </div>
      </div>
    </div>
  )
}
