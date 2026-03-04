(function () {
    window.FidelityCard = {
        init(config) {
            if (!config) throw new Error('[FidelityCard] Configuration object is required');
            const { container, options = {} } = config;

            let containerEl = typeof container === 'string' ? document.getElementById(container) : container;
            if (!containerEl) throw new Error('[FidelityCard] container not found');

            if (containerEl.__fidelityMounted) return containerEl.__fidelityInstance;
            containerEl.__fidelityMounted = true;

            // Mount inside Shadow DOM for style encapsulation just like proton.js
            const shadow = containerEl.attachShadow({ mode: 'open' });

            // Default options map with the original aesthetics but added logo and onInit
            const defaultOpts = {
                title: "LOYALTY CARD",
                totalSlots: 10,
                stampedSlots: 0,
                freeSlotText: "FREE",
                promotionText: "Buy 9 products and get the 10th FREE",
                addressText: "123, False Street, City, Country",
                logoUrl: "https://placehold.co/180x250/transparent/333?text=LOGO",
                onInit: null, // Callback triggered on auth state change

                // Original design aesthetics
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
              max-width: 600px;
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

          /* Layout Grid: 3 columns (Left Slots | Logo | Right Slots) */
          .fc-main-grid {
              display: grid;
              grid-template-columns: 1fr auto 1fr;
              gap: 20px;
              align-items: center;
              margin-bottom: 35px;
          }

          .fc-column {
              display: flex;
              flex-direction: column;
              gap: 15px; /* Spacing between slots vertically */
          }

          .fc-col-left { align-items: flex-end; }
          .fc-col-right { align-items: flex-start; }

          .fc-col-center {
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 0 15px;
          }

          .fc-logo {
              max-width: 160px;
              max-height: 250px;
              object-fit: contain;
              animation: fcFadeIn 0.8s ease;
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

          /* ================= LOGIN VIEW STYLES ================= */
          .fc-login-view {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 300px;
              gap: 30px;
              animation: fcFadeIn 0.5s ease;
          }

          .fc-google-btn {
              display: flex;
              align-items: center;
              gap: 12px;
              background-color: #ffffff;
              color: #3c4043;
              border: 1px solid #dadce0;
              border-radius: 4px;
              padding: 10px 24px;
              font-size: 15px;
              font-weight: 500;
              font-family: 'Roboto', 'Inter', sans-serif;
              cursor: pointer;
              transition: background-color 0.2s, box-shadow 0.2s;
              box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15);
          }

          .fc-google-btn:hover {
              background-color: #f8f9fa;
              box-shadow: 0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15);
          }

          .fc-google-icon { width: 18px; height: 18px; }

          @keyframes fcPopIn {
              from { transform: scale(0); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
          }

          @keyframes fcFadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
          }
      `;

            const wrapper = document.createElement('div');
            wrapper.className = 'fc-wrapper';

            const instance = {
                currentOptions: { ...defaultOpts, ...options },
                wrapper: wrapper,
                shadow: shadow,
                user: null, // Setup user logic

                init() {
                    const o = this.currentOptions;

                    // Expose login function for button
                    window.__fcGoogleLoginFlow = () => {
                        this.simulateGoogleLogin();
                    };

                    this.render();

                    // Trigger init callback
                    if (typeof o.onInit === 'function') {
                        o.onInit(this.user);
                    }
                },

                simulateGoogleLogin() {
                    setTimeout(() => {
                        this.user = {
                            id: "1098273645",
                            name: "Jean Dupont",
                            email: "jean.dupont@gmail.com",
                            picture: "https://placehold.co/100x100/4285F4/white?text=JD"
                        };
                        this.render();
                        if (typeof this.currentOptions.onInit === 'function') {
                            this.currentOptions.onInit(this.user);
                        }
                    }, 400); // Small realistic delay
                },

                logout() {
                    this.user = null;
                    this.render();
                    if (typeof this.currentOptions.onInit === 'function') {
                        this.currentOptions.onInit(this.user);
                    }
                },

                render() {
                    const o = this.currentOptions;

                    // Apply CSS variables dynamically if changed
                    this.wrapper.style.setProperty('--fc-font-family', o.fontFamily);
                    this.wrapper.style.setProperty('--fc-card-bg', o.cardBg);
                    this.wrapper.style.setProperty('--fc-text-color', o.textColor);
                    this.wrapper.style.setProperty('--fc-circle-border', o.circleBorder);
                    this.wrapper.style.setProperty('--fc-stamp-color', o.stampColor);
                    this.wrapper.style.setProperty('--fc-slot-size', o.slotSize);

                    // View 1: Not Connected
                    if (!this.user) {
                        this.wrapper.innerHTML = `
                      <div class="fc-header">
                          <h1>${o.title}</h1>
                      </div>
                      <div class="fc-login-view">
                          <img src="${o.logoUrl}" class="fc-logo" alt="Logo" />
                          <button class="fc-google-btn" onclick="window.__fcGoogleLoginFlow()">
                              <svg class="fc-google-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                              Se connecter avec Google
                          </button>
                      </div>
                      <div class="fc-promo-text">${o.promotionText}</div>
                      <div class="fc-address-text">${o.addressText}</div>
                  `;
                        return;
                    }

                    // View 2: Connected (2 columns grid + logo)
                    let leftSlots = '';
                    let rightSlots = '';

                    const halfPoint = Math.ceil(o.totalSlots / 2);

                    for (let i = 1; i <= o.totalSlots; i++) {
                        const isStamped = i <= o.stampedSlots;
                        const isFreeSlot = i === o.totalSlots;

                        let slotHtml = '';
                        if (isFreeSlot) {
                            slotHtml = `<div class="fc-slot fc-free">${o.freeSlotText}</div>`;
                        } else {
                            slotHtml = `<div class="fc-slot ${isStamped ? 'fc-stamped' : ''}"></div>`;
                        }

                        if (i <= halfPoint) {
                            leftSlots += slotHtml;
                        } else {
                            rightSlots += slotHtml;
                        }
                    }

                    this.wrapper.innerHTML = `
                  <div class="fc-header">
                      <h1>${o.title}</h1>
                  </div>
                  <div class="fc-main-grid">
                      <div class="fc-column fc-col-left">
                          ${leftSlots}
                      </div>
                      <div class="fc-column fc-col-center">
                          <img src="${o.logoUrl}" class="fc-logo" alt="Logo" />
                      </div>
                      <div class="fc-column fc-col-right">
                          ${rightSlots}
                      </div>
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

            instance.init();
            containerEl.__fidelityInstance = instance;
            return instance;
        }
    };
})();
