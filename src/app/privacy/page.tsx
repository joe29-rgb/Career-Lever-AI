export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Privacy & Data Controls</h1>
      <p className="text-sm text-gray-700">You control your data. Manage consent, exports, and deletion here.</p>

      <h2 className="text-lg font-semibold mt-4">Consent</h2>
      <div className="text-sm text-gray-700 space-y-2">
        <p>We request consent to process your application data to provide core features (customization, analytics, alerts). You can withdraw consent anytime.</p>
        <div className="space-x-2">
          <button className="px-3 py-2 border rounded text-sm" onClick={()=>{ try { localStorage.setItem('consent:processing','granted'); alert('Consent saved'); } catch {} }}>Grant Consent</button>
          <button className="px-3 py-2 border rounded text-sm" onClick={()=>{ try { localStorage.setItem('consent:processing','withdrawn'); alert('Consent withdrawn'); } catch {} }}>Withdraw</button>
        </div>
      </div>

      <h2 className="text-lg font-semibold mt-6">Export Your Data</h2>
      <div className="text-sm text-gray-700 space-y-2">
        <p>Download a JSON export of your account data.</p>
        <a href="/api/privacy/export" className="px-3 py-2 border rounded text-sm inline-block">Export JSON</a>
      </div>

      <h2 className="text-lg font-semibold mt-6">Request Deletion</h2>
      <div className="text-sm text-gray-700 space-y-2">
        <p>Submit a deletion request. We’ll confirm via your account email.</p>
        <form onSubmit={async(e)=>{ e.preventDefault(); const email=(e.target as any).email.value; const r = await fetch('/api/privacy/delete',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) }); alert(r.ok?'Request submitted':'Failed'); }} className="space-x-2">
          <input name="email" type="email" required placeholder="Your email" className="border rounded p-2" />
          <button type="submit" className="px-3 py-2 border rounded text-sm">Request</button>
        </form>
      </div>

      <h2 className="text-lg font-semibold mt-6">Information We Collect</h2>
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


