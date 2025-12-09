// static/frontend.js

const GOOGLE_SCRIPT_URL = "https://script.google.com/u/0/home/projects/1LVB7w9XJUDv_DL5lQpRNZEVHSVRMhcJPx7YB4rVSWXFW63c5BNt-o5oG/edit?pli=1"

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
    const actflBlock = document.getElementById("actfl-block");
    const cefrlBlock = document.getElementById("cefrl-block");
    
    if (val === "ACTFL") {
      actflBlock.style.display = "block";
      cefrlBlock.style.display = "none";
    } else if (val === "CEFRL") {
      actflBlock.style.display = "none";
      cefrlBlock.style.display = "block";
    }
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
        backgroundColor: '#4a90c8'
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

// Validation function to check if all required fields are filled
function validateForm() {
  const errors = [];
  
  // Check native language
  const nativeLanguage = document.querySelector('input[name="native_languages"]').value.trim();
  if (!nativeLanguage) {
    errors.push("Please enter your native language(s)");
  }
  
  // Check age
  const age = document.querySelector('input[name="age"]').value;
  if (!age || age <= 0) {
    errors.push("Please enter your age");
  }
  
  // Check French speaking environment question
  const speakingEnvironment = document.querySelector('input[name="speaking_environment"]:checked');
  if (!speakingEnvironment) {
    errors.push("Please answer whether you live in a French speaking environment");
  }
  
  // Check education level
  const education = document.querySelector('select[name="education"]').value;
  if (education === "Select Level") {
    errors.push("Please select your level of education");
  }
  
  // Check if a framework is selected
  const framework = document.querySelector('input[name="framework"]:checked');
  if (!framework) {
    errors.push("Please select a language framework (ACTFL or CEFRL)");
  } else {
    // Check if all four skills have at least one checkbox checked
    const frameworkValue = framework.value;
    const skills = ["Reading", "Listening", "Writing", "Speaking"];
    const scores = computeSkillScores(frameworkValue);
    
    skills.forEach(skill => {
      if (scores[skill] === 0) {
        errors.push(`Please complete at least one checkbox for ${skill} in ${frameworkValue}`);
      }
    });
  }
  
  // Check consent question
  const consent = document.querySelector('input[name="consent"]:checked');
  if (!consent) {
    errors.push("Please answer the data sharing consent question");
  }
  
  return errors;
}


