// app/layout.tsx
import type { Metadata } from 'next';
import { AppProvider } from '../lib/AppContext';

export const metadata: Metadata = {
  title: 'SmartQuery Optimizer',
  description: 'Advanced distributed text analysis and search engine',
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

:root{
  --bg:#050b18;
  --bg2:#071020;
  --bg3:#0c1628;
  --card:rgba(7,16,32,0.92);
  --card2:rgba(12,22,40,0.95);
  --accent:#00ff9d;
  --accent2:#00c8ff;
  --accent3:#a78bfa;
  --accent4:#f59e0b;
  --text:#d8e8ff;
  --text2:#7a9fc0;
  --text3:#3a5070;
  --border:rgba(0,255,157,0.1);
  --border2:rgba(0,200,255,0.1);
  --danger:#ff4455;
  --warning:#ffd700;
  --success:#00ff9d;
  --r:8px;
  --r2:12px;
  --r3:16px;
  --sh:0 4px 24px rgba(0,0,0,0.5);
  --sh2:0 8px 40px rgba(0,0,0,0.6);
  --glow:0 0 20px rgba(0,255,157,0.25);
  --glow2:0 0 20px rgba(0,200,255,0.25);
  --tr:all 0.2s ease;
  font-family:'Inter','Segoe UI',sans-serif;
}

html,body{
  background:var(--bg);
  color:var(--text);
  min-height:100vh;
  overflow-x:hidden;
}

body::before{
  content:'';
  position:fixed;
  inset:0;
  background-image:
    linear-gradient(rgba(0,255,157,0.025) 1px,transparent 1px),
    linear-gradient(90deg,rgba(0,255,157,0.025) 1px,transparent 1px);
  background-size:60px 60px;
  pointer-events:none;
  z-index:0;
}

body::after{
  content:'';
  position:fixed;
  inset:0;
  background:radial-gradient(ellipse 80% 60% at 50% -10%,rgba(0,200,255,0.06) 0%,transparent 70%),
             radial-gradient(ellipse 60% 40% at 80% 110%,rgba(0,255,157,0.05) 0%,transparent 70%);
  pointer-events:none;
  z-index:0;
}

::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-track{background:var(--bg);}
::-webkit-scrollbar-thumb{background:var(--text3);border-radius:3px;}
::-webkit-scrollbar-thumb:hover{background:var(--accent);}
::selection{background:rgba(0,255,157,0.25);color:var(--text);}

a{color:var(--accent2);text-decoration:none;}
a:hover{text-decoration:underline;}

button{cursor:pointer;border:none;outline:none;font-family:inherit;}
input,textarea,select{font-family:inherit;outline:none;}

/* Fonts */
.font-mono{font-family:'JetBrains Mono',monospace;}
.font-display{font-family:'Syne',sans-serif;}

/* Animations */
@keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}
@keyframes glow{0%,100%{box-shadow:0 0 10px rgba(0,255,157,0.2);}50%{box-shadow:0 0 25px rgba(0,255,157,0.5);}}
@keyframes slideRight{from{transform:translateX(-20px);opacity:0;}to{transform:translateX(0);opacity:1;}}
@keyframes slideLeft{from{transform:translateX(20px);opacity:0;}to{transform:translateX(0);opacity:1;}}
@keyframes toastIn{from{transform:translateX(110%);opacity:0;}to{transform:translateX(0);opacity:1;}}
@keyframes toastOut{from{opacity:1;transform:translateX(0);}to{opacity:0;transform:translateX(110%);}}
@keyframes progressAnim{from{width:0%;}to{width:100%;}}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
@keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
@keyframes glitch{0%,100%{clip-path:inset(0 0 100% 0);}20%{clip-path:inset(20% 0 60% 0);}40%{clip-path:inset(50% 0 30% 0);}60%{clip-path:inset(70% 0 10% 0);}80%{clip-path:inset(90% 0 0 0);}}
@keyframes scanline{0%{transform:translateY(-100%);}100%{transform:translateY(100vh);}}
@keyframes countUp{from{opacity:0;transform:scale(0.85);}to{opacity:1;transform:scale(1);}}

