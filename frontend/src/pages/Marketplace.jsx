import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import MarketplaceHistory from '../components/MarketplaceHistory.jsx';
import { api } from '../lib/api.js';

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/products')
      .then((d) => setProducts(Array.isArray(d) ? d : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-12">
      <section className="max-w-2xl">
        <h1 className="font-display text-3xl sm:text-4xl leading-tight mb-3">
          Your payment stays locked until you confirm delivery.
        </h1>
        <p className="muted">
          Every purchase runs through an escrow contract: your TCH8 moves from your wallet into escrow, and only goes to
          the seller after you confirm the item arrived.
        </p>
      </section>

      <section>
        {loading && <p className="muted">Loading listings…</p>}
        {error && <p className="err">{error}</p>}
        {!loading && !error && products.length === 0 && (
          <div className="card p-10 text-center">
            <p className="font-display text-xl mb-1">Nothing listed yet</p>
            <p className="text-sm muted">Be the first to list something for sale.</p>
          </div>
        )}
        {products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      <MarketplaceHistory />
    </div>
  );
}
