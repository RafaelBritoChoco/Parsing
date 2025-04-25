# -*- coding: utf-8 -*-
from Npp import editor, notepad
import re

# Python 2.7 Compatibility Note: Use u'', .decode, .encode, re.UNICODE

# ======================
# CONSTANTS & KEYWORDS & TYPES
# ======================
# (Constants, Keywords, Types remain the same as V6)
HEADING_KEYWORDS_UPPER_CANONICAL = [
    u"PART", u"BOOK", u"ANNEX", u"APPENDIX", u"SCHEDULE", u"PREAMBLE", u"CHAPTER", u"DIVISION", u"SUBPART",
    u"PARTE", u"LIBRO", u"ANEXO", u"APÉNDICE", u"PREÁMBULO", u"CAPÍTULO", u"DIVISIÓN", u"SUBPARTE",
    u"PARTE", u"LIVRO", u"ANEXO", u"APÊNDICE", u"PREÂMBULO", u"CAPÍTULO", u"DIVISÃO", u"SUBPARTE",
    u"PARTIE", u"LIVRE", u"ANNEXE", u"APPENDICE", u"PRÉAMBULE", u"CHAPITRE", u"DIVISION", u"SOUS-PARTIE",
    u"TEIL", u"BUCH", u"ANHANG", u"ANLAGE", u"KAPITEL", u"UNTERTEIL",
]
HEADING_KEYWORDS_TITLE_CANONICAL = [
    u"Title", u"Section", u"Subsection", u"Article", u"Clause", u"Regulation", u"Rule", u"Order", u"Paragraph",
    u"Título", u"Sección", u"Subsección", u"Artículo", u"Cláusula", u"Reglamento", u"Regla", u"Orden", u"Párrafo", u"Apartado",
    u"Título", u"Secção", u"Seção", u"Subsecção", u"Subseção", u"Artigo", u"Cláusula", u"Regulamento", u"Regra", u"Ordem", u"Parágrafo", u"Art.",
    u"Titre", u"Section", u"Sous-section", u"Article", u"Clause", u"Règlement", u"Règle", u"Ordonnance", u"Paragraphe",
    u"Titel", u"Abschnitt", u"Unterabschnitt", u"Artikel", u"Klausel", u"Regelung", u"Verordnung", u"Regel", u"Anordnung", u"Paragraph", u"Absatz"
]
EXTRA_KEYWORDS_EITHER_CASE = [
    u"SECTION", u"ARTICLE", u"TITLE", u"TÍTULO", u"SECCIÓN", u"SECÇÃO", u"ARTÍCULO", u"ARTIGO",
    u"Chapter", u"Division"
]
DETECT_KEYWORDS_UPPER = set(k.lower() for k in HEADING_KEYWORDS_UPPER_CANONICAL + EXTRA_KEYWORDS_EITHER_CASE)
DETECT_KEYWORDS_TITLE = set(k.lower() for k in HEADING_KEYWORDS_TITLE_CANONICAL + EXTRA_KEYWORDS_EITHER_CASE)
ALL_DETECT_KEYWORDS = DETECT_KEYWORDS_UPPER.union(DETECT_KEYWORDS_TITLE)
AMBIGUOUS_TITLE_KEYWORDS = {u'rule', u'order', u'paragraph', u'clause', u'regulation'}

PREAMBLE_INTRO_PHRASES=[u"Members,"]
PREAMBLE_CLAUSE_STARTERS=[
    u"Noting", u"Considering", u"Recognizing", u"Recognising", u"Recalling", u"Desiring",
    u"Affirming", u"Having carried out", u"Striving", u"Believing", u"Whereas",
    u"The Governments of", u"The Parties",
    u"Conscious of", u"Mindful of", u"Reaffirming"
]
TRANSITIONAL_PHRASES=[
    u"Hereby agree as follows:", u"Have agreed as follows:", u"The Parties hereby agree as follows:",
    u"Agree as follows:", u"Adopt the following provisions:"
]
DETECT_TRANSITIONAL_PHRASES_LOWER=set(p.lower() for p in TRANSITIONAL_PHRASES)

