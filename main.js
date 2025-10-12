    // Theme toggler
    function toggleTheme() {
      const body = document.body;
      const current = body.getAttribute("data-theme");
      body.setAttribute("data-theme", current === "dark" ? "light" : "dark");
      localStorage.setItem("theme", body.getAttribute("data-theme"));
    }

    // Load theme on start
    (function () {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) document.body.setAttribute("data-theme", savedTheme);
    })();

    const coursesDiv = document.getElementById("courses");

    // Load saved courses from localStorage
    window.onload = function () {
      const saved = JSON.parse(localStorage.getItem("gradeboard_courses") || "[]");
      if (saved.length) {
        saved.forEach(addSavedCourse);
      } else {
        addCourse();
      }
    };

    function addSavedCourse(c) {
      const div = document.createElement("div");
      div.className = "course";
      div.innerHTML = `
        <input type="text" placeholder="Course name" value="${c.name}" />
        <input type="number" placeholder="Unit" class="credit" value="${c.unit}" />
        <select class="grade">
          <option value="5" ${c.grade==5?"selected":""}>A</option>
          <option value="4" ${c.grade==4?"selected":""}>B</option>
          <option value="3" ${c.grade==3?"selected":""}>C</option>
          <option value="2" ${c.grade==2?"selected":""}>D</option>
          <option value="1" ${c.grade==1?"selected":""}>E</option>
          <option value="0" ${c.grade==0?"selected":""}>F</option>
        </select>
      `;
      coursesDiv.appendChild(div);
    }

    function addCourse() {
      const div = document.createElement("div");
      div.className = "course";
      div.innerHTML = `
        <input type="text" placeholder="Course name" />
        <input type="number" placeholder="Unit" class="credit" />
        <select class="grade">
          <option value="5">A</option>
          <option value="4">B</option>
          <option value="3">C</option>
          <option value="2">D</option>
          <option value="1">E</option>
          <option value="0">F</option>
        </select>
      `;
      coursesDiv.appendChild(div);
    }

    function calculateCGPA() {
      const credits = document.querySelectorAll('.credit');
      const grades = document.querySelectorAll('.grade');
      const names = document.querySelectorAll('.course input[type="text"]');
      let totalPoints = 0;
      let totalCredits = 0;
      let data = [];

      for (let i = 0; i < credits.length; i++) {
        const credit = parseFloat(credits[i].value);
        const grade = parseFloat(grades[i].value);
        const name = names[i].value.trim();
        if (!isNaN(credit) && !isNaN(grade)) {
          totalCredits += credit;
          totalPoints += credit * grade;
          data.push({ name, unit: credit, grade });
        }
      }

      if (totalCredits === 0) {
        document.getElementById('result').innerText = "Enter valid course details first.";
        return;
      }

      const cgpa = (totalPoints / totalCredits).toFixed(2);
      document.getElementById('GPA').innerText = `CGPA: ${cgpa}`;
      document.getElementById('result').innerText = `🎯 Your CGPA is ${cgpa}`;
      localStorage.setItem("gradeboard_courses", JSON.stringify(data));
    }

    function deleteLastCourse() {
      const courses = document.querySelectorAll('#courses .course');
      if (courses.length > 1) {
        courses[courses.length - 1].remove();
      } else {
        alert("You must have at least one course.");
      }
    }

    function redirectToSignup() {
      window.location.href = "auth.html"; // Placeholder for your signup page
    }