import NewPresenter from './new-presenter';
import { convertBase64ToBlob } from '../../utils';
import * as CityCareAPI from '../../data/api';
import * as Map from '../../utils/map'; // ✅ pastikan ini benar
import Camera from '../../utils/camera';

export default class NewPage {
  #presenter;
  #form;
  #camera;
  #isCameraOpen = false;
  #takenDocumentations = [];

  async render() {
    return `
      <section>
        <div class="new-report__header">
          <div class="container">
            <h1 class="new-report__header__title">Buat Cerita Baru</h1>
            <p class="new-report__header__description">
              Masukkan deskripsi dan foto untuk membagikan cerita Anda.
            </p>
          </div>
        </div>
      </section>
  
      <section class="container">
        <div class="new-form__container">
          <form id="new-form" class="new-form">
            <div class="form-control">
              <label for="description-input">Deskripsi</label>
              <textarea
                id="description-input"
                name="description"
                placeholder="Tuliskan deskripsi cerita..."
                required
              ></textarea>
            </div>

            <div class="form-control">
            <label for="documentations-input">Dokumentasi</label>
            <div class="new-form__documentations__container">
                <div class="new-form__documentations__buttons">
                  <button id="documentations-input-button" class="btn btn-outline" type="button">Pilih Gambar</button>
                  <input id="documentations-input" name="documentations" type="file" accept="image/*" hidden />
                  <button id="open-documentations-camera-button" class="btn btn-outline" type="button">Buka Kamera</button>
                </div>


                <div id="camera-container" class="new-form__camera__container">
                  <video id="camera-video"></video>
                  <canvas id="camera-canvas"></canvas>
                  <div class="new-form__camera__tools">
                    <select id="camera-select"></select>
                    <button id="camera-take-button" class="btn" type="button">Ambil Gambar</button>
                  </div>
                </div>

                <ul id="documentations-taken-list" class="new-form__documentations__outputs"></ul>
              </div>
            </div>

            <div class="form-control">
              <label for="latitude">Latitude</label>
              <input type="number" id="latitude" name="latitude" value="-6.175389" step="0.000001">

              <label for="longitude">Longitude</label>
              <input type="number" id="longitude" name="longitude" value="106.827139" step="0.000001">
            </div>

            <div class="form-control">
              <label id="map-label">Lokasi pada Peta</label>
              <div id="map-new" aria-labelledby="map-label" style="height:300px;border-radius:8px;margin-bottom:10px;"></div>
            </div>

            <div class="form-buttons">
              <span id="submit-button-container">
                <button class="btn" type="submit">Kirim</button>
              </span>
              <a class="btn btn-outline" href="#/">Batal</a>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new NewPresenter({
      view: this,
      model: CityCareAPI,
    });

    this.#takenDocumentations = [];
    this.#setupForm();

    const latInput = document.getElementById('latitude');
    const lonInput = document.getElementById('longitude');

    const defaultLat = parseFloat(latInput.value);
    const defaultLon = parseFloat(lonInput.value);

    const map = Map.createMap('map-new', {
      center: [defaultLat, defaultLon],
      zoom: 15,
    });

    Map.setMarker(defaultLat, defaultLon, (lat, lon) => {
      latInput.value = lat.toFixed(6);
      lonInput.value = lon.toFixed(6);
    });

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      latInput.value = lat.toFixed(6);
      lonInput.value = lng.toFixed(6);
      Map.setMarker(lat, lng, (lat2, lon2) => {
        latInput.value = lat2.toFixed(6);
        lonInput.value = lon2.toFixed(6);
      });
    });
  }

  #setupForm() {
    this.#form = document.getElementById('new-form');
    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const description = this.#form.elements.namedItem('description').value;
      const lat = parseFloat(this.#form.elements.namedItem('latitude').value);
      const lon = parseFloat(this.#form.elements.namedItem('longitude').value);

      if (!description) return alert('Deskripsi wajib diisi');
      if (this.#takenDocumentations.length === 0) return alert('Minimal 1 foto');

      const photo = this.#takenDocumentations[0].blob;

      await this.#presenter.postNewReport({ description, photo, lat, lon });
    });

    document.getElementById('documentations-input').addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (file) await this.#addPicture(file);
      await this.#renderPictures();
    });

    document.getElementById('documentations-input-button').addEventListener('click', () => {
      this.#form.elements.namedItem('documentations').click();
    });

    const cameraContainer = document.getElementById('camera-container');
    document.getElementById('open-documentations-camera-button').addEventListener('click', async (event) => {
      cameraContainer.classList.toggle('open');
      this.#isCameraOpen = cameraContainer.classList.contains('open');

      if (this.#isCameraOpen) {
        event.currentTarget.textContent = 'Tutup Kamera';
        this.#setupCamera();
        await this.#camera.launch();
      } else {
        event.currentTarget.textContent = 'Buka Kamera';
        this.#camera.stop();
      }
    });
  }

  #setupCamera() {
    if (!this.#camera) {
      this.#camera = new Camera({
        video: document.getElementById('camera-video'),
        cameraSelect: document.getElementById('camera-select'),
        canvas: document.getElementById('camera-canvas'),
      });
    }

    this.#camera.addCheeseButtonListener('#camera-take-button', async () => {
      const image = await this.#camera.takePicture();
      await this.#addPicture(image);
      await this.#renderPictures();
    });
  }

  async #addPicture(image) {
    let blob = image;
    if (typeof image === 'string') blob = await convertBase64ToBlob(image, 'image/png');

    this.#takenDocumentations = [{ id: `${Date.now()}`, blob }];
  }

  async #renderPictures() {
    const list = document.getElementById('documentations-taken-list');
    const picture = this.#takenDocumentations[0];

    if (!picture) return (list.innerHTML = '');

    const url = URL.createObjectURL(picture.blob);
    list.innerHTML = `
      <li>
        <button type="button" data-id="${picture.id}">
          <img src="${url}">
        </button>
      </li>
    `;

    document.querySelector('[data-id]').addEventListener('click', () => {
      this.#takenDocumentations = [];
      this.#renderPictures();
    });
  }

  storeSuccessfully() {
    alert("Story berhasil diunggah!");
    location.hash = '/';
  }

  storeFailed(message) {
    alert(message);
  }

  showSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit" disabled>
        <i class="fas fa-spinner loader-button"></i> Upload...
      </button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `<button class="btn" type="submit">Kirim</button>`;
  }
}
