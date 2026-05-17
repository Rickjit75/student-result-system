// ===== API ENDPOINTS =====
const API       = "https://student-result-system-production-0eef.up.railway.app/api/students";
const AUTH_API  = "https://student-result-system-production-0eef.up.railway.app/api/auth";
const CLASS_API = "https://student-result-system-production-0eef.up.railway.app/api/classes";

// ===== STATE =====
let editingSubjects = [];
let pendingSubjects = [];

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
    document.getElementById('auth-error').textContent = 'Could not connect to server. Please try again.';
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
    document.getElementById('auth-error').textContent = 'Could not connect to server. Please try again.';
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

  populateClassDropdown();
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
// CLASS & SECTION SELECTOR
// =====================================================

async function populateClassDropdown() {
  try {
    const res     = await fetch(CLASS_API);
    const classes = await res.json();
    const sel     = document.getElementById('selected-class');
    const savedId = localStorage.getItem('selectedClassId');

    sel.innerHTML = '<option value="">— Select Class —</option>' +
      classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    if (savedId) {
      sel.value = savedId;
      await onClassChange(true);
    }

    renderInlineClassList(classes);
  } catch (e) {
    console.error('Could not load classes:', e);
  }
}

async function onClassChange(restoreSection) {
  const classId = document.getElementById('selected-class').value;
  const secSel  = document.getElementById('selected-section');

  secSel.innerHTML = '<option value="">— Select Section —</option>';
  document.getElementById('active-class-banner').style.display = 'none';

  if (!classId) {
    localStorage.removeItem('selectedClassId');
    localStorage.removeItem('selectedSection');
    return;
  }

  localStorage.setItem('selectedClassId', classId);

  try {
    const res      = await fetch(`${CLASS_API}/${classId}/sections`);
    const sections = await res.json();
    sections.forEach(s => {
      secSel.innerHTML += `<option value="${s.name}">${s.name}</option>`;
    });

    const savedSection = localStorage.getItem('selectedSection');
    if (restoreSection && savedSection) {
      secSel.value = savedSection;
    }
  } catch (e) {
    console.error('Could not load sections:', e);
  }

  updateActiveBanner();
}

function onSectionChange() {
  const section = document.getElementById('selected-section').value;
  if (section) localStorage.setItem('selectedSection', section);
  else localStorage.removeItem('selectedSection');
  updateActiveBanner();
}

function updateActiveBanner() {
  const classSelect   = document.getElementById('selected-class');
  const sectionSelect = document.getElementById('selected-section');
  const banner        = document.getElementById('active-class-banner');
  const label         = document.getElementById('active-class-label');

  const className = classSelect.options[classSelect.selectedIndex]?.text;
  const section   = sectionSelect.value;

  if (classSelect.value && section) {
    label.textContent = `${className} — Section ${section}`;
    banner.style.display = 'block';
  } else {
    banner.style.display = 'none';
  }
}

// =====================================================
// INLINE CLASS MANAGEMENT
// =====================================================

function renderInlineClassList(classes) {
  const container = document.getElementById('classes-inline-list');
  if (!classes.length) {
    container.innerHTML = '<p class="no-classes-msg">No classes yet. Add one above.</p>';
    return;
  }

  container.innerHTML = classes.map(c => `
    <div class="inline-class-item">
      <div class="inline-class-header">
        <span class="inline-class-name">🏫 ${c.name}</span>
        <button class="delete-class-btn" onclick="deleteClassAPI(${c.id})">Delete</button>
      </div>
      <div class="inline-sections">
        ${(c.sections && c.sections.length)
          ? c.sections.map(s => `
              <span class="section-chip">
                Section ${s.name}
                <button onclick="deleteSectionAPI(${s.id})">✕</button>
              </span>`).join('')
          : '<span style="color:#aaa;font-size:12px;">No sections yet</span>'
        }
      </div>
      <div class="add-section-inline">
        <input id="sec-inp-${c.id}" placeholder="Add section (e.g. A)"
          onkeydown="if(event.key==='Enter') addSectionAPI(${c.id})">
        <button onclick="addSectionAPI(${c.id})">+ Section</button>
      </div>
    </div>
  `).join('');
}

async function addClassAPI() {
  const name = document.getElementById('new-class-name').value.trim();
  if (!name) return;

  const res = await fetch(CLASS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });

  if (res.status === 409 || !res.ok) {
    alert('A class with this name already exists!');
    return;
  }

  document.getElementById('new-class-name').value = '';
  await populateClassDropdown();
}

async function deleteClassAPI(id) {
  if (!confirm('Delete this class and all its sections?')) return;
  await fetch(`${CLASS_API}/${id}`, { method: 'DELETE' });
  await populateClassDropdown();
}

async function addSectionAPI(classId) {
  const input = document.getElementById(`sec-inp-${classId}`);
  const name  = input.value.trim();
  if (!name) return;

  await fetch(`${CLASS_API}/${classId}/sections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });

  input.value = '';
  await populateClassDropdown();
}

async function deleteSectionAPI(sectionId) {
  await fetch(`${CLASS_API}/sections/${sectionId}`, { method: 'DELETE' });
  await populateClassDropdown();
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
    <th>Math</th>
    <th>Science</th>
    <th>English</th>
    ${extraSubjectList.map(name => `<th>${name}</th>`).join("")}
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
  const classId      = document.getElementById("selected-class").value;
  const section      = document.getElementById("selected-section").value;

  if (!name || !email || isNaN(mathMarks) || isNaN(scienceMarks) || isNaN(englishMarks)) {
    alert("Please fill all student fields correctly!");
    return;
  }

  if (!classId || !section) {
    alert("Please select a Class and Section at the top before adding a student.");
    return;
  }

  if (document.getElementById('dup-warning').style.display === 'block') {
    alert("Please use a different email — this one is already registered.");
    return;
  }

  const student = {
    name, email, mathMarks, scienceMarks, englishMarks,
    classId: parseInt(classId),
    section,
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

  // Reset only student fields — class & section stay selected
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
  const id      = document.getElementById("editId").value;
  const student = {
    name:          document.getElementById("editName").value,
    email:         document.getElementById("editEmail").value,
    mathMarks:     parseInt(document.getElementById("editMath").value),
    scienceMarks:  parseInt(document.getElementById("editScience").value),
    englishMarks:  parseInt(document.getElementById("editEnglish").value),
    extraSubjects: editingSubjects.map(s => ({
      id:          s.id || null,
      subjectName: s.subjectName,
      marks:       s.marks
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
  if (!name || isNaN(marks)) {
    alert("Please enter subject name and marks!");
    return;
  }

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
