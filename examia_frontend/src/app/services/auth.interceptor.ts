import { HttpInterceptorFn } from '@angular/common/http';

//Creamos un interceptor HTTP que se ejecuta con cada request
//Agrega el TOKEN de los JWT creados anteriormente en los serializers de los regirstros, y los agregamos en lso headers de todas las request salientes
//Funciona como middleware entre Angular y el Backend
//Es decir, Angular hace la request -> La interceptamos aca -> Agregamos el header -> Se envia al back
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }
  
  return next(req);
};