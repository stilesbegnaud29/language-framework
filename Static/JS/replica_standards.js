/* app.js - Vanilla JS for loading, filtering, and simple UI interactions */

/* Sample data: a small set of example "Can-Do" statements per level & mode.
   In a full implementation you'd fetch a JSON file or API. */
const DATA = {
  "A1": {
    summary: "Can use simple phrases and sentences to satisfy basic needs.",
    statements: [
      {mode:"Speaking", text:"Introduce myself and give basic personal information (name, origin, profession)."},
      {mode:"Listening", text:"Understand very slow, clear speech about familiar topics."},
      {mode:"Reading", text:"Comprehend short, simple notices and signs."},
      {mode:"Writing", text:"Write short, simple postcards or fill in forms with personal details."}
    ]
  },
  "A2": {
    summary: "Can handle routine tasks requiring simple information exchanges.",
    statements: [
      {mode:"Speaking", text:"Describe daily activities and immediate needs using simple sentences."},
      {mode:"Listening", text:"Understand phrases and frequently used expressions related to areas of immediate relevance."},
      {mode:"Reading", text:"Read short texts on everyday subjects and find specific, predictable information."},
      {mode:"Writing", text:"Write simple connected texts on topics of personal interest."}
    ]
  },
  "B1": {
    summary: "Can produce simple connected text and describe experiences and events.",
    statements: [
      {mode:"Speaking", text:"Tell a story or describe experiences and events."},
      {mode:"Listening", text:"Understand main points of clear standard speech on familiar matters."},
      {mode:"Reading", text:"Understand texts about everyday or job-related topics."},
      {mode:"Writing", text:"Write simple connected texts on familiar topics."
      }
    ]
  },
  "B2": {
    summary: "Can interact with a degree of fluency and spontaneity in social and professional contexts.",
    statements: [
      {mode:"Speaking", text:"Give clear, detailed descriptions and defend opinions on topics of interest."},
      {mode:"Listening", text:"Understand extended speech and complex lines of argument."},
      {mode:"Reading", text:"Read articles and reports on contemporary problems."},
      {mode:"Writing", text:"Write clear, detailed texts on a wide range of subjects."}
    ]
  },
  "C1": {
    summary: "Can use language flexibly and effectively for social, academic, and professional purposes.",
    statements:[
      {mode:"Speaking", text:"Express ideas fluently and spontaneously without much obvious searching for expressions."},
      {mode:"Listening", text:"Understand a wide range of demanding, longer texts and recognize implicit meaning."},
      {mode:"Reading", text:"Understand long and complex factual and literary texts."},
      {mode:"Writing", text:"Write clear, well-structured texts on complex subjects."}
    ]
  },
  "C2": {
    summary: "Can understand virtually everything and summarize information from different sources.",
    statements:[
      {mode:"Speaking", text:"Express myself spontaneously with precision and nuance."},
      {mode:"Listening", text:"Understand virtually any spoken language, live or broadcast."},
      {mode:"Reading", text:"Read with ease virtually all forms of written language."},
      {mode:"Writing", text:"Write complex reports, summaries, or academic texts with ease."}
    ]
  }
};

const LEVELS = Object.keys(DATA);

function $(s){ return document.querySelector(s)}
function $all(s){ return Array.from(document.querySelectorAll(s))}

function initLevelTabs(){
  const container = document.querySelector('.level-tabs');
  LEVELS.forEach((lvl, i) => {
    const btn = document.createElement('button');
    btn.className = 'level-tab';
    btn.dataset.level = lvl;
    btn.setAttribute('role','tab');
    btn.textContent = lvl;
    if(i===0) btn.classList.add('active');
    btn.addEventListener('click', () => {
      $all('.level-tab').forEach(t=>t.classList.remove('active'));
      btn.classList.add('active');
      showLevel(lvl);
    });
    container.appendChild(btn);
  });
  showLevel(LEVELS[0]);
}

