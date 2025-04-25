# -*- coding: utf-8 -*-
from Npp import *
import re
import traceback

# =======================================================
# RENUMBER FOOTNOTES - v_FINAL_7 (Log All, Line Num, Ask Fix)
# =======================================================
# OBJECTIVE: Renumber footnotes sequentially from 1.
# PATTERN: Finds {{num1}}num2{{-anynum}} structure.
# NEW: Logs ALL found matches for review.
# NEW: Detects sequence breaks, reporting the LINE number.
# NEW: Asks user if they want to FORCE renumbering (1 to N) if sequence is broken.
# NEW: All user messages and logs are in English.
# FIX: Encodes MessageBox text for Python 2 compatibility.
# =======================================================

# Regex captures:
# Group 1: Number inside START tag {{footnotenumber(\d+)}}
# Group 2: Number BETWEEN tags }}(\d+){{  <-- USED FOR SEQUENCE CHECK
# Matches end tag with ANY number: {{-footnotenumber\d+}}
FOOTNOTE_PATTERN_FIND = r"\{\{footnotenumber(\d+)\}\}(\d+)\{\{-footnotenumber\d+\}\}"


def safe_decode(byte_string):
    """Safely decode bytes to string (unicode in Py2, str in Py3)."""
    if isinstance(byte_string, str): return byte_string
    try: return byte_string.decode('utf-8', 'ignore')
    except Exception: return "[Encoding Error]"

def check_sequence_and_find_break(matches_list):
    """
    Checks if the middle numbers (Group 2) form a sequence 1, 2, 3...
    Reports break using LINE NUMBER.
    Returns details of the first break found, or None if contiguous.
    """
    console.write(u"--- Checking original footnote number sequence (using middle number) ---\n")
    if not matches_list:
        console.write(u"INFO: No footnotes found to check sequence.\n")
        return None

    first_break_info = None
    for i, match in enumerate(matches_list):
        expected_number = i + 1
        start_pos = match.start() # Get position for line number lookup

        try:
            # Use Group 2 (the number BETWEEN the tags) for sequence check
            found_number_str = match.group(2)
            found_number = int(found_number_str)
        except (IndexError, ValueError):
            # Try to get line number even if number extraction fails
            line_num = editor.lineFromPosition(start_pos) + 1 # Get 1-based line number
            console.write(u"ERROR: Failed to read middle number in footnote on Line {} (Pos {})! Match: '{}'\n".format(
                line_num, start_pos, safe_decode(match.group(0))))
            found_number = -1 # Mark as invalid

        if found_number != expected_number:
            line_num = editor.lineFromPosition(start_pos) + 1 # Get 1-based line number
            console.write(u"WARNING: Sequence break detected!\n")
            console.write(u"  - On Line Number  : {}\n".format(line_num))
            console.write(u"  - Expected number : {}\n".format(expected_number))
            console.write(u"  - Found middle num: {} in tag '{}'\n".format(found_number if found_number != -1 else "[Read Error]", safe_decode(match.group(0))))

            first_break_info = {
                "expected": expected_number,
                "found": found_number if found_number != -1 else "[Read Error]",
                "position": start_pos, # Keep position internally
                "line_number": line_num, # Store the user-friendly line number
                "text": safe_decode(match.group(0))
            }
            break # Stop checking after the first break

    if first_break_info:
        console.write(u"--- Sequence Check Finished: Original sequence is BROKEN. ---\n")
    else:
        console.write(u"--- Sequence Check Finished: Original sequence (1 to {}) appears OK.\n".format(len(matches_list)))

    return first_break_info

