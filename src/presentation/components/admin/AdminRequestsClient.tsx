'use client';

import { useRouter } from 'next/navigation';

interface RequestPlain {
  id: string;
  userId: string;
  userName: string;
  userUsername: string;
  requestedRole: string;
  status: string;
  createdAt: string;
}

interface Props {
  requests: RequestPlain[];
}

export default function AdminRequestsClient({ requests }: Props) {
  const router = useRouter();

  const handleAction = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    await fetch(`/api/role-request?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: action }),
    });
    router.refresh();
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1>Запросы прав</h1>
      {requests.length === 0 ? (
        <p>Нет активных запросов</p>
      ) : (
        requests.map((req) => (
          <div key={req.id} style={{
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: 12,
            marginBottom: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: req.status === 'PENDING' ? '#fff' : req.status === 'APPROVED' ? '#eaffea' : '#ffeaea',
          }}>
            <div>
              <strong>{req.userName}</strong> <span style={{ color: '#666' }}>@{req.userUsername}</span>
              <span style={{ marginLeft: 8, color: '#666' }}>
                → {req.requestedRole === 'EDITOR' ? 'Редактор' : 'Капитан'}
              </span>
              <div style={{ fontSize: 12, color: '#666' }}>
                {new Date(req.createdAt).toLocaleString()} — {req.status}
              </div>
            </div>
            {req.status === 'PENDING' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleAction(req.id, 'APPROVED')}
                  style={{ padding: '4px 12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  Одобрить
                </button>
                <button
                  onClick={() => handleAction(req.id, 'REJECTED')}
                  style={{ padding: '4px 12px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  Отклонить
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
