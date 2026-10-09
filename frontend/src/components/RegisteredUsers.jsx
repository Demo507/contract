import { useEffect, useState } from 'react';
import { BACKEND_URL } from '../contracts/addresses.js';

export default function RegisteredUsers() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/users/count`)
      .then((r) => r.json())
      .then((data) => setCount(data.count))
      .catch(() => {});
  }, []);

  if (count === null) return null;

  return (
    <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
      {count} registered
    </div>
  );
}