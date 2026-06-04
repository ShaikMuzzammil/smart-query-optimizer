import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signToken } from '../../../../lib/auth'
import { store } from '../../../../lib/store'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email||!password) return NextResponse.json({error:'Email and password required'},{status:400})
    const user = store.users.get(email.toLowerCase())
    if (!user) return NextResponse.json({error:'No account found. Please sign up first.'},{status:401})
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return NextResponse.json({error:'Incorrect password.'},{status:401})
    const token = await signToken({userId:user.id,email:user.email,name:user.name,plan:user.plan})
    const res = NextResponse.json({ok:true,user:{id:user.id,name:user.name,email:user.email,plan:user.plan}})
    res.cookies.set('sq_token',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',maxAge:60*60*24*7,path:'/'})
    return res
  } catch { return NextResponse.json({error:'Server error'},{status:500}) }
}
