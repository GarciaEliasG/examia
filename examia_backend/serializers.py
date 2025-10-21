from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import *

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    nombre = serializers.CharField(write_only=True, required=False)
    apellido = serializers.CharField(write_only=True, required=False)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = ['username', 'password', 'confirm_password', 'email', 'rol', 'nombre', 'apellido']
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return data
    
    def create(self, validated_data):
        if Usuario.objects.filter(username=validated_data['username']).exists():
            raise serializers.ValidationError({"username": "Este usuario ya existe"})
        if Usuario.objects.filter(email=validated_data['email']).exists():
            raise serializers.ValidationError({"email": "Este email ya está registrado"})
        
        validated_data.pop('confirm_password')
        nombre = validated_data.pop('nombre', '')
        apellido = validated_data.pop('apellido', '')
        
        user = Usuario.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            rol=validated_data['rol'],
            first_name=nombre,
            last_name=apellido
        )
        
        if validated_data['rol'] == 'alumno':
            Alumno.objects.create(
                usuario=user, 
                nombre=f"{nombre} {apellido}".strip() or user.username,
                email=validated_data['email']
            )
        elif validated_data['rol'] == 'profesor':
            Profesor.objects.create(
                usuario=user, 
                nombre=f"{nombre} {apellido}".strip() or user.username,
                email=validated_data['email']
            )
        
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        
        if not user:
            raise serializers.ValidationError("Credenciales inválidas")

        refresh = RefreshToken.for_user(user)

        return {
            'token': str(refresh.access_token),
            'user': {
                'id': user.id,
                'nombre': user.get_full_name() or user.username,
                'rol': user.rol
            }
        }

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'rol']

class AlumnoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alumno
        fields = '__all__'

class ProfesorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profesor
        fields = '__all__'

class CursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Curso
        fields = '__all__'

class InscripcionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inscripcion
        fields = '__all__'

class ProfesorCursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfesorCurso
        fields = '__all__'

class ExamenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Examen
        fields = '__all__'

class PreguntaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pregunta
        fields = ['id', 'enunciado', 'tipo', 'puntaje', 'opciones', 'orden']

class RespuestaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Respuesta
        fields = '__all__'

class ExamenAlumnoDetalleSerializer(serializers.ModelSerializer):
    titulo = serializers.CharField(source='examen.titulo', read_only=True)
    materia = serializers.CharField(source='examen.profesor_curso.curso.nombre', read_only=True)
    docente = serializers.CharField(source='examen.profesor_curso.profesor.nombre', read_only=True)
    fecha_limite = serializers.DateField(source='examen.fecha_limite', read_only=True)
    descripcion = serializers.CharField(source='examen.descripcion', read_only=True)

    class Meta:
        model = ExamenAlumno
        fields = [
            'id', 'id_alumno', 'id_examen', 'fecha_inicio', 'fecha_realizacion',
            'calificacion_final', 'retroalimentacion', 'estado', 'tiempo_utilizado',
            'titulo', 'materia', 'docente', 'fecha_limite', 'descripcion'
        ]

class ExamenAlumnoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamenAlumno
        fields = '__all__'

class RespuestaAlumnoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RespuestaAlumno
        fields = '__all__'