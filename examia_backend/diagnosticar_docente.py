# diagnosticar_docente.py
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

def diagnosticar_problema_docente():
    """Diagnostica y repara los problemas del docente 'edecia'"""
    print("\n" + "="*70)
    print("🔍 DIAGNÓSTICO DEL PROBLEMA DEL DOCENTE 'edecia'")
    print("="*70)
    
    # 1. Verificar si el usuario existe
    try:
        User = get_user_model()
        usuario_edecia = User.objects.get(username='edecia')
        print("✅ Usuario 'edecia' encontrado")
        print(f"   - Email: {usuario_edecia.email}")
        print(f"   - Rol: {usuario_edecia.rol}")
        print(f"   - Nombre completo: {usuario_edecia.get_full_name()}")
    except User.DoesNotExist:
        print("❌ ERROR: Usuario 'edecia' no existe")
        return
    
    # 2. Verificar perfil de profesor
    try:
        profesor_edecia = Profesor.objects.get(usuario=usuario_edecia)
        print("✅ Perfil de profesor encontrado")
        print(f"   - Nombre en perfil: {profesor_edecia.nombre}")
        print(f"   - Email en perfil: {profesor_edecia.email}")
    except Profesor.DoesNotExist:
        print("❌ ERROR: No existe perfil de profesor para 'edecia'")
        print("   Creando perfil de profesor...")
        profesor_edecia = Profesor.objects.create(
            usuario=usuario_edecia,
            nombre='Prof. Elena De Cia',
            email='elena@ejemplo.com'
        )
        print("✅ Perfil de profesor creado")
    
    # 3. Verificar cursos asignados
    cursos_asignados = ProfesorCurso.objects.filter(profesor=profesor_edecia)
    print(f"\n📚 Cursos asignados a {profesor_edecia.nombre}: {cursos_asignados.count()}")
    
    if cursos_asignados.count() == 0:
        print("❌ PROBLEMA: El profesor no tiene cursos asignados")
        print("   Asignando cursos...")
        asignar_cursos_a_profesor(profesor_edecia)
    else:
        for pc in cursos_asignados:
            print(f"   ✅ {pc.curso.nombre} - Rol: {pc.rol}")
    
    # 4. Verificar exámenes creados
    examenes_creados = Examen.objects.filter(profesor_curso__profesor=profesor_edecia)
    print(f"\n📝 Exámenes creados por {profesor_edecia.nombre}: {examenes_creados.count()}")
    
    if examenes_creados.count() == 0:
        print("❌ PROBLEMA: El profesor no tiene exámenes creados")
        print("   Verificando si hay exámenes que deberían ser suyos...")
        verificar_y_reasignar_examenes(profesor_edecia)
    else:
        for examen in examenes_creados:
            print(f"   ✅ {examen.titulo} - Curso: {examen.profesor_curso.curso.nombre}")
    
    # 5. Estadísticas finales
    print("\n" + "📊 ESTADÍSTICAS FINALES:")
    print("-" * 40)
    
    # Cursos
    cursos_count = ProfesorCurso.objects.filter(profesor=profesor_edecia).count()
    print(f"📚 Cursos asignados: {cursos_count}")
    
    # Exámenes
    examenes_count = Examen.objects.filter(profesor_curso__profesor=profesor_edecia).count()
    print(f"📝 Exámenes creados: {examenes_count}")
    
    # Alumnos totales en sus cursos
    cursos_ids = ProfesorCurso.objects.filter(profesor=profesor_edecia).values_list('curso_id', flat=True)
    alumnos_totales = Inscripcion.objects.filter(curso_id__in=cursos_ids).values('alumno').distinct().count()
    print(f"👥 Alumnos totales en sus cursos: {alumnos_totales}")
    
    # Pendientes de corrección
    pendientes = ExamenAlumno.objects.filter(
        examen__profesor_curso__profesor=profesor_edecia,
        estado='pendiente'
    ).count()
    print(f"⏳ Exámenes pendientes de corrección: {pendientes}")
    
    print("\n✅ Diagnóstico completado. Ahora debería funcionar el panel del docente.")

def asignar_cursos_a_profesor(profesor):
    """Asigna cursos al profesor si no tiene ninguno"""
    print("\n🔄 Asignando cursos al profesor...")
    
    # Buscar cursos existentes
    cursos_existentes = Curso.objects.all()
    
    if not cursos_existentes:
        print("   ❌ No hay cursos en el sistema")
        return
    
    # Asignar Matemática I si existe
    matematica = cursos_existentes.filter(nombre='Matemática I').first()
    if matematica:
        ProfesorCurso.objects.create(
            profesor=profesor,
            curso=matematica,
            rol='Titular'
        )
        print(f"   ✅ Asignado: Matemática I")
    
    # Asignar Programación si existe
    programacion = cursos_existentes.filter(nombre='Programación').first()
    if programacion:
        ProfesorCurso.objects.create(
            profesor=profesor,
            curso=programacion,
            rol='Titular'
        )
        print(f"   ✅ Asignado: Programación")
    
    print("   ✅ Cursos asignados correctamente")

