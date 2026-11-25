import { TODAY } from '@/lib/data/core';
import { examples } from '@/lib/integration-examples';
export function GET() {
  return Response.json({versi:1, lingkungan:'contoh sintetis', tanggalAcuan:TODAY,...examples});
}
