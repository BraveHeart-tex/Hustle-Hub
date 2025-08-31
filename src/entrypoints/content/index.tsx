import {
  ContentScriptContext,
  createShadowRootUi,
  defineContentScript,
} from '#imports';
import '@/assets/tailwind.css';
import { createRoot } from 'react-dom/client';
import { CommandDialogDemo } from './App.tsx';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    console.log('Hello content script!', { id: browser.runtime.id });

    const ui = await createShadowRootUi(ctx, {
      name: 'bookmark-search-overlay',
      position: 'inline',
      anchor: 'body',
      append: 'first',
      inheritStyles: false,
      onMount(container) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
          width: 100%;
          height: 100%;
          pointer-events: auto !important;
          overflow: auto !important;
          overscroll-behavior: contain !important;
        `;

        container.appendChild(wrapper);
        const root = createRoot(wrapper);

        root.render(<CommandDialogDemo portalContainer={container} />);
        return {
          root,
          wrapper,
        };
      },
      onRemove: (elements) => {
        elements?.root?.unmount();
        elements?.wrapper?.remove();
      },
    });

    ui.mount();
  },
});
