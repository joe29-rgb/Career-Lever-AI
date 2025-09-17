export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-gray-700">We respect your privacy. This policy explains how we handle your data including resumes, job applications, and account information. We do not sell personal data. You can request deletion at any time.</p>
      <h2 className="text-lg font-semibold mt-4">Data We Process</h2>
      <ul className="list-disc ml-6 text-sm text-gray-700 space-y-1">
        <li>Account data (email, name)</li>
        <li>Resumes, cover letters, job applications</li>
        <li>Company research outputs</li>
      </ul>
      <h2 className="text-lg font-semibold mt-4">Retention</h2>
      <p className="text-sm text-gray-700">We retain data as long as needed to provide the service or as required by law. You may delete your account to remove data.</p>
      <h2 className="text-lg font-semibold mt-4">Contact</h2>
      <p className="text-sm text-gray-700">Contact support for privacy requests.</p>
    </div>
  )
}


