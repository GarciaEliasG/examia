from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import *

# Admin personalizado para mejor visualización
class UsuarioAdmin(UserAdmin):
    list_display = ('username', 'email', 'rol', 'first_name', 'last_name', 'is_staff')
    list_filter = ('rol', 'is_staff', 'is_superuser')
    fieldsets = UserAdmin.fieldsets + (
        ('Información adicional', {'fields': ('rol',)}),
    )

# Registro de modelos con admins personalizados
admin.site.register(Usuario, UsuarioAdmin)
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