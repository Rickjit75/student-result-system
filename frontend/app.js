// ===== API ENDPOINTS =====
const API      = "https://student-result-system-production-0eef.up.railway.app/api/students";
const AUTH_API = "https://student-result-system-production-0eef.up.railway.app/api/auth";

// ===== STATE =====
let editingSubjects = [];
let pendingSubjects = [];
let activeClass   = localStorage.getItem('activeClass')   || '';
let activeSection = localStorage.getItem('activeSection') || '';

// =====================================================
// AUTH
// =====================================================

function switchAuthTab(tab) {
  document.getElementById('login-form').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
  document.querySelectorAll('.auth-tab').forEach((btn, i) => {
    btn.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });
  document.getElementById('auth-error').textContent = '';
}

async function doLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-pass').value;
  if (!email || !password) {
    document.getElementById('auth-error').textContent = 'Please fill in all fields.';
    return;
  }
  try {
    const res  = await fetch(`${AUTH_API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('teacher', JSON.stringify(data.teacher));
      enterApp(data.teacher);
    } else {
      document.getElementById('auth-error').textContent = data.message;
    }
  } catch (e) {
    document.getElementById('auth-error').textContent = 'Could not connect to server.';
  }
}

async function doRegister() {
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-pass').value;
  const school   = document.getElementById('reg-school').value.trim();
  if (!name || !email || !password || !school) {
    document.getElementById('auth-error').textContent = 'Please fill in all fields.';
    return;
  }
  if (password.length < 6) {
    document.getElementById('auth-error').textContent = 'Password must be at least 6 characters.';
    return;
  }
  try {
    const res  = await fetch(`${AUTH_API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, school })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('teacher', JSON.stringify(data.teacher));
      enterApp(data.teacher);
    } else {
      document.getElementById('auth-error').textContent = data.message;
    }
  } catch (e) {
    document.getElementById('auth-error').textContent = 'Could not connect to server.';
  }
}

function enterApp(teacher) {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('main-app').style.display    = 'block';
  document.getElementById('topbar-teacher-name').textContent = '👤 ' + teacher.name;

  if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark');
    const btn = document.querySelector('.toggle-btn');
    if (btn) btn.textContent = '☀️';
  }

  // Restore saved class & section
  if (activeClass) {
    document.getElementById('selected-class').value   = activeClass;
    document.getElementById('selected-section').value = activeSection;
    updateActiveBanner();
  }

  loadStudents();
}

function doLogout() {
  localStorage.removeItem('teacher');
  document.getElementById('main-app').style.display    = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value  = '';
  document.getElementById('auth-error').textContent = '';
  switchAuthTab('login');
}

// =====================================================
// CLASS & SECTION — confirm selection
// =====================================================

function confirmClassSection() {
  const cls = document.getElementById('selected-class').value;
  const sec = document.getElementById('selected-section').value;

  if (!cls || !sec) {
    alert('Please select both a Class and a Section.');
    return;
  }

  activeClass   = cls;
  activeSection = sec;
  localStorage.setItem('activeClass',   cls);
  localStorage.setItem('activeSection', sec);

  updateActiveBanner();
}

function updateActiveBanner() {
  const banner = document.getElementById('active-class-banner');
  const label  = document.getElementById('active-class-label');

  if (activeClass && activeSection) {
    label.textContent    = `Class ${activeClass} — Section ${activeSection}`;
    banner.style.display = 'block';
  } else {
    banner.style.display = 'none';
  }
}

// =====================================================
// STUDENTS — load & render
// =====================================================

