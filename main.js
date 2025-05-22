console.log('Hello World!');
function addCourse() {
      const courseDiv = document.createElement('div');
      courseDiv.className = 'course';
      courseDiv.innerHTML = `
        <input type="text" placeholder="Course name" />
        <input type="number" placeholder="unit" class="credit" />
        <select class="grade">
          <option value="5">A</option>
          <option value="4">B</option>
          <option value="3">C</option>
          <option value="2">D</option>
          <option value="1">E</option>
          <option value="0">F</option>
        </select>
      `;
      document.getElementById('courses').appendChild(courseDiv);
    }

    function calculateCGPA() {
      const credits = document.querySelectorAll('.credit');
      const grades = document.querySelectorAll('.grade');
      let totalPoints = 0;
      let totalCredits = 0;

      for (let i = 0; i < credits.length; i++) {
        const credit = parseFloat(credits[i].value);
        const grade = parseFloat(grades[i].value);
        if (!isNaN(credit) && !isNaN(grade)) {
          totalCredits += credit;
          totalPoints += credit * grade;
        }
      }

      if (totalCredits === 0) {
        document.getElementById('result').innerText = "Enter valid credits to calculate CGPA.";
      } else {
        const cgpa = (totalPoints / totalCredits).toFixed(2);
        document.getElementById('result').innerText = `Your CGPA is: ${cgpa}`;
        document.getElementById('GPA').innerText = `${cgpa}`
      }
    }
    function deleteLastCourse() {
  const courses = document.querySelectorAll('#courses .course');
  if (courses.length > 1) {
    courses[courses.length - 1].remove();
  } else {
    alert("You must have at least one course.");
  }
}