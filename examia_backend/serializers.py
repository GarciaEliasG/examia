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

# ====== NUEVOS SERIALIZERS PARA EDICIÓN DE CORRECCIONES ======

# ====== SERIALIZER PARA LECTURA (GET) ======
class CorreccionPreguntaReadSerializer(serializers.Serializer):
    """Serializer para LEER detalles de preguntas (GET) - CON TODOS LOS CAMPOS"""
    respuesta_id = serializers.IntegerField()
    pregunta_id = serializers.IntegerField()
    enunciado = serializers.CharField(read_only=True)
    tipo_pregunta = serializers.CharField(read_only=True)
    puntaje_maximo = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    respuesta_alumno = serializers.CharField(read_only=True)
    puntaje_actual = serializers.DecimalField(max_digits=5, decimal_places=2)
    retroalimentacion_actual = serializers.CharField(allow_blank=True)
    orden = serializers.IntegerField(read_only=True)

# ====== SERIALIZER PARA ESCRITURA (PUT) ======
class CorreccionPreguntaWriteSerializer(serializers.Serializer):
    """Serializer para ACTUALIZAR preguntas (PUT) - SOLO CAMPOS EDITABLES"""
    respuesta_id = serializers.IntegerField()
    puntaje_actual = serializers.DecimalField(max_digits=5, decimal_places=2)
    retroalimentacion_actual = serializers.CharField(allow_blank=True)

class ActualizarCorreccionSerializer(serializers.Serializer):
    """Serializer para actualizar corrección completa"""
    preguntas = CorreccionPreguntaWriteSerializer(many=True)  # ✅ USAR WriteSerializer para PUT
    retroalimentacion_general = serializers.CharField(allow_blank=True, required=False)

    def validate_preguntas(self, value):
        """Validar que todas las preguntas tengan datos válidos"""
        for pregunta in value:
            if pregunta['puntaje_actual'] < 0:
                raise serializers.ValidationError("El puntaje no puede ser negativo")
            # No validamos puntaje_maximo aquí porque no lo tenemos en el write serializer
        return value

class ExamenCorregidoListSerializer(serializers.Serializer):
    """Serializer para lista de exámenes corregidos"""
    examen_alumno_id = serializers.IntegerField()
    examen_id = serializers.IntegerField()
    titulo_examen = serializers.CharField()
    curso = serializers.CharField()
    curso_id = serializers.IntegerField()
    alumno_nombre = serializers.CharField()
    alumno_id = serializers.IntegerField()
    fecha_realizacion = serializers.CharField(allow_null=True)
    calificacion_final = serializers.DecimalField(max_digits=5, decimal_places=2)
    estado = serializers.CharField()
    fecha_correccion = serializers.CharField(allow_null=True)
    corregido_por = serializers.CharField()

class DetalleCorreccionSerializer(serializers.Serializer):
    """Serializer para detalles completos de una corrección"""
    examen_alumno_id = serializers.IntegerField()
    examen_id = serializers.IntegerField()
    titulo_examen = serializers.CharField()
    curso = serializers.CharField()
    alumno_nombre = serializers.CharField()
    alumno_id = serializers.IntegerField()
    fecha_realizacion = serializers.CharField(allow_null=True)
    calificacion_actual = serializers.DecimalField(max_digits=5, decimal_places=2)
    retroalimentacion_general = serializers.CharField()
    preguntas = CorreccionPreguntaReadSerializer(many=True)  # ✅ USAR ReadSerializer para GET
    puntaje_total_actual = serializers.DecimalField(max_digits=8, decimal_places=2)
    puntaje_maximo_total = serializers.DecimalField(max_digits=8, decimal_places=2)

class AlumnoCursoSerializer(serializers.Serializer):
    """Serializer para lista de alumnos por curso"""
    id = serializers.IntegerField()
    nombre = serializers.CharField()
    email = serializers.EmailField()