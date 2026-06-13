import { redirect } from 'next/navigation';
import { getCurrentUser } from '../lib/session';
import Nav from '../components/landing/Nav';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import AIShowcase from '../components/landing/AIShowcase';
import HowItWorks from '../components/landing/HowItWorks';
import GuideSection from '../components/landing/GuideSection';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  return (
    <main>
      <Nav />
      <Hero />
      <Features />
      <AIShowcase />
      <HowItWorks />
      <GuideSection />
      <CTA />
      <Footer />
    </main>
  );
}