function showLevel(level){
  $('#level-summary-text').textContent = DATA[level].summary || '';
  // filter statements to selected level by default
  renderStatements([level]);
}

function renderStatements(levelsToShow){
  const container = $('#statements');
  container.innerHTML = '';
  const checkedModes = $all('.mode-filter:checked').map(cb=>cb.value);
  const q = $('#search').value.trim().toLowerCase();

  levelsToShow.forEach(level => {
    const group = DATA[level];
    group.statements.forEach((s, idx) => {
      if(!checkedModes.includes(s.mode)) return;
      if(q && !(s.text.toLowerCase().includes(q) || level.toLowerCase().includes(q))) return;

      const card = document.createElement('article');
      card.className = 'statement';
      card.innerHTML = `
        <div class="meta">${level} • ${s.mode}</div>
        <h4>${s.text}</h4>
        <button class="toggle-details" aria-expanded="false">Show example</button>
        <div class="detail" style="display:none;margin-top:10px;color:var(--muted);font-size:14px">
          Example: ${makeExample(level,s.mode)}
        </div>
      `;
      card.querySelector('.toggle-details').addEventListener('click', (ev)=>{
        const det = card.querySelector('.detail');
        const btn = ev.currentTarget;
        const isHidden = det.style.display === 'none';
        det.style.display = isHidden ? 'block' : 'none';
        btn.textContent = isHidden ? 'Hide example' : 'Show example';
        btn.setAttribute('aria-expanded', String(isHidden));
      });

      container.appendChild(card);
    });
  });

  if(!container.hasChildNodes()){
    container.innerHTML = `<div class="statement"><h4>No results</h4><p class="meta">Try adjusting filters or search terms.</p></div>`;
  }
}

function makeExample(level, mode){
  // quick, plausible example text per level/mode
  const base = {
    "A1":"Use simple, memorized phrases.",
    "A2":"Manage short interactions and routine tasks.",
    "B1":"Speak about experiences and ambitions with some detail.",
    "B2":"Communicate clearly in academic and professional contexts.",
    "C1":"Express nuances and adapt language to purpose.",
    "C2":"Perform at near-native mastery and summarize complex material."
  };
  return `${base[level]} (${mode.toLowerCase()} example).`;
}

/* UI wiring */
function attachFilters(){
  $all('.mode-filter').forEach(cb=>{
    cb.addEventListener('change', () => {
      // when filters change, restrict to currently selected level tab unless "Show All" is active
      const active = document.querySelector('.level-tab.active').dataset.level;
      const showAll = $('#showAll').dataset.showAll === "true";
      const levels = showAll ? LEVELS : [active];
      renderStatements(levels);
    });
  });
  $('#resetFilters').addEventListener('click', ()=>{
    $all('.mode-filter').forEach(cb=>cb.checked=true);
    $('#search').value='';
    const active = document.querySelector('.level-tab.active').dataset.level;
    renderStatements([active]);
  });

  $('#search').addEventListener('input', debounce(()=>{
    const q = $('#search').value.trim();
    const showAll = $('#showAll').dataset.showAll === "true";
    const active = document.querySelector('.level-tab.active').dataset.level;
    renderStatements(showAll ? LEVELS : [active]);
  }, 250));

  $('#showAll').addEventListener('click', (e)=>{
    const btn = e.currentTarget;
    const showAllNow = btn.dataset.showAll !== "true";
    btn.dataset.showAll = showAllNow ? "true" : "false";
    btn.textContent = showAllNow ? 'Show Selected Level' : 'Show All Levels';
    if(showAllNow){
      $all('.level-tab').forEach(t => t.classList.remove('active'));
    } else {
      // restore first level active
      $all('.level-tab')[0].classList.add('active');
    }
    renderStatements(showAllNow ? LEVELS : [document.querySelector('.level-tab.active').dataset.level]);
  });
}

/* Debounce helper */
function debounce(fn, ms=200){
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), ms) }
}

/* init */
document.addEventListener('DOMContentLoaded', () => {
  initLevelTabs();
  attachFilters();
});
