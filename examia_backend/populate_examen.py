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
    sys.exit(1)

from django.contrib.auth import get_user_model
from examia_backend.models import *

def populate_examen_prueba():
    """Poblar un examen de PRUEBA con nombre específico"""
    print("\n" + "="*60)
    print("Creando EXAMEN PRUEBA1...")
    print("="*60)
    
    # 1. Obtener el alumno JoacoT
    try:
        User = get_user_model()
        alumno_user = User.objects.get(username='JoacoT')
        alumno = Alumno.objects.get(usuario=alumno_user)
        print("✓ Alumno JoacoT encontrado")
    except (User.DoesNotExist, Alumno.DoesNotExist):
        print("❌ No se encontró el alumno JoacoT. Ejecuta primero populate_data.py")
        return

    # 2. Obtener profesor y curso de Matemática I
    try:
        profesor_curso = ProfesorCurso.objects.get(curso__nombre='Matemática I')
        print(f"✓ Profesor-curso encontrado: {profesor_curso.profesor.nombre} - {profesor_curso.curso.nombre}")
    except ProfesorCurso.DoesNotExist:
        print("❌ No se encontró profesor-curso para Matemática I")
        return

    # 3. ELIMINAR examen existente si existe
    try:
        examen_existente = Examen.objects.get(titulo='EXAMEN PRUEBA1')
        examen_existente.delete()
        print("✓ Examen existente eliminado")
    except Examen.DoesNotExist:
        print("✓ No había examen existente")

    # 4. Crear el examen de PRUEBA
    examen_prueba = Examen.objects.create(
        profesor_curso=profesor_curso,
        titulo='EXAMEN PRUEBA1',
        descripcion='Examen de prueba para verificar el flujo completo',
        fecha_limite=datetime.now() + timedelta(days=7),
    )
    print("✓ Examen creado: 'EXAMEN PRUEBA1'")

    # 5. Crear preguntas con OPCIONES para multiple_choice
    preguntas_data = [
        {
            'enunciado': '¿Cuál es la capital de Argentina?',
            'tipo': 'multiple_choice',
            'puntaje': 1.0,
            'opciones': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza'],
            'orden': 1,
        },
        {
            'enunciado': 'Explica brevemente qué es una función matemática.',
            'tipo': 'desarrollo', 
            'puntaje': 2.0,
            'opciones': None,
            'orden': 2,
        },
        {
            'enunciado': '¿2 + 2 = ?',
            'tipo': 'texto',
            'puntaje': 1.0,
            'opciones': None,
            'orden': 3,
        }
    ]

    for i, pregunta_data in enumerate(preguntas_data, 1):
        Pregunta.objects.create(
            examen=examen_prueba,
            enunciado=pregunta_data['enunciado'],
            tipo=pregunta_data['tipo'],
            puntaje=pregunta_data['puntaje'],
            opciones=pregunta_data['opciones'],
            orden=pregunta_data['orden'],
        )
        print(f"✓ Pregunta {i} creada: {pregunta_data['tipo']}")

    # 6. Crear relación examen-alumno CON ESTADO ACTIVO Y SIN FECHA_REALIZACION
    examen_alumno = ExamenAlumno.objects.create(
        alumno=alumno,
        examen=examen_prueba,
        estado='activo',                    # ✅ Estado activo
        fecha_realizacion=None,             # ✅ Sin fecha de realización
        calificacion_final=None,            # ✅ Sin calificación
        retroalimentacion='',               # ✅ Sin retroalimentación
        tiempo_utilizado=0,                 # ✅ Tiempo en 0
    )
    
    print("✓ Relación alumno-examen creada CON ESTADO ACTIVO")

    # 7. Resumen final
    print("\n" + "="*60)
    print("¡EXAMEN PRUEBA1 CREADO EXITOSAMENTE!")
    print("="*60)
    print(f"📚 Examen: {examen_prueba.titulo}")
    print(f"📅 Vence: {examen_prueba.fecha_limite.strftime('%d/%m/%Y')}")
    print(f"❓ Preguntas: 3")
    print(f"🎯 Alumno: {alumno.nombre}")
    print(f"🔰 Estado: ACTIVO")
    print(f"   • fecha_realizacion: {examen_alumno.fecha_realizacion}")
    print(f"   • calificacion_final: {examen_alumno.calificacion_final}")
    print(f"   • estado: {examen_alumno.estado}")
    print("\n💡 Ahora debería aparecer como ACTIVA en el frontend")

def main():
    """Función principal"""
    try:
        populate_examen_prueba()
    except Exception as e:
        print(f"❌ Error durante la población: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()