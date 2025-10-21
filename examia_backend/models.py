from django.db import models
from django.contrib.auth.models import AbstractUser

class Usuario(AbstractUser):
    ROLES = (
        ('alumno', 'Alumno'),
        ('profesor', 'Profesor'),
    )
    rol = models.CharField(max_length=20, choices=ROLES)

class Alumno(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.nombre

class Profesor(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.nombre

class Curso(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()

    def __str__(self):
        return self.nombre

class Inscripcion(models.Model):
    alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE)
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE)
    fecha_inscripcion = models.DateField(auto_now_add=True)

class ProfesorCurso(models.Model):
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE)
    profesor = models.ForeignKey(Profesor, on_delete=models.CASCADE)
    rol = models.CharField(max_length=50)

class Examen(models.Model):
    profesor_curso = models.ForeignKey(ProfesorCurso, on_delete=models.CASCADE)
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    fecha_creacion = models.DateField(auto_now_add=True)
    fecha_limite = models.DateField(null=True, blank=True)

class Pregunta(models.Model):
    TIPOS_PREGUNTA = (
        ('multiple_choice', 'Opción Múltiple'),
        ('desarrollo', 'Desarrollo'),
        ('texto', 'Texto Corto'),
    )
    
    examen = models.ForeignKey(Examen, on_delete=models.CASCADE, related_name="preguntas")
    enunciado = models.TextField()
    tipo = models.CharField(max_length=50, choices=TIPOS_PREGUNTA)
    puntaje = models.DecimalField(max_digits=5, decimal_places=2)
    opciones = models.JSONField(null=True, blank=True)  # Para preguntas de opción múltiple
    orden = models.IntegerField(default=1)  # Orden de las preguntas

class Respuesta(models.Model):
    pregunta = models.ForeignKey(Pregunta, on_delete=models.CASCADE, related_name="respuestas")
    contenido = models.TextField()
    calificacion = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

class ExamenAlumno(models.Model):
    ESTADOS = (
        ('activo', 'Activo'),
        ('pendiente', 'Pendiente de corrección'),
        ('corregido', 'Corregido'),
    )
    
    alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE)
    examen = models.ForeignKey(Examen, on_delete=models.CASCADE)
    fecha_realizacion = models.DateTimeField(null=True, blank=True)  # ✅ CAMBIAR a DateTimeField
    calificacion_final = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    retroalimentacion = models.TextField(blank=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='activo')
    fecha_inicio = models.DateTimeField(null=True, blank=True)
    tiempo_utilizado = models.IntegerField(default=0)

class RespuestaAlumno(models.Model):
    examen_alumno = models.ForeignKey(ExamenAlumno, on_delete=models.CASCADE, related_name="respuestas_alumno")
    pregunta = models.ForeignKey(Pregunta, on_delete=models.CASCADE)
    respuesta = models.TextField()
    puntaje_obtenido = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    retroalimentacion = models.TextField(blank=True)  # ✅ AGREGAR este campo
    fecha_respuesta = models.DateTimeField(auto_now=True)