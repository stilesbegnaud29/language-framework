// static/frontend.js

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylFZ7kjI23ba9hTrIwuVTGEBCET0cVLMrdYGuNem1EUjBTeYs40xssT1y2M_bpnGK3/exec"

const form = document.getElementById("assessmentForm");
const startTime = Date.now();
const timeElapsedSpan = document.getElementById("time-elapsed");
const responseMsg = document.getElementById("responseMsg");
const chartArea = document.getElementById("chart-area");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const pdfDownloadSection = document.getElementById("pdf-download-section");
let chartInstance = null;
let currentScores = null;
let currentFramework = null;



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


// Direct form submission
form.addEventListener("submit", (ev) => {
  ev.preventDefault();
  
  // Compute chosen framework and scores, then draw the chart so the user sees results on submit.
  const framework = document.querySelector('input[name="framework"]:checked').value || "ACTFL";
  const scores = computeSkillScores(framework);

  // Store scores and framework for PDF generation when button is clicked
  currentScores = scores;
  currentFramework = framework;

  // Draw the chart immediately (chartArea will be made visible inside drawChart)
  drawChart(scores, framework);

  // Show the PDF download button
  pdfDownloadSection.style.display = "block";

  // metadata as hidden fields (these are appended before the browser completes the submit)
  const timeField = document.createElement("input");
  timeField.type = "hidden";
  timeField.name = "time_taken_seconds";
  timeField.value = Math.floor((Date.now() - startTime) / 1000);
  form.appendChild(timeField);

  const dateField = document.createElement("input");
  dateField.type = "hidden";
  dateField.name = "Completion_Date";
  dateField.value = new Date().toISOString().slice(0,10);
  form.appendChild(dateField);

  // highest skill levels computed -> added as hidden fields for submission
  ["Reading","Listening","Writing","Speaking"].forEach(skill => {
    const f = document.createElement("input");
    f.type = "hidden";
    f.name = `${framework} ${skill} Proficiency Can Do Statements`;
    f.value = scores[skill];
    form.appendChild(f);
  });

  // Submit the form after a short delay to allow chart to render
  setTimeout(() => {
    form.submit();
  }, 500);
});

// Handle PDF download button click
downloadPdfBtn.addEventListener("click", (ev) => {
  ev.preventDefault();
  generateResponsePDF(currentScores, currentFramework);
});


// Old method: uses a fetch request

// form.addEventListener("submit", async (ev) => {
//   ev.preventDefault();

//   // collect all form data
//   const formData = new FormData(form);

//   // capture numeric fields
//   [
//     "years_elementary","years_junior","years_high_school","years_university",
//     "years_institutes","age","self_reading","self_listening",
//     "self_writing","self_speaking"
//   ].forEach(f => {
//     const val = formData.get(f);
//     formData.set(f, val ? Number(val) : 0); // 0 if no input
//   });

//   // add metadata
//   formData.set("time_taken_seconds", Math.floor((Date.now() - startTime) / 1000));
//   formData.set("Completion_Date", new Date().toISOString().slice(0,10));

//   const framework = formData.get("framework") || "ACTFL";

//   // compute scores for the shown block
//   const scores = computeSkillScores(framework);
//   ["Reading","Listening","Writing","Speaking"].forEach(skill => {
//     formData.set(`${framework} ${skill} Proficiency Can Do Statements`, scores[skill]);
//   });

//   // set scores for second block as NA
//   const other = framework === "CEFRL" ? "ACTFL" : "CEFRL";
//   ["Reading","Listening","Writing","Speaking"].forEach(skill => {
//     formData.set(`${other} ${skill} Proficiency Can Do Statements`, "NA");
//   });

//   // add checkbox values individually by name
//   document.querySelectorAll('input[type="checkbox"][name]').forEach(cb => {
//     formData.set(cb.name, cb.checked ? 1 : 0);
//   });

//   // include self-ratings
//   formData.set("Rate your reading proficiency", formData.get("self_reading"));
//   formData.set("Rate your listening proficiency", formData.get("self_listening"));
//   formData.set("Rate your writing proficiency", formData.get("self_writing"));
//   formData.set("Rate your speaking proficiency", formData.get("self_speaking"));

//   // draw chart for chosen framework
//   drawChart(scores, framework);

//   // send to Google App script; converted from json to text to bypass cors issues
//   responseMsg.textContent = "Saving…";
//   try {
//     const res = await fetch(GOOGLE_SCRIPT_URL, {
//       method: "POST",
//       body: formData
//     });

