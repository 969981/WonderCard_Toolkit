"""Best-effort Windows GUI E2E against the actual installed Tauri executable.

Exercises native Windows Open/Save dialogs with pywinauto, then checks source/output
bytes. GitHub Windows runner may lack an interactive desktop; report inconclusive
and DO NOT claim native success unless this script prints PASS.
"""
from __future__ import annotations
import argparse
import os
from pathlib import Path
import subprocess
import tempfile
import time

from pywinauto import Desktop, keyboard
from pywinauto.application import Application


def matching_dialogs(label:str):
    words = ("open","打开","choose") if label=="open" else ("save","另存","保存")
    dialogs=Desktop(backend="win32").windows(class_name="#32770",visible_only=True)
    return [dlg for dlg in dialogs if any(x in dlg.window_text().lower() for x in words)]


def await_dialog(label:str,timeout:float=20):
    end=time.monotonic()+timeout
    while time.monotonic()<end:
        matches=matching_dialogs(label)
        if matches: return matches[-1]
        time.sleep(0.3)
    raise RuntimeError("Native "+label+" dialog was not visible")


def diagnostic_windows():
    try:
        windows=Desktop(backend="win32").windows(visible_only=True)
        print("DIAG: windows (name,class)="+repr(
            [(w.window_text()[:65],w.class_name()) for w in windows[:25]]))
    except Exception as exc: print("DIAG: window enumeration error "+repr(exc))


def diagnostic_webview(app):
    try:
        uia=Application(backend="uia").connect(process=app.process)
        window=uia.window(title_re=".*WonderCard Pro Editor.*")
        print("DIAG: WebView buttons="+repr([
            item.window_text()[:65] for item in window.descendants(control_type="Button")[:25]
        ]))
        print("DIAG: WebView visible text="+repr([
            item.window_text()[:65] for item in window.descendants(control_type="Text")[-25:]
        ]))
    except Exception as exc:
        print("DIAG: WebView UIA unavailable: "+repr(exc))


def click_webview_open_button(app)->bool:
    try:
        uia=Application(backend="uia").connect(process=app.process)
        window=uia.window(title_re=".*WonderCard Pro Editor.*")
        for button in window.descendants(control_type="Button"):
            if button.window_text() in ("打开文件","Open files","開啟檔案","ファイルを開く"):
                button.click_input()
                return True
    except Exception as exc:
        print("DIAG: UIA button activation unavailable: "+repr(exc))
    return False


def choose_file(dialog, path: Path) -> None:
    dialog.set_focus()
    try:
        edit = dialog.child_window(class_name="Edit", control_id=1148)
        edit.wait("exists ready", timeout=5)
        edit.set_edit_text(str(path))
    except Exception:
        # Standard Windows Common Item Dialog has Alt+N as File name.
        dialog.type_keys("%n")
        keyboard.send_keys("^a")
        keyboard.send_keys(str(path), with_spaces=True)
    keyboard.send_keys("{ENTER}")


def run(executable: Path) -> None:
    if not executable.is_file():
        raise RuntimeError("Installed executable is missing")
    with tempfile.TemporaryDirectory(prefix="wc-native-dialog-") as folder:
        directory = Path(folder)
        source = directory / "synthetic.wc6"
        dest = directory / "synthetic_saved.wc6"
        raw = bytearray(0x108)
        raw[0] = 25
        raw[0x4C:0x50] = (20150317).to_bytes(4,"little")
        raw[0x51] = 0
        raw[0xD0] = 10
        raw[0x105] = 0xA5
        source.write_bytes(raw)
        import hashlib
        before = hashlib.sha256(source.read_bytes()).hexdigest()
        app = Application(backend="win32").start(str(executable))
        try:
            window = app.window(title_re=".*WonderCard Pro Editor.*")
            window.wait("visible", timeout=30)
            window.set_focus()
            keyboard.send_keys("^o")
            try:
                open_dialog=await_dialog("open",timeout=6)
            except RuntimeError:
                diagnostic_windows()
                diagnostic_webview(app)
                if not click_webview_open_button(app):
                    print("DIAG: No accessible Open button; checking native dialog one last time")
                open_dialog=await_dialog("open",timeout=15)
            choose_file(open_dialog,source)
            time.sleep(1.2)
            window.set_focus()
            keyboard.send_keys("^s")
            choose_file(await_dialog("save"),dest)
            for _ in range(70):
                if dest.exists():
                    break
                time.sleep(0.2)
            if not dest.exists():
                raise RuntimeError("Save dialog finished without producing a new file")
            if source.read_bytes()!=bytes(raw):
                raise RuntimeError("Opening/saving truncated or modified source input")
            if dest.read_bytes()!=bytes(raw):
                raise RuntimeError("Native Save As output is not an exact copy of the source")
            if hashlib.sha256(source.read_bytes()).hexdigest()!=before:
                raise RuntimeError("Source SHA-256 changed")
            print("PASS: installed Tauri app opened native Windows picker and saved via native dialog, exact bytes")
        finally:
            try:
                app.kill()
            except Exception:
                pass


if __name__=="__main__":
    cli=argparse.ArgumentParser()
    cli.add_argument("--exe",required=True,type=Path)
    args=cli.parse_args()
    run(args.exe)