.animate-fadeUp{animation:fadeUp 0.4s ease forwards;}
.animate-fadeIn{animation:fadeIn 0.3s ease forwards;}
.animate-spin{animation:spin 1s linear infinite;}
.animate-pulse{animation:pulse 2s ease-in-out infinite;}
.animate-glow{animation:glow 2s ease-in-out infinite;}
.animate-float{animation:float 3s ease-in-out infinite;}
.animate-blink{animation:blink 1s step-end infinite;}
.animate-countUp{animation:countUp 0.5s ease forwards;}

/* Layout */
#app-root{position:relative;z-index:1;display:flex;min-height:100vh;}

/* Sidebar */
.sidebar{
  width:240px;
  min-height:100vh;
  background:var(--card);
  border-right:1px solid var(--border);
  display:flex;
  flex-direction:column;
  position:fixed;
  left:0;top:0;bottom:0;
  z-index:100;
  backdrop-filter:blur(20px);
  transition:var(--tr);
}

.sidebar-logo{
  padding:20px 20px 16px;
  border-bottom:1px solid var(--border);
  display:flex;
  align-items:center;
  gap:10px;
}

.logo-icon{
  width:34px;height:34px;
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  border-radius:8px;
  display:flex;align-items:center;justify-content:center;
  font-size:16px;font-weight:700;
  color:#050b18;
  font-family:'Syne',sans-serif;
  flex-shrink:0;
  box-shadow:0 0 12px rgba(0,255,157,0.3);
}

.logo-text{
  font-family:'Syne',sans-serif;
  font-weight:700;
  font-size:16px;
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
  letter-spacing:0.02em;
}

.sidebar-nav{flex:1;padding:12px 10px;overflow-y:auto;}

.nav-section-label{
  font-size:10px;
  font-weight:600;
  color:var(--text3);
  letter-spacing:0.12em;
  text-transform:uppercase;
  padding:8px 10px 4px;
  font-family:'JetBrains Mono',monospace;
}

.nav-item{
  display:flex;
  align-items:center;
  gap:10px;
  padding:9px 12px;
  border-radius:var(--r);
  cursor:pointer;
  transition:var(--tr);
  margin-bottom:2px;
  color:var(--text2);
  font-size:13.5px;
  font-weight:500;
  position:relative;
  border:1px solid transparent;
}

.nav-item:hover{
  background:rgba(0,255,157,0.06);
  color:var(--text);
  border-color:var(--border);
}

.nav-item.active{
  background:rgba(0,255,157,0.1);
  color:var(--accent);
  border-color:rgba(0,255,157,0.2);
}

.nav-item.active::before{
  content:'';
  position:absolute;
  left:0;top:25%;bottom:25%;
  width:2px;
  background:var(--accent);
  border-radius:0 2px 2px 0;
  box-shadow:0 0 8px var(--accent);
}

.nav-icon{font-size:15px;width:18px;text-align:center;flex-shrink:0;}
.nav-badge{
  margin-left:auto;
  background:rgba(0,255,157,0.15);
  color:var(--accent);
  font-size:10px;
  font-weight:600;
  padding:1px 6px;
  border-radius:10px;
  font-family:'JetBrains Mono',monospace;
}

.sidebar-files{
  padding:12px 10px;
  border-top:1px solid var(--border);
  max-height:200px;
  overflow-y:auto;
}

.sidebar-files-title{
  font-size:10px;
  font-weight:600;
  color:var(--text3);
  letter-spacing:0.1em;
  text-transform:uppercase;
  padding:0 2px 8px;
  font-family:'JetBrains Mono',monospace;
  display:flex;align-items:center;gap:6px;
}

.session-file-item{
  display:flex;align-items:center;gap:8px;
  padding:5px 6px;
  border-radius:6px;
  margin-bottom:2px;
  transition:var(--tr);
}

