// RIGHT panel: ApexCharts Candlestick + Bezier Behavior Editor
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
    const INFLUENCE = 48;

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

    /* -------------------- BEZIER CURVE -------------------- */
    const curve = {
      p0: { x: 0, y: 0.5 },
      p1: { x: 0.3, y: 0.3 },
      p2: { x: 0.7, y: 0.7 },
      p3: { x: 1, y: 0.5 }
    };

    function bezier(t, p0, p1, p2, p3) {
      const u = 1 - t;
      return u ** 3 * p0 + 3 * u ** 2 * t * p1 + 3 * u * t ** 2 * p2 + t ** 3 * p3;
    }

    function sampleCurve(count) {
      const values = [];
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        values.push(bezier(t, curve.p0.y, curve.p1.y, curve.p2.y, curve.p3.y));
      }
      return values;
    }

    /* -------------------- CANDLES -------------------- */
    function generateCandles() {
      const curveValues = sampleCurve(CANDLE_COUNT);
      let price = 100;
      const candles = [];

      curveValues.forEach((v, i) => {
        const delta = (v - 0.5) * INFLUENCE;
        const smallNoise = (Math.random() - 0.5) * 1.5; // tiny randomness

        const open = price;
        const close = open + delta + smallNoise;
        const high = Math.max(open, close) + Math.random();
        const low = Math.min(open, close) - Math.random();

        price = close;

        candles.push({
          x: Date.now() + i * 86400000,
          y: [
            +open.toFixed(2),
            +high.toFixed(2),
            +low.toFixed(2),
            +close.toFixed(2)
          ]
        });
      });

      return candles;
    }

    /* -------------------- SVG OVERLAY -------------------- */
    let svg, path;

    function mountBezierOverlay() {
      const inner = chartDiv.querySelector('.apexcharts-inner.apexcharts-graphical');
      if (!inner) return;

      // Remove old SVG if exists
      if (svg && svg.parentNode) svg.parentNode.removeChild(svg);

      const { width, height } = inner.getBoundingClientRect();
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.position = 'absolute';
      svg.style.top = '0';
      svg.style.left = '0';
      svg.style.pointerEvents = 'auto';
      inner.style.position = 'relative';
      inner.appendChild(svg);

      path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#0af');
      path.setAttribute('stroke-width', '2');
      svg.appendChild(path);

      function updatePath() {
        const p = curve;
        path.setAttribute(
          'd',
          `M ${p.p0.x * width} ${(1 - p.p0.y) * height} 
           C ${p.p1.x * width} ${(1 - p.p1.y) * height},
             ${p.p2.x * width} ${(1 - p.p2.y) * height},
             ${p.p3.x * width} ${(1 - p.p3.y) * height}`
        );
      }

      function makeHandle(point) {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('r', 7);
        c.setAttribute('fill', '#0af');
        c.style.cursor = 'pointer';
        svg.appendChild(c);

        let dragging = false;

        function sync() {
          c.setAttribute('cx', point.x * width);
          c.setAttribute('cy', (1 - point.y) * height);
          updatePath();
        }

        c.addEventListener('mousedown', () => dragging = true);
        window.addEventListener('mouseup', () => dragging = false);
        window.addEventListener('mousemove', e => {
          if (!dragging) return;
          const rect = svg.getBoundingClientRect();
          point.x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
          point.y = 1 - Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
          sync();
          updateChart();
        });

        sync();
      }

      // Only p1 and p2 are draggable
      makeHandle(curve.p1);
      makeHandle(curve.p2);
      updatePath();
    }

    /* -------------------- CHART -------------------- */
    let chart;

    function updateChart() {
      chart.updateSeries([{ data: generateCandles() }], false);
      requestAnimationFrame(() => mountBezierOverlay()); // reattach overlay
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
        grid: { show: false },
        tooltip: { enabled: false },
        xaxis: { type: 'datetime' },
        yaxis: { labels: { style: { colors: '#aaa' } } }
      });

      chart.render().then(mountBezierOverlay);

      new ResizeObserver(() => {
        chart.updateOptions({ chart: { width: chartDiv.clientWidth } });
        mountBezierOverlay();
      }).observe(chartDiv);
    }

    /* -------------------- INIT -------------------- */
    loadApexCharts()
      .then(initChart)
      .catch(err => console.error('[Proton] ApexCharts failed', err));

    return container;
  };
})();
