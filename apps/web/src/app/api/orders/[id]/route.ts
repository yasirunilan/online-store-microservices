import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    const res = await fetch(`${serviceUrl}/v1/orders/${id}`, {
      method: 'GET',
      headers,
    });

    const data = await res.json().catch(() => null);

    return NextResponse.json(data ?? { message: 'Failed to fetch order' }, {
      status: res.status,
    });
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
