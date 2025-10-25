export async function handler(event, context) {
  // Construimos la URL del backend
  const targetUrl = `https://api-gateway-bp4v.onrender.com${event.path.replace('/.netlify/functions/proxy', '')}`;

  console.log('🔁 Proxying to:', targetUrl);

  const response = await fetch(targetUrl, {
    method: event.httpMethod,
    headers: {
      ...event.headers,
      host: undefined // Importante para evitar problemas con Host headers
    },
    body: ['GET', 'HEAD'].includes(event.httpMethod) ? undefined : event.body
  });

  const body = await response.text();

  return {
    statusCode: response.status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
    body: body,
  };
}
