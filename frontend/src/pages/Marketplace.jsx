import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import { BACKEND_URL } from '../contracts/addresses.js';

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/products`)
      .then((r) => r.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error('Failed to load products', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-12">
      <section className="max-w-2xl">
        <h1 className="font-display text-4xl leading-tight mb-4">
          Payment stays locked until the buyer confirms delivery.
        </h1>
        <p className="text-base" style={{ color: 'var(--color-muted)' }}>
          Every purchase on TCH8 runs through an escrow contract — the seller
          can't touch what you paid until you've confirmed the order arrived.
        </p>
      </section>

      <section>
        {loading && <p style={{ color: 'var(--color-muted)' }}>Loading listings…</p>}

        {!loading && products.length === 0 && (
          <div
            className="rounded-md p-10 text-center"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)' }}
          >
            <p className="font-display text-xl mb-2">Nothing listed yet</p>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Be the first to list something for sale.
            </p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}