.session-file-item:hover{background:rgba(255,255,255,0.04);}
.session-file-dot{width:5px;height:5px;border-radius:50%;background:var(--accent);flex-shrink:0;}
.session-file-name{flex:1;font-size:11px;color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.session-file-count{font-size:10px;color:var(--accent);font-family:'JetBrains Mono',monospace;}

.sidebar-bottom{
  padding:12px 10px;
  border-top:1px solid var(--border);
}

.btn-signout{
  width:100%;
  padding:8px 12px;
  background:rgba(255,68,85,0.1);
  color:var(--danger);
  border:1px solid rgba(255,68,85,0.2);
  border-radius:var(--r);
  font-size:12.5px;
  font-weight:600;
  transition:var(--tr);
  display:flex;align-items:center;gap:8px;justify-content:center;
  font-family:'Inter',sans-serif;
}

.btn-signout:hover{
  background:rgba(255,68,85,0.2);
  border-color:rgba(255,68,85,0.4);
  box-shadow:0 0 12px rgba(255,68,85,0.2);
}

/* Main Content */
.main-content{
  margin-left:240px;
  flex:1;
  min-height:100vh;
  display:flex;
  flex-direction:column;
  position:relative;
}

.topbar{
  height:56px;
  border-bottom:1px solid var(--border);
  display:flex;align-items:center;
  padding:0 28px;
  position:sticky;top:0;
  background:rgba(5,11,24,0.9);
  backdrop-filter:blur(20px);
  z-index:50;
  gap:16px;
}

.topbar-title{
  font-family:'Syne',sans-serif;
  font-weight:700;
  font-size:16px;
  color:var(--text);
  flex:1;
}

.topbar-status{
  display:flex;align-items:center;gap:6px;
  font-size:11.5px;
  color:var(--text2);
  font-family:'JetBrains Mono',monospace;
}

.status-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 6px var(--accent);}
.status-dot.loading{background:var(--accent4);box-shadow:0 0 6px var(--accent4);animation:pulse 1s ease-in-out infinite;}

.section-content{
  flex:1;
  padding:28px;
  overflow-y:auto;
  animation:fadeIn 0.3s ease;
}

/* Cards */
.card{
  background:var(--card);
  border:1px solid var(--border);
  border-radius:var(--r2);
  backdrop-filter:blur(16px);
  transition:var(--tr);
}

.card:hover{border-color:rgba(0,255,157,0.2);}

.card-hover:hover{
  box-shadow:var(--glow);
  transform:translateY(-1px);
}

/* Metric Cards */
.metric-card{
  background:var(--card);
  border:1px solid var(--border);
  border-radius:var(--r2);
  padding:20px;
  position:relative;
  overflow:hidden;
  transition:var(--tr);
  cursor:default;
}

.metric-card::before{
  content:'';
  position:absolute;
  top:0;left:0;right:0;
  height:2px;
  background:linear-gradient(90deg,var(--accent),var(--accent2));
  opacity:0.6;
  border-radius:var(--r2) var(--r2) 0 0;
}

.metric-card:hover{
  border-color:rgba(0,255,157,0.25);
  box-shadow:var(--glow);
  transform:translateY(-2px);
}

.metric-label{
  font-size:11px;
  font-weight:600;
  color:var(--text2);
  letter-spacing:0.1em;
  text-transform:uppercase;
  font-family:'JetBrains Mono',monospace;
  margin-bottom:10px;
  display:flex;align-items:center;gap:6px;
}

.metric-value{
  font-size:34px;
  font-weight:700;
  font-family:'Syne',sans-serif;
  line-height:1;
  margin-bottom:6px;
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
  animation:countUp 0.5s ease forwards;
}

.metric-sub{font-size:11.5px;color:var(--text2);}
.metric-icon{position:absolute;right:16px;top:16px;font-size:24px;opacity:0.15;}

/* Buttons */
.btn{
  display:inline-flex;align-items:center;gap:8px;
  padding:8px 16px;
  border-radius:var(--r);
  font-size:13px;font-weight:600;
  transition:var(--tr);
  cursor:pointer;
  font-family:'Inter',sans-serif;
  white-space:nowrap;
}