# --- Line Types ---
LT_PREAMBLE_HEAD = u"PREAMBLE_HEAD"; LT_PREAMBLE_INTRO = u"PREAMBLE_INTRO"; LT_PREAMBLE_CLAUSE = u"PREAMBLE_CLAUSE"
LT_TRANSITIONAL = u"TRANSITIONAL"; LT_HEADING_UPPER = u"HEADING_UPPER"; LT_HEADING_TITLE = u"HEADING_TITLE"
LT_HEADING_DESC = u"HEADING_DESC"; LT_NUMBERED_PARA_HEAD = u"NUMBERED_PARA_HEAD"; LT_ENUM_MARKER = u"ENUM_MARKER"
LT_NUM_MARKER = u"NUM_MARKER"; LT_ENUM_ITEM = u"ENUM_ITEM"; LT_NUMBERED_ITEM = u"NUMBERED_ITEM"
LT_FOOTNOTE_BLOCK = u"FOOTNOTE_BLOCK"; LT_ENDS_COLON = u"ENDS_COLON"; LT_REGULAR = u"REGULAR"
LT_BLANK = u"BLANK"; LT_CONSUMED = u"CONSUMED"; LT_UNKNOWN = u"UNKNOWN";
LT_SPLIT_MARKER_PARENT = u"SPLIT_MARKER_PARENT"

# Types considered major structural elements that would prevent merging a previous line as a title
MAJOR_STRUCTURAL_TYPES = {
    LT_HEADING_UPPER, LT_HEADING_TITLE, LT_PREAMBLE_HEAD, LT_TRANSITIONAL,
    LT_SPLIT_MARKER_PARENT # Parent part of a split line also acts as structure start
}


# --- Compiled Regex ---
# (Regex remain the same as V6)
RE_FOOTNOTE_BLOCK=re.compile(ur'^\s*\d+\s+["“].*',re.UNICODE)
RE_NUMBERED_ITEM=re.compile(ur'^\s*(?:\d+(?:\.\d+)*\.|\(\d+\))\s+\S+',re.UNICODE)
RE_NUM_MARKER=re.compile(ur'^\s*(?:\d+(?:\.\d+)*\.|\(\d+\))\s*$',re.UNICODE)
RE_NUMBERED_PARA_HEAD_MARKER=re.compile(ur'^\s*(?:\d+|[IVXLCDM]+)\.\s*$',re.IGNORECASE|re.UNICODE)
RE_ENUM_ITEM=re.compile(ur"""
    ^\s*(?: \([a-zA-Z]{1,2}\) | \([ivxlcdm]+\) | \([IVXLCDM]+\) |
             [a-zA-Z]{1,2}\. | [ivxlcdm]+\. | [IVXLCDM]+\. )\s+\S+
    """,re.VERBOSE|re.IGNORECASE|re.UNICODE)
RE_ENUM_MARKER=re.compile(ur"""
    ^\s*(?: \([a-zA-Z]{1,2}\) | \([ivxlcdm]+\) | \([IVXLCDM]+\) |
             [a-zA-Z]{1,2}\. | [ivxlcdm]+\. | [IVXLCDM]+\. )\s*$
    """,re.VERBOSE|re.IGNORECASE|re.UNICODE)
RE_FIND_FIRST_ID_PATTERN=re.compile(ur"""
    ( \d+(?:\.\d+)* | [IVXLCDM]+ | [A-Z] )
    (?=[\s\.:\-]|$)
    """,re.IGNORECASE|re.UNICODE|re.VERBOSE)
