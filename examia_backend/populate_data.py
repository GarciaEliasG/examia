import os
import sys
import django
from datetime import datetime, timedelta

# Agregar el directorio padre al path de Python
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

# Configurar el entorno Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'examia_backend.settings')

try:
    django.setup()
except Exception as e:
    print(f"Error configurando Django: {e}")
    print("Asegúrate de que:")
    print("1. Estás ejecutando el script desde la carpeta correcta")
    print("2. Tu estructura de carpetas es correcta")
    sys.exit(1)

from django.contrib.auth import get_user_model
from examia_backend.models import *

def populate():
    print("Iniciando población de datos...")
    
    # Crear usuario alumno
    User = get_user_model()
    alumno_user, created = User.objects.get_or_create(
        username='JoacoT',
        defaults={
            'email': 'joaquinterzano@gmail.com',
            'rol': 'alumno',
            'first_name': 'Joaquin',
            'last_name': 'Terzano'
        }
    )
    if created:
        alumno_user.set_password('JOAQUINTERZANO')
        alumno_user.save()
        print("✓ Usuario JoacoT creado")
    
    # Crear perfil de alumno
    alumno, created = Alumno.objects.get_or_create(
        usuario=alumno_user,
        defaults={
            'nombre': 'Joaquin Terzano',
            'email': 'joacoquinterzano@gmail.com'
        }
    )
    if created:
        print("✓ Perfil de alumno creado")
    
    # Crear usuarios profesores
    profe1_user, created = User.objects.get_or_create(
        username='edecia',
        defaults={
            'email': 'elena@ejemplo.com',
            'rol': 'profesor',
            'first_name': 'Elena',
            'last_name': 'De Cia'
        }
    )
    if created:
        profe1_user.set_password('profesor123')
        profe1_user.save()
        print("✓ Usuario profesora Elena creado")
    
    profe2_user, created = User.objects.get_or_create(
        username='pgarcia',
        defaults={
            'email': 'garcia@ejemplo.com', 
            'rol': 'profesor',
            'first_name': 'Pedro',
            'last_name': 'García'
        }
    )
    if created:
        profe2_user.set_password('profesor123')
        profe2_user.save()
        print("✓ Usuario profesor García creado")
    
    # Crear perfiles de profesores
    profesor1, created = Profesor.objects.get_or_create(
        usuario=profe1_user,
        defaults={'nombre': 'Prof. Elena De Cia', 'email': 'elena@ejemplo.com'}
    )
    if created:
        print("✓ Perfil profesora Elena creado")
    
    profesor2, created = Profesor.objects.get_or_create(
        usuario=profe2_user,
        defaults={'nombre': 'Prof. García', 'email': 'garcia@ejemplo.com'}
    )
    if created:
        print("✓ Perfil profesor García creado")
    
    # Crear cursos
    matematica, created = Curso.objects.get_or_create(
        nombre='Matemática I',
        defaults={'descripcion': 'Curso de matemática de primer año'}
    )
    if created:
        print("✓ Curso Matemática I creado")
    
    programacion, created = Curso.objects.get_or_create(
        nombre='Programación',
        defaults={'descripcion': 'Curso de programación básica'}
    )
    if created:
        print("✓ Curso Programación creado")
    
    # Inscribir alumno en cursos
    insc1, created = Inscripcion.objects.get_or_create(alumno=alumno, curso=matematica)
    if created:
        print("✓ Inscripción a Matemática I creada")
    
    insc2, created = Inscripcion.objects.get_or_create(alumno=alumno, curso=programacion)
    if created:
        print("✓ Inscripción a Programación creada")
    
    # Asignar profesores a cursos
    pc1, created = ProfesorCurso.objects.get_or_create(
        profesor=profesor1,
        curso=matematica,
        defaults={'rol': 'Titular'}
    )
    if created:
        print("✓ Profesor Elena asignado a Matemática I")
    
    pc2, created = ProfesorCurso.objects.get_or_create(
        profesor=profesor2,
        curso=programacion,
        defaults={'rol': 'Titular'}
    )
    if created:
        print("✓ Profesor García asignado a Programación")
    
    # Crear exámenes
    examen1, created = Examen.objects.get_or_create(
        profesor_curso=pc1,
        titulo='Parcial Integrador',
        defaults={
            'descripcion': 'Examen parcial de matemática I',
            'fecha_limite': datetime.now() + timedelta(days=7)
        }
    )
    if created:
        print("✓ Examen 'Parcial Integrador' creado")
    
    examen2, created = Examen.objects.get_or_create(
        profesor_curso=pc2,
        titulo='Práctico 2',
        defaults={
            'descripcion': 'Práctico de programación',
            'fecha_limite': datetime.now() - timedelta(days=1)  # Ya venció
        }
    )
    if created:
        print("✓ Examen 'Práctico 2' creado")
    
    examen3, created = Examen.objects.get_or_create(
        profesor_curso=pc1,
        titulo='Parcial 1',
        defaults={
            'descripcion': 'Primer parcial de matemática',
            'fecha_limite': datetime.now() + timedelta(days=14)
        }
    )
    if created:
        print("✓ Examen 'Parcial 1' creado")
    
    # Crear preguntas para los exámenes
    pregunta1, created = Pregunta.objects.get_or_create(
        examen=examen1,
        enunciado='Las células procariotas no poseen:',
        defaults={'tipo': 'multiple_choice', 'puntaje': 1.00}
    )
    if created:
        print("✓ Pregunta 1 para Parcial Integrador creada")
    
    pregunta2, created = Pregunta.objects.get_or_create(
        examen=examen1,
        enunciado='¿Cuántos pares de cromosomas tiene un ser humano?',
        defaults={'tipo': 'desarrollo', 'puntaje': 1.00}
    )
    if created:
        print("✓ Pregunta 2 para Parcial Integrador creada")
    
    # Crear examen ya realizado y corregido (Práctico 2)
    examen_realizado, created = ExamenAlumno.objects.get_or_create(
        alumno=alumno,
        examen=examen2,
        defaults={
            'calificacion_final': 8.50,
            'retroalimentacion': 'Buen trabajo en general'
        }
    )
    if created:
        print("✓ Examen Práctico 2 marcado como corregido (8.50)")
        
        # Crear respuestas del alumno para el examen corregido
        # Pregunta 1 (simulada)
        pregunta_pr1, created = Pregunta.objects.get_or_create(
            examen=examen2,
            enunciado='Menciona las tres principales estructuras de control en programación.',
            defaults={'tipo': 'desarrollo', 'puntaje': 3.00}
        )
        
        # Pregunta 2 (simulada)
        pregunta_pr2, created = Pregunta.objects.get_or_create(
            examen=examen2,
            enunciado='¿Qué lenguaje se utiliza principalmente para dar estructura a la web?',
            defaults={'tipo': 'multiple_choice', 'puntaje': 2.00}
        )
        
        # Respuestas del alumno
        RespuestaAlumno.objects.get_or_create(
            examen_alumno=examen_realizado,
            pregunta=pregunta_pr1,
            defaults={
                'respuesta': 'Secuencia, Selección (If/Else), e Iteración (Bucles).',
                'puntaje_obtenido': 3.00
            }
        )
        
        RespuestaAlumno.objects.get_or_create(
            examen_alumno=examen_realizado,
            pregunta=pregunta_pr2,
            defaults={
                'respuesta': 'HTML',
                'puntaje_obtenido': 2.00
            }
        )
        
        print("✓ Respuestas del alumno creadas para Práctico 2")
    
    # Crear examen pendiente de corrección (Parcial 1)
    examen_pendiente, created = ExamenAlumno.objects.get_or_create(
        alumno=alumno,
        examen=examen3
    )
    if created:
        print("✓ Examen Parcial 1 marcado como pendiente")
        
        # Crear respuestas del alumno para el examen pendiente
        pregunta_p1, created = Pregunta.objects.get_or_create(
            examen=examen3,
            enunciado='Resuelve la ecuación: 2x + 5 = 15',
            defaults={'tipo': 'desarrollo', 'puntaje': 5.00}
        )
        
        RespuestaAlumno.objects.get_or_create(
            examen_alumno=examen_pendiente,
            pregunta=pregunta_p1,
            defaults={
                'respuesta': 'x = 5',
                'puntaje_obtenido': None  # Pendiente de corrección
            }
        )
        
        print("✓ Respuesta del alumno creada para Parcial 1 (pendiente)")
    
    print("\n" + "="*50)
    print("¡Población de datos completada!")
    print("="*50)
    print(f"Usuario para login: JoacoT")
    print(f"Contraseña: JOAQUINTERZANO")
    print(f"Alumno: {alumno.nombre}")
    print(f"Exámenes creados: 3")
    print(f"- Parcial Integrador: ACTIVO (puede comenzar)")
    print(f"- Práctico 2: CORREGIDO (8.50 puntos)") 
    print(f"- Parcial 1: PENDIENTE (esperando corrección)")

if __name__ == '__main__':
    populate()

#ejecutar en la capreta raiz (examia) con python examia_backend/populate_data.py