const gradePoints = {
    'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0
};
let realSemesters = [];
let projectionSemesters = [];
let currentSemesterInPopup = null;
let isProjectionPopup = false;

import { API } from './api.js';

/*========SERVER → CLIENT BRIDGE========*/
window.importSemestersFromServer = function (serverList) {
  // convert server shape into app.js shape
  realSemesters = serverList.map(s => ({
    id: s.id,
    title: s.title,
    part: s.part,
    semester: s.semester,
    courses: s.courses || [],
    totalUnits: s.totalUnits || 0,
    totalPoints: s.totalPoints || 0,
    gpa: s.gpa || 0
  }));

  // render cards & totals (happens before dashboard becomes visible)
  realSemesters.forEach(sem => renderSemesterCard(sem, false));
  updateDashboardTotals();
  updateProjectionSemesters();
};

function init() {
    loadTheme();
    createDefaultSemester();
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

function createDefaultSemester() {
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
    
    document.getElementById('confirmSemester').addEventListener('click', confirmSemester);
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
    const navBtns = document.querySelectorAll('.nav-btn');
    
    if (view === 'dashboard') {
        dashboard.classList.remove('hidden');
        playmode.classList.add('hidden');
    } else {
        dashboard.classList.add('hidden');
        playmode.classList.remove('hidden');
    }
    
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
            semesterObj.id = remote.id;
        } catch (e) {
            console.warn('Could not create semester on server – keeping local only', err);
        }
        realSemesters.push(semesterObj);
        renderSemesterCard(semesterObj, false);
    }
    closeSemesterForm();
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
                <button class="btn-secondary delete-btn">Delete</button>
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

function deleteSemester(id, isProjection) {
    if (isProjection) {
        projectionSemesters = projectionSemesters.filter(s => s.id !== id);
        document.querySelector(`.projection-card[data-id="${id}"]`)?.remove();
    } else {
        
        realSemesters = realSemesters.filter(s => s.id !== id);
        document.querySelector(`.semester-card[data-id="${id}"]`)?.remove();
        API.deleteSemester(id).catch(err => console.warn('delete failed', err));
        updateDashboardTotals();
        updateProjectionSemesters();
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
        <input type="number" placeholder="Units" min="1" max="10" value="${course.unit}" class="course-unit">
        <select class="course-grade">
            ${Object.keys(gradePoints).map(grade => 
                `<option value="${grade}" ${grade === course.grade ? 'selected' : ''}>${grade}</option>`
            ).join('')}
        </select>
        <button class="remove-course">&times;</button>
    `;
    
    row.querySelector('.remove-course').addEventListener('click', () => {
        row.remove();
    });
    
    container.appendChild(row);
}

async function calculateSemesterGPA() {
    if (!currentSemesterInPopup) return;
    
    const courses = getCoursesFromDOM();
    let totalUnits = 0;
    let totalPoints = 0;
    
    courses.forEach(course => {
        if (course.courseCode && course.units && course.grade) {
            const units = parseFloat(course.units);
            const points = units * gradePoints[course.grade];
            totalUnits += units;
            totalPoints += points;
        }
    });
    
    const gpa = totalUnits > 0 ? totalPoints / totalUnits : 0;
    
    currentSemesterInPopup.courses = courses;
    currentSemesterInPopup.totalUnits = totalUnits;
    currentSemesterInPopup.totalPoints = totalPoints;
    currentSemesterInPopup.gpa = gpa;
    
    document.getElementById('calcResult').innerHTML = `
        GPA: ${gpa.toFixed(2)} | Units: ${totalUnits} | Points: ${totalPoints.toFixed(1)}
    `;
    
    updateSemesterCard(currentSemesterInPopup, isProjectionPopup);
    // push changes to backend (fire-and-forget)
    if (!isProjectionPopup) {                       // real semester only
        await API.updateSemester(currentSemesterInPopup.id, {
            courses: currentSemesterInPopup.courses,
            totalUnits: currentSemesterInPopup.totalUnits,
            totalPoints: currentSemesterInPopup.totalPoints,
            gpa: currentSemesterInPopup.gpa
        }).catch(err => console.warn('Sync failed – keeping local copy', err));
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
    
    document.getElementById('totalUnits').textContent = totalUnits;
    document.getElementById('totalScore').textContent = totalPoints.toFixed(1);
    document.getElementById('cgpaDisplay').textContent = cgpa.toFixed(2);
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
        <button class="remove-course">&times;</button>
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
    const saved = localStorage.getItem('playmode_data');
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
    
    localStorage.setItem('playmode_data', JSON.stringify(courses));
}

document.addEventListener('DOMContentLoaded', init);