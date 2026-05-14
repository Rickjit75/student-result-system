let editingSubjects = [];
let pendingSubjects = [];
const API = "https://student-result-system-production-0eef.up.railway.app/api/students";
async function loadStudents() {
  const res = await fetch(API);
  const students = await res.json();
  const tbody = document.getElementById("tableBody");
  const thead = document.querySelector("thead tr");
  tbody.innerHTML = "";

  // Collect all unique extra subject names across all students
  const allExtraSubjects = new Set();
  students.forEach(s => {
    if (s.extraSubjects) {
      s.extraSubjects.forEach(sub => allExtraSubjects.add(sub.subjectName));
    }
  });
  const extraSubjectList = [...allExtraSubjects];

  // Rebuild table headers dynamically
  thead.innerHTML = `
    <th>Name</th>
    <th>Email</th>
    <th>Math</th>
    <th>Science</th>
    <th>English</th>
    ${extraSubjectList.map(name => `<th>${name}</th>`).join("")}
    <th>Average</th>
    <th>Grade</th>
    <th>Actions</th>
  `;

  // Dashboard stats
  let totalAvg = 0;
  let passCount = 0;
  let failCount = 0;

  students.forEach(s => {
    // Calculate average including extra subjects
    let total = s.mathMarks + s.scienceMarks + s.englishMarks;
    let count = 3;
    if (s.extraSubjects) {
      s.extraSubjects.forEach(sub => {
        total += sub.marks;
        count++;
      });
    }
    const avg = (total / count).toFixed(1);
    const gradeClass = parseFloat(avg) >= 90 ? 'a-plus' : parseFloat(avg) >= 75 ? 'a' : parseFloat(avg) >= 60 ? 'b' : parseFloat(avg) >= 45 ? 'c' : 'f';
    const grade = parseFloat(avg) >= 90 ? "A+" : parseFloat(avg) >= 75 ? "A" : parseFloat(avg) >= 60 ? "B" : parseFloat(avg) >= 45 ? "C" : "F";

    totalAvg += parseFloat(avg);
    if (parseFloat(avg) >= 45) passCount++;
    else failCount++;

    // Build extra subject cells — show marks if student has that subject, else "-"
    const extraCells = extraSubjectList.map(name => {
      const found = s.extraSubjects ? s.extraSubjects.find(sub => sub.subjectName === name) : null;
      return `<td>${found ? found.marks : "<span style='color:#aaa;'>-</span>"}</td>`;
    }).join("");

    tbody.innerHTML += `
      <tr>
        <td>${s.name}</td>
        <td>${s.email}</td>
        <td>${s.mathMarks}</td>
        <td>${s.scienceMarks}</td>
        <td>${s.englishMarks}</td>
        ${extraCells}
        <td>${avg}</td>
        <td class="grade-${gradeClass}">${grade}</td>
        <td>
          <button class="edit-btn" onclick='openEditModal(${JSON.stringify(s)})'>Edit</button>
          <button onclick="deleteStudent(${s.id})">Delete</button>
        </td>
      </tr>`;
  });

  // Update dashboard
  document.getElementById("totalStudents").textContent = students.length;
  document.getElementById("classAverage").textContent = students.length > 0 ? (totalAvg / students.length).toFixed(1) : 0;
  document.getElementById("passCount").textContent = passCount;
  document.getElementById("failCount").textContent = failCount;
}

async function addStudent() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const mathMarks = parseInt(document.getElementById("math").value);
  const scienceMarks = parseInt(document.getElementById("science").value);
  const englishMarks = parseInt(document.getElementById("english").value);

  if (!name || !email || isNaN(mathMarks) || isNaN(scienceMarks) || isNaN(englishMarks)) {
    alert("Please fill all fields correctly!");
    return;
  }

 const student = { 
    name, 
    email, 
    mathMarks, 
    scienceMarks, 
    englishMarks,
    extraSubjects: pendingSubjects.map(s => ({
      subjectName: s.subjectName,
      marks: s.marks
    }))
  };

  await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(student)
  });

  // Reset
  pendingSubjects = [];
  document.getElementById("extraSubjectsContainer").innerHTML = "";

  // Clear inputs
  document.getElementById("name").value = "";
  document.getElementById("email").value = "";
  document.getElementById("math").value = "";
  document.getElementById("science").value = "";
  document.getElementById("english").value = "";

  loadStudents();
}

// --- NEW EDIT FUNCTIONS ---



