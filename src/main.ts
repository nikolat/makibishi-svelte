import { SimplePool } from 'nostr-tools/pool';
import App from './lib/components/App.svelte';

const pool = new SimplePool();

const initTarget = (element: HTMLElement): void => {
  if (!element.hasChildNodes()) {
    new App({
      target: element,
      props: {
        element,
        pool,
      },
    });
  }
};

const initTargets = (selector?: string): void => {
  document
    .querySelectorAll<HTMLElement>(selector || '.makibishi')
    .forEach((element) => {
      initTarget(element);
    });
};

declare global {
  var makibishi: object;
}

if (typeof window === 'object') {
  initTargets();
  window.makibishi = { initTarget, initTargets };
}
