import { HttpInterceptorFn } from '@angular/common/http';

//Creamos un interceptor que agrega el header autenticado a lo que corresponda
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Excluir rutas de autenticación del interceptor
  const authRoutes = ['/api/auth/login/', '/api/auth/register/'];
  const shouldSkip = authRoutes.some(route => req.url.includes(route));
  
  if (shouldSkip) {
    return next(req);
  }

  const token = localStorage.getItem('token');
  
  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }
  
  return next(req);
};