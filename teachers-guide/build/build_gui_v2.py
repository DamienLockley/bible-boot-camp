#!/usr/bin/env python3
"""Teachers' Guide V2 build controls.

Compatible with the current Word converter and GitHub checkout, while the
unified Website Manager integration is being finished. This GUI runs only a
local build; it never pushes or publishes to GitHub.
"""
import json
import os
import subprocess
import sys
import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

HOME = Path(os.environ.get("LOCALAPPDATA", Path.home())) / "TeachersGuideV2"
SETTINGS = HOME / "settings.json"
HERE = Path(__file__).resolve().parent
SCRIPT = HERE / "convert_v2.py"


class BuildWindow:
    def __init__(self):
        self.window = tk.Tk()
        self.window.title("Teachers' Guide V2 — Word & Website Builder")
        self.window.geometry("900x670")
        self.window.minsize(730, 570)
        self.window.configure(bg="#eef5fb")
        self.word = tk.StringVar()
        self.site = tk.StringVar()
        self.output = tk.StringVar()
        self.pdf = tk.StringVar()
        self.update_pdfs = tk.BooleanVar(value=False)
        self.state = tk.StringVar(value="Ready — existing PDFs will be kept")
        self.running = False
        self.read_settings()
        self.draw()

    def read_settings(self):
        try:
            saved = json.loads(SETTINGS.read_text(encoding="utf-8"))
        except (FileNotFoundError, ValueError, OSError):
            saved = {}
        for name, var in (("word", self.word), ("site", self.site),
                          ("output", self.output), ("pdf", self.pdf)):
            var.set(saved.get(name, ""))
        self.update_pdfs.set(bool(saved.get("update_pdfs", False)))

    def save_settings(self):
        HOME.mkdir(parents=True, exist_ok=True)
        SETTINGS.write_text(json.dumps({
            "word": self.word.get(), "site": self.site.get(),
            "output": self.output.get(), "pdf": self.pdf.get(),
            "update_pdfs": self.update_pdfs.get(),
        }, indent=2), encoding="utf-8")

    def picker(self, parent, label, variable, kind, filetypes=None):
        row = ttk.Frame(parent)
        row.pack(fill="x", padx=4, pady=6)
        ttk.Label(row, text=label, width=23).pack(side="left")
        field = ttk.Entry(row, textvariable=variable)
        field.pack(side="left", fill="x", expand=True, padx=(0, 7))
        def browse():
            current = variable.get()
            initialdir = str(Path(current).parent if current and Path(current).is_file() else Path(current) if current and Path(current).is_dir() else Path.home())
            if kind == "file":
                picked = filedialog.askopenfilename(initialdir=initialdir,
                    title=label, filetypes=filetypes)
            else:
                picked = filedialog.askdirectory(initialdir=initialdir, title=label)
            if picked: variable.set(picked)
        ttk.Button(row, text="Browse…", command=browse).pack(side="right")

    def draw(self):
        style = ttk.Style(self.window)
        if "clam" in style.theme_names(): style.theme_use("clam")
        style.configure("Header.TLabel", font=("Segoe UI", 17, "bold"), foreground="#184768")
        style.configure("Status.TLabel", font=("Segoe UI", 10, "bold"), foreground="#185b7a")
        main = ttk.Frame(self.window, padding=18)
        main.pack(fill="both", expand=True)
        ttk.Label(main, text="Teachers' Guide V2", style="Header.TLabel").pack(anchor="w")
        ttk.Label(main, text="Create a local website package from the Word master. Never pushes to GitHub.").pack(anchor="w", pady=(3, 14))
        self.picker(main, "Word master (.docx)", self.word, "file",
                    [("Word documents", "*.docx")])
        self.picker(main, "GitHub site folder", self.site, "folder")
        self.picker(main, "Build output folder", self.output, "folder")
        opt = ttk.LabelFrame(main, text="PDF sharing (optional)", padding=12)
        opt.pack(fill="x", pady=12)
        self.check = ttk.Checkbutton(opt, text="Update the 28 study PDFs",
                    variable=self.update_pdfs, command=self.toggle_pdf)
        self.check.pack(anchor="w")
        ttk.Label(opt, text="Off (recommended): keep all existing PDFs and build faster. A warning appears if Word has changed.").pack(anchor="w", pady=(6, 7))
        self.pdfrow = ttk.Frame(opt)
        self.pdfrow.pack(fill="x")
        self.picker(self.pdfrow, "Complete source PDF", self.pdf, "file",
                    [("PDF files", "*.pdf")])
        self.toggle_pdf()
        actions = ttk.Frame(main)
        actions.pack(fill="x", pady=(4, 8))
        self.build_button = ttk.Button(actions, text="Build V2 Website", command=self.build)
        self.build_button.pack(side="left")
        ttk.Button(actions, text="Save Settings", command=lambda: (self.save_settings(), self.state.set("Settings saved"))).pack(side="left", padx=8)
        ttk.Button(actions, text="Open Output Folder", command=self.open_output).pack(side="left")
        ttk.Label(main, textvariable=self.state, style="Status.TLabel").pack(anchor="w", pady=6)
        self.log = tk.Text(main, wrap="word", height=18, font=("Consolas", 9),
                          bg="#fcfeff", fg="#19384b", relief="solid", borderwidth=1)
        self.log.pack(fill="both", expand=True)
        self.log.insert("end", "No build has run yet. Select a Word master and site folder, then Build.\n")
        self.window.protocol("WM_DELETE_WINDOW", self.close)

    def toggle_pdf(self):
        if not hasattr(self, "pdfrow"): return
        if self.update_pdfs.get():
            self.pdfrow.pack(fill="x")
            self.state.set("Update PDFs selected — a matching complete source PDF is required")
        else:
            self.pdfrow.pack_forget()
            self.state.set("Keep existing PDFs — faster, no PDF conversion")

    def open_output(self):
        path = Path(self.output.get()) if self.output.get() else None
        if not path or not path.is_dir():
            messagebox.showwarning("Output not found", "Choose an existing output directory first.")
            return
        if sys.platform == "win32": os.startfile(str(path))
        elif sys.platform == "darwin": subprocess.Popen(["open", str(path)])
        else: subprocess.Popen(["xdg-open", str(path)])

    def append(self, text):
        self.log.insert("end", text)
        self.log.see("end")

    def build(self):
        if self.running: return
        word, site, output = (Path(self.word.get()), Path(self.site.get()), Path(self.output.get()))
        problems = []
        if not word.is_file() or word.suffix.lower() != ".docx":
            problems.append("Choose an existing .docx Word master.")
        required = ("index.html", "teaching-map.json", "study-data.json", "main-pathway-enrichments.json")
        if not site.is_dir() or any(not (site / f).is_file() for f in required):
            problems.append("Choose the GitHub repository's teachers-guide folder, containing V2 files.")
        if not output.is_dir():
            problems.append("Choose an existing output folder.")
        if self.update_pdfs.get() and not Path(self.pdf.get()).is_file():
            problems.append("Choose the complete study PDF when Update PDFs is enabled.")
        if problems:
            messagebox.showerror("Cannot build", "\n".join(problems))
            return
        self.save_settings()
        cmd = [sys.executable, str(SCRIPT), str(word), "--site-template", str(site),
               "--existing-site", str(site), "--output", str(output),
               "--pdf-mode", "update" if self.update_pdfs.get() else "keep"]
        if self.update_pdfs.get(): cmd.extend(["--pdf", self.pdf.get()])
        self.running = True
        self.build_button.configure(state="disabled")
        self.state.set("Building and validating…")
        self.append("\n" + "=" * 58 + "\n")
        self.append("Building website (PDFs: %s)\n" % ("UPDATE" if self.update_pdfs.get() else "KEEP"))
        threading.Thread(target=self.worker, args=(cmd,), daemon=True).start()

    def worker(self, cmd):
        try:
            result = subprocess.run(cmd, cwd=str(HERE), text=True,
                        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                        encoding="utf-8", errors="replace")
            output, code = result.stdout, result.returncode
        except Exception as e:
            output, code = str(e), 1
        self.window.after(0, lambda: self.finish(output, code))

    def finish(self, output, code):
        self.append(output + "\n")
        self.running = False
        self.build_button.configure(state="normal")
        self.state.set("Build complete — preview before publishing" if code == 0 else "Build failed — original site remains unchanged")
        if code == 0:
            messagebox.showinfo("Build completed", "The generated package is in your chosen output folder.\nCheck the site and PDFs before publishing.")
        else:
            messagebox.showerror("Build failed safely", "See the log for the reason. The live website has not been changed.")

    def close(self):
        if self.running and not messagebox.askyesno("Build running", "A build is running. Close this window?"): return
        self.save_settings()
        self.window.destroy()

    def run(self):
        self.window.mainloop()


if __name__ == "__main__":
    BuildWindow().run()
