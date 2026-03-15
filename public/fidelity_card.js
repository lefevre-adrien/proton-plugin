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
                firebaseConfig: {
                    apiKey: "YOUR_FIREBASE_API_KEY",
                    appId: "YOUR_FIREBASE_APP_ID",
                    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
                    projectId: "YOUR_PROJECT_ID"
                },
                apiKey: "YOUR_MERCHANT_API_KEY",
                backendUrl: "https://proton-plugin-backend.onrender.com",
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
              max-width: 680px; /* Widened the card slightly */
              border-radius: 8px;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
              padding: 40px 30px; /* Reduced side padding slightly to give slots room */
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
              /* Gave the columns more breathing room so they easily expand */
              gap: 40px; 
              align-items: center;
              margin-bottom: 35px;
              width: 100%;
          }

          .fc-column {
              display: flex;
              flex-direction: column;
              gap: 15px; /* Spacing between slots vertically */
              width: 100%;
          }

          /* Ensure slots take up as much space as they cleanly can in their grid tracks */
          .fc-col-left { align-items: flex-end; }
          .fc-col-right { align-items: flex-start; }

          .fc-col-center {
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 0 5px;
          }

          .fc-logo {
              width: 100%;
              max-width: 180px; /* Allow logo to be a bit bigger if needed */
              height: auto;
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
          
          /* Container for the real Google Button */
          #g_id_signin_container {
              display: flex;
              justify-content: center;
              min-height: 40px; /* Pre-allocate space to avoid jank */
          }

          @keyframes fcPopIn {
              from { transform: scale(0); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
          }

          @keyframes fcFadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
          }
          
          /* ================= RESPONSIVE MOBILE VIEW ================= */
          @media (max-width: 550px) {
              .fc-main-grid {
                  grid-template-columns: 1fr; /* Stack into 1 column */
                  gap: 20px;
              }
              
              .fc-col-left, .fc-col-right {
                  align-items: center; /* Center the slots on mobile */
                  flex-direction: row; /* Layout horizontal instead of vertical */
                  flex-wrap: wrap;
                  justify-content: center;
              }
              
              .fc-logo {
                  max-width: 130px; /* Make logo smaller on very tight screens */
              }
              
              /* We move the logo to the top for mobile layout */
              .fc-col-center {
                  order: -1; 
                  margin-bottom: 10px;
              }
          }
      `;

            const wrapper = document.createElement('div');
            wrapper.className = 'fc-wrapper';

            const instance = {
                currentOptions: { ...defaultOpts, ...options },
                wrapper: wrapper,
                shadow: shadow,
                user: null, // Setup user logic
                loading: true, // Start in loading state

                init() {
                    const o = this.currentOptions;

                    // Initialize the rendering early (shows unauthenticated view)
                    this.render();

                    // Load Google Identity Services dynamically if needed
                    this.initGoogleAuth();

                    // Trigger init callback initially
                    if (typeof o.onInit === 'function') {
                        // Will be null at first load
                        o.onInit(this.user);
                    }
                },

                // --- Firebase Authentication Flow ---
                async initGoogleAuth() {
                    const config = this.currentOptions.firebaseConfig;
                    if (!config || !config.apiKey || config.apiKey === "YOUR_FIREBASE_API_KEY") {
                        console.warn("[FidelityCard] No valid Firebase config provided. Authentication disabled.");
                        return;
                    }

                    // Load Firebase scripts if not present
                    await this.loadFirebaseScripts();

                    // Initialize Firebase if not already initialized
                    if (!firebase.apps.length) {
                        firebase.initializeApp(config);
                    }

                    // Check if user is already logged in
                    firebase.auth().onAuthStateChanged(async (firebaseUser) => {
                        if (firebaseUser) {
                            const idToken = await firebaseUser.getIdToken();
                            await this.handleUserAuth(firebaseUser, idToken);
                        } else {
                            this.user = null;
                            this.loading = false; // Done checking
                            this.render();

                            // Auto-trigger login if QR code is detected "no matter what"
                            const urlParams = new URLSearchParams(window.location.search);
                            if (urlParams.has('qr')) {
                                console.log("[FidelityCard] QR detected and no session. Attempting auto-login...");
                                this.loginWithGoogle();
                            }
                        }
                    });
                },

                loadFirebaseScripts() {
                    const scripts = [
                        "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js",
                        "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js"
                    ];

                    return Promise.all(scripts.map(src => {
                        return new Promise((resolve) => {
                            if (document.querySelector(`script[src="${src}"]`)) {
                                resolve();
                                return;
                            }
                            const script = document.createElement('script');
                            script.src = src;
                            script.async = true;
                            script.onload = resolve;
                            document.head.appendChild(script);
                        });
                    }));
                },

                async loginWithGoogle() {
                    const provider = new firebase.auth.GoogleAuthProvider();
                    try {
                        const result = await firebase.auth().signInWithPopup(provider);
                        const idToken = await result.user.getIdToken();
                        await this.handleUserAuth(result.user, idToken);
                    } catch (error) {
                        console.error("[FidelityCard] Login failed", error);
                    }
                },

                async handleUserAuth(firebaseUser, idToken) {
                    try {
                        // Verify token with backend and get user data
                        const response = await fetch(`${this.currentOptions.backendUrl}/auth/verify-token`, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'x-api-key': this.currentOptions.apiKey
                            },
                            body: JSON.stringify({ idToken })
                        });

                        const userData = await response.json();

                        this.user = {
                            ...userData,
                            idToken: idToken
                        };

                        // Sync options with backend-provided merchant config
                        if (userData.totalSlots) this.currentOptions.totalSlots = userData.totalSlots;
                        if (userData.promotionText) this.currentOptions.promotionText = userData.promotionText;

                        this.render();

                        // --- Automatic QR Stamping Logic ---
                        const urlParams = new URLSearchParams(window.location.search);
                        const qrId = urlParams.get('qr');

                        if (qrId && !this._qrProcessed) {
                            this._qrProcessed = true; // Prevent double trigger
                            await this.processQrStamp(qrId);
                        }

                        this.loading = false;
                        this.render();

                        if (typeof this.currentOptions.onInit === 'function') {
                            this.currentOptions.onInit(this.user);
                        }
                    } catch (err) {
                        console.error("[FidelityCard] Backend verification failed", err);
                        this.loading = false;
                        this.render();
                    }
                },

                async processQrStamp(qrId) {
                    try {
                        const response = await fetch(`${this.currentOptions.backendUrl}/api/card/qr-stamp`, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${this.user.idToken}`,
                                'x-api-key': this.currentOptions.apiKey
                            },
                            body: JSON.stringify({ qrId })
                        });

                        const result = await response.json();
                        if (result.success) {
                            this.user.stampedSlots = result.stampedSlots;
                            // Update tier info if card was completed
                            if (result.totalSlots) this.currentOptions.totalSlots = result.totalSlots;
                            if (result.promotionText) this.currentOptions.promotionText = result.promotionText;

                            this.render();
                            
                            if (result.rewardUnlocked) {
                                // You could trigger a nice confetti animation here instead of an alert!
                                console.log("[FidelityCard] Reward unlocked!");
                            }
                        }
                        
                        // Clean up URL to prevent confusion on reload
                        const url = new URL(window.location);
                        url.searchParams.delete('qr');
                        window.history.replaceState({}, document.title, url);

                    } catch (err) {
                        console.error("[FidelityCard] QR Stamp failed", err);
                    }
                },

                logout() {
                    firebase.auth().signOut().then(() => {
                        this.user = null;
                        this.render();
                        if (typeof this.currentOptions.onInit === 'function') {
                            this.currentOptions.onInit(this.user);
                        }
                    });
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

                    // View 0: Loading
                    if (this.loading) {
                        this.wrapper.innerHTML = `
                            <div style="display: flex; justify-content: center; align-items: center; min-height: 200px;">
                                <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #333; border-radius: 50%; animation: fcSpin 1s linear infinite;"></div>
                            </div>
                            <style>
                                @keyframes fcSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                            </style>
                        `;
                        return;
                    }

                    // View 1: Not Connected
                    if (!this.user) {
                        this.wrapper.innerHTML = `
                      <div class="fc-header">
                          <h1>${o.title}</h1>
                      </div>
                      <div class="fc-login-view">
                          <img src="${o.logoUrl}" class="fc-logo" alt="Logo" />
                          
                           <!-- Google Sign-In Button -->
                           <div id="fc-login-container">
                              <button id="fc-login-btn" style="background: white; color: #444; border: 1px solid #ddd; padding: 10px 20px; border-radius: 4px; display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 500;">
                                 <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18" alt="Google" />
                                 Continue with Google
                              </button>
                           </div>
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

            // Click listener for login button (delegated since innerHTML is replaced)
            wrapper.addEventListener('click', (e) => {
                const btn = e.target.closest('#fc-login-btn');
                if (btn) {
                    instance.loginWithGoogle();
                }
            });

            instance.init();
            containerEl.__fidelityInstance = instance;
            return instance;
        }
    };
})();