RE_ITEM_MARKER_START=re.compile(ur'^\s*(\(?[a-zA-Z0-9]+\)|[a-zA-Z]{1,2}\.|[ivxlcdm]+\.|[IVXLCDM]+\.|\d+\.)',re.IGNORECASE|re.UNICODE)
RE_SPLIT_NUMBER_ENUM=re.compile(ur"""
    ^           # Start of line
    \s*         # Optional leading space
    ( \d+\. )   # Group 1: Number marker (e.g., "6.")
    \s+         # One or more spaces BETWEEN markers
    ( \( [a-zA-Z]{1,2} \) ) # Group 2: Enum marker (e.g., "(a)")
    \s+         # One or more spaces AFTER enum marker
    ( .* )      # Group 3: The rest of the line (content)
    $           # End of line
    """, re.VERBOSE | re.UNICODE | re.IGNORECASE)
RE_HEADING_ONLY_KEY_ID = re.compile(ur"""
    ^                 # Start of line
    \s*               # Optional leading space
    ([a-zA-ZÁÉÍÓÚÑÜÇÀÂÊÎÔÛÄËÏÖÜáéíóúñüçàâêîôûäëïöü]+) # Keyword (Group 1)
    \s+               # Space(s)
    ([0-9IVXLCDM]+     # ID: number or Roman (Group 2)
     (?:\.[0-9]+)*)   # Optional sub-numbers like .1 .2
    (?:\s*[:.\-–]?\s*$) # Optional space, colon, dot, hyphen, en-dash, then end of line
    """, re.VERBOSE | re.UNICODE | re.IGNORECASE)


# ======================
# HELPER FUNCTIONS
# ======================
# (is_pure_number, format_heading_text, ensure_blank_lines_before,
#  heading_contains_only_keyword_and_id remain the same as V6)
def is_pure_number(line):
    return bool(re.match(ur'^[0-9]+$', line.strip()))

def format_heading_text(original_line, line_type):
    return original_line.strip()

def ensure_blank_lines_before(output_list, n):
    can_add_initial = not output_list
    while output_list and output_list[-1].strip() == u"": output_list.pop()
    if output_list or (can_add_initial and n > 0):
         for _ in range(n): output_list.append(u"")

def heading_contains_only_keyword_and_id(heading_text):
    return bool(RE_HEADING_ONLY_KEY_ID.match(heading_text.strip()))

def identify_line_type(line, previous_line_type=None):
    # (Function remains the same as V6)
    stripped = line.strip(); lower_stripped = stripped.lower()
    if not stripped: return LT_BLANK
    if lower_stripped == u"preamble": return LT_PREAMBLE_HEAD
    for phrase in PREAMBLE_INTRO_PHRASES:
        if stripped == phrase: return LT_PREAMBLE_INTRO
    if lower_stripped in DETECT_TRANSITIONAL_PHRASES_LOWER: return LT_TRANSITIONAL
    is_preamble_context = previous_line_type in [LT_PREAMBLE_HEAD, LT_PREAMBLE_INTRO, LT_PREAMBLE_CLAUSE]
    if is_preamble_context:
        for word in PREAMBLE_CLAUSE_STARTERS:
            if stripped.startswith(word + u" ") and not RE_ENUM_ITEM.match(stripped) and not RE_NUMBERED_ITEM.match(stripped) :
                 first_word_lower_check = stripped.split(None, 1)[0].lower()
                 if first_word_lower_check not in ALL_DETECT_KEYWORDS: return LT_PREAMBLE_CLAUSE
    parts = stripped.split(None, 1); first_word_lower = parts[0].lower() if parts else ""
    heading_type = None; longest_keyword_match = 0
    if first_word_lower in ALL_DETECT_KEYWORDS:
        best_kw_lower = ""
        for kw_lower in ALL_DETECT_KEYWORDS:
            if lower_stripped.startswith(kw_lower):
                kw_len = len(kw_lower)
                if len(stripped) == kw_len or stripped[kw_len:kw_len+1].isspace() or stripped[kw_len:kw_len+1] == u'-':
                     if kw_len > longest_keyword_match:
                         longest_keyword_match = kw_len
                         best_kw_lower = kw_lower
        if best_kw_lower:
             if best_kw_lower in DETECT_KEYWORDS_UPPER: heading_type = LT_HEADING_UPPER
             elif best_kw_lower in DETECT_KEYWORDS_TITLE: heading_type = LT_HEADING_TITLE
             else: heading_type = LT_HEADING_TITLE
    if heading_type:
        looks_like_item = RE_ENUM_ITEM.match(stripped) or RE_NUMBERED_ITEM.match(stripped)
        is_short_keyword = longest_keyword_match <= 2
        if looks_like_item and is_short_keyword: heading_type = None
        elif first_word_lower in AMBIGUOUS_TITLE_KEYWORDS:
            if not (RE_HEADING_ONLY_KEY_ID.match(stripped) or stripped.lower() == first_word_lower):
                heading_type = None
    if heading_type: return heading_type
    if RE_ENUM_MARKER.match(stripped): return LT_ENUM_MARKER
    if RE_NUMBERED_PARA_HEAD_MARKER.match(stripped): return LT_NUMBERED_PARA_HEAD
    if RE_NUM_MARKER.match(stripped): return LT_NUM_MARKER
    if RE_FOOTNOTE_BLOCK.match(stripped): return LT_FOOTNOTE_BLOCK
    if RE_ENUM_ITEM.match(stripped): return LT_ENUM_ITEM
    if RE_NUMBERED_ITEM.match(stripped): return LT_NUMBERED_ITEM
    if stripped.endswith(u':'): return LT_ENDS_COLON
    if is_preamble_context:
         potential_marker = stripped.split(None,1)[0] + '.' if stripped else ''
         if not RE_NUMBERED_PARA_HEAD_MARKER.match(potential_marker): return LT_PREAMBLE_CLAUSE
    return LT_REGULAR