.btn-primary{
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  color:#050b18;
  border:none;
}

.btn-primary:hover{
  box-shadow:0 4px 16px rgba(0,255,157,0.4);
  transform:translateY(-1px);
}

.btn-secondary{
  background:rgba(0,255,157,0.08);
  color:var(--accent);
  border:1px solid rgba(0,255,157,0.2);
}

.btn-secondary:hover{
  background:rgba(0,255,157,0.15);
  border-color:rgba(0,255,157,0.35);
  box-shadow:0 0 12px rgba(0,255,157,0.15);
}

.btn-ghost{
  background:transparent;
  color:var(--text2);
  border:1px solid var(--border);
}

.btn-ghost:hover{background:rgba(255,255,255,0.05);color:var(--text);border-color:rgba(255,255,255,0.15);}

.btn-danger{
  background:rgba(255,68,85,0.1);
  color:var(--danger);
  border:1px solid rgba(255,68,85,0.2);
}

.btn-danger:hover{background:rgba(255,68,85,0.2);border-color:rgba(255,68,85,0.4);}

.btn-sm{padding:5px 10px;font-size:12px;}
.btn-lg{padding:12px 24px;font-size:14px;}
.btn:disabled{opacity:0.45;cursor:not-allowed;transform:none !important;box-shadow:none !important;}

/* Inputs */
.input{
  width:100%;
  padding:9px 14px;
  background:rgba(255,255,255,0.04);
  border:1px solid var(--border);
  border-radius:var(--r);
  color:var(--text);
  font-size:13.5px;
  transition:var(--tr);
}

.input:focus{
  border-color:rgba(0,255,157,0.4);
  background:rgba(0,255,157,0.04);
  box-shadow:0 0 0 3px rgba(0,255,157,0.08);
}

.input::placeholder{color:var(--text3);}

textarea.input{resize:vertical;min-height:80px;}

select.input{cursor:pointer;}

/* Labels */
.label{
  display:block;
  font-size:12px;
  font-weight:600;
  color:var(--text2);
  margin-bottom:6px;
  letter-spacing:0.04em;
  font-family:'JetBrains Mono',monospace;
}

/* Badges */
.badge{
  display:inline-flex;align-items:center;gap:4px;
  padding:2px 8px;
  border-radius:20px;
  font-size:11px;font-weight:600;
  font-family:'JetBrains Mono',monospace;
}

.badge-success{background:rgba(0,255,157,0.12);color:var(--accent);border:1px solid rgba(0,255,157,0.2);}
.badge-danger{background:rgba(255,68,85,0.12);color:var(--danger);border:1px solid rgba(255,68,85,0.2);}
.badge-warning{background:rgba(255,215,0,0.12);color:var(--warning);border:1px solid rgba(255,215,0,0.2);}
.badge-info{background:rgba(0,200,255,0.12);color:var(--accent2);border:1px solid rgba(0,200,255,0.2);}
.badge-purple{background:rgba(167,139,250,0.12);color:var(--accent3);border:1px solid rgba(167,139,250,0.2);}
.badge-neutral{background:rgba(255,255,255,0.06);color:var(--text2);border:1px solid var(--border);}

/* Section Headers */
.section-header{
  margin-bottom:24px;
  display:flex;align-items:flex-start;justify-content:space-between;
  gap:16px;
  flex-wrap:wrap;
}

.section-title{
  font-family:'Syne',sans-serif;
  font-weight:700;
  font-size:22px;
  color:var(--text);
  display:flex;align-items:center;gap:10px;
}

.section-subtitle{
  font-size:13px;
  color:var(--text2);
  margin-top:4px;
  font-weight:400;
}

.section-icon{
  width:36px;height:36px;
  border-radius:9px;
  display:flex;align-items:center;justify-content:center;
  font-size:17px;
  background:rgba(0,255,157,0.1);
  border:1px solid rgba(0,255,157,0.2);
  flex-shrink:0;
}

/* Grid layouts */
.grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
.grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
.grid-6{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;}

