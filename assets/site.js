'use strict';

// Fetch the optional font stylesheet without blocking the page's controls.
document.getElementById('brandFonts').media = 'all';

function initHero() {
  const container = document.getElementById('heroScrollContainer');
  const stage = document.getElementById('heroStage');
  const video = document.getElementById('heroVideo');
  const bands = [
    { element: document.getElementById('band1'), start: 0, end: 0.22 },
    { element: document.getElementById('band2'), start: 0.24, end: 0.48 },
    { element: document.getElementById('band3'), start: 0.50, end: 0.74 },
    { element: document.getElementById('band4'), start: 0.76, end: Infinity }
  ];
  let activeBand = bands[0];
  const staticMode = matchMedia('(max-width: 768px), (prefers-reduced-motion: reduce), (pointer: coarse)');
  let top = 0;
  let travel = 0;
  let end = 0;
  let progress = 0;
  let target = 0;
  let lastTime = 0;
  let frame = null;

  function seek() {
    if (!Number.isFinite(video.duration) || video.seeking || video.error) return;
    const desiredTime = progress * video.duration;
    if (Math.abs(video.currentTime - desiredTime) > 1 / 60) video.currentTime = desiredTime;
  }

  function updateCaptions() {
    const next = bands.find(band => progress >= band.start && progress < band.end);
    if (next === activeBand) return;
    activeBand?.element.classList.remove('active');
    next?.element.classList.add('active');
    activeBand = next;
  }

  function tick(now) {
    const dt = Math.min(100, now - lastTime);
    lastTime = now;
    progress += (target - progress) * (1 - Math.pow(0.82, dt / 16.667));
    if (Math.abs(target - progress) < 0.0004) {
      progress = target;
      frame = null;
    } else {
      frame = requestAnimationFrame(tick);
    }
    updateCaptions();
    seek();
  }

  function onScroll() {
    if (staticMode.matches) return;
    const y = window.scrollY;
    if (y > top && y < end && !video.hasAttribute('src')) {
      stage.classList.add('video-loading');
      video.preload = 'auto';
      video.src = video.dataset.src;
    }
    const next = travel > 0 ? Math.max(0, Math.min(1, (y - top) / travel)) : 0;
    if (next === target) return;
    target = next;
    if (frame === null) {
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }

  function onResize() {
    if (staticMode.matches) {
      cancelAnimationFrame(frame);
      frame = null;
      progress = target;
      updateCaptions();
      if (video.hasAttribute('src')) {
        video.removeAttribute('src');
        video.load();
      }
      stage.classList.remove('video-ready', 'video-loading');
      return;
    }
    const rect = container.getBoundingClientRect();
    top = rect.top + window.scrollY;
    end = top + rect.height;
    travel = rect.height - window.innerHeight;
    onScroll();
  }

  video.addEventListener('loadeddata', () => {
    if (!video.hasAttribute('src')) return;
    stage.classList.remove('video-loading');
    stage.classList.add('video-ready');
    seek();
  });
  video.addEventListener('seeked', seek);
  video.addEventListener('error', () => stage.classList.remove('video-loading', 'video-ready'));
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  staticMode.addEventListener('change', onResize);
  onResize();
}

initHero();

const profiles = {
  'Obsidian Noir': {
    matchedTitle: "OBSIDIAN NOIR",
    matchedDesc: "묵직한 바디감과 스모키한 다크 카카오의 깊은 여운을 선호하시는 분께 완벽한 매칭입니다.",
    matchedBrew: "Espresso / Moka Pot",
    matchedTemp: "92.0°C",
    matchedRatio: "1 : 2.0 (18g / 36g)",
    matchedTime: "28 to 30 sec",
  },
  'Vapor Bloom': {
    matchedTitle: "VAPOR BLOOM",
    matchedDesc: "화사한 재스민 꽃향기와 베르가모트의 산뜻하고 투명한 산미를 선호하시는 분을 위한 싱글오리진.",
    matchedBrew: "Pour-Over Dripper",
    matchedTemp: "94.5°C",
    matchedRatio: "1 : 15.5 (20g / 310g)",
    matchedTime: "2 min 40 sec",
  },
  'Velvet Amber': {
    matchedTitle: "VELVET AMBER",
    matchedDesc: "부드러운 크레마, 캐러멜 토피의 달콤한 단맛과 은은한 과일 산미가 절묘한 조화를 이루는 블렌드.",
    matchedBrew: "Aeropress / Filter",
    matchedTemp: "93.0°C",
    matchedRatio: "1 : 14.0 (18g / 250g)",
    matchedTime: "2 min 10 sec",
  }
};

function initCurator() {
  const roast = document.getElementById('sliderRoast');
  const acidity = document.getElementById('sliderAcidity');
  const body = document.getElementById('sliderBody');
  const orderButton = document.getElementById('btnCuratorOrder');
  let previousMatch;

  function updateMatch() {
    let name = 'Velvet Amber';
    if (roast.valueAsNumber >= 70 || body.valueAsNumber >= 75) name = 'Obsidian Noir';
    else if (acidity.valueAsNumber >= 60 || roast.valueAsNumber <= 45) name = 'Vapor Bloom';

    if (name === previousMatch) return;
    previousMatch = name;
    for (const [id, text] of Object.entries(profiles[name])) {
      document.getElementById(id).textContent = text;
    }
    orderButton.dataset.product = 'Curated Selection: ' + name;
  }

  function bindSlider(slider, labelId, describe) {
    const label = document.getElementById(labelId);
    function update() {
      label.textContent = `${describe(slider.valueAsNumber)} (${slider.value}%)`;
      updateMatch();
    }
    slider.addEventListener('input', update);
    update();
  }
  bindSlider(roast, 'valRoast', value => value > 70 ? 'Dark' : value > 40 ? 'Medium' : 'Light');
  bindSlider(acidity, 'valAcidity', value => value > 60 ? 'Bright' : value > 35 ? 'Balanced' : 'Subtle');
  bindSlider(body, 'valBody', value => value > 70 ? 'Heavy Velvet' : value > 40 ? 'Medium Silk' : 'Clean Tea-like');
}

initCurator();

let openQuestion;
function setQuestionOpen(question, open) {
  question.parentElement.classList.toggle('open', open);
  question.setAttribute('aria-expanded', String(open));
}
document.querySelectorAll('.faq-question').forEach(question => {
  question.addEventListener('click', () => {
    const opening = openQuestion !== question;
    if (openQuestion) setQuestionOpen(openQuestion, false);
    openQuestion = opening ? question : null;
    if (openQuestion) setQuestionOpen(openQuestion, true);
  });
});

const modal = document.getElementById('orderModal');
const modalTitle = document.getElementById('modalProductTitle');
const form = document.getElementById('orderForm');
const grind = document.getElementById('orderGrind');
const closeButton = modal.querySelector('.modal-close');
const result = document.getElementById('orderResult');

document.querySelectorAll('[data-product]').forEach(button => {
  button.addEventListener('click', () => {
    modalTitle.textContent = button.dataset.product;
    modal.showModal();
  });
});

closeButton.addEventListener('click', () => modal.close());
modal.addEventListener('click', event => {
  if (event.target === modal) modal.close();
});
modal.addEventListener('close', () => {
  result.textContent = '';
  result.hidden = true;
  form.hidden = false;
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const name = document.getElementById('orderName').value;
  result.textContent = `주문 화면 체험을 완료했습니다.

상품: ${modalTitle.textContent}
분쇄도: ${grind.selectedOptions[0].text}
주문자: ${name}님`;
  form.hidden = true;
  result.hidden = false;
  form.reset();
  closeButton.focus();
});
