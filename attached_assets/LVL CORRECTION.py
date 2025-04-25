# -*- coding: utf-8 -*-
# =======================================================
# AJUSTAR NIVEIS (LEVELS) - v4.10 (Producao - Logica v4.7 Otimizada)
# =======================================================
# OBJETIVO: Versao otimizada da v4.7, removendo logs
#           excessivos de debug para execucao mais rapida.
#           Mantem a logica de correcao ativa forcada por ID.
# =======================================================
from Npp import *
import re
import traceback

# --- Regexes, Keywords, Hierarquia (iguais) ---
LEVEL_PATTERN_B = re.compile(r"(\{\{level)(\d+)(\}\})(.*?)(\{\{-level)\d+(\}\})", re.DOTALL)
TEXT_LEVEL_BLOCK_PATTERN_B = re.compile(r"(\{\{text_level\}\})(.*?)(\{\{-text_level\}\})", re.DOTALL)
MARKER_CLEANUP_PATTERN_U = re.compile(ur"^\s*\{\{\s*(\([ivxlcdm]+\)|\([a-zA-Z]+\)|\d+\.)\s*\}\}(.*)|^(.*)", re.IGNORECASE | re.DOTALL)
TYPE_MAP = {u'part': u'part', u'parte': u'part', u'livre': u'part', u'teil':u'part', u'title': u'title', u'título': u'title', u'titre': u'title', u'chapter': u'chapter', u'capítulo': u'chapter', u'chapitre': u'chapter', u'kapitel': u'chapter', u'section': u'section', u'sección': u'section', u'secção': u'section', u'seção': u'section', u'abschnitt': u'section', u'sub-section': u'subsection', u'subsection': u'subsection', u'sub section': u'subsection', u'subsección': u'subsection', u'subseção': u'subsection', u'sous-section': u'subsection', u'unterabschnitt': u'subsection', u'SUB-SECTION': u'subsection', u'SUB SECTION': u'subsection', u'article': u'article', u'artículo': u'article', u'artigo': u'article', u'artikel': u'article', u'art.': u'article', u'preamble': u'preamble', u'preámbulo': u'preamble', u'preâmbulo': u'preamble', u'préambule':u'preamble', u'annex': u'annex', u'anexo': u'annex', u'annexe': u'annex', u'anhang':u'annex', u'appendix': u'appendix', u'apéndice':u'appendix', u'apêndice':u'appendix', u'appendice':u'appendix', u'schedule': u'schedule', u'anlage': u'schedule',}
HIERARCHY = {u'part': {u'title', u'chapter'}, u'title': {u'chapter', u'section', u'article'}, u'chapter': {u'section', u'article'}, u'section': {u'subsection', u'article'}, u'subsection': {u'article'},}

# --- Funcoes Auxiliares (sem logs de debug) ---
def decode_to_unicode(byte_string):
    try: return byte_string.decode('utf-8');
    except UnicodeDecodeError:
        try: return byte_string.decode('latin-1');
        except Exception: return u"";
    except Exception: return u""; # Captura outros erros de decode

def get_tag_type(content_unicode):
    stripped = content_unicode.strip();
    if not stripped: return u'unknown';
    words = stripped.split(None, 2);
    if len(words) > 1:
        two_words = (words[0] + u" " + words[1]).lower().rstrip('.:');
        tag_type = TYPE_MAP.get(two_words);
        if tag_type: return tag_type;
    first_word = words[0].lower().rstrip('.:');
    tag_type = TYPE_MAP.get(first_word);
    if tag_type: return tag_type;
    return u'unknown';

def extract_identifier(text_unicode, tag_type):
    text = text_unicode.strip(); prefix_to_remove = None; candidate_keywords = []; removed_prefix = False;
    for keyword, type_val in TYPE_MAP.items():
        if type_val == tag_type: candidate_keywords.append(keyword);
    candidate_keywords.sort(key=len, reverse=True);
    for keyword in candidate_keywords:
        keyword_with_space = keyword + u' '
        if text.lower().startswith(keyword_with_space):
            prefix_to_remove = keyword;
            text = text[len(keyword_with_space):].strip();
            removed_prefix = True;
            break;
    id_pattern = ur"^([a-zA-Z0-9]+(?:[\-\.][a-zA-Z0-9]+)*)";
    match = re.match(id_pattern, text);
    if match: return match.group(1);
    return u"";

