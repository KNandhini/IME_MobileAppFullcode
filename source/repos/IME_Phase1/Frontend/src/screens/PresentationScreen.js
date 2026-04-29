import React from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<title>IME App Overview</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --navy:#1E3A5F;--navy-deep:#0d1f33;--gold:#D4A017;
    --gold-light:rgba(212,160,23,0.15);--white:#ffffff;
    --muted:rgba(255,255,255,0.6);--subtle:rgba(255,255,255,0.08);
    --border:rgba(255,255,255,0.12);
  }
  html,body{
    width:100%;height:100%;
    font-family:'Source Sans 3',sans-serif;
    background:var(--navy-deep);
    overflow:hidden;
    -webkit-tap-highlight-color:transparent;
  }
  body::before{
    content:'';position:fixed;inset:0;
    background-image:
      radial-gradient(circle at 15% 85%,rgba(212,160,23,0.06) 0%,transparent 50%),
      radial-gradient(circle at 85% 15%,rgba(30,58,95,0.8) 0%,transparent 50%);
    pointer-events:none;z-index:0;
  }
  #app{position:relative;z-index:1;width:100%;height:100vh;display:flex;flex-direction:column;}

  /* TOPBAR */
  .topbar{
    height:52px;
    background:rgba(13,31,51,0.97);
    border-bottom:1px solid var(--border);
    display:flex;align-items:center;justify-content:space-between;
    padding:0 16px;flex-shrink:0;
  }
  .topbar-brand{display:flex;align-items:center;gap:8px;}
  .logo-box{
    background:var(--gold);color:var(--navy);
    font-weight:800;font-size:12px;
    padding:4px 8px;border-radius:4px;letter-spacing:0.5px;
  }
  .brand-label{color:var(--white);font-size:13px;font-weight:600;opacity:0.9;}
  .topbar-center{display:flex;align-items:center;gap:6px;}
  .dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,0.2);cursor:pointer;transition:all 0.25s;}
  .dot.active{background:var(--gold);transform:scale(1.3);}
  .slide-counter{color:rgba(255,255,255,0.4);font-size:11px;}

  /* SLIDES */
  .slides-wrap{flex:1;position:relative;overflow:hidden;}
  .slide{
    position:absolute;inset:0;
    display:flex;flex-direction:column;
    padding:20px 18px 16px;
    opacity:0;transform:translateX(40px);
    transition:opacity 0.4s ease,transform 0.4s ease;
    pointer-events:none;overflow-y:auto;
  }
  .slide.active{opacity:1;transform:translateX(0);pointer-events:all;}
  .slide.exit{opacity:0;transform:translateX(-40px);}

  /* TYPOGRAPHY */
  .slide-tag{
    font-size:10px;font-weight:700;letter-spacing:2px;
    color:var(--gold);text-transform:uppercase;margin-bottom:10px;
    flex-shrink:0;
  }
  .slide-title{
    font-family:'Playfair Display',serif;
    font-size:clamp(20px,5vw,30px);
    color:var(--white);line-height:1.2;margin-bottom:12px;flex-shrink:0;
  }
  .slide-sub{
    font-size:13px;color:var(--muted);line-height:1.65;
    margin-bottom:16px;flex-shrink:0;
  }
  .gold-divider{width:44px;height:3px;background:var(--gold);border-radius:2px;margin-bottom:16px;flex-shrink:0;}

  /* STATS */
  .stat-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;}
  .stat-card{
    background:var(--subtle);border:1px solid var(--border);
    border-radius:10px;padding:12px 10px;
    min-width:70px;flex:1;text-align:center;
  }
  .stat-val{font-family:'Playfair Display',serif;font-size:20px;color:var(--gold);}
  .stat-label{font-size:10px;color:var(--muted);margin-top:3px;}

  /* FEATURE GRID */
  .feat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:4px;}
  .feat-card{
    background:var(--subtle);border-left:3px solid var(--gold);
    border-radius:0 8px 8px 0;padding:12px 12px;
  }
  .feat-icon{font-size:18px;margin-bottom:5px;}
  .feat-title{font-size:13px;font-weight:700;color:var(--white);margin-bottom:3px;}
  .feat-desc{font-size:11px;color:var(--muted);line-height:1.4;}

  /* ROLES */
  .role-grid{display:grid;grid-template-columns:1fr;gap:10px;margin-top:4px;}
  .role-card{
    background:var(--subtle);border:1px solid var(--border);
    border-radius:10px;padding:14px 16px;
    display:flex;align-items:flex-start;gap:12px;
  }
  .role-icon{font-size:24px;flex-shrink:0;margin-top:2px;}
  .role-name{font-size:14px;font-weight:700;color:var(--white);margin-bottom:4px;}
  .role-desc{font-size:12px;color:var(--muted);line-height:1.5;}

  /* CHIPS */
  .chip-grid{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;}
  .chip{
    background:var(--gold-light);border:1px solid rgba(212,160,23,0.3);
    color:var(--gold);font-size:11px;padding:5px 11px;
    border-radius:18px;font-weight:600;
  }
  .tech-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;}
  .tech-badge{
    background:rgba(30,58,95,0.8);border:1px solid rgba(255,255,255,0.15);
    color:rgba(255,255,255,0.7);font-size:10px;padding:4px 10px;
    border-radius:4px;font-weight:600;
  }

  /* CENTER SLIDES */
  .slide-center{align-items:center;justify-content:center;text-align:center;}
  .slide-center .slide-title{font-size:clamp(22px,6vw,34px);}
  .slide-center .slide-sub{max-width:320px;}
  .big-icon{font-size:48px;margin-bottom:16px;}
  .tagline-row{display:flex;gap:10px;justify-content:center;margin-top:20px;flex-wrap:wrap;}
  .tagline-pill{
    background:var(--gold-light);border:1px solid rgba(212,160,23,0.3);
    color:var(--gold);font-size:13px;padding:7px 18px;border-radius:22px;font-weight:700;
  }

  /* FOOTER NAV */
  .footer{
    height:56px;flex-shrink:0;
    background:rgba(13,31,51,0.95);
    border-top:1px solid var(--border);
    display:flex;align-items:center;justify-content:space-between;
    padding:0 16px;
  }
  .btn{
    background:var(--gold);color:var(--navy);border:none;
    padding:9px 22px;border-radius:8px;font-size:13px;
    font-weight:700;cursor:pointer;
    font-family:'Source Sans 3',sans-serif;
    -webkit-appearance:none;
  }
  .btn-ghost{
    background:transparent;color:rgba(255,255,255,0.55);
    border:1px solid rgba(255,255,255,0.2);
    padding:9px 18px;border-radius:8px;font-size:13px;
    cursor:pointer;font-family:'Source Sans 3',sans-serif;
    -webkit-appearance:none;
  }
  .btn-ghost:disabled{opacity:0.25;cursor:default;}
  .swipe-hint{font-size:10px;color:rgba(255,255,255,0.25);text-align:center;}
  .progress-bar{
    position:absolute;bottom:0;left:0;height:3px;
    background:var(--gold);transition:width 0.4s ease;
  }

  /* STAGGER ANIMATIONS */
  .slide.active .slide-tag   {animation:fadeUp 0.4s 0.05s both;}
  .slide.active .slide-title {animation:fadeUp 0.4s 0.10s both;}
  .slide.active .gold-divider{animation:fadeUp 0.4s 0.14s both;}
  .slide.active .slide-sub   {animation:fadeUp 0.4s 0.18s both;}
  .slide.active .stat-row    {animation:fadeUp 0.4s 0.26s both;}
  .slide.active .feat-grid   {animation:fadeUp 0.4s 0.26s both;}
  .slide.active .role-grid   {animation:fadeUp 0.4s 0.26s both;}
  .slide.active .chip-grid   {animation:fadeUp 0.4s 0.26s both;}
  .slide.active .tech-row    {animation:fadeUp 0.4s 0.36s both;}
  .slide.active .tagline-row {animation:fadeUp 0.4s 0.30s both;}
  .slide.active .big-icon    {animation:fadeUp 0.4s 0.05s both;}

  @keyframes fadeUp{
    from{opacity:0;transform:translateY(14px);}
    to{opacity:1;transform:translateY(0);}
  }