def verificar_y_reasignar_examenes(profesor):
    """Verifica si hay exámenes que deberían ser de este profesor y los reasigna"""
    print("\n🔄 Verificando exámenes existentes...")
    
    # Buscar todos los exámenes
    todos_los_examenes = Examen.objects.select_related('profesor_curso__profesor', 'profesor_curso__curso').all()
    
    examenes_reasignados = 0
    
    for examen in todos_los_examenes:
        # Si el examen es de Matemática I pero no es de este profesor
        if examen.profesor_curso.curso.nombre == 'Matemática I' and examen.profesor_curso.profesor != profesor:
            print(f"   📝 Examen '{examen.titulo}' está en Matemática I pero no es del profesor actual")
            
            # Buscar o crear la relación profesor-curso correcta
            profesor_curso_correcto, created = ProfesorCurso.objects.get_or_create(
                profesor=profesor,
                curso=examen.profesor_curso.curso,
                defaults={'rol': 'Titular'}
            )
            
            # Reasignar el examen
            examen.profesor_curso = profesor_curso_correcto
            examen.save()
            examenes_reasignados += 1
            print(f"   ✅ Reasignado a {profesor.nombre}")
    
    if examenes_reasignados == 0:
        print("   ℹ️ No se encontraron exámenes para reasignar")
        print("   Creando exámenes de ejemplo...")
        crear_examenes_ejemplo(profesor)

def crear_examenes_ejemplo(profesor):
    """Crea exámenes de ejemplo para el profesor"""
    print("\n🔄 Creando exámenes de ejemplo...")
    
    # Obtener un curso del profesor
    profesor_curso = ProfesorCurso.objects.filter(profesor=profesor).first()
    
    if not profesor_curso:
        print("   ❌ El profesor no tiene cursos asignados")
        return
    
    # Crear examen de ejemplo
    examen = Examen.objects.create(
        profesor_curso=profesor_curso,
        titulo='Evaluación Diagnóstica',
        descripcion='Evaluación inicial del curso',
        fecha_limite=datetime.now() + timedelta(days=30)
    )
    
    # Crear preguntas de ejemplo
    preguntas_data = [
        {
            'enunciado': '¿Cuál es el objetivo principal de esta materia?',
            'tipo': 'desarrollo',
            'puntaje': 2.0
        },
        {
            'enunciado': 'Selecciona la respuesta correcta sobre los conceptos básicos:',
            'tipo': 'multiple_choice',
            'puntaje': 1.0,
            'opciones': ['Opción A', 'Opción B', 'Opción C', 'Opción D']
        }
    ]
    
    for i, p_data in enumerate(preguntas_data, 1):
        Pregunta.objects.create(
            examen=examen,
            enunciado=p_data['enunciado'],
            tipo=p_data['tipo'],
            puntaje=p_data['puntaje'],
            opciones=p_data.get('opciones'),
            orden=i
        )
    
    print(f"   ✅ Creado examen: '{examen.titulo}' con {len(preguntas_data)} preguntas")

def verificar_todos_los_profesores():
    """Verifica el estado de todos los profesores en el sistema"""
    print("\n" + "="*70)
    print("👥 VERIFICACIÓN DE TODOS LOS PROFESORES")
    print("="*70)
    
    profesores = Profesor.objects.all()
    
    if not profesores:
        print("❌ No hay profesores en el sistema")
        return
    
    for profesor in profesores:
        print(f"\n🔍 Verificando: {profesor.nombre} ({profesor.usuario.username})")
        
        # Cursos
        cursos_count = ProfesorCurso.objects.filter(profesor=profesor).count()
        print(f"   📚 Cursos: {cursos_count}")
        
        # Exámenes
        examenes_count = Examen.objects.filter(profesor_curso__profesor=profesor).count()
        print(f"   📝 Exámenes: {examenes_count}")
        
        if cursos_count == 0:
            print("   ⚠️  Este profesor NO TIENE CURSOS ASIGNADOS")
        if examenes_count == 0:
            print("   ⚠️  Este profesor NO TIENE EXÁMENES CREADOS")

def main():
    """Función principal"""
    print("🎓 DIAGNÓSTICO DEL SISTEMA DOCENTE")
    
    # Verificar todos los profesores primero
    verificar_todos_los_profesores()
    
    # Diagnosticar específicamente el problema de 'edecia'
    diagnosticar_problema_docente()
    
    print("\n" + "="*70)
    print("🎯 INSTRUCCIONES:")
    print("="*70)
    print("1. Ejecuta este script para diagnosticar y reparar:")
    print("   python examia_backend/diagnosticar_docente.py")
    print("2. Luego inicia sesión nuevamente con 'edecia'")
    print("3. El panel del docente debería cargar correctamente")
    print("="*70)

if __name__ == '__main__':
    main()