// LEFT panel: account + import + collapsibles + cycles/run
(function() {
  window.ProtonPanels = window.ProtonPanels || {};

  window.ProtonPanels.createLeft = function() {
    const container = document.createElement('div');
    container.className = 'left-section';

    container.innerHTML = `
      <label for="account-select">Select Account</label>
      <select id="account-select">
        <option>ABCD....WXYZ</option>
        <option>1234....5678</option>
        <option>AAAA....ZZZZ</option>
      </select>

      <div class="row">
        <input type="password" placeholder="Private key" />
        <button id="import-key-btn">Import</button>
      </div>

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

      <div class="row">
        <input class="number-input" type="number" placeholder="Cycles" />
        <button id="run-btn">Run</button>
      </div>
    `;

    const collapsibles = container.querySelectorAll('.collapsible');
    collapsibles.forEach(section => {
      const header = section.querySelector('.collapsible-header');
      header.addEventListener('click', () => section.classList.toggle('open'));
    });

    return container;
  };
})();
