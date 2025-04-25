# -*- coding: utf-8 -*-
from Npp import editor, notepad, console
import re

# --- Bloco de Segurança para Scintilla (Opcional) ---
try:
    from Npp import SCINTILLANOTIFICATION
except ImportError:
    class SCINTILLANOTIFICATION:
        MODIFIED = None

def format_join_all_tags_to_text_compatible(): # Nome da função atualizado
    """
    JUNTA em uma única linha:
    1. Blocos {{levelN}} com seu texto seguinte.
    2. Texto com sua tag final {{-levelN}}.
    3. Marcadores de lista {{([a|1|i]...)}} com seu texto seguinte.
    Remove newlines/espaços APENAS nos pontos de junção.
    Compatível com Python 2.7 e versões mais antigas do PythonScript.
    """
    # --- Inicialização ---
    # console.show() # Descomente para ver logs detalhados
    # console.clear()
    # console.write("Iniciando junção completa de Tags/Marcadores ao Texto...\n")

    text_original = editor.getText()
    if not text_original:
        notepad.messageBox("Document is empty.", "Info", 0)
        return

    text_processed = text_original
    num_subs_total = 0

    # --- Passagem 1: Juntar Tag Inicial {{levelN}} com Texto ---
    # console.write("Passagem 1: Juntando tag inicial {{levelN}} ao texto...\n")
    start_pattern = re.compile(r'(\{\{level\d+\}\})(\s*\n\s*)(?=\S)')
    start_replacement = r'\1'
    text_processed, num_subs1 = start_pattern.subn(start_replacement, text_processed)
    if num_subs1 > 0:
        # console.write(" - {} junções iniciais realizadas.\n".format(num_subs1))
        num_subs_total += num_subs1
    # else:
        # console.write(" - Nenhuma junção inicial necessária.\n")


    # --- Passagem 2: Juntar Texto com Tag Final {{-levelN}} ---
    # Aplicada ao resultado da Passagem 1
    # console.write("Passagem 2: Juntando texto à tag final {{-levelN}}...\n")
    end_pattern = re.compile(r'(\S)(\s*\n\s*)(\{\{-level\d+\}\})')
    end_replacement = r'\1\3'
    text_processed, num_subs2 = end_pattern.subn(end_replacement, text_processed)
    if num_subs2 > 0:
        # console.write(" - {} junções finais realizadas.\n".format(num_subs2))
        num_subs_total += num_subs2
    # else:
         # console.write(" - Nenhuma junção final necessária.\n")

    # --- Passagem 3: Juntar Marcador de Lista {{...}} com Texto ---
    # Aplicada ao resultado da Passagem 2
    # console.write("Passagem 3: Juntando marcador de lista ao texto...\n")
    marker_pattern = re.compile(
        r'(\{\{\s*\(?\s*[a-zA-Z0-9ivxlcdmIVXLCDM\.]+\s*\)?\s*\}\})'  # Grupo 1: Marcador
        r'(\s*\n\s*)'                                             # Grupo 2: Whitespace com newline
        r'(?=\S)'                                                 # Lookahead: Seguido por não-espaço
    )
    marker_replacement = r'\1 ' # Marcador + Espaço
    text_processed, num_subs3 = marker_pattern.subn(marker_replacement, text_processed)
    if num_subs3 > 0:
        # console.write(" - {} junções de marcador de lista realizadas.\n".format(num_subs3))
        num_subs_total += num_subs3
    # else:
        # console.write(" - Nenhuma junção de marcador de lista necessária.\n")


    # --- Atualizar o Editor ---
    if num_subs_total > 0:
        # console.write("Atualizando editor...\n")
        editor.beginUndoAction()
        try:
            editor.setText(text_processed) # Usa o resultado final após as três passagens
            editor.scrollCaret() # Tenta trazer o cursor para a visão
        except Exception as e:
            notepad.messageBox("Error updating text:\n" + str(e), "Error", 0)
            # console.write(u"ERRO ao atualizar editor: {}\n".format(e))
        finally:
            editor.endUndoAction()
        # Mensagem de sucesso final "Done"
        notepad.messageBox("Done", "Complete")
    else:
        notepad.messageBox("No changes needed.", "Info", 0)
        # console.write("Nenhuma alteração necessária.\n")

# --- Ponto de Entrada Padrão ---
if __name__ == '__main__':
    # Nome da função alterado aqui também
    format_join_all_tags_to_text_compatible()