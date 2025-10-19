from rest_framework import viewsets
from .models import *
from .serializers import *
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes 
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Q
from datetime import date

# ====== ENDPOINTS PÚBLICOS (Sin autenticación) ======

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

@api_view(['POST'])
@permission_classes([AllowAny]) 
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        return Response(serializer.validated_data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ====== ENDPOINTS PROTEGIDOS (Requieren autenticación) ======

class EvaluacionesAlumnoView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Obtener el alumno autenticado
            alumno = Alumno.objects.get(usuario=request.user)
            
            # Obtener TODOS los ExamenAlumno del alumno (exámenes realizados)
            examenes_alumno = ExamenAlumno.objects.filter(
                alumno=alumno
            ).select_related(
                'examen__profesor_curso__curso',
                'examen__profesor_curso__profesor'
            )
            
            # Obtener cursos del alumno
            cursos_inscritos = Inscripcion.objects.filter(
                alumno=alumno
            ).values_list('curso_id', flat=True)
            
            # Obtener exámenes ACTIVOS (de sus cursos y que no haya realizado)
            examenes_activos = Examen.objects.filter(
                profesor_curso__curso_id__in=cursos_inscritos
            ).exclude(
                examenalumno__alumno=alumno  # Excluir los que ya tienen registro
            ).select_related(
                'profesor_curso__curso',
                'profesor_curso__profesor'
            )
            
            # Construir respuesta combinando ambos
            evaluaciones_data = []
            
            # 1. Agregar exámenes ACTIVOS (sin registro en ExamenAlumno)
            for examen in examenes_activos:
                # Verificar si la fecha límite ya pasó
                hoy = date.today()
                esta_vencido = examen.fecha_limite and examen.fecha_limite < hoy
                
                if not esta_vencido:  # Solo mostrar activos si no están vencidos
                    evaluaciones_data.append({
                        'id_examen': examen.id,  # ✅ CAMBIO: id_examen en lugar de id
                        'id_examen_alumno': None,  # ✅ CAMBIO: None explícito
                        'titulo': examen.titulo,
                        'descripcion': examen.descripcion,
                        'materia': examen.profesor_curso.curso.nombre,
                        'docente': examen.profesor_curso.profesor.nombre,
                        'fecha_limite': examen.fecha_limite,
                        'estado': 'activo',
                        'calificacion': None,
                        'fecha_creacion': examen.fecha_creacion,
                        'fecha_realizacion': None,  # ✅ CAMBIO: None explícito
                        'retroalimentacion': ''  # ✅ CAMBIO: string vacío
                    })
            
            # 2. Agregar exámenes con registro en ExamenAlumno
            for ea in examenes_alumno:
                # ✅ LÓGICA CORREGIDA: Verificar tanto fecha_realizacion como calificacion_final
                if ea.calificacion_final is not None:
                    estado = 'corregido'
                elif ea.fecha_realizacion is not None:
                    estado = 'pendiente'
                else:
                    estado = 'activo'  # ✅ NUEVO: Examen asignado pero no iniciado
                
                evaluaciones_data.append({
                    'id_examen': ea.examen.id,  # ✅ CAMBIO: id_examen
                    'id_examen_alumno': ea.id,  # ✅ CAMBIO: id_examen_alumno
                    'titulo': ea.examen.titulo,
                    'descripcion': ea.examen.descripcion,
                    'materia': ea.examen.profesor_curso.curso.nombre,
                    'docente': ea.examen.profesor_curso.profesor.nombre,
                    'fecha_limite': ea.examen.fecha_limite,
                    'estado': estado,
                    'calificacion': float(ea.calificacion_final) if ea.calificacion_final else None,
                    'fecha_creacion': ea.examen.fecha_creacion,
                    'fecha_realizacion': ea.fecha_realizacion,
                    'retroalimentacion': ea.retroalimentacion
                })
            
            return Response(evaluaciones_data)
            
        except Alumno.DoesNotExist:
            return Response(
                {'error': 'Usuario no es un alumno'}, 
                status=status.HTTP_403_FORBIDDEN
            )

# Vista para obtener detalles de un examen específico con preguntas
class ExamenDetalleView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, examen_id):
        try:
            alumno = Alumno.objects.get(usuario=request.user)
            examen = Examen.objects.get(id=examen_id)
            
            # Verificar que el alumno tiene acceso a este examen
            cursos_inscritos = Inscripcion.objects.filter(
                alumno=alumno
            ).values_list('curso_id', flat=True)
            
            if examen.profesor_curso.curso_id not in cursos_inscritos:
                return Response(
                    {'error': 'No tienes acceso a este examen'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Obtener preguntas del examen
            preguntas = Pregunta.objects.filter(examen=examen)
            preguntas_data = PreguntaSerializer(preguntas, many=True).data
            
            # Verificar si ya existe ExamenAlumno
            examen_alumno = ExamenAlumno.objects.filter(
                alumno=alumno, examen=examen
            ).first()
            
            return Response({
                'examen': ExamenSerializer(examen).data,
                'preguntas': preguntas_data,
                'examen_alumno_id': examen_alumno.id if examen_alumno else None,
                'estado': 'corregido' if examen_alumno and examen_alumno.calificacion_final else 
                         'pendiente' if examen_alumno else 'activo'
            })
            
        except Examen.DoesNotExist:
            return Response(
                {'error': 'Examen no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )

# ====== NUEVA VISTA PARA MATERIAS DEL ALUMNO ======

class MateriasAlumnoView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Obtener el alumno autenticado
            alumno = Alumno.objects.get(usuario=request.user)
            
            # Obtener cursos del alumno
            inscripciones = Inscripcion.objects.filter(
                alumno=alumno
            ).select_related('curso')
            
            # Obtener exámenes activos para cada curso
            cursos_data = []
            for inscripcion in inscripciones:
                curso = inscripcion.curso
                
                # Verificar si tiene exámenes activos
                tiene_evaluaciones_activas = Examen.objects.filter(
                    profesor_curso__curso=curso,
                    fecha_limite__gte=date.today()
                ).exclude(
                    examenalumno__alumno=alumno  # Excluir los que ya realizó
                ).exists()
                
                # Obtener profesor del curso
                profesor_curso = ProfesorCurso.objects.filter(
                    curso=curso
                ).select_related('profesor').first()
                
                cursos_data.append({
                    'id': curso.id,
                    'nombre': curso.nombre,
                    'codigo': f"{curso.nombre[:3].upper()}001",  # Código generado
                    'docente': profesor_curso.profesor.nombre if profesor_curso else 'Sin docente asignado',
                    'aula': 'Aula 204',  # Puedes agregar este campo a tu modelo Curso
                    'turno': 'mañana',   # Puedes agregar este campo a tu modelo Curso
                    'tieneEvaluacionesActivas': tiene_evaluaciones_activas
                })
            
            return Response(cursos_data)
            
        except Alumno.DoesNotExist:
            return Response(
                {'error': 'Usuario no es un alumno'}, 
                status=status.HTTP_403_FORBIDDEN
            )

# ====== VISTAS PARA COMPONENTES DINÁMICOS ======

class ExamenEnvioView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, examen_id):
        try:
            alumno = Alumno.objects.get(usuario=request.user)
            examen_alumno = ExamenAlumno.objects.get(
                alumno=alumno, 
                examen_id=examen_id
            )
            
            # Obtener respuestas del alumno
            respuestas = RespuestaAlumno.objects.filter(
                examen_alumno=examen_alumno
            ).select_related('pregunta')
            
            respuestas_data = []
            for respuesta in respuestas:
                respuestas_data.append({
                    'id': respuesta.pregunta.id,
                    'enunciado': respuesta.pregunta.enunciado,
                    'tipo': respuesta.pregunta.tipo,
                    'respuesta': respuesta.respuesta,
                    'puntaje_obtenido': float(respuesta.puntaje_obtenido) if respuesta.puntaje_obtenido else None
                })
            
            return Response({
                'examen': {
                    'id': examen_alumno.examen.id,
                    'titulo': examen_alumno.examen.titulo
                },
                'materia': examen_alumno.examen.profesor_curso.curso.nombre,
                'docente': examen_alumno.examen.profesor_curso.profesor.nombre,
                'fecha_realizacion': examen_alumno.fecha_realizacion,
                'estado': 'pendiente' if examen_alumno.calificacion_final is None else 'corregido',
                'preguntas': respuestas_data
            })
            
        except ExamenAlumno.DoesNotExist:
            return Response(
                {'error': 'No se encontró el envío'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class ExamenResultadoView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, examen_id):
        try:
            alumno = Alumno.objects.get(usuario=request.user)
            examen_alumno = ExamenAlumno.objects.get(
                alumno=alumno, 
                examen_id=examen_id,
                calificacion_final__isnull=False  # Solo exámenes corregidos
            )
            
            # Obtener respuestas con retroalimentación
            respuestas = RespuestaAlumno.objects.filter(
                examen_alumno=examen_alumno
            ).select_related('pregunta')
            
            preguntas_data = []
            for respuesta in respuestas:
                # Determinar estado según puntaje
                puntaje_obtenido = float(respuesta.puntaje_obtenido) if respuesta.puntaje_obtenido else 0
                puntaje_maximo = float(respuesta.pregunta.puntaje)
                
                if puntaje_obtenido >= puntaje_maximo:
                    estado = 'correct'
                elif puntaje_obtenido > 0:
                    estado = 'partial'
                else:
                    estado = 'incorrect'
                
                preguntas_data.append({
                    'id': respuesta.pregunta.id,
                    'tipo': respuesta.pregunta.tipo,
                    'enunciado': respuesta.pregunta.enunciado,
                    'respuesta_alumno': respuesta.respuesta,
                    'puntaje_obtenido': puntaje_obtenido,
                    'puntaje_maximo': puntaje_maximo,
                    'estado': estado,
                    'retroalimentacion': f"Retroalimentación para: {respuesta.pregunta.enunciado[:50]}..." if respuesta.pregunta.enunciado else "Sin retroalimentación específica"
                })
            
            # Calcular puntaje máximo total
            puntaje_maximo_total = sum([p['puntaje_maximo'] for p in preguntas_data])
            
            return Response({
                'id': examen_alumno.examen.id,
                'titulo': examen_alumno.examen.titulo,
                'materia': examen_alumno.examen.profesor_curso.curso.nombre,
                'docente': examen_alumno.examen.profesor_curso.profesor.nombre,
                'fecha_correccion': examen_alumno.fecha_realizacion,
                'tiempo_resolucion': '45 minutos',  # Podrías agregar este campo al modelo
                'calificacion_final': float(examen_alumno.calificacion_final),
                'puntaje_maximo': puntaje_maximo_total,
                'estado': 'corregido',
                'preguntas': preguntas_data
            })
            
        except ExamenAlumno.DoesNotExist:
            return Response(
                {'error': 'No se encontraron resultados'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class ExamenRetroalimentacionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, examen_id):
        try:
            alumno = Alumno.objects.get(usuario=request.user)
            examen_alumno = ExamenAlumno.objects.get(
                alumno=alumno, 
                examen_id=examen_id,
                calificacion_final__isnull=False
            )
            
            # Obtener respuestas con retroalimentación detallada
            respuestas = RespuestaAlumno.objects.filter(
                examen_alumno=examen_alumno
            ).select_related('pregunta')
            
            preguntas_data = []
            for respuesta in respuestas:
                puntaje_obtenido = float(respuesta.puntaje_obtenido) if respuesta.puntaje_obtenido else 0
                puntaje_maximo = float(respuesta.pregunta.puntaje)
                
                if puntaje_obtenido >= puntaje_maximo:
                    score_type = 'full'
                elif puntaje_obtenido > 0:
                    score_type = 'partial'
                else:
                    score_type = 'none'
                
                preguntas_data.append({
                    'id': respuesta.pregunta.id,
                    'enunciado': respuesta.pregunta.enunciado,
                    'respuesta_alumno': respuesta.respuesta,
                    'retroalimentacion': self.generar_retroalimentacion(respuesta.pregunta.enunciado, puntaje_obtenido, puntaje_maximo),
                    'score_type': score_type,
                    'puntaje_obtenido': puntaje_obtenido,
                    'puntaje_maximo': puntaje_maximo
                })
            
            return Response({
                'titulo': examen_alumno.examen.titulo,
                'preguntas': preguntas_data
            })
            
        except ExamenAlumno.DoesNotExist:
            return Response(
                {'error': 'No se encontró retroalimentación'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def generar_retroalimentacion(self, enunciado, puntaje_obtenido, puntaje_maximo):
        """Genera retroalimentación basada en el puntaje obtenido"""
        if puntaje_obtenido >= puntaje_maximo:
            return f"¡Excelente! Respuesta correcta para: {enunciado[:50]}... Demuestra buen entendimiento del tema."
        elif puntaje_obtenido > 0:
            return f"Respuesta parcialmente correcta para: {enunciado[:50]}... Revisa los conceptos para mejorar."
        else:
            return f"Respuesta incorrecta para: {enunciado[:50]}... Recomiendo repasar el material sobre este tema."

# ====== VIEWSETS EXISTENTES ======

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

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