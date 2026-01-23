// RIGHT panel: ApexCharts Candlestick + Overlay Div (no bezier, red border overlay)
(function () {
  window.ProtonPanels = window.ProtonPanels || {};

  window.ProtonPanels.createRight = function () {
    const container = document.createElement('div');
    container.className = 'right-section';

    container.style.minWidth = '0';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '12px';
    container.style.height = '100%';

    const FIXED_HEIGHT = 300;
    const CANDLE_COUNT = 50;
    const PRICE_MIN = 0;
    const PRICE_MAX = 100;

    container.innerHTML = `
      <h3 style="margin:0;color:#0af;font-size:16px">Behavioral Settings</h3>
      <p style="margin:0;color:#cfe8ff;opacity:0.9">
        This Is How The Bots Will Behave HERE 7
      </p>
      <div id="apex-candlestick" style="width:100%;height:${FIXED_HEIGHT}px;position:relative;"></div>
    `;

    const chartDiv = container.querySelector('#apex-candlestick');

    /* -------------------- LOAD APEX -------------------- */
    function loadApexCharts() {
      return new Promise((resolve, reject) => {
        if (window.ApexCharts) return resolve();
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/apexcharts@3.41.0/dist/apexcharts.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    /* -------------------- CANDLES (simple deterministic-ish generator with small randomness) -------------------- */
    function generateCandles() {
      const candles = [];
      // start roughly mid-range
      let price = (PRICE_MIN + PRICE_MAX) / 2;

      for (let i = 0; i < CANDLE_COUNT; i++) {
        // small deterministic-ish movement + tiny randomness
        const drift = Math.sin(i * 0.15) * 0.6; // gentle wave
        const noise = (Math.random() - 0.5) * 0.6; // small randomness
        const open = price;
        const close = Math.min(PRICE_MAX, Math.max(PRICE_MIN, open + drift + noise));
        const high = Math.max(open, close) + Math.random() * 0.4;
        const low = Math.min(open, close) - Math.random() * 0.4;

        candles.push({
          x: Date.now() + i * 86400000,
          y: [+open.toFixed(2), +high.toFixed(2), +low.toFixed(2), +close.toFixed(2)]
        });

        price = close;
      }
      return candles;
    }

    /* -------------------- RED BORDER OVERLAY (no bezier/svg) -------------------- */
    // Create overlay div now (but it will be appended after chart render to ensure it's on top)
    const overlayDiv = document.createElement('div');
    overlayDiv.style.position = 'absolute';
    overlayDiv.style.top = '0';
    overlayDiv.style.left = '0';
    overlayDiv.style.width = '100%';
    overlayDiv.style.height = '100%';
    overlayDiv.style.pointerEvents = 'none'; // do not block chart interactions
    overlayDiv.style.border = '2px solid red';
    overlayDiv.style.background = 'transparent';
    overlayDiv.style.boxSizing = 'border-box';
    overlayDiv.style.zIndex = '2147483647'; // very high z-index
    // Note: we'll append overlayDiv after chart.render() so it sits above Apex internals.

    /* -------------------- CHART -------------------- */
    let chart;

    function updateChart() {
      if (!chart) return;
      chart.updateSeries([{ data: generateCandles() }], false);
      // Re-append overlay to ensure it stays last child on chartDiv
      if (overlayDiv.parentNode !== chartDiv) chartDiv.appendChild(overlayDiv);
      else chartDiv.appendChild(overlayDiv);
    }

    function initChart() {
      chart = new ApexCharts(chartDiv, {
        chart: {
          type: 'candlestick',
          height: FIXED_HEIGHT,
          toolbar: { show: false },
          zoom: { enabled: false },
          background: 'transparent',
          animations: { enabled: false },
          redrawOnParentResize: true
        },
        series: [{ data: generateCandles() }],
        plotOptions: { candlestick: { colors: { upward: '#26a69a', downward: '#ef5350' } } },
        grid: { show: false },
        tooltip: { enabled: false },
        xaxis: { type: 'datetime' },
        yaxis: {
          min: PRICE_MIN,
          max: PRICE_MAX,
          labels: { style: { colors: '#aaa' } }
        }
      });

      chart.render().then(() => {
        // append overlay after render so it sits on top
        if (overlayDiv.parentNode !== chartDiv) chartDiv.appendChild(overlayDiv);

        // MutationObserver: ApexCharts may replace children — keep overlay as last child
        const mo = new MutationObserver(() => {
          // small frame delay to allow Apex internal changes
          requestAnimationFrame(() => {
            if (overlayDiv.parentNode !== chartDiv) chartDiv.appendChild(overlayDiv);
          });
        });
        mo.observe(chartDiv, { childList: true });

        // ResizeObserver: keep overlay size in sync with chartDiv
        const ro = new ResizeObserver(() => {
          overlayDiv.style.width = chartDiv.clientWidth + 'px';
          overlayDiv.style.height = chartDiv.clientHeight + 'px';
          // In case chart needs update on resize
          if (chart) chart.updateOptions({ chart: { width: chartDiv.clientWidth } }, false);
        });
        ro.observe(chartDiv);

        // keep overlay on top initially
        chartDiv.appendChild(overlayDiv);
      });
    }

    /* -------------------- INIT -------------------- */
    loadApexCharts()
      .then(initChart)
      .catch(err => console.error('[Proton] ApexCharts failed', err));

    return container;
  };
})();
