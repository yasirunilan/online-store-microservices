import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const serviceUrl = process.env.ORDER_SERVICE_URL;

    if (!serviceUrl) {
      return NextResponse.json(
        { message: 'ORDER_SERVICE_URL not configured' },
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

    const res = await fetch(`${serviceUrl}/v1/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    return NextResponse.json(data ?? { message: 'Failed to create order' }, {
      status: res.status,
    });
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const serviceUrl = process.env.ORDER_SERVICE_URL;

    if (!serviceUrl) {
      return NextResponse.json(
        { message: 'ORDER_SERVICE_URL not configured' },
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

    const res = await fetch(`${serviceUrl}/v1/orders/me`, {
      method: 'GET',
      headers,
    });

    const data = await res.json().catch(() => null);

    return NextResponse.json(data ?? { message: 'Failed to fetch orders' }, {
      status: res.status,
    });
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
