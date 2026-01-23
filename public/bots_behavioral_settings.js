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

    /* -------------------- BEZIER -------------------- */

    const curve = {
      p0: { x: 0, y: 0.5 },
      p1: { x: 0.3, y: 0.2 },
      p2: { x: 0.7, y: 0.8 },
      p3: { x: 1, y: 0.5 }
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

    /* -------------------- DETERMINISTIC CANDLES -------------------- */

    function generateCandles() {
      const values = sampleCurve(CANDLE_COUNT);
      const candles = [];

      let price = 100;

      values.forEach((v, i) => {
        const delta = (v - 0.5) * 10; // curve controls direction + strength

        const open = price;
        const close = open + delta;
        const high = Math.max(open, close);
        const low = Math.min(open, close);

        price = close;

        candles.push({
          x: Date.now() + i * 86_400_000,
          y: [
            open.toFixed(2),
            high.toFixed(2),
            low.toFixed(2),
            close.toFixed(2)
          ]
        });
      });

      return candles;
    }

    /* -------------------- SVG OVERLAY -------------------- */

    let svg, path;

    function mountBezierOverlay() {
      const inner = chartDiv.querySelector(
        '.apexcharts-inner.apexcharts-graphical'
      );
      if (!inner) return;

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
        path.setAttribute(
          'd',
          `
          M ${curve.p0.x * width} ${(1 - curve.p0.y) * height}
          C ${curve.p1.x * width} ${(1 - curve.p1.y) * height},
            ${curve.p2.x * width} ${(1 - curve.p2.y) * height},
            ${curve.p3.x * width} ${(1 - curve.p3.y) * height}
        `
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
          const r = svg.getBoundingClientRect();
          point.x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
          point.y = 1 - Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
          sync();
          updateChart();
        });

        sync();
      }

      makeHandle(curve.p1);
      makeHandle(curve.p2);
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

      chart.render().then(mountBezierOverlay);
    }

    /* -------------------- INIT -------------------- */

    loadApexCharts()
      .then(initChart)
      .catch(err => console.error('[Proton] ApexCharts failed', err));

    return container;
  };
})();
