// Default password hash for 'admin123'
const DEFAULT_PASSWORD_HASH = "9dc5fcd3382f0b61ee1dbd73240c94fdf9d6eb12e07307c26f004d54c1efaba8";

// Admin application state
let portfolioData = null;
let currentTab = 'personal';
let githubConfig = {
  token: localStorage.getItem('gh_token') || '',
  username: 'jayaraj0304',
  repo: 'Portifilio',
  branch: 'main'
};
let isModified = false;

// SHA-256 helper using Web Crypto API
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const adminPanel = document.getElementById('admin-panel');
  const loginSection = document.getElementById('login-section');
  const tabs = document.querySelectorAll('.sidebar-tab');
  const logoutBtn = document.getElementById('logout-btn');
  const exportBtn = document.getElementById('export-json-btn');
  const ghCommitBtn = document.getElementById('gh-commit-btn');
  const ghTokenInput = document.getElementById('gh-token');
  const syncStatus = document.getElementById('sync-status');

  // Set initial token if present in localStorage
  if (ghTokenInput && githubConfig.token) {
    ghTokenInput.value = githubConfig.token;
  }

  // Authentication Flow
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('password-input').value;
      const hashed = await sha256(password);

      if (hashed === DEFAULT_PASSWORD_HASH) {
        // Authenticated! Hide login, show dashboard
        loginSection.style.display = 'none';
        adminPanel.style.display = 'block';
        loadPortfolioData();
      } else {
        loginError.style.display = 'block';
        loginError.textContent = "Invalid Password. Access Denied.";
      }
    });
  }

  // Logout Handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      adminPanel.style.display = 'none';
      loginSection.style.display = 'block';
      document.getElementById('password-input').value = '';
      if (loginError) loginError.style.display = 'none';
    });
  }

  // Tab Switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      currentTab = tab.getAttribute('data-tab');
      showSection(currentTab);
    });
  });

  function showSection(tabId) {
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(s => s.classList.remove('active'));

    const activeSection = document.getElementById(`section-${tabId}`);
    if (activeSection) {
      activeSection.classList.add('active');
    }
  }

  // Load Data
  function loadPortfolioData() {
    fetch('./data.json')
      .then(res => res.json())
      .then(data => {
        portfolioData = data;
        populateForms();
        updateSyncStatus(false);
      })
      .catch(err => {
        console.error('Error fetching data.json for admin', err);
        alert('Could not load data.json. Starting with blank schema.');
        portfolioData = getBlankSchema();
        populateForms();
        updateSyncStatus(true);
      });
  }

  function getBlankSchema() {
    return {
      personal: { name: "", title: "", email: "", phone: "", location: "", bio: "", links: { github: "", linkedin: "", leetcode: "" } },
      education: [],
      skills: { programmingLanguages: [], frameworksAndLibraries: [], machineLearning: [], databases: [], toolsAndPlatforms: [], designTools: [], academicCoursework: [], softSkills: [] },
      projects: [],
      achievements: [],
      certifications: [],
      extracurriculars: []
    };
  }

  // Populate Forms based on portfolioData
  function populateForms() {
    if (!portfolioData) return;

    // Personal Form
    if (portfolioData.personal) {
      document.getElementById('edit-name').value = portfolioData.personal.name || '';
      document.getElementById('edit-title').value = portfolioData.personal.title || '';
      document.getElementById('edit-email').value = portfolioData.personal.email || '';
      document.getElementById('edit-phone').value = portfolioData.personal.phone || '';
      document.getElementById('edit-location').value = portfolioData.personal.location || '';
      document.getElementById('edit-bio').value = portfolioData.personal.bio || '';
      document.getElementById('edit-avatar').value = portfolioData.personal.avatarUrl || '';
      if (portfolioData.personal.links) {
        document.getElementById('edit-github').value = portfolioData.personal.links.github || '';
        document.getElementById('edit-linkedin').value = portfolioData.personal.links.linkedin || '';
        document.getElementById('edit-leetcode').value = portfolioData.personal.links.leetcode || '';
      }
    }

    // Skills
    if (portfolioData.skills) {
      for (const [key, value] of Object.entries(portfolioData.skills)) {
        const input = document.getElementById(`skills-${key}`);
        if (input) {
          input.value = value.join(', ');
        }
      }
    }

    // Projects, Education, Achievements, Certs, Extras (List based)
    renderListSection('projects', renderProjectItem);
    renderListSection('education', renderEducationItem);
    renderListSection('achievements', renderAchievementItem);
    renderListSection('certifications', renderCertificationItem);
    renderListSection('extracurriculars', renderExtraItem);
  }

  // List Rendering Helpers
  function renderListSection(key, itemRenderer) {
    const listContainer = document.getElementById(`list-${key}`);
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const items = portfolioData[key] || [];
    if (items.length === 0) {
      listContainer.innerHTML = `<div class="text-muted" style="padding: 10px;">No entries. Add one to get started.</div>`;
      return;
    }

    items.forEach((item, index) => {
      const el = itemRenderer(item, index);
      listContainer.appendChild(el);
    });
  }

  function createListItemWrapper(title, subtitle, onEdit, onDelete) {
    const div = document.createElement('div');
    div.className = 'admin-list-item';
    div.innerHTML = `
      <div class="admin-list-item-info">
        <h4>${title}</h4>
        <p>${subtitle}</p>
      </div>
      <div class="admin-actions">
        <button class="btn-icon btn-edit"><i class="fas fa-edit"></i></button>
        <button class="btn-icon btn-delete"><i class="fas fa-trash"></i></button>
      </div>
    `;
    div.querySelector('.btn-edit').addEventListener('click', onEdit);
    div.querySelector('.btn-delete').addEventListener('click', onDelete);
    return div;
  }

  // Specific List Renderers
  function renderProjectItem(item, index) {
    return createListItemWrapper(
      item.title,
      item.tags.join(', '),
      () => openProjectModal(index),
      () => deleteListItem('projects', index)
    );
  }

  function renderEducationItem(item, index) {
    return createListItemWrapper(
      item.degree,
      `${item.institution} (${item.duration})`,
      () => openEducationModal(index),
      () => deleteListItem('education', index)
    );
  }

  function renderAchievementItem(item, index) {
    return createListItemWrapper(
      item.title,
      item.description.substring(0, 60) + (item.description.length > 60 ? '...' : ''),
      () => openAchievementModal(index),
      () => deleteListItem('achievements', index)
    );
  }

  function renderCertificationItem(item, index) {
    return createListItemWrapper(
      item.name,
      item.issuer,
      () => openCertificationModal(index),
      () => deleteListItem('certifications', index)
    );
  }

  function renderExtraItem(item, index) {
    return createListItemWrapper(
      item.title,
      item.description.substring(0, 60) + (item.description.length > 60 ? '...' : ''),
      () => openExtraModal(index),
      () => deleteListItem('extracurriculars', index)
    );
  }

  // Deletion logic
  function deleteListItem(key, index) {
    if (confirm('Are you sure you want to delete this item?')) {
      portfolioData[key].splice(index, 1);
      populateForms();
      updateSyncStatus(true);
    }
  }

  // Sync status update
  function updateSyncStatus(modified) {
    isModified = modified;
    if (modified) {
      syncStatus.className = 'sync-status modified';
      syncStatus.querySelector('span').style.background = '#f59e0b';
      syncStatus.querySelector('b').textContent = 'Unsaved Changes';
    } else {
      syncStatus.className = 'sync-status synced';
      syncStatus.querySelector('span').style.background = 'var(--accent-primary)';
      syncStatus.querySelector('b').textContent = 'Synced with data.json';
    }
  }

  // 1. Personal details form listener
  const personalForm = document.getElementById('personal-form');
  if (personalForm) {
    personalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      portfolioData.personal = {
        name: document.getElementById('edit-name').value,
        title: document.getElementById('edit-title').value,
        email: document.getElementById('edit-email').value,
        phone: document.getElementById('edit-phone').value,
        location: document.getElementById('edit-location').value,
        bio: document.getElementById('edit-bio').value,
        avatarUrl: document.getElementById('edit-avatar').value,
        links: {
          github: document.getElementById('edit-github').value,
          linkedin: document.getElementById('edit-linkedin').value,
          leetcode: document.getElementById('edit-leetcode').value
        }
      };
      updateSyncStatus(true);
      alert('Personal details saved in local session!');
    });
  }

  // 2. Skills form listener
  const skillsForm = document.getElementById('skills-form');
  if (skillsForm) {
    skillsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      portfolioData.skills = {
        programmingLanguages: parseCsvSkills('skills-programmingLanguages'),
        frameworksAndLibraries: parseCsvSkills('skills-frameworksAndLibraries'),
        machineLearning: parseCsvSkills('skills-machineLearning'),
        databases: parseCsvSkills('skills-databases'),
        toolsAndPlatforms: parseCsvSkills('skills-toolsAndPlatforms'),
        designTools: parseCsvSkills('skills-designTools'),
        academicCoursework: parseCsvSkills('skills-academicCoursework'),
        softSkills: parseCsvSkills('skills-softSkills')
      };
      updateSyncStatus(true);
      alert('Skills saved in local session!');
    });
  }

  function parseCsvSkills(id) {
    const input = document.getElementById(id);
    if (!input) return [];
    return input.value.split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  // Modal Setup
  const modalOverlay = document.getElementById('modal-overlay');
  const modalContainer = document.getElementById('modal-container');
  const closeModalBtn = document.getElementById('close-modal');

  function openModal(htmlContent) {
    modalContainer.innerHTML = htmlContent;
    modalOverlay.style.display = 'flex';
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modalOverlay.style.display = 'none';
    });
  }

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.style.display = 'none';
    }
  });

  // Project Add/Edit Modal
  document.getElementById('add-project-btn').addEventListener('click', () => openProjectModal());

  function openProjectModal(index = -1) {
    const isEdit = index >= 0;
    const project = isEdit ? portfolioData.projects[index] : { id: "", title: "", description: "", tags: [], githubUrl: "", liveUrl: "" };

    const html = `
      <h3 style="margin-bottom: 20px; font-family: var(--font-heading)">${isEdit ? 'Edit Project' : 'Add Project'}</h3>
      <form id="modal-project-form">
        <div class="form-group">
          <label class="form-label">Project ID (unique, lowercase)</label>
          <input type="text" id="proj-id" class="form-input" value="${project.id}" required ${isEdit ? 'disabled' : ''}>
        </div>
        <div class="form-group">
          <label class="form-label">Project Title</label>
          <input type="text" id="proj-title" class="form-input" value="${project.title}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea id="proj-desc" class="form-input" required>${project.description}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Tags (comma-separated)</label>
          <input type="text" id="proj-tags" class="form-input" value="${project.tags.join(', ')}">
        </div>
        <div class="form-group">
          <label class="form-label">GitHub URL</label>
          <input type="url" id="proj-github" class="form-input" value="${project.githubUrl}">
        </div>
        <div class="form-group">
          <label class="form-label">Live Demo URL</label>
          <input type="url" id="proj-live" class="form-input" value="${project.liveUrl}">
        </div>
        <div class="form-group">
          <label class="form-label">Project Image URL</label>
          <input type="text" id="proj-image" class="form-input" value="${project.imageUrl || ''}">
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%">${isEdit ? 'Save Changes' : 'Add Project'}</button>
      </form>
    `;
    openModal(html);

    document.getElementById('modal-project-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const newProj = {
        id: document.getElementById('proj-id').value.trim().toLowerCase(),
        title: document.getElementById('proj-title').value,
        description: document.getElementById('proj-desc').value,
        tags: document.getElementById('proj-tags').value.split(',').map(t => t.trim()).filter(t => t.length > 0),
        githubUrl: document.getElementById('proj-github').value,
        liveUrl: document.getElementById('proj-live').value,
        imageUrl: document.getElementById('proj-image').value
      };

      if (isEdit) {
        portfolioData.projects[index] = newProj;
      } else {
        portfolioData.projects.push(newProj);
      }

      populateForms();
      updateSyncStatus(true);
      modalOverlay.style.display = 'none';
    });
  }

  // Education Add/Edit Modal
  document.getElementById('add-education-btn').addEventListener('click', () => openEducationModal());

  function openEducationModal(index = -1) {
    const isEdit = index >= 0;
    const edu = isEdit ? portfolioData.education[index] : { institution: "", degree: "", location: "", duration: "", grade: "" };

    const html = `
      <h3 style="margin-bottom: 20px; font-family: var(--font-heading)">${isEdit ? 'Edit Education' : 'Add Education'}</h3>
      <form id="modal-education-form">
        <div class="form-group">
          <label class="form-label">Institution Name</label>
          <input type="text" id="edu-inst" class="form-input" value="${edu.institution}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Degree / Course</label>
          <input type="text" id="edu-deg" class="form-input" value="${edu.degree}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Location (City, Country)</label>
          <input type="text" id="edu-loc" class="form-input" value="${edu.location}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Duration (e.g. 2024 - 2027)</label>
          <input type="text" id="edu-dur" class="form-input" value="${edu.duration}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Grade (e.g. CGPA: 8.35)</label>
          <input type="text" id="edu-grade" class="form-input" value="${edu.grade}">
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%">${isEdit ? 'Save Changes' : 'Add Education'}</button>
      </form>
    `;
    openModal(html);

    document.getElementById('modal-education-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const newEdu = {
        institution: document.getElementById('edu-inst').value,
        degree: document.getElementById('edu-deg').value,
        location: document.getElementById('edu-loc').value,
        duration: document.getElementById('edu-dur').value,
        grade: document.getElementById('edu-grade').value
      };

      if (isEdit) {
        portfolioData.education[index] = newEdu;
      } else {
        portfolioData.education.push(newEdu);
      }

      populateForms();
      updateSyncStatus(true);
      modalOverlay.style.display = 'none';
    });
  }

  // Achievement Modal
  document.getElementById('add-ach-btn').addEventListener('click', () => openAchievementModal());

  function openAchievementModal(index = -1) {
    const isEdit = index >= 0;
    const ach = isEdit ? portfolioData.achievements[index] : { title: "", description: "" };
    const html = `
      <h3 style="margin-bottom: 20px; font-family: var(--font-heading)">${isEdit ? 'Edit Achievement' : 'Add Achievement'}</h3>
      <form id="modal-ach-form">
        <div class="form-group">
          <label class="form-label">Achievement Title</label>
          <input type="text" id="ach-title" class="form-input" value="${ach.title}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea id="ach-desc" class="form-input" required>${ach.description}</textarea>
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%">${isEdit ? 'Save Changes' : 'Add Achievement'}</button>
      </form>
    `;
    openModal(html);

    document.getElementById('modal-ach-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const newAch = {
        title: document.getElementById('ach-title').value,
        description: document.getElementById('ach-desc').value
      };
      if (isEdit) portfolioData.achievements[index] = newAch;
      else portfolioData.achievements.push(newAch);

      populateForms();
      updateSyncStatus(true);
      modalOverlay.style.display = 'none';
    });
  }

  // Certification Modal
  document.getElementById('add-cert-btn').addEventListener('click', () => openCertificationModal());

  function openCertificationModal(index = -1) {
    const isEdit = index >= 0;
    const cert = isEdit ? portfolioData.certifications[index] : { name: "", issuer: "", description: "" };
    const html = `
      <h3 style="margin-bottom: 20px; font-family: var(--font-heading)">${isEdit ? 'Edit Certification' : 'Add Certification'}</h3>
      <form id="modal-cert-form">
        <div class="form-group">
          <label class="form-label">Certification Name</label>
          <input type="text" id="cert-name" class="form-input" value="${cert.name}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Issuer</label>
          <input type="text" id="cert-issuer" class="form-input" value="${cert.issuer}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Short Description</label>
          <textarea id="cert-desc" class="form-input">${cert.description}</textarea>
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%">${isEdit ? 'Save Changes' : 'Add Certification'}</button>
      </form>
    `;
    openModal(html);

    document.getElementById('modal-cert-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const newCert = {
        name: document.getElementById('cert-name').value,
        issuer: document.getElementById('cert-issuer').value,
        description: document.getElementById('cert-desc').value
      };
      if (isEdit) portfolioData.certifications[index] = newCert;
      else portfolioData.certifications.push(newCert);

      populateForms();
      updateSyncStatus(true);
      modalOverlay.style.display = 'none';
    });
  }

  // Extracurricular Modal
  document.getElementById('add-extra-btn').addEventListener('click', () => openExtraModal());

  function openExtraModal(index = -1) {
    const isEdit = index >= 0;
    const extra = isEdit ? portfolioData.extracurriculars[index] : { title: "", description: "" };
    const html = `
      <h3 style="margin-bottom: 20px; font-family: var(--font-heading)">${isEdit ? 'Edit Extracurricular' : 'Add Extracurricular'}</h3>
      <form id="modal-extra-form">
        <div class="form-group">
          <label class="form-label">Activity Title</label>
          <input type="text" id="extra-title" class="form-input" value="${extra.title}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea id="extra-desc" class="form-input" required>${extra.description}</textarea>
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%">${isEdit ? 'Save Changes' : 'Add Extracurricular'}</button>
      </form>
    `;
    openModal(html);

    document.getElementById('modal-extra-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const newExtra = {
        title: document.getElementById('extra-title').value,
        description: document.getElementById('extra-desc').value
      };
      if (isEdit) portfolioData.extracurriculars[index] = newExtra;
      else portfolioData.extracurriculars.push(newExtra);

      populateForms();
      updateSyncStatus(true);
      modalOverlay.style.display = 'none';
    });
  }

  // Password Utility section
  const passGenForm = document.getElementById('pass-gen-form');
  if (passGenForm) {
    passGenForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('new-pass-val').value;
      if (!input) return;
      const hash = await sha256(input);
      document.getElementById('generated-hash-box').style.display = 'block';
      document.getElementById('generated-hash').value = hash;
    });
  }

  // Export JSON (Download File)
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (!portfolioData) return;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(portfolioData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "data.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      updateSyncStatus(false);
      alert('Downloaded data.json. Overwrite the data.json file in your project folder to update the public portfolio website.');
    });
  }

  // GitHub Auto-Commit Feature
  if (ghCommitBtn) {
    ghCommitBtn.addEventListener('click', async () => {
      const token = ghTokenInput.value.trim();
      if (!token) {
        alert('Please provide a GitHub Personal Access Token (PAT) first.');
        return;
      }

      // Save token to localStorage for convenience
      localStorage.setItem('gh_token', token);
      githubConfig.token = token;

      ghCommitBtn.disabled = true;
      ghCommitBtn.textContent = 'Committing changes...';

      try {
        const owner = githubConfig.username;
        const repo = githubConfig.repo;
        const path = 'data.json';
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

        // 1. Fetch current file to get SHA (needed for updates)
        let sha = null;
        const getRes = await fetch(url, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (getRes.status === 200) {
          const fileData = await getRes.json();
          sha = fileData.sha;
        }

        // 2. Put file with new content
        const commitMsg = "Update portfolio content via Admin Dashboard";
        const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(portfolioData, null, 2))));

        const putBody = {
          message: commitMsg,
          content: contentBase64,
          branch: githubConfig.branch
        };
        if (sha) {
          putBody.sha = sha;
        }

        const putRes = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify(putBody)
        });

        if (putRes.ok) {
          updateSyncStatus(false);
          alert('Successfully committed data.json directly to GitHub! Your site will auto-rebuild shortly.');
        } else {
          const putErr = await putRes.json();
          throw new Error(putErr.message || 'GitHub commit API request failed');
        }
      } catch (err) {
        console.error('Error committing to GitHub:', err);
        alert(`Failed to save to GitHub: ${err.message}. Please check your repository permissions or token.`);
      } finally {
        ghCommitBtn.disabled = false;
        ghCommitBtn.textContent = 'Commit directly to GitHub';
      }
    });
  }
});
