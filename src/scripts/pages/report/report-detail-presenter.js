import Database from '../../data/database';

export default class ReportDetailPresenter {
  #reportId;
  #view;
  #apiModel;

  constructor(reportId, { view, apiModel }) {
    this.#reportId = reportId;
    this.#view = view;
    this.#apiModel = apiModel;
  }

  async showReportDetail() {
    this.#view.showReportDetailLoading();
    try {
      const response = await this.#apiModel.getReportById(this.#reportId);

      if (!response.ok) {
        this.#view.populateReportDetailError(response.message);
        return;
      }

      this.report = response.data;
      this.#view.populateReportDetailAndInitialMap(response.message, response.data);

      await this.showSaveButton(); // ✅ tampilkan tombol bookmark
    } catch (error) {
      this.#view.populateReportDetailError(error.message);
    } finally {
      this.#view.hideReportDetailLoading();
    }
  }

  async saveReport() {
    try {
      const report = await this.#apiModel.getReportById(this.#reportId);
      await Database.putStory(report.data);
      this.#view.saveToBookmarkSuccessfully('Disimpan ke bookmark!');
      await this.showSaveButton();
    } catch (error) {
      this.#view.saveToBookmarkFailed(error.message);
    }
  }

  async removeReport() {
    try {
      await Database.removeStory(this.#reportId);
      this.#view.removeBookmarkSuccessfully('Dihapus dari bookmark!');
      await this.showSaveButton();
    } catch (err) {
      this.#view.removeBookmarkFailed(err.message);
    }
  }

  async #isReportSaved() {
    const saved = await Database.getStoryById(this.#reportId);
    return !!saved;
  }

  async showSaveButton() {
    if (await this.#isReportSaved()) {
      this.#view.renderRemoveButton();
    } else {
      this.#view.renderSaveButton();
    }
  }
  async getCommentsList() {
  // TODO: implement comment fetch logic later
  return [];
}

  async showReportDetailMap({ lat, lng }) {
    // TODO: implement map logic later
    console.warn('Map function belum dibuat, koordinat:', lat, lng);
  }

}