# ======================
# MAIN FUNCTION
# ======================
def main():
    # --- Input ---
    try:
        raw_text_bytes = editor.getText()
        raw_lines_unicode = raw_text_bytes.decode('utf-8').splitlines()
    except Exception as e:
        notepad.messageBox(u"Erro leitura/decode (UTF-8): {}".format(e), u"Erro")
        return

    # --- Optional Preprocessing ---
    # ... (Keep commented unless needed)

    # --- Pass 0: Store Original Lines ---
    original_lines = {i: line for i, line in enumerate(raw_lines_unicode)}

    # --- Pass 1: Initial Identification ---
    # (No changes needed from V6)
    processed_lines_data = []
    last_line_type_identified = None
    for i, line in enumerate(raw_lines_unicode):
        if is_pure_number(line): continue
        stripped_line = line.strip()
        if not stripped_line: continue
        split_match = RE_SPLIT_NUMBER_ENUM.match(stripped_line)
        if split_match:
            num_marker = split_match.group(1).strip()
            enum_marker = split_match.group(2).strip()
            content = split_match.group(3).strip()
            num_info = {'text': num_marker, 'type': LT_SPLIT_MARKER_PARENT, 'original_index': i, 'merged_into_prev': False, 'consumes_next': False, 'is_heading': False, 'was_split': True}
            processed_lines_data.append(num_info)
            last_line_type_identified = num_info['type']
            enum_text = enum_marker + u" " + content
            enum_info = {'text': enum_text, 'type': LT_ENUM_ITEM, 'original_index': i, 'merged_into_prev': False, 'consumes_next': False, 'is_heading': False, 'was_split': True}
            processed_lines_data.append(enum_info)
            last_line_type_identified = enum_info['type']
            continue
        line_type = identify_line_type(line, last_line_type_identified)
        processed_text = stripped_line
        processed_lines_data.append({'text': processed_text, 'type': line_type, 'original_index': i, 'merged_into_prev': False, 'consumes_next': False, 'is_heading': line_type in [LT_HEADING_UPPER, LT_HEADING_TITLE], 'was_split': False})
        last_line_type_identified = line_type

    # --- Pass 2: Merge Markers ---
    # (No changes needed from V6, logic seems sound)
    line_count = len(processed_lines_data)
    i = 0
    while i < line_count:
        current_info = processed_lines_data[i]
        if current_info['merged_into_prev']: i += 1; continue
        mergeable_marker_types = [LT_ENUM_MARKER, LT_NUM_MARKER, LT_NUMBERED_PARA_HEAD]
        if current_info['type'] in mergeable_marker_types and current_info['type'] != LT_SPLIT_MARKER_PARENT:
            next_text_info = None; next_line_index = -1
            for j in range(i + 1, line_count):
                if not processed_lines_data[j]['merged_into_prev']: next_line_index = j; break
            if next_line_index != -1:
                potential_next = processed_lines_data[next_line_index]
                non_merge_types = {LT_HEADING_UPPER, LT_HEADING_TITLE, LT_PREAMBLE_HEAD, LT_PREAMBLE_INTRO, LT_PREAMBLE_CLAUSE, LT_TRANSITIONAL, LT_NUMBERED_PARA_HEAD, LT_ENUM_MARKER, LT_NUM_MARKER, LT_ENUM_ITEM, LT_NUMBERED_ITEM, LT_FOOTNOTE_BLOCK, LT_SPLIT_MARKER_PARENT}
                if potential_next['type'] not in non_merge_types:
                     merge_text_candidate = potential_next['text']
                     if merge_text_candidate: next_text_info = potential_next
            if next_text_info:
                 merge_text = next_text_info['text']
                 current_info['text'] = current_info['text'] + u" " + merge_text
                 if current_info['type'] == LT_ENUM_MARKER: current_info['type'] = LT_ENUM_ITEM
                 elif current_info['type'] in [LT_NUM_MARKER, LT_NUMBERED_PARA_HEAD]: current_info['type'] = LT_NUMBERED_ITEM
                 next_text_info['merged_into_prev'] = True; current_info['consumes_next'] = True
                 i += 1 # Skip merged line
        i += 1

    # --- Pass 2.5: Merge Descriptions (REVISED HEURISTIC V7 - Lookahead) ---
    i = 0
    while i < line_count:
         current_info = processed_lines_data[i]

         # Step 1: Basic Skip Conditions
         if current_info['merged_into_prev'] or not current_info['is_heading']:
             i += 1; continue

         # Step 2: Check if Heading is Complete
         if not heading_contains_only_keyword_and_id(current_info['text']):
             i += 1; continue # Heading already has text, skip merge attempt

         # --- Heading is likely just "Keyword ID". Look ahead. ---

         # Step 3: Find the line immediately following the heading
         potential_desc_index = -1
         for j in range(i + 1, line_count):
             if not processed_lines_data[j]['merged_into_prev']:
                 potential_desc_index = j
                 break

         if potential_desc_index == -1: # No line follows
             i += 1; continue

         potential_desc_info = processed_lines_data[potential_desc_index]
         potential_desc_text = potential_desc_info['text']

         # Step 4: Basic checks on the potential description line
         #          (Must exist, not be item marker, not start with heading keyword)
         if not potential_desc_text or \
            RE_ITEM_MARKER_START.match(potential_desc_text) or \
            potential_desc_text.split(None, 1)[0].lower() in ALL_DETECT_KEYWORDS:
              i += 1; continue # This line isn't a candidate for merging

         # Step 5: Look *beyond* the potential description
         after_desc_index = -1
         for j in range(potential_desc_index + 1, line_count):
             if not processed_lines_data[j]['merged_into_prev']:
                 after_desc_index = j
                 break

         # Step 6: The V7 Merge Decision
         should_merge = True # Assume we merge unless proven otherwise
         if after_desc_index == -1:
              # potential_desc was the LAST line of the document. Treat as content.
              should_merge = False
         else:
              after_desc_info = processed_lines_data[after_desc_index]
              # If the line AFTER potential_desc is a major structure,
              # then potential_desc was likely the *only* content. Don't merge.
              if after_desc_info['type'] in MAJOR_STRUCTURAL_TYPES:
                   should_merge = False

         # Step 7: Perform Merge only if the lookahead check passed
         if should_merge:
             # Additional check: ensure potential_desc is likely regular text
             # This prevents merging things wrongly classified if Pass 1 had issues
             if potential_desc_info['type'] == LT_REGULAR or potential_desc_info['type'] == LT_ENDS_COLON:
                 current_info['text'] += u" " + potential_desc_text
                 potential_desc_info['merged_into_prev'] = True
                 current_info['consumes_next'] = True
                 i += 1 # Increment to skip the consumed description line

         # Step 8: Move to the next line in the main loop
         i += 1


    # --- Pass 3: Apply Spacing ---
    # (No changes needed from V6)
    final_output = []
    last_added_info = None
    HEADINGS_ALL = {LT_HEADING_UPPER, LT_HEADING_TITLE, LT_PREAMBLE_HEAD} # Use set for efficiency
    ALL_ITEM_TYPES = {LT_ENUM_ITEM, LT_NUMBERED_ITEM, LT_FOOTNOTE_BLOCK}
    PREAMBLE_ELEMENTS = {LT_PREAMBLE_INTRO, LT_PREAMBLE_CLAUSE}
    EFFECTIVE_HEADINGS = HEADINGS_ALL.union({LT_SPLIT_MARKER_PARENT}) # Combine heading types

    line_count = len(processed_lines_data)
    for i in range(line_count):
        current_info = processed_lines_data[i]
        if current_info['merged_into_prev']: continue
        current_text = current_info['text']; current_type = current_info['type']
        num_blanks_needed = 0
        if not final_output:
            if current_type in EFFECTIVE_HEADINGS: num_blanks_needed = 2
            elif current_type in ALL_ITEM_TYPES or current_type in PREAMBLE_ELEMENTS or current_type == LT_TRANSITIONAL: num_blanks_needed = 1
            else: num_blanks_needed = 0
        else:
            last_type = last_added_info['type']
            last_text = last_added_info['text']
            last_was_split_parent = (last_type == LT_SPLIT_MARKER_PARENT)
            current_is_split_child = (current_type == LT_ENUM_ITEM and current_info.get('was_split', False))

            if last_was_split_parent and current_is_split_child: num_blanks_needed = 0
            else:
                 num_blanks_needed = 1
                 if current_type in EFFECTIVE_HEADINGS:
                     if last_type not in EFFECTIVE_HEADINGS and last_type != LT_TRANSITIONAL: num_blanks_needed = 2
                 elif current_type in ALL_ITEM_TYPES: num_blanks_needed = max(num_blanks_needed, 1)
                 elif current_type in [LT_REGULAR, LT_ENDS_COLON]:
                      block_ending_types = EFFECTIVE_HEADINGS.union(PREAMBLE_ELEMENTS).union(ALL_ITEM_TYPES).union({LT_TRANSITIONAL, LT_ENDS_COLON})
                      if last_type in block_ending_types: num_blanks_needed = max(num_blanks_needed, 1)
                      else: num_blanks_needed = max(num_blanks_needed, 1) # Default to 1
        ensure_blank_lines_before(final_output, num_blanks_needed)
        final_output.append(current_text)
        last_added_info = current_info


    # --- Final Cleanup & Trailing Space ---
    # (No changes needed from V6)
    while final_output and final_output[0].strip() == u"": final_output.pop(0)
    while final_output and final_output[-1].strip() == u"": final_output.pop()
    final_output_processed = []
    for line in final_output:
        if line.strip() == u"": final_output_processed.append(u"")
        else: final_output_processed.append(line + u" ")

    # --- Set Text in Editor ---
    # (No changes needed from V6)
    try:
        final_text_unicode = u"\n".join(final_output_processed)
        final_text_bytes = final_text_unicode.encode('utf-8')
        editor.beginUndoAction(); editor.setText(final_text_bytes); editor.endUndoAction()
    except Exception as e:
        notepad.messageBox(u"Erro ao definir texto final (UTF-8): {}".format(e), u"Erro"); return

    # --- Confirmation ---
    notepad.messageBox(u"Done (V7 Logic)", u"Formatting Complete")

if __name__ == '__main__':
    main()