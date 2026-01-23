// RIGHT panel: minimal + TradingView Lightweight Chart
(function() {
  window.ProtonPanels = window.ProtonPanels || {};

  window.ProtonPanels.createRight = function() {
    const container = document.createElement('div');
    container.className = 'right-section';

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <h3 style="margin:0;color:#0af;font-size:16px">Behavioral Settings</h3>
        <p style="margin:0;color:#cfe8ff;opacity:0.9">
          Chart preview
        </p>

        <div id="tradingview-chart" style="margin-top:12px; height:300px; width:100%;"></div>
      </div>
    `;

    function loadLightweightCharts() {
      return new Promise((resolve, reject) => {
        if (window.LightweightCharts) return resolve();
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js';
        script.onload = () => {
          // Wait a microtask to ensure the global is set
          setTimeout(() => {
            if (window.LightweightCharts) resolve();
            else reject(new Error('LightweightCharts global not found'));
          }, 0);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    loadLightweightCharts()
      .then(() => {
        const chartDiv = container.querySelector('#tradingview-chart');

        // Use global LightweightCharts, as documented
        const chart = window.LightweightCharts.createChart(chartDiv, {
          layout: {
            backgroundColor: '#1a1a1a',
            textColor: '#eee'
          },
          rightPriceScale: { borderColor: '#555' },
          timeScale: { borderColor: '#555' },
        });

        // Create candlestick series using documented method
        const candleSeries = chart.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        });

        candleSeries.setData([
          { time: '2026-01-20', open: 100, high: 110, low: 90, close: 105 },
          { time: '2026-01-21', open: 105, high: 115, low: 95, close: 110 },
          { time: '2026-01-22', open: 110, high: 120, low: 100, close: 108 },
        ]);
      })
      .catch(err => {
        console.error('[Proton] Failed to load LightweightCharts', err);
      });

    return container;
  };
})();
