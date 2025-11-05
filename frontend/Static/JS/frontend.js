// static/frontend.js

const form = document.getElementById("assessmentForm");
const startTime = Date.now();
const timeElapsedSpan = document.getElementById("time-elapsed");
const responseMsg = document.getElementById("responseMsg");
const chartArea = document.getElementById("chart-area");
let chartInstance = null;


/*
Do you need a timer? it's erroring because you don't have anything in your frontend
*/

// // Update a small timer every second
// setInterval(() => {
//   const elapsed = Math.floor((Date.now() - startTime) / 1000);
//   timeElapsedSpan.innerText = elapsed;
// }, 1000);

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

function drawChart(scores) {
  const labels = ["Reading", "Listening", "Writing", "Speaking"];
  const data = labels.map(l => scores[l] || 0);

  const ctx = document.getElementById('proficiencyChart').getContext('2d');
  if (chartInstance) {
    chartInstance.data.datasets[0].data = data;
    chartInstance.update();
  } else {
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Proficiency Level',
          data,
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: 10
          }
        }
      }
    });
  }
  chartArea.style.display = "block";
}

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwADs29dQzaTRx_GdP1Y6GoRQa_Ah7RCuDBcmbDEQlO1SY99ByazHdmaEPNzmiyiveE/exec";

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();

  const formData = new FormData(form);
  const payload = {};
  for (const [k, v] of formData.entries()) {
    payload[k] = v;
  }

  // Capture numeric fields properly
  ["years_elementary","years_junior","years_high_school","years_university","years_institutes","age","self_reading","self_listening","self_writing","self_speaking"].forEach(nk => {
    if (payload[nk] !== undefined) {
      payload[nk] = Number(payload[nk]) || 0;
    }
  });

  payload.time_taken_seconds = Math.floor((Date.now() - startTime) / 1000);
  payload.Completion_Date = new Date().toISOString().slice(0,10);

  // Compute framework skill scores
  const framework = payload.framework || "ACTFL";
  const scores = computeSkillScores(framework);
  ["Reading","Listening","Writing","Speaking"].forEach(skill => {
    payload[`${framework} ${skill} Proficiency Can Do Statements`] = scores[skill];
    payload[framework === "ACTFL" ? "CEFRL" : "ACTFL" + " " + skill + " Proficiency Can Do Statements"] = "NA";
  });

  drawChart(scores);

  responseMsg.textContent = "Saving…";
  try {
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.result === "success") {
      responseMsg.textContent = "Thanks — your response was saved!";
      form.reset();
    } else {
      responseMsg.textContent = "Error: " + data.message;
    }
  } catch (err) {
    responseMsg.textContent = "Network error: " + err.message;
  }
});

function updateLabel(slider) {
  const levels = ["Beginner", "Intermediate", "Advanced", "Superior"];
  const label = document.getElementById(slider.id + "_label");
  label.textContent = levels[slider.value - 1];
}

/*
this is just a hanging fetch that executes at the very start of the page load -- I don't think it's useful 
(you just need a fetch for the form itself) and you already have that with your button listener above
*/

// fetch("/submit", {
//   method: "POST",
//   headers: { "Content-Type": "application/json" },
//   body: JSON.stringify(formData)
// })
//   .then(res => res.json())  // fails if Flask sends nothing
//   .then(data => console.log("Response:", data))
//   .catch(err => console.error("Network error:", err));