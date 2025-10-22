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
            codigo = request.data.get('codigo', '').upper()
            
            if not nombre:
                return Response(
                    {'error': 'El nombre del curso es requerido'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Crear el curso
            curso = Curso.objects.create(
                nombre=nombre,
                descripcion=descripcion
            )
            
            # Asignar el profesor al curso
            ProfesorCurso.objects.create(
                curso=curso,
                profesor=profesor,
                rol='Titular'
            )
            
            return Response({
                'message': 'Curso creado exitosamente',
                'curso': {
                    'id': curso.id,
                    'nombre': curso.nombre,
                    'descripcion': curso.descripcion,
                    'codigo': codigo or f"{curso.nombre[:3].upper()}001",
                    'cantidad_alumnos': 0,
                    'cantidad_examenes': 0,
                    'estado': 'activo'
                }
            }, status=status.HTTP_201_CREATED)
            
        except Profesor.DoesNotExist:
            return Response(
                {'error': 'Usuario no es un profesor'}, 
                status=status.HTTP_403_FORBIDDEN
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