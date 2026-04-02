'use client'
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:#1A1612;color:#F8F3EC;font-family:'Outfit',sans-serif;font-weight:300;line-height:1.6}
  .legal-wrap{max-width:740px;margin:0 auto;padding:6rem 2rem 6rem}
  .legal-back{display:inline-flex;align-items:center;gap:.5rem;color:rgba(248,243,236,.45);text-decoration:none;font-size:.9rem;margin-bottom:3rem;transition:color .2s}
  .legal-back:hover{color:#B8874A}
  .legal-eyebrow{font-size:.72rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:#B8874A;margin-bottom:1rem;display:flex;align-items:center;gap:.6rem}
  .legal-eyebrow::before{content:'';width:1.5rem;height:1px;background:#B8874A;opacity:.6}
  h1{font-family:'Cormorant Garamond',serif;font-size:2.75rem;font-weight:300;color:#F8F3EC;line-height:1.1;margin-bottom:.75rem}
  h1 em{font-style:italic;color:#B8874A}
  .legal-date{font-size:.88rem;color:rgba(248,243,236,.35);margin-bottom:3.5rem;padding-bottom:2rem;border-bottom:1px solid rgba(255,255,255,.07)}
  h2{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:400;color:#F8F3EC;margin:2.5rem 0 .85rem;line-height:1.2}
  p{font-size:1rem;color:rgba(248,243,236,.68);line-height:1.9;margin-bottom:1rem}
  ul{margin:.5rem 0 1rem 1.25rem;display:flex;flex-direction:column;gap:.4rem}
  li{font-size:1rem;color:rgba(248,243,236,.68);line-height:1.75}
  a{color:#B8874A;text-decoration:none}
  a:hover{text-decoration:underline}
  .legal-footer{margin-top:3.5rem;padding-top:2rem;border-top:1px solid rgba(255,255,255,.07);font-size:.88rem;color:rgba(248,243,236,.35)}
`
export default function PrivacyPage() {
  return (
    <div style={{minHeight:'100vh',background:'#1A1612'}}>
      <style dangerouslySetInnerHTML={{__html: css}}/>
      <div className="legal-wrap">
        <a href="/" className="legal-back">← Back to Simply Sous</a>
        <div className="legal-eyebrow">Legal</div>
        <h1>Privacy <em>Policy</em></h1>
        <div className="legal-date">Effective date: April 2, 2026 · Last updated: April 2, 2026</div>

        <p>Inboxx Digital, LLC, doing business as Simply Sous ("Simply Sous," "we," "us," or "our"), is a Wyoming limited liability company. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use Simply Sous.</p>

        <h2>Information We Collect</h2>
        <p>We collect information you provide directly:</p>
        <ul>
          <li>Account information (email address, password)</li>
          <li>Family profile (family name, size, dinner preferences, blackout days)</li>
          <li>Dietary preferences, allergens, and disliked ingredients</li>
          <li>Child profile information (birth month and year only — names are optional)</li>
          <li>Recipes you add to your vault</li>
          <li>Pantry and fridge staples you identify</li>
          <li>Meal ratings and usage patterns</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <p>We use your information solely to provide and improve the Simply Sous service:</p>
        <ul>
          <li>To generate personalized meal plans and grocery lists</li>
          <li>To power Dot, our AI assistant, with context about your family and preferences</li>
          <li>To improve recipe recommendations over time based on your ratings</li>
          <li>To send service-related communications (account confirmations, support)</li>
          <li>To maintain and improve the Simply Sous platform</li>
        </ul>

        <h2>Children's Privacy</h2>
        <p>Simply Sous allows you to add child profiles to improve family meal recommendations. We collect only birth month and year for these profiles — names are entirely optional. We do not collect any other identifying information about children, and we do not knowingly collect personal information from children directly. Child profile data is stored privately and used only to tailor meal suggestions for your household.</p>

        <h2>Data Sharing</h2>
        <p>We do not sell, trade, or rent your personal information to third parties. We may share data with service providers who assist in operating Simply Sous (such as our database and AI processing providers), under strict confidentiality agreements. We may disclose information if required by law.</p>

        <h2>AI Processing</h2>
        <p>Simply Sous uses Claude (Anthropic) to power recipe extraction, meal planning, and the Dot assistant. When you interact with these features, relevant context (your preferences, vault contents, and family profile) is sent to Anthropic's API for processing. We do not share your full account data — only the contextual information needed to fulfill each request. Please review Anthropic's privacy policy at anthropic.com for details on how they handle API data.</p>

        <h2>Data Security</h2>
        <p>We use Supabase for secure data storage with row-level security, meaning your data is accessible only to your authenticated account. Passwords are hashed and never stored in plain text. All data transmission uses HTTPS encryption.</p>

        <h2>Data Retention and Deletion</h2>
        <p>You may delete your account at any time by contacting us. Upon account deletion, your personal data, recipes, meal plans, and family profiles will be permanently removed from our systems within 30 days.</p>

        <h2>Your Rights</h2>
        <p>You have the right to access, correct, or delete your personal data. You may update your preferences, dietary information, and family profiles at any time through the Settings page in the app. To request full data deletion or export, contact us at the address below.</p>

        <h2>Cookies</h2>
        <p>Simply Sous uses session cookies for authentication. We do not use tracking cookies, advertising cookies, or third-party analytics that identify you individually.</p>

        <h2>Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by email or via a notice in the app. Continued use of Simply Sous after changes constitutes acceptance of the updated policy.</p>

        <h2>Contact Us</h2>
        <p>Inboxx Digital, LLC (dba Simply Sous)<br/>
        Wyoming, United States<br/>
        <a href="mailto:hello@simplysous.com">hello@simplysous.com</a></p>

        <div className="legal-footer">© 2026 Inboxx Digital, LLC · Simply Sous is a trademark of Inboxx Digital, LLC</div>
      </div>
    </div>
  )
}
