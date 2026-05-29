import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/auth/authOptions';
import { redirect } from 'next/navigation';
import { prisma } from '@/infrastructure/database/client';
import AdminRequestsClient from '@/presentation/components/admin/AdminRequestsClient';

export default async function AdminRequestsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');

  const role = (session.user as any).role;
  if (role !== 'ADMIN') {
    return <div>Access denied. Admin only.</div>;
  }

  const requests = await prisma.roleRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, username: true, fullName: true },
      },
    },
  });

  const requestsPlain = requests.map((r) => ({
    id: r.id,
    userId: r.userId,
    userName: r.user.fullName,
    userUsername: r.user.username,
    requestedRole: r.requestedRole,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));

  return <AdminRequestsClient requests={requestsPlain} />;
}
