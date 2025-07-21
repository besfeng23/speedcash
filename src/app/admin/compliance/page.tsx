"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page just redirects to the KYC queue by default.
export default function CompliancePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/compliance/kyc');
  }, [router]);

  return null; 
}
