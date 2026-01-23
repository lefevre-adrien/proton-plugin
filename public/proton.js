(function () {
  const Proton = {
    init(options) {
      if (!options || !options.container) {
        throw new Error('[Proton] container is required')
      }

      const container =
        typeof options.container === 'string'
          ? document.getElementById(options.container)
          : options.container

      if (!container) {
        throw new Error('[Proton] container not found')
      }

      if (container.__protonMounted) return
      container.__protonMounted = true

      const shadow = container.attachShadow({ mode: 'open' })

      const style = document.createElement('style')
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

        .plugin-container {
          display: flex;
          flex-direction: row;
          gap: 24px;
        }

        @media (max-width: 700px) {
          .plugin-container {
            flex-direction: column;
          }
        }

        .left-section {
          flex: 0 0 320px;
          padding: 24px;
          background: #1f1f1f;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
          border-left: 4px solid #0af;
        }

        .right-section {
          flex: 1;
          padding: 24px;
          background: #222;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
          border-left: 4px solid #0af;
        }

        select, input, button {
          background: #2c2c2c;
          color: #eee;
          border: 1px solid #444;
          border-radius: 8px;
          padding: 10px;
          margin-bottom: 14px;
          width: 100%;
          box-sizing: border-box;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        select:hover, input:hover, button:hover {
          background: #3a3a3a;
          border-color: #0af;
        }

        button {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        button:hover {
          background: #0af;
          color: #000;
          transform: translateY(-1px);
        }

        .row {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
        }

        .collapsible {
          border: 1px solid #333;
          border-radius: 8px;
          margin-bottom: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .collapsible-header {
          padding: 12px 16px;
          background: rgb(0, 132, 198);
          cursor: pointer;
          user-select: none;
          font-weight: 600;
          transition: background 0.2s, color 0.2s;
          color: #eee;
        }

        .collapsible-header:hover {
          background: #0af;
        }

        .collapsible-content {
          max-height: 0;
          padding: 0 16px;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .collapsible.open .collapsible-content {
          max-height: 500px;
          padding: 12px 16px;
        }

        label {
          display: block;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .number-input {
          width: 120px;
        }
      `

      const wrapper = document.createElement('div')
      wrapper.innerHTML = `
        <div class="plugin-container">
          <div class="left-section">
            <!-- Account Selection -->
            <label for="account-select">Select Account</label>
            <select id="account-select">
              <option>ABCD....WXYZ</option>
              <option>1234....5678</option>
              <option>AAAA....ZZZZ</option>
            </select>

            <!-- Import Private Key -->
            <div class="row">
              <input type="password" placeholder="Private key" />
              <button id="import-key-btn">Import</button>
            </div>

            <!-- Collapsible Sections -->
            <div class="collapsible" id="general-section">
              <div class="collapsible-header">General</div>
              <div class="collapsible-content">
                <label>General Field 1</label>
                <input type="text" placeholder="Value 1" />
                <label>General Field 2</label>
                <input type="text" placeholder="Value 2" />
              </div>
            </div>

            <div class="collapsible" id="advanced-section">
              <div class="collapsible-header">Advanced</div>
              <div class="collapsible-content">
                <label>Advanced Field 1</label>
                <input type="text" placeholder="Value 1" />
                <label>Advanced Field 2</label>
                <input type="text" placeholder="Value 2" />
              </div>
            </div>

            <!-- Number of cycles and Run -->
            <div class="row">
              <input class="number-input" type="number" placeholder="Cycles" />
              <button id="run-btn">Run</button>
            </div>
          </div>

          <div class="right-section">
            <!-- Placeholder for right section content -->
            <p style="color:#0af;">Right section content goes here.</p>
          </div>
        </div>
      `

      shadow.appendChild(style)
      shadow.appendChild(wrapper)

      // Collapsible toggle
      const collapsibles = shadow.querySelectorAll('.collapsible')
      collapsibles.forEach(section => {
        const header = section.querySelector('.collapsible-header')
        header.addEventListener('click', () => {
          section.classList.toggle('open')
        })
      })
    }
  }

  window.Proton = Proton
})()