@media(max-width:1200px){.grid-6{grid-template-columns:repeat(4,1fr);}.grid-4{grid-template-columns:repeat(3,1fr);}}
@media(max-width:900px){.grid-3,.grid-4,.grid-6{grid-template-columns:repeat(2,1fr);}}
@media(max-width:600px){
  .grid-2,.grid-3,.grid-4,.grid-6{grid-template-columns:1fr;}
  .sidebar{width:200px;}
  .main-content{margin-left:200px;}
  .section-content{padding:16px;}
}

/* Tables */
.table-wrap{overflow-x:auto;border-radius:var(--r2);border:1px solid var(--border);}

table{width:100%;border-collapse:collapse;}

thead tr{background:rgba(0,255,157,0.05);border-bottom:1px solid var(--border);}

th{
  padding:10px 14px;
  text-align:left;
  font-size:11px;
  font-weight:600;
  color:var(--text2);
  letter-spacing:0.08em;
  text-transform:uppercase;
  font-family:'JetBrains Mono',monospace;
  cursor:pointer;
  white-space:nowrap;
  user-select:none;
}

th:hover{color:var(--accent);}

td{
  padding:11px 14px;
  font-size:13px;
  color:var(--text);
  border-bottom:1px solid rgba(255,255,255,0.04);
  vertical-align:middle;
}

tr:last-child td{border-bottom:none;}
tr:hover td{background:rgba(255,255,255,0.02);}

/* Progress bars */
.progress-wrap{
  width:100%;
  height:4px;
  background:rgba(255,255,255,0.08);
  border-radius:2px;
  overflow:hidden;
}

.progress-bar{
  height:100%;
  border-radius:2px;
  background:linear-gradient(90deg,var(--accent),var(--accent2));
  transition:width 0.5s ease;
}

/* Notifications */
.notifications-wrap{
  position:fixed;
  bottom:20px;right:20px;
  z-index:1000;
  display:flex;flex-direction:column;
  gap:8px;
  pointer-events:none;
}

.notification{
  pointer-events:all;
  padding:12px 16px;
  border-radius:var(--r);
  backdrop-filter:blur(20px);
  display:flex;align-items:flex-start;gap:10px;
  max-width:320px;
  animation:toastIn 0.3s ease forwards;
  box-shadow:var(--sh2);
  cursor:pointer;
  border-left:3px solid transparent;
}

.notif-success{background:rgba(7,16,32,0.96);border-left-color:var(--accent);border:1px solid rgba(0,255,157,0.2);border-left:3px solid var(--accent);}
.notif-error{background:rgba(7,16,32,0.96);border:1px solid rgba(255,68,85,0.2);border-left:3px solid var(--danger);}
.notif-warning{background:rgba(7,16,32,0.96);border:1px solid rgba(255,215,0,0.2);border-left:3px solid var(--warning);}
.notif-info{background:rgba(7,16,32,0.96);border:1px solid rgba(0,200,255,0.2);border-left:3px solid var(--accent2);}

.notif-icon{font-size:16px;margin-top:1px;flex-shrink:0;}
.notif-title{font-size:13px;font-weight:600;color:var(--text);}
.notif-msg{font-size:12px;color:var(--text2);margin-top:2px;}

/* Modal */
.modal-overlay{
  position:fixed;inset:0;
  background:rgba(0,0,0,0.7);
  backdrop-filter:blur(4px);
  z-index:500;
  display:flex;align-items:center;justify-content:center;
  padding:20px;
  animation:fadeIn 0.2s ease;
}

.modal{
  background:var(--bg2);
  border:1px solid var(--border);
  border-radius:var(--r3);
  max-width:800px;
  width:100%;
  max-height:88vh;
  overflow:hidden;
  display:flex;flex-direction:column;
  box-shadow:0 24px 80px rgba(0,0,0,0.7);
  animation:fadeUp 0.3s ease;
}

.modal-header{
  padding:20px 24px 16px;
  border-bottom:1px solid var(--border);
  display:flex;align-items:center;
  justify-content:space-between;
  flex-shrink:0;
}

