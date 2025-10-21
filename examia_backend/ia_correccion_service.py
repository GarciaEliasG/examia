# services/ia_correccion_service.py
import requests
import os
import re
import threading
import time
import json
from django.conf import settings
from django.utils import timezone  # ✅ Necesario para fechas con zona horaria


class IACorreccionService:
    def __init__(self):
        # Configurar Groq GRATIS
        self.groq_api_key = os.getenv('GROQ_API_KEY', '')
        self.ia_disponible = False

        if self.groq_api_key:
            try:
                self.ia_disponible = True
                print("✅ Groq configurado correctamente (GRATIS)")
                print(f"🔑 API Key: {self.groq_api_key[:10]}...")
            except Exception as e:
                print(f"❌ Error configurando Groq: {e}")
                self.ia_disponible = False
        else:
            print("❌ GROQ_API_KEY no configurada")
            print("💡 Consíguela GRATIS en: https://console.groq.com/keys")

    def corregir_evaluacion_completa(self, examen_alumno_id):
        """Corrige automáticamente cualquier examen usando Groq GRATIS"""
        try:
            from .models import ExamenAlumno, RespuestaAlumno

            examen_alumno = ExamenAlumno.objects.get(id=examen_alumno_id)
            respuestas = RespuestaAlumno.objects.filter(
                examen_alumno=examen_alumno
            ).select_related('pregunta')

            puntaje_total = 0.0
            puntaje_maximo_total = 0.0
            correcciones_realizadas = 0

            print(f"🔍 Iniciando corrección universal con Groq GRATIS para examen {examen_alumno_id}")
            print(f"📝 Encontradas {respuestas.count()} respuestas para corregir")

            for respuesta in respuestas:
                print(f"📋 Corrigiendo: {respuesta.pregunta.enunciado[:80]}...")
                print(f"🔧 Tipo de pregunta: {respuesta.pregunta.tipo}")
                print(f"✏️ Respuesta del alumno: {respuesta.respuesta[:200]}...")

                correccion = self.corregir_respuesta_universal(
                    respuesta.pregunta.enunciado,
                    respuesta.respuesta,
                    respuesta.pregunta.puntaje,
                    respuesta.pregunta.tipo
                )

                # proteger si correccion es None o faltan claves
                punt = float(correccion.get('puntaje', 0.0)) if correccion else 0.0
                retro = correccion.get('justificacion', '') if correccion else ''

                respuesta.puntaje_obtenido = round(punt, 2)
                respuesta.retroalimentacion = retro
                respuesta.save()

                puntaje_total += punt
                puntaje_maximo_total += float(respuesta.pregunta.puntaje)
                correcciones_realizadas += 1

                fuente = correccion.get('fuente') if correccion else 'error'
                print(f"✅ Pregunta {correcciones_realizadas}: {round(punt,2)}/{respuesta.pregunta.puntaje} - {fuente}")
                time.sleep(1)

            # ✅ Calificación real (escala 0 a 100), usando puntaje máximo total
            if puntaje_maximo_total > 0:
                calificacion_final = (puntaje_total / puntaje_maximo_total) * 100.0
            else:
                calificacion_final = 0.0

            estado_calificacion = 'aprobado' if calificacion_final >= 60.0 else 'reprobado'

            # Guardar fecha con timezone para evitar warning
            examen_alumno.fecha_realizacion = timezone.now()
            examen_alumno.calificacion_final = round(calificacion_final, 2)
            examen_alumno.retroalimentacion = (
                f"Evaluación completada. {correcciones_realizadas}/{respuestas.count()} "
                f"preguntas corregidas. Calificación: {calificacion_final:.1f}/100 ({estado_calificacion})."
            )
            examen_alumno.estado = 'corregido'
            examen_alumno.save()

            print(f"🎯 Corrección completada. Calificación final: {calificacion_final:.2f}/100 ({estado_calificacion})")

            return {
                'success': True,
                'calificacion_final': calificacion_final,
                'puntaje_total': puntaje_total,
                'puntaje_maximo': puntaje_maximo_total,
                'preguntas_corregidas': correcciones_realizadas,
                'estado': estado_calificacion
            }

        except Exception as e:
            print(f"❌ Error en corrección automática: {e}")
            return {'success': False, 'error': str(e)}

    def corregir_respuesta_universal(self, enunciado, respuesta_alumno, puntaje_maximo, tipo_pregunta=None):
        """Sistema universal de corrección IA para cualquier materia"""
        validacion_basica = self._validar_respuesta_basica(respuesta_alumno)
        if validacion_basica:
            return validacion_basica

        if self.ia_disponible:
            print("🚀 Usando IA Groq para corrección universal...")
            correccion_ia = self._corregir_con_groq_super_flexible(
                enunciado, respuesta_alumno, puntaje_maximo, tipo_pregunta
            )
            if correccion_ia:
                return correccion_ia

        return {
            'puntaje': 0.0,
            'justificacion': 'Servicio de corrección automática no disponible.',
            'fuente': 'ia_no_disponible'
        }

    def _validar_respuesta_basica(self, respuesta_alumno):
        """Validaciones básicas universales"""
        if not respuesta_alumno or respuesta_alumno.strip() == '':
            return {
                'puntaje': 0.0,
                'justificacion': 'No se proporcionó respuesta.',
                'fuente': 'validacion_basica'
            }

        respuesta_limpia = respuesta_alumno.strip().lower()
        respuestas_invalidas = [
            'no sé', 'no se', 'no lo sé', 'no lo se', 'no me acuerdo',
            'no recuerdo', 'no conozco', 'no saber', 'ignoro', 'desconozco',
            'no tengo idea', 'ni idea', 'quién sabe', 'quien sabe'
        ]

        if respuesta_limpia in respuestas_invalidas:
            return {
                'puntaje': 0.0,
                'justificacion': 'El estudiante indicó no conocer la respuesta.',
                'fuente': 'validacion_basica'
            }

        return None

    def _corregir_con_groq_super_flexible(self, enunciado, respuesta_alumno, puntaje_maximo, tipo_pregunta=None):
        """Usar Groq API para corrección SUPER FLEXIBLE"""
        try:
            prompt = self._construir_prompt_super_flexible(
                enunciado, respuesta_alumno, puntaje_maximo, tipo_pregunta
            )

            headers = {
                'Authorization': f'Bearer {self.groq_api_key}',
                'Content-Type': 'application/json'
            }

            data = {
                'messages': [
                    {
                        'role': 'system',
                        'content': (
                            "Eres el PROFESOR MÁS FLEXIBLE del mundo. Tu única misión es PREMIAR el conocimiento.\n\n"
                            "REGLAS:\n"
                            "1. ✅ Si la respuesta es correcta → PUNTAJE COMPLETO\n"
                            "2. ✅ Sé generoso: respuestas breves también valen completo\n"
                            "3. ✅ Ignora errores de ortografía o formato\n"
                            "4. ✅ Si es incorrecta, solo devuelve 0 puntos"
                        )
                    },
                    {'role': 'user', 'content': prompt}
                ],
                'model': 'llama-3.1-8b-instant',
                'temperature': 0.1,
                'max_tokens': 200,
                'top_p': 0.9
            }

            print("📤 Enviando solicitud a Groq...")
            response = requests.post(
                'https://api.groq.com/openai/v1/chat/completions',
                headers=headers,
                json=data,
                timeout=30
            )

            if response.status_code == 200:
                resultado = response.json()
                texto_respuesta = resultado['choices'][0]['message']['content']
                print(f"📨 Respuesta Groq: {texto_respuesta}")

                correccion = self._procesar_respuesta_simple(texto_respuesta, puntaje_maximo)
                if correccion:
                    correccion['fuente'] = 'groq_ai_super_flexible'
                    return correccion
                else:
                    print("❌ No se pudo procesar la respuesta de Groq")
            else:
                print(f"❌ Error Groq API: {response.status_code} - {response.text}")

            return None

        except Exception as e:
            print(f"❌ Error con Groq: {e}")
            return None

    def _construir_prompt_super_flexible(self, enunciado, respuesta_alumno, puntaje_maximo, tipo_pregunta=None):
        """Prompt SUPER FLEXIBLE"""
        ejemplos_flexibles = f'''
EJEMPLOS DE CORRECCIÓN FLEXIBLE:

1. PREGUNTA: "¿Cuál es la derivada de x²?"
   RESPUESTA: "2x"
   → PUNTAJE|{puntaje_maximo}|✅ ¡PERFECTO! Respuesta correcta y directa.

2. PREGUNTA: "Resuelve: 3x + 5 = 20"
   RESPUESTA: "5"
   → PUNTAJE|{puntaje_maximo}|✅ ¡EXCELENTE! Solución correcta encontrada.

3. PREGUNTA: "Explica el Teorema de Pitágoras"
   RESPUESTA: "hipotenusa al cuadrado = suma de catetos al cuadrado"
   → PUNTAJE|{puntaje_maximo}|✅ ¡MUY BIEN! Comprende la esencia del teorema.
'''
        return f'''
{ejemplos_flexibles}

AHORA EVALÚA ESTA RESPUESTA CON LA MÁXIMA FLEXIBILIDAD:

PREGUNTA: "{enunciado}"
RESPUESTA DEL ESTUDIANTE: "{respuesta_alumno}"
PUNTAJE MÁXIMO: {puntaje_maximo}

FORMATO SUGERIDO (tolerante):
- PUNTAJE|valor_numérico|comentario_positivo
- También aceptamos: valor_numérico|comentario

RESPONDE de forma breve y en ese formato (pero el parser tolerará ligeras variaciones).
'''

    # ------------------------- PARSING ROBUSTO --------------------------------
    def _extraer_numero_de_texto(self, texto):
        """Extrae el primer número (entero o decimal) de un string, ignora símbolos y emojis."""
        if texto is None:
            return None
        texto = str(texto)
        # buscar porcentaje explícito como grupo
        m_pct = re.search(r'([0-9]+(?:[.,][0-9]+)?)\s*%', texto)
        if m_pct:
            return float(m_pct.group(1).replace(',', '.')), True  # (valor, es_porcentaje)
        # buscar número normal
        m = re.search(r'([0-9]+(?:[.,][0-9]+)?)', texto)
        if m:
            return float(m.group(1).replace(',', '.')), False
        return None

    def _normalizar_puntaje(self, raw_val, es_porcentaje, puntaje_maximo):
        """
        Normaliza raw_val respecto a puntaje_maximo:
        - Si es_porcentaje=True → interpreto raw_val como porcentaje (0-100) y convierto a absoluto.
        - Si es_porcentaje=False:
            - Si raw_val <= puntaje_maximo -> lo trato como puntaje absoluto.
            - elif raw_val <= 100 -> lo trato como porcentaje.
            - else -> lo capeo al puntaje_maximo.
        """
        try:
            pm = float(puntaje_maximo)
            if es_porcentaje:
                return max(0.0, min((raw_val / 100.0) * pm, pm))
            # no es porcentaje explícito:
            if raw_val <= pm:
                return raw_val
            if raw_val <= 100.0:
                # probablemente el modelo devolvió un porcentaje sin el símbolo
                return (raw_val / 100.0) * pm
            # si viene un número mayor que 100 y mayor que pm, capear
            return pm
        except Exception:
            return None

    def _procesar_respuesta_simple(self, texto_respuesta, puntaje_maximo):
        """Procesamiento SIMPLE pero ROBUSTO y tolerante a errores"""
        try:
            if not texto_respuesta:
                return None

            print(f"🔍 Procesando: {texto_respuesta[:200]}...")

            # separar por '|' y limpiar
            partes = [p.strip() for p in texto_respuesta.split("|") if p and p.strip()]

            puntaje = None
            justificacion = None

            # Caso A: al menos 3 partes -> PUNTAJE | valor | comentario (o similares)
            if len(partes) >= 3:
                # intentar extraer número de la parte 1 (índice 1)
                extra = self._extraer_numero_de_texto(partes[1])
                if extra:
                    val, es_pct = extra
                    puntaje = self._normalizar_puntaje(val, es_pct, puntaje_maximo)
                    justificacion = " | ".join(partes[2:]).strip()
            # Caso B: exactamente 2 partes -> buscar número en cualquiera de las 2 partes
            elif len(partes) == 2:
                # preferir número en la primera parte (si la primera parece numérica), si no buscar en la segunda
                extra0 = self._extraer_numero_de_texto(partes[0])
                extra1 = self._extraer_numero_de_texto(partes[1])
                chosen = None
                if extra0 and extra1:
                    # elegir el que parezca más razonable: si uno <= puntaje_max, elegirlo
                    val0, pct0 = extra0
                    val1, pct1 = extra1
                    if val0 <= float(puntaje_maximo):
                        chosen = (val0, pct0, parts := partes[1])
                    elif val1 <= float(puntaje_maximo):
                        chosen = (val1, pct1, parts := partes[1])
                    else:
                        # si ninguno menor que puntaje_max, elegir extra0 por defecto
                        chosen = (val0, pct0, parts := partes[1])
                elif extra0:
                    val0, pct0 = extra0
                    chosen = (val0, pct0, partes[1])
                elif extra1:
                    val1, pct1 = extra1
                    chosen = (val1, pct1, partes[1])

                if chosen:
                    raw_val, is_pct, comment_hint = chosen
                    puntaje = self._normalizar_puntaje(raw_val, is_pct, puntaje_maximo)
                    justificacion = comment_hint.strip()
            # Caso C: no '|' o no detectado -> buscar el primer número en todo el texto
            if puntaje is None:
                extra = self._extraer_numero_de_texto(texto_respuesta)
                if extra:
                    val, is_pct = extra
                    puntaje = self._normalizar_puntaje(val, is_pct, puntaje_maximo)
                    # tomar como justificación una versión corta del texto
                    justificacion = texto_respuesta.strip()[:200] + ("..." if len(texto_respuesta.strip()) > 200 else "")

            if puntaje is None:
                print("❌ No se pudo extraer puntaje válido de la respuesta.")
                return None

            puntaje = max(0.0, min(puntaje, float(puntaje_maximo)))

            return {
                'puntaje': round(puntaje, 2),
                'justificacion': justificacion or ''
            }

        except Exception as e:
            print(f"❌ Error procesando: {e}")
            return None


def iniciar_correccion_automatica_async(examen_alumno_id):
    """Iniciar corrección en segundo plano"""
    def tarea_correccion():
        try:
            service = IACorreccionService()
            resultado = service.corregir_evaluacion_completa(examen_alumno_id)

            if resultado.get('success'):
                print(f"✅ Corrección COMPLETADA para examen {examen_alumno_id}")
                print(f"📊 Calificación: {resultado['calificacion_final']}/100 ({resultado['estado']})")
            else:
                print(f"❌ Corrección falló: {resultado.get('error')}")

        except Exception as e:
            print(f"💥 Error crítico: {e}")

    thread = threading.Thread(target=tarea_correccion)
    thread.daemon = True
    thread.start()
    print(f"🚀 Corrección universal iniciada para examen {examen_alumno_id}")
