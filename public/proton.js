// File: proton.js (global version, self-contained)
// Attaches Proton to window and dynamically loads panel scripts
(function() {

  // Dynamically load a JS file
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Load the left and right panel scripts first
  Promise.all([
    loadScript('https://lefevre-adrien.github.io/proton-plugin/public/bots_settings.js'),
    loadScript('https://lefevre-adrien.github.io/proton-plugin/public/bots_behavioral_settings.js')
  ]).then(() => {

    // Now the panels exist on window.ProtonPanels
    window.Proton = {
      init({ container }) {
        if (!container) throw new Error('[Proton] container is required');
        if (typeof container === 'string') container = document.getElementById(container);
        if (!container) throw new Error('[Proton] container not found');
        if (container.__protonMounted) return;
        container.__protonMounted = true;

        const shadow = container.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.textContent = `
          :host {
            font-family: 'Segoe UI', Roboto, system-ui, sans-serif;
            color: #eee;
            background: #1a1a1a;
            padding: 20px;
            display: block;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.6);
          }

          .plugin-container { display:flex; flex-direction:row; gap:24px; }
          @media (max-width:700px) { .plugin-container { flex-direction:column; } }
          .left-section { flex:0 0 320px; padding:24px; background:#1f1f1f; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,0.4); border-left:4px solid #0af; }
          .right-section { flex:1; padding:24px; background:#222; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,0.4); border-left:4px solid #0af; }

          select, input, button { background:#2c2c2c; color:#eee; border:1px solid #444; border-radius:8px; padding:10px; margin-bottom:14px; width:100%; box-sizing:border-box; font-size:14px; transition:all 0.2s ease; }
          select:hover, input:hover, button:hover { background:#3a3a3a; border-color:#0af; }
          button:hover { background:#0af; color:#000; transform:translateY(-1px); }

          .row { display:flex; gap:10px; margin-bottom:16px; }
          .collapsible { border:1px solid #333; border-radius:8px; margin-bottom:16px; overflow:hidden; transition:all 0.3s ease; }
          .collapsible-header { padding:12px 16px; background:rgb(0,132,198); cursor:pointer; font-weight:600; color:#eee; transition:background 0.2s,color 0.2s; }
          .collapsible-header:hover { background:#0af; }
          .collapsible-content { max-height:0; padding:0 16px; transition:all 0.3s ease; overflow:hidden; }
          .collapsible.open .collapsible-content { max-height:500px; padding:12px 16px; }
          label { display:block; font-size:12px; margin-bottom:4px; }
          .number-input { width:120px; }
        `;

        const wrapper = document.createElement('div');
        wrapper.className = 'plugin-container';

        // Compose panels using the loaded scripts
        const leftPanel = window.ProtonPanels.createLeft();
        const rightPanel = window.ProtonPanels.createRight();

        wrapper.appendChild(leftPanel);
        wrapper.appendChild(rightPanel);

        shadow.appendChild(style);
        shadow.appendChild(wrapper);
      }
    };

  }).catch(err => {
    console.error('[Proton] Failed to load panel scripts', err);
  });

})();
