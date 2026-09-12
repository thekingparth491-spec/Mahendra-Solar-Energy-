/* ═══════════════════════════════════════════════════
   app.js · Mahendra Solar Energy
   ─ Four-box wire OTP with arc animation
   ─ Particle + wave canvas
   ─ 3D solar card icons
   ─ Counter animation
   ─ Contact form → Gmail
════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────
   OTP — GENERATE & DISPLAY
───────────────────────────────────────────────── */
const CODE = String(Math.floor(1000 + Math.random() * 9000));   // 4-digit demo code
document.getElementById('demoCode').textContent = CODE;

const inputs  = Array.from(document.querySelectorAll('.otp-input'));
const wraps   = Array.from(document.querySelectorAll('.wire-wrap'));
const wins    = Array.from(document.querySelectorAll('.slot_win'));
const wireRow = document.getElementById('wireRow');
const otpErr  = document.getElementById('otpErr');
const otpOk   = document.getElementById('otpOk');

// ── INPUT EVENTS ─────────────────────────────────
inputs.forEach((inp, i) => {

  /* focus → mark wrap active, tip in 3D */
  inp.addEventListener('focus', () => {
    wraps.forEach(w => w.classList.remove('active'));
    wraps[i].classList.add('active');
  });

  inp.addEventListener('blur', () => {
    wraps[i].classList.remove('active');
  });

  /* digit entered */
  inp.addEventListener('input', () => {
    const val = inp.value.replace(/\D/g,'').slice(-1);
    inp.value = val;
    wins[i].textContent = val;
    wins[i].classList.toggle('has-val', !!val);

    if (val) {
      /* wire it */
      wraps[i].setAttribute('data-wired','');
      if (navigator.vibrate) navigator.vibrate(20);
      /* advance */
      if (i < 3) inputs[i+1].focus();
      else checkCode();
    } else {
      wraps[i].removeAttribute('data-wired');
    }
  });

  /* backspace → go back */
  inp.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && !inp.value && i > 0) {
      inputs[i-1].focus();
      inputs[i-1].value = '';
      wins[i-1].textContent = '';
      wins[i-1].classList.remove('has-val');
      wraps[i-1].removeAttribute('data-wired');
    }
  });
});

/* paste: distribute digits across boxes */
inputs[0].addEventListener('paste', e => {
  e.preventDefault();
  const pasted = (e.clipboardData || window.clipboardData)
    .getData('text').replace(/\D/g,'').slice(0,4);
  pasted.split('').forEach((d, i) => {
    if (inputs[i]) {
      inputs[i].value = d;
      wins[i].textContent = d;
      wins[i].classList.add('has-val');
      wraps[i].setAttribute('data-wired','');
    }
  });
  if (pasted.length === 4) checkCode();
  else inputs[pasted.length]?.focus();
});

/* focus first input on load */
window.addEventListener('load', () => setTimeout(() => inputs[0].focus(), 400));

/* ─────────────────────────────────────────────────
   OTP — VERIFY + ARC ANIMATION
   
   The row is a 3D stage (perspective:1000px).
   Every slot turns about the CENTRE of the row —
   not its own middle — tracing an arc, not a line.

   Arc formula:
     T  = 42° in radians
     mx = cx + (rx·cos(T) − ry·sin(T))
   where cx = row half-width, rx = each slot's
   distance from that centre, ry = depth radius.
───────────────────────────────────────────────── */
function checkCode() {
  const entered = inputs.map(inp => inp.value).join('');
  otpErr.classList.remove('show');

  if (entered === CODE) {
    circuitClose();
  } else {
    wireRow.classList.add('shake');
    otpErr.classList.add('show');
    if (navigator.vibrate) navigator.vibrate([80,40,80]);
    setTimeout(() => {
      wireRow.classList.remove('shake');
      inputs.forEach((inp, i) => {
        inp.value = '';
        wins[i].textContent = '';
        wins[i].classList.remove('has-val');
        wraps[i].removeAttribute('data-wired');
      });
      inputs[0].focus();
    }, 600);
  }
}

