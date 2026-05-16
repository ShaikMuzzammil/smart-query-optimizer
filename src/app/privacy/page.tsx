import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display font-extrabold text-5xl text-white mb-4">Privacy Policy</h1>
          <p className="text-[#7A9CC0] mb-8">Last updated: January 2025</p>
          {[
            ['Information We Collect','We collect information you provide directly: name, email, and password on signup. We also collect usage data like search queries and crawl statistics to improve our service.'],
            ['How We Use Your Information','We use your information to provide and improve SmartQuery, send notifications via Resend email, and respond to contact form submissions. Your data is never sold to third parties.'],
            ['Data Security','Passwords are hashed using bcrypt (12 rounds). API keys are stored securely. JWT tokens are stored in httpOnly cookies — never in localStorage.'],
            ['Contact','Questions about this policy? Reach us at privacy@smartquery.io or use our contact form.'],
          ].map(([title, text]) => (
            <div key={title as string} className="card p-6 mb-4">
              <h2 className="font-display font-bold text-xl text-white mb-3">{title}</h2>
              <p className="text-[#7A9CC0] leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
