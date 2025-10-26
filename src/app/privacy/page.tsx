"use client"

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last Updated: October 19, 2025</p>
        <p className="text-base text-foreground">Career Lever AI ("we", "our", "us") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information.</p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Your Data Rights</h2>
        <p className="text-sm text-foreground">You control your data. Manage consent, export your information, or request deletion below.</p>
      </div>

      <h2 className="text-lg font-semibold mt-4">Consent</h2>
      <div className="text-sm text-foreground space-y-2">
        <p>We request consent to process your application data to provide core features (customization, analytics, alerts). You can withdraw consent anytime.</p>
        <div className="space-x-2">
          <button className="px-3 py-2 border rounded text-sm" onClick={()=>{ try { localStorage.setItem('consent:processing','granted'); alert('Consent saved'); } catch {} }}>Grant Consent</button>
          <button className="px-3 py-2 border rounded text-sm" onClick={()=>{ try { localStorage.setItem('consent:processing','withdrawn'); alert('Consent withdrawn'); } catch {} }}>Withdraw</button>
        </div>
      </div>

      <h2 className="text-lg font-semibold mt-6">Export Your Data</h2>
      <div className="text-sm text-foreground space-y-2">
        <p>Download a JSON export of your account data.</p>
        <a href="/api/privacy/export" className="px-3 py-2 border rounded text-sm inline-block">Export JSON</a>
      </div>

      <h2 className="text-lg font-semibold mt-6">Request Deletion</h2>
      <div className="text-sm text-foreground space-y-2">
        <p>Submit a deletion request. We’ll confirm via your account email.</p>
        <form onSubmit={async(e)=>{ e.preventDefault(); const email=(e.target as any).email.value; const r = await fetch('/api/privacy/delete',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) }); alert(r.ok?'Request submitted':'Failed'); }} className="space-x-2">
          <input name="email" type="email" required placeholder="Your email" className="border rounded p-2" />
          <button type="submit" className="px-3 py-2 border rounded text-sm">Request</button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">1. Information We Collect</h2>
        
        <div>
          <h3 className="text-lg font-semibold">1.1 Information You Provide</h3>
          <ul className="list-disc ml-6 text-sm text-foreground space-y-1 mt-2">
            <li><strong>Account Information:</strong> Name, email address, profile photo</li>
            <li><strong>Professional Information:</strong> Resumes, cover letters, work experience, skills, education</li>
            <li><strong>Job Applications:</strong> Job titles, companies, application status, notes</li>
            <li><strong>User-Generated Content:</strong> Custom templates, saved searches, preferences</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold">1.2 Information Collected Automatically</h3>
          <ul className="list-disc ml-6 text-sm text-foreground space-y-1 mt-2">
            <li><strong>Device Information:</strong> Device type, operating system, browser type, IP address</li>
            <li><strong>Usage Data:</strong> Pages viewed, features used, time spent, click patterns</li>
            <li><strong>Location Data:</strong> Approximate location based on IP address (for job matching)</li>
            <li><strong>Performance Data:</strong> Error logs, crash reports, API response times</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold">1.3 Information from Third Parties</h3>
          <ul className="list-disc ml-6 text-sm text-foreground space-y-1 mt-2">
            <li><strong>Google OAuth:</strong> Email, name, profile photo (with your permission)</li>
            <li><strong>Google Calendar:</strong> Calendar events (only when you enable integration)</li>
            <li><strong>AI Services:</strong> Processed data from Perplexity AI for research and insights</li>
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">2. How We Use Your Information</h2>
        
        <div>
          <h3 className="text-lg font-semibold">2.1 To Provide Our Services</h3>
          <ul className="list-disc ml-6 text-sm text-foreground space-y-1 mt-2">
            <li>Generate AI-powered resume and cover letter customizations</li>
            <li>Provide company research and job market insights</li>
            <li>Track and manage your job applications</li>
            <li>Send notifications about application deadlines and updates</li>
            <li>Sync with your calendar for interview scheduling</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold">2.2 To Improve Our Services</h3>
          <ul className="list-disc ml-6 text-sm text-foreground space-y-1 mt-2">
            <li>Analyze usage patterns to enhance features</li>
            <li>Conduct research and development</li>
            <li>Test new features and improvements</li>
            <li>Personalize your experience and recommendations</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold">2.3 For Security and Legal Compliance</h3>
          <ul className="list-disc ml-6 text-sm text-foreground space-y-1 mt-2">
            <li>Prevent fraud, abuse, and security incidents</li>
            <li>Comply with legal obligations and law enforcement requests</li>
            <li>Enforce our Terms of Service</li>
            <li>Protect the rights and safety of our users</li>
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">3. How We Share Your Information</h2>
        
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm font-semibold">✓ We DO NOT sell your personal data to third parties.</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold">3.1 Service Providers</h3>
          <p className="text-sm text-foreground mt-2">We share data with trusted service providers who help us operate our services:</p>
          <ul className="list-disc ml-6 text-sm text-foreground space-y-1 mt-2">
            <li><strong>Cloud Hosting:</strong> Railway, Vercel (infrastructure)</li>
            <li><strong>Database:</strong> MongoDB Atlas (data storage)</li>
            <li><strong>AI Services:</strong> Perplexity AI (research and insights)</li>
            <li><strong>Authentication:</strong> Google OAuth (sign-in)</li>
            <li><strong>Analytics:</strong> Error tracking and performance monitoring</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold">3.2 With Your Consent</h3>
          <ul className="list-disc ml-6 text-sm text-foreground space-y-1 mt-2">
            <li>When you connect third-party services (e.g., Google Calendar)</li>
            <li>When you share your resume or application with others</li>
            <li>When you explicitly authorize data sharing</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold">3.3 Legal Requirements</h3>
          <p className="text-sm text-foreground mt-2">We may disclose information if required by law, court order, or to protect rights and safety.</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mt-4">Security</h2>
      <p className="text-sm text-foreground">We use industry practices (encryption in transit, restricted access, rate limiting) to protect your data. Despite safeguards, no method is 100% secure.</p>

      <h2 className="text-lg font-semibold mt-4">Retention</h2>
      <p className="text-sm text-foreground">We retain data for the duration of your account or as required by law. You may delete your account to remove data, subject to legal/operational limits.</p>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">4. Your Privacy Rights</h2>
        
        <div>
          <h3 className="text-lg font-semibold">4.1 GDPR Rights (EU Users)</h3>
          <ul className="list-disc ml-6 text-sm text-foreground space-y-1 mt-2">
            <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
            <li><strong>Right to Rectification:</strong> Correct inaccurate data</li>
            <li><strong>Right to Erasure:</strong> Request deletion of your data</li>
            <li><strong>Right to Portability:</strong> Export your data in machine-readable format</li>
            <li><strong>Right to Object:</strong> Object to processing of your data</li>
            <li><strong>Right to Restrict:</strong> Limit how we use your data</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold">4.2 CCPA Rights (California Users)</h3>
          <ul className="list-disc ml-6 text-sm text-foreground space-y-1 mt-2">
            <li><strong>Right to Know:</strong> What personal information we collect and how we use it</li>
            <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
            <li><strong>Right to Opt-Out:</strong> Opt-out of sale of personal information (we don't sell data)</li>
            <li><strong>Right to Non-Discrimination:</strong> Equal service regardless of privacy choices</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold">4.3 How to Exercise Your Rights</h3>
          <p className="text-sm text-foreground mt-2">Use the tools above or contact us at <strong>privacy@careerlever.com</strong></p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">5. Data Security</h2>
        <p className="text-sm text-foreground">We implement industry-standard security measures to protect your data:</p>
        <ul className="list-disc ml-6 text-sm text-foreground space-y-1">
          <li><strong>Encryption:</strong> All data encrypted in transit (TLS/SSL) and at rest</li>
          <li><strong>Access Controls:</strong> Role-based access with multi-factor authentication</li>
          <li><strong>Monitoring:</strong> 24/7 security monitoring and incident response</li>
          <li><strong>Regular Audits:</strong> Security assessments and penetration testing</li>
          <li><strong>Data Backups:</strong> Regular encrypted backups with disaster recovery</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">Despite our safeguards, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">6. Data Retention</h2>
        <p className="text-sm text-foreground">We retain your data for as long as your account is active or as needed to provide services. Retention periods:</p>
        <ul className="list-disc ml-6 text-sm text-foreground space-y-1">
          <li><strong>Account Data:</strong> Until account deletion + 30 days</li>
          <li><strong>Resumes & Applications:</strong> Until you delete them or close your account</li>
          <li><strong>Usage Logs:</strong> 90 days for analytics, 1 year for security</li>
          <li><strong>Backups:</strong> 30 days rolling retention</li>
        </ul>
        <p className="text-sm text-foreground mt-2">After deletion, some data may remain in backups for up to 30 days before permanent removal.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">7. Children's Privacy</h2>
        <p className="text-sm text-foreground">Career Lever AI is not intended for users under 16 years of age. We do not knowingly collect personal information from children. If you believe we have collected data from a child, please contact us immediately.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">8. International Data Transfers</h2>
        <p className="text-sm text-foreground">Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including:</p>
        <ul className="list-disc ml-6 text-sm text-foreground space-y-1">
          <li>Standard Contractual Clauses (SCCs) for EU data transfers</li>
          <li>Data Processing Agreements with all service providers</li>
          <li>Compliance with applicable data protection laws</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">9. Cookies and Tracking</h2>
        <p className="text-sm text-foreground">We use cookies and similar technologies to:</p>
        <ul className="list-disc ml-6 text-sm text-foreground space-y-1">
          <li>Keep you signed in</li>
          <li>Remember your preferences</li>
          <li>Understand how you use our services</li>
          <li>Improve performance and security</li>
        </ul>
        <p className="text-sm text-foreground mt-2">You can control cookies through your browser settings. Disabling cookies may affect functionality.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">10. Changes to This Policy</h2>
        <p className="text-sm text-foreground">We may update this privacy policy from time to time. We will notify you of significant changes by:</p>
        <ul className="list-disc ml-6 text-sm text-foreground space-y-1">
          <li>Posting the new policy on this page</li>
          <li>Updating the "Last Updated" date</li>
          <li>Sending an email notification (for material changes)</li>
        </ul>
        <p className="text-sm text-foreground mt-2">Your continued use of our services after changes constitutes acceptance of the updated policy.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">11. Contact Us</h2>
        <p className="text-sm text-foreground">For privacy questions, concerns, or to exercise your rights:</p>
        <div className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-4 space-y-2">
          <p className="text-sm"><strong>Email:</strong> privacy@careerlever.com</p>
          <p className="text-sm"><strong>Support:</strong> support@careerlever.com</p>
          <p className="text-sm"><strong>Data Protection Officer:</strong> dpo@careerlever.com</p>
          <p className="text-sm"><strong>Address:</strong> Career Lever AI, [Your Address]</p>
        </div>
        <p className="text-sm text-muted-foreground mt-4">We will respond to all requests within 30 days.</p>
      </div>

      <div className="border-t pt-6 mt-8">
        <p className="text-xs text-muted-foreground">This privacy policy is effective as of October 19, 2025. Version 1.0</p>
      </div>
    </div>
  )
}



