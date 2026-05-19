import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signToken } from '../../../../lib/auth'
import { store } from '../../../../lib/store'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()
    if (!name?.trim()||!email?.trim()||!password) return NextResponse.json({error:'All fields required'},{status:400})
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({error:'Invalid email'},{status:400})
    if (password.length<8) return NextResponse.json({error:'Password must be at least 8 characters'},{status:400})
    if (store.users.has(email.toLowerCase())) return NextResponse.json({error:'Account already exists'},{status:409})
    const passwordHash = await bcrypt.hash(password,12)
    const id='u_'+Date.now()
    const user = {id,name:name.trim(),email:email.toLowerCase(),passwordHash,plan:'FREE',createdAt:new Date().toISOString()}
    store.users.set(email.toLowerCase(),user)
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const from = process.env.DEFAULT_FROM_EMAIL||'onboarding@resend.dev'
      resend.emails.send({from:`SmartQuery <${from}>`,to:email,subject:'Welcome to SmartQuery Optimizer',html:`<p style="font-family:Arial">Hi <strong>${name}</strong>, your account is ready! <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Open Dashboard</a></p>`}).catch(()=>{})
      if (process.env.ADMIN_EMAIL) resend.emails.send({from:`SmartQuery <${from}>`,to:process.env.ADMIN_EMAIL,subject:`New signup: ${name}`,html:`<p>${name} (${email}) just signed up.</p>`}).catch(()=>{})
    }
    const token = signToken({userId:user.id,email:user.email,name:user.name,plan:user.plan})
    const res = NextResponse.json({ok:true,user:{id:user.id,name:user.name,email:user.email,plan:user.plan}},{status:201})
    res.cookies.set('sq_token',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',maxAge:60*60*24*7,path:'/'})
    return res
  } catch { return NextResponse.json({error:'Server error'},{status:500}) }
}
