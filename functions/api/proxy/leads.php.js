export async function onRequest(context) {
  return new Response(JSON.stringify({
    success: true,
    exists: false,
    canSearch: true
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