def is_direct_sub_identifier(current_id, previous_id):
    if not current_id or not previous_id or current_id == previous_id: return False;
    if current_id.startswith(previous_id):
        suffix = current_id[len(previous_id):];
        suffix_pattern = ur"^[\s\-.]?(\d+|[a-zA-Z]+)";
        match = re.match(suffix_pattern, suffix);
        if match: return True;
    return False;
# --- Fim Funcoes Auxiliares ---

# --- Funcao Principal de Ajuste (v4.10 - Logica v4.7 Otimizada) ---
def perform_level_adjustment_v4_10(all_level_tags_data, block_data_by_start):
    console.write(u"--- INICIANDO AJUSTE DE NIVEIS (v4.10) ---\n") # Versao atualizada
    adjustments_to_make = []
    last_outer_tag_data = {'correct_level': -1, 'type': u'unknown', 'original_level': -1, 'identifier': u''}
    internal_block_state = {}
    calculated_correct_levels = {}
    tag_to_block_map = {}

    # Pre-calculo mapa tag->bloco
    for block_start, block_data in block_data_by_start.items():
        for level_data in all_level_tags_data:
            # Corrigido para usar limites de CONTEUDO do bloco
            if block_data['content_start'] <= level_data['start'] < level_data['end'] <= block_data['content_end']:
                 tag_to_block_map[level_data['start']] = level_data['start'] # Mapeia inicio do tag para ele mesmo

    console.write(u"INFO: Analisando {} tags...\n".format(len(all_level_tags_data)))
    # --- LOOP PRINCIPAL (sem logs excessivos) ---
    for i, current_level_data in enumerate(all_level_tags_data):
        current_start = current_level_data['start']
        current_original_level = current_level_data['original_level']
        current_content_unicode = current_level_data['original_content_unicode']
        current_type = current_level_data['type']
        current_identifier = extract_identifier(current_content_unicode, current_type)
        correct_level = current_original_level
        final_content_unicode = current_content_unicode
        content_cleaned = False
        needs_update = False
        # Usa is_inside pre-calculado no dicionario da tag
        is_inside = current_level_data['is_inside']
        # line_num = editor.lineFromPosition(current_start) + 1 # Nao necessario se nao for logar

        if not is_inside: # FORA
            previous_correct_level = last_outer_tag_data['correct_level']
            previous_type = last_outer_tag_data['type']
            previous_original_level = last_outer_tag_data['original_level']
            previous_identifier = last_outer_tag_data['identifier']

            if previous_correct_level != -1 and previous_type != u'unknown' and current_type != u'unknown':
                # REGRA 0: Sub-ID Forcado
                if current_type == previous_type and is_direct_sub_identifier(current_identifier, previous_identifier):
                    correct_level = previous_correct_level + 1
                # REGRA 1: Original Level +1
                elif current_original_level == previous_original_level + 1:
                     correct_level = previous_correct_level + 1
                # REGRA 2: Hierarquia Padrao (Filho)
                elif previous_type in HIERARCHY and current_type in HIERARCHY.get(previous_type, {}):
                     correct_level = previous_correct_level + 1
                # REGRA 3: Mesmo Tipo (Nao Sub-ID)
                elif current_type == previous_type:
                     correct_level = previous_correct_level
                # REGRA 4: Fallback
                else:
                     correct_level = current_original_level
            else: # Primeira tag
                 correct_level = current_original_level

            calculated_correct_levels[current_start] = correct_level
            last_outer_tag_data = {'correct_level': correct_level, 'type': current_type, 'original_level': current_original_level, 'identifier': current_identifier}
            needs_update = (correct_level != current_original_level)

        else: # DENTRO
             actual_block_start = current_level_data.get('containing_block_start')
             if actual_block_start is not None:
                 outer_corrected_level = None; closest_outer_tag_start = -1;
                 for j in range(i):
                     prev_data = all_level_tags_data[j]
                     # Verifica se eh externo E tem nivel calculado E ANTECEDE o INICIO do bloco atual
                     if not prev_data.get('is_inside', True) and prev_data['start'] in calculated_correct_levels \
                       and prev_data['end'] <= actual_block_start:
                          # Pega o mais proximo
                          if prev_data['start'] > closest_outer_tag_start:
                               closest_outer_tag_start = prev_data['start']; outer_corrected_level = calculated_correct_levels[prev_data['start']]

                 if outer_corrected_level is not None:
                     block_state = internal_block_state.get(actual_block_start)
                     if block_state is None: correct_level = outer_corrected_level + 1
                     else:
                         prev_orig_internal = block_state['prev_orig']; prev_corr_internal = block_state['prev_corr'];
                         difference = current_original_level - prev_orig_internal; correct_level = prev_corr_internal + difference;
                     internal_block_state[actual_block_start] = {'prev_orig': current_original_level, 'prev_corr': correct_level}
                     # Limpeza
                     final_content_unicode = current_content_unicode; content_cleaned = False;
                     match_cleanup = MARKER_CLEANUP_PATTERN_U.match(current_content_unicode);
                     if match_cleanup:
                         if match_cleanup.group(1) is not None: final_content_unicode = u"{} {}".format(match_cleanup.group(1), (match_cleanup.group(2) or u"").strip()); content_cleaned = True;
                         elif match_cleanup.group(3): final_content_unicode = match_cleanup.group(3);
                     needs_update = (correct_level != current_original_level) or content_cleaned;
                 else: needs_update = False; correct_level = current_original_level; # Mantem original se nao achou ref
             else: needs_update = False; correct_level = current_original_level; # Mantem original se nao achou bloco pai

             calculated_correct_levels[current_start] = correct_level; # Armazena mesmo se nao ajustado

        if needs_update:
            adjustments_to_make.append({'start': current_start, 'end': current_level_data['end'],'correct_level': correct_level,'final_content_unicode': final_content_unicode,'orig_level': current_original_level,'cleaned': content_cleaned})

    console.write(u"INFO: Analise concluida. {} ajustes necessarios.\n".format(len(adjustments_to_make)))
    return adjustments_to_make

