// static/frontend.js

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzqzf7Y3H4B7e9gIKfE5mHk4GXtErDS6boFE1hVM6-yGK6vtFI7_rpch1kmNhSaxcJB/exec"

const form = document.getElementById("assessmentForm");
const startTime = Date.now();
const timeElapsedSpan = document.getElementById("time-elapsed");
const responseMsg = document.getElementById("responseMsg");
const chartArea = document.getElementById("chart-area");
let chartInstance = null;



// Toggle framework blocks
document.querySelectorAll('input[name="framework"]').forEach(r => {
  r.addEventListener("change", (e) => {
    const val = e.target.value;
    document.getElementById("actfl-block").style.display = val === "ACTFL" ? "block" : "none";
    document.getElementById("cefrl-block").style.display = val === "CEFRL" ? "block" : "none";
  });
});

// Compute highest checked level for each skill inside a framework block
function computeSkillScores(frameworkName) {
  // returns object {Reading: number, Listening: number, Writing: number, Speaking: number}
  const result = { Reading: 0, Listening: 0, Writing: 0, Speaking: 0 };
  // find checkbox-list elements with matching data-framework
  document.querySelectorAll(`.checkbox-list[data-framework="${frameworkName}"]`).forEach(container => {
    const skillName = container.getAttribute("data-skill");
    let highest = 0;
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      if (cb.checked) {
        const lvl = parseInt(cb.getAttribute("data-level"), 10) || 0;
        if (lvl > highest) highest = lvl;
      }
    });
    result[skillName] = highest;
  });
  return result;
}

function drawChart(scores, framework = "ACTFL") {
  const labels = ["Reading", "Listening", "Writing", "Speaking"];
  const data = labels.map(l => scores[l] || 0);

  const ctx = document.getElementById('proficiencyChart').getContext('2d');

  // Define level labels for CEFRL and ACTFL
  const CEFRL_LEVELS = ["", "A1", "A2", "B1", "B2", "C1", "C2"];
  const ACTFL_LEVELS = [
    "",
    "Novice Low", "Novice Mid", "Novice High",
    "Intermediate Low", "Intermediate Mid", "Intermediate High",
    "Advanced Low", "Advanced Mid", "Advanced High", "Superior"
  ];

  const yLabels = framework === "CEFRL" ? CEFRL_LEVELS : ACTFL_LEVELS;
  const maxValue = framework === "CEFRL" ? 6 : 10;

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: framework + " Proficiency Level",
        data,
        backgroundColor: '#0074d9'
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: maxValue,
          ticks: {
            stepSize: 1,
            callback: function(value) {
              return yLabels[value] || "";
            }
          },
          title: {
            display: true,
            text: framework + " Proficiency Level"
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });

  chartArea.style.display = "block";
}


form.addEventListener("submit", async (ev) => {
  ev.preventDefault();

  // collect all form data
  const formData = new FormData(form);

  // capture numeric fields
  [
    "years_elementary","years_junior","years_high_school","years_university",
    "years_institutes","age","self_reading","self_listening",
    "self_writing","self_speaking"
  ].forEach(f => {
    const val = formData.get(f);
    formData.set(f, val ? Number(val) : 0); // 0 if no input
  });

  // add metadata
  formData.set("time_taken_seconds", Math.floor((Date.now() - startTime) / 1000));
  formData.set("Completion_Date", new Date().toISOString().slice(0,10));

  const framework = formData.get("framework") || "ACTFL";

  // compute scores for the shown block
  const scores = computeSkillScores(framework);
  ["Reading","Listening","Writing","Speaking"].forEach(skill => {
    formData.set(`${framework} ${skill} Proficiency Can Do Statements`, scores[skill]);
  });

  // set scores for second block as NA
  const other = framework === "CEFRL" ? "ACTFL" : "CEFRL";
  ["Reading","Listening","Writing","Speaking"].forEach(skill => {
    formData.set(`${other} ${skill} Proficiency Can Do Statements`, "NA");
  });

  // add checkbox values individually by name
  document.querySelectorAll('input[type="checkbox"][name]').forEach(cb => {
    formData.set(cb.name, cb.checked ? 1 : 0);
  });

  // include self-ratings
  formData.set("Rate your reading proficiency", formData.get("self_reading"));
  formData.set("Rate your listening proficiency", formData.get("self_listening"));
  formData.set("Rate your writing proficiency", formData.get("self_writing"));
  formData.set("Rate your speaking proficiency", formData.get("self_speaking"));

  // draw chart for chosen framework
  drawChart(scores, framework);

  // send to Google App script; converted from json to text to bypass cors issues
  responseMsg.textContent = "Saving…";
  try {
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: formData
    });

    const text = await res.text();
    responseMsg.textContent = "Thanks — your response was saved!";
    form.reset();
  }
  catch (err) {
    responseMsg.textContent = "Network error: " + err.message;
  }
});

function updateLabel(slider) {
  const levels = ["Beginner", "Intermediate", "Advanced", "Superior"];
  const label = document.getElementById(slider.id + "_label");
  label.textContent = levels[slider.value - 1];
}