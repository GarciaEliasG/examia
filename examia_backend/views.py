# views.py (COMPLETO CORREGIDO)
from rest_framework import viewsets
from .models import *
from .serializers import *
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes 
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Q, Count
from datetime import date, datetime
from django.utils import timezone
import json
import threading


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
    #permission_classes = [IsAuthenticated]
    permission_classes=[AllowAny]
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
                examenalumno__alumno=alumno
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
                
                if not esta_vencido:
                    evaluaciones_data.append({
                        'id': None,  # ✅ CORREGIDO: No tiene ID de ExamenAlumno aún
                        'id_examen': examen.id,
                        'titulo': examen.titulo,
                        'descripcion': examen.descripcion,
                        'materia': examen.profesor_curso.curso.nombre,
                        'docente': examen.profesor_curso.profesor.nombre,
                        'fecha_limite': examen.fecha_limite,
                        'estado': 'activo',
                        'calificacion': None,
                        'fecha_creacion': examen.fecha_creacion,
                        'fecha_realizacion': None,
                        'retroalimentacion': ''
                    })
            
            # 2. Agregar exámenes con registro en ExamenAlumno
            for ea in examenes_alumno:
                if ea.calificacion_final is not None:
                    estado = 'corregido'
                elif ea.fecha_realizacion is not None:
                    estado = 'pendiente'
                else:
                    estado = 'activo'
                
                evaluaciones_data.append({
                    'id': ea.id,  # ✅ CORREGIDO: Usar 'id' directamente
                    'id_examen': ea.examen.id,
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

class ExamenDetalleView(APIView):
    #permission_classes = [IsAuthenticated]
    permission_classes=[AllowAny]
    
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
                'examen_alumno_id': examen_alumno.id if examen_alumno else None,  # ✅ CORREGIDO
                'estado': 'corregido' if examen_alumno and examen_alumno.calificacion_final else 
                         'pendiente' if examen_alumno else 'activo'
            })
            
        except Examen.DoesNotExist:
            return Response(
                {'error': 'Examen no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )

# ====== NUEVOS ENDPOINTS PARA EL SERVICIO ANGULAR ======

class IniciarEvaluacionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, examen_id):
        try:
            alumno = Alumno.objects.get(usuario=request.user)
            examen = Examen.objects.get(id=examen_id)
            
            # Verificar acceso al examen
            cursos_inscritos = Inscripcion.objects.filter(
                alumno=alumno
            ).values_list('curso_id', flat=True)
            
            if examen.profesor_curso.curso_id not in cursos_inscritos:
                return Response(
                    {'error': 'No tienes acceso a este examen'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Crear o obtener ExamenAlumno
            examen_alumno, created = ExamenAlumno.objects.get_or_create(
                alumno=alumno,
                examen=examen,
                defaults={'fecha_inicio': datetime.now()}
            )
            
            # Si ya existe pero no tiene fecha_inicio, actualizar
            if not created and not examen_alumno.fecha_inicio:
                examen_alumno.fecha_inicio = datetime.now()
                examen_alumno.save()
            
            # Obtener preguntas del examen
            preguntas = Pregunta.objects.filter(examen=examen)
            preguntas_data = PreguntaSerializer(preguntas, many=True).data
            
            return Response({
                'examen_alumno_id': examen_alumno.id,  # ✅ CORREGIDO
                'preguntas': preguntas_data
            })
            
        except Examen.DoesNotExist:
            return Response(
                {'error': 'Examen no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class GuardarRespuestaView(APIView):
    permission_classes = [AllowAny]  # ← Temporal sin auth
    
    def post(self, request):  
        try:
            alumno = Alumno.objects.get(usuario=request.user)
            data = request.data
            
            # Validar campos requeridos
            required_fields = ['examen_alumno_id', 'pregunta_id', 'respuesta']
            for field in required_fields:
                if field not in data:
                    return Response(
                        {'error': f'Campo requerido: {field}'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Obtener examen_alumno
            examen_alumno = ExamenAlumno.objects.get(
                id=data['examen_alumno_id'],
                alumno=alumno
            )
            
            # Obtener pregunta
            pregunta = Pregunta.objects.get(
                id=data['pregunta_id'],
                examen=examen_alumno.examen
            )
            
            # Crear o actualizar respuesta
            respuesta_alumno, created = RespuestaAlumno.objects.update_or_create(
                examen_alumno=examen_alumno,
                pregunta=pregunta,
                defaults={
                    'respuesta': data['respuesta'],
                    'fecha_respuesta': datetime.now()
                }
            )
            
            serializer = RespuestaAlumnoSerializer(respuesta_alumno)
            return Response(serializer.data)
            
        except Exception as e:
            print(f"💥 ERROR: {e}")
            return Response({'error': str(e)}, status=500)

class FinalizarEvaluacionView(APIView):
    #permission_classes = [IsAuthenticated]
    permission_classes=[AllowAny]

    def post(self, request, examen_alumno_id):
        try:
            alumno = Alumno.objects.get(usuario=request.user)
            
            # Verificar que el ExamenAlumno pertenece al alumno
            examen_alumno = ExamenAlumno.objects.get(
                id=examen_alumno_id,
                alumno=alumno
            )
            
            # ✅ AGREGAR LOGS AQUÍ PARA DIAGNOSTICAR
            print(f"🔍 DEBUG FINALIZAR EVALUACIÓN:")
            print(f"   📋 ExamenAlumno ID: {examen_alumno.id}")
            print(f"   🕒 ANTES - fecha_realizacion: {examen_alumno.fecha_realizacion}")
            print(f"   📝 ANTES - estado: {examen_alumno.estado}")
            print(f"   📊 ANTES - calificacion_final: {examen_alumno.calificacion_final}")
            
            # Verificar que no esté ya finalizado
            if examen_alumno.fecha_realizacion:
                print(f"   ⚠️  Este examen YA estaba finalizado el: {examen_alumno.fecha_realizacion}")
                return Response(
                    {'error': 'Este examen ya fue finalizado'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 1. Actualizar fecha de realización
            examen_alumno.fecha_realizacion = datetime.now()
            examen_alumno.estado = 'finalizado'
            examen_alumno.save()
            
            # ✅ AGREGAR LOGS DESPUÉS DE GUARDAR
            print(f"   💾 DESPUÉS DE GUARDAR:")
            print(f"   🕒 fecha_realizacion: {examen_alumno.fecha_realizacion}")
            print(f"   📝 estado: {examen_alumno.estado}")
            
            # Recargar el objeto desde la base de datos para verificar
            examen_alumno_refreshed = ExamenAlumno.objects.get(id=examen_alumno_id)
            print(f"   🔄 DESPUÉS DE RECARGAR DE BD:")
            print(f"   🕒 fecha_realizacion: {examen_alumno_refreshed.fecha_realizacion}")
            print(f"   📝 estado: {examen_alumno_refreshed.estado}")
            
            # 2. ✅ Iniciar corrección automática en segundo plano
            self.iniciar_correccion_automatica(examen_alumno_id)
            
            serializer = ExamenAlumnoSerializer(examen_alumno)
            return Response({
                **serializer.data,
                'mensaje': 'Evaluación finalizada. La corrección automática está en proceso.'
            })
            
        except ExamenAlumno.DoesNotExist:
            print(f"   ❌ ERROR: ExamenAlumno {examen_alumno_id} no encontrado")
            return Response(
                {'error': 'Examen no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"   💥 ERROR INESPERADO: {str(e)}")
            return Response(
                {'error': f'Error interno: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def iniciar_correccion_automatica(self, examen_alumno_id):
        """Inicia corrección en segundo plano sin bloquear la respuesta"""
        from .ia_correccion_service import iniciar_correccion_automatica_async
        print(f"   🤖 Iniciando corrección automática para examen {examen_alumno_id}")
        iniciar_correccion_automatica_async(examen_alumno_id)

# ====== NUEVO ENDPOINT PARA CORRECCIÓN AUTOMÁTICA ======

class CorregirEvaluacionAutoView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, examen_alumno_id):
        try:
            # Verificar permisos (solo profesores pueden forzar corrección)
            if not hasattr(request.user, 'profesor'):
                return Response(
                    {'error': 'No autorizado para corregir evaluaciones'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Llamar al servicio de IA
            from .ia_correccion_service import IACorreccionService
            correccion_service = IACorreccionService()
            resultado = correccion_service.corregir_evaluacion_completa(examen_alumno_id)
            
            if resultado['success']:
                return Response({
                    'message': 'Evaluación corregida automáticamente por IA',
                    'calificacion_final': resultado['calificacion_final'],
                    'puntaje_total': resultado['puntaje_total'],
                    'puntaje_maximo': resultado['puntaje_maximo'],
                    'preguntas_corregidas': resultado['preguntas_corregidas']
                })
            else:
                return Response(
                    {'error': f"Error en corrección automática: {resultado['error']}"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except ExamenAlumno.DoesNotExist:
            return Response(
                {'error': 'Evaluación no encontrada'}, 
                status=status.HTTP_404_NOT_FOUND
            )

# ====== VISTAS EXISTENTES ADAPTADAS ======

class MateriasAlumnoView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            alumno = Alumno.objects.get(usuario=request.user)
            
            inscripciones = Inscripcion.objects.filter(
                alumno=alumno
            ).select_related('curso')
            
            cursos_data = []
            for inscripcion in inscripciones:
                curso = inscripcion.curso
                
                tiene_evaluaciones_activas = Examen.objects.filter(
                    profesor_curso__curso=curso,
                    fecha_limite__gte=date.today()
                ).exclude(
                    examenalumno__alumno=alumno
                ).exists()
                
                profesor_curso = ProfesorCurso.objects.filter(
                    curso=curso
                ).select_related('profesor').first()
                
                cursos_data.append({
                    'id': curso.id,
                    'nombre': curso.nombre,
                    'codigo': f"{curso.nombre[:3].upper()}001",
                    'docente': profesor_curso.profesor.nombre if profesor_curso else 'Sin docente asignado',
                    'aula': 'Aula 204',
                    'turno': 'mañana',
                    'tieneEvaluacionesActivas': tiene_evaluaciones_activas
                })
            
            return Response(cursos_data)
            
        except Alumno.DoesNotExist:
            return Response(
                {'error': 'Usuario no es un alumno'}, 
                status=status.HTTP_403_FORBIDDEN
            )

class ExamenEnvioView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, examen_alumno_id):
        try:
            alumno = Alumno.objects.get(usuario=request.user)
            examen_alumno = ExamenAlumno.objects.get(
                id=examen_alumno_id,  # ✅ CORREGIDO
                alumno=alumno
            )
            
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
                'respuestas': respuestas_data
            })
            
        except ExamenAlumno.DoesNotExist:
            return Response(
                {'error': 'No se encontró el envío'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class ExamenResultadoView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, examen_alumno_id):
        try:
            alumno = Alumno.objects.get(usuario=request.user)
            examen_alumno = ExamenAlumno.objects.get(
                id=examen_alumno_id,
                alumno=alumno,
                calificacion_final__isnull=False
            )
            
            respuestas = RespuestaAlumno.objects.filter(
                examen_alumno=examen_alumno
            ).select_related('pregunta')
            
            preguntas_data = []
            for respuesta in respuestas:
                puntaje_obtenido = float(respuesta.puntaje_obtenido) if respuesta.puntaje_obtenido else 0
                puntaje_maximo = float(respuesta.pregunta.puntaje)
                
                if puntaje_obtenido >= puntaje_maximo:
                    estado = 'correct'
                elif puntaje_obtenido > 0:
                    estado = 'partial'
                else:
                    estado = 'incorrect'
                
                # ✅ CORREGIDO: Usar el campo correcto
                preguntas_data.append({
                    'id': respuesta.pregunta.id,
                    'tipo': respuesta.pregunta.tipo,
                    'enunciado': respuesta.pregunta.enunciado,
                    'respuesta_alumno': respuesta.respuesta,
                    'puntaje_obtenido': puntaje_obtenido,
                    'puntaje_maximo': puntaje_maximo,
                    'estado': estado,
                    'retroalimentacion': getattr(respuesta, 'retroalimentacion', '') or f"Retroalimentación para: {respuesta.pregunta.enunciado[:50]}..."
                })
            
            puntaje_maximo_total = sum([p['puntaje_maximo'] for p in preguntas_data])
            
            return Response({
                'id': examen_alumno.id,
                'titulo': examen_alumno.examen.titulo,
                'materia': examen_alumno.examen.profesor_curso.curso.nombre,
                'docente': examen_alumno.examen.profesor_curso.profesor.nombre,
                'fecha_correccion': examen_alumno.fecha_realizacion,
                'tiempo_resolucion': '45 minutos',
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
    
    def get(self, request, examen_alumno_id):
        try:
            alumno = Alumno.objects.get(usuario=request.user)
            examen_alumno = ExamenAlumno.objects.get(
                id=examen_alumno_id,
                alumno=alumno,
                calificacion_final__isnull=False
            )
            
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
                    'tipo': respuesta.pregunta.tipo,
                    'respuesta_alumno': respuesta.respuesta,
                    'retroalimentacion': respuesta.retroalimentacion or self.generar_retroalimentacion(respuesta.pregunta.enunciado, puntaje_obtenido, puntaje_maximo),
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
        if puntaje_obtenido >= puntaje_maximo:
            return f"¡Excelente! Respuesta correcta para: {enunciado[:50]}... Demuestra buen entendimiento del tema."
        elif puntaje_obtenido > 0:
            return f"Respuesta parcialmente correcta para: {enunciado[:50]}... Revisa los conceptos para mejorar."
        else:
            return f"Respuesta incorrecta para: {enunciado[:50]}... Recomiendo repasar el material sobre este tema."


# Agregar estas views a tu views.py existente

class PanelDocenteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # 1. Verificar que el usuario es profesor
            if not hasattr(request.user, 'profesor'):
                return Response(
                    {'error': 'Usuario no es un profesor'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            profesor = request.user.profesor
            
            print(f"🔍 Cargando panel para profesor: {profesor.nombre}")
            
            # 2. Obtener cursos a través de ProfesorCurso
            profesor_cursos = ProfesorCurso.objects.filter(profesor=profesor)
            cursos_ids = profesor_cursos.values_list('curso_id', flat=True)
            
            print(f"📚 IDs de cursos encontrados: {list(cursos_ids)}")
            
            # 3. Obtener cursos con estadísticas (CORREGIDO)
            cursos = Curso.objects.filter(id__in=cursos_ids).annotate(
                cantidad_alumnos=Count('inscripcion', distinct=True)
            )
            
            # 4. Contar exámenes por separado (CORREGIDO)
            for curso in cursos:
                # Contar exámenes a través de ProfesorCurso
                curso.cantidad_examenes = Examen.objects.filter(
                    profesor_curso__curso=curso,
                    profesor_curso__profesor=profesor
                ).count()
            
            print(f"📊 Cursos procesados: {cursos.count()}")
            
            # 5. Obtener exámenes del profesor
            examenes = Examen.objects.filter(profesor_curso__profesor=profesor)
            print(f"📝 Exámenes encontrados: {examenes.count()}")
            
            # 6. Obtener evaluaciones pendientes de corrección
            pendientes_correccion = ExamenAlumno.objects.filter(
                examen__profesor_curso__profesor=profesor,
                calificacion_final__isnull=True,
                fecha_realizacion__isnull=False
            ).count()
            
            print(f"⏳ Pendientes de corrección: {pendientes_correccion}")
            
            # 7. Calcular total de alumnos únicos
            total_alumnos = Inscripcion.objects.filter(
                curso_id__in=cursos_ids
            ).values('alumno').distinct().count()
            
            print(f"👥 Total alumnos únicos: {total_alumnos}")
            
            # 8. Preparar respuesta
            response_data = {
                'docente': {
                    'id': profesor.id,
                    'nombre': profesor.nombre,
                    'email': profesor.email
                },
                'estadisticas': {
                    'totalCursos': cursos.count(),
                    'totalExamenes': examenes.count(),
                    'totalAlumnos': total_alumnos,
                    'pendientesCorreccion': pendientes_correccion
                },
                'cursosRecientes': [
                    {
                        'id': curso.id,
                        'nombre': curso.nombre,
                        'descripcion': curso.descripcion,
                        'cantidad_alumnos': curso.cantidad_alumnos,
                        'cantidad_examenes': curso.cantidad_examenes
                    }
                    for curso in cursos[:5]
                ]
            }
            
            print(f"✅ Datos preparados para respuesta")
            return Response(response_data)
            
        except Exception as e:
            print(f"❌ ERROR en PanelDocenteView: {str(e)}")
            import traceback
            print(f"🔍 Traceback: {traceback.format_exc()}")
            
            return Response(
                {'error': f'Error interno del servidor: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CursosDocenteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Verificar que es profesor
            if not hasattr(request.user, 'profesor'):
                return Response(
                    {'error': 'Usuario no es un profesor'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            profesor = request.user.profesor
            
            # Obtener cursos a través de ProfesorCurso
            profesor_cursos = ProfesorCurso.objects.filter(profesor=profesor)
            cursos_ids = profesor_cursos.values_list('curso_id', flat=True)
            
            # Obtener cursos con estadísticas (CORREGIDO)
            cursos = Curso.objects.filter(id__in=cursos_ids).annotate(
                cantidad_alumnos=Count('inscripcion', distinct=True)
            )
            
            # Agregar cantidad de exámenes manualmente (CORREGIDO)
            cursos_data = []
            for curso in cursos:
                # Contar exámenes a través de ProfesorCurso
                cantidad_examenes = Examen.objects.filter(
                    profesor_curso__curso=curso,
                    profesor_curso__profesor=profesor
                ).count()
                
                # Obtener el profesor específico para este curso
                profesor_curso = profesor_cursos.filter(curso=curso).first()
                
                cursos_data.append({
                    'id': curso.id,
                    'nombre': curso.nombre,
                    'descripcion': curso.descripcion,
                    'codigo': f"{curso.nombre[:3].upper()}001",
                    'codigo_acceso': curso.codigo_acceso,
                    'cantidad_alumnos': curso.cantidad_alumnos,
                    'cantidad_examenes': cantidad_examenes,
                    'estado': 'activo',
                    'profesor_titular': profesor_curso.rol if profesor_curso else 'Titular'
                })
            
            return Response(cursos_data)
            
        except Exception as e:
            print(f"❌ ERROR en CursosDocenteView: {str(e)}")
            return Response(
                {'error': f'Error interno: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CrearCursoView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            profesor = Profesor.objects.get(usuario=request.user)
            
            nombre = request.data.get('nombre')
            descripcion = request.data.get('descripcion', '')
            
            if not nombre:
                return Response(
                    {'error': 'El nombre del curso es requerido'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # ✅ CORRECCIÓN: Crear el curso y FORZAR la generación del código
            curso = Curso(
                nombre=nombre,
                descripcion=descripcion
            )
            
            # ✅ FORZAR la generación del código si no existe
            if not curso.codigo_acceso:
                import random
                import string
                curso.codigo_acceso = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            
            # ✅ GUARDAR el curso primero
            curso.save()
            
            # ✅ LUEGO crear la relación con el profesor
            ProfesorCurso.objects.create(
                curso=curso,
                profesor=profesor,
                rol='Titular'
            )
            
            # ✅ VERIFICAR que el código se generó
            print(f"🔑 Código generado: {curso.codigo_acceso}")
            
            return Response({
                'message': 'Curso creado exitosamente',
                'curso': {
                    'id': curso.id,
                    'nombre': curso.nombre,
                    'descripcion': curso.descripcion,
                    'codigo_acceso': curso.codigo_acceso,  # ✅ ESTO DEBERÍA FUNCIONAR AHORA
                    'codigo': f"{curso.nombre[:3].upper()}001",
                    'cantidad_alumnos': 0,
                    'cantidad_examenes': 0,
                    'estado': 'activo',
                    'profesor_titular': 'Titular'
                }
            }, status=status.HTTP_201_CREATED)
            
        except Profesor.DoesNotExist:
            return Response(
                {'error': 'Usuario no es un profesor'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            print(f"❌ Error creando curso: {str(e)}")
            return Response(
                {'error': f'Error interno: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ExamenesDocenteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Verificar que es profesor
            if not hasattr(request.user, 'profesor'):
                return Response(
                    {'error': 'Usuario no es un profesor'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            profesor = request.user.profesor
            
            examenes = Examen.objects.filter(
                profesor_curso__profesor=profesor
            ).select_related(
                'profesor_curso__curso'
            ).prefetch_related('preguntas')
            
            examenes_data = []
            for examen in examenes:
                # Contar entregas y pendientes de corrección
                entregas_totales = ExamenAlumno.objects.filter(examen=examen).count()
                pendientes_correccion = ExamenAlumno.objects.filter(
                    examen=examen,
                    calificacion_final__isnull=True,
                    fecha_realizacion__isnull=False
                ).count()
                
                examenes_data.append({
                    'id': examen.id,
                    'titulo': examen.titulo,
                    'descripcion': examen.descripcion,
                    'curso': examen.profesor_curso.curso.nombre,
                    'curso_id': examen.profesor_curso.curso.id,
                    'fecha_creacion': examen.fecha_creacion,
                    'fecha_limite': examen.fecha_limite,
                    'cantidad_preguntas': examen.preguntas.count(),
                    'entregas_totales': entregas_totales,
                    'pendientes_correccion': pendientes_correccion,
                    'estado': 'activo' if not examen.fecha_limite or examen.fecha_limite >= date.today() else 'vencido'
                })
            
            return Response(examenes_data)
            
        except Exception as e:
            print(f"❌ ERROR en ExamenesDocenteView: {str(e)}")
            return Response(
                {'error': f'Error interno: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CrearExamenView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # 1. Verificar que es profesor
            if not hasattr(request.user, 'profesor'):
                return Response(
                    {'error': 'Usuario no es un profesor'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            profesor = request.user.profesor
            data = request.data
            
            # 2. Validar datos requeridos
            required_fields = ['titulo', 'curso_id']
            for field in required_fields:
                if field not in data:
                    return Response(
                        {'error': f'Campo requerido: {field}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # 3. Obtener o crear ProfesorCurso
            curso_id = data['curso_id']
            profesor_curso, created = ProfesorCurso.objects.get_or_create(
                curso_id=curso_id,
                profesor=profesor,
                defaults={'rol': 'Titular'}
            )
            
            # 4. PROCESAR FECHA - CORRECCIÓN AQUÍ
            fecha_limite = data.get('fecha_limite')
            if fecha_limite:
                # Convertir de "2025-10-23T00:00" a "2025-10-23"
                try:
                    from datetime import datetime
                    fecha_obj = datetime.fromisoformat(fecha_limite.replace('Z', '+00:00'))
                    fecha_limite = fecha_obj.date()  # Extraer solo la fecha
                except (ValueError, AttributeError) as e:
                    print(f"⚠️ Error parseando fecha: {fecha_limite}, error: {e}")
                    fecha_limite = None
            
            # 5. Crear el examen
            examen = Examen.objects.create(
                profesor_curso=profesor_curso,
                titulo=data['titulo'],
                descripcion=data.get('descripcion', ''),
                fecha_limite=fecha_limite  # Usar fecha procesada
            )
            
            # 6. Crear preguntas
            preguntas_data = data.get('preguntas', [])
            for pregunta_data in preguntas_data:
                Pregunta.objects.create(
                    examen=examen,
                    enunciado=pregunta_data['enunciado'],
                    tipo=pregunta_data['tipo'],
                    puntaje=pregunta_data['puntaje'],
                    opciones=pregunta_data.get('opciones', []),
                    orden=pregunta_data.get('orden', 1)
                )
            
            serializer = ExamenSerializer(examen)
            return Response({
                'message': 'Evaluación creada exitosamente',
                'examen': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"❌ Error creando examen: {str(e)}")
            import traceback
            print(f"🔍 Traceback: {traceback.format_exc()}")
            return Response(
                {'error': f'Error interno: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ValidarCodigoView(APIView):
    permission_classes = []  # Permitir acceso sin autenticación inicial
    
    def post(self, request):
        try:
            codigo = request.data.get('codigo', '').strip().upper()
            
            if not codigo:
                return Response(
                    {'error': 'El código es requerido'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Buscar curso por código
            try:
                curso = Curso.objects.get(codigo_acceso=codigo)  # ✅ AHORA SÍ FUNCIONA
            except Curso.DoesNotExist:
                return Response(
                    {'error': 'Código inválido. Verificá el código e intentá nuevamente.'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Obtener alumno autenticado
            if not request.user.is_authenticated:
                return Response(
                    {'error': 'Debes iniciar sesión para unirte al curso'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            try:
                alumno = Alumno.objects.get(usuario=request.user)
            except Alumno.DoesNotExist:
                return Response(
                    {'error': 'Usuario no es un alumno'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Verificar si ya está inscrito
            if Inscripcion.objects.filter(alumno=alumno, curso=curso).exists():
                return Response(
                    {'error': 'Ya estás inscrito en este curso'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Crear inscripción
            inscripcion = Inscripcion.objects.create(
                alumno=alumno,
                curso=curso,
                fecha_inscripcion=timezone.now().date()
            )
            
            return Response({
                'success': True,
                'message': f'¡Te has unido exitosamente a {curso.nombre}!',
                'curso': {
                    'id': curso.id,
                    'nombre': curso.nombre,
                    'descripcion': curso.descripcion
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Error validando código: {str(e)}")
            return Response(
                {'error': 'Error interno del servidor'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ====== NUEVOS ENDPOINTS PARA EDICIÓN DE CORRECCIONES DOCENTE ======

class ExamenesCorregidosDocenteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Obtener lista de exámenes ya corregidos (por IA o manualmente) 
        que el docente puede editar
        """
        try:
            # Verificar que es profesor
            if not hasattr(request.user, 'profesor'):
                return Response(
                    {'error': 'Usuario no es un profesor'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            profesor = request.user.profesor
            
            # Obtener exámenes corregidos de los cursos del profesor
            examenes_corregidos = ExamenAlumno.objects.filter(
                examen__profesor_curso__profesor=profesor,
                calificacion_final__isnull=False  # Ya están corregidos
            ).select_related(
                'alumno',
                'examen',
                'examen__profesor_curso__curso'
            ).order_by('-fecha_realizacion')
            
            examenes_data = []
            for ea in examenes_corregidos:
                fecha_realizacion_str = None
                if ea.fecha_realizacion:
                    if hasattr(ea.fecha_realizacion, 'strftime'):
                        fecha_realizacion_str = ea.fecha_realizacion.strftime('%Y-%m-%dT%H:%M:%S')
                    else:
                        fecha_realizacion_str = str(ea.fecha_realizacion)
                
                # ✅ CORRECCIÓN MEJORADA: Lógica para determinar corrección
                corregido_por = 'IA'  # Por defecto
                
                # ✅ DETECTAR SI FUE EDITADO MANUALMENTE:
                # 1. Si la retroalimentación contiene "manual" o "editado manualmente"
                if ea.retroalimentacion and any(palabra in ea.retroalimentacion.lower() for palabra in ['manual', 'editado manualmente', 'docente']):
                    corregido_por = 'Manual'
                
                # 2. Si NO contiene "automática" y tiene contenido personalizado
                elif ea.retroalimentacion and 'automática' not in ea.retroalimentacion and len(ea.retroalimentacion.strip()) > 10:
                    corregido_por = 'Manual'
                
                # 3. Verificar si hay respuestas con retroalimentación específica (edición manual)
                try:
                    respuestas_con_retro = RespuestaAlumno.objects.filter(
                        examen_alumno=ea
                    ).exclude(retroalimentacion='').exclude(retroalimentacion__isnull=True)
                    
                    if respuestas_con_retro.exists():
                        # Si al menos una respuesta tiene retroalimentación no vacía, es manual
                        corregido_por = 'Manual'
                except Exception:
                    # Si hay error al verificar respuestas, mantener el valor actual
                    pass
                
                examenes_data.append({
                    'examen_alumno_id': ea.id,
                    'examen_id': ea.examen.id,
                    'titulo_examen': ea.examen.titulo,
                    'curso': ea.examen.profesor_curso.curso.nombre,
                    'curso_id': ea.examen.profesor_curso.curso.id,
                    'alumno_nombre': ea.alumno.nombre,
                    'alumno_id': ea.alumno.id,
                    'fecha_realizacion': fecha_realizacion_str,
                    'calificacion_final': float(ea.calificacion_final),
                    'estado': ea.estado,
                    'fecha_correccion': fecha_realizacion_str,
                    'corregido_por': corregido_por  # ✅ Ahora mostrará "Manual" cuando fue editado
                })
            
            serializer = ExamenCorregidoListSerializer(examenes_data, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            print(f"❌ ERROR en ExamenesCorregidosDocenteView: {str(e)}")
            import traceback
            print(f"🔍 Traceback completo: {traceback.format_exc()}")
            return Response(
                {'error': f'Error interno: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class DetalleCorreccionDocenteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, examen_alumno_id):
        """
        Obtener detalles completos de una corrección para editar
        """
        try:
            # Verificar que es profesor
            if not hasattr(request.user, 'profesor'):
                return Response(
                    {'error': 'Usuario no es un profesor'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            profesor = request.user.profesor
            
            # Obtener examen_alumno y verificar permisos
            examen_alumno = ExamenAlumno.objects.get(
                id=examen_alumno_id,
                examen__profesor_curso__profesor=profesor
            )
            
            # ✅ CORRECCIÓN: Formatear fecha correctamente
            fecha_realizacion_str = None
            if examen_alumno.fecha_realizacion:
                if hasattr(examen_alumno.fecha_realizacion, 'strftime'):
                    fecha_realizacion_str = examen_alumno.fecha_realizacion.strftime('%Y-%m-%dT%H:%M:%S')
                else:
                    fecha_realizacion_str = str(examen_alumno.fecha_realizacion)
            
            # Obtener respuestas del alumno con sus correcciones
            respuestas = RespuestaAlumno.objects.filter(
                examen_alumno=examen_alumno
            ).select_related('pregunta')
            
            preguntas_data = []
            for respuesta in respuestas:
                # ✅ CORRECCIÓN: Manejar campo retroalimentacion que puede no existir
                try:
                    retroalimentacion_actual = respuesta.retroalimentacion or ''
                except AttributeError:
                    retroalimentacion_actual = ''  # Campo no existe en BD
                
                preguntas_data.append({
                    'respuesta_id': respuesta.id,
                    'pregunta_id': respuesta.pregunta.id,
                    'enunciado': respuesta.pregunta.enunciado,
                    'tipo_pregunta': respuesta.pregunta.tipo,
                    'puntaje_maximo': float(respuesta.pregunta.puntaje),
                    'respuesta_alumno': respuesta.respuesta,
                    'puntaje_actual': float(respuesta.puntaje_obtenido) if respuesta.puntaje_obtenido else 0.0,
                    'retroalimentacion_actual': retroalimentacion_actual,
                    'orden': respuesta.pregunta.orden
                })
            
            # Ordenar por orden de pregunta
            preguntas_data.sort(key=lambda x: x['orden'])
            
            response_data = {
                'examen_alumno_id': examen_alumno.id,
                'examen_id': examen_alumno.examen.id,
                'titulo_examen': examen_alumno.examen.titulo,
                'curso': examen_alumno.examen.profesor_curso.curso.nombre,
                'alumno_nombre': examen_alumno.alumno.nombre,
                'alumno_id': examen_alumno.alumno.id,
                'fecha_realizacion': fecha_realizacion_str,
                'calificacion_actual': float(examen_alumno.calificacion_final) if examen_alumno.calificacion_final else 0.0,
                'retroalimentacion_general': examen_alumno.retroalimentacion or '',
                'preguntas': preguntas_data,
                'puntaje_total_actual': sum(p['puntaje_actual'] for p in preguntas_data),
                'puntaje_maximo_total': sum(p['puntaje_maximo'] for p in preguntas_data)
            }
            
            # Validar con serializer de LECTURA
            serializer = DetalleCorreccionSerializer(response_data)
            return Response(serializer.data)
            
        except ExamenAlumno.DoesNotExist:
            return Response(
                {'error': 'Corrección no encontrada o no tienes permisos'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"❌ ERROR en DetalleCorreccionDocenteView: {str(e)}")
            import traceback
            print(f"🔍 Traceback completo: {traceback.format_exc()}")
            return Response(
                {'error': f'Error interno: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ActualizarCorreccionDocenteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def put(self, request, examen_alumno_id):
        """
        Actualizar corrección manualmente (puntajes y retroalimentación)
        """
        try:
            # Verificar que es profesor
            if not hasattr(request.user, 'profesor'):
                return Response(
                    {'error': 'Usuario no es un profesor'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            profesor = request.user.profesor
            
            # ✅ DEBUG: Mostrar datos recibidos
            print("🔍 DATOS RECIBIDOS PARA ACTUALIZAR:")
            print(f"Examen Alumno ID: {examen_alumno_id}")
            print(f"Datos recibidos: {request.data}")
            
            # Obtener examen_alumno y verificar permisos
            examen_alumno = ExamenAlumno.objects.get(
                id=examen_alumno_id,
                examen__profesor_curso__profesor=profesor
            )

            # Validar datos con serializer CORREGIDO (WriteSerializer)
            serializer = ActualizarCorreccionSerializer(data=request.data)
            if not serializer.is_valid():
                print(f"❌ ERROR DE VALIDACIÓN: {serializer.errors}")
                return Response(
                    {'error': 'Datos inválidos', 'details': serializer.errors}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            data = serializer.validated_data
            print(f"✅ DATOS VALIDADOS: {data}")
            
            # Actualizar cada respuesta/pregunta
            puntaje_total = 0.0
            preguntas_actualizadas = 0
            
            for pregunta_data in data['preguntas']:
                try:
                    respuesta = RespuestaAlumno.objects.get(
                        id=pregunta_data['respuesta_id'],
                        examen_alumno=examen_alumno
                    )
                    
                    print(f"📝 Actualizando respuesta {respuesta.id}:")
                    print(f"   Puntaje anterior: {respuesta.puntaje_obtenido}")
                    print(f"   Puntaje nuevo: {pregunta_data['puntaje_actual']}")
                    
                    # ✅ Validar que el puntaje no supere el máximo de la pregunta
                    puntaje_maximo = float(respuesta.pregunta.puntaje)
                    nuevo_puntaje = min(float(pregunta_data['puntaje_actual']), puntaje_maximo)
                    
                    print(f"   Puntaje máximo permitido: {puntaje_maximo}")
                    print(f"   Puntaje final a guardar: {nuevo_puntaje}")
                    
                    # Actualizar respuesta
                    respuesta.puntaje_obtenido = nuevo_puntaje
                    
                    # Manejar campo retroalimentacion
                    try:
                        respuesta.retroalimentacion = pregunta_data['retroalimentacion_actual']
                        print(f"   Retroalimentación guardada: {pregunta_data['retroalimentacion_actual'][:50]}...")
                    except AttributeError:
                        # Si el campo no existe en el modelo, lo ignoramos
                        print("⚠️ Campo retroalimentacion no existe en el modelo")
                    
                    respuesta.save()
                    
                    puntaje_total += nuevo_puntaje
                    preguntas_actualizadas += 1
                    
                    print(f"✅ Respuesta {respuesta.id} actualizada correctamente")
                    
                except RespuestaAlumno.DoesNotExist:
                    print(f"⚠️ Respuesta no encontrada: {pregunta_data['respuesta_id']}")
                    continue
                except Exception as e:
                    print(f"⚠️ Error actualizando respuesta: {e}")
                    continue
            
            # Calcular nueva calificación final (escala 0-100)
            respuestas_totales = RespuestaAlumno.objects.filter(examen_alumno=examen_alumno)
            puntaje_maximo_total = sum(
                float(respuesta.pregunta.puntaje) for respuesta in respuestas_totales
            )
            
            print(f"📊 Estadísticas finales:")
            print(f"   Puntaje total: {puntaje_total}")
            print(f"   Puntaje máximo: {puntaje_maximo_total}")
            
            if puntaje_maximo_total > 0:
                nueva_calificacion = (puntaje_total / puntaje_maximo_total) * 100.0
            else:
                nueva_calificacion = 0.0
            
            print(f"   Nueva calificación: {nueva_calificacion}")
            
            # ✅ CORRECCIÓN: Actualizar examen_alumno con indicador de edición MANUAL
            examen_alumno.calificacion_final = round(nueva_calificacion, 2)
            
            # ✅ AGREGAR: Marcar explícitamente como corrección manual
            retro_general = data.get('retroalimentacion_general', '')
            
            # Si no hay retroalimentación general, crear una por defecto que indique edición manual
            if not retro_general.strip():
                retro_general = f"Corrección manual del docente. Calificación ajustada a {round(nueva_calificacion, 2)}/100."
            else:
                # Si ya hay retroalimentación, asegurarnos de que no tenga "automática"
                if 'automática' in retro_general:
                    retro_general = retro_general.replace('automática', 'manual')
                # Agregar marca de edición manual si no está presente
                if 'manual' not in retro_general.lower():
                    retro_general += f" [Editado manualmente - Calificación: {round(nueva_calificacion, 2)}/100]"
            
            examen_alumno.retroalimentacion = retro_general
            examen_alumno.save()
            
            print(f"✅ Examen alumno {examen_alumno.id} actualizado correctamente - MARCADO COMO MANUAL")
            
            return Response({
                'success': True,
                'message': f'Corrección actualizada exitosamente. {preguntas_actualizadas} preguntas modificadas.',
                'nueva_calificacion': round(nueva_calificacion, 2),
                'puntaje_total': round(puntaje_total, 2),
                'puntaje_maximo_total': round(puntaje_maximo_total, 2),
                'tipo_correccion': 'manual'  # ✅ Indicar explícitamente que ahora es manual
            })
            
        except ExamenAlumno.DoesNotExist:
            print(f"❌ ExamenAlumno no encontrado: {examen_alumno_id}")
            return Response(
                {'error': 'Corrección no encontrada o no tienes permisos'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"❌ ERROR en ActualizarCorreccionDocenteView: {str(e)}")
            import traceback
            print(f"🔍 Traceback completo: {traceback.format_exc()}")
            return Response(
                {'error': f'Error interno: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
class AlumnosCursoDocenteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, curso_id):
        """
        Obtener alumnos de un curso específico para filtros
        """
        try:
            # Verificar que es profesor
            if not hasattr(request.user, 'profesor'):
                return Response(
                    {'error': 'Usuario no es un profesor'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            profesor = request.user.profesor
            
            # Verificar que el profesor tiene acceso al curso
            if not ProfesorCurso.objects.filter(
                profesor=profesor, 
                curso_id=curso_id
            ).exists():
                return Response(
                    {'error': 'No tienes acceso a este curso'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Obtener alumnos inscritos en el curso
            inscripciones = Inscripcion.objects.filter(
                curso_id=curso_id
            ).select_related('alumno')
            
            alumnos_data = [
                {
                    'id': inscripcion.alumno.id,
                    'nombre': inscripcion.alumno.nombre,
                    'email': inscripcion.alumno.email
                }
                for inscripcion in inscripciones
            ]
            
            # Validar con serializer
            serializer = AlumnoCursoSerializer(alumnos_data, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            print(f"❌ ERROR en AlumnosCursoDocenteView: {str(e)}")
            return Response(
                {'error': f'Error interno: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ====== NUEVOS ENDPOINTS PARA MÉTRICAS Y ALUMNOS ======

class MetricasCursoView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, curso_id):
        """
        Métricas completas para un curso específico:
        - Nota promedio por examen
        - Preguntas con menor puntaje
        - Distribución de calificaciones
        - Estadísticas de participación
        """
        try:
            # 1. Verificar que es profesor y tiene acceso al curso
            if not hasattr(request.user, 'profesor'):
                return Response(
                    {'error': 'Usuario no es un profesor'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            profesor = request.user.profesor
            
            # Verificar acceso al curso
            if not ProfesorCurso.objects.filter(
                profesor=profesor, 
                curso_id=curso_id
            ).exists():
                return Response(
                    {'error': 'No tienes acceso a este curso'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # 2. Obtener curso
            curso = Curso.objects.get(id=curso_id)
            
            # 3. Obtener exámenes del curso
            examenes = Examen.objects.filter(
                profesor_curso__curso=curso,
                profesor_curso__profesor=profesor
            ).prefetch_related(
                'preguntas',
                'examenalumno_set'
            )
            
            # 4. Calcular métricas por examen
            metricas_examenes = []
            for examen in examenes:
                # Obtener todas las entregas corregidas de este examen
                entregas_corregidas = ExamenAlumno.objects.filter(
                    examen=examen,
                    calificacion_final__isnull=False
                )
                
                if entregas_corregidas.exists():
                    # Calcular nota promedio
                    calificaciones = [float(ea.calificacion_final) for ea in entregas_corregidas]
                    nota_promedio = sum(calificaciones) / len(calificaciones)
                    
                    # Encontrar preguntas con menor puntaje
                    preguntas_problematicas = self.obtener_preguntas_problematicas(examen)
                    
                    # Estadísticas de participación
                    total_alumnos_curso = Inscripcion.objects.filter(curso=curso).count()
                    porcentaje_participacion = (entregas_corregidas.count() / total_alumnos_curso) * 100
                    
                    metricas_examenes.append({
                        'examen_id': examen.id,
                        'titulo': examen.titulo,
                        'nota_promedio': round(nota_promedio, 2),
                        'total_entregas': entregas_corregidas.count(),
                        'porcentaje_participacion': round(porcentaje_participacion, 2),
                        'preguntas_problematicas': preguntas_problematicas,
                        'distribucion_calificaciones': self.obtener_distribucion_calificaciones(calificaciones)
                    })
            
            # 5. Métricas generales del curso
            metricas_generales = {
                'total_examenes': examenes.count(),
                'total_alumnos': Inscripcion.objects.filter(curso=curso).count(),
                'total_evaluaciones_corregidas': ExamenAlumno.objects.filter(
                    examen__profesor_curso__curso=curso,
                    calificacion_final__isnull=False
                ).count(),
                'nota_promedio_curso': self.calcular_nota_promedio_curso(curso, profesor),
                'examenes_sin_corregir': ExamenAlumno.objects.filter(
                    examen__profesor_curso__curso=curso,
                    calificacion_final__isnull=True,
                    fecha_realizacion__isnull=False
                ).count()
            }
            
            return Response({
                'curso': {
                    'id': curso.id,
                    'nombre': curso.nombre,
                    'descripcion': curso.descripcion
                },
                'metricas_generales': metricas_generales,
                'metricas_examenes': metricas_examenes
            })
            
        except Curso.DoesNotExist:
            return Response(
                {'error': 'Curso no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"❌ ERROR en MetricasCursoView: {str(e)}")
            import traceback
            print(f"🔍 Traceback: {traceback.format_exc()}")
            return Response(
                {'error': f'Error interno: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def obtener_preguntas_problematicas(self, examen):
        """Encuentra las preguntas con menor puntaje promedio"""
        preguntas_data = []
        
        for pregunta in examen.preguntas.all():
            # Obtener respuestas de alumnos para esta pregunta
            respuestas = RespuestaAlumno.objects.filter(
                pregunta=pregunta,
                examen_alumno__examen=examen,
                puntaje_obtenido__isnull=False
            )
            
            if respuestas.exists():
                puntajes = [float(r.puntaje_obtenido) for r in respuestas]
                puntaje_promedio = sum(puntajes) / len(puntajes)
                puntaje_maximo = float(pregunta.puntaje)
                porcentaje_promedio = (puntaje_promedio / puntaje_maximo) * 100
                
                preguntas_data.append({
                    'pregunta_id': pregunta.id,
                    'enunciado': pregunta.enunciado,
                    'tipo': pregunta.tipo,
                    'puntaje_promedio': round(puntaje_promedio, 2),
                    'puntaje_maximo': puntaje_maximo,
                    'porcentaje_promedio': round(porcentaje_promedio, 2),
                    'total_respuestas': len(puntajes)
                })
        
        # Ordenar por porcentaje más bajo (más problemáticas primero)
        preguntas_data.sort(key=lambda x: x['porcentaje_promedio'])
        return preguntas_data[:5]  # Top 5 más problemáticas
    
    def obtener_distribucion_calificaciones(self, calificaciones):
        """Calcula distribución de calificaciones en rangos"""
        if not calificaciones:
            return {}
        
        rangos = {
            'excelente': len([c for c in calificaciones if c >= 80]),
            'bueno': len([c for c in calificaciones if 60 <= c < 80]),
            'regular': len([c for c in calificaciones if 40 <= c < 60]),
            'insuficiente': len([c for c in calificaciones if c < 40])
        }
        
        total = len(calificaciones)
        return {
            'excelente': rangos['excelente'],
            'bueno': rangos['bueno'], 
            'regular': rangos['regular'],
            'insuficiente': rangos['insuficiente'],
            'porcentaje_excelente': round((rangos['excelente'] / total) * 100, 2) if total > 0 else 0,
            'porcentaje_bueno': round((rangos['bueno'] / total) * 100, 2) if total > 0 else 0,
            'porcentaje_regular': round((rangos['regular'] / total) * 100, 2) if total > 0 else 0,
            'porcentaje_insuficiente': round((rangos['insuficiente'] / total) * 100, 2) if total > 0 else 0
        }
    
    def calcular_nota_promedio_curso(self, curso, profesor):
        """Calcula la nota promedio de todos los exámenes del curso"""
        examenes_alumno = ExamenAlumno.objects.filter(
            examen__profesor_curso__curso=curso,
            examen__profesor_curso__profesor=profesor,
            calificacion_final__isnull=False
        )
        
        if examenes_alumno.exists():
            calificaciones = [float(ea.calificacion_final) for ea in examenes_alumno]
            return round(sum(calificaciones) / len(calificaciones), 2)
        return 0

class AlumnosConEvaluacionesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, curso_id):
        """
        Listado de alumnos con sus evaluaciones realizadas
        - Filtro por estado de evaluación
        - Acceso directo a correcciones
        - Estadísticas individuales
        """
        try:
            # 1. Verificar que es profesor y tiene acceso al curso
            if not hasattr(request.user, 'profesor'):
                return Response(
                    {'error': 'Usuario no es un profesor'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            profesor = request.user.profesor
            
            # Verificar acceso al curso
            if not ProfesorCurso.objects.filter(
                profesor=profesor, 
                curso_id=curso_id
            ).exists():
                return Response(
                    {'error': 'No tienes acceso a este curso'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # 2. Obtener curso
            curso = Curso.objects.get(id=curso_id)
            
            # 3. Obtener alumnos inscritos en el curso
            inscripciones = Inscripcion.objects.filter(
                curso=curso
            ).select_related('alumno')
            
            # 4. Obtener todos los exámenes del curso para este profesor
            examenes_curso = Examen.objects.filter(
                profesor_curso__curso=curso,
                profesor_curso__profesor=profesor
            )
            
            # 5. Construir datos de alumnos con sus evaluaciones
            alumnos_data = []
            for inscripcion in inscripciones:
                alumno = inscripcion.alumno
                
                # Obtener evaluaciones de este alumno en el curso
                evaluaciones_alumno = ExamenAlumno.objects.filter(
                    alumno=alumno,
                    examen__in=examenes_curso
                ).select_related('examen')
                
                # Estadísticas del alumno
                evaluaciones_corregidas = evaluaciones_alumno.filter(
                    calificacion_final__isnull=False
                )
                evaluaciones_pendientes = evaluaciones_alumno.filter(
                    calificacion_final__isnull=True,
                    fecha_realizacion__isnull=False
                )
                evaluaciones_activas = evaluaciones_alumno.filter(
                    calificacion_final__isnull=True,
                    fecha_realizacion__isnull=True
                )
                
                # Calcular promedio del alumno
                promedio_alumno = 0
                if evaluaciones_corregidas.exists():
                    calificaciones = [float(ea.calificacion_final) for ea in evaluaciones_corregidas]
                    promedio_alumno = round(sum(calificaciones) / len(calificaciones), 2)
                
                # Detalle de evaluaciones
                detalle_evaluaciones = []
                for evaluacion in evaluaciones_alumno:
                    estado = 'activo'
                    if evaluacion.calificacion_final is not None:
                        estado = 'corregido'
                    elif evaluacion.fecha_realizacion is not None:
                        estado = 'pendiente'
                    
                    detalle_evaluaciones.append({
                        'examen_alumno_id': evaluacion.id,
                        'examen_id': evaluacion.examen.id,
                        'titulo_examen': evaluacion.examen.titulo,
                        'fecha_realizacion': evaluacion.fecha_realizacion.strftime('%Y-%m-%d %H:%M') if evaluacion.fecha_realizacion else None,
                        'calificacion': float(evaluacion.calificacion_final) if evaluacion.calificacion_final else None,
                        'estado': estado,
                        'puede_editar': evaluacion.calificacion_final is not None  # Solo se pueden editar las corregidas
                    })
                
                alumnos_data.append({
                    'alumno_id': alumno.id,
                    'nombre': alumno.nombre,
                    'email': alumno.email,
                    'fecha_inscripcion': inscripcion.fecha_inscripcion,
                    'estadisticas': {
                        'total_evaluaciones': evaluaciones_alumno.count(),
                        'evaluaciones_corregidas': evaluaciones_corregidas.count(),
                        'evaluaciones_pendientes': evaluaciones_pendientes.count(),
                        'evaluaciones_activas': evaluaciones_activas.count(),
                        'promedio_general': promedio_alumno
                    },
                    'evaluaciones': detalle_evaluaciones
                })
            
            # 6. Aplicar filtros si existen
            filtro_estado = request.GET.get('estado', '')
            filtro_alumno = request.GET.get('alumno', '')
            
            if filtro_estado:
                alumnos_data = self.filtrar_por_estado(alumnos_data, filtro_estado)
            
            if filtro_alumno:
                alumnos_data = self.filtrar_por_alumno(alumnos_data, filtro_alumno)
            
            return Response({
                'curso': {
                    'id': curso.id,
                    'nombre': curso.nombre
                },
                'total_alumnos': len(alumnos_data),
                'alumnos': alumnos_data
            })
            
        except Curso.DoesNotExist:
            return Response(
                {'error': 'Curso no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"❌ ERROR en AlumnosConEvaluacionesView: {str(e)}")
            import traceback
            print(f"🔍 Traceback: {traceback.format_exc()}")
            return Response(
                {'error': f'Error interno: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def filtrar_por_estado(self, alumnos_data, estado):
        """Filtra alumnos por estado de evaluación"""
        if estado == 'corregido':
            return [alumno for alumno in alumnos_data if alumno['estadisticas']['evaluaciones_corregidas'] > 0]
        elif estado == 'pendiente':
            return [alumno for alumno in alumnos_data if alumno['estadisticas']['evaluaciones_pendientes'] > 0]
        elif estado == 'activo':
            return [alumno for alumno in alumnos_data if alumno['estadisticas']['evaluaciones_activas'] > 0]
        return alumnos_data
    
    def filtrar_por_alumno(self, alumnos_data, nombre_alumno):
        """Filtra alumnos por nombre"""
        return [alumno for alumno in alumnos_data if nombre_alumno.lower() in alumno['nombre'].lower()]





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

class GuardarRespuestaViewSimple(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        print("🎯 GUARDAR RESPUESTA SIMPLE - VISTA EJECUTADA")
        return Response({
            'message': 'Respuesta guardada exitosamente (vista simple)',
            'data_received': request.data
        }, status=200)