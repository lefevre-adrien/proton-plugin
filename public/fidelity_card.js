(function () {
    window.FidelityCard = {
        init(config) {
            if (!config) throw new Error('[FidelityCard] Configuration object is required');
            const { container, options = {} } = config;

            let containerEl = typeof container === 'string' ? document.getElementById(container) : container;
            if (!containerEl) throw new Error('[FidelityCard] container not found');

            if (containerEl.__fidelityMounted) return window.FidelityCard.instance;
            containerEl.__fidelityMounted = true;

            // Mount inside Shadow DOM for style encapsulation just like proton.js
            const shadow = containerEl.attachShadow({ mode: 'open' });

            // Default options map
            const defaultOpts = {
                title: "LOYALTY CARD",
                totalSlots: 10,
                stampedSlots: 0,
                freeSlotText: "FREE",
                promotionText: "Buy 9 products and get the 10th FREE",
                addressText: "123, False Street, City, Country",

                // Design aesthetics
                cardBg: '#ffffff',
                textColor: '#000000',
                circleBorder: '#333333',
                stampColor: '#c5e8e8',
                fontFamily: "'Inter', system-ui, sans-serif",
                slotSize: '65px'
            };

            const style = document.createElement('style');
            style.textContent = `
          :host {
              display: block;
              width: 100%;
          }

          .fc-wrapper {
              font-family: var(--fc-font-family, 'Inter', system-ui, sans-serif);
              background-color: var(--fc-card-bg, #ffffff);
              width: 100%;
              max-width: 540px;
              border-radius: 8px;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
              padding: 40px 50px;
              text-align: center;
              color: var(--fc-text-color, #000000);
              box-sizing: border-box;
              transition: background-color 0.3s ease, color 0.3s ease;
          }

          .fc-header {
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 35px;
          }

          .fc-header::before, .fc-header::after {
              content: "";
              flex: 1;
              height: 2px;
              background-color: var(--fc-text-color, #000000);
              margin: 0 15px;
              transition: background-color 0.3s ease;
          }

          .fc-header h1 {
              margin: 0;
              font-size: 1.6rem;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-weight: 800;
          }

          .fc-slots-container {
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              gap: 15px;
              margin-bottom: 35px;
              max-width: 420px; 
              margin-left: auto;
              margin-right: auto;
          }

          .fc-slot {
              width: var(--fc-slot-size, 65px);
              height: var(--fc-slot-size, 65px);
              border: 2px solid var(--fc-circle-border, #333333);
              border-radius: 50%;
              display: flex;
              justify-content: center;
              align-items: center;
              position: relative;
              background-color: transparent;
              box-sizing: border-box;
              transition: border-color 0.3s ease;
          }

          .fc-slot.fc-stamped::after {
              content: "";
              width: 65%;
              height: 65%;
              background-color: var(--fc-stamp-color, #c5e8e8);
              border-radius: 50%;
              animation: fcPopIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
              transition: background-color 0.3s ease;
          }

          .fc-slot.fc-free {
              background-color: var(--fc-stamp-color, #c5e8e8);
              font-weight: 800;
              font-size: 0.95rem;
              border-width: 2px;
              transition: background-color 0.3s ease;
          }

          .fc-promo-text {
              font-weight: 800;
              font-size: 1.15rem;
              margin-bottom: 10px;
          }

          .fc-address-text {
              font-size: 1rem;
              color: var(--fc-text-color, #000000);
              opacity: 0.8;
              font-weight: 400;
              transition: color 0.3s ease;
          }

          @keyframes fcPopIn {
              from { transform: scale(0); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
          }
      `;

            const wrapper = document.createElement('div');
            wrapper.className = 'fc-wrapper';

            const instance = {
                currentOptions: { ...defaultOpts, ...options },
                wrapper: wrapper,
                shadow: shadow,
                render() {
                    const o = this.currentOptions;

                    // Apply CSS variables dynamically if changed
                    this.wrapper.style.setProperty('--fc-font-family', o.fontFamily);
                    this.wrapper.style.setProperty('--fc-card-bg', o.cardBg);
                    this.wrapper.style.setProperty('--fc-text-color', o.textColor);
                    this.wrapper.style.setProperty('--fc-circle-border', o.circleBorder);
                    this.wrapper.style.setProperty('--fc-stamp-color', o.stampColor);
                    this.wrapper.style.setProperty('--fc-slot-size', o.slotSize);

                    let slotsHtml = '';
                    for (let i = 1; i <= o.totalSlots; i++) {
                        const isStamped = i <= o.stampedSlots;
                        const isFreeSlot = i === o.totalSlots;

                        if (isFreeSlot) {
                            slotsHtml += `<div class="fc-slot fc-free">${o.freeSlotText}</div>`;
                        } else {
                            slotsHtml += `<div class="fc-slot ${isStamped ? 'fc-stamped' : ''}"></div>`;
                        }
                    }

                    this.wrapper.innerHTML = `
                  <div class="fc-header">
                      <h1>${o.title}</h1>
                  </div>
                  <div class="fc-slots-container">
                      ${slotsHtml}
                  </div>
                  <div class="fc-promo-text">${o.promotionText}</div>
                  <div class="fc-address-text">${o.addressText}</div>
              `;
                },
                update(newData) {
                    this.currentOptions = { ...this.currentOptions, ...newData };
                    this.render();
                }
            };

            shadow.appendChild(style);
            shadow.appendChild(wrapper);

            instance.render();
            window.FidelityCard.instance = instance;
            return instance;
        }
    };
})();
