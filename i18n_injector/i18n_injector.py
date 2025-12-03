import customtkinter as ctk
from tkinter import filedialog, messagebox
import json
import os
from bs4 import BeautifulSoup
import threading

# Настройки темы (System, Dark, Light)
ctk.set_appearance_mode("Dark")  
# Цветовая тема (blue, dark-blue, green)
ctk.set_default_color_theme("green")  

class I18nInjectorApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Настройка окна
        self.title("HTML i18n Injector Pro 🚀")
        self.geometry("700x600")
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(3, weight=1) # Лог растягивается

        # Переменные
        self.project_dir = ctk.StringVar()
        self.json_path = ctk.StringVar()

        self.create_widgets()

    def create_widgets(self):
        # === ЗАГОЛОВОК ===
        self.lbl_title = ctk.CTkLabel(self, text="Авто-переводчик HTML атрибутов", font=("Roboto", 24, "bold"))
        self.lbl_title.grid(row=0, column=0, padx=20, pady=(20, 10), sticky="ew")

        # === 1. ВЫБОР ПАПКИ ===
        self.frame_dir = ctk.CTkFrame(self)
        self.frame_dir.grid(row=1, column=0, padx=20, pady=10, sticky="ew")
        
        self.lbl_dir = ctk.CTkLabel(self.frame_dir, text="Папка проекта:", font=("Arial", 14, "bold"))
        self.lbl_dir.pack(anchor="w", padx=10, pady=(10, 0))
        
        self.entry_dir = ctk.CTkEntry(self.frame_dir, textvariable=self.project_dir, placeholder_text="Путь к папке сайта...")
        self.entry_dir.pack(side="left", fill="x", expand=True, padx=10, pady=10)
        
        self.btn_dir = ctk.CTkButton(self.frame_dir, text="📂 Обзор", width=100, command=self.select_dir)
        self.btn_dir.pack(side="right", padx=10, pady=10)

        # === 2. ВЫБОР JSON ===
        self.frame_json = ctk.CTkFrame(self)
        self.frame_json.grid(row=2, column=0, padx=20, pady=10, sticky="ew")
        
        self.lbl_json = ctk.CTkLabel(self.frame_json, text="Файл переводов (JSON):", font=("Arial", 14, "bold"))
        self.lbl_json.pack(anchor="w", padx=10, pady=(10, 0))
        
        self.entry_json = ctk.CTkEntry(self.frame_json, textvariable=self.json_path, placeholder_text="Путь к .json файлу...")
        self.entry_json.pack(side="left", fill="x", expand=True, padx=10, pady=10)
        
        self.btn_json = ctk.CTkButton(self.frame_json, text="📄 Обзор", width=100, command=self.select_json)
        self.btn_json.pack(side="right", padx=10, pady=10)

        # === 3. ЛОГ И КОНСОЛЬ ===
        self.textbox = ctk.CTkTextbox(self, font=("Consolas", 12))
        self.textbox.grid(row=3, column=0, padx=20, pady=10, sticky="nsew")
        self.textbox.insert("0.0", "Ожидание запуска...\n")

        # === 4. КНОПКА ЗАПУСКА ===
        self.btn_run = ctk.CTkButton(self, text="🚀 ЗАПУСТИТЬ МАГИЮ", height=50, font=("Arial", 16, "bold"), fg_color="#28a745", hover_color="#218838", command=self.start_thread)
        self.btn_run.grid(row=4, column=0, padx=20, pady=20, sticky="ew")

    def select_dir(self):
        path = filedialog.askdirectory()
        if path: self.project_dir.set(path)

    def select_json(self):
        path = filedialog.askopenfilename(filetypes=[("JSON files", "*.json")])
        if path: self.json_path.set(path)

    def log(self, message):
        self.textbox.insert("end", message + "\n")
        self.textbox.see("end")

    def start_thread(self):
        # Запускаем в отдельном потоке, чтобы интерфейс не вис во время работы
        threading.Thread(target=self.run_injection, daemon=True).start()

    def load_mappings(self, json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if 'ru' not in data:
                self.log("❌ ОШИБКА: В JSON нет ключа 'ru'!")
                return None

            mappings = {'global': {}, 'services': {}}

            for service, keys in data['ru'].items():
                mappings['services'][service] = {}
                for key_name, text_value in keys.items():
                    if not isinstance(text_value, str): continue
                    full_key = f"{service}.{key_name}"
                    clean_text = text_value.strip()
                    mappings['services'][service][clean_text] = full_key
                    mappings['global'][clean_text] = full_key

            return mappings
        except Exception as e:
            self.log(f"❌ ОШИБКА JSON: {str(e)}")
            return None

    def run_injection(self):
        p_dir = self.project_dir.get()
        j_path = self.json_path.get()

        if not p_dir or not j_path:
            self.log("⚠️ ОШИБКА: Выберите папку и файл JSON!")
            return

        self.btn_run.configure(state="disabled", text="⏳ РАБОТАЮ...")
        self.textbox.delete("1.0", "end")
        self.log(f"📂 Папка: {p_dir}")
        self.log(f"📄 JSON: {j_path}")
        self.log("-" * 30)

        mappings = self.load_mappings(j_path)
        if not mappings: 
            self.btn_run.configure(state="normal", text="🚀 ЗАПУСТИТЬ МАГИЮ")
            return

        count_files = 0
        count_tags = 0

        for root, dirs, files in os.walk(p_dir):
            folder_name = os.path.basename(root)
            
            for file in files:
                if file.endswith(".html"):
                    file_path = os.path.join(root, file)
                    changes_in_file = 0
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            soup = BeautifulSoup(f, 'html.parser')

                        for element in soup.find_all(string=True):
                            text = element.strip()
                            if not text: continue
                            
                            parent = element.parent
                            if parent.name in ['script', 'style', 'title'] or parent.has_attr('data-i18n'):
                                continue

                            found_key = None
                            
                            # 1. Поиск в сервисе
                            if folder_name in mappings['services']:
                                if text in mappings['services'][folder_name]:
                                    found_key = mappings['services'][folder_name][text]

                            # 2. Глобальный поиск
                            if not found_key and text in mappings['global']:
                                found_key = mappings['global'][text]

                            if found_key:
                                parent['data-i18n'] = found_key
                                changes_in_file += 1
                                count_tags += 1
                                self.log(f"   [+] <{parent.name}> '{text[:20]}...' -> {found_key}")

                        if changes_in_file > 0:
                            with open(file_path, 'w', encoding='utf-8') as f:
                                f.write(str(soup))
                            self.log(f"✅ SAVE: {file} (+{changes_in_file} attr)")
                            count_files += 1

                    except Exception as e:
                        self.log(f"❌ Error in {file}: {e}")

        self.log("=" * 30)
        self.log(f"🏁 ГОТОВО! Файлов: {count_files}, Атрибутов: {count_tags}")
        self.btn_run.configure(state="normal", text="🚀 ЗАПУСТИТЬ МАГИЮ")

if __name__ == "__main__":
    app = I18nInjectorApp()
    app.mainloop()