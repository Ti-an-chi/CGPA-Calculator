/*========= API GATEWAY – swap baseURL when your server is live =========*/
const API = {
  baseURL: 'https://gradeboard-api-production.up.railway.app/api',

  /*---------- helpers ----------*/
async _fetch(path, options = {}) {
  const url = `${this.baseURL}${path}`;
  const token = localStorage.getItem('gradeboard_token');

  const defaults = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  const resp = await fetch(url, { ...defaults, ...options });

  // Handle non-200 responses
  if (!resp.ok) {
    let msg = 'Network error';
    try {
      const data = await resp.json();
      msg = data.message || msg;
    } catch {}
    throw new Error(msg);
  }

  // ✅ Return JSON result
  return await resp.json();
},


  /*---------- auth ----------*/
register(username, password) {
  return API._fetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
},
  
  login(username, password) {
    return this._fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  /*---------- semesters ----------*/
  getSemesters() {
    return this._fetch('/semesters');      // GET  -> [{id, title, part, semester, courses[]}, ...]
  },

  updateSemester(id, payload) {            // payload = { courses, totalUnits, totalPoints, gpa }
    return this._fetch(`/semesters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  
  createSemester(payload) {   // payload = {title, part, semester, courses[], totalUnits, totalPoints, gpa}
  return this._fetch('/semesters', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
},

deleteSemester(id) {
  return this._fetch(`/semesters/${id}`, { method: 'DELETE' });
}

};

export { API };