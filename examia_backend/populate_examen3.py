import os
import sys
import django
from datetime import datetime, timedelta

# --- CONFIGURACIÓN DJANGO ---
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'examia_backend.settings')

try:
    django.setup()
except Exception as e:
    print(f"Error configurando Django: {e}")
    sys.exit(1)

from django.contrib.auth import get_user_model
from examia_backend.models import *


def populate_examen_parcial_ia_test():
    """Crea un examen nuevo con 5 preguntas distintas para probar Groq IA"""
    print("\n" + "=" * 65)
    print("🚀 Creando EXAMEN PARCIAL IA-TEST...")
    print("=" * 65)

    # 1️⃣ Obtener alumno
    try:
        User = get_user_model()
        alumno_user = User.objects.get(username='JoacoT')
        alumno = Alumno.objects.get(usuario=alumno_user)
        print("✓ Alumno JoacoT encontrado")
    except (User.DoesNotExist, Alumno.DoesNotExist):
        print("❌ No se encontró el alumno JoacoT. Ejecuta primero populate_data.py")
        return

    # 2️⃣ Obtener profesor-curso (Matemática I o el que exista)
    try:
        profesor_curso = ProfesorCurso.objects.get(curso__nombre='Matemática I')
        print(f"✓ Profesor-curso: {profesor_curso.profesor.nombre} - {profesor_curso.curso.nombre}")
    except ProfesorCurso.DoesNotExist:
        print("❌ No se encontró profesor-curso para Matemática I")
        return

    # 3️⃣ Eliminar examen existente si ya había uno con el mismo nombre
    try:
        examen_existente = Examen.objects.get(titulo='EXAMEN PARCIAL IA-TEST')
        examen_existente.delete()
        print("🗑️ Examen previo 'EXAMEN PARCIAL IA-TEST' eliminado")
    except Examen.DoesNotExist:
        print("✓ No había examen previo con ese nombre")

    # 4️⃣ Crear examen nuevo
    examen = Examen.objects.create(
        profesor_curso=profesor_curso,
        titulo='EXAMEN PARCIAL IA-TEST',
        descripcion='Examen con 5 preguntas variadas para testear corrección IA Groq.',
        fecha_limite=datetime.now() + timedelta(days=10)
    )
    print("✓ Examen creado correctamente")

    # 5️⃣ Crear 5 preguntas variadas
    preguntas_data = [
        {
            'enunciado': '¿Cuál es el valor de π (pi) aproximado a dos decimales?',
            'tipo': 'multiple_choice',
            'puntaje': 1.0,
            'opciones': ['3.14', '3.15', '3.13', '3.12'],
            'orden': 1,
        },
        {
            'enunciado': 'Resuelve la expresión: (8 × 5) − (4 × 7)',
            'tipo': 'texto',
            'puntaje': 1.5,
            'opciones': None,
            'orden': 2,
        },
        {
            'enunciado': 'Define qué es una ecuación cuadrática y da un ejemplo.',
            'tipo': 'desarrollo',
            'puntaje': 2.0,
            'opciones': None,
            'orden': 3,
        },
        {
            'enunciado': 'Selecciona la unidad de medida de energía en el Sistema Internacional:',
            'tipo': 'multiple_choice',
            'puntaje': 1.0,
            'opciones': ['Joule', 'Watt', 'Newton', 'Voltio'],
            'orden': 4,
        },
        {
            'enunciado': 'Explica brevemente la diferencia entre velocidad y aceleración.',
            'tipo': 'desarrollo',
            'puntaje': 2.5,
            'opciones': None,
            'orden': 5,
        }
    ]

    for i, p in enumerate(preguntas_data, start=1):
        Pregunta.objects.create(
            examen=examen,
            enunciado=p['enunciado'],
            tipo=p['tipo'],
            puntaje=p['puntaje'],
            opciones=p['opciones'],
            orden=p['orden']
        )
        print(f"✓ Pregunta {i} creada ({p['tipo']})")

    # 6️⃣ Crear relación examen-alumno (estado activo)
    examen_alumno = ExamenAlumno.objects.create(
        alumno=alumno,
        examen=examen,
        estado='activo',
        fecha_realizacion=None,
        calificacion_final=None,
        retroalimentacion='',
        tiempo_utilizado=0
    )
    print("✓ Relación Examen-Alumno creada con estado ACTIVO")

    # 7️⃣ Resumen final
    print("\n" + "=" * 65)
    print("🎉 ¡EXAMEN PARCIAL IA-TEST creado con éxito!")
    print("=" * 65)
    print(f"📘 Examen: {examen.titulo}")
    print(f"📅 Fecha límite: {examen.fecha_limite.strftime('%d/%m/%Y')}")
    print(f"❓ Preguntas: {len(preguntas_data)}")
    print(f"🎯 Alumno: {alumno.nombre}")
    print(f"🔰 Estado inicial: {examen_alumno.estado}")
    print(f"   • calificación_final: {examen_alumno.calificacion_final}")
    print(f"   • fecha_realizacion: {examen_alumno.fecha_realizacion}")

    activos = ExamenAlumno.objects.filter(alumno=alumno, estado='activo').count()
    print(f"\n📊 Exámenes activos del alumno: {activos}")
    print("✅ Listo para probar finalización y corrección automática con Groq IA")


def main():
    try:
        populate_examen_parcial_ia_test()
    except Exception as e:
        print(f"❌ Error durante la población: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
