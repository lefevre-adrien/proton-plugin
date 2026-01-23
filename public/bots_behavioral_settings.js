// RIGHT panel: ApexCharts Candlestick + Spline Behavior Editor
(function () {
  window.ProtonPanels = window.ProtonPanels || {};

  window.ProtonPanels.createRight = function () {
    const container = document.createElement('div');
    container.className = 'right-section';

    // layout
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
      <p style="margin:0;color:#cfe8ff;opacity:0.9">This Is How The Bots Will Behave</p>
      <div id="apex-candlestick" style="width:100%;height:${FIXED_HEIGHT}px;position:relative;"></div>
    `;

    const chartDiv = container.querySelector('#apex-candlestick');

    /* -------------------- LOAD APEX -------------------- */
    function loadApexCharts() {
      return new Promise((resolve, reject) => {
        if (window.ApexCharts) return resolve();
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/apexcharts@3.41.0/dist/apexcharts.min.js';
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    /* -------------------- CONTROL POINTS -------------------- */
    // p0 is fixed at (0,0). p3 is fixed at (1,0.5) but you can adjust
    const points = [
      { x: 0, y: 0 },      // fixed start (user requested)
      { x: 0.25, y: 0.25 },// draggable
      { x: 0.75, y: 0.75 },// draggable
      { x: 1, y: 0.5 }     // fixed end
    ];

    function interpolateLinear(t) {
      // piecewise linear between the four control points (p0->p1->p2->p3)
      if (t <= points[1].x) {
        const u = (t - points[0].x) / (points[1].x - points[0].x || 1);
        return points[0].y * (1 - u) + points[1].y * u;
      } else if (t <= points[2].x) {
        const u = (t - points[1].x) / (points[2].x - points[1].x || 1);
        return points[1].y * (1 - u) + points[2].y * u;
      } else {
        const u = (t - points[2].x) / (points[3].x - points[2].x || 1);
        return points[2].y * (1 - u) + points[3].y * u;
      }
    }

    function sampleCurve(count) {
      const out = [];
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        out.push(interpolateLinear(t));
      }
      return out;
    }

    /* -------------------- CANDLES -------------------- */
    function generateCandles() {
      const curveValues = sampleCurve(CANDLE_COUNT);
      const candles = [];
      // Start price aligned with first point so no offset
      let price = PRICE_MIN + curveValues[0] * (PRICE_MAX - PRICE_MIN);

      curveValues.forEach((v, i) => {
        const target = PRICE_MIN + v * (PRICE_MAX - PRICE_MIN);
        // tiny randomness only
        const noise = (Math.random() - 0.5) * 0.4;
        const open = price;
        const close = target + noise;
        const high = Math.max(open, close) + Math.random() * 0.2;
        const low = Math.min(open, close) - Math.random() * 0.2;

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

    /* -------------------- SVG OVERLAY (positioned using chart internals) -------------------- */
    let overlay = {
      svg: null,
      path: null,
      handles: []
    };

    function createOverlayUsingChartGlobals(ch) {
      // ensure globals present
      const g = ch.w && ch.w.globals;
      if (!g) return false;

      // plot area metrics
      const gridLeft = g.gridPad && g.gridPad.left ? g.gridPad.left : 0;
      const gridTop = g.gridPad && g.gridPad.top ? g.gridPad.top : 0;
      const plotW = g.gridWidth || (chartDiv.clientWidth - (g.gridPad ? (g.gridPad.left + g.gridPad.right) : 0));
      const plotH = g.gridHeight || (chartDiv.clientHeight - (g.gridPad ? (g.gridPad.top + g.gridPad.bottom) : 0));

      // remove existing overlay if any
      if (overlay.svg && overlay.svg.parentNode) overlay.svg.parentNode.removeChild(overlay.svg);
      overlay = { svg: null, path: null, handles: [] };

      // create svg sized to plot area, positioned inside chartDiv (absolute)
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', `0 0 ${plotW} ${plotH}`);
      svg.style.position = 'absolute';
      svg.style.left = gridLeft + 'px';
      svg.style.top = gridTop + 'px';
      svg.style.width = plotW + 'px';
      svg.style.height = plotH + 'px';
      svg.style.overflow = 'visible';
      svg.style.pointerEvents = 'auto';
      svg.style.zIndex = 20; // above chart internals
      chartDiv.appendChild(svg);

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#0af');
      path.setAttribute('stroke-width', '2');
      svg.appendChild(path);

      // helper: convert normalized point -> pixel coords (inside plot area)
      function ptToPixel(pt) {
        const x = pt.x * plotW;
        const y = plotH - pt.y * plotH; // v=1 => top (0), v=0 => bottom (plotH)
        return { x, y };
      }

      // draw path from current points (straight segments to keep strong influence)
      function drawPath() {
        const d = points.map((p, idx) => {
          const { x, y } = ptToPixel(p);
          return (idx === 0 ? 'M' : 'L') + ' ' + x + ' ' + y;
        }).join(' ');
        path.setAttribute('d', d);
      }

      // create handle (draggable) for a control point (only for indices 1 and 2)
      function createHandle(pointIndex) {
        const p = points[pointIndex];
        const { x, y } = ptToPixel(p);
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', 7);
        circle.setAttribute('fill', '#0af');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.style.cursor = 'grab';
        svg.appendChild(circle);

        let dragging = false;

        function onPointerDown(e) {
          e.preventDefault();
          dragging = true;
          circle.setPointerCapture && circle.setPointerCapture(e.pointerId);
          circle.style.cursor = 'grabbing';
        }
        function onPointerUp(e) {
          dragging = false;
          circle.releasePointerCapture && circle.releasePointerCapture(e.pointerId);
          circle.style.cursor = 'grab';
        }
        function onPointerMove(e) {
          if (!dragging) return;
          const rect = svg.getBoundingClientRect();
          // compute coords relative to svg viewBox / plot area
          const rx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
          const ry = 1 - Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
          // enforce x ordering so handles don't cross boundaries
          if (pointIndex === 1) {
            // keep between p0.x and p2.x
            const minX = 0;
            const maxX = points[2].x - 0.01;
            p.x = Math.min(maxX, Math.max(minX, rx));
          } else if (pointIndex === 2) {
            const minX = points[1].x + 0.01;
            const maxX = 1;
            p.x = Math.min(maxX, Math.max(minX, rx));
          } else {
            p.x = rx;
          }
          p.y = ry;

          // update handle position immediately
          const pix = ptToPixel(p);
          circle.setAttribute('cx', pix.x);
          circle.setAttribute('cy', pix.y);

          // redraw path & update chart
          drawPath();
          scheduleChartUpdate();
        }

        circle.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointermove', onPointerMove);

        overlay.handles.push({ circle, idx: pointIndex, onPointerDown, onPointerUp, onPointerMove });
      }

      // create handles for p1 and p2 only (p0 and p3 fixed)
      createHandle(1);
      createHandle(2);

      // store overlay pieces
      overlay.svg = svg;
      overlay.path = path;
      drawPath();

      return { drawPath, ptToPixel, svg, path, plotW, plotH, gridLeft, gridTop };
    }

    /* -------------------- CHART + UPDATE FLOW -------------------- */
    let chart = null;
    let overlayInfo = null;
    let scheduled = null;

    function scheduleChartUpdate() {
      // throttle multiple drags; immediate-ish update
      if (scheduled) return;
      scheduled = requestAnimationFrame(() => {
        scheduled = null;
        if (chart) {
          chart.updateSeries([{ data: generateCandles() }], false);
          // re-create overlay based on up-to-date chart.w.globals (size/padding)
          overlayInfo = createOverlayUsingChartGlobals(chart);
        }
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
          animations: { enabled: false }
        },
        series: [{ data: generateCandles() }],
        plotOptions: {
          candlestick: { colors: { upward: '#26a69a', downward: '#ef5350' } }
        },
        grid: { show: true },
        tooltip: { enabled: false },
        xaxis: { type: 'datetime' },
        yaxis: {
          min: PRICE_MIN,
          max: PRICE_MAX,
          labels: { style: { colors: '#aaa' } }
        }
      });

      chart.render().then(() => {
        // create overlay after render so chart.w.globals exist
        overlayInfo = createOverlayUsingChartGlobals(chart);

        // observe container for size changes and re-create overlay accordingly
        const ro = new ResizeObserver(() => {
          // update chart width (Apex requires updateOptions) and recreate overlay
          chart.updateOptions({ chart: { width: chartDiv.clientWidth } });
          overlayInfo = createOverlayUsingChartGlobals(chart);
        });
        ro.observe(chartDiv);

        // cleanup handle
        container._protonChartCleanup = () => {
          try { ro.disconnect(); } catch (e) {}
          try { chart.destroy(); } catch (e) {}
          if (overlay.svg && overlay.svg.parentNode) overlay.svg.parentNode.removeChild(overlay.svg);
          overlay = { svg: null, path: null, handles: [] };
        };
      });
    }

    /* -------------------- INIT -------------------- */
    loadApexCharts()
      .then(initChart)
      .catch(err => {
        console.error('[Proton] ApexCharts failed to load', err);
      });

    return container;
  };
})();
