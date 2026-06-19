document.addEventListener('DOMContentLoaded', () => {
  // Navigation elements
  const header = document.querySelector('header');
  const nav = document.querySelector('nav');
  const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
  const navLinks = document.querySelectorAll('nav a');
  const sections = document.querySelectorAll('section');
  
  // Project state
  let allProjects = [];
  
  // Mobile Nav Toggle
  if (mobileNavToggle) {
    mobileNavToggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      const icon = mobileNavToggle.querySelector('i');
      if (icon) {
        if (nav.classList.contains('open')) {
          icon.className = 'fas fa-times';
        } else {
          icon.className = 'fas fa-bars';
        }
      }
    });
  }

  // Close mobile nav on click of link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      const icon = mobileNavToggle.querySelector('i');
      if (icon) icon.className = 'fas fa-bars';
    });
  });

  // Header scroll class
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Scrollspy navigation active state
  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPosition = window.scrollY + 100;
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  // Fetch portfolio data and render
  fetch(`./data.json?t=${Date.now()}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data');
      }
      return response.json();
    })
    .then(data => {
      populatePortfolio(data);
      initThreeAnimation(); // Initialize Three.js after data fetches
      initScrollReveal();   // Trigger scroll-reveal animations
    })
    .catch(error => {
      console.error('Error loading portfolio data:', error);
      showFallbackLoading();
      initThreeAnimation();
      initScrollReveal();
    });

  // Populate HTML elements from JSON
  function populatePortfolio(data) {
    // 1. Personal / Hero Section
    if (data.personal) {
      document.title = `${data.personal.name} | Portfolio`;
      document.getElementById('hero-name').textContent = data.personal.name;
      document.getElementById('hero-title-text').textContent = data.personal.title;
      document.getElementById('hero-bio').textContent = data.personal.bio;
      
      // Avatar picture
      const profileImg = document.getElementById('profile-img');
      if (profileImg && data.personal.avatarUrl) {
        profileImg.src = data.personal.avatarUrl;
      }
      
      // Footer info
      document.getElementById('footer-name').textContent = data.personal.name;
      
      // Social Links
      const githubLinks = document.querySelectorAll('.link-github');
      const linkedinLinks = document.querySelectorAll('.link-linkedin');
      const emailLinks = document.querySelectorAll('.link-email');
      const leetcodeLinks = document.querySelectorAll('.link-leetcode');
      const phoneLinks = document.querySelectorAll('.link-phone');

      githubLinks.forEach(el => el.href = data.personal.links.github || '#');
      linkedinLinks.forEach(el => el.href = data.personal.links.linkedin || '#');
      leetcodeLinks.forEach(el => el.href = data.personal.links.leetcode || '#');
      emailLinks.forEach(el => {
        el.href = `mailto:${data.personal.email}`;
        if (el.classList.contains('contact-text')) el.textContent = data.personal.email;
      });
      phoneLinks.forEach(el => {
        el.href = `tel:${data.personal.phone}`;
        if (el.classList.contains('contact-text')) el.textContent = data.personal.phone;
      });
      
      const locText = document.getElementById('contact-location');
      if (locText) locText.textContent = data.personal.location;
    }

    // 2. Education Section
    const educationTimeline = document.getElementById('education-timeline');
    if (educationTimeline && data.education) {
      educationTimeline.innerHTML = '';
      data.education.forEach(item => {
        const div = document.createElement('div');
        div.className = 'timeline-item reveal';
        div.innerHTML = `
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <span class="timeline-date">${item.duration}</span>
            <h3 class="timeline-title">${item.degree}</h3>
            <p class="timeline-inst">${item.institution} — ${item.location}</p>
            <span class="timeline-grade">${item.grade}</span>
          </div>
        `;
        educationTimeline.appendChild(div);
      });
    }

    // 3. Skills Section
    const skillsGrid = document.getElementById('skills-grid');
    if (skillsGrid && data.skills) {
      skillsGrid.innerHTML = '';
      
      const categoryMappings = {
        programmingLanguages: 'Programming Languages',
        frameworksAndLibraries: 'Frameworks & Libraries',
        machineLearning: 'Machine Learning',
        databases: 'Databases',
        toolsAndPlatforms: 'Tools & Platforms',
        designTools: 'Design Tools',
        academicCoursework: 'Academic Coursework',
        softSkills: 'Soft Skills'
      };

      for (const [key, list] of Object.entries(data.skills)) {
        if (list && list.length > 0) {
          const categoryCard = document.createElement('div');
          categoryCard.className = 'skill-category reveal';
          
          const tagsHTML = list.map(skill => `<span class="skill-tag">${skill}</span>`).join('');
          
          categoryCard.innerHTML = `
            <h3>${categoryMappings[key] || key}</h3>
            <div class="skill-tags">
              ${tagsHTML}
            </div>
          `;
          skillsGrid.appendChild(categoryCard);
        }
      }
    }

    // 4. Projects Section
    if (data.projects) {
      allProjects = data.projects;
      renderProjects(allProjects);
      setupProjectFilters(allProjects);
    }

    // 5. Achievements Section
    const achievementsGrid = document.getElementById('achievements-grid');
    if (achievementsGrid && data.achievements) {
      achievementsGrid.innerHTML = '';
      data.achievements.forEach(item => {
        const div = document.createElement('div');
        div.className = 'ach-card reveal';
        div.innerHTML = `
          <h3 class="ach-title">
            <i class="fas fa-star" style="color: var(--accent-primary); font-size: 0.95rem;"></i>
            ${item.title}
          </h3>
          <p class="ach-desc">${item.description}</p>
        `;
        achievementsGrid.appendChild(div);
      });
    }

    // 6. Certifications Section
    const certsGrid = document.getElementById('certs-grid');
    if (certsGrid && data.certifications) {
      certsGrid.innerHTML = '';
      data.certifications.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cert-card reveal';
        div.innerHTML = `
          <span class="cert-issuer">${item.issuer}</span>
          <h3 class="cert-name">${item.name}</h3>
          <p class="cert-desc">${item.description}</p>
        `;
        certsGrid.appendChild(div);
      });
    }

    // 7. Extracurriculars Section
    const extrasGrid = document.getElementById('extras-grid');
    if (extrasGrid && data.extracurriculars) {
      extrasGrid.innerHTML = '';
      
      const icons = [
        `<i class="fas fa-music"></i>`,
        `<i class="fas fa-users-cog"></i>`
      ];

      data.extracurriculars.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'extra-card reveal';
        const iconHTML = icons[index % icons.length];
        
        div.innerHTML = `
          <div class="extra-icon">${iconHTML}</div>
          <div class="extra-content">
            <h3>${item.title}</h3>
            <p>${item.description}</p>
          </div>
        `;
        extrasGrid.appendChild(div);
      });
    }
  }

  // Render Projects Grid
  function renderProjects(projects) {
    const projectsGrid = document.getElementById('projects-grid');
    if (!projectsGrid) return;
    
    projectsGrid.innerHTML = '';
    
    if (projects.length === 0) {
      projectsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">No projects found matching this filter.</div>`;
      return;
    }
    
    projects.forEach(project => {
      const card = document.createElement('div');
      card.className = 'project-card reveal';
      card.setAttribute('data-id', project.id);
      
      const tagsHTML = project.tags.map(t => `<span class="project-tag">${t}</span>`).join('');
      const imgPath = project.imageUrl || 'images/project-default.webp';

      // Link setups
      let linksHTML = '';
      if (project.githubUrl) {
        linksHTML += `
          <a href="${project.githubUrl}" target="_blank" class="project-link">
            <i class="fab fa-github"></i> Code
          </a>
        `;
      }
      if (project.liveUrl) {
        linksHTML += `
          <a href="${project.liveUrl}" target="_blank" class="project-link">
            <i class="fas fa-external-link-alt"></i> Live Demo
          </a>
        `;
      }

      card.innerHTML = `
        <div class="project-img-wrapper" style="width: 100%; height: 190px; overflow: hidden; position: relative; border-bottom: 1px solid var(--border-color);">
          <img src="${imgPath}" alt="${project.title}" style="width: 100%; height: 100%; object-fit: cover; transition: var(--transition-normal);">
          <div class="project-overlay" style="position: absolute; top:0; left:0; width:100%; height:100%; background: linear-gradient(180deg, transparent 50%, rgba(15,23,42,0.8)); opacity: 0; transition: var(--transition-fast);"></div>
        </div>
        <div class="project-content">
          <div class="project-tags">${tagsHTML}</div>
          <h3 class="project-title">${project.title}</h3>
          <p class="project-desc">${project.description}</p>
          ${linksHTML ? `<div class="project-links">${linksHTML}</div>` : ''}
        </div>
      `;

      // Hover card image zoom styling
      const img = card.querySelector('.project-img-wrapper img');
      card.addEventListener('mouseenter', () => {
        if (img) img.style.transform = 'scale(1.05)';
      });
      card.addEventListener('mouseleave', () => {
        if (img) img.style.transform = 'scale(1)';
      });
      
      projectsGrid.appendChild(card);
    });

    // If projects are rendered after scroll observer has run, bind observer again to new elements
    if (typeof initScrollReveal === 'function') {
      initScrollReveal();
    }
  }

  // Setup tag filtering click handlers
  function setupProjectFilters(projects) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.getAttribute('data-filter');
        if (filter === 'all') {
          renderProjects(projects);
        } else {
          const filtered = projects.filter(p => 
            p.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase()))
          );
          renderProjects(filtered);
        }
      });
    });
  }

  // Contact Form Mock submission
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const statusDiv = document.getElementById('form-status');
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('contact-name').value;
      const email = document.getElementById('contact-email').value;
      const message = document.getElementById('contact-message').value;
      
      if (!name || !email || !message) {
        statusDiv.className = 'form-status error';
        statusDiv.textContent = 'Please fill out all fields.';
        return;
      }
      
      const btn = contactForm.querySelector('button[type="submit"]');
      const origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Sending...';
      
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = origText;
        statusDiv.className = 'form-status success';
        statusDiv.textContent = `Thank you, ${name}! Your message has been sent successfully. I will get back to you soon.`;
        contactForm.reset();
        
        setTimeout(() => {
          statusDiv.style.display = 'none';
        }, 5000);
      }, 1500);
    });
  }

  // Three.js Interactive 3D Wave Particle Simulation
  function initThreeAnimation() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas) return;

    // Dimensions
    const container = document.getElementById('home');
    let width = container.clientWidth;
    let height = container.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    camera.position.x = 0;
    camera.position.y = 10;
    camera.position.z = 25;
    camera.lookAt(0, 0, 0);

    // Geometry - Particle Grid (Data Wave)
    const countX = 45;
    const countY = 45;
    const spacing = 1.2;
    const numParticles = countX * countY;

    const positions = new Float32Array(numParticles * 3);
    const scales = new Float32Array(numParticles);

    let idx = 0;
    for (let ix = 0; ix < countX; ix++) {
      for (let iy = 0; iy < countY; iy++) {
        // Center the grid around (0,0)
        positions[idx] = (ix - countX / 2) * spacing; // x
        positions[idx + 1] = 0;                       // y (will animate this)
        positions[idx + 2] = (iy - countY / 2) * spacing; // z
        
        scales[ix * countY + iy] = 1;
        idx += 3;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    // Custom shader/Points material for glowing circles
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 16;
    pCanvas.height = 16;
    const ctx = pCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    const pTexture = new THREE.CanvasTexture(pCanvas);

    const material = new THREE.PointsMaterial({
      size: 0.28,
      map: pTexture,
      transparent: true,
      color: new THREE.Color('#34d399'), // Emerald accent
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Mouse Tracking for Interactivity
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    });

    // Resize Handler
    window.addEventListener('resize', () => {
      width = container.clientWidth;
      height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    });

    // Animation Loop
    let clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      const time = clock.getElapsedTime() * 0.8;
      const positions = particles.geometry.attributes.position.array;

      let idx = 0;
      for (let ix = 0; ix < countX; ix++) {
        for (let iy = 0; iy < countY; iy++) {
          const xPhase = ix * 0.15 + time;
          const yPhase = iy * 0.15 + time;
          
          positions[idx + 1] = Math.sin(xPhase) * 1.5 + Math.cos(yPhase) * 1.5;
          idx += 3;
        }
      }

      particles.geometry.attributes.position.needsUpdate = true;

      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      camera.position.x = targetX * 12;
      camera.position.y = 10 + (-targetY * 8);
      camera.lookAt(0, 0, 0);

      particles.rotation.y = time * 0.04;

      renderer.render(scene, camera);
    }

    animate();
  }

  // Scroll Reveal Observer
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, {
      root: null,
      threshold: 0.05, // triggers when 5% of element is visible
      rootMargin: "0px 0px -40px 0px"
    });

    reveals.forEach(el => observer.observe(el));
  }

  // Fallback data if local data.json reading is blocked by CORS
  function showFallbackLoading() {
    console.log("Loading fallback static mock data (running locally without webserver)");
    const mockData = {
      "personal": {
        "name": "Thamatam Jayaraj",
        "title": "B.Tech Computer Science (Data Science) Student",
        "email": "jayarajthamatam123@gmail.com",
        "phone": "+91-9391217676",
        "location": "Hyderabad, India",
        "bio": "Passionate Computer Science student specializing in Data Science and Full Stack Development. Experienced in building AI-powered applications, machine learning workflows, and interactive web platforms.",
        "avatarUrl": "images/profile.png",
        "links": {
          "github": "https://github.com/jayaraj0304",
          "linkedin": "https://linkedin.com/in/jayaraj-thamatam",
          "leetcode": "https://leetcode.com/jayaraj0304"
        }
      }
    };
    populatePortfolio(mockData);
  }
});