.modal-title{
  font-family:'Syne',sans-serif;
  font-weight:700;
  font-size:17px;
  color:var(--text);
}

.modal-close{
  width:30px;height:30px;
  border-radius:6px;
  background:rgba(255,255,255,0.06);
  border:1px solid var(--border);
  color:var(--text2);
  font-size:16px;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;
  transition:var(--tr);
}

.modal-close:hover{background:rgba(255,68,85,0.15);color:var(--danger);border-color:rgba(255,68,85,0.2);}

.modal-tabs{
  display:flex;
  border-bottom:1px solid var(--border);
  padding:0 24px;
  flex-shrink:0;
  gap:0;
}

.modal-tab{
  padding:10px 16px;
  font-size:13px;font-weight:500;
  color:var(--text2);
  cursor:pointer;
  border-bottom:2px solid transparent;
  transition:var(--tr);
  white-space:nowrap;
}

.modal-tab:hover{color:var(--text);}
.modal-tab.active{color:var(--accent);border-bottom-color:var(--accent);}

.modal-body{
  padding:20px 24px;
  overflow-y:auto;
  flex:1;
}

/* Tags */
.tag{
  display:inline-flex;align-items:center;
  padding:3px 10px;
  border-radius:20px;
  font-size:11px;font-weight:500;
  background:rgba(255,255,255,0.06);
  border:1px solid var(--border);
  color:var(--text2);
  gap:4px;
}

/* Tooltip */
.tooltip-wrap{position:relative;display:inline-flex;}
.tooltip{
  position:absolute;
  bottom:calc(100% + 6px);
  left:50%;
  transform:translateX(-50%);
  background:rgba(10,17,32,0.98);
  color:var(--text);
  font-size:11.5px;
  padding:5px 10px;
  border-radius:6px;
  border:1px solid var(--border);
  white-space:nowrap;
  pointer-events:none;
  opacity:0;
  transition:opacity 0.15s ease;
  z-index:200;
}

.tooltip-wrap:hover .tooltip{opacity:1;}

/* Code blocks */
.code{
  font-family:'JetBrains Mono',monospace;
  font-size:12px;
  background:rgba(0,0,0,0.4);
  border:1px solid var(--border);
  border-radius:6px;
  padding:12px 14px;
  color:var(--accent2);
  overflow-x:auto;
  white-space:pre-wrap;
  word-break:break-all;
}

/* Highlight */
mark{
  background:rgba(0,255,157,0.25);
  color:var(--accent);
  border-radius:3px;
  padding:0 2px;
}

/* Divider */
.divider{
  height:1px;
  background:var(--border);
  margin:20px 0;
}

/* Loading spinner */
.spinner{
  width:20px;height:20px;
  border:2px solid rgba(0,255,157,0.2);
  border-top-color:var(--accent);
  border-radius:50%;
  animation:spin 0.7s linear infinite;
  flex-shrink:0;
}

.spinner-lg{width:36px;height:36px;border-width:3px;}

/* Empty state */
.empty-state{
  text-align:center;
  padding:60px 20px;
  color:var(--text2);
}

.empty-icon{font-size:48px;margin-bottom:16px;opacity:0.4;}
.empty-title{font-family:'Syne',sans-serif;font-size:18px;font-weight:600;color:var(--text2);margin-bottom:8px;}
.empty-desc{font-size:13px;max-width:320px;margin:0 auto 20px;line-height:1.6;}

/* Chart Container */
.chart-container{position:relative;width:100%;height:100%;}
canvas{display:block;}

/* Checkbox */
.checkbox-wrap{display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none;}

.checkbox{
  width:16px;height:16px;
  border:1px solid var(--border);
  border-radius:4px;
  background:rgba(255,255,255,0.04);
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;
  transition:var(--tr);
}

.checkbox.checked{
  background:rgba(0,255,157,0.15);
  border-color:rgba(0,255,157,0.4);
}

