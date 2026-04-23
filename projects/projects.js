import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

// Step 1.6: Project count
const title = document.querySelector('.projects-title');
if (title) {
  title.textContent = `Projects (${projects.length})`;
}

renderProjects(projects, projectsContainer, 'h2');