
"use client";
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';



export default function PartnerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const partnerId = params.partnerId as string;

  useEffect(() => {
    if (partnerId) {
      router.replace(`/admin/partners/${partnerId}/api`);
    }
  }, [partnerId, router]);

  return null; 
}