.checkbox-label{font-size:12.5px;color:var(--text2);}
.checkbox-wrap:hover .checkbox-label{color:var(--text);}

/* Toggle */
.toggle-wrap{display:flex;align-items:center;justify-content:space-between;gap:16px;}

.toggle{
  width:40px;height:22px;
  border-radius:11px;
  background:rgba(255,255,255,0.08);
  border:1px solid var(--border);
  position:relative;
  cursor:pointer;
  transition:var(--tr);
  flex-shrink:0;
}

.toggle.on{background:rgba(0,255,157,0.2);border-color:rgba(0,255,157,0.4);}

.toggle-thumb{
  position:absolute;
  width:16px;height:16px;
  border-radius:50%;
  background:var(--text3);
  top:2px;left:2px;
  transition:var(--tr);
}

.toggle.on .toggle-thumb{background:var(--accent);left:20px;box-shadow:0 0 8px rgba(0,255,157,0.5);}

/* Utility */
.flex{display:flex;}.flex-col{flex-direction:column;}.items-center{align-items:center;}.justify-between{justify-content:space-between;}.justify-center{justify-content:center;}.gap-1{gap:4px;}.gap-2{gap:8px;}.gap-3{gap:12px;}.gap-4{gap:16px;}.gap-6{gap:24px;}.flex-1{flex:1;}.flex-wrap{flex-wrap:wrap;}.w-full{width:100%;}.text-center{text-align:center;}.relative{position:relative;}.overflow-hidden{overflow:hidden;}.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mt-1{margin-top:4px;}.mt-2{margin-top:8px;}.mt-3{margin-top:12px;}.mt-4{margin-top:16px;}.mt-6{margin-top:24px;}.mt-8{margin-top:32px;}.mb-1{margin-bottom:4px;}.mb-2{margin-bottom:8px;}.mb-3{margin-bottom:12px;}.mb-4{margin-bottom:16px;}.mb-6{margin-bottom:24px;}.mb-8{margin-bottom:32px;}.ml-auto{margin-left:auto;}.mr-auto{margin-right:auto;}.mx-auto{margin:0 auto;}
.p-3{padding:12px;}.p-4{padding:16px;}.p-5{padding:20px;}.p-6{padding:24px;}.px-3{padding-left:12px;padding-right:12px;}.py-2{padding-top:8px;padding-bottom:8px;}.py-3{padding-top:12px;padding-bottom:12px;}
.text-xs{font-size:11px;}.text-sm{font-size:13px;}.text-base{font-size:15px;}.text-lg{font-size:17px;}.text-xl{font-size:20px;}.text-2xl{font-size:24px;}.text-3xl{font-size:30px;}.text-4xl{font-size:36px;}.font-medium{font-weight:500;}.font-semibold{font-weight:600;}.font-bold{font-weight:700;}.font-extrabold{font-weight:800;}
.text-accent{color:var(--accent);}.text-accent2{color:var(--accent2);}.text-accent3{color:var(--accent3);}.text-danger{color:var(--danger);}.text-warning{color:var(--warning);}.text-muted{color:var(--text2);}.text-dim{color:var(--text3);}
.rounded{border-radius:var(--r);}.rounded-lg{border-radius:var(--r2);}.rounded-xl{border-radius:var(--r3);}.rounded-full{border-radius:9999px;}
.border{border:1px solid var(--border);}.bg-card{background:var(--card);}.shadow{box-shadow:var(--sh);}.shadow-lg{box-shadow:var(--sh2);}
.opacity-50{opacity:0.5;}.opacity-70{opacity:0.7;}.cursor-pointer{cursor:pointer;}.select-none{user-select:none;}

/* Drag and drop */
.drop-zone{
  border:2px dashed rgba(0,255,157,0.2);
  border-radius:var(--r3);
  padding:48px 32px;
  text-align:center;
  transition:var(--tr);
  cursor:pointer;
  background:rgba(0,255,157,0.02);
  position:relative;
}

.drop-zone:hover,.drop-zone.drag-over{
  border-color:rgba(0,255,157,0.5);
  background:rgba(0,255,157,0.05);
  box-shadow:0 0 30px rgba(0,255,157,0.1);
}

