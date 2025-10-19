from django.contrib import admin
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

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/register/', register_view, name='register'),
    
    # NUEVAS RUTAS PARA ALUMNO
    path('api/alumno/evaluaciones/', EvaluacionesAlumnoView.as_view(), name='evaluaciones-alumno'),
    path('api/alumno/materias/', MateriasAlumnoView.as_view(), name='materias-alumno'),  # NUEVA RUTA
    path('api/alumno/examen/<int:examen_id>/', ExamenDetalleView.as_view(), name='examen-detalle'),
    path('api/alumno/examen/<int:examen_id>/envio/', ExamenEnvioView.as_view(), name='examen-envio'),
    path('api/alumno/examen/<int:examen_id>/resultado/', ExamenResultadoView.as_view(), name='examen-resultado'),
    path('api/alumno/examen/<int:examen_id>/retroalimentacion/', ExamenRetroalimentacionView.as_view(), name='examen-retroalimentacion'),
]