def perform_footnote_renumbering(matches_list):
    """Forces renumbering of footnotes sequentially from 1."""
    num_to_renumber = len(matches_list)
    console.write(u"--- Starting Forced Sequential Renumbering (v_final_7) ---\n")
    console.write(u"Processing {} footnotes BACKWARDS (forcing 1 to {})\n".format(num_to_renumber, num_to_renumber))
    renumbered_count = 0

    editor.beginUndoAction()
    try:
        for i in range(num_to_renumber - 1, -1, -1):
            match_object = matches_list[i]
            correct_sequential_number = i + 1
            # Create the perfectly formatted replacement tag
            replacement_text = "{{{{footnotenumber{0}}}}}{0}{{{{-footnotenumber{0}}}}}".format(correct_sequential_number)

            start_pos = match_object.start()
            end_pos = match_object.end()

            # Perform the replacement
            editor.setTargetStart(start_pos)
            editor.setTargetEnd(end_pos)
            editor.replaceTarget(str(replacement_text)) # Ensure string type
            renumbered_count += 1

        console.write(u"\n--- Renumbering Complete ---\n")
        console.write(u"INFO: {} footnotes renumbered sequentially (1 to {}).\n".format(renumbered_count, num_to_renumber))
        editor.endUndoAction()
        return True

    except Exception as e:
        editor.endUndoAction()
        console.write(u"\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")
        console.write(u"!!! CRITICAL ERROR DURING REPLACEMENT !!!\n")
        failed_index_msg = u"The error likely occurred near the end of processing."
        try: failed_index_msg = u"The error likely occurred while processing original index {} (intended new number {})".format(i, correct_sequential_number)
        except NameError: pass
        console.write(failed_index_msg + u"\n")
        console.write(u"Error Traceback:\n")
        console.write(traceback.format_exc() + u"\n")
        console.write(u"!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")

        error_details = safe_decode(str(e))
        error_message_box = u"CRITICAL Error during replacement! See CONSOLE.\n{}".format(error_details)
        # Encode message for Python 2's messageBox
        try:
             error_message_encoded = error_message_box.encode('utf-8')
             notepad.messageBox(error_message_encoded, "Renumbering Failed", MESSAGEBOXFLAGS.ICONERROR)
        except NameError: # Handles Python 3
             notepad.messageBox(error_message_box, "Renumbering Failed", MESSAGEBOXFLAGS.ICONERROR)
        except Exception as mb_err:
             console.write(u"ERROR displaying Renumbering Failed messagebox: {}\n".format(mb_err))
             print("Renumbering Failed MessageBox Error: {}".format(mb_err))

        console.write(u"WARNING: Use Ctrl+Z to try and undo any partial changes.\n")
        return False