</style>
</head>
<body>
<div id="app">

  <!-- TOPBAR -->
  <div class="topbar">
    <div class="topbar-brand">
      <div class="logo-box">IME</div>
      <span class="brand-label">Member Connect</span>
    </div>
    <div class="topbar-center" id="dots"></div>
    <span class="slide-counter" id="counter">1 / 6</span>
  </div>

  <!-- SLIDES -->
  <div class="slides-wrap">
    <div class="progress-bar" id="progress"></div>

    <!-- SLIDE 1: TITLE -->
    <div class="slide slide-center active" id="s0">
      <div class="big-icon">🏛️</div>
      <div class="slide-tag">Project Overview</div>
      <div class="slide-title">IME Member Connect App</div>
      <div class="slide-sub">A dedicated mobile platform for Indian Municipal Engineers — connecting over 2,500 professionals across 12 regional chapters nationwide.</div>
      <div class="tagline-row">
        <div class="tagline-pill">Connect</div>
        <div class="tagline-pill">Grow</div>
        <div class="tagline-pill">Achieve</div>
      </div>
    </div>

    <!-- SLIDE 2: WHO IS IME -->
    <div class="slide" id="s1">
      <div class="slide-tag">Who We Are</div>
      <div class="slide-title">Indian Municipal Engineers (IME)</div>
      <div class="gold-divider"></div>
      <div class="slide-sub">India's premier professional body of engineers working in urban local bodies — municipalities, corporations, and town panchayats. Members work on roads, water supply, drainage, sanitation, and public infrastructure serving millions of citizens every day.</div>
      <div class="stat-row">
        <div class="stat-card"><div class="stat-val">1965</div><div class="stat-label">Year Founded</div></div>
        <div class="stat-card"><div class="stat-val">2,500+</div><div class="stat-label">Members</div></div>
        <div class="stat-card"><div class="stat-val">58+</div><div class="stat-label">Years of Service</div></div>
        <div class="stat-card"><div class="stat-val">12</div><div class="stat-label">Chapters</div></div>
      </div>
    </div>

    <!-- SLIDE 3: WHAT WAS BUILT -->
    <div class="slide" id="s2">
      <div class="slide-tag">What We Built</div>
      <div class="slide-title">A Full-Featured Member App</div>
      <div class="gold-divider"></div>
      <div class="slide-sub">Built with React Native (Expo) — a digital home for every IME member to network, learn, pay dues, raise concerns, and stay informed.</div>
      <div class="feat-grid">
        <div class="feat-card"><div class="feat-icon">📰</div><div class="feat-title">News & Feed</div><div class="feat-desc">Live updates and announcements from IME leadership.</div></div>
        <div class="feat-card"><div class="feat-icon">📅</div><div class="feat-title">Activities & Events</div><div class="feat-desc">Browse and register for workshops and seminars.</div></div>
        <div class="feat-card"><div class="feat-icon">💬</div><div class="feat-title">Chat & Community</div><div class="feat-desc">Peer-to-peer messaging among members.</div></div>
        <div class="feat-card"><div class="feat-icon">💸</div><div class="feat-title">Fundraising</div><div class="feat-desc">Create and contribute to IME fund campaigns.</div></div>
        <div class="feat-card"><div class="feat-icon">🤝</div><div class="feat-title">Support Services</div><div class="feat-desc">Request technical, legal, health, and financial support.</div></div>
        <div class="feat-card"><div class="feat-icon">📄</div><div class="feat-title">GO & Circulars</div><div class="feat-desc">Access Government Orders and circulars instantly.</div></div>
      </div>
    </div>

    <!-- SLIDE 4: USER ROLES -->
    <div class="slide" id="s3">
      <div class="slide-tag">User Roles</div>
      <div class="slide-title">Who Uses the App & How</div>
      <div class="gold-divider"></div>
      <div class="slide-sub">Three distinct roles — each with tailored screens and access levels.</div>
      <div class="role-grid">
        <div class="role-card">
          <div class="role-icon">👤</div>
          <div>
            <div class="role-name">Regular Member</div>
            <div class="role-desc">Read news, join events, chat with peers, pay annual dues, raise support requests, and manage personal profile.</div>
          </div>
        </div>
        <div class="role-card">
          <div class="role-icon">🛡️</div>
          <div>
            <div class="role-name">Admin</div>
            <div class="role-desc">Manage members, post activities and circulars, set annual fees, approve registrations, oversee fundraising.</div>
          </div>
        </div>
        <div class="role-card">
          <div class="role-icon">📋</div>
          <div>
            <div class="role-name">New Registrant</div>
            <div class="role-desc">Sign up online, pay the registration fee securely, and await admin approval to become a verified full member.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- SLIDE 5: TECH & SCREENS -->
    <div class="slide" id="s4">
      <div class="slide-tag">Technology & Scale</div>
      <div class="slide-title">What's Inside</div>
      <div class="gold-divider"></div>
      <div class="slide-sub">The source code contains <strong style="color:var(--gold)">60+ screens and services</strong> — a complete React Native Expo app connected to a live REST backend API.</div>
      <div class="chip-grid">
        <div class="chip">Home / Feed</div>
        <div class="chip">Login & Signup</div>
        <div class="chip">Profile Edit</div>
        <div class="chip">News & Media</div>
        <div class="chip">Activities</div>
        <div class="chip">Chat & Messaging</div>
        <div class="chip">Support Services</div>
        <div class="chip">GO Circulars</div>
        <div class="chip">Fund Raise</div>
        <div class="chip">Club Management</div>
        <div class="chip">Achievements</div>
        <div class="chip">Payment</div>
        <div class="chip">Admin Dashboard</div>
        <div class="chip">Member Management</div>
        <div class="chip">Annual Fee Setup</div>
        <div class="chip">Municipal Map</div>
      </div>
      <div class="tech-row">
        <div class="tech-badge">React Native</div>
        <div class="tech-badge">Expo</div>
        <div class="tech-badge">ASP.NET Core</div>
        <div class="tech-badge">SQL Server</div>
        <div class="tech-badge">Push Notifications</div>
      </div>
    </div>

    <!-- SLIDE 6: VISION -->
    <div class="slide slide-center" id="s5">
      <div class="big-icon">⚙️</div>
      <div class="slide-tag">Our Vision</div>
      <div class="slide-title">Digitizing Municipal Engineering for India</div>
      <div class="slide-sub">The IME Member Connect App covers the complete lifecycle of membership — from joining and paying dues, to learning, networking, fundraising, and real-time support — all in one place.</div>
      <div class="tagline-row">
        <div class="tagline-pill">Connect</div>
        <div class="tagline-pill">Grow</div>
        <div class="tagline-pill">Achieve</div>
      </div>
    </div>

  </div>

  <!-- FOOTER -->
  <div class="footer">
    <button class="btn-ghost" id="prev-btn" onclick="go(-1)" disabled>&#8592; Back</button>
    <span class="swipe-hint">swipe or tap to navigate</span>
    <button class="btn" id="next-btn" onclick="go(1)">Next</button>
  </div>

