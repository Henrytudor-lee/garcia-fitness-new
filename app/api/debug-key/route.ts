import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const apikeyHeader = req.headers.get('apikey');
  
  return NextResponse.json({
    hasAuthHeader: !!authHeader,
    authHeaderLength: authHeader?.length,
    authHeaderStart: authHeader?.substring(0, 20),
    authHeaderEnd: authHeader?.slice(-20),
    hasApikeyHeader: !!apikeyHeader,
    apikeyHeaderLength: apikeyHeader?.length,
    apikeyStart: apikeyHeader?.substring(0, 20),
    apikeyEnd: apikeyHeader?.slice(-20),
  });
}
