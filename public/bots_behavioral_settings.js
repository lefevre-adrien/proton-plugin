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

      <div id="chart-wrapper" style="position:relative;width:100%;height:${FIXED_HEIGHT}px;">
        <div id="apex-candlestick" style="width:100%;height:100%;"></div>

        <svg id="bezier-overlay"
             viewBox="0 0 1000 300"
             preserveAspectRatio="none"
             style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:auto;">
        </svg>
      </div>
    `;

    const chartDiv = container.querySelector('#apex-candlestick');
    const svg = container.querySelector('#bezier-overlay');

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

    /* -------------------- BEZIER SETUP -------------------- */

    // Normalized control points (0–1)
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
      const values = [];
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        values.push(
          bezier(t, curve.p0.y, curve.p1.y, curve.p2.y, curve.p3.y)
        );
      }
      return values;
    }

    /* -------------------- CANDLE GENERATION -------------------- */

    function generateCandles() {
      const curveValues = sampleCurve(CANDLE_COUNT);
      let price = 100;
      const candles = [];

      curveValues.forEach((v, i) => {
        const volatility = 2 + v * 8;
        const drift = (v - 0.5) * 6;

        const open = price;
        const close = open + drift + (Math.random() - 0.5) * volatility;
        const high = Math.max(open, close) + Math.random() * volatility;
        const low = Math.min(open, close) - Math.random() * volatility;

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

    /* -------------------- SVG UI -------------------- */

    function renderSVG() {
      svg.innerHTML = '';

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#0af');
      path.setAttribute('stroke-width', '2');

      function updatePath() {
        const p = curve;
        path.setAttribute(
          'd',
          `
          M ${p.p0.x * 1000} ${(1 - p.p0.y) * 300}
          C ${p.p1.x * 1000} ${(1 - p.p1.y) * 300},
            ${p.p2.x * 1000} ${(1 - p.p2.y) * 300},
            ${p.p3.x * 1000} ${(1 - p.p3.y) * 300}
        `
        );
      }

      svg.appendChild(path);

      function makeHandle(point) {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('r', 8);
        c.setAttribute('fill', '#0af');
        c.style.cursor = 'pointer';

        function update() {
          c.setAttribute('cx', point.x * 1000);
          c.setAttribute('cy', (1 - point.y) * 300);
          updatePath();
        }

        let dragging = false;

        c.addEventListener('mousedown', () => (dragging = true));
        window.addEventListener('mouseup', () => (dragging = false));
        window.addEventListener('mousemove', e => {
          if (!dragging) return;
          const rect = svg.getBoundingClientRect();
          point.x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
          point.y = 1 - Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
          update();
          updateChart();
        });

        svg.appendChild(c);
        update();
      }

      ['p1', 'p2'].forEach(k => makeHandle(curve[k]));
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
          width: chartDiv.clientWidth,
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
        xaxis: {
          type: 'datetime',
          labels: { style: { colors: '#aaa' } },
          axisBorder: { color: '#555' }
        },
        yaxis: {
          labels: { style: { colors: '#aaa' } }
        }
      });

      chart.render();

      new ResizeObserver(() => {
        chart.updateOptions({
          chart: { width: chartDiv.clientWidth }
        });
      }).observe(chartDiv);
    }

    /* -------------------- INIT -------------------- */

    loadApexCharts()
      .then(() => {
        initChart();
        renderSVG();
      })
      .catch(err => console.error('[Proton] ApexCharts failed', err));

    return container;
  };
})();
