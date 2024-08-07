import { SimplePool } from 'nostr-tools/pool';
import { generateSecretKey } from 'nostr-tools/pure';
import App from './lib/components/App.svelte';

declare global {
  var makibishi: object;
}

(() => {
  const pool = new SimplePool();
  const anonymousSeckey = generateSecretKey();

  const initTarget = (element: HTMLElement): void => {
    if (!element.hasChildNodes()) {
      new App({
        target: element,
        props: {
          element,
          pool,
          anonymousSeckey,
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

  if (typeof window === 'object') {
    window.makibishi = { initTarget, initTargets };
    document.addEventListener('DOMContentLoaded', () => {
      initTargets();
    });
  }
})();
