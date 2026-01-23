// RIGHT panel: ultra minimal + Chart.js Candlestick (dark, fit, no zoom)
(function() {
  window.ProtonPanels = window.ProtonPanels || {};

  window.ProtonPanels.createRight = function() {
    const container = document.createElement('div');
    container.className = 'right-section';

    // Flex column + shrinking inside flex row
    container.style.minWidth = '0';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '12px';
    container.style.height = '100%';

    container.innerHTML = `
      <h3 style="margin:0;color:#0af;font-size:16px">Behavioral Settings</h3>
      <p style="margin:0;color:#cfe8ff;opacity:0.9">Chart preview</p>
      <canvas id="chartjs-candlestick" style="flex:1; min-height:200px; width:100%;"></canvas>
    `;

    const canvas = container.querySelector('#chartjs-candlestick');

    // Dynamically load Chart.js + financial plugin (using unpkg to avoid MIME issues)
    function loadChartJS() {
      return new Promise((resolve, reject) => {
        if (window.Chart && window.ChartFinancial) return resolve();

        const scripts = [
          'https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js',
          'https://unpkg.com/chartjs-chart-financial@3.2.0/dist/chartjs-chart-financial.min.js'
        ];

        let loaded = 0;
        scripts.forEach(src => {
          const script = document.createElement('script');
          script.src = src;
          script.onload = () => {
            loaded++;
            if (loaded === scripts.length) resolve();
          };
          script.onerror = reject;
          document.head.appendChild(script);
        });
      });
    }

    function initChart() {
      const ctx = canvas.getContext('2d');

      const chart = new Chart(ctx, {
        type: 'candlestick',
        data: {
          datasets: [{
            label: 'OHLC',
            data: [
              { x: '2026-01-20', o: 100, h: 110, l: 90, c: 105 },
              { x: '2026-01-21', o: 105, h: 115, l: 95, c: 110 },
              { x: '2026-01-22', o: 110, h: 120, l: 100, c: 108 },
            ],
            borderColor: '#eee',
            borderWidth: 1,
            color: ctx => ctx.dataset.data[ctx.dataIndex].c >= ctx.dataset.data[ctx.dataIndex].o ? '#26a69a' : '#ef5350'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          },
          scales: {
            x: {
              grid: { display: false, drawTicks: false },
              ticks: { color: '#eee' },
              offset: true
            },
            y: {
              grid: { display: false, drawTicks: false },
              ticks: { color: '#eee' },
            }
          },
          interaction: { mode: 'nearest', intersect: false },
        }
      });

      // Make chart resize automatically
      const ro = new ResizeObserver(() => {
        chart.resize();
      });
      ro.observe(canvas);

      // Cleanup handle
      container._protonChartCleanup = () => {
        ro.disconnect();
        chart.destroy();
      };
    }

    loadChartJS()
      .then(initChart)
      .catch(err => console.error('[Proton] Failed to load Chart.js', err));

    return container;
  };
})();
