'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const EXAMPLES = [
  { id:'e1', title:'N+1 Join Nightmare', badge:'🔥 Most Common', category:'joins', difficulty:'intermediate', dbType:'postgresql', goal:'speed', expectedImprovement:87,
    desc:'A classic N+1 query joining orders, customers and products with no indexes — the most common performance killer in production.',
    tags:['joins','n+1','indexes','orders'],
    query:`SELECT\n  o.id,\n  o.created_at,\n  o.total_amount,\n  c.first_name,\n  c.last_name,\n  c.email,\n  (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count,\n  (SELECT SUM(oi2.quantity * p.price)\n   FROM order_items oi2\n   JOIN products p ON p.id = oi2.product_id\n   WHERE oi2.order_id = o.id) AS recalculated_total\nFROM orders o\nJOIN customers c ON c.id = o.customer_id\nWHERE o.status = 'pending'\n  AND o.created_at >= NOW() - INTERVAL '30 days'\nORDER BY o.created_at DESC;` },
  { id:'e2', title:'Missing Composite Index', badge:'⚡ Quick Win', category:'indexing', difficulty:'beginner', dbType:'mysql', goal:'speed', expectedImprovement:92,
    desc:'E-commerce product search running a sequential scan on 10M rows. One composite index changes everything.',
    tags:['index','mysql','search','ecommerce'],
    query:`SELECT p.id, p.name, p.price, p.stock_quantity,\n  c.name AS category_name\nFROM products p\nJOIN categories c ON c.id = p.category_id\nWHERE p.is_active = 1\n  AND p.category_id = 42\n  AND p.price BETWEEN 10.00 AND 500.00\n  AND p.stock_quantity > 0\nORDER BY p.price ASC\nLIMIT 20 OFFSET 0;` },
  { id:'e3', title:'Deep Nested Subqueries', badge:'🧬 Complex', category:'subquery', difficulty:'advanced', dbType:'postgresql', goal:'readability', expectedImprovement:65,
    desc:'Three levels of nested subqueries evaluated row-by-row. A textbook CTE refactor opportunity.',
    tags:['subquery','cte','refactor','nested'],
    query:`SELECT u.id, u.username, u.email,\n  (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id AND p.status = 'published') AS post_count,\n  (SELECT MAX(p2.created_at) FROM posts p2 WHERE p2.user_id = u.id) AS last_post_date,\n  (SELECT COUNT(*) FROM comments c\n   WHERE c.post_id IN (SELECT id FROM posts p3 WHERE p3.user_id = u.id)\n   AND c.created_at >= NOW() - INTERVAL '7 days') AS recent_comments\nFROM users u\nWHERE u.created_at >= '2023-01-01'\n  AND u.is_active = true\n  AND (SELECT COUNT(*) FROM posts p4 WHERE p4.user_id = u.id) > 0\nORDER BY post_count DESC LIMIT 50;` },
  { id:'e4', title:'Aggregation Without Indexes', badge:'📊 Analytics', category:'aggregation', difficulty:'intermediate', dbType:'postgresql', goal:'cost', expectedImprovement:74,
    desc:'Monthly revenue report scanning millions of rows with no covering indexes — kills dashboards at scale.',
    tags:['aggregation','group by','analytics','revenue'],
    query:`SELECT\n  DATE_TRUNC('month', created_at) AS month,\n  status,\n  COUNT(*) AS order_count,\n  SUM(total_amount) AS revenue,\n  AVG(total_amount) AS avg_order_value,\n  COUNT(DISTINCT customer_id) AS unique_customers\nFROM orders\nWHERE created_at BETWEEN '2023-01-01' AND '2024-01-01'\n  AND status NOT IN ('cancelled', 'refunded')\nGROUP BY 1, 2\nORDER BY 1 DESC, revenue DESC;` },
  { id:'e5', title:'Window Function Refactor', badge:'🏆 Expert', category:'advanced', difficulty:'expert', dbType:'postgresql', goal:'balanced', expectedImprovement:78,
    desc:'A rank-and-filter using a self-join instead of window functions — 10× slower than it needs to be.',
    tags:['window','rank','self-join','refactor'],
    query:`SELECT e.id, e.name, e.department_id, e.salary, d.name AS dept\nFROM employees e\nJOIN departments d ON d.id = e.department_id\nWHERE e.salary = (\n  SELECT MAX(e2.salary)\n  FROM employees e2\n  WHERE e2.department_id = e.department_id\n)\nAND e.is_active = true\nORDER BY e.department_id, e.salary DESC;` },
  { id:'e6', title:'Deep Offset Pagination', badge:'📄 Pagination', category:'performance', difficulty:'intermediate', dbType:'postgresql', goal:'cost', expectedImprovement:71,
    desc:'Offset pagination scanning millions of rows to skip. Cursor-based is orders of magnitude faster.',
    tags:['pagination','offset','cursor','limit'],
    query:`SELECT id, user_id, action_type, metadata, created_at\nFROM audit_logs\nWHERE user_id = 12345\n  AND created_at >= '2023-01-01'\nORDER BY created_at DESC\nLIMIT 20 OFFSET 50000;` },
  { id:'e7', title:'Slow LIKE Search', badge:'🔍 Search', category:'performance', difficulty:'intermediate', dbType:'postgresql', goal:'speed', expectedImprovement:83,
    desc:'Full-text search using leading wildcards — prevents any index usage. Switch to full-text or trigram.',
    tags:['like','full-text','trigram','ilike'],
    query:`SELECT id, title, body, author_id, view_count\nFROM articles\nWHERE (title ILIKE '%javascript%' OR body ILIKE '%javascript%')\n  AND is_published = true\n  AND created_at >= NOW() - INTERVAL '1 year'\nORDER BY view_count DESC\nLIMIT 20;` },
  { id:'e8', title:'SQL Server Sargability', badge:'🖥️ SQL Server', category:'performance', difficulty:'advanced', dbType:'sqlserver', goal:'speed', expectedImprovement:68,
    desc:'Date function in WHERE clause prevents index use in SQL Server. Classic sargability issue.',
    tags:['sql server','sargability','date function'],
    query:`SELECT s.SaleID, s.CustomerID, s.Amount, s.SaleDate, c.CustomerName\nFROM Sales s\nINNER JOIN Customers c ON c.CustomerID = s.CustomerID\nWHERE YEAR(s.SaleDate) = 2023\n  AND MONTH(s.SaleDate) = 6\n  AND c.Region = 'North'\nORDER BY s.Amount DESC;` },
]

