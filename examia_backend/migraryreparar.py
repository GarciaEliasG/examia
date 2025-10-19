import os
import sys
import django
from datetime import datetime

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'examia_backend.settings')
django.setup()

from examia_backend.models import *

def migrar_y_reparar():
    print("🔄 INICIANDO MIGRACIÓN Y REPARACIÓN...")
    print("=" * 50)
    
    # 1. Reparar todos los exámenes existentes
    examenes_alumno = ExamenAlumno.objects.all()
    print(f"📋 Encontrados {examenes_alumno.count()} exámenes-alumno")
    
    reparados = 0
    for ea in examenes_alumno:
        # Si no tiene estado, establecerlo basado en condiciones
        if not hasattr(ea, 'estado'):
            if ea.calificacion_final is not None:
                estado = 'corregido'
            elif ea.fecha_realizacion is not None:
                estado = 'pendiente'
            else:
                estado = 'activo'
            print(f"   ⚠️  Examen {ea.examen.titulo} - Estado inferido: {estado}")
        else:
            # Reparar estado basado en condiciones lógicas
            if ea.estado == 'activo' and ea.fecha_realizacion is not None:
                ea.estado = 'pendiente'
                print(f"   🔧 Reparado: {ea.examen.titulo} → pendiente (tiene fecha)")
                reparados += 1
            elif ea.estado == 'activo' and ea.calificacion_final is not None:
                ea.estado = 'corregido' 
                print(f"   🔧 Reparado: {ea.examen.titulo} → corregido (tiene calificación)")
                reparados += 1
        
        ea.save()
    
    print(f"\n✅ REPARACIÓN COMPLETADA: {reparados} exámenes reparados")
    print("💡 Ahora ejecuta las migraciones de Django")

if __name__ == '__main__':
    migrar_y_reparar()