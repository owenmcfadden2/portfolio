import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

const title = document.querySelector('.projects-title');
if (title) {
  title.textContent = `Projects (${projects.length})`;
}

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let selectedIndex = -1;
let query = '';

// Single source of truth for filtering
function getFilteredProjects() {
  return projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    let matchesSearch = values.includes(query.toLowerCase());
    let matchesYear = selectedIndex === -1 || project.year === currentYearLabel();
    return matchesSearch && matchesYear;
  });
}

function currentYearLabel() {
  let rolledData = d3.rollups(projects, (v) => v.length, (d) => d.year);
  let data = rolledData.map(([year, count]) => ({ value: count, label: year }));
  return selectedIndex === -1 ? null : data[selectedIndex]?.label;
}

function renderPieChart(projectsGiven) {
  let newRolledData = d3.rollups(projectsGiven, (v) => v.length, (d) => d.year);
  let newData = newRolledData.map(([year, count]) => ({ value: count, label: year }));

  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));

  let svg = d3.select('svg');
  svg.selectAll('path').remove();
  d3.select('.legend').selectAll('li').remove();

  newArcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .attr('class', i === selectedIndex ? 'selected' : '')
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        let filtered = getFilteredProjects();
        renderProjects(filtered, projectsContainer, 'h2');
        renderPieChart(filtered);
      });
  });

  let legend = d3.select('.legend');
  newData.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', idx === selectedIndex ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

// Initial render
renderPieChart(projects);
renderProjects(projects, projectsContainer, 'h2');

// Search
let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  selectedIndex = -1; // reset pie selection on new search
  let filtered = getFilteredProjects();
  renderProjects(filtered, projectsContainer, 'h2');
  renderPieChart(filtered);
});