import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const serviceUrl = process.env.PRODUCT_SERVICE_URL;

    if (!serviceUrl) {
      return NextResponse.json(
        { message: 'PRODUCT_SERVICE_URL not configured' },
        { status: 500 },
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const authorization = request.headers.get('Authorization');
    if (authorization) {
      headers['Authorization'] = authorization;
    }

    const res = await fetch(`${serviceUrl}/graphql`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    return NextResponse.json(data ?? { message: 'GraphQL request failed' }, {
      status: res.status,
    });
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
