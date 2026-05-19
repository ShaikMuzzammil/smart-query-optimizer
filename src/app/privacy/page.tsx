import Link from 'next/link'
export default function Privacy() {
  return (
    <div style={{minHeight:'100vh',padding:'100px 24px 60px',maxWidth:800,margin:'0 auto'}}>
      <Link href="/" style={{color:'#00C6FF',textDecoration:'none',fontSize:14,display:'inline-flex',alignItems:'center',gap:6,marginBottom:32}}>← Back</Link>
      <h1 style={{fontFamily:'Syne',fontWeight:800,fontSize:48,color:'white',marginBottom:8}}>Privacy Policy</h1>
      <p style={{color:'#7A9CC0',marginBottom:40}}>Last updated: January 2025</p>
      {[['Data We Collect','Name, email and password on signup. Uploaded file content stored in memory for the session only. No data is persisted beyond the server process lifetime.'],
        ['How We Use It','To provide search and analysis features. To send email notifications via Resend (contact form, welcome email). We never sell or share your data.'],
        ['Security','Passwords hashed with bcrypt (12 rounds). Sessions via JWT in httpOnly cookies. File content processed server-side only.'],
        ['Contact','Questions? Email us at privacy@smartquery.io or use the contact form.']
      ].map(([t,d])=>(
        <div key={t} className="card" style={{padding:24,marginBottom:14}}>
          <h2 style={{fontFamily:'Syne',fontWeight:700,fontSize:18,color:'white',marginBottom:8}}>{t}</h2>
          <p style={{color:'#7A9CC0',lineHeight:1.7,fontSize:14}}>{d}</p>
        </div>
      ))}
    </div>
  )
}
