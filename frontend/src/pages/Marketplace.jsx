import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import { BACKEND_URL } from '../contracts/addresses.js';

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/products`)
      .then((r) => r.json())
      .then(setProducts)
      .catch((err) => console.error('Failed to load products', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {/* HERO / INTRO BANNER BLOCK */}
      <section className="bg-yellow-950/10 border border-yellow-700/20 p-6 rounded-xl shadow-sm">
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-brass)] mb-2">
          Secure Trustless Escrow Shopping
        </h1>
        <p className="text-sm text-[var(--color-muted)] leading-relaxed max-w-3xl">
          Every transaction on TCH8 runs through an automated smart contract ledger. 
          Your payment stays safely locked on-chain—the seller cannot claim your tokens until you confirm delivery.
        </p>
      </section>

      {/* ITEMS LISTING GRID BLOCK */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xs uppercase font-semibold text-[var(--color-muted)] tracking-wider">
            Available Listings ({products.length})
          </h2>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center p-12 bg-[var(--color-ink)]/30 border border-[var(--color-line)] rounded-xl border-dashed">
            <div className="w-6 h-6 border-2 border-[var(--color-brass)] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs text-[var(--color-muted)]">Loading marketplace inventory...</p>
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="rounded-xl p-12 text-center bg-[var(--color-ink)]/30 border border-[var(--color-line)] border-dashed">
            <span className="text-3xl block mb-2">📦</span>
            <h3 className="font-display font-semibold text-lg text-[var(--color-text)] mb-1">
              Nothing Listed Yet
            </h3>
            <p className="text-xs text-[var(--color-muted)] max-w-xs mx-auto">
              Be the first vendor to list digital or physical assets for sale on the marketplace.
            </p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => (
              <div 
                key={p.id} 
                className="bg-[var(--color-ink)]/40 border border-[var(--color-line)] rounded-xl overflow-hidden transition-all duration-200 hover:border-[var(--color-brass)] hover:shadow-md flex flex-col"
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
