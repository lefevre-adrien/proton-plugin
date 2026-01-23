// RIGHT panel: ApexCharts Candlestick + Straight Line Behavior + Red Border Overlay
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
        This Is How The Bots Will Behave
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

    /* -------------------- STRAIGHT LINE CURVE -------------------- */
    function straightLine(t) {
      // linear from 0.2 to 0.8
      return 0.2 + 0.6 * t;
    }

    function sampleCurve(count) {
      const arr = [];
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : i / (count - 1);
        arr.push(straightLine(t));
      }
      return arr;
    }

    /* -------------------- CANDLE GENERATOR -------------------- */
    function generateCandles() {
      const curve = sampleCurve(CANDLE_COUNT);
      const candles = [];
      let price = PRICE_MIN + curve[0] * (PRICE_MAX - PRICE_MIN);

      for (let i = 0; i < CANDLE_COUNT; i++) {
        const targetPrice = PRICE_MIN + curve[i] * (PRICE_MAX - PRICE_MIN);
        const open = price;
        const close = targetPrice + (Math.random() - 0.5) * 0.2;
        const high = Math.max(open, close) + Math.random() * 0.3;
        const low = Math.min(open, close) - Math.random() * 0.3;

        candles.push({
          x: Date.now() + i * 86400000,
          y: [+open.toFixed(2), +high.toFixed(2), +low.toFixed(2), +close.toFixed(2)]
        });

        price = close;
      }
      return candles;
    }

    /* -------------------- RED BORDER OVERLAY -------------------- */
    const overlayDiv = document.createElement('div');
    overlayDiv.style.position = 'absolute';
    overlayDiv.style.top = '0';
    overlayDiv.style.left = '0';
    overlayDiv.style.width = '100%';
    overlayDiv.style.height = '100%';
    overlayDiv.style.pointerEvents = 'none';
    overlayDiv.style.border = '2px solid red';
    overlayDiv.style.background = 'transparent';
    overlayDiv.style.boxSizing = 'border-box';
    overlayDiv.style.zIndex = '2147483647'; // highest possible

    /* -------------------- INIT CHART -------------------- */
    let chart;

    function updateChart() {
      if (!chart) return;
      chart.updateSeries([{ data: generateCandles() }], false);
      // ensure overlay stays on top
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
        // append overlay after render to stay on top
        chartDiv.appendChild(overlayDiv);

        // MutationObserver: Apex may replace children, keep overlay on top
        const mo = new MutationObserver(() => {
          requestAnimationFrame(() => {
            if (overlayDiv.parentNode !== chartDiv) chartDiv.appendChild(overlayDiv);
          });
        });
        mo.observe(chartDiv, { childList: true });

        // ResizeObserver: keep overlay sized
        const ro = new ResizeObserver(() => {
          overlayDiv.style.width = chartDiv.clientWidth + 'px';
          overlayDiv.style.height = chartDiv.clientHeight + 'px';
          if (chart) chart.updateOptions({ chart: { width: chartDiv.clientWidth } }, false);
        });
        ro.observe(chartDiv);
      });
    }

    /* -------------------- INIT -------------------- */
    loadApexCharts()
      .then(initChart)
      .catch(err => console.error('[Proton] ApexCharts failed', err));

    return container;
  };
})();
