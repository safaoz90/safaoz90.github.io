// Cozy Jigsaw — everything that works differently inside the iPhone app lives here.
// In a browser: purchases and videos are simulated so the game can be tried end to end.
// In the app (Capacitor): RevenueCat purchases, AdMob rewarded videos, haptics, analytics.
(function (root) {
  const CJ = (root.CJ = root.CJ || {});
  const Cap = root.Capacitor;
  const native = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  const plugin = (name) => (native && Cap.registerPlugin ? Cap.registerPlugin(name) : null);
  const KEYS = Object.assign({ revenuecat: 'appl_LSvDTQNYpjqSkgEKaXyATxkMSTn' }, root.CJ_KEYS || {}); // RevenueCat public iOS key (safe to ship)

  // A browser stand-in for a rewarded video: a short countdown the player can watch or close.
  function fakeVideo() {
    return new Promise((resolve) => {
      const el = document.createElement('div');
      el.className = 'ad-sim';
      el.innerHTML = `<div class="ad-box"><p>Test video</p><b class="ad-n">3</b><button class="btn soft ad-x">Close</button></div>`;
      document.body.appendChild(el);
      let n = 3; const t = setInterval(() => { n--; el.querySelector('.ad-n').textContent = n; if (n <= 0) { clearInterval(t); el.remove(); resolve({ rewarded: true }); } }, 800);
      el.querySelector('.ad-x').onclick = () => { clearInterval(t); el.remove(); resolve({ rewarded: false }); };
    });
  }

  const Ads = plugin('RewardedAds'), Store = plugin('Purchases'), Haptics = plugin('Haptics');
  let storeReady = null;
  const startStore = () => {
    if (!Store || !KEYS.revenuecat) return Promise.resolve(false);
    if (!storeReady) storeReady = (async () => {
      await Store.configure({ apiKey: KEYS.revenuecat });
      const r = await Store.getProducts({ productIdentifiers: CJ.RULES.PRODUCTS.map((p) => p.id) });
      for (const sp of (r && r.products) || []) { const p = CJ.RULES.PRODUCTS.find((x) => x.id === sp.identifier); if (p) { p.store = sp; if (sp.priceString) p.price = sp.priceString; } }
      return true;
    })().catch(() => { storeReady = null; return false; });
    return storeReady;
  };
  const kept = (info) => ((info && info.allPurchasedProductIdentifiers) || []).filter((id) => /^cozy\.season\./.test(id));

  CJ.Platform = {
    native,
    canPurchase: native && !!KEYS.revenuecat,
    start() { if (native) startStore(); },
    async purchase(id) {
      if (!native) return { ok: confirm('Test purchase: open it for free in this browser version?'), test: true };
      if (!(await startStore())) return { ok: false, reason: 'unavailable' };
      const p = CJ.RULES.PRODUCTS.find((x) => x.id === id);
      if (!p || !p.store) return { ok: false, reason: 'unavailable' };
      try { await Store.purchaseStoreProduct({ product: p.store }); return { ok: true }; }
      catch (e) { const c = e && (e.code === '1' || e.code === 1 || e.userCancelled || (e.data && e.data.userCancelled)); return { ok: false, reason: c ? 'cancelled' : 'failed' }; }
    },
    async restore() {
      if (!native) return [];
      if (!(await startStore())) throw new Error('store unavailable');
      const r = await Store.restorePurchases(); return kept(r && r.customerInfo);
    },
    async owned() {
      if (!native || !(await startStore())) return [];
      try { const r = await Store.getCustomerInfo(); return kept(r && r.customerInfo); } catch (_) { return []; }
    },
    // { rewarded, unavailable }: unavailable when no video could be shown (the game then gives the hint anyway).
    async showRewarded(placement) {
      if (!native) return fakeVideo();
      if (!Ads) return { rewarded: false, unavailable: true };
      try { await Ads.initialize(); const r = await Ads.showRewarded({ placement: placement || 'hint' }); return { rewarded: !!r.rewarded, unavailable: !!r.unavailable }; }
      catch (_) { return { rewarded: false, unavailable: true }; }
    },
    haptic() { try { if (Haptics) Haptics.impact({ style: 'LIGHT' }); else if (navigator.vibrate) navigator.vibrate(8); } catch (_) {} },
    site: 'https://safaoz90.github.io',
  };
  CJ.haptic = CJ.Platform.haptic;
})(typeof window !== 'undefined' ? window : globalThis);
