export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-gray-700">Career Lever AI respects your privacy. This policy explains how we collect, use, and protect your information. We do not sell personal data. You can request export or deletion at any time.</p>

      <h2 className="text-lg font-semibold mt-4">Information We Collect</h2>
      <ul className="list-disc ml-6 text-sm text-gray-700 space-y-1">
        <li>Account data (name, email, auth identifiers)</li>
        <li>Resumes, cover letters, job applications and related artifacts you upload or generate</li>
        <li>Company research outputs generated for you</li>
        <li>Integration tokens (e.g., Google) stored securely for your account</li>
        <li>Usage logs and telemetry (request IDs, timing, error diagnostics)</li>
      </ul>

      <h2 className="text-lg font-semibold mt-4">How We Use Information</h2>
      <ul className="list-disc ml-6 text-sm text-gray-700 space-y-1">
        <li>Provide core features (resume tailoring, cover letters, research, calendar)</li>
        <li>Improve recommendations and product reliability</li>
        <li>Maintain security, fraud prevention, and compliance</li>
      </ul>

      <h2 className="text-lg font-semibold mt-4">Data Sharing</h2>
      <p className="text-sm text-gray-700">We share data only with processors necessary to provide the service (e.g., cloud hosting, AI provider, logging). We do not sell personal data. When you connect third‑party services (e.g., Google Calendar), your data is shared as required to perform those functions.</p>

      <h2 className="text-lg font-semibold mt-4">Security</h2>
      <p className="text-sm text-gray-700">We use industry practices (encryption in transit, restricted access, rate limiting) to protect your data. Despite safeguards, no method is 100% secure.</p>

      <h2 className="text-lg font-semibold mt-4">Retention</h2>
      <p className="text-sm text-gray-700">We retain data for the duration of your account or as required by law. You may delete your account to remove data, subject to legal/operational limits.</p>

      <h2 className="text-lg font-semibold mt-4">Your Rights</h2>
      <ul className="list-disc ml-6 text-sm text-gray-700 space-y-1">
        <li>Access, correction, and deletion</li>
        <li>Export of your data</li>
        <li>Withdrawal of consent for integrations</li>
      </ul>

      <h2 className="text-lg font-semibold mt-4">Contact</h2>
      <p className="text-sm text-gray-700">For privacy requests, contact support via the app or email listed in your account receipts.</p>
    </div>
  )
}