async function loadStudents() {
  const res      = await fetch(API);
  const students = await res.json();
  const tbody    = document.getElementById("tableBody");
  const thead    = document.querySelector("thead tr");
  tbody.innerHTML = "";

  const allExtraSubjects = new Set();
  students.forEach(s => {
    if (s.extraSubjects) {
      s.extraSubjects.forEach(sub => allExtraSubjects.add(sub.subjectName));
    }
  });
  const extraSubjectList = [...allExtraSubjects];

  thead.innerHTML = `
    <th>Name</th>
    <th>Email</th>
    <th>Class</th>
    <th>Section</th>
    <th>Math</th>
    <th>Science</th>
    <th>English</th>
    ${extraSubjectList.map(n => `<th>${n}</th>`).join("")}
    <th>Average</th>
    <th>Grade</th>
    <th>Actions</th>
  `;

  let totalAvg = 0, passCount = 0, failCount = 0;

  students.forEach(s => {
    let total = s.mathMarks + s.scienceMarks + s.englishMarks;
    let count = 3;
    if (s.extraSubjects) {
      s.extraSubjects.forEach(sub => { total += sub.marks; count++; });
    }
    const avg        = (total / count).toFixed(1);
    const gradeClass = parseFloat(avg) >= 90 ? 'a-plus'
                     : parseFloat(avg) >= 75 ? 'a'
                     : parseFloat(avg) >= 60 ? 'b'
                     : parseFloat(avg) >= 45 ? 'c' : 'f';
    const grade      = parseFloat(avg) >= 90 ? "A+"
                     : parseFloat(avg) >= 75 ? "A"
                     : parseFloat(avg) >= 60 ? "B"
                     : parseFloat(avg) >= 45 ? "C" : "F";

    totalAvg += parseFloat(avg);
    if (parseFloat(avg) >= 45) passCount++;
    else failCount++;

    const extraCells = extraSubjectList.map(name => {
      const found = s.extraSubjects
        ? s.extraSubjects.find(sub => sub.subjectName === name)
        : null;
      return `<td>${found ? found.marks : "<span style='color:#aaa;'>-</span>"}</td>`;
    }).join("");

    // Show class & section from student record, fallback to stored
    const studentClass   = s.studentClass   || s.classLabel   || '—';
    const studentSection = s.studentSection || s.sectionLabel || '—';

    tbody.innerHTML += `
      <tr>
        <td>${s.name}</td>
        <td>${s.email}</td>
        <td><span class="class-badge">${studentClass}</span></td>
        <td><span class="section-badge">${studentSection}</span></td>
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

  document.getElementById("totalStudents").textContent =
    students.length;
  document.getElementById("classAverage").textContent  =
    students.length > 0 ? (totalAvg / students.length).toFixed(1) : 0;
  document.getElementById("passCount").textContent = passCount;
  document.getElementById("failCount").textContent = failCount;
}

// =====================================================
// STUDENTS — add
// =====================================================

async function addStudent() {
  const name         = document.getElementById("name").value;
  const email        = document.getElementById("email").value;
  const mathMarks    = parseInt(document.getElementById("math").value);
  const scienceMarks = parseInt(document.getElementById("science").value);
  const englishMarks = parseInt(document.getElementById("english").value);

  if (!name || !email || isNaN(mathMarks) || isNaN(scienceMarks) || isNaN(englishMarks)) {
    alert("Please fill all student fields correctly!");
    return;
  }

  if (!activeClass || !activeSection) {
    alert("Please select a Class and Section first and click +ADD.");
    return;
  }

  if (document.getElementById('dup-warning').style.display === 'block') {
    alert("Please use a different email — this one is already registered.");
    return;
  }

  const student = {
    name,
    email,
    mathMarks,
    scienceMarks,
    englishMarks,
    studentClass:   `Class ${activeClass}`,
    studentSection: activeSection,
    extraSubjects: pendingSubjects.map(s => ({
      subjectName: s.subjectName,
      marks: s.marks
    }))
  };

  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(student)
  });

  if (res.status === 409) {
    document.getElementById('dup-warning').style.display = 'block';
    return;
  }

  // Reset only student fields — class & section stay
  pendingSubjects = [];
  document.getElementById("extraSubjectsContainer").innerHTML = "";
  document.getElementById("name").value    = "";
  document.getElementById("email").value   = "";
  document.getElementById("math").value    = "";
  document.getElementById("science").value = "";
  document.getElementById("english").value = "";
  document.getElementById("dup-warning").style.display = 'none';

  loadStudents();
}

// =====================================================
// DUPLICATE EMAIL CHECK
// =====================================================

let dupCheckTimeout = null;

async function checkDuplicateEmail() {
  const email   = document.getElementById('email').value.trim();
  const warning = document.getElementById('dup-warning');
  if (!email) { warning.style.display = 'none'; return; }
  clearTimeout(dupCheckTimeout);
  dupCheckTimeout = setTimeout(async () => {
    try {
      const res  = await fetch(`${API}/check-email?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      warning.style.display = data.exists ? 'block' : 'none';
    } catch (e) {
      warning.style.display = 'none';
    }
  }, 400);
}

