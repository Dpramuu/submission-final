import {
  generateLoaderAbsoluteTemplate,
  generateReportItemTemplate,
  generateReportsListEmptyTemplate,
  generateReportsListErrorTemplate,
} from '../../templates';
import HomePresenter from './home-presenter';
import * as CityCareAPI from '../../data/api';

export default class HomePage {
  #presenter = null;

  async render() {
    return `
      <section>
        <div class="reports-list__map__container">
          <label id="map-label" class="sr-only">Peta laporan kerusakan</label>
          
          <div id="map"
            class="reports-list__map"
            role="application"
            aria-labelledby="map-label"
            tabindex="0">
          </div>

          <div id="map-loading-container" role="status" aria-live="polite"></div>
        </div>
      </section>

      <section class="container">
        <h1 class="section-title">Daftar Laporan Kerusakan</h1>

        <div class="reports-list__container">
          <div id="reports-list" role="region" aria-label="Daftar laporan"></div>
          <div id="reports-list-loading-container" role="status" aria-live="polite"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new HomePresenter({
      view: this,
      model: CityCareAPI,
    });

    await this.#presenter.initialGalleryAndMap();
  }

  populateReportsList(message, reports) {
    if (!Array.isArray(reports)) {
      console.error('populateReportsList: reports is not an array:', reports);
      this.populateReportsListError('Invalid data format received');
      return;
    }

    if (reports.length <= 0) {
      this.populateReportsListEmpty();
      return;
    }

    try {
      const html = reports.reduce((accumulator, report) => {
        if (!report) {
          console.warn('Invalid report object:', report);
          return accumulator;
        }

        return accumulator.concat(
          `<li class="report-item">` + 
          generateReportItemTemplate({
            id: report.id || '',
            title: report.title || '',
            description: report.description || '',
            evidenceImages: Array.isArray(report.evidenceImages) ? report.evidenceImages : [],
            latitude: report.latitude || null,
            longitude: report.longitude || null,
            createdAt: report.createdAt || '',
            reporterName: report.reporterName || 'Unknown',
          }) +
          `</li>`
        );
      }, '');

      document.getElementById('reports-list').innerHTML = `
        <ul class="reports-list">${html}</ul>
      `;
    } catch (error) {
      console.error('Error populating reports list:', error);
      this.populateReportsListError('Error displaying reports');
    }
  }

  populateReportsListEmpty() {
    document.getElementById('reports-list').innerHTML = generateReportsListEmptyTemplate();
  }

  populateReportsListError(message) {
    document.getElementById('reports-list').innerHTML = generateReportsListErrorTemplate(message);
  }

  #map = null;
  #currentMarker = null;

  async initialMap(reports = []) {
    try {
      this.#map = L.map('map', {
        center: [-2.548926, 118.014863],
        zoom: 5,
        zoomControl: false
      });

      L.control.zoom({
        position: 'topright'
      }).addTo(this.#map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.#map);

      if (reports && reports.length > 0) {
        reports.forEach(report => {
          if (report.latitude && report.longitude) {
            L.marker([report.latitude, report.longitude])
              .addTo(this.#map)
              .bindPopup(`
                <div role="dialog" aria-live="polite">
                  <strong>${report.title}</strong><br>
                  ${report.description}<br><br>
                  <a href="#/reports/${report.id}" aria-label="Lihat detail laporan ${report.title}">
                    Lihat detail laporan
                  </a>
                </div>
              `);
          }
        });
      }

      this.#map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        this.setMarker(lat, lng);
        console.log('Selected location:', { latitude: lat, longitude: lng });
      });

      return this.#map;
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  setMarker(lat, lng) {
    if (this.#currentMarker) {
      this.#map.removeLayer(this.#currentMarker);
    }

    this.#currentMarker = L.marker([lat, lng]).addTo(this.#map);
    this.#currentMarker.bindPopup('<div role="dialog">Lokasi yang dipilih</div>').openPopup();

    this.selectedLocation = { latitude: lat, longitude: lng };
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  showLoading() {
    document.getElementById('reports-list-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideLoading() {
    document.getElementById('reports-list-loading-container').innerHTML = '';
  }
}