</div>
<script>
  var cur = 0, total = 6, startX = 0;

  function mkDots() {
    var c = document.getElementById('dots');
    c.innerHTML = '';
    for (var i = 0; i < total; i++) {
      var d = document.createElement('div');
      d.className = 'dot' + (i === cur ? ' active' : '');
      (function(i){ d.onclick = function(){ goTo(i); }; })(i);
      c.appendChild(d);
    }
    document.getElementById('counter').textContent = (cur + 1) + ' / ' + total;
    document.getElementById('prev-btn').disabled = cur === 0;
    document.getElementById('next-btn').textContent = cur === total - 1 ? 'Restart' : 'Next';
    document.getElementById('progress').style.width = ((cur + 1) / total * 100) + '%';
  }

  function goTo(n) {
    var slides = document.querySelectorAll('.slide');
    slides[cur].classList.remove('active');
    slides[cur].classList.add('exit');
    setTimeout(function(){ slides[cur].classList.remove('exit'); }, 420);
    cur = ((n % total) + total) % total;
    slides[cur].classList.add('active');
    mkDots();
  }

  function go(dir) {
    if (cur === total - 1 && dir === 1) { goTo(0); return; }
    var next = cur + dir;
    if (next < 0 || next >= total) return;
    goTo(next);
  }

  // Swipe support
  document.addEventListener('touchstart', function(e){ startX = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', function(e){
    var diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 48) go(diff > 0 ? 1 : -1);
  }, { passive: true });

  document.addEventListener('keydown', function(e){
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });

  mkDots();
</script>
</body>
</html>`;

const PresentationScreen = ({ navigation }) => (
  <View style={styles.root}>
    <StatusBar barStyle="light-content" backgroundColor={NAVY} />
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
        <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>App Overview</Text>
      <View style={{ width: 40 }} />
    </View>
    <WebView
      source={{ html: HTML }}
      javaScriptEnabled
      originWhitelist={['*']}
      style={{ flex: 1, backgroundColor: '#0d1f33' }}
      showsVerticalScrollIndicator={false}
    />
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1f33' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: NAVY,
    paddingTop: (StatusBar.currentHeight ?? 0) + 4,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerTitle: {
    color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5,
  },
});

export default PresentationScreen;
