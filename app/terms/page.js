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
export default function TermsPage() {
  return (
    <div style={{minHeight:'100vh',background:'#1A1612'}}>
      <style dangerouslySetInnerHTML={{__html: css}}/>
      <div className="legal-wrap">
        <a href="/" className="legal-back">← Back to Simply Sous</a>
        <div className="legal-eyebrow">Legal</div>
        <h1>Terms of <em>Service</em></h1>
        <div className="legal-date">Effective date: April 2, 2026 · Last updated: April 2, 2026</div>

        <p>These Terms of Service ("Terms") govern your use of Simply Sous, a service provided by Inboxx Digital, LLC, doing business as Simply Sous ("Simply Sous," "we," "us," or "our"), a Wyoming limited liability company. By creating an account or using Simply Sous, you agree to these Terms.</p>

        <h2>The Service</h2>
        <p>Simply Sous is an AI-powered meal planning application that helps families plan dinners, manage recipes, and generate grocery lists. The service includes a recipe vault, weekly planning tools, a multi-week grocery list, cook mode, and Dot, an AI kitchen assistant.</p>

        <h2>Account Registration</h2>
        <p>You must create an account to use Simply Sous. You are responsible for maintaining the security of your account credentials. You must provide accurate information during registration. You must be at least 18 years old to create an account.</p>

        <h2>Subscription and Billing</h2>
        <p>Simply Sous offers three plans:</p>
        <ul>
          <li><strong style="color:#F8F3EC;font-weight:500">Monthly</strong> — $7.99/month, billed monthly, cancel anytime</li>
          <li><strong style="color:#F8F3EC;font-weight:500">Annual</strong> — $79.99/year, billed annually, cancel anytime</li>
          <li><strong style="color:#F8F3EC;font-weight:500">Lifetime</strong> — $119.99 one-time payment, access to all current and future features</li>
        </ul>
        <p>All plans begin with a 14-day free trial. No credit card is required to start a trial. Monthly and Annual plans renew automatically unless cancelled. You may cancel your subscription at any time through your account settings or by contacting us. Cancellation takes effect at the end of the current billing period.</p>

        <h2>Free Trial</h2>
        <p>New accounts receive a 14-day free trial with full access to all Simply Sous features. No credit card is required. After the trial period, continued access requires a paid subscription. We reserve the right to modify free trial terms at any time.</p>

        <h2>Refunds</h2>
        <p>Monthly and Annual subscriptions are not refunded for partial periods after cancellation. If you are unsatisfied with Simply Sous within the first 30 days of a paid subscription, contact us at hello@simplysous.com for a full refund. Lifetime access purchases are non-refundable after 30 days.</p>

        <h2>Your Content</h2>
        <p>You retain full ownership of all recipes, meal plans, and data you add to Simply Sous. By using the service, you grant us a limited license to process and store your content solely for the purpose of providing the service to you. We do not claim ownership of your recipes or data.</p>

        <h2>AI-Generated Content</h2>
        <p>Simply Sous uses AI to generate meal plans, recipe suggestions, and Dot's responses. AI-generated content is provided for convenience and informational purposes. We do not guarantee the accuracy, completeness, or suitability of AI-generated meal plans or recipes. Always use your judgment regarding dietary needs, allergens, and food safety.</p>

        <h2>Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use Simply Sous for any unlawful purpose</li>
          <li>Attempt to gain unauthorized access to any part of the service</li>
          <li>Scrape, copy, or redistribute Simply Sous content or the curated recipe database</li>
          <li>Interfere with the normal operation of the service</li>
          <li>Share your account credentials with others</li>
        </ul>

        <h2>Intellectual Property</h2>
        <p>Simply Sous, its logo, design, curated recipe database, and software are owned by Inboxx Digital, LLC and protected by copyright and trademark law. The Simply Sous name and logo are trademarks of Inboxx Digital, LLC. You may not use our trademarks without written permission.</p>

        <h2>Disclaimer of Warranties</h2>
        <p>Simply Sous is provided "as is" without warranties of any kind, either express or implied. We do not warrant that the service will be uninterrupted, error-free, or free of harmful components. Meal plans and recipe suggestions are AI-generated and should not be relied upon as professional nutritional or medical advice.</p>

        <h2>Limitation of Liability</h2>
        <p>To the fullest extent permitted by law, Inboxx Digital, LLC shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of Simply Sous. Our total liability to you for any claims arising from these Terms or your use of the service shall not exceed the amount you paid us in the 12 months preceding the claim.</p>

        <h2>Termination</h2>
        <p>We may suspend or terminate your account if you violate these Terms. You may delete your account at any time. Upon termination, your data will be handled in accordance with our Privacy Policy.</p>

        <h2>Changes to Terms</h2>
        <p>We may update these Terms from time to time. We will notify you of material changes by email or via the app. Continued use of Simply Sous after changes take effect constitutes your acceptance of the revised Terms.</p>

        <h2>Governing Law</h2>
        <p>These Terms are governed by the laws of the State of Wyoming, United States, without regard to conflict of law principles. Any disputes shall be resolved in the courts of Wyoming.</p>

        <h2>Contact Us</h2>
        <p>Inboxx Digital, LLC (dba Simply Sous)<br/>
        Wyoming, United States<br/>
        <a href="mailto:hello@simplysous.com">hello@simplysous.com</a></p>

        <div className="legal-footer">© 2026 Inboxx Digital, LLC · Simply Sous is a trademark of Inboxx Digital, LLC</div>
      </div>
    </div>
  )
}
