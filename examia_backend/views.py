from rest_framework import viewsets
from .models import *
from .serializers import *
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes 
from rest_framework.permissions import AllowAny  

# Estamos probando un nuevo modelo de conexion con las vistas
# Es un Endpoint para el registro de nuevos usuarios, valida los datos con el registerSerializer (Para ver si se puede crear el usuario)
# Retorno con datos del usuario o con error si corresponde
@api_view(['POST'])
@permission_classes([AllowAny])  
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'message': 'Usuario registrado exitosamente',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'rol': user.rol
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Modificamos el endpoint del login 
# Es un poco mas simple y automatica, valida los datos con el serializer del Login y retorna si es validoo error que corresponde
@api_view(['POST'])
@permission_classes([AllowAny]) 
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        return Response(serializer.validated_data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# El resto de tus ViewSets (estas SÍ requieren autenticación)
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

class AlumnoViewSet(viewsets.ModelViewSet):
    queryset = Alumno.objects.all()
    serializer_class = AlumnoSerializer
class AlumnoViewSet(viewsets.ModelViewSet):
    queryset = Alumno.objects.all()
    serializer_class = AlumnoSerializer

class ProfesorViewSet(viewsets.ModelViewSet):
    queryset = Profesor.objects.all()
    serializer_class = ProfesorSerializer

class CursoViewSet(viewsets.ModelViewSet):
    queryset = Curso.objects.all()
    serializer_class = CursoSerializer

class InscripcionViewSet(viewsets.ModelViewSet):
    queryset = Inscripcion.objects.all()
    serializer_class = InscripcionSerializer

class ProfesorCursoViewSet(viewsets.ModelViewSet):
    queryset = ProfesorCurso.objects.all()
    serializer_class = ProfesorCursoSerializer

class ExamenViewSet(viewsets.ModelViewSet):
    queryset = Examen.objects.all()
    serializer_class = ExamenSerializer

class PreguntaViewSet(viewsets.ModelViewSet):
    queryset = Pregunta.objects.all()
    serializer_class = PreguntaSerializer

class RespuestaViewSet(viewsets.ModelViewSet):
    queryset = Respuesta.objects.all()
    serializer_class = RespuestaSerializer

class ExamenAlumnoViewSet(viewsets.ModelViewSet):
    queryset = ExamenAlumno.objects.all()
    serializer_class = ExamenAlumnoSerializer

class RespuestaAlumnoViewSet(viewsets.ModelViewSet):
    queryset = RespuestaAlumno.objects.all()
    serializer_class = RespuestaAlumnoSerializer
