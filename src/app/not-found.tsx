import Link from 'next/link'
export default function NotFound() {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:24}}>
      <div style={{fontFamily:'Syne',fontWeight:800,fontSize:120,lineHeight:1,background:'linear-gradient(135deg,#00C6FF,#7B2FBE)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',opacity:0.3,marginBottom:16}}>404</div>
      <h1 style={{fontFamily:'Syne',fontWeight:700,fontSize:32,color:'white',marginBottom:12}}>Page Not Found</h1>
      <p style={{color:'#7A9CC0',marginBottom:32,maxWidth:400}}>The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <div style={{display:'flex',gap:14}}>
        <Link href="/" className="btn-p" style={{padding:'12px 28px',borderRadius:10,textDecoration:'none',fontSize:14}}><span>← Home</span></Link>
        <Link href="/dashboard" className="btn-o" style={{padding:'12px 28px',borderRadius:10,textDecoration:'none',fontSize:14}}>Dashboard</Link>
      </div>
    </div>
  )
}
