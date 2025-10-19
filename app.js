const gradePoints = {
    'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0
};
let realSemesters = [];
let projectionSemesters = [];
let currentSemesterInPopup = null;
let isProjectionPopup = false;

/*========SERVER → CLIENT BRIDGE========*/
window.importSemestersFromServer = function (serverList) {
  realSemesters = serverList.map(s => ({
    id: s._id,
    title: s.title,
    part: s.part,
    semester: s.semester,
    courses: s.courses || [],
    totalUnits: s.totalUnits || 0,
    totalPoints: s.totalPoints || 0,
    gpa: s.gpa || 0
  }));

  realSemesters.forEach(sem => renderSemesterCard(sem, false));
  updateDashboardTotals();
  updateProjectionSemesters();
};

function init() {
    loadTheme();
    updateDashboardTotals();
    setupEventListeners();
    loadPlaymodeData();
    showView('dashboard');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggle(savedTheme);
}

function updateThemeToggle(theme) {
    const toggle = document.getElementById('themeToggle');
    toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

window.createDefaultSemester = async function () {
    const defaultSemester = {
        id: generateId(),
        title: 'Part 1 | HAMATERN',
        part: 'Part 1',
        semester: 'HAMATERN',
        courses: [],
        totalUnits: 0,
        totalPoints: 0,
        gpa: 0
    };
    try {
        const remote = await API.createSemester(defaultSemester)
        defaultSemester.id = remote._id;
    } catch (e) {
        console.warn('could not create semester on server – keeping local copy')
    }
    realSemesters.push(defaultSemester);
    renderSemesterCard(defaultSemester, false);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function setupEventListeners() {
    document.getElementById('addSemester').addEventListener('click', () => openSemesterForm(false));
    document.getElementById('addProjection').addEventListener('click', () => openSemesterForm(true));
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    //document.getElementById('confirmSemester').addEventListener('click', confirmSemester);
    document.getElementById('cancelSemester').addEventListener('click', closeSemesterForm);
    
    document.getElementById('addCourseBtn').addEventListener('click', addCourseRow);
    document.getElementById('calcGpaBtn').addEventListener('click', calculateSemesterGPA);
    document.getElementById('closeCalc').addEventListener('click', closeCalculator);
    
    document.getElementById('playmodeAddCourse').addEventListener('click', addPlaymodeCourse);
    document.getElementById('playmodeCalculate').addEventListener('click', calculatePlaymodeGPA);
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.dataset.view;
            showView(view);
        });
    });
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeToggle(newTheme);
}

function showView(view) {
    const dashboard = document.querySelector('.dashboard-main');
    const playmode = document.getElementById('playmode-area');
    const settings = document.getElementById('settings-section');
    const navBtns = document.querySelectorAll('.nav-btn');
    const cgpaCircle = document.getElementById('cgpaCircleContainer');
    
    // Hide all views first
    dashboard.classList.add('hidden');
    playmode.classList.add('hidden');
    settings.classList.add('hidden');
    
    // Show the selected one
    if (view === 'dashboard') {
        dashboard.classList.remove('hidden');
        cgpaCircle?.classList.remove('hidden'); // show CGPA tracker
    }
    else if (view === 'playmode') {
        playmode.classList.remove('hidden');
        cgpaCircle?.classList.add('hidden'); // hide CGPA tracker
    }
    else if (view === 'settings') {
        settings.classList.remove('hidden');
        cgpaCircle?.classList.add('hidden'); // hide CGPA tracker
    }
    
    // Update nav button states
    navBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
}

function openSemesterForm(isProjection) {
    isProjectionPopup = isProjection;
    document.getElementById('semesterFormPopup').classList.remove('hidden');
}

function closeSemesterForm() {
    document.getElementById('semesterFormPopup').classList.add('hidden');
}

async function confirmSemester() {
    const part = document.getElementById('partSelect').value;
    const semester = document.getElementById('semesterSelect').value;
    const title = `${part} | ${semester}`;
    
    const semesterObj = {
        id: generateId(),
        title,
        part,
        semester,
        courses: [],
        totalUnits: 0,
        totalPoints: 0,
        gpa: 0
    };
    

    if (isProjectionPopup) {
        projectionSemesters.push(semesterObj);
        renderSemesterCard(semesterObj, true);
    } else {
       try {
            const remote = await API.createSemester(semesterObj);
            semesterObj.id = remote._id;
        } catch (e) {
            console.warn('Could not create semester on server – keeping local only', err);
        }
        realSemesters.push(semesterObj);
        renderSemesterCard(semesterObj, false);
    }
}

