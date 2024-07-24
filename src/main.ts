import App from './lib/components/App.svelte';

document.querySelectorAll('.makibishi').forEach((element) => {
  if (!element.hasChildNodes()) {
    new App({
      target: element,
      props: {
        element: element as HTMLElement,
      },
    });
  }
});