function circuitClose() {
  /* flash all wires */
  wireRow.classList.add('circuit-ok');
  otpOk.classList.add('show');
  if (navigator.vibrate) navigator.vibrate([40,20,60,20,40]);

  /* ── ARC ANIMATION ───────────────────────────── */
  const T  = 42 * Math.PI / 180;          // 42° in radians
  const rowW = wireRow.offsetWidth;
  const cx  = rowW / 2;                   // centre x of row (shared pivot)
  const ry  = 48;                         // depth radius (into screen)

  const slots = Array.from(document.querySelectorAll('.slot_win'));
  const anims = slots.map((slot, i) => {
    /* each slot's own centre relative to row */
    const rect  = slot.getBoundingClientRect();
    const rowR  = wireRow.getBoundingClientRect();
    const sx    = rect.left - rowR.left + rect.width / 2;   // slot centre x
    const rx    = Math.abs(sx - cx) || 40;                  // distance from row centre

    /* signed direction: left slots move left, right slots move right */
    const sign  = sx < cx ? -1 : sx > cx ? 1 : (i < 2 ? -1 : 1);

    /* arc position: orbit around row centre at angle T */
    const mx = sign * (rx * Math.cos(T) - ry * Math.sin(T));

    /*
      slot.animate([
        { transform: `translate(${mx}px) rotate(22deg)` }
      ], { duration: 520 });
      — one keyframe: FROM current TO this (Web Animations API)
    */
    return slot.animate(
      [{ transform: `translate(${mx}px, -18px) rotate(${sign * 22}deg)` }],
      {
        duration : 520,
        delay    : i * 55,
        easing   : 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        fill     : 'forwards'
      }
    );
  });

  /* after last animation finishes → enter app */
  anims[3].addEventListener('finish', () => {
    setTimeout(enterApp, 260);
  });
}

function enterApp() {
  const screen = document.getElementById('otpScreen');
  screen.classList.add('exit');

  const app = document.getElementById('mainApp');
  app.style.display = 'block';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      app.classList.add('visible');
      setTimeout(() => app.classList.add('faded-in'), 50);
    });
  });

  setTimeout(() => {
    screen.style.display = 'none';
    startCanvas();
    initSolarCards();
    initCounters();
  }, 750);
}

/* ─────────────────────────────────────────────────
   PARTICLE + WAVE CANVAS
───────────────────────────────────────────────── */
const vc  = document.getElementById('vibCanvas');
const ctx = vc.getContext('2d');
let W, H, pts = [], vib = false, vi = 0, going = false;

function rsz() { W = vc.width = window.innerWidth; H = vc.height = window.innerHeight; }
rsz();
window.addEventListener('resize', rsz);

function Pt() {
  this.reset = () => {
    this.x  = Math.random() * W;  this.y  = Math.random() * H;
    this.r  = Math.random() * 1.8 + 0.4;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.a  = Math.random() * 0.45 + 0.08;
    this.h  = Math.random() > 0.5 ? '59,130,246' : '6,182,212';
  };
  this.reset();
}
for (let i = 0; i < 120; i++) pts.push(new Pt());

