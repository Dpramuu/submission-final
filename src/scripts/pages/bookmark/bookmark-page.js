import BookmarkPagePresenter from './bookmark-presenter';

export default class BookmarkPage {
  constructor() {
    this.presenter = null;
  }

  async render() {
    return `
      <section>
        <h2>Laporan Tersimpan</h2>
        <div id="bookmark-list"></div>
      </section>
    `;
  }

  async afterRender() {
    const container = document.querySelector('#bookmark-list');
    this.presenter = new BookmarkPagePresenter({ container });
    await this.presenter.init();
  }
}
