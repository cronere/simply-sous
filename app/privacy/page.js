'use client'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Outfit:wght@300;400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:#FBF8F3;color:#1A1612;font-family:'Outfit',sans-serif;font-weight:300}
  .wrap{max-width:740px;margin:0 auto;padding:5rem 2rem 8rem}
  .back{display:inline-flex;align-items:center;gap:.5rem;font-size:.85rem;color:#B8874A;
    text-decoration:none;margin-bottom:3rem;transition:opacity .2s}
  .back:hover{opacity:.7}
  .logo{font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:600;color:#1A1612;margin-bottom:.25rem}
  .logo span{color:#B8874A;font-style:italic}
  .updated{font-size:.78rem;color:#B5A898;letter-spacing:.08em;text-transform:uppercase;margin-bottom:3rem}
  h1{font-family:'Cormorant Garamond',serif;font-size:2.8rem;font-weight:300;color:#1A1612;
    line-height:1.1;margin-bottom:1rem}
  h1 em{font-style:italic;color:#C05C30}
  .intro{font-size:1.05rem;color:#7A6C5E;line-height:1.85;margin-bottom:3rem;
    padding-bottom:2rem;border-bottom:1px solid #E2D5C3}
  h2{font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:600;
    color:#1A1612;margin:2.5rem 0 .85rem}
  p{font-size:.95rem;color:#7A6C5E;line-height:1.85;margin-bottom:1rem}
  ul{margin:.5rem 0 1rem 1.25rem}
  ul li{font-size:.95rem;color:#7A6C5E;line-height:1.85;margin-bottom:.4rem}
  .highlight{background:rgba(184,135,74,.08);border-left:3px solid #B8874A;
    padding:1rem 1.25rem;border-radius:0 8px 8px 0;margin:1.5rem 0}
  .highlight p{margin:0;color:#1A1612;font-weight:400}
  .clean-box{background:rgba(143,168,137,.08);border:1px solid rgba(143,168,137,.25);
    border-radius:12px;padding:1.5rem;margin:1.5rem 0}
  .clean-box p{margin:0;color:#1A1612;font-weight:400;font-size:.95rem}
  a{color:#B8874A;text-decoration:none}
  a:hover{text-decoration:underline}
  .footer{margin-top:4rem;padding-top:2rem;border-top:1px solid #E2D5C3;
    font-size:.82rem;color:#B5A898;display:flex;justify-content:space-between;flex-wrap:wrap;gap:1rem}
  table{width:100%;border-collapse:collapse;margin:1rem 0}
  td,th{text-align:left;padding:.75rem 1rem;font-size:.88rem;border-bottom:1px solid #E2D5C3}
  th{color:#1A1612;font-weight:500;background:#F2EBE0}
  td{color:#7A6C5E}
`

export default function PrivacyPage() {
  return (
    <>
      <style>{css}</style>
      <div className="wrap">
        <a className="back" href="https://app.simplysous.com/login">← Back to Simply Sous</a>

        <div className="logo">Simply <span>Sous</span></div>
        <div className="updated">Last updated: March 30, 2026</div>

        <h1>Privacy <em>Policy</em></h1>
        <p className="intro">
          Your family&apos;s meal data is personal. We treat it that way. This policy explains exactly
          what information we collect, how we use it, and the choices you have. We don&apos;t sell your data.
          We never have and never will.
        </p>

        <div className="clean-box">
          <p>✓ We do not sell your personal data.<br />
          ✓ We do not share your recipe vault with other users without your permission.<br />
          ✓ We do not use your data to train AI models.<br />
          ✓ You can delete your account and all your data at any time.</p>
        </div>

        <h2>1. What information we collect</h2>
        <p><strong>Account information:</strong> When you sign up, we collect your name, email address, and password (stored securely as a hash — we never see your actual password).</p>
        <p><strong>Profile and preferences:</strong> Information you provide during onboarding and in your settings — family size, dietary restrictions, cuisine preferences, blackout days, planning schedule, and pantry staples.</p>
        <p><strong>Recipe and meal data:</strong> Recipes you save (including from photos, screenshots, and URLs), weekly meal plans you create, grocery lists, ratings, and favorites.</p>
        <p><strong>Usage data:</strong> Basic information about how you use the app — pages visited, features used, and session timing. This helps us improve the product. We do not track individual keystrokes or record your sessions.</p>
        <p><strong>Payment information:</strong> If you subscribe to a paid plan, payment is processed by Stripe. We do not store your credit card number — Stripe handles all payment data under their own privacy policy.</p>

        <h2>2. How we use your information</h2>
        <table>
          <thead>
            <tr><th>Data</th><th>How we use it</th></tr>
          </thead>
          <tbody>
            <tr><td>Account info</td><td>To authenticate you and send account-related emails</td></tr>
            <tr><td>Preferences</td><td>To personalize AI meal recommendations and grocery lists</td></tr>
            <tr><td>Recipe & meal data</td><td>To power your vault, planning, and grocery features</td></tr>
            <tr><td>Usage data</td><td>To improve the product and fix bugs</td></tr>
            <tr><td>Email address</td><td>For account notices, reminders you opt into, and support</td></tr>
          </tbody>
        </table>

        <h2>3. AI and your data</h2>
        <p>Simply Sous uses Anthropic&apos;s Claude AI to power recipe extraction, meal planning, grocery list generation, and the Dot AI assistant. When you use these features:</p>
        <ul>
          <li>Your recipe content and preferences are sent to Anthropic&apos;s API to generate responses</li>
          <li>Anthropic does not use API data to train their models (per their API usage policy)</li>
          <li>We do not use your personal meal data to train any AI model</li>
          <li>AI conversations with Dot are stored in your account so she can remember context across sessions</li>
        </ul>

        <h2>4. Sharing your data</h2>
        <p>We do not sell, rent, or share your personal data with third parties for their marketing purposes. Ever.</p>
        <p>We share data only in these limited circumstances:</p>
        <ul>
          <li><strong>With your permission:</strong> When you share a recipe or collection using the sharing features, you control exactly what is visible and to whom</li>
          <li><strong>Service providers:</strong> We use a small number of trusted services to operate Simply Sous — Supabase (database), Vercel (hosting), Anthropic (AI), and Stripe (payments). Each is bound by data processing agreements</li>
          <li><strong>Legal requirements:</strong> If required by law, court order, or to protect the rights and safety of our users</li>
        </ul>

        <h2>5. Data storage and security</h2>
        <p>Your data is stored securely in Supabase&apos;s infrastructure, hosted on AWS. We use:</p>
        <ul>
          <li>Row-level security so only you can access your own data</li>
          <li>Encrypted connections (HTTPS/TLS) for all data in transit</li>
          <li>Encrypted storage for data at rest</li>
          <li>Secure password hashing — we never store your password in plain text</li>
        </ul>
        <div className="highlight">
          <p>No system is 100% secure. If we ever become aware of a breach affecting your data, we will notify you promptly by email.</p>
        </div>

        <h2>6. Reminders and notifications</h2>
        <p>Simply Sous sends the following communications:</p>
        <ul>
          <li><strong>Account emails:</strong> Confirmation, password reset, and important account notices. These cannot be opted out of as they are essential to the service.</li>
          <li><strong>Planning reminders:</strong> Weekly nudges to plan your meals, sent on the day you choose during onboarding. You can disable these in your settings.</li>
          <li><strong>Daily prep alerts:</strong> Notifications about when to start cooking each day. You can disable these in your settings.</li>
          <li><strong>Grocery list delivery:</strong> Your shopping list sent after you confirm your weekly plan. You can disable this in your settings.</li>
        </ul>

        <h2>7. Your rights and choices</h2>
        <p>You have full control over your data:</p>
        <ul>
          <li><strong>Access:</strong> View all your data in your account at any time</li>
          <li><strong>Update:</strong> Edit your profile, preferences, and recipes whenever you like</li>
          <li><strong>Export:</strong> Contact us at hello@simplysous.com to request a copy of your data</li>
          <li><strong>Delete:</strong> Delete your account from your settings page — all your personal data is removed within 30 days</li>
          <li><strong>Unsubscribe:</strong> Opt out of non-essential emails in your notification settings</li>
        </ul>
        <p>If you are located in the European Economic Area (EEA) or the UK, you have additional rights under GDPR including the right to data portability and the right to lodge a complaint with your supervisory authority.</p>

        <h2>8. Cookies</h2>
        <p>Simply Sous uses only essential cookies required for the service to function — specifically, session cookies to keep you logged in. We do not use advertising cookies or third-party tracking cookies.</p>

        <h2>9. Children&apos;s privacy</h2>
        <p>Simply Sous is designed for adults managing their family&apos;s meals. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us personal information, please contact us and we will delete it promptly.</p>

        <h2>10. Changes to this policy</h2>
        <p>We may update this privacy policy as our service evolves. When we make material changes, we will notify you by email and update the date at the top of this page. We encourage you to review this policy periodically.</p>

        <h2>11. Contact us</h2>
        <p>Privacy questions, data requests, or concerns — we&apos;re here.</p>
        <p>Email: <a href="mailto:hello@simplysous.com">hello@simplysous.com</a></p>
        <p>We aim to respond to all privacy inquiries within 5 business days.</p>

        <div className="footer">
          <span>© 2026 Simply Sous. All rights reserved.</span>
          <span><a href="/terms">Terms of Service</a> · <a href="mailto:hello@simplysous.com">Contact</a></span>
        </div>
      </div>
    </>
  )
}
