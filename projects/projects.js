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

function renderPieChart(projectsGiven) {
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

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

        // Update wedge classes
        svg
          .selectAll('path')
          .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');

        // Update legend classes
        d3.select('.legend')
          .selectAll('li')
          .attr('class', (_, idx) =>
            idx === selectedIndex ? 'legend-item selected' : 'legend-item'
          );

        // Filter projects by selected year + search query
        if (selectedIndex === -1) {
          let filteredProjects = projects.filter((project) => {
            let values = Object.values(project).join('\n').toLowerCase();
            return values.includes(query.toLowerCase());
          });
          renderProjects(filteredProjects, projectsContainer, 'h2');
        } else {
          let selectedYear = newData[selectedIndex].label;
          let filteredProjects = projects.filter((project) => {
            let values = Object.values(project).join('\n').toLowerCase();
            return (
              project.year === selectedYear &&
              values.includes(query.toLowerCase())
            );
          });
          renderProjects(filteredProjects, projectsContainer, 'h2');
        }
      });
  });

  // Draw legend
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

  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  // If a wedge is selected, also filter by year
  if (selectedIndex !== -1) {
    let svg = d3.select('svg');
    let paths = svg.selectAll('path').nodes();
    // re-filter including year from current pie
    filteredProjects = filteredProjects.filter((project) => {
      let rolledData = d3.rollups(
        projects.filter((p) => {
          let v = Object.values(p).join('\n').toLowerCase();
          return v.includes(query.toLowerCase());
        }),
        (v) => v.length,
        (d) => d.year,
      ).map(([year, count]) => ({ value: count, label: year }));
      return rolledData[selectedIndex]
        ? project.year === rolledData[selectedIndex].label
        : true;
    });
  }

  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
});