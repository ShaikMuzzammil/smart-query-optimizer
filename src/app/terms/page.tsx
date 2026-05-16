import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display font-extrabold text-5xl text-white mb-4">Terms of Service</h1>
          <p className="text-[#7A9CC0] mb-8">Last updated: January 2025</p>
          {[
            ['Acceptance','By using SmartQuery Optimizer you agree to these terms. If you do not agree, please discontinue use.'],
            ['Use of Service','SmartQuery is for lawful purposes only. You agree not to abuse the crawler, violate robots.txt on third-party sites, or use the service for illegal activities.'],
            ['Accounts','You are responsible for your account credentials. Notify us immediately of any unauthorized access at security@smartquery.io.'],
            ['Limitation of Liability','SmartQuery is provided "as is" without warranties. We are not liable for indirect, incidental, or consequential damages from your use of the service.'],
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
