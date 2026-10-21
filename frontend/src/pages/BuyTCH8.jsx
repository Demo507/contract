import { useState } from 'react';
import { useReadContract } from 'wagmi';
import { parseEther, formatUnits } from 'viem';
import { SALE_ADDRESS } from '../contracts/addresses.js';
import { saleAbi } from '../contracts/saleAbi.js';
import { useTx, friendlyError } from '../lib/useTx.js';
import { fmtTch8 } from '../lib/format.js';

export default function BuyTCH8() {
  const { send, refresh } = useTx();
  const [eth, setEth] = useState('');
  const [status, setStatus] = useState('idle');
  const [msg, setMsg] = useState('');

  const { data: price } = useReadContract({ address: SALE_ADDRESS, abi: saleAbi, functionName: 'priceWeiPerToken' });

  let expected = null;
  try {
    if (price && eth && Number(eth) > 0) expected = fmtTch8((parseEther(eth) * 1_000_000n) / price);
  } catch { expected = null; }

  async function buy(e) {
    e.preventDefault();
    setStatus('buying');
    setMsg('');
    try {
      await send({ address: SALE_ADDRESS, abi: saleAbi, functionName: 'buy', value: parseEther(eth) });
      setStatus('done');
      setEth('');
      refresh();
    } catch (err) {
      setStatus('error');
      setMsg(friendlyError(err));
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="font-display text-3xl mb-1">Buy TCH8</h1>
      <p className="text-sm muted mb-6">
        Pay with Sepolia test ETH and receive TCH8.
        {price !== undefined && <> Price: <b>{formatUnits(price, 18)} ETH</b> per 1 TCH8.</>}
      </p>
      <form onSubmit={buy} className="grid gap-3">
        <label className="text-sm muted">How much Sepolia ETH do you want to spend?</label>
        <input required type="number" min="0" step="any" placeholder="e.g. 0.002" value={eth} onChange={(e) => setEth(e.target.value)} />
        {expected !== null && <p className="text-sm" style={{ color: 'var(--color-brass)' }}>You will receive about {expected} TCH8</p>}
        <button className="btn" type="submit" disabled={status === 'buying'}>{status === 'buying' ? 'Confirm in your wallet…' : 'Buy TCH8'}</button>
        {status === 'done' && <p className="ok">Done! Your balance has been updated.</p>}
        {status === 'error' && <p className="err">{msg}</p>}
      </form>
    </div>
  );
}
