from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *
from .views import GuardarRespuestaViewSimple
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

# ✅ CORREGIDO: Asegúrate de que todas las rutas estén en urlpatterns
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(router.urls)),
    
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/register/', register_view, name='register'),
    
    # ✅ VUELVE A LAS RUTAS ORIGINALES CON '/alumno/'
    path('api/alumno/evaluaciones/', EvaluacionesAlumnoView.as_view(), name='evaluaciones-alumno'),
    path('api/alumno/materias/', MateriasAlumnoView.as_view(), name='materias-alumno'),
    path('api/alumno/examen/<int:examen_id>/', ExamenDetalleView.as_view(), name='examen-detalle'),
    path('api/alumno/examen/<int:examen_id>/iniciar/', IniciarEvaluacionView.as_view(), name='iniciar-evaluacion'),
    path('api/alumno/respuestas/guardar/', GuardarRespuestaView.as_view(), name='guardar-respuesta'),
    path('api/alumno/examen/<int:examen_alumno_id>/finalizar/', FinalizarEvaluacionView.as_view(), name='finalizar-evaluacion'),
    path('api/alumno/examen/<int:examen_alumno_id>/corregir-auto/', CorregirEvaluacionAutoView.as_view(), name='corregir-evaluacion-auto'),
    path('api/alumno/examen/<int:examen_alumno_id>/envio/', ExamenEnvioView.as_view(), name='examen-envio'),
    path('api/alumno/examen/<int:examen_alumno_id>/resultado/', ExamenResultadoView.as_view(), name='examen-resultado'),
    path('api/alumno/examen/<int:examen_alumno_id>/retroalimentacion/', ExamenRetroalimentacionView.as_view(), name='examen-retroalimentacion'),
]
# AL FINAL DE urls.py - TEMPORAL
print("🔄 REGISTRANDO URLS...")

# Verificar que GuardarRespuestaView existe
try:
    guardar_view = GuardarRespuestaView
    print("✅ GuardarRespuestaView: OK")
except NameError:
    print("❌ GuardarRespuestaView: NO EXISTE")

print("📋 URL PATTERNS:")
for url in urlpatterns:
    if hasattr(url, 'pattern'):
        print(f"   {url.pattern}")