function openEditModal(student) {
  document.getElementById("editModal").style.display = "flex";
  document.getElementById("editId").value = student.id;
  document.getElementById("editName").value = student.name;
  document.getElementById("editEmail").value = student.email;
  document.getElementById("editMath").value = student.mathMarks;
  document.getElementById("editScience").value = student.scienceMarks;
  document.getElementById("editEnglish").value = student.englishMarks;

  // Load existing extra subjects
  editingSubjects = student.extraSubjects ? student.extraSubjects.map(s => ({
    id: s.id,
    subjectName: s.subjectName,
    marks: s.marks
  })) : [];
  renderEditSubjects();
}

function renderEditSubjects() {
  const container = document.getElementById("editExtraSubjectsContainer");
  container.innerHTML = "";
  editingSubjects.forEach((s, i) => {
    container.innerHTML += `
      <div class="extra-subject-row">
        <span>📚 ${s.subjectName}</span>
        <input type="number" value="${s.marks}" style="width:80px;margin:0 8px;padding:4px;"
          onchange="editingSubjects[${i}].marks = parseInt(this.value)">
        <button onclick="removeEditSubject(${i})">✕</button>
      </div>`;
  });
}

function addEditSubjectField() {
  document.getElementById("subjectModal").style.display = "flex";
  document.getElementById("subjectName").value = "";
  document.getElementById("subjectMarks").value = "";

  // Override confirm button temporarily for edit modal
  document.getElementById("subjectModal")
    .setAttribute("data-mode", "edit");
}

function removeEditSubject(index) {
  editingSubjects.splice(index, 1);
  renderEditSubjects();
}

function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
}

async function updateStudent() {
  const id = document.getElementById("editId").value;
  const student = {
    name: document.getElementById("editName").value,
    email: document.getElementById("editEmail").value,
    mathMarks: parseInt(document.getElementById("editMath").value),
    scienceMarks: parseInt(document.getElementById("editScience").value),
    englishMarks: parseInt(document.getElementById("editEnglish").value),
    extraSubjects: editingSubjects.map(s => ({
      id: s.id || null,
      subjectName: s.subjectName,
      marks: s.marks
    }))
  };

  await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(student)
  });

  closeEditModal();
  loadStudents();
}

// --- END EDIT FUNCTIONS ---

async function deleteStudent(id) {
  if (confirm("Are you sure you want to delete this student?")) {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    loadStudents();
  }
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  const btn = document.querySelector(".toggle-btn");
  if (document.body.classList.contains("dark")) {
    btn.textContent = "☀️"; // Small icon only
    localStorage.setItem("darkMode", "enabled");
  } else {
    btn.textContent = "🌙"; // Small icon only
    localStorage.setItem("darkMode", "disabled");
  }
}

// Remember user's preference
if (localStorage.getItem("darkMode") === "enabled") {
  document.body.classList.add("dark");
  const btn = document.querySelector(".toggle-btn");
  if(btn) btn.textContent = "☀️";
}
// Extra subjects for new student form


function addSubjectField() {
  document.getElementById("subjectModal").style.display = "flex";
  document.getElementById("subjectName").value = "";
  document.getElementById("subjectMarks").value = "";
}

function closeSubjectModal() {
  document.getElementById("subjectModal").style.display = "none";
}

function confirmAddSubject() {
  const name = document.getElementById("subjectName").value.trim();
  const marks = parseInt(document.getElementById("subjectMarks").value);
  if (!name || isNaN(marks)) {
    alert("Please enter subject name and marks!");
    return;
  }

  const mode = document.getElementById("subjectModal").getAttribute("data-mode");

  if (mode === "edit") {
    editingSubjects.push({ subjectName: name, marks: marks });
    renderEditSubjects();
  } else {
    pendingSubjects.push({ subjectName: name, marks: marks });
    renderPendingSubjects();
  }
  closeSubjectModal();
}

function renderPendingSubjects() {
  const container = document.getElementById("extraSubjectsContainer");
  container.innerHTML = "";
  pendingSubjects.forEach((s, i) => {
    container.innerHTML += `
      <div class="extra-subject-row">
        📚 ${s.subjectName}: ${s.marks} marks
        <button onclick="removePendingSubject(${i})">✕</button>
      </div>`;
  });
}

function removePendingSubject(index) {
  pendingSubjects.splice(index, 1);
  renderPendingSubjects();
}
loadStudents();