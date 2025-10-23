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

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(router.urls)),
    
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/register/', register_view, name='register'),
    
    # ✅ RUTAS ALUMNO EXISTENTES
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
    path('api/alumno/validar-codigo/', ValidarCodigoView.as_view(), name='validar-codigo'),
    
    # ✅ RUTAS DOCENTE EXISTENTES
    path('api/docente/panel/', PanelDocenteView.as_view(), name='panel-docente'),
    path('api/docente/cursos/', CursosDocenteView.as_view(), name='cursos-docente'),
    path('api/docente/cursos/crear/', CrearCursoView.as_view(), name='crear-curso'),
    path('api/docente/examenes/', ExamenesDocenteView.as_view(), name='examenes-docente'),
    path('api/docente/examenes/crear/', CrearExamenView.as_view(), name='crear-examen'),
    
    # 🆕 NUEVAS RUTAS PARA EDICIÓN DE CORRECCIONES
    path('api/docente/examenes-corregidos/', ExamenesCorregidosDocenteView.as_view(), name='examenes-corregidos-docente'),
    path('api/docente/correccion/<int:examen_alumno_id>/', DetalleCorreccionDocenteView.as_view(), name='detalle-correccion-docente'),
    path('api/docente/correccion/<int:examen_alumno_id>/actualizar/', ActualizarCorreccionDocenteView.as_view(), name='actualizar-correccion-docente'),
    path('api/docente/cursos/<int:curso_id>/alumnos/', AlumnosCursoDocenteView.as_view(), name='alumnos-curso-docente'),
    path('api/docente/cursos/<int:curso_id>/metricas/', MetricasCursoView.as_view(), name='metricas-curso'),
    path('api/docente/cursos/<int:curso_id>/alumnos-evaluaciones/', AlumnosConEvaluacionesView.as_view(), name='alumnos-evaluaciones'),
]