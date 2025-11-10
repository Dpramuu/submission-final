export default class NewPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async postNewReport({ description, photo, lat, lon }) {
    this.#view.showSubmitLoadingButton();
    try {
      const formData = new FormData();
      formData.append('description', description);
      formData.append('photo', photo);
      formData.append('lat', lat);
      formData.append('lon', lon);

      const response = await this.#model.storeNewReport(formData);

      if (!response || response.error) {
        console.error('postNewReport: response:', response);
        this.#view.storeFailed(response?.message || 'Gagal upload story.');
        return;
      }

      this.#notifyToAllUser(); 
      this.#view.storeSuccessfully(response.message);
    } catch (error) {
      console.error('postNewReport: error:', error);
      this.#view.storeFailed(error.message);
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }
    
   async #notifyToAllUser() {
    try {
      const response = await this.#model.sendReportToAllUserViaNotification();
      if (!response.ok) {
        console.error('#notifyToAllUser: response:', response);
        return false;
      }
      return true;
    } catch (error) {
      console.error('#notifyToAllUser: error:', error);
      return false;
    }
  }
}
