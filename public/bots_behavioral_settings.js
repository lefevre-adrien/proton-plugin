// RIGHT panel: minimal + TradingView Lightweight Chart
(function() {
  window.ProtonPanels = window.ProtonPanels || {};

  window.ProtonPanels.createRight = function() {
    const container = document.createElement('div');
    container.className = 'right-section';

    // Minimal UI + chart container
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <h3 style="margin:0;color:#0af;font-size:16px">Behavioral Settings</h3>
        <p style="margin:0;color:#cfe8ff;opacity:0.9">
          Configure The Bot Wallets Behavior Over Time.
        </p>
        <div id="tradingview-chart" style="margin-top:12px; height:300px;"></div>
      </div>
    `;

    // Dynamically load Lightweight Charts if not already loaded
    function loadTradingView() {
      return new Promise((resolve, reject) => {
        if (window.LightweightCharts) return resolve();
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js';
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    // Initialize chart after loading the library
    loadTradingView()
      .then(() => {
        const LW = window.LightweightCharts; // grab global object
        const chartDiv = container.querySelector('#tradingview-chart');

        const chart = LW.createChart(chartDiv, {
          layout: { backgroundColor: '#1a1a1a', textColor: '#eee' },
          rightPriceScale: { borderColor: '#555' },
          timeScale: { borderColor: '#555' },
        });

        const candleSeries = chart.addCandlestickSeries({
          upColor: '#0f0',
          downColor: '#f00',
          borderVisible: false,
        });

        // Example candlestick data — replace with your own dynamically
        candleSeries.setData([
          { time: '2026-01-20', open: 100, high: 110, low: 90, close: 105 },
          { time: '2026-01-21', open: 105, high: 115, low: 95, close: 110 },
          { time: '2026-01-22', open: 110, high: 120, low: 100, close: 108 },
        ]);
      })
      .catch(err => {
        console.error('[Proton] Failed to load TradingView LightweightCharts', err);
      });

    return container;
  };
})();
