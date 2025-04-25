# -*- coding: utf-8 -*-
# =============================================================================
# DESFAZER NIVEIS MULTI-LINHA - v1.4 (Inserir Marcador "BreakLine")
# =============================================================================
# OBJETIVO: Remover tags {{levelX}} e {{-levelX}} quando o conteudo entre elas
#          contiver quebras de linha (\n), inserir um marcador "BreakLine"
#          na linha anterior ao conteudo liberado para facil localizacao (Ctrl+F),
#          e garantir que haja uma nova linha DEPOIS do conteudo liberado.
# VERSAO FINAL BASEADA NO FUNCIONAMENTO CONFIRMADO.
# AMBIENTE: Python 2.7 / Notepad++ / PythonScript
# =============================================================================
from Npp import *
import re
import traceback

# --- Funcao Auxiliar de Decodificacao ---
def decode_to_unicode(byte_string):
    """Tenta decodificar bytes para unicode (UTF-8 primeiro, depois Latin-1)."""
    try:
        return byte_string.decode('utf-8')
    except UnicodeDecodeError:
        # Log conciso apenas se precisar depurar encoding
        # console.write(u"WARNING: Falha UTF-8, tentando Latin-1...\n")
        try:
            return byte_string.decode('latin-1')
        except Exception as e:
            console.write(u"ERROR: Falha critica ao decodificar: {}\n".format(unicode(e)))
            return u""

# --- Funcao Principal ---
def insert_breakline_marker_v1_4_final(): # Nome final
    console.show()
    console.clear()
    console.write(u"--- Iniciando Script: Inserir Marcador 'BreakLine' e Remover Tags Multi-linha (v1.4 Final) ---\n")

    try:
        # 1. Leitura e Decodificacao
        editor_content_bytes = editor.getText()
        if not editor_content_bytes:
            notepad.messageBox("Documento vazio.".encode('utf-8'), "Aviso", MESSAGEBOXFLAGS.ICONWARNING)
            return

        editor_content_unicode = decode_to_unicode(editor_content_bytes)
        if not editor_content_unicode:
            notepad.messageBox(u"Nao foi possivel decodificar o conteudo.".encode('utf-8'), "Erro", MESSAGEBOXFLAGS.ICONERROR)
            return
        console.write(u"INFO: Texto original lido e decodificado.\n")

        # 2. Regex
        pattern_unicode = ur"(\{\{level(\d+)\}\})(.*?)(\{\{-level\2\}\})"
        compiled_pattern = re.compile(pattern_unicode, re.DOTALL | re.UNICODE)

        # 3. Iterar com finditer e Construir Novo Texto
        last_end = 0
        modified_parts = []
        marker_inserted_count = 0 # Contador para marcadores/remocoes

        console.write(u"INFO: Procurando e processando blocos {{levelX}}...\n")
        for match in compiled_pattern.finditer(editor_content_unicode):
            start_tag_start = match.start(1)
            level_num_str = match.group(2)
            content = match.group(3)
            full_match_start, full_match_end = match.span(0)

            # Adiciona o texto *antes* da correspondencia atual
            modified_parts.append(editor_content_unicode[last_end:full_match_start])

            # Analisa o conteudo da correspondencia
            if u'\n' in content:
                # Contem nova linha: Insere marcador + newline + conteudo (stripado no fim) + newline garantido
                line_num = editor.lineFromPosition(start_tag_start) + 1
                console.write(u"  - Linha {}: Level {} multi-linha. Removendo tags e inserindo 'BreakLine'.\n".format(line_num, level_num_str))
                modified_parts.append(u"BreakLine\n" + content.rstrip() + u"\n")
                marker_inserted_count += 1
            else:
                # Linha unica: Adiciona a correspondencia INTEIRA original
                modified_parts.append(match.group(0))

            # Atualiza a posicao final
            last_end = full_match_end

        # Adiciona o restante do texto
        modified_parts.append(editor_content_unicode[last_end:])
        modified_content_unicode = u"".join(modified_parts)

        # 4. Comparacao e Escrita
        if marker_inserted_count > 0: # Verifica se houve alguma modificacao
            console.write(u"\nINFO: Modificacoes realizadas. Atualizando o editor...\n")
            console.write(u"INFO: {} marcadores 'BreakLine' foram inseridos (tags removidas).\n".format(marker_inserted_count))

            try:
                modified_content_bytes = modified_content_unicode.encode('utf-8')
            except UnicodeEncodeError as enc_err:
                 console.write(u"ERRO CRITICO: Falha ao re-codificar para UTF-8: {}\n".format(unicode(enc_err)))
                 notepad.messageBox(u"Erro ao codificar texto para salvar!\nVerifique o console.".encode('utf-8'), "Erro", MESSAGEBOXFLAGS.ICONERROR)
                 return

            editor.beginUndoAction()
            try:
                editor.setText(modified_content_bytes)
                console.write(u"INFO: Texto do editor atualizado com sucesso.\n")
            except Exception as set_err:
                 console.write(u"ERRO CRITICO: Falha ao definir texto no editor: {}\n".format(unicode(set_err)))
                 notepad.messageBox(u"Erro ao atualizar editor!\nVerifique o console.".encode('utf-8'), "Erro", MESSAGEBOXFLAGS.ICONERROR)
                 editor.endUndoAction()
                 return
            editor.endUndoAction()

            notepad.messageBox(u"{} marcadores 'BreakLine' inseridos onde tags multi-linha foram removidas.".format(marker_inserted_count).encode('utf-8'),
                               "Limpeza Concluida", MESSAGEBOXFLAGS.ICONINFORMATION)

        else:
            console.write(u"\nINFO: Nenhuma tag multi-linha encontrada para remover/marcar.\n")
            notepad.messageBox("Nenhuma alteracao necessaria.".encode('utf-8'), "Info", MESSAGEBOXFLAGS.ICONINFORMATION)

    except Exception as e:
        console.write(u"\n--- ERRO INESPERADO NO FLUXO PRINCIPAL ---\n")
        console.write(traceback.format_exc() + u"\n")
        error_summary = unicode(e).split('\n')[0]
        notepad.messageBox(u"Erro inesperado no script: {}\nVerifique o Console Python.".format(error_summary).encode('utf-8'), "Erro", MESSAGEBOXFLAGS.ICONERROR)
    finally:
        console.write(u"\n--- Fim da execucao do Script (Inserir Marcador 'BreakLine' v1.4 Final) ---\n")

# --- Executa ---
if __name__ == '__main__':
    insert_breakline_marker_v1_4_final()