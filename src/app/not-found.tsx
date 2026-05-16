'use client'
import Link from 'next/link'
import Navbar from '../components/Navbar'

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="relative mb-8">
          <div className="text-[160px] font-display font-extrabold leading-none select-none"
            style={{background:'linear-gradient(135deg,#00C6FF,#7B2FBE)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',opacity:0.15}}>
            404
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00C6FF] to-[#7B2FBE] flex items-center justify-center text-4xl shadow-glow-primary">
              🔍
            </div>
            <h1 className="font-display font-bold text-4xl text-white">Page Not Found</h1>
          </div>
        </div>
        <p className="text-[#7A9CC0] text-lg max-w-md mb-10 mt-4">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="btn-primary px-8 py-3 rounded-xl text-white font-semibold">
            <span>← Go Home</span>
          </Link>
          <Link href="/dashboard" className="btn-outline px-8 py-3 rounded-xl font-semibold">
            Dashboard
          </Link>
          <Link href="/search" className="btn-outline px-8 py-3 rounded-xl font-semibold">
            Search
          </Link>
        </div>
      </main>
    </>
  )
}
