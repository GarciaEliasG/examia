from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import *

# Agregamos un serializer para tomar los datos del registro usuario
#Estará heredada de ModelSerializer, permitiendome usar funciones automatizadas
#Este se encargará de crear usuarios con validacion de contraseñas automaticas, ademas de crear los perfiles Alumno/Profesor (Solo creacion, no edicion de usuario)
class RegisterSerializer(serializers.ModelSerializer):
    #Definimos los datos que se necesitan 
    password = serializers.CharField(write_only=True)
    nombre = serializers.CharField(write_only=True, required=False)
    apellido = serializers.CharField(write_only=True, required=False)
    confirm_password = serializers.CharField(write_only=True)

    #Aclaramos el modelo del cual nos basamos
    class Meta:
        model = Usuario
        fields = ['username', 'password', 'confirm_password', 'email', 'rol', 'nombre', 'apellido']
    
    #Validamos que ambas contrasenias ingresadas en el registro coincidan (contrasenia y validarContrasenia)
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return data
    
    #Si todo esta en orden
    def create(self, validated_data):
        # Verifica que no haya usuarios con el mismo username o email
        if Usuario.objects.filter(username=validated_data['username']).exists():
            raise serializers.ValidationError({"username": "Este usuario ya existe"})
        if Usuario.objects.filter(email=validated_data['email']).exists():
            raise serializers.ValidationError({"email": "Este email ya está registrado"})
        
        #nos deshacemos de los datos que no usaremos para continuar
        #guardamos en una variable los nombres para usarlos despues
        validated_data.pop('confirm_password')
        nombre = validated_data.pop('nombre', '')
        apellido = validated_data.pop('apellido', '')
        
        #Creamos el usuario a partir de un metodo especial de Django
        #Asignamos todos los campos del registro a un campo de la tabla bdd
        #este metodo ENCRIPTA LA CONTRASENIA DE MANERA AUTOMATICA
        user = Usuario.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            rol=validated_data['rol'],
            first_name=nombre,
            last_name=apellido
        )
        
        # Crear perfil específico según el rol
        #Si el nombre o apellido esta vacio, usa el username como seguridad
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
    
#Ahora definimos el serializer para el login, heredada de Serializer unicamente
#Solo valida, por lo cual servirá unicamente para autenticacion
class LoginSerializer(serializers.Serializer):
    #definimos los unicos dos campos a usar 
    username = serializers.CharField()
    password = serializers.CharField()

    #comenzamos con la validacion
    def validate(self, data):
        #Tomamos el nombre y contrasenia del user en texto plano
        #Busca en la bdd el usuario y compara el HASH de la contrasenia encriptada, no el texto en si
        user = authenticate(username=data['username'], password=data['password'])
        
        #Retornamos el objeto o el error correspondiente
        if not user:
            raise serializers.ValidationError("Credenciales inválidas")

        # Generar token
        #Genera Tokens JWT para el acceso del usuario, estos contienen informacion del user (id,username,etc)
        #Estudiar diferencias entre Token de Acceso y de Refresh
        #son firmados digitalmente para prevenir modificaciones
        refresh = RefreshToken.for_user(user)

        #Retornamos el token JWT como json del acceso 
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
        fields = '__all__'

class RespuestaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Respuesta
        fields = '__all__'

class ExamenAlumnoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamenAlumno
        fields = '__all__'

class RespuestaAlumnoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RespuestaAlumno
        fields = '__all__'