// Direct form submission
form.addEventListener("submit", (ev) => {
  ev.preventDefault();
  
  // Validate form before submission
  const validationErrors = validateForm();
  if (validationErrors.length > 0) {
    alert("Please complete all required fields:\n\n" + validationErrors.join("\n"));
    return;
  }
  
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
    f.name = `${framework}_${skill}_Proficiency_Can_Do_Statements`;
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
  
  // Create HTML content for PDF (include minimal print-friendly CSS)
  let pdfContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; font-size: 12px; line-height: 1.4; color: #000; background: #fff;">
      <style>
        * { box-sizing: border-box; }
        h1 { font-size: 20px; margin: 0 0 8px 0; }
        h2 { font-size: 14px; margin: 14px 0 8px 0; }
        h3 { font-size: 12px; margin: 10px 0 6px 0; color: #0074d9; }
        p { margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        td, th { padding: 6px; border: 1px solid #ddd; vertical-align: top; }
        .avoid-break { break-inside: avoid; page-break-inside: avoid; }
        .html2pdf__page-break { height: 0; break-after: page; page-break-after: always; }
      </style>
      <h1>French Language Self-Assessment Results</h1>
      <p><strong>Generated:</strong> ${timestamp}</p>
      
      <hr style="margin: 20px 0;">
      
      <h2>Basic Information</h2>
      <table class="avoid-break">
        <tr>
          <td><strong>Native Languages:</strong></td>
          <td>${formData.get('native_languages') || 'Not provided'}</td>
        </tr>
        <tr>
          <td><strong>Age:</strong></td>
          <td>${formData.get('age') || 'Not provided'}</td>
        </tr>
        <tr>
          <td><strong>French Speaking Environment:</strong></td>
          <td>${formData.get('speaking_environment') || 'Not provided'}</td>
        </tr>
        <tr>
          <td><strong>Highest Level of Education:</strong></td>
          <td>${formData.get('education') || 'Not provided'}</td>
        </tr>
        <tr>
          <td><strong>Other Education (if specified):</strong></td>
          <td>${formData.get('other_education') || 'Not provided'}</td>
        </tr>
      </table>
      
      <h2>French Learning Experience (Years)</h2>
      <table class="avoid-break">
        <tr>
          <td><strong>Elementary School:</strong></td>
          <td>${formData.get('years_elementary') || '0'} years</td>
        </tr>
        <tr>
          <td><strong>Middle/Junior High School:</strong></td>
          <td>${formData.get('years_junior') || '0'} years</td>
        </tr>
        <tr>
          <td><strong>High School:</strong></td>
          <td>${formData.get('years_high_school') || '0'} years</td>
        </tr>
        <tr>
          <td><strong>University/College:</strong></td>
          <td>${formData.get('years_university') || '0'} years</td>
        </tr>
        <tr>
          <td><strong>Language Institutes:</strong></td>
          <td>${formData.get('years_institutes') || '0'} years</td>
        </tr>
      </table>
      
      <h2>Self-Rated Proficiency (1-4 Scale)</h2>
      <table class="avoid-break">
        <tr>
          <td><strong>Reading:</strong></td>
          <td>${formData.get('self_reading') || 'Not rated'}</td>
        </tr>
        <tr>
          <td><strong>Listening:</strong></td>
          <td>${formData.get('self_listening') || 'Not rated'}</td>
        </tr>
        <tr>
          <td><strong>Writing:</strong></td>
          <td>${formData.get('self_writing') || 'Not rated'}</td>
        </tr>
        <tr>
          <td><strong>Speaking:</strong></td>
          <td>${formData.get('self_speaking') || 'Not rated'}</td>
        </tr>
      </table>
      
      <h2>Assessment Results</h2>
      <p><strong>Framework Used:</strong> ${framework}</p>
      <table class="avoid-break">
        <tr style="background-color: #f0f0f0;">
          <th>Skill</th>
          <th>Level</th>
        </tr>
        <tr>
          <td><strong>Reading</strong></td>
          <td>${scores.Reading}</td>
        </tr>
        <tr>
          <td><strong>Listening</strong></td>
          <td>${scores.Listening}</td>
        </tr>
        <tr>
          <td><strong>Writing</strong></td>
          <td>${scores.Writing}</td>
        </tr>
        <tr>
          <td><strong>Speaking</strong></td>
          <td>${scores.Speaking}</td>
        </tr>
      </table>

      <div class="html2pdf__page-break"></div>
      
      <h2>${framework} Proficiency Statements - Checked Responses</h2>
      <p><em>The user checked the following "Can Do" statements:</em></p>
      ${checkboxesHTML || '<p style="color: #999;">No proficiency statements were selected.</p>'}
      
      <h2>Additional Information</h2>
      <p><strong>Data Sharing Consent:</strong> ${formData.get('consent') || 'Not provided'}</p>
      <p><strong>Feedback:</strong></p>
      <p style="margin-top: 5px; padding: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">${formData.get('feedback') ? formData.get('feedback').replace(/\n/g, '<br>') : 'No feedback provided'}</p>
    </div>
  `;
  
  // Generate PDF using html2pdf (attach element to DOM and enforce sizing)
  const element = document.createElement('div');
  element.innerHTML = pdfContent;
  // Constrain width under A4 content area to avoid left cut-off
  element.style.width = '1000px';
  element.style.background = '#ffffff';
  element.style.color = '#000000';
  element.style.margin = '0 auto';
  // Nudge content to the right a bit to avoid left-edge clipping
  // Shift content slightly left (more right padding than left)
  element.style.padding = '0 50px 0 250px';
  document.body.appendChild(element);

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `French_Assessment_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true, 
      letterRendering: true, 
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4', compress: true },
    pagebreak: { mode: ['css', 'legacy', 'avoid-all'] }
  };

  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      // Cleanup the temporary element after generation
      document.body.removeChild(element);
    });
}