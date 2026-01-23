// RIGHT panel: ultra minimal + Lightweight Chart
(function() {
  window.ProtonPanels = window.ProtonPanels || {};

  window.ProtonPanels.createRight = function() {
    const container = document.createElement('div');
    container.className = 'right-section';

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;height:100%;">
        <h3 style="margin:0;color:#0af;font-size:16px">Behavioral Settings</h3>
        <p style="margin:0;color:#cfe8ff;opacity:0.9">Chart preview</p>
        <div id="tradingview-chart" style="flex:1; min-height:200px; width:100%;"></div>
      </div>
    `;

    function loadLightweightCharts() {
      return new Promise((resolve, reject) => {
        if (window.LightweightCharts) return resolve();
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/lightweight-charts@4.2.1/dist/lightweight-charts.standalone.production.js';
        script.onload = () => setTimeout(() => {
          if (window.LightweightCharts) resolve();
          else reject(new Error('LightweightCharts global not found'));
        }, 0);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    loadLightweightCharts()
      .then(() => {
        const chartDiv = container.querySelector('#tradingview-chart');

        const chart = window.LightweightCharts.createChart(chartDiv, {
          width: chartDiv.clientWidth,
          height: chartDiv.clientHeight,
          layout: {
            backgroundColor: 'transparent',
            textColor: '#eee'
          },
          grid: {
            vertLines: { visible: false },
            horzLines: { visible: false }
          },
          rightPriceScale: {
            borderColor: '#555',
            scaleMargins: { top: 0.1, bottom: 0.1 }
          },
          timeScale: {
            borderColor: '#555',
            fixRightEdge: true,
            lockVisibleTimeRangeOnResize: true,
            rightOffset: 5
          },
          handleScroll: {
            mouseWheel: false,
            pressedMouseMove: false,
            horzTouchDrag: false,
            vertTouchDrag: false
          },
          handleScale: {
            axisPressedMouseMove: false,
            pinch: false,
            mouseWheel: false
          },
          crosshair: {
            mode: 0
          }
        });

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

        // Make chart fit container without overflow
        new ResizeObserver(() => {
          chart.applyOptions({
            width: chartDiv.clientWidth,
            height: chartDiv.clientHeight
          });
        }).observe(chartDiv);
      })
      .catch(err => {
        console.error('[Proton] Failed to load LightweightCharts', err);
      });

    return container;
  };
})();