// =====================================================
// STUDENTS — edit modal
// =====================================================

function openEditModal(student) {
  document.getElementById("editModal").style.display = "flex";
  document.getElementById("editId").value      = student.id;
  document.getElementById("editName").value    = student.name;
  document.getElementById("editEmail").value   = student.email;
  document.getElementById("editMath").value    = student.mathMarks;
  document.getElementById("editScience").value = student.scienceMarks;
  document.getElementById("editEnglish").value = student.englishMarks;
  editingSubjects = student.extraSubjects
    ? student.extraSubjects.map(s => ({ id: s.id, subjectName: s.subjectName, marks: s.marks }))
    : [];
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
  document.getElementById("subjectName").value  = "";
  document.getElementById("subjectMarks").value = "";
  document.getElementById("subjectModal").setAttribute("data-mode", "edit");
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
    name:          document.getElementById("editName").value,
    email:         document.getElementById("editEmail").value,
    mathMarks:     parseInt(document.getElementById("editMath").value),
    scienceMarks:  parseInt(document.getElementById("editScience").value),
    englishMarks:  parseInt(document.getElementById("editEnglish").value),
    extraSubjects: editingSubjects.map(s => ({
      id: s.id || null, subjectName: s.subjectName, marks: s.marks
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

// =====================================================
// STUDENTS — delete
// =====================================================

async function deleteStudent(id) {
  if (confirm("Are you sure you want to delete this student?")) {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    loadStudents();
  }
}

// =====================================================
// EXTRA SUBJECTS
// =====================================================

function addSubjectField() {
  document.getElementById("subjectModal").style.display = "flex";
  document.getElementById("subjectName").value  = "";
  document.getElementById("subjectMarks").value = "";
  document.getElementById("subjectModal").removeAttribute("data-mode");
}

function closeSubjectModal() {
  document.getElementById("subjectModal").style.display = "none";
}

function confirmAddSubject() {
  const name  = document.getElementById("subjectName").value.trim();
  const marks = parseInt(document.getElementById("subjectMarks").value);
  if (!name || isNaN(marks)) { alert("Please enter subject name and marks!"); return; }
  const mode = document.getElementById("subjectModal").getAttribute("data-mode");
  if (mode === "edit") {
    editingSubjects.push({ subjectName: name, marks });
    renderEditSubjects();
  } else {
    pendingSubjects.push({ subjectName: name, marks });
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

// =====================================================
// DARK MODE
// =====================================================

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  const btn = document.querySelector(".toggle-btn");
  if (document.body.classList.contains("dark")) {
    btn.textContent = "☀️";
    localStorage.setItem("darkMode", "enabled");
  } else {
    btn.textContent = "🌙";
    localStorage.setItem("darkMode", "disabled");
  }
}

// =====================================================
// BOOT
// =====================================================

const savedTeacher = localStorage.getItem('teacher');
if (savedTeacher) {
  enterApp(JSON.parse(savedTeacher));
} else {
  document.getElementById('auth-screen').style.display = 'flex';
}
