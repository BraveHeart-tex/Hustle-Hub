import { createRoot } from 'react-dom/client';

import { DeploymentWidgetApp } from '@/components/deployment-widget/DeploymentWidgetApp';
import { defineContentScript } from '#imports';

const DEPLOYMENT_WIDGET_MATCH = import.meta.env.VITE_DEPLOYMENT_WIDGET_MATCH;
const DEPLOYMENT_WIDGET_PROJECT_PATH = import.meta.env
  .VITE_DEPLOYMENT_WIDGET_PROJECT_PATH;
const DISABLED_DEPLOYMENT_WIDGET_MATCH = '*://example.invalid/*';

function getDeploymentIdFromScripts(): string | null {
  const scripts = Array.from(document.scripts);

  for (const script of scripts) {
    if (!script.src) continue;

    try {
      const url = new URL(script.src, location.origin);
      const dpl = url.searchParams.get('dpl');
      if (dpl) return dpl;
    } catch {
      // ignore malformed URLs
    }
  }

  return null;
}

export default defineContentScript({
  matches: [DEPLOYMENT_WIDGET_MATCH || DISABLED_DEPLOYMENT_WIDGET_MATCH],
  runAt: 'document_end',
  cssInjectionMode: 'ui',
  async main(ctx) {
    if (!DEPLOYMENT_WIDGET_PROJECT_PATH) {
      return;
    }

    const deploymentId = getDeploymentIdFromScripts();
    if (!deploymentId) {
      return;
    }

    const ui = await createShadowRootUi(ctx, {
      name: 'deployment-widget-ui',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount: (container) => {
        const app = document.createElement('div');
        container.append(app);

        const root = createRoot(app);
        root.render(
          <DeploymentWidgetApp
            container={container}
            deploymentId={deploymentId}
            projectPath={DEPLOYMENT_WIDGET_PROJECT_PATH}
          />,
        );

        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
