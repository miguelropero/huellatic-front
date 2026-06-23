// src/utils/api.js

export async function fetchWithAuth(url, options = {}) {
  // Configurar headers y añadir access token
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem('token');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const updatedOptions = { ...options, headers };

  // Intentar la petición original
  let response = await fetch(url, updatedOptions);

  // Si no es 401, retornar inmediatamente
  if (response.status !== 401) {
    return response;
  }

  // Si es 401, intentar refrescar el token
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    // Si no hay refresh token, forzar cierre de sesión
    handleLogout();
    return response; // Devolver el 401 original
  }

  try {
    const refreshResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!refreshResponse.ok) {
      throw new Error('Refresh token invalid or expired');
    }

    const data = await refreshResponse.json();
    
    // Guardar los nuevos tokens
    localStorage.setItem('token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }

    // Reintentar la petición original con el nuevo token
    headers.set('Authorization', `Bearer ${data.access_token}`);
    const retryOptions = { ...options, headers };
    
    response = await fetch(url, retryOptions);
    return response;

  } catch (error) {
    // Si el proceso de refresh falla, desloguear
    handleLogout();
    return response; // Devolver el 401 original
  }
}

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('rol');
  // Redirigir al login si no estamos ya allí
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}
