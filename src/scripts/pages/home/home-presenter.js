export default class HomePresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async showReportsListMap(reports) {
    this.#view.showMapLoading();
    try {
      await this.#view.initialMap(reports);
    } catch (error) {
      console.error('showReportsListMap: error:', error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async initialGalleryAndMap() {
    this.#view.showLoading();
    try {
      const response = await this.#model.getAllReports();
      console.debug('initialGalleryAndMap response:', response);

      if (!response.ok) {
        console.error('initialGalleryAndMap: response:', response);
        this.#view.populateReportsListError(response.message);
        return;
      }

      const reports = Array.isArray(response.data) ? response.data : [];
      
      await this.#view.initialMap(reports);
      
      this.#view.populateReportsList(response.message, reports);
    } catch (error) {
      console.error('initialGalleryAndMap: error:', error);
      this.#view.populateReportsListError(error.message);
    } finally {
      this.#view.hideLoading();
    }
  }
}
