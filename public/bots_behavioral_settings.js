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
        This Is How The Bots Will Behave HERE 4
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

    /* -------------------- CONTROL POINTS -------------------- */
    const points = [
      { x: 0, y: 0 },      // fixed start
      { x: 0.3, y: 0.3 },  // draggable
      { x: 0.7, y: 0.7 },  // draggable
      { x: 1, y: 0.5 }     // fixed end
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

    /* -------------------- CANDLES -------------------- */
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

    /* -------------------- SVG OVERLAY -------------------- */
    let svg, path;

    function mountOverlay() {
      const grid = chartDiv.querySelector('.apexcharts-grid');
      if (!grid) return;

      const xPad = chart.w.globals.gridPad.left;
      const yPad = chart.w.globals.gridPad.top;
      const plotW = chart.w.globals.gridWidth;
      const plotH = chart.w.globals.gridHeight;

      if (svg && svg.parentNode) svg.parentNode.removeChild(svg);

      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', `0 0 ${plotW} ${plotH}`);
      svg.style.width = `${plotW}px`;
      svg.style.height = `${plotH}px`;
      svg.style.position = 'absolute';
      svg.style.top = `${yPad}px`;
      svg.style.left = `${xPad}px`;
      svg.style.pointerEvents = 'auto';
      chartDiv.appendChild(svg);

      path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#0af');
      path.setAttribute('stroke-width', '2');
      svg.appendChild(path);

      function updatePath() {
        const d = points.map((pt, i) => {
          const x = pt.x * plotW;
          const y = plotH - pt.y * plotH;
          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
        path.setAttribute('d', d);
      }

      function makeHandle(pt) {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('r', 7);
        c.setAttribute('fill', '#0af');
        c.style.cursor = 'pointer';
        svg.appendChild(c);

        let dragging = false;

        function sync() {
          c.setAttribute('cx', pt.x * plotW);
          c.setAttribute('cy', plotH - pt.y * plotH);
          updatePath();
        }

        c.addEventListener('mousedown', () => dragging = true);
        window.addEventListener('mouseup', () => dragging = false);
        window.addEventListener('mousemove', e => {
          if (!dragging) return;
          const r = svg.getBoundingClientRect();
          pt.x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
          pt.y = 1 - Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
          sync();
          updateChart();
        });

        sync();
      }

      makeHandle(points[1]);
      makeHandle(points[2]);
      updatePath();
    }

    /* -------------------- CHART -------------------- */
    let chart;
    function updateChart() {
      chart.updateSeries([{ data: generateCandles() }], false);
      requestAnimationFrame(mountOverlay);
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
        plotOptions: { candlestick: { colors: { upward: '#26a69a', downward: '#ef5350' } } },
        grid: { show: true },
        tooltip: { enabled: false },
        xaxis: { type: 'datetime' },
        yaxis: {
          min: PRICE_MIN,
          max: PRICE_MAX,
          labels: { style: { colors: '#aaa' } }
        }
      });

      chart.render().then(mountOverlay);

      new ResizeObserver(() => {
        chart.updateOptions({ chart: { width: chartDiv.clientWidth } });
        mountOverlay();
      }).observe(chartDiv);
    }

    /* -------------------- INIT -------------------- */
    loadApexCharts().then(initChart).catch(err => console.error('[Proton] ApexCharts failed', err));

    return container;
  };
})();
