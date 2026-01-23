// RIGHT panel: ApexCharts Candlestick + Straight Line Visual + Red Border Overlay
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
        This Is How The Bots Will Behave KILL YOURSELF CHAT GPT
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
      return 0.2 + 0.6 * t; // linear from 0.2 -> 0.8
    }

    function sampleCurve(count) {
      const arr = [];
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : i / (count - 1);
        arr.push(straightLine(t));
      }
      return arr;
    }

    /* -------------------- CANDLES -------------------- */
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

    /* -------------------- SVG STRAIGHT LINE OVER CURVE -------------------- */
    let overlayDiv, svg, path;

    function drawOverlayCurve() {
      const w = chartDiv.clientWidth;
      const h = chartDiv.clientHeight;

      if (!overlayDiv) {
        overlayDiv = document.createElement('div');
        overlayDiv.style.position = 'absolute';
        overlayDiv.style.top = '0';
        overlayDiv.style.left = '0';
        overlayDiv.style.width = '100%';
        overlayDiv.style.height = '100%';
        overlayDiv.style.pointerEvents = 'none';
        overlayDiv.style.border = '2px solid red'; // always visible border
        overlayDiv.style.background = 'transparent';
        overlayDiv.style.boxSizing = 'border-box';
        overlayDiv.style.zIndex = '2147483647';
        chartDiv.appendChild(overlayDiv);
      }

      // remove old SVG if exists
      if (svg && svg.parentNode === overlayDiv) overlayDiv.removeChild(svg);

      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.position = 'absolute';
      overlayDiv.appendChild(svg);

      path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#0af'); // straight line color
      path.setAttribute('stroke-width', '2');
      svg.appendChild(path);

      const curve = sampleCurve(CANDLE_COUNT);
      let d = '';
      for (let i = 0; i < curve.length; i++) {
        const x = (i / (curve.length - 1)) * w;
        const y = (1 - curve[i]) * h;
        d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      }
      path.setAttribute('d', d);
    }

    /* -------------------- CHART -------------------- */
    let chart;

    function updateChart() {
      if (!chart) return;
      chart.updateSeries([{ data: generateCandles() }], false);
      drawOverlayCurve();
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
        drawOverlayCurve();

        const mo = new MutationObserver(() => {
          requestAnimationFrame(drawOverlayCurve);
        });
        mo.observe(chartDiv, { childList: true });

        const ro = new ResizeObserver(drawOverlayCurve);
        ro.observe(chartDiv);
      });
    }

    /* -------------------- INIT -------------------- */
    loadApexCharts().then(initChart).catch(err => console.error('[Proton] ApexCharts failed', err));

    return container;
  };
})();
