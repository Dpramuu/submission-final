import Database from '../../data/database';

export default class BookmarkPagePresenter {
  constructor({ container }) {
    this.container = container;
  }

  async init() {
    this._renderLoader();

    try {
      const savedStories = await Database.getAllStory();

      if (!savedStories || savedStories.length === 0) {
        this._renderEmpty();
      } else {
        this._renderList(savedStories);
      }
    } catch (err) {
      this._renderError(err);
    }
  }

  _renderLoader() {
    this.container.innerHTML = `<p>Memuat...</p>`;
  }

  _renderEmpty() {
    this.container.innerHTML = `
      <p>Belum ada story yang disimpan.</p>
      <a href="#/">Kembali ke Beranda</a>
    `;
  }

  _renderError(error) {
    this.container.innerHTML = `
      <p>Gagal memuat data.</p>
      <pre>${error}</pre>
    `;
  }

  _renderList(stories) {
    this.container.innerHTML = `
      <ul style="list-style:none; padding-left:0;">
        ${stories.map(story => `
          <li data-id="${story.id}" style="margin-bottom: 12px; padding: 8px; border:1px solid #ddd; border-radius:6px;">
            <a href="#/reports/${story.id}" style="font-weight:bold; text-decoration:none;">
            ${story.title ?? story.description ?? 'Tanpa Judul'}
            </a>

            <br>
            <small>${story.description ?? ''}</small>

            <button class="remove-bookmark-btn" 
              data-id="${story.id}" 
              style="margin-top:6px; padding:4px 8px; border:none; background:#ff4444; color:white; border-radius:4px; cursor:pointer;">
              Hapus
            </button>
          </li>
        `).join('')}
      </ul>
    `;

    // Attach listener after injected to DOM
    this.container.querySelectorAll('.remove-bookmark-btn')
      .forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.dataset.id;
          await Database.removeStory(id);
          this.init(); // re-render list setelah delete
        });
      });
  }
}
