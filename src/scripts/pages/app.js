import { getActiveRoute } from '../routes/url-parser';
import {
  generateAuthenticatedNavigationListTemplate,
  generateMainNavigationListTemplate,
  generateSubscribeButtonTemplate,
  generateUnauthenticatedNavigationListTemplate,
  generateUnsubscribeButtonTemplate,
} from '../templates';
import { setupSkipToContent, transitionHelper } from '../utils';
import { getAccessToken, getLogout } from '../utils/auth';
import { routes } from '../routes/routes';
import { isServiceWorkerAvailable } from '../utils/index';
import { isCurrentPushSubscriptionAvailable, subscribe, unsubscribe } from '../utils/notification-helper';

export default class App {
  #content;
  #drawerButton;
  #drawerNavigation;
  #skipLinkButton;

  constructor({ content, drawerNavigation, drawerButton, skipLinkButton }) {
    this.#content = content;
    this.#drawerNavigation = drawerNavigation;
    this.#drawerButton = drawerButton;
    this.#skipLinkButton = skipLinkButton;
    this.#init();
  }

  async #setupPushNotification() {
    const pushRoot = document.getElementById('push-notification-tools');
    if (!pushRoot) return;

    const isSubscribed = await isCurrentPushSubscriptionAvailable();

    if (isSubscribed) {
      pushRoot.innerHTML = generateUnsubscribeButtonTemplate();
      const btn = document.getElementById('unsubscribe-button');
      btn?.addEventListener('click', async () => {
        await unsubscribe();
        await this.#setupPushNotification();
      });
      return;
    }

    pushRoot.innerHTML = generateSubscribeButtonTemplate();
    const btn = document.getElementById('subscribe-button');
    btn?.addEventListener('click', async () => {
      await subscribe();
      await this.#setupPushNotification();
    });
  }

  #init() {
    setupSkipToContent(this.#skipLinkButton, this.#content);
    this.#setupDrawer();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#drawerNavigation.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      const insideDrawer = this.#drawerNavigation.contains(event.target);
      const insideBtn = this.#drawerButton.contains(event.target);

      if (!(insideDrawer || insideBtn)) this.#drawerNavigation.classList.remove('open');

      this.#drawerNavigation.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) this.#drawerNavigation.classList.remove('open');
      });
    });
  }

  #setupNavigationList() {
    const loggedIn = !!getAccessToken();
    const navListMain = this.#drawerNavigation.children.namedItem('navlist-main');
    const navList = this.#drawerNavigation.children.namedItem('navlist');

    if (!loggedIn) {
      navListMain.innerHTML = '';
      navList.innerHTML = generateUnauthenticatedNavigationListTemplate();
      return;
    }

    navListMain.innerHTML = generateMainNavigationListTemplate();
    navList.innerHTML = generateAuthenticatedNavigationListTemplate();

    const logout = document.getElementById('logout-button');
    logout?.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Apakah Anda yakin ingin keluar?')) {
        getLogout();
        location.hash = '/login';
      }
    });
  }

  async renderPage() {
    const url = getActiveRoute();
    const route = routes[url];

    if (!route) {
      this.#content.innerHTML = '<h1>404 - Page not found</h1>';
      return;
    }

    const page = route();
    if (!page) return;

    const transition = transitionHelper({
      updateDOM: async () => {
        this.#content.innerHTML = await page.render();
        page.afterRender();
      },
    });

    transition.ready.catch(console.error);

    transition.updateCallbackDone.then(async () => {
      scrollTo({ top: 0, behavior: 'instant' });

      // Render navigation
      this.#setupNavigationList();

      // Setup push AFTER menu appears
      if (isServiceWorkerAvailable()) {
        await this.#setupPushNotification();
      }
    });
  }
}
