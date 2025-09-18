from django.contrib import admin
from .models import *

admin.site.register(Usuario)
admin.site.register(Alumno)
admin.site.register(Profesor)
admin.site.register(Curso)
admin.site.register(Inscripcion)
admin.site.register(ProfesorCurso)
admin.site.register(Examen)
admin.site.register(Pregunta)
admin.site.register(Respuesta)
admin.site.register(ExamenAlumno)
admin.site.register(RespuestaAlumno)
# Register your models here.