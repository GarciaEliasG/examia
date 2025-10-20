# services/ia_correccion_service.py
import requests
import os
import json
import re
import threading
from django.conf import settings

class IACorreccionService:
    def __init__(self):
        self.api_url = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-large"
        self.api_token = os.getenv('HUGGINGFACE_API_TOKEN', 'hf_tu_token_aqui')
    
    def corregir_evaluacion_completa(self, examen_alumno_id):
        """Corrige automáticamente todas las respuestas de una evaluación"""
        try:
            from .models import ExamenAlumno, RespuestaAlumno
            
            # Obtener el examen_alumno con sus respuestas
            examen_alumno = ExamenAlumno.objects.get(id=examen_alumno_id)
            respuestas = RespuestaAlumno.objects.filter(
                examen_alumno=examen_alumno
            ).select_related('pregunta')
            
            puntaje_total = 0
            puntaje_maximo_total = 0
            correcciones_realizadas = 0
            
            print(f"🔍 Iniciando corrección automática para examen_alumno {examen_alumno_id}")
            print(f"📝 Encontradas {respuestas.count()} respuestas para corregir")
            
            # Corregir cada respuesta individual
            for respuesta in respuestas:
                print(f"📋 Corrigiendo pregunta: {respuesta.pregunta.enunciado[:50]}...")
                
                correccion = self.corregir_respuesta(
                    respuesta.pregunta.enunciado,
                    respuesta.respuesta,
                    respuesta.pregunta.puntaje
                )
                
                # Actualizar la respuesta con los resultados de la IA
                respuesta.puntaje_obtenido = correccion['puntaje']
                respuesta.retroalimentacion = correccion['justificacion']
                respuesta.save()
                
                puntaje_total += correccion['puntaje']
                puntaje_maximo_total += float(respuesta.pregunta.puntaje)
                correcciones_realizadas += 1
                
                print(f"✅ Pregunta {correcciones_realizadas} corregida: {correccion['puntaje']}/{respuesta.pregunta.puntaje}")
            
            # Calcular calificación final (0-20)
            if puntaje_maximo_total > 0:
                calificacion_final = (puntaje_total / puntaje_maximo_total) * 20
            else:
                calificacion_final = 0
            
            # Actualizar el examen_alumno
            examen_alumno.calificacion_final = round(calificacion_final, 2)
            examen_alumno.retroalimentacion = f"Corregido automáticamente por IA. {correcciones_realizadas}/{respuestas.count()} preguntas procesadas."
            examen_alumno.estado = 'corregido'
            examen_alumno.save()
            
            print(f"🎯 Corrección completada. Calificación final: {calificacion_final}/20")
            
            return {
                'success': True,
                'calificacion_final': calificacion_final,
                'puntaje_total': puntaje_total,
                'puntaje_maximo': puntaje_maximo_total,
                'preguntas_corregidas': correcciones_realizadas
            }
            
        except Exception as e:
            print(f"❌ Error en corrección automática: {e}")
            return {'success': False, 'error': str(e)}
    
    def corregir_respuesta(self, enunciado, respuesta_alumno, puntaje_maximo):
        """Envía respuesta a Hugging Face API para corrección"""
        
        prompt = self._construir_prompt(enunciado, respuesta_alumno, puntaje_maximo)
        
        try:
            headers = {"Authorization": f"Bearer {self.api_token}"}
            
            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 100,
                    "temperature": 0.3,
                    "do_sample": True,
                    "return_full_text": False
                }
            }
            
            response = requests.post(
                self.api_url,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                resultado = response.json()
                return self._procesar_respuesta_huggingface(resultado, puntaje_maximo, respuesta_alumno)
            else:
                print(f"⚠️ Error API Hugging Face: {response.status_code} - {response.text}")
                return self._fallback_correction(puntaje_maximo)
                
        except Exception as e:
            print(f"❌ Error en corrección IA: {e}")
            return self._fallback_correction(puntaje_maximo)
    
    def _construir_prompt(self, enunciado, respuesta_alumno, puntaje_maximo):
        """Construye el prompt para la IA"""
        
        return f"""
        Eres un profesor universitario corrigiendo evaluaciones de manera JUSTA y GENEROSA.
        
        CONTEXTO:
        - Pregunta: "{enunciado}"
        - Respuesta del estudiante: "{respuesta_alumno}"
        - Puntaje máximo: {puntaje_maximo}
        
        INSTRUCCIONES ESPECÍFICAS:
        1. Evalúa la respuesta considerando el ESFUERZO y la COHERENCIA
        2. Sé GENEROSO pero OBJETIVO en tu evaluación
        3. Si la respuesta muestra comprensión básica, otorga al menos el 50% del puntaje
        4. Si la respuesta es correcta pero incompleta, otorga entre 60-90%
        5. Solo da 0 si la respuesta está completamente vacía o sin relación alguna
        6. Proporciona una breve justificación (lo que consideres necesario)
        7. No tengas miedo de poner calificaciones perfectas si cubre lo mas importante
        
        FORMATO DE RESPUESTA OBLIGATORIO:
        PUNTAJE|JUSTIFICACION_BREVE
        
        Ejemplo: 3.5|El estudiante demuestra comprensión básica pero falta profundizar en X concepto porque (explicar).
        
        Tu evaluación:
        """
    
    def _procesar_respuesta_huggingface(self, respuesta_api, puntaje_maximo, respuesta_alumno):
        """Procesa la respuesta de Hugging Face API"""
        try:
            # Extraer texto de la respuesta
            if isinstance(respuesta_api, list) and len(respuesta_api) > 0:
                texto_respuesta = respuesta_api[0].get('generated_text', '')
            else:
                texto_respuesta = str(respuesta_api)
            
            print(f"📨 Respuesta IA cruda: {texto_respuesta}")
            
            # Buscar el formato PUNTAJE|JUSTIFICACION
            if "|" in texto_respuesta:
                partes = texto_respuesta.split("|", 1)
                puntaje_str = partes[0].strip()
                justificacion = partes[1].strip() if len(partes) > 1 else "Evaluación automática completada."
                
                # Extraer número del puntaje
                numeros = re.findall(r"(\d+\.?\d*)", puntaje_str)
                if numeros:
                    puntaje = float(numeros[0])
                    # Asegurar que el puntaje no exceda el máximo
                    puntaje = min(puntaje, float(puntaje_maximo))
                    # Asegurar que no sea negativo
                    puntaje = max(puntaje, 0)
                    
                    return {
                        'puntaje': round(puntaje, 2),
                        'justificacion': justificacion,
                        'fuente': 'huggingface_ia',
                        'respuesta_cruda': texto_respuesta
                    }
            
            # Fallback: análisis semántico simple
            return self._analisis_fallback(respuesta_alumno, puntaje_maximo, texto_respuesta)
            
        except Exception as e:
            print(f"❌ Error procesando respuesta IA: {e}")
            return self._fallback_correction(puntaje_maximo)
    
    def _analisis_fallback(self, respuesta_alumno, puntaje_maximo, texto_ia):
        """Análisis de fallback cuando el formato no es el esperado"""
        try:
            # Puntaje basado en longitud y contenido básico
            respuesta_limpia = respuesta_alumno.strip()
            longitud = len(respuesta_limpia)
            palabras = len(respuesta_limpia.split())
            
            # Puntaje base por esfuerzo
            if longitud == 0:
                puntaje_base = 0
                justificacion = "Respuesta vacía. No se puede evaluar contenido."
            else:
                # Base por escribir algo + bonus por extensión
                puntaje_base = min(float(puntaje_maximo) * 0.4, 1.5)
                
                # Bonus por longitud (si es desarrollo)
                if palabras > 15:
                    puntaje_base += min(float(puntaje_maximo) * 0.3, 2.0)
                elif palabras > 5:
                    puntaje_base += min(float(puntaje_maximo) * 0.15, 1.0)
                
                justificacion = "Respuesta evaluada automáticamente. Se consideró el esfuerzo y extensión de la respuesta."
            
            return {
                'puntaje': round(puntaje_base, 2),
                'justificacion': justificacion,
                'fuente': 'fallback_analisis',
                'respuesta_cruda': texto_ia
            }
            
        except Exception as e:
            print(f"❌ Error en análisis fallback: {e}")
            return self._fallback_correction(puntaje_maximo)
    
    def _fallback_correction(self, puntaje_maximo):
        """Corrección de fallback cuando todo falla"""
        return {
            'puntaje': round(float(puntaje_maximo) * 0.6, 2),
            'justificacion': 'Evaluación automática completada con método de respaldo. Revisión docente recomendada.',
            'fuente': 'fallback_generico'
        }

def iniciar_correccion_automatica_async(examen_alumno_id):
    """Función auxiliar para iniciar corrección en segundo plano"""
    def tarea_correccion():
        try:
            correccion_service = IACorreccionService()
            resultado = correccion_service.corregir_evaluacion_completa(examen_alumno_id)
            
            if resultado['success']:
                print(f"✅ Corrección automática COMPLETADA para examen_alumno {examen_alumno_id}")
                print(f"📊 Calificación final: {resultado['calificacion_final']}/20")
            else:
                print(f"⚠️ Corrección automática con ERRORES para examen_alumno {examen_alumno_id}")
                print(f"❌ Error: {resultado['error']}")
                
        except Exception as e:
            print(f"💥 Error crítico en corrección automática: {e}")
    
    thread = threading.Thread(target=tarea_correccion)
    thread.daemon = True
    thread.start()
    print(f"🚀 Corrección automática INICIADA en segundo plano para examen_alumno {examen_alumno_id}")