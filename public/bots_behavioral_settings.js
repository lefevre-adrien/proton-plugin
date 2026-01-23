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
    const NOISE = 0.35; // 👈 small randomness, controlled

    container.innerHTML = `
      <h3 style="margin:0;color:#0af;font-size:16px">Behavioral Settings</h3>
      <p style="margin:0;color:#cfe8ff;opacity:0.9">
        This Is How The Bots Will Behave
      </p>
      <div id="apex-candlestick" style="width:100%;height:${FIXED_HEIGHT}px;"></div>
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
      p0: { x: 0, y: 0 },     // ❌ NOT editable
      p1: { x: 0.25, y: 0.3 },
      p2: { x: 0.6, y: 0.8 },
      p3: { x: 1, y: 0.5 }   // ✅ editable
    };

    function bezier(t, p0, p1, p2, p3) {
      const u = 1 - t;
      return (
        u ** 3 * p0 +
        3 * u ** 2 * t * p1 +
        3 * u * t ** 2 * p2 +
        t ** 3 * p3
      );
    }

    function sampleCurve(count) {
      const out = [];
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        out.push(
          bezier(t, curve.p0.y, curve.p1.y, curve.p2.y, curve.p3.y)
        );
      }
      return out;
    }

    /* -------------------- CANDLE GENERATION -------------------- */

    function generateCandles() {
      const values = sampleCurve(CANDLE_COUNT);
      const candles = [];
      let price = 100;

      values.forEach((v, i) => {
        const drift = (v - 0.5) * 8;
        const noise = (Math.random() - 0.5) * NOISE;

        const open = price;
        const close = open + drift + noise;
        const high = Math.max(open, close) + Math.abs(noise) * 0.6;
        const low = Math.min(open, close) - Math.abs(noise) * 0.6;

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

    let svg, path, handles = [];

    function mountBezierOverlay() {
      const inner = chartDiv.querySelector(
        '.apexcharts-inner.apexcharts-graphical'
      );
      if (!inner) return;

      inner.style.position = 'relative';

      const { width, height } = inner.getBoundingClientRect();

      if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute';
        svg.style.inset = '0';
        svg.style.pointerEvents = 'auto';
        svg.style.zIndex = '10';
        inner.appendChild(svg);

        path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#0af');
        path.setAttribute('stroke-width', '2');
        svg.appendChild(path);
      }

      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

      function updatePath() {
        path.setAttribute(
          'd',
          `M ${curve.p0.x * width} ${(1 - curve.p0.y) * height}
           C ${curve.p1.x * width} ${(1 - curve.p1.y) * height},
             ${curve.p2.x * width} ${(1 - curve.p2.y) * height},
             ${curve.p3.x * width} ${(1 - curve.p3.y) * height}`
        );
      }

      function makeHandle(point) {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('r', 7);
        c.setAttribute('fill', '#0af');
        c.style.cursor = 'pointer';
        svg.appendChild(c);
        handles.push(c);

        let dragging = false;

        function sync() {
          c.setAttribute('cx', point.x * width);
          c.setAttribute('cy', (1 - point.y) * height);
          updatePath();
        }

        c.addEventListener('mousedown', e => {
          e.stopPropagation();
          dragging = true;
        });

        window.addEventListener('mouseup', () => dragging = false);

        window.addEventListener('mousemove', e => {
          if (!dragging) return;
          const r = svg.getBoundingClientRect();
          point.x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
          point.y = 1 - Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
          sync();
          updateChart();
        });

        sync();
      }

      handles.forEach(h => h.remove());
      handles = [];

      makeHandle(curve.p1);
      makeHandle(curve.p2);
      makeHandle(curve.p3);

      updatePath();
    }

    /* -------------------- CHART -------------------- */

    let chart;

    function updateChart() {
      chart.updateSeries([{ data: generateCandles() }], false);
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
          candlestick: {
            colors: { upward: '#26a69a', downward: '#ef5350' }
          }
        },
        grid: { show: false },
        tooltip: { enabled: false },
        xaxis: { type: 'datetime' },
        yaxis: { labels: { style: { colors: '#aaa' } } }
      });

      chart.render().then(() => {
        mountBezierOverlay();

        new ResizeObserver(() => {
          chart.updateOptions({ chart: { width: chartDiv.clientWidth } });
          mountBezierOverlay();
        }).observe(chartDiv);
      });
    }

    /* -------------------- INIT -------------------- */

    loadApexCharts()
      .then(initChart)
      .catch(err => console.error('[Proton] ApexCharts failed', err));

    return container;
  };
})();