def run_renumber_flow():
    """Main function: find, log all, check sequence (line num), ask, renumber."""
    console.show()
    console.clear()
    console.write(u"--- Starting Script: Renumber Footnotes (v_final_7) ---\n")
    console.write(u"Searching for pattern: {}\n".format(FOOTNOTE_PATTERN_FIND))

    try:
        # 1. Get Text
        console.write(u"INFO: Getting text from the currently active editor tab...\n")
        editor_text_bytes = editor.getText()
        editor_text_unicode = safe_decode(editor_text_bytes)
        console.write(u"INFO: Text length = {}. Checking content...\n".format(len(editor_text_unicode)))

        if not editor_text_unicode:
            msg_unicode = u"The current document is empty."
            try: notepad.messageBox(msg_unicode.encode('utf-8'), "Empty Document", MESSAGEBOXFLAGS.ICONWARNING)
            except NameError: notepad.messageBox(msg_unicode, "Empty Document", MESSAGEBOXFLAGS.ICONWARNING)
            console.write(u"WARNING: Document is empty.\n")
            return

        # 2. Find Matches
        console.write(u"INFO: Finding all potential footnote occurrences...\n")
        matches_list = list(re.finditer(FOOTNOTE_PATTERN_FIND, editor_text_unicode))
        num_found = len(matches_list)
        console.write(u"INFO: Search complete. Found {} potential occurrences.\n".format(num_found))

        # 3. Log All Found Matches (if any)
        if num_found > 0:
            console.write(u"\n--- List of ALL {} Found Footnotes ---\n".format(num_found))
            for i, match in enumerate(matches_list):
                try:
                    g1 = match.group(1) # Num in start tag
                    g2 = match.group(2) # Num in middle
                except IndexError:
                    g1, g2 = "[err]", "[err]"
                console.write(u"  {:>3}: Pos {:<8} Line {:<5} StartTagNum: {:<3} MiddleNum: {:<3} Text: '{}'\n".format(
                    i + 1,
                    match.start(),
                    editor.lineFromPosition(match.start()) + 1, # Get line number here too
                    g1,
                    g2,
                    safe_decode(match.group(0))
                ))
            console.write(u"--- End of Found Footnotes List ---\n\n")
        else:
             # If zero found now, something is still wrong
            msg_unicode = u"No footnotes matching the pattern were found.\nPattern: {}".format(FOOTNOTE_PATTERN_FIND)
            try: notepad.messageBox(msg_unicode.encode('utf-8'), "No Footnotes Found", MESSAGEBOXFLAGS.ICONINFORMATION)
            except NameError: notepad.messageBox(msg_unicode, "No Footnotes Found", MESSAGEBOXFLAGS.ICONINFORMATION)
            console.write(u"INFO: No matching footnotes found. Check pattern and file content.\n")
            return

        # 4. Perform Sequence Check (using middle number, reporting line number)
        sequence_break_info = check_sequence_and_find_break(matches_list)

        # 5. Ask User for Confirmation (handling sequence break)
        proceed_renumber = False
        if sequence_break_info:
            # Sequence is broken, ask user if they want to force it
            console.write(u"ACTION: Asking user whether to force renumbering due to sequence break.\n")
            warning_msg_unicode = (u"WARNING: Found {} footnotes, but the original numbering is NOT sequential!\n\n"
                                   u"First break detected around Line {}:\n"
                                   u"  Expected number: {}\n"
                                   u"  Found middle number: {}\n\n"
                                   u"Do you want to IGNORE the original numbers and FORCE renumbering sequentially from 1 to {}?"
                                   ).format(num_found,
                                            sequence_break_info["line_number"], # Use line number
                                            sequence_break_info["expected"],
                                            sequence_break_info["found"],
                                            num_found)
            try:
                warning_msg_bytes = warning_msg_unicode.encode('utf-8')
                user_choice_on_break = notepad.messageBox(warning_msg_bytes, "Broken Sequence Detected", MESSAGEBOXFLAGS.YESNO | MESSAGEBOXFLAGS.ICONWARNING)
            except NameError: # Python 3
                user_choice_on_break = notepad.messageBox(warning_msg_unicode, "Broken Sequence Detected", MESSAGEBOXFLAGS.YESNO | MESSAGEBOXFLAGS.ICONWARNING)
            except Exception as mb_err:
                 console.write(u"ERROR showing Broken Sequence messagebox: {}\n".format(mb_err))
                 user_choice_on_break = 7 # Default to NO if messagebox fails

            if user_choice_on_break == 6: # IDYES
                console.write(u"INFO: User chose YES to force renumbering despite broken sequence.\n")
                proceed_renumber = True
            else:
                console.write(u"INFO: User chose NO to forcing renumbering (return code {}).\n".format(user_choice_on_break))
                cancel_msg_unicode = u"Operation cancelled. Please fix the footnote numbering manually if needed."
                try: notepad.messageBox(cancel_msg_unicode.encode('utf-8'), "Cancelled", MESSAGEBOXFLAGS.ICONINFORMATION)
                except NameError: notepad.messageBox(cancel_msg_unicode, "Cancelled", MESSAGEBOXFLAGS.ICONINFORMATION)
                except Exception as mb_err: console.write(u"ERROR showing Cancelled messagebox: {}\n".format(mb_err))

        else:
            # Sequence is OK, ask for standard confirmation
            console.write(u"ACTION: Asking user for standard renumbering confirmation.\n")
            confirm_msg_unicode = u"Found {} footnotes. The original sequence appears correct (1 to {}).\n\nDo you want to renumber them sequentially (to ensure format consistency)?".format(num_found, num_found)
            try:
                confirm_msg_bytes = confirm_msg_unicode.encode('utf-8')
                user_choice_ok = notepad.messageBox(confirm_msg_bytes, "Confirm Renumbering", MESSAGEBOXFLAGS.YESNO | MESSAGEBOXFLAGS.ICONQUESTION)
            except NameError: # Python 3
                user_choice_ok = notepad.messageBox(confirm_msg_unicode, "Confirm Renumbering", MESSAGEBOXFLAGS.YESNO | MESSAGEBOXFLAGS.ICONQUESTION)
            except Exception as mb_err:
                 console.write(u"ERROR showing Confirm Renumbering messagebox: {}\n".format(mb_err))
                 user_choice_ok = 7 # Default to NO

            if user_choice_ok == 6: # IDYES
                console.write(u"INFO: User chose YES to renumber (sequence was OK).\n")
                proceed_renumber = True
            else:
                console.write(u"INFO: User chose NO to renumbering (return code {}).\n".format(user_choice_ok))
                cancel_msg_unicode = u"Operation cancelled by user."
                try: notepad.messageBox(cancel_msg_unicode.encode('utf-8'), "Cancelled", MESSAGEBOXFLAGS.ICONINFORMATION)
                except NameError: notepad.messageBox(cancel_msg_unicode, "Cancelled", MESSAGEBOXFLAGS.ICONINFORMATION)
                except Exception as mb_err: console.write(u"ERROR showing Cancelled messagebox: {}\n".format(mb_err))

        # 6. Perform Renumbering if User Confirmed
        if proceed_renumber:
            success = perform_footnote_renumbering(matches_list)
            if success:
                final_msg_unicode = u"Renumbering complete.\n\n{} footnotes were processed and numbered 1 to {}.".format(num_found, num_found)
                try: notepad.messageBox(final_msg_unicode.encode('utf-8'), "Success", MESSAGEBOXFLAGS.ICONINFORMATION)
                except NameError: notepad.messageBox(final_msg_unicode, "Success", MESSAGEBOXFLAGS.ICONINFORMATION)
                except Exception as mb_err: console.write(u"ERROR showing Success messagebox: {}\n".format(mb_err))
                console.write(u"INFO: Process finished successfully.\n")
            # else: Error message already shown

    # --- Error Handling ---
    except NameError as ne:
        error_details = safe_decode(str(ne))
        print("CRITICAL ENVIRONMENT ERROR: {}".format(error_details))
        console.write(u"CRITICAL ENVIRONMENT ERROR: Cannot access Notepad++ functions (editor, notepad, etc).\nEnsure the script is run correctly via the PythonScript plugin.\nError: {}\n".format(error_details))
        console.write(traceback.format_exc() + u"\n")
        try:
            error_msg = u"Critical Error: Cannot access Notepad++ functions.\nSee console/PythonScript output.\nError: {}".format(error_details)
            # Try encoding for Py2
            notepad.messageBox(error_msg.encode('utf-8') if hasattr(error_msg, 'encode') else error_msg, "Environment Error", MESSAGEBOXFLAGS.ICONERROR)
        except Exception as mb_err:
            print("Failed to show Environment Error message box: {}".format(mb_err))
    except Exception as e:
        console.write(u"\n--- UNEXPECTED ERROR IN MAIN FLOW ---\n")
        console.write(traceback.format_exc() + u"\n")
        error_details = safe_decode(str(e))
        error_message_box_unicode = u"An unexpected error occurred:\n{}".format(error_details)
        try:
            # Try encoding for Py2
            notepad.messageBox(error_message_box_unicode.encode('utf-8') if hasattr(error_message_box_unicode, 'encode') else error_message_box_unicode, "Unexpected Error", MESSAGEBOXFLAGS.ICONERROR)
        except Exception as mb_err:
            print("UNEXPECTED ERROR (messageBox failed): {}".format(mb_err))
        console.write(u"Error displaying the unexpected error message box: {}\n".format(mb_err))

    finally:
        console.write(u"\n--- Script execution finished (v_final_7) ---\n")

# --- Run the main function ---
if __name__ == '__main__':
    run_renumber_flow()