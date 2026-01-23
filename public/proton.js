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
          font-family: system-ui, sans-serif;
          color: #fff;
          background: #121212;
          padding: 16px;
          display: block;
          border-radius: 10px;
          max-width: 400px;
        }

        select, input, button {
          background: #1f1f1f;
          color: #fff;
          border: 1px solid #333;
          border-radius: 6px;
          padding: 8px;
          margin-bottom: 12px;
          width: 100%;
          box-sizing: border-box;
        }

        button {
          cursor: pointer;
          transition: background 0.2s;
        }

        button:hover {
          background: #333;
        }

        .row {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .collapsible {
          border: 1px solid #333;
          border-radius: 6px;
          margin-bottom: 12px;
        }

        .collapsible-header {
          padding: 8px;
          background: #1f1f1f;
          cursor: pointer;
          user-select: none;
        }

        .collapsible-content {
          display: none;
          padding: 8px;
          border-top: 1px solid #333;
        }

        .collapsible.open .collapsible-content {
          display: block;
        }

        label {
          display: block;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .number-input {
          width: 100px;
        }
      `

      const wrapper = document.createElement('div')

      wrapper.innerHTML = `
        <!-- Account Selection -->
        <label for="account-select">Select Public Key</label>
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
      `

      shadow.appendChild(style)
      shadow.appendChild(wrapper)

      // Collapsible logic (just toggle visibility)
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