const CATS = ['all','joins','indexing','subquery','aggregation','advanced','performance']
const DIFF_COLORS: Record<string,string> = { beginner:'#00E676', intermediate:'#00C6FF', advanced:'#7B2FBE', expert:'#FF6B35' }

export default function ExamplesPage() {
  const [cat, setCat] = useState('all')
  const [search, setSearch] = useState('')
  const router = useRouter()

  const filtered = EXAMPLES.filter(e => {
    const matchCat = cat==='all' || e.category===cat
    const q = search.toLowerCase()
    const matchS = !q || e.title.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q) || e.tags.some(t=>t.includes(q))
    return matchCat && matchS
  })

  const tryExample = (ex: typeof EXAMPLES[0]) => {
    try { sessionStorage.setItem('sqo_example', JSON.stringify({ query:ex.query, dbType:ex.dbType, optimizationGoal:ex.goal })) } catch {}
    router.push('/optimizer')
  }

  return (
    <>
      <Navbar />
      <main style={{ minHeight:'100vh', paddingTop:90, paddingBottom:80 }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 20px' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(123,47,190,0.1)', border:'1px solid rgba(123,47,190,0.25)', borderRadius:100, padding:'4px 14px', fontSize:11, color:'#7B2FBE', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:14 }}>
              8 Examples · 6 Categories
            </div>
            <h1 style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)', fontFamily:'Syne,sans-serif', fontWeight:800, marginBottom:10 }}>
              Real-World <span className="gtext">SQL Examples</span>
            </h1>
            <p style={{ color:'#7A9CC0', fontSize:16 }}>Common SQL anti-patterns. Click any to load into the optimizer and see the AI improvement live.</p>
          </div>

          {/* Search + filter */}
          <div style={{ display:'flex', gap:12, marginBottom:28, flexWrap:'wrap' }}>
            <div style={{ position:'relative', flex:1, minWidth:200 }}>
              <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#445566', pointerEvents:'none' }}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search examples…"
                style={{ width:'100%', padding:'10px 14px 10px 36px', background:'rgba(10,22,48,0.8)', border:'1px solid rgba(0,198,255,0.18)', borderRadius:10, color:'#E8F4FD', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'Outfit,sans-serif' }} />
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {CATS.map(c => (
                <button key={c} onClick={()=>setCat(c)}
                  style={{ padding:'8px 14px', borderRadius:8, border:`1px solid ${cat===c?'rgba(0,198,255,0.4)':'rgba(255,255,255,0.07)'}`, background:cat===c?'rgba(0,198,255,0.1)':'transparent', color:cat===c?'#00C6FF':'#7A9CC0', fontSize:12, fontWeight:600, cursor:'pointer', textTransform:'capitalize', transition:'all 0.2s' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {filtered.length===0 ? (
            <div style={{ textAlign:'center', padding:'60px 0', color:'#445566' }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🔍</div>
              <p>No examples match your search.</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:20 }}>
              {filtered.map(ex => (
                <div key={ex.id} className="card" style={{ padding:22, display:'flex', flexDirection:'column', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                    <div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
                        <span style={{ fontSize:12 }}>{ex.badge.split(' ')[0]}</span>
                        <span style={{ fontSize:11, fontWeight:700, color:'#E8F4FD' }}>{ex.badge.split(' ').slice(1).join(' ')}</span>
                      </div>
                      <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'1rem', lineHeight:1.3 }}>{ex.title}</h3>
                    </div>
                    <div style={{ textAlign:'center', flexShrink:0 }}>
                      <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.4rem', color:'#00E676' }}>+{ex.expectedImprovement}%</div>
                      <div style={{ fontSize:9, color:'#445566', textTransform:'uppercase', letterSpacing:'0.06em' }}>expected</div>
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <span style={{ padding:'2px 8px', borderRadius:100, fontSize:10, fontWeight:600, background:'rgba(0,198,255,0.1)', border:'1px solid rgba(0,198,255,0.2)', color:'#00C6FF' }}>{ex.dbType}</span>
                    <span style={{ padding:'2px 8px', borderRadius:100, fontSize:10, fontWeight:600, background:`${DIFF_COLORS[ex.difficulty]}15`, border:`1px solid ${DIFF_COLORS[ex.difficulty]}30`, color:DIFF_COLORS[ex.difficulty] }}>{ex.difficulty}</span>
                    <span style={{ padding:'2px 8px', borderRadius:100, fontSize:10, fontWeight:600, background:'rgba(123,47,190,0.1)', border:'1px solid rgba(123,47,190,0.2)', color:'#7B2FBE' }}>{ex.category}</span>
                  </div>

                  <p style={{ color:'#7A9CC0', fontSize:13, lineHeight:1.6, flexGrow:1 }}>{ex.desc}</p>

                  <div style={{ background:'#0A0F1E', borderRadius:8, padding:'10px 12px', fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'#7A9CC0', lineHeight:1.6, maxHeight:80, overflow:'hidden', position:'relative' }}>
                    <div style={{ whiteSpace:'pre', overflow:'hidden' }}>{ex.query.slice(0,200)}</div>
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, height:30, background:'linear-gradient(transparent,#0A0F1E)' }} />
                  </div>

                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {ex.tags.slice(0,3).map(t => (
                      <span key={t} style={{ fontSize:10, color:'#445566', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:4, padding:'2px 8px' }}>#{t}</span>
                    ))}
                  </div>

                  <button onClick={()=>tryExample(ex)} className="btn-p" style={{ width:'100%', padding:'10px', borderRadius:9, fontSize:13, fontWeight:700, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <span>Try This Example →</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
