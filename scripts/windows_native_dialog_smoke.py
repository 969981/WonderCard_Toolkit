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


def await_dialog(label: str, timeout: float = 20):
    needle = "open" if label == "open" else "save"
    until = time.monotonic() + timeout
    while time.monotonic() < until:
        dialogs = Desktop(backend="win32").windows(class_name="#32770",visible_only=True)
        matched = [dlg for dlg in dialogs if any(
            part in dlg.window_text().lower() for part in
            (("open","打开","choose") if needle=="open" else ("save","另存","保存"))
        )]
        if matched:
            return matched[-1]
        time.sleep(0.3)
    raise RuntimeError(f"Native {label} dialog did not become visible; runner may lack an interactive desktop")


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
            choose_file(await_dialog("open"),source)
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
