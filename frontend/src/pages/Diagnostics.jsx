import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';
import { TCH8_ADDRESS, ESCROW_ADDRESS, SALE_ADDRESS, BACKEND_URL } from '../contracts/addresses.js';
import { tch8Abi } from '../contracts/tch8Abi.js';
import { escrowAbi } from '../contracts/escrowAbi.js';
import { saleAbi } from '../contracts/saleAbi.js';
import { getEscrowMode } from '../lib/escrowMode.js';

// A quick self-check page so you can see in 5 seconds whether everything is wired correctly.
export default function Diagnostics() {
  const publicClient = usePublicClient();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      const out = [];
      const add = (name, ok, detail) => out.push({ name, ok, detail });

      try {
        const mode = await getEscrowMode(publicClient);
        add('Escrow contract found', true, mode === 'v2'
          ? 'Secure version: buyer = the connected wallet.'
          : 'Older version (createOrder takes buyer). The app handles it automatically.');
      } catch (e) { add('Escrow contract found', false, e.message); }

      try {
        const t = await publicClient.readContract({ address: ESCROW_ADDRESS, abi: escrowAbi, functionName: 'token' });
        add('Escrow pays in TCH8', t.toLowerCase() === TCH8_ADDRESS, t.toLowerCase() === TCH8_ADDRESS
          ? 'Escrow token = your TCH8.' : `Escrow uses ${t}. It must equal ${TCH8_ADDRESS}. Redeploy Escrow with the right token.`);
      } catch (e) { add('Escrow pays in TCH8', false, e.shortMessage || e.message); }

      try {
        const m = await publicClient.readContract({ address: TCH8_ADDRESS, abi: tch8Abi, functionName: 'isMinter', args: [ESCROW_ADDRESS] });
        add('Escrow can burn on cash-out', m, m ? 'Escrow is a TCH8 minter.' : 'Governance must call TCH8.addMinter(escrow). Without it "Mark paid" fails.');
      } catch (e) { add('Escrow can burn on cash-out', false, e.shortMessage || e.message); }

      try {
        const m = await publicClient.readContract({ address: TCH8_ADDRESS, abi: tch8Abi, functionName: 'isMinter', args: [SALE_ADDRESS] });
        add('Sale can mint TCH8', m, m ? 'Sale is a TCH8 minter.' : 'Governance must call TCH8.addMinter(sale). Without it "Buy TCH8" fails.');
      } catch (e) { add('Sale can mint TCH8', false, e.shortMessage || e.message); }

      try {
        const p = await publicClient.readContract({ address: SALE_ADDRESS, abi: saleAbi, functionName: 'priceWeiPerToken' });
        add('Sale price set', p > 0n, `${formatUnits(p, 18)} ETH per TCH8`);
      } catch (e) { add('Sale price set', false, e.shortMessage || e.message); }

      try {
        const op = await publicClient.readContract({ address: ESCROW_ADDRESS, abi: escrowAbi, functionName: 'operator' });
        add('Escrow operator wallet', true, `${op}. Your backend OPERATOR_PRIVATE_KEY must belong to this wallet.`);
      } catch (e) { add('Escrow operator wallet', false, e.shortMessage || e.message); }

      try {
        const r = await fetch(`${BACKEND_URL}/health`);
        add('Backend reachable', r.ok, r.ok ? BACKEND_URL : `Status ${r.status}`);
      } catch {
        add('Backend reachable', false, `Cannot reach ${BACKEND_URL}. Check VITE_BACKEND_URL in Vercel (free hosting may be waking up: retry in 30s).`);
      }

      try {
        const r = await fetch(`${BACKEND_URL}/api/products`);
        add('Database connected', r.ok, r.ok ? 'Products load from the database.' : 'Backend is up but the database is not: check DATABASE_URL (use the Supabase SESSION POOLER string).');
      } catch {
        add('Database connected', false, 'Backend not reachable.');
      }

      setRows(out);
    })();
  }, [publicClient]);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl mb-1">System check</h1>
      <p className="text-sm muted mb-6">Green = good. Red = follow the hint under it.</p>
      {rows.length === 0 && <p className="muted">Checking…</p>}
      <div className="grid gap-2">
        {rows.map((r) => (
          <div key={r.name} className="card p-3 text-sm">
            <span style={{ color: r.ok ? 'var(--color-release)' : '#f1948a' }}>{r.ok ? '✓' : '✗'}</span>{' '}
            <b>{r.name}</b>
            <p className="muted break-all">{r.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
