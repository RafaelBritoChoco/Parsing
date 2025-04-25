# -*- coding: utf-8 -*-
from Npp import editor, notepad, console
import re

# --- Bloco de Seguran�a para Scintilla (Opcional) ---
try:
    from Npp import SCINTILLANOTIFICATION
except ImportError:
    class SCINTILLANOTIFICATION:
        MODIFIED = None

def format_join_then_force_separate_final(): # Nome reflete o processo
    """
    COMBINA TR�S OPERA��ES EM SEQU�NCIA:
    1. JUNTA em uma �nica linha interna:
        - {{levelN}} com seu texto.
        - Texto com sua tag final {{-levelN}}.
        - Marcadores de lista {{...}} com seu texto.
    2. FOR�A SEPARA��O: Garante que CADA tag {{...}} resultante
       (seja ela {{levelN}}Texto{{-levelN}} ou {{text_level}} etc.)
       esteja isolada por quebras de linha (\n).
    3. ADICIONA BLANKS: Insere UMA linha em branco (\n\n) entre
       cada linha/tag isolada, removendo linhas totalmente vazias.
    Compat�vel com Python 2.7 e vers�es antigas do PythonScript.
    """
    # --- Inicializa��o ---
    # console.show() # Descomente para ver logs
    # console.clear()
    # console.write("Iniciando Formata��o Final Combinada...\n")

    text_original = editor.getText()
    if not text_original:
        notepad.messageBox("Document is empty.", "Info", 0)
        return

    text_processed = text_original
    made_changes_phase1 = False # Flag para saber se a jun��o fez algo

    # ===========================================================
    # FASE 1: JUNTAR TAGS/MARCADORES AO TEXTO
    # ===========================================================
    # console.write("FASE 1: Juntando tags/marcadores...\n")
    num_subs_total_phase1 = 0

    # Passagem 1.1: Juntar Tag Inicial {{levelN}} com Texto
    start_pattern = re.compile(r'(\{\{level\d+\}\})(\s*\n\s*)(?=\S)')
    start_replacement = r'\1'
    text_processed, num_subs1 = start_pattern.subn(start_replacement, text_processed)
    if num_subs1 > 0: num_subs_total_phase1 += num_subs1

    # Passagem 1.2: Juntar Texto com Tag Final {{-levelN}}
    end_pattern = re.compile(r'(\S)(\s*\n\s*)(\{\{-level\d+\}\})')
    end_replacement = r'\1\3'
    text_processed, num_subs2 = end_pattern.subn(end_replacement, text_processed)
    if num_subs2 > 0: num_subs_total_phase1 += num_subs2

    # Passagem 1.3: Juntar Marcador de Lista {{...}} com Texto
    marker_pattern = re.compile(
        r'(\{\{\s*\(?\s*[a-zA-Z0-9ivxlcdmIVXLCDM\.]+\s*\)?\s*\}\})'
        r'(\s*\n\s*)'
        r'(?=\S)'
    )
    marker_replacement = r'\1 '
    text_processed, num_subs3 = marker_pattern.subn(marker_replacement, text_processed)
    if num_subs3 > 0: num_subs_total_phase1 += num_subs3

    if num_subs_total_phase1 > 0:
        made_changes_phase1 = True
        # console.write("FASE 1: {} substitui��es de jun��o realizadas.\n".format(num_subs_total_phase1))
    # else:
        # console.write("FASE 1: Nenhuma jun��o interna necess�ria.\n")

    # ===========================================================
    # FASE 2: FOR�AR SEPARA��O DE TODAS AS TAGS {{...}}
    # (Usa a l�gica do primeiro script 'format_text_separate_safely')
    # Aplicada ao resultado da Fase 1
    # ===========================================================
    # console.write("FASE 2: For�ando separa��o de todas as tags...\n")
    text_after_phase1 = text_processed # Renomeia para clareza

    # Adiciona \n ANTES de QUALQUER {{...}} se n�o houver \n antes.
    text_sep1 = re.sub(r'(?<!\n)(\{\{[^{}]+\}\})', r'\n\1', text_after_phase1)
    # Adiciona \n DEPOIS de QUALQUER {{...}} se n�o houver \n depois.
    text_sep2 = re.sub(r'(\{\{[^{}]+\}\})(?!\n)', r'\1\n', text_sep1)

    # ===========================================================
    # FASE 3: ADICIONAR LINHAS EM BRANCO FINAIS
    # (Divide, filtra vazios, junta com \n\n)
    # Aplicada ao resultado da Fase 2
    # ===========================================================
    # console.write("FASE 3: Adicionando linhas em branco finais...\n")

    # Divide o texto (agora com todas as tags isoladas por \n) em linhas
    lines = text_sep2.splitlines()

    # Filtra APENAS linhas que s�o literalmente strings vazias ('').
    # Preserva linhas com espa�os, e as linhas de tag/conte�do.
    processed_lines = [line for line in lines if line != '']

    # Junta com "\n\n" para garantir UMA linha em branco entre cada item.
    final_text_for_editor = "\n\n".join(processed_lines)

    # --- Atualizar o Editor ---
    # Atualiza se o resultado final for diferente do original
    if final_text_for_editor != text_original:
        # console.write("Atualizando editor com resultado final...\n")
        editor.beginUndoAction()
        try:
            editor.setText(final_text_for_editor)
            editor.scrollCaret() # Tenta trazer o cursor para a vis�o
        except Exception as e:
            notepad.messageBox("Error updating text:\n" + str(e), "Error", 0)
            # console.write(u"ERRO ao atualizar editor: {}\n".format(e))
        finally:
            editor.endUndoAction()
        # Mensagem de sucesso final "Done"
        notepad.messageBox("Done", "Complete")
    else:
        # Mensagem se nenhuma altera��o foi necess�ria no total
        notepad.messageBox("No changes needed.", "Info", 0)
        # console.write("Nenhuma altera��o necess�ria no total.\n")

# --- Ponto de Entrada Padr�o ---
if __name__ == '__main__':
    format_join_then_force_separate_final()