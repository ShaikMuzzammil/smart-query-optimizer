import Link from 'next/link'
export default function Terms() {
  return (
    <div style={{minHeight:'100vh',padding:'100px 24px 60px',maxWidth:800,margin:'0 auto'}}>
      <Link href="/" style={{color:'#00C6FF',textDecoration:'none',fontSize:14,display:'inline-flex',alignItems:'center',gap:6,marginBottom:32}}>← Back</Link>
      <h1 style={{fontFamily:'Syne',fontWeight:800,fontSize:48,color:'white',marginBottom:8}}>Terms of Service</h1>
      <p style={{color:'#7A9CC0',marginBottom:40}}>Last updated: January 2025</p>
      {[['Acceptance','By using SmartQuery Optimizer you agree to these terms.'],
        ['Use','For lawful purposes only. Do not upload malicious content or attempt to abuse the system.'],
        ['Accounts','You are responsible for your credentials. Notify us of any unauthorized access.'],
        ['Limitation','SmartQuery is provided "as is" without warranties of any kind.']
      ].map(([t,d])=>(
        <div key={t} className="card" style={{padding:24,marginBottom:14}}>
          <h2 style={{fontFamily:'Syne',fontWeight:700,fontSize:18,color:'white',marginBottom:8}}>{t}</h2>
          <p style={{color:'#7A9CC0',lineHeight:1.7,fontSize:14}}>{d}</p>
        </div>
      ))}
    </div>
  )
}