function renderSemesterCard(semester, isProjection) {
    const container = isProjection ? 
        document.getElementById('projection-list') : 
        document.getElementById('semester-list');
    
    const strength = getStrengthLevel(semester.gpa);
    
    const card = document.createElement('div');
    card.className = isProjection ? 'projection-card' : 'semester-card';
    card.dataset.id = semester.id;
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-title">${semester.title}</div>
            <div class="card-actions">
                <button class="btn-secondary edit-btn">Edit</button>
                <button class="btn-secondary delete-btn">🗑️Delete</button>
            </div>
        </div>
        <div class="card-stats">
            <div class="stat-item">
                <div class="stat-label">GPA</div>
                <div class="stat-value">${semester.gpa.toFixed(2)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Units</div>
                <div class="stat-value">${semester.totalUnits}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Points</div>
                <div class="stat-value">${semester.totalPoints.toFixed(1)}</div>
            </div>
            ${isProjection ? `
            <div class="stat-item">
                <div class="stat-label">Projected CGPA</div>
                <div class="stat-value">${calculateProjectedCGPA(semester).toFixed(2)}</div>
            </div>
            ` : ''}
        </div>
        <div class="strength-meter strength-${strength}">${strength.charAt(0).toUpperCase() + strength.slice(1)}</div>
    `;
    
    card.querySelector('.edit-btn').addEventListener('click', () => openCalculator(semester, isProjection));
    card.querySelector('.delete-btn').addEventListener('click', () => deleteSemester(semester.id, isProjection));
    
    container.appendChild(card);
}

function getStrengthLevel(gpa) {
    if (gpa >= 4.5) return 'beast';
    if (gpa >= 3.5) return 'strong';
    if (gpa >= 2.5) return 'average';
    return 'weak';
}

async function deleteSemester(id, isProjection = false) {
  const list = isProjection ? projectionSemesters : realSemesters;
  const selector = isProjection ? '.projection-card' : '.semester-card';
  const card = document.querySelector(`${selector}[data-id="${id}"]`);

  if (!confirm('Delete this semester permanently?')) return;

  try {
    if (!isProjection) {
      console.log(`🛰️ Deleting semester on server: ${id}`);
      await API.deleteSemester(id);
    }

    const newList = list.filter(s => s.id !== id);
    if (isProjection) projectionSemesters = newList;
    else realSemesters = newList;

    card?.remove();
    updateDashboardTotals();
    updateProjectionSemesters();

    console.log(`✅ Semester ${id} deleted successfully`);
  } catch (err) {
    console.error('❌ Delete failed:', err);
    alert(err.message || 'Failed to delete semester. Check connection.');
  }
}

function openCalculator(semester, isProjection) {
    currentSemesterInPopup = semester;
    isProjectionPopup = isProjection;
    
    document.getElementById('calcHeader').textContent = `${semester.title} Calculator`;
    renderCourseList(semester.courses);
    document.getElementById('calcPopup').classList.remove('hidden');
}

function closeCalculator() {
    document.getElementById('calcPopup').classList.add('hidden');
    currentSemesterInPopup = null;
}

function renderCourseList(courses) {
    const container = document.getElementById('courseList');
    container.innerHTML = '';
    
    courses.forEach((course, index) => {
        addCourseRowToDOM(container, course, index);
    });
    
    if (courses.length === 0) {
        addCourseRowToDOM(container, { courseCode: '', unit: '', grade: 'A' }, 0);
    }
}

function addCourseRow() {
    const container = document.getElementById('courseList');
    addCourseRowToDOM(container, { courseCode: '', unit: '', grade: 'A' }, container.children.length);
}

function addCourseRowToDOM(container, course, index) {
    const row = document.createElement('div');
    row.className = 'course-row';
    
    row.innerHTML = `
        <input type="text" placeholder="Course name" value="${course.courseCode}" class="course-name">
        <input type="number" placeholder="Units" min="1" max="10" value="${course.units}" class="course-unit">
        <select class="course-grade">
            ${Object.keys(gradePoints).map(grade => 
                `<option value="${grade}" ${grade === course.grade ? 'selected' : ''}>${grade}</option>`
            ).join('')}
        </select>
        <button class="remove-course">🗑️</button>
    `;
    
    row.querySelector('.remove-course').addEventListener('click', () => {
        row.remove();
    });
    
    container.appendChild(row);
}

async function calculateSemesterGPA() {
  if (!currentSemesterInPopup) return;

  const courses = getCoursesFromDOM();
  let totalUnits = 0, totalPoints = 0;

  courses.forEach(c => {
    if (c.courseCode && c.units && c.grade) {
      const units = Number(c.units);
      totalUnits += units;
      totalPoints += units * gradePoints[c.grade];
    }
  });

  const gpa = totalUnits ? totalPoints / totalUnits : 0;

  Object.assign(currentSemesterInPopup, { courses, totalUnits, totalPoints, gpa });

  document.getElementById('calcResult').innerHTML =
    `GPA: ${gpa.toFixed(2)} | Units: ${totalUnits} | Points: ${totalPoints.toFixed(1)}`;

  updateSemesterCard(currentSemesterInPopup, isProjectionPopup);
  if (!isProjectionPopup) {
    try {
      await API.updateSemester(currentSemesterInPopup.id, {
        courses,
        totalUnits,
        totalPoints,
        gpa
      });
      console.log('✅ Semester synced with server');
    } catch (err) {
      console.warn('❌ Sync failed:', err);
    }
  }
  if (!isProjectionPopup) {
    updateDashboardTotals();
    updateProjectionSemesters();
  } else {
    updateProjectionCard(currentSemesterInPopup);
  }
}

function getCoursesFromDOM() {
    const rows = document.getElementById('courseList').querySelectorAll('.course-row');
    const courses = [];
    
    rows.forEach(row => {
        const courseCode = row.querySelector('.course-name').value.trim();
        const units = row.querySelector('.course-unit').value;
        const grade = row.querySelector('.course-grade').value;
        
        if (courseCode || units || grade) {
            courses.push({ courseCode, units, grade });
        }
    });
    
    return courses;
}

function updateSemesterCard(semester, isProjection) {
    const card = document.querySelector(`${isProjection ? '.projection-card' : '.semester-card'}[data-id="${semester.id}"]`);
    if (!card) return;
    
    const strength = getStrengthLevel(semester.gpa);
    
    card.querySelector('.stat-value').textContent = semester.gpa.toFixed(2);
    card.querySelectorAll('.stat-value')[1].textContent = semester.totalUnits;
    card.querySelectorAll('.stat-value')[2].textContent = semester.totalPoints.toFixed(1);
    
    if (isProjection) {
        const projectedCGPA = calculateProjectedCGPA(semester);
        card.querySelectorAll('.stat-value')[3].textContent = projectedCGPA.toFixed(2);
    }
    
    const strengthMeter = card.querySelector('.strength-meter');
    strengthMeter.className = `strength-meter strength-${strength}`;
    strengthMeter.textContent = strength.charAt(0).toUpperCase() + strength.slice(1);
}

/* =================================== */

function updateDashboardTotals() {
    let totalUnits = 0;
    let totalPoints = 0;
    
    realSemesters.forEach(semester => {
        totalUnits += semester.totalUnits;
        totalPoints += semester.totalPoints;
    });
    
    const cgpa = totalUnits > 0 ? totalPoints / totalUnits : 0;

    // === Existing UI updates ===
    document.getElementById('totalUnits').textContent = totalUnits;
    document.getElementById('totalScore').textContent = totalPoints.toFixed(1);
    document.getElementById('cgpaDisplay').textContent = cgpa.toFixed(2);

    // === Circle animation updates ===
    const circle = document.querySelector('.cgpa-progress');
    const circleText = document.getElementById('cgpaCircleValue');
    const radius = 54;
    const circumference = 2 * Math.PI * radius;

    const percent = Math.min(cgpa / 5, 1); // clamp to 100%
    const offset = circumference * (1 - percent);
    circle.style.strokeDashoffset = offset;

    // Animate number count-up
    animateNumber(circleText, parseFloat(circleText.textContent), cgpa, 800);
}

// Simple number animation helper
function animateNumber(element, from, to, duration) {
    const start = performance.now();
    function frame(time) {
        const progress = Math.min((time - start) / duration, 1);
        const value = from + (to - from) * progress;
        element.textContent = value.toFixed(2);
        if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

function updateProjectionSemesters() {
    projectionSemesters.forEach(semester => {
        updateProjectionCard(semester);
    });
}

function updateProjectionCard(semester) {
    const card = document.querySelector(`.projection-card[data-id="${semester.id}"]`);
    if (!card) return;
    
    const projectedCGPA = calculateProjectedCGPA(semester);
    card.querySelectorAll('.stat-value')[3].textContent = projectedCGPA.toFixed(2);
}

function calculateProjectedCGPA(projectionSemester) {
    let realTotalUnits = 0;
    let realTotalPoints = 0;
    
    realSemesters.forEach(semester => {
        realTotalUnits += semester.totalUnits;
        realTotalPoints += semester.totalPoints;
    });
    
    const totalUnits = realTotalUnits + projectionSemester.totalUnits;
    const totalPoints = realTotalPoints + projectionSemester.totalPoints;
    
    return totalUnits > 0 ? totalPoints / totalUnits : 0;
}

function addPlaymodeCourse() {
    const container = document.getElementById('playmodeCourseList');
    addPlaymodeCourseRow(container, { name: '', unit: '', grade: 'A' });
    savePlaymodeData();
}

function addPlaymodeCourseRow(container, course) {
    const row = document.createElement('div');
    row.className = 'course-row';
    
    row.innerHTML = `
        <input type="text" placeholder="Course name" value="${course.name}" class="course-name">
        <input type="number" placeholder="Units" min="1" max="10" value="${course.unit}" class="course-unit">
        <select class="course-grade">
            ${Object.keys(gradePoints).map(grade => 
                `<option value="${grade}" ${grade === course.grade ? 'selected' : ''}>${grade}</option>`
            ).join('')}
        </select>
        <button class="remove-course">🗑️</button>
    `;
    
    row.querySelector('.remove-course').addEventListener('click', () => {
        row.remove();
        savePlaymodeData();
    });
    
    row.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('change', savePlaymodeData);
    });
    
    container.appendChild(row);
}

function calculatePlaymodeGPA() {
    const rows = document.getElementById('playmodeCourseList').querySelectorAll('.course-row');
    let totalUnits = 0;
    let totalPoints = 0;
    
    rows.forEach(row => {
        const name = row.querySelector('.course-name').value.trim();
        const unit = row.querySelector('.course-unit').value;
        const grade = row.querySelector('.course-grade').value;
        
        if (name && unit && grade) {
            const units = parseFloat(unit);
            const points = units * gradePoints[grade];
            totalUnits += units;
            totalPoints += points;
        }
    });
    
    const cgpa = totalUnits > 0 ? totalPoints / totalUnits : 0;
    document.getElementById('playmodeResult').textContent = cgpa.toFixed(2);
}

function loadPlaymodeData() {
    const saved = localStorage.getItem('gradeboard_courses');
    if (!saved) {
        addPlaymodeCourse();
        return;
    }
    
    try {
        const courses = JSON.parse(saved);
        const container = document.getElementById('playmodeCourseList');
        container.innerHTML = '';
        
        courses.forEach(course => {
            addPlaymodeCourseRow(container, course);
        });
        
        if (courses.length === 0) {
            addPlaymodeCourse();
        }
    } catch (e) {
        addPlaymodeCourse();
    }
}

function savePlaymodeData() {
    const rows = document.getElementById('playmodeCourseList').querySelectorAll('.course-row');
    const courses = [];
    
    rows.forEach(row => {
        const name = row.querySelector('.course-name').value.trim();
        const unit = row.querySelector('.course-unit').value;
        const grade = row.querySelector('.course-grade').value;
        
        courses.push({ name, unit, grade });
    });
    
    localStorage.setItem('gradeboard_courses', JSON.stringify(courses));
}

/* ======== POLISH PATCH ======== */

/* 1. Guard empty calculator */
const originalCalc = calculateSemesterGPA;
calculateSemesterGPA = async function () {
  const courses = getCoursesFromDOM();
  if (courses.length === 0) {
    toast('mumu! add one course before calculating.');
    return;
  }
  await originalCalc.call(this);
};

/* 2. Disable “Add Semester” while submitting */
document.getElementById('confirmSemester').addEventListener('click', async (e) => {
  const btn = e.target;
  if (btn.disabled) return;
  btn.disabled = true;
  btn.textContent = 'Creating…';
  try {
    await confirmSemester();
    closeSemesterForm();
  } catch (err) {
    toast(err.message || 'Could not create semester');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Add Semester';
  }
});

/* 3. Tiny toast helper */
function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = `
      position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
      background:var(--accent); color:#fff; padding:8px 16px; border-radius:6px;
      font-size:0.9rem; z-index:2000; transition:opacity .3s;`;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = 1;
  setTimeout(() => t.style.opacity = 0, 3000);
}


window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('projection-list').innerHTML = '';
  projectionSemesters = [];
});
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('gradeboard_token');
    alert('Logged out successfully!');
    location.reload();
});
document.addEventListener('DOMContentLoaded', init);