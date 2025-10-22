# test_backend_docente.py (ACTUALIZADO)
import os
import sys
import django
from django.test import RequestFactory
from django.contrib.auth import get_user_model

# Configuración Django
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'examia_backend.settings')

try:
    django.setup()
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)

from examia_backend.views import PanelDocenteView
from examia_backend.models import Profesor

def test_backend_directo():
    """Test directo del backend sin frontend"""
    print("🧪 TEST DIRECTO DEL BACKEND DOCENTE (CORREGIDO)")
    print("="*50)
    
    try:
        # 1. Obtener el profesor edecia
        User = get_user_model()
        usuario_edecia = User.objects.get(username='edecia')
        profesor = Profesor.objects.get(usuario=usuario_edecia)
        
        print(f"🔍 Profesor: {profesor.nombre}")
        
        # 2. Crear request simulada
        factory = RequestFactory()
        request = factory.get('/api/docente/panel/')
        request.user = usuario_edecia
        
        # 3. Ejecutar la view
        view = PanelDocenteView()
        response = view.get(request)
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ BACKEND FUNCIONANDO CORRECTAMENTE")
            data = response.data
            print(f"📚 Cursos: {data['estadisticas']['totalCursos']}")
            print(f"📝 Exámenes: {data['estadisticas']['totalExamenes']}") 
            print(f"👥 Alumnos: {data['estadisticas']['totalAlumnos']}")
            print(f"⏳ Pendientes: {data['estadisticas']['pendientesCorreccion']}")
            
            # Mostrar cursos
            print(f"\n📋 Cursos del profesor:")
            for curso in data['cursosRecientes']:
                print(f"   - {curso['nombre']}: {curso['cantidad_alumnos']} alumnos, {curso['cantidad_examenes']} exámenes")
                
        else:
            print(f"❌ ERROR: {response.data}")
            
    except Exception as e:
        print(f"❌ ERROR en test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_backend_directo()