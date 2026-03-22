import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const serviceUrl = process.env.AUTH_SERVICE_URL;

    if (!serviceUrl) {
      return NextResponse.json(
        { message: 'AUTH_SERVICE_URL not configured' },
        { status: 500 },
      );
    }

    const res = await fetch(`${serviceUrl}/v1/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await res.json().catch(() => null);

    return NextResponse.json(data ?? { message: 'Logout failed' }, {
      status: res.status,
    });
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
