// RIGHT panel: behavioral settings placeholder
export function createRightPanel() {
  const container = document.createElement('div')
  container.className = 'right-section'

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <h3 style="margin:0;color:#0af;font-size:16px">Behavioral Settings</h3>
      <p style="margin:0;color:#cfe8ff;opacity:0.9">
        Configure per-bot behavior and parameters here.
      </p>

      <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label>Behavior Field A</label>
          <input type="text" placeholder="Value A" />
        </div>
        <div>
          <label>Behavior Field B</label>
          <input type="text" placeholder="Value B" />
        </div>
      </div>

      <div style="margin-top:8px;">
        <label>Notes</label>
        <input type="text" placeholder="Short note about behavior" />
      </div>

      <div style="margin-top:12px;display:flex;gap:10px;">
        <button id="save-behavior-btn">Save</button>
        <button id="reset-behavior-btn">Reset</button>
      </div>
    </div>
  `

  return container
}
