/* ============================================================
   WORK SOURCE SUPPLY — SHARED JS
   Loader (mobile-safe), nav, cursor, reveals, search, accordion
   ============================================================ */
(function(){
  'use strict';

  var isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;

  /* ============ LOADER (homepage only) ============ */
  var loader = document.getElementById('loader');
  var loaderDismissed = false;

  function dismissLoader(){
    if(loaderDismissed) return;
    loaderDismissed = true;
    if(!loader) return;
    loader.style.opacity = '0';
    setTimeout(function(){
      loader.style.display = 'none';
      loader.remove();
    }, 650);
    var canvas = document.getElementById('bg-canvas');
    if(canvas) canvas.classList.add('visible');
    runReveals();
  }

  if(loader){
    // Progress bar animation
    var progress = 0;
    var bar = document.getElementById('loaderProgress');
    var barInterval = setInterval(function(){
      progress += Math.random() * 6 + 3;
      if(progress >= 100){ progress = 100; clearInterval(barInterval); }
      if(bar) bar.style.width = progress + '%';
    }, 70);

    // GUARANTEED dismiss after 3.5 seconds — prevents stuck loader
    var safetyTimeout = setTimeout(dismissLoader, 3500);

    window.addEventListener('load', function(){
      clearInterval(barInterval);
      if(bar) bar.style.width = '100%';
      clearTimeout(safetyTimeout);
      setTimeout(dismissLoader, 500);
    });

    // Three.js loader scene (desktop only)
    if(!isMobile && typeof THREE !== 'undefined'){
      try{
        var lCanvas = document.getElementById('loader-canvas');
        if(lCanvas){
          var lScene = new THREE.Scene();
          var lCam = new THREE.PerspectiveCamera(50, innerWidth/innerHeight, .1, 100);
          lCam.position.z = 4;
          var lR = new THREE.WebGLRenderer({canvas:lCanvas, alpha:true, antialias:true});
          lR.setSize(innerWidth, innerHeight);
          lR.setPixelRatio(Math.min(devicePixelRatio, 2));
          var ico = new THREE.Mesh(
            new THREE.IcosahedronGeometry(1.2, 1),
            new THREE.MeshBasicMaterial({color:0x7b2fff, wireframe:true, transparent:true, opacity:.6})
          );
          lScene.add(ico);
          var outer = new THREE.Mesh(
            new THREE.IcosahedronGeometry(1.8, 0),
            new THREE.MeshBasicMaterial({color:0x00d4ff, wireframe:true, transparent:true, opacity:.12})
          );
          lScene.add(outer);
          (function animL(){
            if(loaderDismissed) return;
            requestAnimationFrame(animL);
            ico.rotation.x += .008; ico.rotation.y += .012;
            outer.rotation.x -= .003; outer.rotation.y += .005;
            lR.render(lScene, lCam);
          })();
          // hide CSS spinner when WebGL is running
          var spinner = document.querySelector('.loader-spinner');
          if(spinner) spinner.style.display = 'none';
        }
      } catch(e){ /* WebGL failed, CSS spinner stays visible */ }
    }
  } else {
    // Inner page — no loader, init reveals after DOM ready
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', runReveals);
    } else {
      runReveals();
    }
  }

  /* ============ THREE.JS BACKGROUND (desktop homepage only) ============ */
  var bgCanvas = document.getElementById('bg-canvas');
  if(bgCanvas && !isMobile && typeof THREE !== 'undefined'){
    try{
      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, .1, 200);
      camera.position.z = 50;
      var renderer = new THREE.WebGLRenderer({canvas:bgCanvas, alpha:true, antialias:false});
      renderer.setSize(innerWidth, innerHeight);
      renderer.setPixelRatio(1);

      var pCount = 180;
      var positions = new Float32Array(pCount*3);
      for(var i=0;i<pCount*3;i++) positions[i]=(Math.random()-.5)*100;
      var pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(positions,3));
      var particles = new THREE.Points(pGeo, new THREE.PointsMaterial({color:0x7b2fff, size:.12, transparent:true, opacity:.45}));
      scene.add(particles);

      var shapes = [];
      var geos = [new THREE.OctahedronGeometry(.5,0), new THREE.TetrahedronGeometry(.5,0), new THREE.IcosahedronGeometry(.4,0)];
      for(var j=0;j<3;j++){
        var m = new THREE.Mesh(geos[j%geos.length], new THREE.MeshBasicMaterial({color:j%2?0x7b2fff:0x00d4ff, wireframe:true, transparent:true, opacity:.15}));
        m.position.set((Math.random()-.5)*60,(Math.random()-.5)*40,(Math.random()-.5)*30);
        m.userData={rx:(Math.random()-.5)*.008,ry:(Math.random()-.5)*.008,fs:Math.random()*.3+.1,fa:Math.random()*2+1,by:m.position.y};
        scene.add(m); shapes.push(m);
      }

      var lastBg=0;
      (function animBg(now){
        requestAnimationFrame(animBg);
        if(now-lastBg<50) return; // cap at ~20fps — subtle ambient bg
        lastBg=now;
        var t=Date.now()*.001;
        particles.rotation.y+=.0006;particles.rotation.x+=.0003;
        shapes.forEach(function(s){s.rotation.x+=s.userData.rx;s.rotation.y+=s.userData.ry;s.position.y=s.userData.by+Math.sin(t*s.userData.fs)*s.userData.fa;});
        renderer.render(scene,camera);
      })(0);

      window.addEventListener('resize',function(){
        camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
        renderer.setSize(innerWidth,innerHeight);
      });
    } catch(e){ bgCanvas.style.display='none'; }
  }

  /* ============ CURSOR (desktop only) ============ */
  if(!isMobile){
    var cur = document.getElementById('cursor');
    if(cur){
      var cx=0,cy=0;
      document.addEventListener('mousemove',function(e){
        cx=e.clientX;cy=e.clientY;
        cur.style.transform='translate3d('+cx+'px,'+cy+'px,0)';
      });

      /* --- trail shapes --- */
      var trailCount = 30;
      var svgShapes = [
        '<polygon points="12,2 22,22 2,22"/>',
        '<rect x="3" y="3" width="18" height="18" transform="rotate(45 12 12)"/>',
        '<circle cx="12" cy="12" r="10"/>',
        '<polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9"/>',
        '<polygon points="12,2 22,8 22,16 12,22 2,16 2,8"/>',
        '<polygon points="12,2 20,7 20,17 12,22 4,17 4,7"/>'
      ];
      var colors = ['#00d4ff','#7b2fff','#ff006e','#00ffaa'];
      var trails = [];
      for(var ti=0;ti<trailCount;ti++){
        var size = 3 + Math.random()*7;
        var el = document.createElement('div');
        el.className = 'cursor-trail';
        el.style.width = size+'px';
        el.style.height = size+'px';
        var c = colors[ti%colors.length];
        var baseOp = 0.45 + Math.random()*0.4;
        el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="'+c+'" stroke-width="2">'+svgShapes[ti%svgShapes.length]+'</svg>';
        document.body.appendChild(el);
        var lagVal = 0.08 + Math.random()*0.10;
        var angle = Math.random()*Math.PI*2;
        var scatter = Math.random();
        trails.push({el:el, x:0, y:0, lag:lagVal, rot:Math.random()*360,
          rs:(Math.random()-.5)*1.5,
          baseOp:baseOp, angle:angle, scatter:scatter, size:size});
      }

      var curMoving = false, curTimer = 0;
      document.addEventListener('mousemove',function(){curMoving=true;clearTimeout(curTimer);curTimer=setTimeout(function(){curMoving=false;},120);});

      (function moveCur(){
        requestAnimationFrame(moveCur);
        for(var i=0;i<trails.length;i++){
          var tr=trails[i];
          tr.x+=(cx-tr.x)*tr.lag;
          tr.y+=(cy-tr.y)*tr.lag;
          tr.rot+=tr.rs;
          var dx=cx-tr.x,dy=cy-tr.y,dist=Math.sqrt(dx*dx+dy*dy);
          var cloudRadius = dist*0.15*tr.scatter;
          var ox = tr.x + Math.cos(tr.angle)*cloudRadius;
          var oy = tr.y + Math.sin(tr.angle)*cloudRadius;
          var op = curMoving ? Math.min(dist/40,1)*tr.baseOp : 0;
          tr.el.style.transform='translate3d('+ox+'px,'+oy+'px,0) rotate('+tr.rot+'deg)';
          tr.el.style.opacity=op;
        }
      })();

      var hoverSel='a,button,.industry-card,.industry-pill,.accordion-toggle,.btn,.nav-toggle,input,textarea,select,.search-result,.faq-q';
      document.addEventListener('mouseover',function(e){if(e.target.closest(hoverSel))document.body.classList.add('cursor-hover');});
      document.addEventListener('mouseout',function(e){if(e.target.closest(hoverSel))document.body.classList.remove('cursor-hover');});
    }
  }

  /* ============ NAV ============ */
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  if(nav) window.addEventListener('scroll',function(){nav.classList.toggle('scrolled',scrollY>50);},{passive:true});

  if(navToggle && navLinks){
    navToggle.addEventListener('click',function(e){
      e.stopPropagation();
      navToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('.nav-link').forEach(function(l){
      l.addEventListener('click',function(){
        navToggle.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
    /* Close menu when tapping outside */
    document.addEventListener('click',function(e){
      if(navLinks.classList.contains('open') && !navLinks.contains(e.target) && !navToggle.contains(e.target)){
        navToggle.classList.remove('open');
        navLinks.classList.remove('open');
      }
    });
  }

  // Highlight active nav link based on current page
  var page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link[href]').forEach(function(link){
    var href = link.getAttribute('href');
    if(href === page || (page === 'index.html' && (href === '/' || href === 'index.html'))){
      link.classList.add('active');
    }
  });

  /* ============ SMOOTH SCROLL (same-page anchors) ============ */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click',function(e){
      var id=a.getAttribute('href');if(id==='#')return;
      var target=document.querySelector(id);if(!target)return;
      e.preventDefault();
      var y=target.getBoundingClientRect().top+scrollY-64;
      window.scrollTo({top:y,behavior:'smooth'});
    });
  });

  /* ============ SCROLL REVEALS (GSAP) ============ */
  function runReveals(){
    if(typeof gsap==='undefined')return;
    if(typeof ScrollTrigger!=='undefined') gsap.registerPlugin(ScrollTrigger);
    document.querySelectorAll('.reveal-up').forEach(function(el){
      if(typeof ScrollTrigger!=='undefined'){
        gsap.to(el,{scrollTrigger:{trigger:el,start:'top 92%',once:true},opacity:1,y:0,duration:.65,ease:'power3.out',onStart:function(){el.classList.add('revealed');}});
      } else {
        el.classList.add('revealed');
      }
    });
  }

  /* ============ MAGNETIC BUTTONS (desktop only) ============ */
  if(!isMobile){
    document.querySelectorAll('.magnetic-btn').forEach(function(btn){
      btn.addEventListener('mousemove',function(e){
        var r=btn.getBoundingClientRect();
        var x=e.clientX-r.left-r.width/2;
        var y=e.clientY-r.top-r.height/2;
        btn.style.transform='translate('+x*.2+'px,'+y*.2+'px)';
        var inner=btn.querySelector('.btn-text');
        if(inner) inner.style.transform='translate('+x*.1+'px,'+y*.1+'px)';
      });
      btn.addEventListener('mouseleave',function(){
        btn.style.transform='';
        var inner=btn.querySelector('.btn-text');
        if(inner) inner.style.transform='';
      });
    });
  }

  /* ============ TEXT SCRAMBLE (desktop only) ============ */
  if(!isMobile){
    var scrambleChars='!@#$%^&*()_+-=[]{}|;:<>?';
    document.querySelectorAll('[data-text]').forEach(function(el){
      var original=el.getAttribute('data-text');
      var interval;
      var parent=el.closest('.btn,.nav-link--cta');
      if(!parent) return;
      parent.addEventListener('mouseenter',function(){
        var iteration=0;
        clearInterval(interval);
        interval=setInterval(function(){
          el.textContent=original.split('').map(function(c,i){return i<iteration?original[i]:scrambleChars[Math.floor(Math.random()*scrambleChars.length)];}).join('');
          iteration+=.5;
          if(iteration>=original.length){clearInterval(interval);el.textContent=original;}
        },25);
      });
      parent.addEventListener('mouseleave',function(){clearInterval(interval);el.textContent=original;});
    });
  }

  /* ============ SEARCH BAR ============ */
  var searchInput = document.getElementById('siteSearch');
  var searchResults = document.getElementById('searchResults');
  if(searchInput && searchResults){
    var searchData = [
      {text:'Contractors',icon:'<span class="ico ico-hardhat"></span>',type:'Industry',url:'industry.html?type=contractor'},
      {text:'Real Estate',icon:'<span class="ico ico-house"></span>',type:'Industry',url:'industry.html?type=realestate'},
      {text:'Inspectors',icon:'<span class="ico ico-search"></span>',type:'Industry',url:'industry.html?type=inspector'},
      {text:'Law Firms',icon:'<span class="ico ico-scales"></span>',type:'Industry',url:'industry.html?type=law'},
      {text:'Medical Offices',icon:'<span class="ico ico-medical"></span>',type:'Industry',url:'industry.html?type=medical'},
      {text:'Restaurants',icon:'<span class="ico ico-utensils"></span>',type:'Industry',url:'industry.html?type=restaurant'},
      {text:'E-commerce',icon:'<span class="ico ico-cart"></span>',type:'Industry',url:'industry.html?type=ecommerce'},
      {text:'Marketing Agencies',icon:'<span class="ico ico-chart"></span>',type:'Industry',url:'industry.html?type=agency'},
      {text:'Photographers',icon:'<span class="ico ico-camera"></span>',type:'Industry',url:'industry.html?type=photographer'},
      {text:'Event Planners',icon:'<span class="ico ico-calendar"></span>',type:'Industry',url:'industry.html?type=events'},
      {text:'Consultants',icon:'<span class="ico ico-briefcase"></span>',type:'Industry',url:'industry.html?type=consultant'},
      {text:'Coaches',icon:'<span class="ico ico-trophy"></span>',type:'Industry',url:'industry.html?type=coach'},
      {text:'Home Services',icon:'<span class="ico ico-wrench"></span>',type:'Industry',url:'industry.html?type=homeservice'},
      {text:'Insurance Agents',icon:'<span class="ico ico-document"></span>',type:'Industry',url:'industry.html?type=insurance'},
      {text:'Property Managers',icon:'<span class="ico ico-building"></span>',type:'Industry',url:'industry.html?type=property'},
      {text:'Construction',icon:'<span class="ico ico-hardhat"></span>',type:'Industry',url:'industry.html?type=construction'},
      {text:'Freelancers',icon:'<span class="ico ico-laptop"></span>',type:'Industry',url:'industry.html?type=freelancer'},
      {text:'Startups',icon:'<span class="ico ico-rocket"></span>',type:'Industry',url:'industry.html?type=startup'},
      {text:'Local Businesses',icon:'<span class="ico ico-store"></span>',type:'Industry',url:'industry.html?type=local'},
      {text:'Sales & Lead Automation',icon:'<span class="ico ico-bolt"></span>',type:'Category',url:'automations.html#sales'},
      {text:'Phone & Voice AI',icon:'<span class="ico ico-phone"></span>',type:'Category',url:'automations.html#phone'},
      {text:'Email Automation',icon:'<span class="ico ico-mail"></span>',type:'Category',url:'automations.html#email'},
      {text:'Document Automation',icon:'<span class="ico ico-document"></span>',type:'Category',url:'automations.html#docs'},
      {text:'Website Systems',icon:'<span class="ico ico-globe"></span>',type:'Category',url:'automations.html#website'},
      {text:'Custom Apps',icon:'<span class="ico ico-mobile"></span>',type:'Category',url:'automations.html#apps'},
      {text:'Dashboard Systems',icon:'<span class="ico ico-chart"></span>',type:'Category',url:'automations.html#dashboard'},
      {text:'Process Automation',icon:'<span class="ico ico-gear"></span>',type:'Category',url:'automations.html#process'},
      {text:'Marketing Automation',icon:'<span class="ico ico-megaphone"></span>',type:'Category',url:'automations.html#marketing'},
      {text:'Customer Support AI',icon:'<span class="ico ico-chat"></span>',type:'Category',url:'automations.html#support'},
      {text:'Booking Systems',icon:'<span class="ico ico-calendar"></span>',type:'Category',url:'automations.html#booking'},
      {text:'Finance Automation',icon:'<span class="ico ico-dollar"></span>',type:'Category',url:'automations.html#finance'},
      {text:'AI Data Analysis',icon:'<span class="ico ico-cpu"></span>',type:'Category',url:'automations.html#data'},
      {text:'AI Employees',icon:'<span class="ico ico-cpu"></span>',type:'Category',url:'automations.html#insane'},
      {text:'Pricing Plans',icon:'<span class="ico ico-dollar"></span>',type:'Info',url:'pricing.html'},
      {text:'Get a Website Built',icon:'<span class="ico ico-document"></span>',type:'Info',url:'get-started.html'},
      {text:'Get Started',icon:'<span class="ico ico-cart"></span>',type:'Info',url:'get-started.html'},
      {text:'Book a Call',icon:'<span class="ico ico-calendar"></span>',type:'Info',url:'schedule.html'},
      {text:'Salon & Spa',icon:'<span class="ico ico-scissors"></span>',type:'Industry',url:'industry.html?type=salon'},
      {text:'Fitness & Gyms',icon:'<span class="ico ico-dumbbell"></span>',type:'Industry',url:'industry.html?type=fitness'},
      {text:'Automotive',icon:'<span class="ico ico-car"></span>',type:'Industry',url:'industry.html?type=auto'},
      {text:'Accounting',icon:'<span class="ico ico-chart"></span>',type:'Industry',url:'industry.html?type=accounting'},
      {text:'Nonprofits',icon:'<span class="ico ico-heart"></span>',type:'Industry',url:'industry.html?type=nonprofit'},
    ];

    searchInput.addEventListener('input',function(){
      var q=searchInput.value.trim().toLowerCase();
      if(q.length<2){searchResults.classList.remove('visible');return;}
      var matches=searchData.filter(function(d){return d.text.toLowerCase().indexOf(q)!==-1;}).slice(0,8);
      if(!matches.length){searchResults.classList.remove('visible');return;}
      searchResults.innerHTML=matches.map(function(m){
        return '<a href="'+m.url+'" class="search-result"><span class="search-result-icon">'+m.icon+'</span><span>'+m.text+'</span><span class="search-result-type">'+m.type+'</span></a>';
      }).join('');
      searchResults.classList.add('visible');
    });

    searchInput.addEventListener('focus',function(){
      if(searchInput.value.trim().length>=2) searchResults.classList.add('visible');
    });

    document.addEventListener('click',function(e){
      if(!e.target.closest('.search-wrap')) searchResults.classList.remove('visible');
    });
  }

  /* ============ ACCORDION ============ */
  document.querySelectorAll('.accordion-toggle').forEach(function(toggle){
    toggle.addEventListener('click',function(){
      var panel = toggle.nextElementSibling;
      var isOpen = toggle.classList.contains('open');

      // Close all in same group
      var group = toggle.closest('.accordion-group');
      if(group){
        group.querySelectorAll('.accordion-toggle.open').forEach(function(t){
          t.classList.remove('open');
          t.nextElementSibling.style.maxHeight = '0';
        });
      }

      if(!isOpen){
        toggle.classList.add('open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });

  /* ============ FAQ TOGGLE ============ */
  document.querySelectorAll('.faq-q').forEach(function(q){
    q.addEventListener('click',function(){
      var a = q.nextElementSibling;
      var isOpen = q.classList.contains('open');
      // Close all
      document.querySelectorAll('.faq-q.open').forEach(function(oq){
        oq.classList.remove('open');
        oq.nextElementSibling.classList.remove('open');
        oq.nextElementSibling.style.maxHeight='0';
      });
      if(!isOpen){
        q.classList.add('open');
        a.classList.add('open');
        a.style.maxHeight=(a.scrollHeight+20)+'px';
      }
    });
  });

  /* ============ ROTATING TAGLINES (homepage) ============ */
  var taglineEl = document.getElementById('rotatingTagline');
  if(taglineEl && typeof gsap!=='undefined'){
    var taglines=[
      "Replace manual tasks with AI systems.",
      "Turn your business into a self-running machine.",
      "Stop paying for 10 different software tools.",
      "Custom-built. Not cookie-cutter.",
      "AI employees that work 24/7.",
      "One system. Everything automated.",
      "Built for YOUR workflow \u2014 not a template.",
    ];
    var tIdx=0;
    taglineEl.textContent=taglines[0];
    setInterval(function(){
      tIdx=(tIdx+1)%taglines.length;
      gsap.to(taglineEl,{opacity:0,y:-8,duration:.25,onComplete:function(){
        taglineEl.textContent=taglines[tIdx];
        gsap.fromTo(taglineEl,{opacity:0,y:8},{opacity:1,y:0,duration:.25});
      }});
    },3200);
  }

  /* ============ INDUSTRY PAGE DATA ============ */
  if(typeof INDUSTRY_DATA!=='undefined' && document.getElementById('industryContent')){
    var params = new URLSearchParams(location.search);
    var type = params.get('type');
    var data = INDUSTRY_DATA[type];
    var content = document.getElementById('industryContent');
    var heroTitle = document.getElementById('industryTitle');
    var heroIcon = document.getElementById('industryIcon');

    if(data){
      if(heroIcon) heroIcon.textContent = data.icon;
      if(heroTitle) heroTitle.innerHTML = data.name + ' <span class="accent-text">Automation</span>';
      var html = '<p class="section-sub" style="margin-bottom:2rem">' + data.desc + '</p>';
      html += '<div class="industry-auto-list">';
      data.automations.forEach(function(a){
        html += '<div class="industry-auto-item reveal-up"><span class="industry-auto-dot"></span>' + a + '</div>';
      });
      html += '</div>';
      content.innerHTML = html;
      runReveals();
    } else {
      content.innerHTML = '<p class="section-sub">Industry not found. <a href="industries.html" style="color:var(--accent-blue)">Browse all industries &rarr;</a></p>';
    }
  }

  /* ============ CALENDAR / SCHEDULE ============ */
  var calendarDays = document.getElementById('calendarDays');
  var calendarMonth = document.getElementById('calendarMonth');
  if(calendarDays && calendarMonth){
    var now = new Date();
    var calYear = now.getFullYear();
    var calMonth = now.getMonth();
    var selectedDate = null;
    var selectedTime = null;
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var availableTimes = [
      '8:00 AM','8:30 AM','9:00 AM','9:30 AM','10:00 AM','10:30 AM',
      '11:00 AM','11:30 AM','12:00 PM','12:30 PM','1:00 PM','1:30 PM',
      '2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM',
      '5:00 PM','5:30 PM','6:00 PM','6:30 PM','7:00 PM','7:30 PM',
      '8:00 PM','8:30 PM','9:00 PM','9:30 PM','10:00 PM'
    ];

    /* ---------- BOOKING PERSISTENCE ---------- */
    var BOOKINGS_API = 'https://script.google.com/macros/s/AKfycbzwYytmJWgUEDVQs94rvWrHfgemsDbNylTYTfgVHk24hu2kbPRYJw2LRze287uaAkWS/exec';
    var bookedSlots = {}; // { "2026-03-20": ["10:00 AM", "2:30 PM"] }

    function dateKey(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

    function fetchBookedSlots(cb){
      if(!BOOKINGS_API){ if(cb) cb(); return; }
      fetch(BOOKINGS_API)
        .then(function(r){ return r.json(); })
        .then(function(data){
          bookedSlots = {};
          data.forEach(function(b){
            if(!bookedSlots[b.date]) bookedSlots[b.date] = [];
            bookedSlots[b.date].push(b.time);
          });
          if(cb) cb();
        })
        .catch(function(){ if(cb) cb(); });
    }

    function saveBooking(dateStr, time, name, email){
      if(!BOOKINGS_API) return;
      fetch(BOOKINGS_API, {
        method:'POST',
        headers:{'Content-Type':'text/plain'},
        body:JSON.stringify({date:dateStr,time:time,name:name||'',email:email||''})
      }).catch(function(){});
    }

    /* Auto-detect user timezone */
    var tzSelect = document.getElementById('sch-tz');
    if(tzSelect){
      try{
        var userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
        var opts = tzSelect.querySelectorAll('option');
        var matched = false;
        for(var oi=0;oi<opts.length;oi++){
          if(opts[oi].value === userTZ){ tzSelect.value = userTZ; matched = true; break; }
        }
        if(!matched) tzSelect.value = 'America/New_York';
      }catch(e){}
    }

    function renderCalendar(){
      calendarMonth.textContent = months[calMonth] + ' ' + calYear;
      var first = new Date(calYear, calMonth, 1).getDay();
      var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
      var today = new Date(); today.setHours(0,0,0,0);
      var html = '';
      for(var e = 0; e < first; e++) html += '<div class="calendar-day empty"></div>';
      for(var d = 1; d <= daysInMonth; d++){
        var date = new Date(calYear, calMonth, d);
        var isPast = date < today;
        var cls = 'calendar-day';
        if(isPast) cls += ' past';
        else cls += ' available';
        if(selectedDate && date.toDateString() === selectedDate.toDateString()) cls += ' selected';
        html += '<div class="' + cls + '" data-date="' + date.toISOString() + '">' + d + '</div>';
      }
      calendarDays.innerHTML = html;
      calendarDays.querySelectorAll('.calendar-day.available').forEach(function(el){
        el.addEventListener('click', function(){
          selectedDate = new Date(el.getAttribute('data-date'));
          selectedTime = null;
          renderCalendar();
          showTimeslots();
        });
      });
    }

    function convertTimeToEST(timeStr, fromTZ){
      /* Convert a time string like "2:00 PM" on selectedDate from fromTZ to America/New_York */
      var parts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if(!parts) return timeStr;
      var h = parseInt(parts[1]); var m = parseInt(parts[2]); var ampm = parts[3].toUpperCase();
      if(ampm === 'PM' && h !== 12) h += 12;
      if(ampm === 'AM' && h === 12) h = 0;
      var dt = new Date(selectedDate);
      dt.setHours(h, m, 0, 0);
      try{
        var estStr = dt.toLocaleString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit',hour12:true});
        return estStr;
      }catch(e){ return timeStr; }
    }

    function showTimeslots(){
      var timeslots = document.getElementById('timeslots');
      var grid = document.getElementById('timeslotGrid');
      var dateText = document.getElementById('selectedDateText');
      if(!timeslots || !grid) return;
      timeslots.style.display = 'block';
      dateText.textContent = selectedDate.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'});
      var dk = dateKey(selectedDate);
      var taken = bookedSlots[dk] || [];
      grid.innerHTML = availableTimes.map(function(t){
        var isBooked = taken.indexOf(t) !== -1;
        var cls = 'timeslot' + (isBooked ? ' booked' : '') + (selectedTime === t ? ' selected' : '');
        return '<div class="' + cls + '" data-time="' + t + '">' + t + (isBooked ? ' \u2717' : '') + '</div>';
      }).join('');
      grid.querySelectorAll('.timeslot:not(.booked)').forEach(function(el){
        el.addEventListener('click', function(){
          selectedTime = el.getAttribute('data-time');
          grid.querySelectorAll('.timeslot').forEach(function(s){ s.classList.remove('selected'); });
          el.classList.add('selected');
          updateSlotDisplay();
        });
      });
    }

    function updateSlotDisplay(){
      var display = document.getElementById('selectedSlotDisplay');
      var summary = document.getElementById('slotSummary');
      if(display && summary && selectedDate && selectedTime){
        display.style.display = 'block';
        var tz = tzSelect ? tzSelect.value : 'America/New_York';
        var estTime = convertTimeToEST(selectedTime, tz);
        var dateStr = selectedDate.toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric'});
        summary.textContent = dateStr + ' at ' + selectedTime + ' (your time)';
        /* Store EST conversion as hidden data for form submit */
        summary.setAttribute('data-est', estTime);
      }
    }

    /* re-update display when timezone changes */
    if(tzSelect){
      tzSelect.addEventListener('change', function(){
        if(selectedDate && selectedTime) updateSlotDisplay();
      });
    }

    document.getElementById('calPrev').addEventListener('click', function(){
      calMonth--; if(calMonth < 0){ calMonth = 11; calYear--; } renderCalendar();
    });
    document.getElementById('calNext').addEventListener('click', function(){
      calMonth++; if(calMonth > 11){ calMonth = 0; calYear++; } renderCalendar();
    });
    renderCalendar();
    fetchBookedSlots(function(){ if(selectedDate) showTimeslots(); });

    var scheduleForm = document.getElementById('scheduleForm');
    if(scheduleForm){
      scheduleForm.addEventListener('submit', function(e){
        e.preventDefault();
        if(!selectedDate || !selectedTime){
          alert('Please select a date and time before booking.');
          return;
        }
        var tz = tzSelect ? tzSelect.value : 'America/New_York';
        var summary = document.getElementById('slotSummary');
        var estTime = summary ? summary.getAttribute('data-est') : '';
        /* Add booking details to form data */
        var dateStr = selectedDate.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
        var hiddenFields = {
          booking_date: dateStr,
          booking_time_customer: selectedTime,
          customer_timezone: tz,
          booking_time_est: estTime || selectedTime
        };
        /* Create temp hidden inputs */
        Object.keys(hiddenFields).forEach(function(k){
          var inp = document.createElement('input');
          inp.type = 'hidden'; inp.name = k; inp.value = hiddenFields[k];
          scheduleForm.appendChild(inp);
        });
        var btn = scheduleForm.querySelector('button[type="submit"]');
        btn.textContent = 'Booking...';
        btn.disabled = true;
        var bookName = scheduleForm.querySelector('[name="name"]').value;
        var bookEmail = scheduleForm.querySelector('[name="email"]').value;
        var dk = dateKey(selectedDate);
        saveBooking(dk, selectedTime, bookName, bookEmail);
        sendForm(scheduleForm, 'New Consultation Booking', function(){
          if(!bookedSlots[dk]) bookedSlots[dk] = [];
          bookedSlots[dk].push(selectedTime);
          scheduleForm.style.display = 'none';
          var success = document.getElementById('scheduleSuccess');
          if(success) success.style.display = 'block';
        });
      });
    }
  }

  /* ============ INTAKE FORM (get-started page) ============ */
  var intakePanels = document.querySelectorAll('.intake-panel');
  if(intakePanels.length > 0){
    var currentStep = 0;
    var intakeSteps = document.querySelectorAll('.intake-step');
    var intakeSelections = {};

    // Pre-select plan from URL
    var urlParams = new URLSearchParams(location.search);
    var planParam = urlParams.get('plan');

    function getSelectionSummaryHTML(){
      var bizSel = document.querySelectorAll('#step1 .intake-option.selected');
      var bizLabels = Array.prototype.map.call(bizSel, function(o){ return o.querySelector('.intake-option-label').textContent; });
      var needsSel = document.querySelectorAll('#step2 .intake-option.selected');
      var needsLabels = Array.prototype.map.call(needsSel, function(o){ return o.querySelector('.intake-option-label').textContent; });
      if(!bizLabels.length && !needsLabels.length) return '';
      var html = '';
      if(bizLabels.length) html += '<strong>Business type:</strong> ' + bizLabels.join(', ') + '<br>';
      if(needsLabels.length) html += '<strong>Services needed:</strong> ' + needsLabels.join(', ');
      return html;
    }

    function updateSelectionSummaries(){
      var html = getSelectionSummaryHTML();
      ['selectionSummary3','selectionSummary4'].forEach(function(id){
        var el = document.getElementById(id);
        if(el){ el.innerHTML = html; el.style.display = html ? 'block' : 'none'; }
      });
    }

    function showStep(n){
      intakePanels.forEach(function(p, i){ p.classList.toggle('active', i === n); });
      intakeSteps.forEach(function(s, i){
        s.classList.remove('active','done');
        if(i < n) s.classList.add('done');
        if(i === n) s.classList.add('active');
      });
      currentStep = n;
      if(n >= 2) updateSelectionSummaries();
    }

    // Option click handlers
    document.querySelectorAll('.intake-option').forEach(function(opt){
      opt.addEventListener('click', function(){
        var panel = opt.closest('.intake-panel');
        var multi = panel.getAttribute('data-multi') === 'true';
        if(!multi){
          panel.querySelectorAll('.intake-option').forEach(function(o){ o.classList.remove('selected'); });
        }
        opt.classList.toggle('selected');
      });
    });

    // Next/Prev
    document.querySelectorAll('.intake-next').forEach(function(btn){
      btn.addEventListener('click', function(){
        if(currentStep < intakePanels.length - 1) showStep(currentStep + 1);
      });
    });
    document.querySelectorAll('.intake-prev').forEach(function(btn){
      btn.addEventListener('click', function(){
        if(currentStep > 0) showStep(currentStep - 1);
      });
    });

    // Submit
    var intakeForm = document.getElementById('intakeContactForm');
    if(intakeForm){
      intakeForm.addEventListener('submit', function(e){
        e.preventDefault();
        // Inject selected options from step 1 & 2 into hidden fields
        var bizSel = document.querySelectorAll('#step1 .intake-option.selected');
        var bizVal = Array.prototype.map.call(bizSel, function(o){ return o.getAttribute('data-value'); }).join(', ');
        var needsSel = document.querySelectorAll('#step2 .intake-option.selected');
        var needsVal = Array.prototype.map.call(needsSel, function(o){ return o.getAttribute('data-value'); }).join(', ');
        var h1 = intakeForm.querySelector('input[name="businessType"]');
        if(!h1){ h1 = document.createElement('input'); h1.type='hidden'; h1.name='businessType'; intakeForm.appendChild(h1); }
        h1.value = bizVal || 'Not selected';
        var h2 = intakeForm.querySelector('input[name="needs"]');
        if(!h2){ h2 = document.createElement('input'); h2.type='hidden'; h2.name='needs'; intakeForm.appendChild(h2); }
        h2.value = needsVal || 'Not selected';
        sendForm(intakeForm, 'New Get Started Inquiry', function(){
          intakeForm.style.display = 'none';
          document.getElementById('intakeProgress').style.display = 'none';
          document.getElementById('intakeSuccess').style.display = 'block';
        });
      });
    }

    showStep(0);
  }

  /* ============ FORM SUBMIT HELPER ============ */
  var FORM_EMAIL = 'info@worksource.supplies';
  function sendForm(formEl, subject, onSuccess){
    var data = new FormData(formEl);
    var obj = {_subject: subject};
    data.forEach(function(val, key){ obj[key] = val; });
    fetch('https://formsubmit.co/ajax/' + FORM_EMAIL, {
      method: 'POST',
      headers: {'Content-Type':'application/json','Accept':'application/json'},
      body: JSON.stringify(obj)
    }).then(function(r){ return r.json(); })
    .then(function(){ if(onSuccess) onSuccess(); })
    .catch(function(){ if(onSuccess) onSuccess(); });
  }

  /* ============ EMAIL CAPTURE ============ */
  var emailForm = document.getElementById('emailCaptureForm');
  if(emailForm){
    emailForm.addEventListener('submit', function(e){
      e.preventDefault();
      var input = emailForm.querySelector('input[type="email"]');
      var btn = emailForm.querySelector('button');
      btn.textContent = 'Sending...';
      btn.disabled = true;
      sendForm(emailForm, 'New Email Subscriber', function(){
        btn.textContent = 'Subscribed!';
        btn.style.opacity = '.7';
        if(input) input.disabled = true;
      });
    });
  }

  /* ============ PREVIEW TRACK PAUSE ON HOVER ============ */
  var previewTrack = document.getElementById('previewTrack');
  if(previewTrack){
    previewTrack.addEventListener('mouseenter', function(){
      previewTrack.style.animationPlayState = 'paused';
    });
    previewTrack.addEventListener('mouseleave', function(){
      previewTrack.style.animationPlayState = 'running';
    });
  }

})();
