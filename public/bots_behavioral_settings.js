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
        This Is How The Bots Will Behave
      </p>
      <div id="apex-candlestick" style="width:100%;height:${FIXED_HEIGHT}px;position:relative;"></div>
    `;

    const chartDiv = container.querySelector('#apex-candlestick');

    /* -------------------- APEX LOADER -------------------- */
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

    /* -------------------- CONTROL POINTS -------------------- */
    const points = [
      { x: 0,   y: 0   },
      { x: 0.3, y: 0.3 },
      { x: 0.7, y: 0.7 },
      { x: 1,   y: 0.5 }
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

    /* -------------------- OVERLAY + SVG (persistent) -------------------- */
    let overlayDiv = null;
    let svg = null;
    let path = null;
    const handleElems = []; // DOM circles for handles
    let draggingIndex = -1;

    function createOverlayIfNeeded() {
      if (overlayDiv && chartDiv.contains(overlayDiv)) return;

      // create overlay div (and keep it persistent)
      overlayDiv = document.createElement('div');
      overlayDiv.className = 'proton-overlay';
      overlayDiv.style.position = 'absolute';
      overlayDiv.style.top = '0';
      overlayDiv.style.left = '0';
      overlayDiv.style.width = '100%';
      overlayDiv.style.height = '100%';
      overlayDiv.style.boxSizing = 'border-box';
      overlayDiv.style.border = '2px solid red';
      overlayDiv.style.pointerEvents = 'none'; // default: overlay doesn't block chart interactions
      overlayDiv.style.zIndex = '9999';
      chartDiv.appendChild(overlayDiv);

      // create one SVG inside overlayDiv and keep it (do NOT recreate on resize)
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('preserveAspectRatio', 'none'); // easier scaling
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.position = 'absolute';
      svg.style.top = '0';
      svg.style.left = '0';
      // svg will accept pointer events so handles can be interactive
      svg.style.pointerEvents = 'auto';
      overlayDiv.appendChild(svg);

      // path
      path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#0af');
      path.setAttribute('stroke-width', '2');
      svg.appendChild(path);

      // create handles (for points[1] and points[2])
      for (let i = 0; i < points.length; i++) {
        // we only create visible handles for the ones we want draggable (1 and 2),
        // but create placeholders for all for simplicity.
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('r', 7);
        c.setAttribute('fill', '#0af');
        c.style.cursor = 'pointer';
        c.style.pointerEvents = 'all';
        svg.appendChild(c);
        handleElems.push(c);

        // mousedown on circle -> begin drag
        ((idx) => {
          c.addEventListener('mousedown', (ev) => {
            ev.preventDefault();
            draggingIndex = idx;
            // while dragging, allow overlay to receive pointer events so we can track mouse
            overlayDiv.style.pointerEvents = 'auto';
          });
        })(i);
      }

      // mousemove / mouseup global handlers
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);

      // Ensure overlay stays if ApexCharts mutates chartDiv (re-append if removed)
      const mo = new MutationObserver(() => {
        if (!chartDiv.contains(overlayDiv)) {
          // re-append and keep the single SVG inside it
          chartDiv.appendChild(overlayDiv);
        }
      });
      mo.observe(chartDiv, { childList: true, subtree: false });
    }

    function onPointerMove(e) {
      if (draggingIndex === -1) return;
      if (!svg) return;
      const r = svg.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width;
      const ny = (e.clientY - r.top) / r.height;
      // clamp
      const cx = Math.min(1, Math.max(0, nx));
      const cy = 1 - Math.min(1, Math.max(0, ny));
      // update the control point
      points[draggingIndex].x = cx;
      points[draggingIndex].y = cy;
      updateCurveVisuals();
      // if your candles should change with curve, call updateChart()
      // updateChart();
    }

    function onPointerUp() {
      if (draggingIndex !== -1) {
        draggingIndex = -1;
        // after drag, allow overlay to be pointerEvents none again so it doesn't block chart
        overlayDiv.style.pointerEvents = 'none';
      }
    }

    function updateCurveVisuals() {
      if (!svg || !path) return;
      // set viewBox to current overlay size for correct coordinates
      const w = overlayDiv.clientWidth || 1;
      const h = overlayDiv.clientHeight || 1;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

      // path (straight segments; change to smooth spline if desired)
      let d = `M ${points[0].x * w} ${(1 - points[0].y) * h}`;
      for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x * w} ${(1 - points[i].y) * h}`;
      }
      path.setAttribute('d', d);

      // update handle positions and visibility
      for (let i = 0; i < handleElems.length; i++) {
        const c = handleElems[i];
        const px = points[i].x * w;
        const py = (1 - points[i].y) * h;
        c.setAttribute('cx', px);
        c.setAttribute('cy', py);
        // show only middle handles (1 & 2) if you prefer:
        if (i === 1 || i === 2) {
          c.style.display = 'block';
        } else {
          c.style.display = 'none';
        }
      }
    }

    /* -------------------- CHART + UPDATE -------------------- */
    let chart;
    function updateChart() {
      if (!chart) return;
      chart.updateSeries([{ data: generateCandles() }], false);
      // After Apex updates, re-position overlay and update visuals
      requestAnimationFrame(() => {
        // ensure overlay attached
        if (!chartDiv.contains(overlayDiv)) chartDiv.appendChild(overlayDiv);
        updateCurveVisuals();
      });
    }

    function initChart() {
      // create overlay first and keep it persistent
      createOverlayIfNeeded();
      updateCurveVisuals();

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

      chart.render().then(() => {
        // overlay already exists and SVG is inside it, just ensure visuals correct
        updateCurveVisuals();
      });

      // keep overlay and curve visuals up-to-date on size changes
      new ResizeObserver(() => {
        // ApexCharts will re-render internals if needed; keep our overlay intact
        if (!chartDiv.contains(overlayDiv)) chartDiv.appendChild(overlayDiv);
        updateCurveVisuals();
      }).observe(chartDiv);
    }

    /* -------------------- BOOT -------------------- */
    loadApexCharts().then(initChart).catch(err => console.error('[Proton] ApexCharts failed', err));

    return container;
  };
})();