.drop-zone input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer;}

/* Word frequency bar */
.word-bar-wrap{display:flex;align-items:center;gap:10px;margin-bottom:6px;}
.word-bar-label{width:100px;font-size:12px;color:var(--text2);font-family:'JetBrains Mono',monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right;}
.word-bar-track{flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;}
.word-bar-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--accent),var(--accent2));transition:width 0.6s ease;}
.word-bar-count{width:50px;font-size:11px;color:var(--accent);font-family:'JetBrains Mono',monospace;text-align:right;}

/* Score ring */
.score-ring{
  position:relative;
  display:inline-flex;align-items:center;justify-content:center;
}

/* Stat row */
.stat-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:8px 0;
  border-bottom:1px solid rgba(255,255,255,0.04);
  font-size:13px;
}

.stat-row:last-child{border-bottom:none;}
.stat-key{color:var(--text2);font-family:'JetBrains Mono',monospace;font-size:12px;}
.stat-val{color:var(--text);font-weight:600;}

/* Issue severity colors */
.sev-critical{color:#ff2244;}
.sev-high{color:var(--danger);}
.sev-medium{color:var(--warning);}
.sev-low{color:var(--accent2);}
.bg-sev-critical{background:rgba(255,34,68,0.12);border-color:rgba(255,34,68,0.25);}
.bg-sev-high{background:rgba(255,68,85,0.1);border-color:rgba(255,68,85,0.2);}
.bg-sev-medium{background:rgba(255,215,0,0.08);border-color:rgba(255,215,0,0.2);}
.bg-sev-low{background:rgba(0,200,255,0.06);border-color:rgba(0,200,255,0.15);}

/* Snippet highlight */
.snippet{
  font-size:12px;
  color:var(--text2);
  font-family:'JetBrains Mono',monospace;
  line-height:1.5;
  padding:6px 10px;
  background:rgba(0,0,0,0.3);
  border-radius:6px;
  border:1px solid var(--border);
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}

/* Search result item */
.search-result{
  background:var(--card);
  border:1px solid var(--border);
  border-radius:var(--r2);
  padding:16px;
  margin-bottom:10px;
  transition:var(--tr);
  cursor:pointer;
  animation:fadeUp 0.3s ease backwards;
}

.search-result:hover{
  border-color:rgba(0,255,157,0.2);
  box-shadow:0 2px 16px rgba(0,255,157,0.08);
}

/* Panel */
.panel{
  background:var(--card2);
  border:1px solid var(--border);
  border-radius:var(--r2);
  overflow:hidden;
}

.panel-header{
  padding:12px 16px;
  border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;
  background:rgba(0,255,157,0.03);
}

.panel-title{
  font-size:12px;
  font-weight:600;
  color:var(--text2);
  letter-spacing:0.08em;
  text-transform:uppercase;
  font-family:'JetBrains Mono',monospace;
  display:flex;align-items:center;gap:6px;
}

.panel-body{padding:14px 16px;}

/* Filter pills */
.filter-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(180px,1fr));
  gap:6px;
}

.filter-pill{
  display:flex;align-items:center;gap:8px;
  padding:7px 10px;
  border:1px solid var(--border);
  border-radius:6px;
  cursor:pointer;
  transition:var(--tr);
  font-size:12px;
  color:var(--text2);
  background:rgba(255,255,255,0.02);
  user-select:none;
}

.filter-pill:hover{border-color:rgba(0,255,157,0.25);color:var(--text);background:rgba(0,255,157,0.04);}
.filter-pill.active{background:rgba(0,255,157,0.08);border-color:rgba(0,255,157,0.3);color:var(--accent);}

.filter-check{
  width:14px;height:14px;
  border:1px solid currentColor;
  border-radius:3px;
  display:flex;align-items:center;justify-content:center;
  font-size:9px;
  flex-shrink:0;
}

.filter-pill.active .filter-check::after{content:'✓';}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
      </head>
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
