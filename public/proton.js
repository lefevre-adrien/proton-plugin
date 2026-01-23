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

      // Default styles, overridden via options.style
      const styleOptions = {
        bg: '#111',
        text: '#fff',
        padding: '16px',
        radius: '8px',
        font: 'system-ui, sans-serif',
        ...options.style
      }

      const style = document.createElement('style')
      style.textContent = `
        .proton-box {
          padding: ${styleOptions.padding};
          border-radius: ${styleOptions.radius};
          background: ${styleOptions.bg};
          color: ${styleOptions.text};
          font-family: ${styleOptions.font};
        }
      `

      const box = document.createElement('div')
      box.className = 'proton-box'
      box.textContent = options.text || 'Proton plugin'

      shadow.appendChild(style)
      shadow.appendChild(box)
    }
  }

  window.Proton = Proton
})()
