/// <reference types="tampermonkey" />
import type { Badge } from '../common/badge';

const _openInTab: typeof GM_openInTab =
    typeof GM_openInTab == 'function'
        ? GM_openInTab
        : function (url) {
              const opened = window.open(url);
              return {
                  close() {
                      opened?.close();
                      this.onclose?.();
                      this.closed = true;
                  },
                  closed: false,
              };
          };

export function openInTab(url: string): void {
    _openInTab(url, { active: true, insert: true, setParent: true });
}

export function setBadge(info: Badge): void {
    const badge = document.getElementById('eh-syringe-popup-badge') as HTMLDivElement;
    if (badge) {
        if (info.text != null) {
            badge.innerText = info.text;
            badge.style.visibility = info.text ? 'visible' : 'hidden';
        }
        if (info.background != null) {
            badge.style.background = info.background;
        }
    }
}
