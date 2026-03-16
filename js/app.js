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
      var renderer = new THREE.WebGLRenderer({canvas:bgCanvas, alpha:true, antialias:true});
      renderer.setSize(innerWidth, innerHeight);
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

      var pCount = 500;
      var positions = new Float32Array(pCount*3);
      for(var i=0;i<pCount*3;i++) positions[i]=(Math.random()-.5)*100;
      var pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(positions,3));
      var particles = new THREE.Points(pGeo, new THREE.PointsMaterial({color:0x7b2fff, size:.1, transparent:true, opacity:.45}));
      scene.add(particles);

      var shapes = [];
      var geos = [new THREE.OctahedronGeometry(.5,0), new THREE.TetrahedronGeometry(.5,0), new THREE.IcosahedronGeometry(.4,0)];
      for(var j=0;j<5;j++){
        var m = new THREE.Mesh(geos[j%geos.length], new THREE.MeshBasicMaterial({color:j%2?0x7b2fff:0x00d4ff, wireframe:true, transparent:true, opacity:.15}));
        m.position.set((Math.random()-.5)*60,(Math.random()-.5)*40,(Math.random()-.5)*30);
        m.userData={rx:(Math.random()-.5)*.008,ry:(Math.random()-.5)*.008,fs:Math.random()*.3+.1,fa:Math.random()*2+1,by:m.position.y};
        scene.add(m); shapes.push(m);
      }

      var mx=0,my=0;
      document.addEventListener('mousemove',function(e){mx=(e.clientX/innerWidth-.5)*2;my=(e.clientY/innerHeight-.5)*2;});

      (function animBg(){
        requestAnimationFrame(animBg);
        var t=Date.now()*.001;
        particles.rotation.y+=.0002;particles.rotation.x+=.0001;
        camera.position.x+=(mx*3-camera.position.x)*.02;
        camera.position.y+=(-my*3-camera.position.y)*.02;
        shapes.forEach(function(s){s.rotation.x+=s.userData.rx;s.rotation.y+=s.userData.ry;s.position.y=s.userData.by+Math.sin(t*s.userData.fs)*s.userData.fa;});
        renderer.render(scene,camera);
      })();

      window.addEventListener('resize',function(){
        camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
        renderer.setSize(innerWidth,innerHeight);
      });
    } catch(e){ bgCanvas.style.display='none'; }
  }

  /* ============ CURSOR (desktop only) ============ */
  if(!isMobile){
    var cur = document.getElementById('cursor');
    var fol = document.getElementById('cursorFollower');
    if(cur && fol){
      var cx=0,cy=0,fx=0,fy=0;
      document.addEventListener('mousemove',function(e){cx=e.clientX;cy=e.clientY;});
      (function moveCur(){
        requestAnimationFrame(moveCur);
        fx+=(cx-fx)*.14;fy+=(cy-fy)*.14;
        cur.style.left=cx+'px';cur.style.top=cy+'px';
        fol.style.left=fx+'px';fol.style.top=fy+'px';
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
    navToggle.addEventListener('click',function(){
      navToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });
    navLinks.querySelectorAll('.nav-link').forEach(function(l){
      l.addEventListener('click',function(){
        navToggle.classList.remove('open');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
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
      {text:'Contractors',icon:'\uD83D\uDD28',type:'Industry',url:'industry.html?type=contractor'},
      {text:'Real Estate',icon:'\uD83C\uDFE0',type:'Industry',url:'industry.html?type=realestate'},
      {text:'Inspectors',icon:'\uD83D\uDD0D',type:'Industry',url:'industry.html?type=inspector'},
      {text:'Law Firms',icon:'\u2696',type:'Industry',url:'industry.html?type=law'},
      {text:'Medical Offices',icon:'\uD83C\uDFE5',type:'Industry',url:'industry.html?type=medical'},
      {text:'Restaurants',icon:'\uD83C\uDF7D',type:'Industry',url:'industry.html?type=restaurant'},
      {text:'E-commerce',icon:'\uD83D\uDED2',type:'Industry',url:'industry.html?type=ecommerce'},
      {text:'Marketing Agencies',icon:'\uD83D\uDCC8',type:'Industry',url:'industry.html?type=agency'},
      {text:'Photographers',icon:'\uD83D\uDCF7',type:'Industry',url:'industry.html?type=photographer'},
      {text:'Event Planners',icon:'\uD83C\uDF89',type:'Industry',url:'industry.html?type=events'},
      {text:'Consultants',icon:'\uD83D\uDCBC',type:'Industry',url:'industry.html?type=consultant'},
      {text:'Coaches',icon:'\uD83C\uDFC6',type:'Industry',url:'industry.html?type=coach'},
      {text:'Home Services',icon:'\uD83D\uDD27',type:'Industry',url:'industry.html?type=homeservice'},
      {text:'Insurance Agents',icon:'\uD83D\uDCDC',type:'Industry',url:'industry.html?type=insurance'},
      {text:'Property Managers',icon:'\uD83C\uDFE2',type:'Industry',url:'industry.html?type=property'},
      {text:'Construction',icon:'\uD83D\uDEA7',type:'Industry',url:'industry.html?type=construction'},
      {text:'Freelancers',icon:'\uD83D\uDCBB',type:'Industry',url:'industry.html?type=freelancer'},
      {text:'Startups',icon:'\uD83D\uDE80',type:'Industry',url:'industry.html?type=startup'},
      {text:'Local Businesses',icon:'\uD83C\uDFEA',type:'Industry',url:'industry.html?type=local'},
      {text:'Sales & Lead Automation',icon:'\u26A1',type:'Category',url:'automations.html#sales'},
      {text:'Phone & Voice AI',icon:'\uD83D\uDCDE',type:'Category',url:'automations.html#phone'},
      {text:'Email Automation',icon:'\u2709',type:'Category',url:'automations.html#email'},
      {text:'Document Automation',icon:'\uD83D\uDCC4',type:'Category',url:'automations.html#docs'},
      {text:'Website Systems',icon:'\uD83C\uDF10',type:'Category',url:'automations.html#website'},
      {text:'Custom Apps',icon:'\uD83D\uDCF1',type:'Category',url:'automations.html#apps'},
      {text:'Dashboard Systems',icon:'\uD83D\uDCCA',type:'Category',url:'automations.html#dashboard'},
      {text:'Process Automation',icon:'\u2699',type:'Category',url:'automations.html#process'},
      {text:'Marketing Automation',icon:'\uD83D\uDCE3',type:'Category',url:'automations.html#marketing'},
      {text:'Customer Support AI',icon:'\uD83D\uDCAC',type:'Category',url:'automations.html#support'},
      {text:'Booking Systems',icon:'\uD83D\uDCC5',type:'Category',url:'automations.html#booking'},
      {text:'Finance Automation',icon:'\uD83D\uDCB0',type:'Category',url:'automations.html#finance'},
      {text:'AI Data Analysis',icon:'\uD83E\uDDE0',type:'Category',url:'automations.html#data'},
      {text:'AI Employees',icon:'\uD83E\uDD16',type:'Category',url:'automations.html#insane'},
      {text:'Pricing Plans',icon:'\uD83D\uDCB3',type:'Info',url:'pricing.html'},
      {text:'Free Automation Plan',icon:'\uD83D\uDCCB',type:'Info',url:'blueprint.html'},
      {text:'Shop Plans',icon:'\uD83D\uDED2',type:'Info',url:'shop.html'},
      {text:'Book a Call',icon:'\uD83D\uDCC5',type:'Info',url:'schedule.html'},
      {text:'Salon & Spa',icon:'\uD83D\uDC87',type:'Industry',url:'industry.html?type=salon'},
      {text:'Fitness & Gyms',icon:'\uD83C\uDFCB',type:'Industry',url:'industry.html?type=fitness'},
      {text:'Automotive',icon:'\uD83D\uDE97',type:'Industry',url:'industry.html?type=auto'},
      {text:'Accounting',icon:'\uD83D\uDCCA',type:'Industry',url:'industry.html?type=accounting'},
      {text:'Nonprofits',icon:'\uD83D\uDC9A',type:'Industry',url:'industry.html?type=nonprofit'},
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
        a.style.maxHeight=a.scrollHeight+'px';
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

  /* ============ BLUEPRINT FORM ============ */
  var bpForm = document.getElementById('blueprintForm');
  if(bpForm){
    bpForm.addEventListener('submit',function(e){
      e.preventDefault();
      bpForm.style.display='none';
      var success = document.getElementById('formSuccess');
      if(success) success.style.display='block';
    });
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
    var availableTimes = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM'];

    function renderCalendar(){
      calendarMonth.textContent = months[calMonth] + ' ' + calYear;
      var first = new Date(calYear, calMonth, 1).getDay();
      var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
      var today = new Date(); today.setHours(0,0,0,0);
      var html = '';
      for(var e = 0; e < first; e++) html += '<div class="calendar-day empty"></div>';
      for(var d = 1; d <= daysInMonth; d++){
        var date = new Date(calYear, calMonth, d);
        var day = date.getDay();
        var isPast = date < today;
        var isWeekend = day === 0 || day === 6;
        var cls = 'calendar-day';
        if(isPast || isWeekend) cls += ' past';
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

    function showTimeslots(){
      var timeslots = document.getElementById('timeslots');
      var grid = document.getElementById('timeslotGrid');
      var dateText = document.getElementById('selectedDateText');
      if(!timeslots || !grid) return;
      timeslots.style.display = 'block';
      dateText.textContent = selectedDate.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'});
      grid.innerHTML = availableTimes.map(function(t){
        var cls = 'timeslot' + (selectedTime === t ? ' selected' : '');
        return '<div class="' + cls + '" data-time="' + t + '">' + t + '</div>';
      }).join('');
      grid.querySelectorAll('.timeslot').forEach(function(el){
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
        summary.textContent = selectedDate.toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric'}) + ' at ' + selectedTime;
      }
    }

    document.getElementById('calPrev').addEventListener('click', function(){
      calMonth--; if(calMonth < 0){ calMonth = 11; calYear--; } renderCalendar();
    });
    document.getElementById('calNext').addEventListener('click', function(){
      calMonth++; if(calMonth > 11){ calMonth = 0; calYear++; } renderCalendar();
    });
    renderCalendar();

    var scheduleForm = document.getElementById('scheduleForm');
    if(scheduleForm){
      scheduleForm.addEventListener('submit', function(e){
        e.preventDefault();
        scheduleForm.style.display = 'none';
        var success = document.getElementById('scheduleSuccess');
        if(success) success.style.display = 'block';
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

    function showStep(n){
      intakePanels.forEach(function(p, i){ p.classList.toggle('active', i === n); });
      intakeSteps.forEach(function(s, i){
        s.classList.remove('active','done');
        if(i < n) s.classList.add('done');
        if(i === n) s.classList.add('active');
      });
      currentStep = n;
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
    document.querySelectorAll('[data-intake-next]').forEach(function(btn){
      btn.addEventListener('click', function(){
        if(currentStep < intakePanels.length - 1) showStep(currentStep + 1);
      });
    });
    document.querySelectorAll('[data-intake-prev]').forEach(function(btn){
      btn.addEventListener('click', function(){
        if(currentStep > 0) showStep(currentStep - 1);
      });
    });

    // Submit
    var intakeForm = document.getElementById('intakeContactForm');
    if(intakeForm){
      intakeForm.addEventListener('submit', function(e){
        e.preventDefault();
        document.getElementById('intakeFlow').style.display = 'none';
        document.getElementById('intakeSuccess').style.display = 'block';
      });
    }

    showStep(0);
  }

  /* ============ EMAIL CAPTURE ============ */
  var emailForm = document.getElementById('emailCaptureForm');
  if(emailForm){
    emailForm.addEventListener('submit', function(e){
      e.preventDefault();
      var input = emailForm.querySelector('input[type="email"]');
      var btn = emailForm.querySelector('button');
      btn.textContent = 'Subscribed!';
      btn.style.opacity = '.7';
      btn.disabled = true;
      if(input) input.disabled = true;
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