let wo = 0;
function startCanvas() {
  if (going) return;
  going = true;
  tick();
}
function tick() {
  ctx.clearRect(0, 0, W, H);
  wo += 0.008 + vi * 0.04;
  for (let w = 0; w < 3; w++) {
    ctx.beginPath();
    const amp = 28 + w * 16 + vi * 38;
    const fr  = 0.004 + w * 0.002;
    const al  = 0.04  + w * 0.012 + vi * 0.06;
    ctx.strokeStyle = `rgba(59,130,246,${al})`;
    ctx.lineWidth   = 1.5;
    for (let x = 0; x <= W; x += 4) {
      const y = H * (0.28 + w * 0.18) + Math.sin(x * fr + wo + w) * amp;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  if (vib) { vi = Math.min(vi + 0.08, 1); if (vi >= 1) vib = false; }
  else        vi = Math.max(vi - 0.03, 0);
  pts.forEach(p => {
    p.x += p.vx + (Math.random() - 0.5) * vi * 2;
    p.y += p.vy + (Math.random() - 0.5) * vi * 2;
    if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) p.reset();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${p.h},${p.a})`;
    ctx.fill();
  });
  requestAnimationFrame(tick);
}

/* Device motion → shake to vibrate */
let la = {x:0,y:0,z:0}, vc2 = false;
function onMot(e) {
  const a = e.accelerationIncludingGravity; if (!a) return;
  const sh = Math.abs(a.x-la.x)+Math.abs(a.y-la.y)+Math.abs(a.z-la.z);
  la = {x:a.x,y:a.y,z:a.z};
  if (sh > 15 && !vc2) {
    vib = true; vc2 = true;
    ring(W/2, H/2);
    document.querySelectorAll('.sol-card').forEach((c,i) => setTimeout(() => {
      c.classList.add('vibrating'); setTimeout(() => c.classList.remove('vibrating'),400);
    }, i*80));
    if (navigator.vibrate) navigator.vibrate([50,30,50]);
    setTimeout(() => vc2 = false, 1200);
  }
}
if (window.DeviceMotionEvent) {
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    document.addEventListener('click', function ask() {
      DeviceMotionEvent.requestPermission().then(r => { if (r==='granted') window.addEventListener('devicemotion',onMot); }).catch(()=>{});
      document.removeEventListener('click', ask);
    }, {once:true});
  } else window.addEventListener('devicemotion', onMot);
}

/* click → ripple ring + vib */
document.addEventListener('click', e => { ring(e.clientX, e.clientY); vib = true; });
function ring(x, y) {
  const r = document.createElement('div'); r.className = 'vib-ring';
  r.style.cssText = `width:40px;height:40px;left:${x-20}px;top:${y-20}px;`;
  document.body.appendChild(r); setTimeout(() => r.remove(), 800);
}
function vibCard(c) {
  c.classList.add('vibrating'); vib = true;
  if (navigator.vibrate) navigator.vibrate(60);
  setTimeout(() => c.classList.remove('vibrating'), 400);
}

/* ─────────────────────────────────────────────────
   3-D SOLAR CARD ICONS (Canvas)
───────────────────────────────────────────────── */
function initSolarCards() {
  document.querySelectorAll('.sol-canvas').forEach(c => {
    const type = c.dataset.type;
    const dpr  = window.devicePixelRatio || 1;
    c.width  = 80 * dpr; c.height = 80 * dpr;
    c.style.width = '80px'; c.style.height = '80px';
    const cx = c.getContext('2d'); cx.scale(dpr, dpr);
    let t = 0;
    (function f() {
      cx.clearRect(0, 0, 80, 80); t += 0.03;
      if      (type === 'panel')   drPanel(cx, t);
      else if (type === 'inverter') drInv(cx, t);
      else if (type === 'battery') drBat(cx, t);
      else if (type === 'sun')     drSun(cx, t);
      else if (type === 'monitor') drMon(cx, t);
      requestAnimationFrame(f);
    })();
  });
}

function drPanel(cx,t){const b=Math.sin(t)*3;cx.save();cx.translate(40,38+b);cx.rotate(Math.sin(t*.5)*.08);cx.beginPath();cx.ellipse(0,22,28,6,0,0,Math.PI*2);cx.fillStyle='rgba(59,130,246,.15)';cx.fill();const g=cx.createLinearGradient(-26,-18,26,18);g.addColorStop(0,'#1a4fd6');g.addColorStop(.5,'#3b82f6');g.addColorStop(1,'#06b6d4');cx.fillStyle=g;cx.beginPath();cx.rect(-26,-18,52,36);cx.fill();cx.strokeStyle='rgba(191,219,254,.3)';cx.lineWidth=.8;for(let i=-1;i<=1;i++){cx.beginPath();cx.moveTo(i*17.3,-18);cx.lineTo(i*17.3,18);cx.stroke();cx.beginPath();cx.moveTo(-26,i*12);cx.lineTo(26,i*12);cx.stroke();}const sh=cx.createLinearGradient(-26,-18,10,8);sh.addColorStop(0,'rgba(255,255,255,.18)');sh.addColorStop(1,'rgba(255,255,255,0)');cx.fillStyle=sh;cx.beginPath();cx.rect(-26,-18,52,36);cx.fill();cx.fillStyle='#1e40af';cx.beginPath();cx.rect(-4,18,8,8);cx.fill();cx.restore();}
function drInv(cx,t){const b=Math.sin(t)*2;cx.save();cx.translate(40,38+b);const g=cx.createLinearGradient(-22,-22,22,22);g.addColorStop(0,'#1e3a8a');g.addColorStop(1,'#1a4fd6');cx.fillStyle=g;cx.beginPath();cx.rect(-22,-22,44,44);cx.fill();cx.strokeStyle='rgba(96,165,250,.5)';cx.lineWidth=1;cx.stroke();cx.beginPath();cx.strokeStyle='#67e8f9';cx.lineWidth=2;for(let x=-16;x<=16;x++){const y=Math.sin((x+t*20)*.35)*7;x===-16?cx.moveTo(x,y):cx.lineTo(x,y);}cx.stroke();[[-10,12],[0,12],[10,12]].forEach(([dx,dy])=>{cx.beginPath();cx.arc(dx,dy,3,0,Math.PI*2);cx.fillStyle=Math.sin(t*3+dx)>0?'#06b6d4':'#1d4ed8';cx.fill();});cx.restore();}
function drBat(cx,t){const b=Math.sin(t*.9)*2;cx.save();cx.translate(40,38+b);cx.fillStyle='#1e3a8a';cx.beginPath();cx.rect(-20,-24,40,46);cx.fill();cx.strokeStyle='rgba(59,130,246,.5)';cx.lineWidth=1;cx.stroke();cx.fillStyle='#3b82f6';cx.beginPath();cx.rect(-8,-28,16,6);cx.fill();const lv=(Math.sin(t*.5)+1)/2,fh=lv*34,fy=18-fh;const fg=cx.createLinearGradient(0,fy,0,18);fg.addColorStop(0,'#06b6d4');fg.addColorStop(1,'#1a4fd6');cx.fillStyle=fg;cx.beginPath();cx.rect(-14,fy,28,fh);cx.fill();cx.shadowBlur=12;cx.shadowColor='#06b6d4';cx.fillStyle='rgba(6,182,212,.6)';cx.beginPath();cx.rect(-14,fy,28,3);cx.fill();cx.shadowBlur=0;cx.restore();}
function drSun(cx,t){cx.save();cx.translate(40,40);cx.rotate(t*.5);for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2,inn=16,out=26+Math.sin(t*2+i)*4;cx.beginPath();cx.strokeStyle=`rgba(96,165,250,${.3+Math.sin(t+i)*.2})`;cx.lineWidth=2;cx.moveTo(Math.cos(a)*inn,Math.sin(a)*inn);cx.lineTo(Math.cos(a)*out,Math.sin(a)*out);cx.stroke();}const sg=cx.createRadialGradient(0,0,0,0,0,14);sg.addColorStop(0,'#67e8f9');sg.addColorStop(.6,'#3b82f6');sg.addColorStop(1,'#1a4fd6');cx.shadowBlur=18;cx.shadowColor='#60a5fa';cx.beginPath();cx.arc(0,0,14,0,Math.PI*2);cx.fillStyle=sg;cx.fill();cx.shadowBlur=0;cx.restore();}
function drMon(cx,t){const b=Math.sin(t)*2;cx.save();cx.translate(40,38+b);cx.fillStyle='#0f172a';cx.beginPath();cx.rect(-26,-20,52,36);cx.fill();cx.strokeStyle='rgba(59,130,246,.6)';cx.lineWidth=1.5;cx.stroke();cx.beginPath();cx.strokeStyle='#06b6d4';cx.lineWidth=1.8;for(let x=-22;x<=22;x++){const y=Math.sin((x+t*15)*.28)*8-2;x===-22?cx.moveTo(x,y):cx.lineTo(x,y);}cx.stroke();cx.beginPath();cx.arc(18,-14,3,0,Math.PI*2);cx.fillStyle=`rgba(34,197,94,${.6+Math.sin(t*4)*.4})`;cx.shadowBlur=8;cx.shadowColor='#22c55e';cx.fill();cx.shadowBlur=0;cx.fillStyle='#1e3a8a';cx.beginPath();cx.rect(-4,16,8,8);cx.fill();cx.restore();}

/* ─────────────────────────────────────────────────
   COUNTER ANIMATION
───────────────────────────────────────────────── */
function initCounters() {
  const cs = document.querySelectorAll('.stat-num[data-target]');
  const ob = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, tg = parseInt(el.dataset.target);
      const sf = tg >= 1000 ? '+' : tg === 25 ? ' yr' : '+';
      let cur = 0, inc = tg / 112;
      const tmr = setInterval(() => {
        cur = Math.min(cur + inc, tg);
        el.textContent = Math.floor(cur) + sf;
        if (cur >= tg) clearInterval(tmr);
      }, 16);
      ob.unobserve(el);
    });
  }, { threshold: 0.5 });
  cs.forEach(c => ob.observe(c));
}

/* ─────────────────────────────────────────────────
   CONTACT FORM → Gmail
───────────────────────────────────────────────── */
function sendMsg(e) {
  e.preventDefault();
  const n  = document.getElementById('fn').value;
  const em = document.getElementById('fe').value;
  const ph = document.getElementById('fp').value;
  const ms = document.getElementById('fm').value;
  const subj = `Solar Inquiry from ${n}`;
  const body = `Name: ${n}\nEmail: ${em}\nPhone: ${ph}\n\nMessage:\n${ms}`;
  const link = `https://mail.google.com/mail/?view=cm&fs=1&to=mahendrasolarenergy@gmail.com&su=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
  const st = document.getElementById('formStatus');
  st.textContent = '✓ Opening Gmail...'; st.classList.add('ok');
  if (navigator.vibrate) navigator.vibrate([40,20,40]);
  setTimeout(() => { window.open(link, '_blank'); e.target.reset(); setTimeout(() => st.classList.remove('ok'), 3000); }, 500);
}

/* ─────────────────────────────────────────────────
   SMOOTH SCROLL
───────────────────────────────────────────────── */
function goTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ─────────────────────────────────────────────────
   PWA INSTALL PROMPT
   Chrome fires beforeinstallprompt when all PWA
   criteria are met. We hold the event and show our
   own styled "Install App" button in the nav.
───────────────────────────────────────────────── */
let deferredInstallPrompt = null;
const installBtn = document.getElementById('installBtn');

/* Capture the browser's install event */
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();                  // stop mini-infobar
  deferredInstallPrompt = e;
  if (installBtn) installBtn.style.display = 'flex';
});

/* User clicked our install button */
function installApp() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();       // show Chrome install dialog
  deferredInstallPrompt.userChoice.then(result => {
    if (result.outcome === 'accepted') {
      showToast('✓ App installed! Open from your home screen.');
      if (installBtn) installBtn.style.display = 'none';
    }
    deferredInstallPrompt = null;
  });
}

/* App was installed successfully */
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  if (installBtn) installBtn.style.display = 'none';
  showToast('☀️ Mahendra Solar installed successfully!');
});

/* Toast notification helper */
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'install-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'opacity 0.4s, transform 0.4s';
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => t.remove(), 400);
  }, 3500);
}
