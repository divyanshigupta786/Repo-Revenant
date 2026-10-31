import { NextResponse } from 'next/server';

/**
 * Next.js Runtime Route Handler for Internal Service Proxy
 * Reads the injected BACKEND_URL service binding at runtime.
 */
export async function GET(request, { params }) {
  return handleProxy(request, params, 'GET');
}

export async function POST(request, { params }) {
  return handleProxy(request, params, 'POST');
}

export async function PUT(request, { params }) {
  return handleProxy(request, params, 'PUT');
}

export async function DELETE(request, { params }) {
  return handleProxy(request, params, 'DELETE');
}

async function handleProxy(request, paramsPromise, method) {
  const params = await paramsPromise;
  const pathArray = params?.path || [];
  const subPath = pathArray.join('/');

  // Resolve base URL from bound Vercel service or local fallback
  const baseUrl = process.env.BACKEND_URL || process.env.BACKEND_API_URL || 'http://127.0.0.1:8000';

  // FastAPI routes are mounted at /health, /ready, and /api/*
  let targetPath = subPath;
  if (subPath === 'health') {
    targetPath = 'health';
  } else if (!subPath.startsWith('api/')) {
    targetPath = `api/${subPath}`;
  }

  // Preserve query string
  const { search } = new URL(request.url);
  const targetUrl = new URL(`${targetPath}${search}`, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);

  try {
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      // Do not forward host header to avoid SSL/host mismatches
      if (key !== 'host' && key !== 'content-length') {
        headers.set(key, value);
      }
    });

    let body = undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        body = await request.text();
      } catch {
        // No body
      }
    }

    const backendRes = await fetch(targetUrl.toString(), {
      method,
      headers,
      body,
      cache: 'no-store',
    });

    const responseHeaders = new Headers();
    backendRes.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    const resData = await backendRes.arrayBuffer();

    return new NextResponse(resData, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Backend Service Unavailable',
        details: err.message,
        target: targetUrl.toString(),
      },
      { status: 503 }
    );
  }
}
