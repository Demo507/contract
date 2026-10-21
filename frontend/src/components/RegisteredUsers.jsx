import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function RegisteredUsers() {
  const [count, setCount] = useState(null);
  useEffect(() => {
    api('/api/users/count').then((d) => setCount(d.count)).catch(() => {});
  }, []);
  if (count === null) return null;
  return <div className="text-xs muted">{count} registered</div>;
}
