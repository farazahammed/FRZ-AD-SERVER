(function () {
  'use strict';

  // ─── FRZ-AD | GitHub-hosted ad engine ────────────────────────────────────────
  // Upload this file to your GitHub repo root as: frz-ad.js
  // Put your ad images in: /ads/ folder of your repo
  // ─────────────────────────────────────────────────────────────────────────────

  var BASE_URL = 'https://farazahammed.github.io/FRZ-AD-SERVER/ads/';

  var ADS = [
    { img: '91c8f416-9c1f-4cef-841a-987d25bec6d7.png', link: 'https://frz-games.netlify.app', label: 'frz games' },
    { img: 'ChatGPT Image Mar 10, 2026, 11_35_36 AM.png', link: 'https://sslc-notes-frz.blogspot.com', label: 'frz notes sscl' },
    { img: 'ChatGPT Image Mar 16, 2026, 10_22_54 PM.png', link: 'https://support-frz.netlify.app', label: 'eid' }
  ];

  var INACTIVITY_MS = 10000;
  var SLIDE_MS      = 6000;
  var AD_ID         = 'frz-ad-overlay';

  var inactivityTimer = null;
  var slideTimer      = null;
  var currentSlide    = 0;
  var injected        = false;

  var CSS = [
    '#frz-ad-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,0);display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:background .4s ease,opacity .4s ease;font-family:sans-serif;}',
    '#frz-ad-overlay.frz-show{background:rgba(0,0,0,.82);opacity:1;pointer-events:auto;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);}',
    '#frz-ad-card{position:relative;width:min(340px,88vw);border-radius:18px;overflow:hidden;background:#0a0a0f;box-shadow:0 40px 100px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.07);transform:scale(.88) translateY(24px);opacity:0;transition:transform .42s cubic-bezier(.34,1.56,.64,1),opacity .35s ease;}',
    '#frz-ad-overlay.frz-show #frz-ad-card{transform:scale(1) translateY(0);opacity:1;}',
    '#frz-ad-img-wrap{position:relative;width:100%;padding-top:150%;overflow:hidden;background:#111;}',
    '#frz-ad-img-wrap img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity .5s ease;}',
    '#frz-ad-img-wrap img.frz-fade{opacity:0;}',
    '#frz-ad-img-wrap::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.7) 0%,transparent 50%);pointer-events:none;}',
    '#frz-ad-label{position:absolute;bottom:14px;left:16px;right:48px;z-index:2;color:#fff;font-size:13px;font-weight:600;letter-spacing:.04em;text-shadow:0 1px 4px rgba(0,0,0,.8);opacity:0;transition:opacity .4s ease;}',
    '#frz-ad-overlay.frz-show #frz-ad-label{opacity:1;}',
    '#frz-ad-dots{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:3;}',
    '.frz-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.35);cursor:pointer;transition:background .25s,transform .25s;border:none;padding:0;}',
    '.frz-dot.frz-active{background:#fff;transform:scale(1.3);}',
    '#frz-ad-close{position:absolute;top:12px;right:12px;z-index:10;width:32px;height:32px;border-radius:50%;border:none;background:rgba(0,0,0,.65);color:#fff;font-size:16px;line-height:32px;text-align:center;cursor:pointer;transition:background .2s,transform .2s;display:flex;align-items:center;justify-content:center;}',
    '#frz-ad-close:hover{background:#ff3c3c;transform:scale(1.1);}',
    '.frz-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:10;width:34px;height:34px;border-radius:50%;border:none;background:rgba(0,0,0,.55);color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s,transform .2s;}',
    '.frz-arrow:hover{background:rgba(255,255,255,.2);transform:translateY(-50%) scale(1.1);}',
    '#frz-ad-prev{left:10px;}#frz-ad-next{right:10px;}',
    '#frz-ad-progress{height:2px;background:rgba(255,255,255,.08);position:relative;overflow:hidden;}',
    '#frz-ad-progress-bar{position:absolute;left:0;top:0;height:100%;width:0%;background:linear-gradient(90deg,#ff3c3c,#ff8c3c);transition:width linear;}',
    '#frz-ad-brand{padding:10px 16px;background:#06060e;border-top:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;align-items:center;}',
    '#frz-ad-brand .frz-b1{font-size:11px;color:#444;}#frz-ad-brand .frz-b1 b{color:#ff3c3c;}#frz-ad-brand .frz-b2{font-size:10px;color:#2a2a2a;}',
  ].join('');

  function injectStyles(){if(document.getElementById('frz-ad-styles'))return;var s=document.createElement('style');s.id='frz-ad-styles';s.textContent=CSS;document.head.appendChild(s);}

  function buildOverlay(){
    if(document.getElementById(AD_ID))return;
    injectStyles();
    var ov=document.createElement('div');ov.id=AD_ID;
    var card=document.createElement('div');card.id='frz-ad-card';
    var imgWrap=document.createElement('div');imgWrap.id='frz-ad-img-wrap';
    var imgEl=document.createElement('img');imgEl.id='frz-ad-img';imgEl.alt='Advertisement';imgEl.src=BASE_URL+ADS[0].img;imgEl.style.cursor='pointer';imgEl.onclick=function(){goToLink();};
    imgWrap.appendChild(imgEl);
    var label=document.createElement('div');label.id='frz-ad-label';label.textContent=ADS[0].label||'';imgWrap.appendChild(label);
    var dotsWrap=document.createElement('div');dotsWrap.id='frz-ad-dots';
    ADS.forEach(function(_,i){var dot=document.createElement('button');dot.className='frz-dot'+(i===0?' frz-active':'');dot.setAttribute('aria-label','Slide '+(i+1));dot.onclick=function(){goTo(i);};dotsWrap.appendChild(dot);});
    imgWrap.appendChild(dotsWrap);
    if(ADS.length>1){
      var prev=document.createElement('button');prev.className='frz-arrow';prev.id='frz-ad-prev';prev.innerHTML='&#8249;';prev.onclick=function(){goTo((currentSlide-1+ADS.length)%ADS.length);};imgWrap.appendChild(prev);
      var next=document.createElement('button');next.className='frz-arrow';next.id='frz-ad-next';next.innerHTML='&#8250;';next.onclick=function(){goTo((currentSlide+1)%ADS.length);};imgWrap.appendChild(next);
    }
    var closeBtn=document.createElement('button');closeBtn.id='frz-ad-close';closeBtn.innerHTML='&#x2715;';closeBtn.setAttribute('aria-label','Close ad');closeBtn.onclick=function(){hideAd();};
    var progress=document.createElement('div');progress.id='frz-ad-progress';var progressBar=document.createElement('div');progressBar.id='frz-ad-progress-bar';progress.appendChild(progressBar);
    var brand=document.createElement('div');brand.id='frz-ad-brand';brand.innerHTML='<span class="frz-b1">Ad by <b>FRZ-AD</b> Service</span><span class="frz-b2">ad powered by frz-ad service</span>';
    card.appendChild(closeBtn);card.appendChild(imgWrap);card.appendChild(progress);card.appendChild(brand);ov.appendChild(card);
    ov.addEventListener('click',function(e){if(e.target===ov)hideAd();});
    document.body.appendChild(ov);injected=true;
  }

  function goTo(index){
    if(ADS.length<2)return;clearInterval(slideTimer);
    var imgEl=document.getElementById('frz-ad-img');var label=document.getElementById('frz-ad-label');var dots=document.querySelectorAll('.frz-dot');
    imgEl.classList.add('frz-fade');
    setTimeout(function(){currentSlide=index;imgEl.src=BASE_URL+ADS[currentSlide].img;if(label)label.textContent=ADS[currentSlide].label||'';imgEl.classList.remove('frz-fade');dots.forEach(function(d,i){d.className='frz-dot'+(i===currentSlide?' frz-active':'');});},260);
    startSlideTimer();startProgress();
  }

  function startSlideTimer(){clearInterval(slideTimer);slideTimer=setInterval(function(){goTo((currentSlide+1)%ADS.length);},SLIDE_MS);}
  function startProgress(){var bar=document.getElementById('frz-ad-progress-bar');if(!bar)return;bar.style.transition='none';bar.style.width='0%';setTimeout(function(){bar.style.transition='width '+SLIDE_MS+'ms linear';bar.style.width='100%';},30);}
  function goToLink(){var link=ADS[currentSlide]&&ADS[currentSlide].link;if(link&&link!=='https://example.com')window.open(link,'_blank','noopener');}

  function showAd(){
    if(!injected)buildOverlay();
    var ov=document.getElementById(AD_ID);if(!ov)return;
    currentSlide=0;var imgEl=document.getElementById('frz-ad-img');if(imgEl){imgEl.src=BASE_URL+ADS[0].img;imgEl.classList.remove('frz-fade');}
    var label=document.getElementById('frz-ad-label');if(label)label.textContent=ADS[0].label||'';
    var dots=document.querySelectorAll('.frz-dot');dots.forEach(function(d,i){d.className='frz-dot'+(i===0?' frz-active':'');});
    requestAnimationFrame(function(){ov.classList.add('frz-show');});
    if(ADS.length>1){startSlideTimer();startProgress();}
  }

  function hideAd(){
    var ov=document.getElementById(AD_ID);if(ov)ov.classList.remove('frz-show');
    clearInterval(slideTimer);var bar=document.getElementById('frz-ad-progress-bar');if(bar){bar.style.transition='none';bar.style.width='0%';}
    resetInactivityTimer();
  }

  function resetInactivityTimer(){clearTimeout(inactivityTimer);inactivityTimer=setTimeout(showAd,INACTIVITY_MS);}

  ['mousemove','keydown','mousedown','scroll','touchstart'].forEach(function(ev){document.addEventListener(ev,resetInactivityTimer,{passive:true});});

  function init(){injectStyles();buildOverlay();resetInactivityTimer();}
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}

})();
