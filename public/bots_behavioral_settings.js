// RIGHT panel: ApexCharts Candlestick + Spline Behavior Editor
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
        This Is How The Bots Will Behave FUCK ME
      </p>
      <div id="apex-candlestick" style="width:100%;height:${FIXED_HEIGHT}px;position:relative;"></div>
    `;

    const chartDiv = container.querySelector('#apex-candlestick');

    // -------------------- APEX LOADER --------------------
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

    // -------------------- CONTROL POINTS --------------------
    const points = [
      { x: 0, y: 0 },
      { x: 0.3, y: 0.3 },
      { x: 0.7, y: 0.7 },
      { x: 1, y: 0.5 }
    ];

    function interpolate(t) {
      if (t <= points[1].x) {
        const u = (t - points[0].x) / (points[1].x - points[0].x);
        return points[0].y * (1 - u) + points[1].y * u;
      } else if (t <= points[2].x) {
        const u = (t - points[1].x) / (points[2].x - points[1].x);
        return points[1].y * (1 - u) + points[2].y * u;
      } else {
        const u = (t - points[2].x) / (points[3].x - points[2].x);
        return points[2].y * (1 - u) + points[3].y * u;
      }
    }

    function sampleCurve(count) {
      const values = [];
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        values.push(interpolate(t));
      }
      return values;
    }

    function generateCandles() {
      const curveValues = sampleCurve(CANDLE_COUNT);
      const candles = [];
      let price = PRICE_MIN + curveValues[0] * (PRICE_MAX - PRICE_MIN);

      curveValues.forEach((v, i) => {
        const targetPrice = PRICE_MIN + v * (PRICE_MAX - PRICE_MIN);
        const open = price;
        const close = targetPrice;
        const high = Math.max(open, close) + Math.random() * 0.3;
        const low = Math.min(open, close) - Math.random() * 0.3;

        candles.push({
          x: Date.now() + i * 86400000,
          y: [+open.toFixed(2), +high.toFixed(2), +low.toFixed(2), +close.toFixed(2)]
        });

        price = close;
      });

      return candles;
    }

    // -------------------- OVERLAY + SVG --------------------
    let overlayDiv = null;
    let svg = null;
    let path = null;
    const handleElems = [];
    let draggingIndex = -1;

    function createOverlayIfNeeded() {
      if (overlayDiv) return;

      overlayDiv = document.createElement('div');
      overlayDiv.style.position = 'absolute';
      overlayDiv.style.top = '25px';
      overlayDiv.style.left = 'right';
      overlayDiv.style.width = '100%';
      overlayDiv.style.bottom = '50px'
      overlayDiv.style.zIndex = '9999';
      overlayDiv.style.pointerEvents = 'none';
      overlayDiv.style.border = '2px solid red';
      chartDiv.appendChild(overlayDiv);

      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.pointerEvents = 'auto';
      overlayDiv.appendChild(svg);

      path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#0af');
      path.setAttribute('stroke-width', '2');
      svg.appendChild(path);

      for (let i = 0; i < points.length; i++) {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('r', 7);
        c.setAttribute('fill', '#0af');
        c.style.cursor = 'pointer';
        c.style.pointerEvents = 'all';
        svg.appendChild(c);
        handleElems.push(c);

        // only middle handles draggable
        if (i === 1 || i === 2) {
          ((idx) => {
            c.addEventListener('mousedown', (ev) => {
              ev.preventDefault();
              draggingIndex = idx;
              overlayDiv.style.pointerEvents = 'auto';
            });
          })(i);
        }
      }

      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);

      const mo = new MutationObserver(() => {
        if (!chartDiv.contains(overlayDiv)) chartDiv.appendChild(overlayDiv);
      });
      mo.observe(chartDiv, { childList: true, subtree: false });
    }

    function onPointerMove(e) {
      if (draggingIndex === -1) return;
      const r = svg.getBoundingClientRect();
      points[draggingIndex].x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      points[draggingIndex].y = 1 - Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      updateCurve();
    }

    function onPointerUp() {
      if (draggingIndex !== -1) {
        draggingIndex = -1;
        overlayDiv.style.pointerEvents = 'none';
      }
    }

    function updateCurve() {
      if (!svg || !path) return;
      const w = overlayDiv.clientWidth || 1;
      const h = overlayDiv.clientHeight || 1;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      let d = `M ${points[0].x * w} ${(1 - points[0].y) * h}`;
      for (let i = 1; i < points.length; i++) d += ` L ${points[i].x * w} ${(1 - points[i].y) * h}`;
      path.setAttribute('d', d);

      handleElems.forEach((c, i) => {
        const px = points[i].x * w;
        const py = (1 - points[i].y) * h;
        c.setAttribute('cx', px);
        c.setAttribute('cy', py);
        c.style.display = (i === 1 || i === 2) ? 'block' : 'none';
      });

      updateChart();
    }

    // -------------------- CHART --------------------
    let chart;
    function updateChart() {
      if (!chart) return;
      chart.updateSeries([{ data: generateCandles() }], false);
      requestAnimationFrame(() => {
        if (!chartDiv.contains(overlayDiv)) chartDiv.appendChild(overlayDiv);
      });
    }

    function initChart() {
      createOverlayIfNeeded();
      updateCurve();

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
        yaxis: { min: PRICE_MIN, max: PRICE_MAX, labels: { style: { colors: '#aaa' } } }
      });

      chart.render().then(() => updateCurve());

      new ResizeObserver(() => updateCurve()).observe(chartDiv);
    }

    loadApexCharts().then(initChart).catch(err => console.error('[Proton] ApexCharts failed', err));

    return container;
  };
})();