# --- Funcao Principal de Fluxo (v4.10 - chama funcao de ajuste v4.10) ---
def run_level_adjustment_flow_v4_10(): # Nome atualizado
    console.show(); console.clear()
    console.write(u"--- Iniciando Script: Ajustar Niveis (v4.10 Producao) ---\n") # Versao no log
    adjusted_count = 0
    try:
        # Bloco inicial (igual v4.7 DEBUG)
        editor_text_bytes = editor.getText();
        if not editor_text_bytes: notepad.messageBox("Doc vazio.".encode('utf-8'), "Aviso", MESSAGEBOXFLAGS.ICONINFORMATION); return;
        editor_text_unicode = decode_to_unicode(editor_text_bytes);
        if not editor_text_unicode: notepad.messageBox("Falha decode.".encode('utf-8'), "Erro", MESSAGEBOXFLAGS.ICONERROR); return;
        console.write(u"INFO: Texto decodificado.\n");
        console.write(u"INFO: Buscando tags e blocos...\n");
        all_level_matches_raw = list(LEVEL_PATTERN_B.finditer(editor_text_bytes)); num_found = len(all_level_matches_raw);
        text_block_matches_raw = list(TEXT_LEVEL_BLOCK_PATTERN_B.finditer(editor_text_bytes)); num_blocks = len(text_block_matches_raw);
        block_data_by_start = {m.start(): {'start': m.start(), 'end': m.end(), 'content_start': m.end(1), 'content_end': m.start(3)} for m in text_block_matches_raw};
        console.write(u"INFO: Encontradas {} tags {{levelX}} e {} blocos {{text_level}}.\n".format(num_found, num_blocks));
        if num_found == 0: notepad.messageBox("Nenhuma tag {{levelX}}.".encode('utf-8'), "Info", MESSAGEBOXFLAGS.ICONINFORMATION); return;

        # Pre-processamento (igual v4.7 DEBUG)
        all_level_tags_data = []; console.write(u"INFO: Pre-processando tags...\n");
        for i, match in enumerate(all_level_matches_raw):
            level_num = None; content_unicode = u""; tag_type = u'unknown';
            try: level_num = int(match.group(2));
            except ValueError: console.write(u"  AVISO: Lvl invalido Pos {}. Ignorando.\n".format(match.start())); continue;
            content_unicode = decode_to_unicode(match.group(4)); tag_type = get_tag_type(content_unicode);
            is_inside = False; containing_block_start = None; match_start, match_end = match.start(), match.end();
            for b_start, b_data in block_data_by_start.items():
                 if b_data['content_start'] <= match_start < match_end <= b_data['content_end']: is_inside = True; containing_block_start = b_start; break;
            all_level_tags_data.append({'index': i, 'start': match_start, 'end': match_end, 'original_level': level_num, 'original_content_unicode': content_unicode, 'type': tag_type, 'is_inside': is_inside, 'containing_block_start': containing_block_start});
        console.write(u"INFO: Pre-processamento concluido.\n");

        # --- Calcular Ajustes (Chama v4.10) ---
        adjustments_to_make = perform_level_adjustment_v4_10(all_level_tags_data, block_data_by_start)

        if not adjustments_to_make:
            console.write(u"INFO: Nenhum ajuste necessario.\n");
            notepad.messageBox("Nenhum ajuste necessario.".encode('utf-8'), "Concluido", MESSAGEBOXFLAGS.ICONINFORMATION);
            return;

        # --- Confirmacao (igual v4.7 DEBUG, nome atualizado) ---
        console.write(u"INFO: {} ajustes a serem feitos.\n".format(len(adjustments_to_make)))
        confirm_msg = u"Foram encontrados {} ajustes potenciais.\n\nAplicar os ajustes (v4.10)?".format(len(adjustments_to_make)).encode('utf-8')
        user_choice = notepad.messageBox(confirm_msg, "Confirmar Ajuste v4.10", MESSAGEBOXFLAGS.YESNO | MESSAGEBOXFLAGS.ICONQUESTION | MESSAGEBOXFLAGS.DEFBUTTON2)

        if user_choice == 6: # IDYES
            console.write(u"\nINFO: Usuario confirmou. Aplicando {} ajustes...\n".format(len(adjustments_to_make)))
            # --- Aplicar Ajustes (igual v4.7 DEBUG) ---
            editor.beginUndoAction();
            try:
                adjustments_to_make.sort(key=lambda x: x['start'], reverse=True);
                for adj in adjustments_to_make:
                    replacement_text_unicode = u"{{{{level{}}}}}{}{{{{-level{}}}}}".format(adj['correct_level'], adj['final_content_unicode'], adj['correct_level']);
                    # Log apenas dos ajustes sendo feitos
                    line_num_adj = editor.lineFromPosition(adj['start']) + 1;
                    console.write(u"  - AJUSTANDO Linha {}, Pos {}: Lvl {}->{}, Cleaned={}\n".format(line_num_adj, adj['start'], adj['orig_level'], adj['correct_level'], adj['cleaned']));
                    editor.setTargetStart(adj['start']); editor.setTargetEnd(adj['end']);
                    editor.replaceTarget(replacement_text_unicode.encode('utf-8'));
                    adjusted_count += 1;
                console.write(u"\n--- AJUSTE CONCLUIDO (v4.10) ---\n");
                console.write(u"INFO: {} tags ajustadas.\n".format(adjusted_count));
                editor.endUndoAction();
                msg = u"Ajuste v4.10 concluído!\n\n{} tags ajustadas.".format(adjusted_count).encode('utf-8');
                notepad.messageBox(msg, "Sucesso", MESSAGEBOXFLAGS.ICONINFORMATION);
            except Exception as e:
                editor.endUndoAction(); console.write(u"\n!!! ERRO CRITICO DURANTE APLICACAO !!!\n");
                console.write(traceback.format_exc() + u"\n");
                error_message_box = u"Erro CRITICO aplicacao! Ver Console.\nErro: {}".format(unicode(e)).encode('utf-8');
                notepad.messageBox(error_message_box, "Erro Grave Ajuste", MESSAGEBOXFLAGS.ICONERROR);
        else: # NAO
            notepad.messageBox("Operacao cancelada.".encode('utf-8'), "Cancelado", MESSAGEBOXFLAGS.ICONINFORMATION);
            console.write(u"INFO: Operacao cancelada. Nenhum ajuste feito.\n");
    except Exception as e:
        console.write(u"\n--- ERRO INESPERADO FLUXO PRINCIPAL (v4.10) ---\n");
        console.write(traceback.format_exc() + u"\n");
        notepad.messageBox("Erro inesperado script. Ver Console.".encode('utf-8'), "Erro Grave", MESSAGEBOXFLAGS.ICONERROR);
    finally:
        console.write(u"\n--- Fim da execucao Script (v4.10) ---\n");

# --- Ponto de Entrada ---
if __name__ == '__main__':
    run_level_adjustment_flow_v4_10()