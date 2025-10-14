"""
URL configuration for examia_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)
router.register(r'alumnos', AlumnoViewSet)
router.register(r'profesores', ProfesorViewSet)
router.register(r'cursos', CursoViewSet)
router.register(r'inscripciones', InscripcionViewSet)
router.register(r'profesor_curso', ProfesorCursoViewSet)
router.register(r'examenes', ExamenViewSet)
router.register(r'preguntas', PreguntaViewSet)
router.register(r'respuestas', RespuestaViewSet)
router.register(r'examen_alumno', ExamenAlumnoViewSet)
router.register(r'respuesta_alumno', RespuestaAlumnoViewSet)

#Agregamos nuevas rutas
#definimos como api/ para mantener una estrucutra
#definimos una para el login y register (con auth de auntenticacion)
#ademas una para la obtencion del token de acceso y el refresh del mismo
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/register/', register_view, name='register'),
]
