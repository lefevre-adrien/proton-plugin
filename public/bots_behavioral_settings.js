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
        This Is How The Bots Will Behave HERE 5
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

    /* -------------------- CONTROL POINTS (normalized 0..1) -------------------- */
    // p0 fixed at (0,0) as requested
    const points = {
      p0: { x: 0, y: 0 },     // fixed start (not draggable)
      p1: { x: 0.3, y: 0.3 }, // draggable
      p2: { x: 0.7, y: 0.7 }, // draggable
      p3: { x: 1, y: 0.5 }    // fixed end (not draggable)
    };

    /* cubic bezier evaluator */
    function bezier(t, a, b, c, d) {
      const u = 1 - t;
      return u ** 3 * a + 3 * u ** 2 * t * b + 3 * u * t ** 2 * c + t ** 3 * d;
    }

    function sampleCurve(count) {
      const arr = new Array(count);
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : i / (count - 1);
        arr[i] = bezier(t, points.p0.y, points.p1.y, points.p2.y, points.p3.y);
      }
      return arr;
    }

    /* -------------------- CANDLES -------------------- */
    // Slight randomness kept small
    function generateCandles() {
      const curveValues = sampleCurve(CANDLE_COUNT);
      const candles = [];
      // start price aligned with p0 (which is y=0 mapped to PRICE_MIN)
      let price = PRICE_MIN + curveValues[0] * (PRICE_MAX - PRICE_MIN);

      curveValues.forEach((v, i) => {
        const targetPrice = PRICE_MIN + v * (PRICE_MAX - PRICE_MIN);
        // make open close follow the curve tightly, small noise for realism
        const smallNoise = (Math.random() - 0.5) * 0.4; // very small
        const open = price + (Math.random() - 0.5) * 0.2;
        const close = targetPrice + smallNoise;
        const high = Math.max(open, close) + Math.random() * 0.25;
        const low = Math.min(open, close) - Math.random() * 0.25;

        candles.push({
          x: Date.now() + i * 86400000,
          y: [
            +open.toFixed(2),
            +high.toFixed(2),
            +low.toFixed(2),
            +close.toFixed(2)
          ]
        });

        price = close;
      });

      return candles;
    }

    /* -------------------- OVERLAY (SVG placed in a top-level overlay DIV) -------------------- */
    let overlayDiv = null;
    let svg = null;
    let path = null;
    let handles = {}; // p1 and p2 circles

    function createOverlay() {
      // create overlay div that will sit above the chart (appended after chart DOM)
      if (!overlayDiv) {
        overlayDiv = document.createElement('div');
        overlayDiv.style.position = 'absolute';
        overlayDiv.style.top = '0';
        overlayDiv.style.left = '0';
        overlayDiv.style.width = '100%';
        overlayDiv.style.height = '100%';
        // we want to interact with control points, so pointerEvents must be "auto"
        overlayDiv.style.pointerEvents = 'auto';
        overlayDiv.style.background = 'transparent';
        // visible red border as you demanded
        overlayDiv.style.border = '2px solid red';
        overlayDiv.style.boxSizing = 'border-box';
        // ensure it's visually above (but DOM order matters too; we re-append as last child when needed)
        overlayDiv.style.zIndex = '99999';
      }

      // clear svg if exists
      if (svg && svg.parentNode === overlayDiv) overlayDiv.removeChild(svg);

      const w = chartDiv.clientWidth;
      const h = chartDiv.clientHeight;

      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', String(w));
      svg.setAttribute('height', String(h));
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.style.display = 'block';
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.pointerEvents = 'none'; // let circles accept pointer events individually

      // path
      path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#0af');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.appendChild(path);

      // create handle circles (we give them pointer-events and use pointer events)
      function createHandle(name) {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('r', '7');
        c.setAttribute('fill', '#0af');
        c.style.cursor = 'pointer';
        // allow pointer events for handles
        c.style.pointerEvents = 'auto';
        svg.appendChild(c);
        handles[name] = c;

        // pointer-based dragging
        let dragging = false;
        function onPointerDown(e) {
          e.preventDefault();
          dragging = true;
          // capture pointer to this circle to keep receiving events
          try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
        }
        function onPointerUp(e) {
          if (!dragging) return;
          dragging = false;
          try { e.target.releasePointerCapture(e.pointerId); } catch (err) {}
        }
        function onPointerMove(e) {
          if (!dragging) return;
          const r = svg.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width;
          const ny = (e.clientY - r.top) / r.height;
          // clamp 0..1
          points[name].x = Math.min(1, Math.max(0, nx));
          points[name].y = 1 - Math.min(1, Math.max(0, ny));
          refreshOverlay(); // update visuals
          updateChart();    // update series
        }

        c.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointermove', onPointerMove);
      }

      createHandle('p1');
      createHandle('p2');

      // append svg into overlayDiv
      overlayDiv.appendChild(svg);

      // ensure overlayDiv is the last child of chartDiv so it sits on top
      if (overlayDiv.parentNode !== chartDiv) chartDiv.appendChild(overlayDiv);
      else chartDiv.appendChild(overlayDiv); // re-append to move to end
      refreshOverlay();
    }

    function refreshOverlay() {
      if (!svg || !path) return;
      const w = chartDiv.clientWidth;
      const h = chartDiv.clientHeight;

      // update svg size + viewBox
      svg.setAttribute('width', String(w));
      svg.setAttribute('height', String(h));
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

      // draw cubic bezier path matching points (scale normalized coords to overlay size)
      const p0x = points.p0.x * w;
      const p0y = (1 - points.p0.y) * h;
      const p1x = points.p1.x * w;
      const p1y = (1 - points.p1.y) * h;
      const p2x = points.p2.x * w;
      const p2y = (1 - points.p2.y) * h;
      const p3x = points.p3.x * w;
      const p3y = (1 - points.p3.y) * h;

      const d = `M ${p0x} ${p0y} C ${p1x} ${p1y}, ${p2x} ${p2y}, ${p3x} ${p3y}`;
      path.setAttribute('d', d);

      // update handles positions (p1, p2)
      if (handles.p1) {
        handles.p1.setAttribute('cx', String(p1x));
        handles.p1.setAttribute('cy', String(p1y));
      }
      if (handles.p2) {
        handles.p2.setAttribute('cx', String(p2x));
        handles.p2.setAttribute('cy', String(p2y));
      }
    }

    /* -------------------- KEEP OVERLAY ON TOP (MutationObserver fallback) -------------------- */
    function ensureOverlayOnTop() {
      // if overlayDiv missing or not a child, append it
      if (!overlayDiv) return;
      if (overlayDiv.parentNode !== chartDiv) chartDiv.appendChild(overlayDiv);
      else chartDiv.appendChild(overlayDiv); // re-append to move to end
    }

    /* -------------------- CHART -------------------- */
    let chart = null;

    function updateChart() {
      if (!chart) return;
      chart.updateSeries([{ data: generateCandles() }], false);
      // refresh overlay visuals after a frame
      requestAnimationFrame(() => {
        refreshOverlay();
        ensureOverlayOnTop();
      });
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
        // create overlay AFTER chart is rendered to avoid being stomped by Apex internal DOM changes
        createOverlay();

        // MutationObserver to keep overlay last child when ApexCharts touches chartDiv
        const mo = new MutationObserver(() => {
          // small timeout to let Apex do its work then re-append overlay
          requestAnimationFrame(() => {
            ensureOverlayOnTop();
            // refreshing overlay in case chart internals changed sizes
            refreshOverlay();
          });
        });
        mo.observe(chartDiv, { childList: true, subtree: false });

        // ResizeObserver to adapt overlay size
        const ro = new ResizeObserver(() => {
          // update Apex chart width and overlay sizes
          if (chart) chart.updateOptions({ chart: { width: chartDiv.clientWidth } });
          refreshOverlay();
          ensureOverlayOnTop();
        });
        ro.observe(chartDiv);

        // ensure overlay stays on top initially
        ensureOverlayOnTop();
      });
    }

    /* -------------------- INIT -------------------- */
    loadApexCharts()
      .then(initChart)
      .catch(err => console.error('[Proton] ApexCharts failed', err));

    return container;
  };
})();
