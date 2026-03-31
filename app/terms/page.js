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
  a{color:#B8874A;text-decoration:none}
  a:hover{text-decoration:underline}
  .footer{margin-top:4rem;padding-top:2rem;border-top:1px solid #E2D5C3;
    font-size:.82rem;color:#B5A898;display:flex;justify-content:space-between;flex-wrap:wrap;gap:1rem}
`

export default function TermsPage() {
  return (
    <>
      <style>{css}</style>
      <div className="wrap">
        <a className="back" href="https://app.simplysous.com/login">← Back to Simply Sous</a>

        <div className="logo">Simply <span>Sous</span></div>
        <div className="updated">Last updated: March 30, 2026</div>

        <h1>Terms of <em>Service</em></h1>
        <p className="intro">
          Welcome to Simply Sous. By creating an account or using our service, you agree to these terms.
          We&apos;ve written them in plain language because we believe you deserve to understand what you&apos;re agreeing to.
        </p>

        <h2>1. What Simply Sous is</h2>
        <p>Simply Sous is a meal planning web application that helps families capture recipes, plan weekly meals, generate grocery lists, and reduce the daily mental load of deciding what to cook for dinner.</p>
        <p>The service is provided by Simply Sous and is accessible at app.simplysous.com.</p>

        <h2>2. Your account</h2>
        <p>To use Simply Sous you must create an account with a valid email address and password. You are responsible for:</p>
        <ul>
          <li>Keeping your password secure and confidential</li>
          <li>All activity that occurs under your account</li>
          <li>Notifying us immediately if you suspect unauthorized access</li>
        </ul>
        <p>You must be at least 13 years old to create an account. If you are creating an account on behalf of your family, you represent that you have the authority to do so.</p>

        <h2>3. Subscription and billing</h2>
        <p>Simply Sous offers the following plans:</p>
        <ul>
          <li><strong>Free trial:</strong> 14 days of full access, no credit card required</li>
          <li><strong>Monthly:</strong> $7.99/month, billed monthly, cancel anytime</li>
          <li><strong>Annual:</strong> $79.99/year, billed annually, cancel anytime</li>
          <li><strong>Lifetime:</strong> $119.99 one-time payment, permanent access including all future updates</li>
        </ul>
        <div className="highlight">
          <p>For monthly and annual plans, your subscription renews automatically unless you cancel before the renewal date. You can cancel at any time from your account settings.</p>
        </div>
        <p>We do not offer refunds for partial billing periods. If you cancel a monthly or annual subscription, you retain access until the end of your current paid period.</p>
        <p>Lifetime access is a one-time purchase. It grants you permanent access to Simply Sous and all features we build in the future, for as long as the service exists.</p>

        <h2>4. Your content and data</h2>
        <p>You own your content. Recipes you save, meal plans you create, and preferences you set belong entirely to you. We do not claim ownership over any content you add to Simply Sous.</p>
        <p>You grant Simply Sous a limited license to store and display your content solely for the purpose of providing the service to you. We do not share, sell, or use your personal recipe data for any other purpose.</p>
        <p>You are responsible for ensuring that any recipes you save do not infringe on third-party copyrights. Saving a recipe URL or photo for personal household use is generally considered fair use, but we make no legal representations on your behalf.</p>

        <h2>5. AI-generated content</h2>
        <p>Simply Sous uses artificial intelligence (powered by Anthropic&apos;s Claude) to extract recipes, generate meal plans, create grocery lists, and power our Dot AI assistant. While we strive for accuracy, AI-generated content may occasionally contain errors.</p>
        <ul>
          <li>Always verify ingredient quantities and cooking temperatures before serving food to your family</li>
          <li>AI suggestions are recommendations only — you retain full control over what your family eats</li>
          <li>We are not responsible for outcomes resulting from following AI-generated recipes or meal plans</li>
        </ul>

        <h2>6. Sharing features</h2>
        <p>Simply Sous allows you to share recipes and collections with other users. When you share content:</p>
        <ul>
          <li>You control who can see your content through privacy settings</li>
          <li>You can revoke sharing at any time</li>
          <li>You remain responsible for the content you choose to share</li>
          <li>Do not share content that is illegal, harmful, or violates others&apos; rights</li>
        </ul>

        <h2>7. Acceptable use</h2>
        <p>You agree not to use Simply Sous to:</p>
        <ul>
          <li>Violate any applicable laws or regulations</li>
          <li>Attempt to gain unauthorized access to other users&apos; accounts or data</li>
          <li>Reverse engineer, copy, or reproduce the service</li>
          <li>Use the service for any commercial purpose without our written permission</li>
          <li>Transmit malicious code or interfere with the service&apos;s operation</li>
        </ul>

        <h2>8. Service availability</h2>
        <p>We work hard to keep Simply Sous available and reliable, but we cannot guarantee 100% uptime. We may occasionally take the service offline for maintenance or updates. We will provide reasonable notice when planned downtime is expected.</p>

        <h2>9. Termination</h2>
        <p>You may delete your account at any time from your account settings. Upon deletion, your personal data will be removed from our systems within 30 days, except where retention is required by law.</p>
        <p>We reserve the right to suspend or terminate accounts that violate these terms, with or without notice depending on the severity of the violation.</p>

        <h2>10. Limitation of liability</h2>
        <p>Simply Sous is provided &quot;as is&quot; without warranty of any kind. To the maximum extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
        <p>Our total liability to you for any claim arising from use of Simply Sous shall not exceed the amount you paid us in the 12 months prior to the claim.</p>

        <h2>11. Changes to these terms</h2>
        <p>We may update these terms from time to time. When we do, we&apos;ll update the date at the top of this page and notify you by email if the changes are material. Continued use of Simply Sous after changes are posted constitutes acceptance of the updated terms.</p>

        <h2>12. Contact us</h2>
        <p>Questions about these terms? We&apos;re real people and happy to help.</p>
        <p>Email us at <a href="mailto:hello@simplysous.com">hello@simplysous.com</a></p>

        <div className="footer">
          <span>© 2026 Simply Sous. All rights reserved.</span>
          <span><a href="/privacy">Privacy Policy</a> · <a href="mailto:hello@simplysous.com">Contact</a></span>
        </div>
      </div>
    </>
  )
}
