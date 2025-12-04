import os
import re
import customtkinter as ctk
from bs4 import BeautifulSoup
from tkinter import filedialog

# Настройки внешнего вида
ctk.set_appearance_mode("System")
ctk.set_default_color_theme("blue")

class ServiceScannerApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Сканер сервисов (Без смайлов)")
        self.geometry("700x650")

        self.root_dir = os.getcwd() 
        self.checkboxes = [] 

        # --- ВЕРХНЯЯ ПАНЕЛЬ ---
        self.top_frame = ctk.CTkFrame(self)
        self.top_frame.pack(fill="x", padx=20, pady=10)

        self.btn_browse = ctk.CTkButton(self.top_frame, text="Выбрать папку", command=self.select_root_folder, width=120)
        self.btn_browse.pack(side="left", padx=(0, 10))

        self.lbl_path = ctk.CTkLabel(self.top_frame, text=self.root_dir, text_color="gray")
        self.lbl_path.pack(side="left", fill="x", expand=True)

        # --- СТАТИСТИКА ---
        self.info_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.info_frame.pack(fill="x", padx=20, pady=(0, 5))

        self.lbl_count = ctk.CTkLabel(self.info_frame, text="Сервисов найдено: 0", font=("Arial", 14, "bold"))
        self.lbl_count.pack(side="left")

        self.btn_select_all = ctk.CTkButton(self.info_frame, text="Выбрать все", command=self.select_all, width=100, fg_color="gray")
        self.btn_select_all.pack(side="right")

        # --- СПИСОК ---
        self.scroll_frame = ctk.CTkScrollableFrame(self, label_text="Список проектов")
        self.scroll_frame.pack(fill="both", expand=True, padx=20, pady=5)

        # --- НИЖНЯЯ ПАНЕЛЬ ---
        self.btn_process = ctk.CTkButton(self, text="Сгенерировать текст", command=self.generate_text, height=40, font=("Arial", 14, "bold"))
        self.btn_process.pack(pady=(10, 5), padx=20, fill="x")
        
        # Кнопка копирования
        self.btn_copy = ctk.CTkButton(self, text="Копировать в буфер", command=self.copy_to_clipboard, height=30, fg_color="#444", hover_color="#333")
        self.btn_copy.pack(pady=(0, 10), padx=20, fill="x")

        self.textbox = ctk.CTkTextbox(self, height=120)
        self.textbox.pack(fill="x", padx=20, pady=(0, 20))

        self.refresh_list()

    def clean_text(self, text):
        """Удаляет смайлики и лишние символы, оставляет только текст и пунктуацию"""
        if not text:
            return ""
        # Разрешаем: буквы, цифры, пробелы и знаки препинания (.,!?-:;()|")
        # Все остальное (смайлы, иероглифы и т.д.) удаляется
        clean = re.sub(r'[^\w\s\.,!?:;()\|\-"\'а-яА-ЯёЁa-zA-Z0-9]', '', text)
        # Убираем двойные пробелы
        return " ".join(clean.split())

    def select_root_folder(self):
        folder_selected = filedialog.askdirectory()
        if folder_selected:
            self.root_dir = folder_selected
            self.lbl_path.configure(text=self.root_dir)
            self.refresh_list()

    def refresh_list(self):
        for item in self.checkboxes:
            item["widget"].destroy()
        self.checkboxes.clear()

        data = self.scan_directories(self.root_dir)
        self.lbl_count.configure(text=f"Сервисов найдено: {len(data)}")

        if not data:
            lbl = ctk.CTkLabel(self.scroll_frame, text="HTML файлы (h1+p) не найдены", text_color="red")
            lbl.pack(pady=20)
            self.checkboxes.append({"widget": lbl, "var": None}) 
            return

        for name, desc in data:
            var = ctk.IntVar()
            display_text = f"{name}  |  {desc[:50]}..."
            
            chk = ctk.CTkCheckBox(self.scroll_frame, text=display_text, variable=var)
            chk.pack(anchor="w", pady=5, padx=10)
            
            self.checkboxes.append({"var": var, "name": name, "desc": desc, "widget": chk})

    def scan_directories(self, search_path):
        found_services = []
        try:
            items = os.listdir(search_path)
        except Exception:
            return []

        for item in items:
            full_path = os.path.join(search_path, item)
            
            if os.path.isdir(full_path):
                index_path = os.path.join(full_path, "index.html")
                
                if os.path.exists(index_path):
                    try:
                        with open(index_path, 'r', encoding='utf-8') as f:
                            soup = BeautifulSoup(f, 'html.parser')
                            
                            h1 = soup.find('h1')
                            if h1:
                                raw_name = h1.get_text(strip=True)
                                name = self.clean_text(raw_name)
                                
                                # Ищем первый p, который идет ПОСЛЕ заголовка (find_next более надежен, чем sibling)
                                p = h1.find_next('p')
                                if p:
                                    raw_desc = p.get_text(strip=True)
                                    desc = self.clean_text(raw_desc)
                                else:
                                    desc = "Нет описания"
                                
                                found_services.append((name, desc))
                    except Exception as e:
                        print(f"Ошибка: {e}")
                        
        return found_services

    def select_all(self):
        for item in self.checkboxes:
            if item["var"] is not None:
                item["widget"].select()

    def generate_text(self):
        selected_items = []
        for item in self.checkboxes:
            if item["var"] is not None and item["var"].get() == 1:
                selected_items.append(f"{item['name']}: {item['desc']}")
        
        result_text = "; ".join(selected_items)
        
        self.textbox.delete("0.0", "end")
        self.textbox.insert("0.0", result_text)

    def copy_to_clipboard(self):
        text = self.textbox.get("0.0", "end").strip()
        self.clipboard_clear()
        self.clipboard_append(text)
        self.btn_copy.configure(text="Скопировано! ✅")
        self.after(2000, lambda: self.btn_copy.configure(text="Копировать в буфер"))

if __name__ == "__main__":
    app = ServiceScannerApp()
    app.mainloop()