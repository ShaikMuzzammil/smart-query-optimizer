import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SmartQuery Optimizer — Real Query Analytics',
  description: 'Upload query logs, get real BM25 search, SQL pattern detection, and performance insights.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{__html:`
          *{box-sizing:border-box;margin:0;padding:0}
          html{scroll-behavior:smooth}
          body{background:#050B18;color:#E8F4FD;font-family:'Outfit',sans-serif;overflow-x:hidden;cursor:none}
          h1,h2,h3,h4,h5,h6{font-family:'Syne',sans-serif}
          a,button,input,select,textarea,label{cursor:none}
          ::-webkit-scrollbar{width:5px}
          ::-webkit-scrollbar-track{background:#050B18}
          ::-webkit-scrollbar-thumb{background:rgba(0,198,255,0.3);border-radius:3px}
          #cursor-outer{position:fixed;width:36px;height:36px;border:2px solid rgba(0,198,255,0.7);border-radius:50%;pointer-events:none;z-index:99999;transform:translate(-50%,-50%);transition:all 0.2s ease}
          #cursor-dot{position:fixed;width:7px;height:7px;background:#00C6FF;border-radius:50%;pointer-events:none;z-index:99999;transform:translate(-50%,-50%);box-shadow:0 0 10px #00C6FF}
          body.cur-hover #cursor-outer{width:52px;height:52px;border-color:#7B2FBE;background:rgba(123,47,190,0.1)}
          body.cur-click #cursor-outer{width:26px;height:26px;border-color:#FF6B35}
          .bg-anim{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none}
          .bg-anim::before{content:'';position:absolute;width:600px;height:600px;background:radial-gradient(circle,rgba(0,198,255,0.09) 0%,transparent 70%);top:-150px;left:-100px;animation:drift1 18s ease-in-out infinite}
          .bg-anim::after{content:'';position:absolute;width:500px;height:500px;background:radial-gradient(circle,rgba(123,47,190,0.09) 0%,transparent 70%);bottom:-120px;right:-80px;animation:drift2 22s ease-in-out infinite}
          @keyframes drift1{0%,100%{transform:translate(0,0)}50%{transform:translate(70px,50px)}}
          @keyframes drift2{0%,100%{transform:translate(0,0)}50%{transform:translate(-60px,-70px)}}
          .grid-bg{background-image:linear-gradient(rgba(0,198,255,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(0,198,255,0.035) 1px,transparent 1px);background-size:55px 55px}
          .glass{background:rgba(10,22,48,0.75);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(0,198,255,0.14)}
          .card{background:linear-gradient(135deg,rgba(10,22,48,0.9),rgba(5,11,24,0.95));border:1px solid rgba(0,198,255,0.1);border-radius:14px;transition:all 0.35s ease}
          .card:hover{border-color:rgba(0,198,255,0.28);box-shadow:0 14px 50px rgba(0,0,0,0.45);transform:translateY(-2px)}
          .btn-p{background:linear-gradient(135deg,#00C6FF,#7B2FBE);color:#fff;font-family:'Syne',sans-serif;font-weight:600;border:none;position:relative;overflow:hidden;transition:all 0.3s ease;display:inline-flex;align-items:center;justify-content:center}
          .btn-p::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,#7B2FBE,#00C6FF);opacity:0;transition:opacity 0.3s}
          .btn-p:hover::before{opacity:1}
          .btn-p:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,198,255,0.4)}
          .btn-p span,.btn-p svg{position:relative;z-index:1}
          .btn-o{background:transparent;border:1px solid rgba(0,198,255,0.38);color:#00C6FF;font-family:'Syne',sans-serif;font-weight:600;transition:all 0.3s;display:inline-flex;align-items:center;justify-content:center}
          .btn-o:hover{background:rgba(0,198,255,0.09);transform:translateY(-2px)}
          .inp{background:rgba(10,22,48,0.8);border:1px solid rgba(0,198,255,0.2);color:#E8F4FD;font-family:'Outfit',sans-serif;transition:all 0.3s;outline:none}
          .inp:focus{border-color:#00C6FF;box-shadow:0 0 0 3px rgba(0,198,255,0.1)}
          .inp::placeholder{color:#7A9CC0}
          .sbar{background:rgba(10,22,48,0.9);border:2px solid rgba(0,198,255,0.2);transition:all 0.35s}
          .sbar:focus-within{border-color:#00C6FF;box-shadow:0 0 0 4px rgba(0,198,255,0.08),0 6px 28px rgba(0,0,0,0.4)}
          .shimmer{background:linear-gradient(90deg,rgba(0,198,255,0.05),rgba(0,198,255,0.14),rgba(0,198,255,0.05));background-size:200% 100%;animation:shim 1.5s linear infinite}
          @keyframes shim{0%{background-position:-200% 0}100%{background-position:200% 0}}
          .gtext{background:linear-gradient(135deg,#00C6FF,#7B2FBE 50%,#FF6B35);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
          .gtext-b{background:linear-gradient(135deg,#00C6FF,#0080FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
          .badge{display:inline-flex;align-items:center;padding:2px 9px;border-radius:100px;font-size:11px;font-weight:600;letter-spacing:0.04em}
          .bp{background:rgba(0,198,255,0.12);border:1px solid rgba(0,198,255,0.3);color:#00C6FF}
          .bs{background:rgba(0,230,118,0.12);border:1px solid rgba(0,230,118,0.3);color:#00E676}
          .bw{background:rgba(255,214,0,0.12);border:1px solid rgba(255,214,0,0.3);color:#FFD600}
          .be{background:rgba(255,23,68,0.12);border:1px solid rgba(255,23,68,0.3);color:#FF1744}
          .pbar{background:rgba(0,198,255,0.1);border-radius:100px;overflow:hidden}
          .pfill{height:100%;background:linear-gradient(90deg,#00C6FF,#7B2FBE);border-radius:100px;transition:width 0.7s ease}
          .term{background:#0A0F1E;border:1px solid rgba(0,198,255,0.18);border-radius:10px;font-family:'JetBrains Mono',monospace;font-size:12px;color:#00E676;overflow:hidden}
          .th{background:rgba(0,198,255,0.05);border-bottom:1px solid rgba(0,198,255,0.1);padding:9px 14px;display:flex;align-items:center;gap:7px}
          .td{width:10px;height:10px;border-radius:50%}
          .nav{backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);background:rgba(5,11,24,0.88);border-bottom:1px solid rgba(0,198,255,0.1)}
          .nl{position:relative;color:#7A9CC0;transition:color 0.2s;font-size:14px;font-weight:500;padding:5px 3px}
          .nl::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:2px;background:linear-gradient(90deg,#00C6FF,#7B2FBE);transition:width 0.3s;border-radius:2px}
          .nl:hover{color:#fff}
          .nl.active{color:#00C6FF}
          .nl.active::after{width:100%}
          .sl{display:flex;align-items:center;gap:9px;padding:9px 13px;border-radius:9px;color:#7A9CC0;transition:all 0.2s;font-weight:500;border-left:2px solid transparent;width:100%}
          .sl:hover{background:rgba(0,198,255,0.07);color:#00C6FF}
          .sl.active{background:rgba(0,198,255,0.12);color:#00C6FF;border-left-color:#00C6FF}
          .sdiv{width:100%;height:1px;background:linear-gradient(90deg,transparent,rgba(0,198,255,0.3),transparent)}
          .scan{position:relative;overflow:hidden}
          .scan::after{content:'';position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(0,198,255,0.5),transparent);animation:scanl 4s linear infinite;pointer-events:none}
          @keyframes scanl{0%{top:-2px}100%{top:100%}}
          @keyframes pageIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
          @keyframes fadeIn{from{opacity:0}to{opacity:1}}
          @keyframes scaleIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}
          @keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
          @keyframes dropIn{from{opacity:0;transform:translateY(-7px)}to{opacity:1;transform:translateY(0)}}
          @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
          mark{background:rgba(0,198,255,0.2);color:#00C6FF;padding:0 2px;border-radius:3px}
        `}} />
      </head>
      <body>
        <div id="cursor-outer" />
        <div id="cursor-dot" />
        <div className="bg-anim" aria-hidden="true" />
        <div className="grid-bg" style={{position:'fixed',inset:0,zIndex:0,opacity:0.45,pointerEvents:'none'}} aria-hidden="true" />
        <div style={{position:'relative',zIndex:10}}>{children}</div>
        <script dangerouslySetInnerHTML={{__html:`
          (function(){
            var outer=document.getElementById('cursor-outer'),dot=document.getElementById('cursor-dot');
            var mx=0,my=0,ox=0,oy=0;
            window.addEventListener('mousemove',function(e){
              mx=e.clientX;my=e.clientY;
              dot.style.left=mx+'px';dot.style.top=my+'px';
            });
            window.addEventListener('mouseover',function(e){
              var el=e.target;
              if(el.closest('a,button,input,select,textarea,label,.card'))
                document.body.classList.add('cur-hover');
              else document.body.classList.remove('cur-hover');
            });
            window.addEventListener('mousedown',function(){document.body.classList.add('cur-click')});
            window.addEventListener('mouseup',function(){document.body.classList.remove('cur-click')});
            function lerp(a,b,t){return a+(b-a)*t}
            function tick(){
              ox=lerp(ox,mx,0.13);oy=lerp(oy,my,0.13);
              outer.style.left=ox+'px';outer.style.top=oy+'px';
              requestAnimationFrame(tick);
            }
            tick();
          })();
        `}} />
      </body>
    </html>
  )
}