//     const text = await res.text();
//     responseMsg.textContent = "Thanks — your response was saved!";
//     form.reset();
//   }
//   catch (err) {
//     responseMsg.textContent = "Network error: " + err.message;
//   }
// });

function updateLabel(slider) {
  const levels = ["Beginner", "Intermediate", "Advanced", "Superior"];
  const label = document.getElementById(slider.id + "_label");
  label.textContent = levels[slider.value - 1];
}

// Generate PDF of user responses
function generateResponsePDF(scores, framework) {
  const formData = new FormData(form);
  const timestamp = new Date().toLocaleString();
  
  // Collect all checked checkboxes grouped by skill
  const checkedBoxes = {};
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    if (cb.checked) {
      const skill = cb.closest('.checkbox-list').getAttribute('data-skill');
      const fw = cb.closest('.checkbox-list').getAttribute('data-framework');
      const key = `${fw} ${skill}`;
      
      if (!checkedBoxes[key]) {
        checkedBoxes[key] = [];
      }
      checkedBoxes[key].push(cb.parentElement.textContent.trim());
    }
  });
  
  // Build checkbox responses HTML
  let checkboxesHTML = '';
  Object.keys(checkedBoxes).forEach(key => {
    checkboxesHTML += `<h3 style="margin-top: 15px; margin-bottom: 10px; color: #0074d9;">${key}</h3>`;
    checkboxesHTML += '<ul style="margin: 0; padding-left: 20px;">';
    checkedBoxes[key].forEach(label => {
      checkboxesHTML += `<li style="margin-bottom: 8px; line-height: 1.4;">${label}</li>`;
    });
    checkboxesHTML += '</ul>';
  });
  
  // Create HTML content for PDF
  let pdfContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h1>French Language Self-Assessment Results</h1>
      <p><strong>Generated:</strong> ${timestamp}</p>
      
      <hr style="margin: 20px 0;">
      
      <h2>Basic Information</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Native Languages:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${formData.get('native_languages') || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Age:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${formData.get('age') || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>French Speaking Environment:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${formData.get('speaking_environment') || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Highest Level of Education:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${formData.get('education') || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Other Education (if specified):</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${formData.get('other_education') || 'Not provided'}</td>
        </tr>
      </table>
      
      <h2 style="margin-top: 20px;">French Learning Experience (Years)</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Elementary School:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${formData.get('years_elementary') || '0'} years</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Middle/Junior High School:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${formData.get('years_junior') || '0'} years</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>High School:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${formData.get('years_high_school') || '0'} years</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>University/College:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${formData.get('years_university') || '0'} years</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Language Institutes:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${formData.get('years_institutes') || '0'} years</td>
        </tr>
      </table>
      
      <h2 style="margin-top: 20px;">Self-Rated Proficiency (1-4 Scale)</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Reading:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${formData.get('self_reading') || 'Not rated'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Listening:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${formData.get('self_listening') || 'Not rated'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Writing:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${formData.get('self_writing') || 'Not rated'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Speaking:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${formData.get('self_speaking') || 'Not rated'}</td>
        </tr>
      </table>
      
      <h2 style="margin-top: 20px;">Assessment Results</h2>
      <p><strong>Framework Used:</strong> ${framework}</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background-color: #f0f0f0;">
          <th style="padding: 10px; border: 1px solid #ddd;">Skill</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Level</th>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Reading</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${scores.Reading}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Listening</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${scores.Listening}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Writing</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${scores.Writing}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Speaking</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${scores.Speaking}</td>
        </tr>
      </table>
      
      <h2 style="margin-top: 20px;">${framework} Proficiency Statements - Checked Responses</h2>
      <p><em>The user checked the following "Can Do" statements:</em></p>
      ${checkboxesHTML || '<p style="color: #999;">No proficiency statements were selected.</p>'}
      
      <h2 style="margin-top: 20px;">Additional Information</h2>
      <p><strong>Data Sharing Consent:</strong> ${formData.get('consent') || 'Not provided'}</p>
      <p><strong>Feedback:</strong></p>
      <p style="margin-top: 5px; padding: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">${formData.get('feedback') ? formData.get('feedback').replace(/\n/g, '<br>') : 'No feedback provided'}</p>
    </div>
  `;
  
  // Generate PDF using html2pdf
  const element = document.createElement('div');
  element.innerHTML = pdfContent;
  
  const opt = {
    margin: 10,
    filename: `French_Assessment_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
  };
  
  html2pdf().set(opt).from(element).save();
}