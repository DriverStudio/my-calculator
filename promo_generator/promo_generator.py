import customtkinter as ctk
from tkinter import filedialog, messagebox
import os
import threading
import time
from http.server import SimpleHTTPRequestHandler
from socketserver import ThreadingTCPServer
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
import emoji
import re

# === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
def clean_text(text):
    if not text: return ""
    text = emoji.replace_emoji(str(text), replace='')
    return re.sub(r'\s+', ' ', text).strip()

def wrap_text(text, font, max_width, draw):
    """Разбивает текст на линии, чтобы он влезал в max_width"""
    lines = []
    if not text: return lines
    
    words = text.split()
    current_line = words[0]
    
    for word in words[1:]:
        # Проверяем ширину с новым словом
        test_line = current_line + " " + word
        bbox = draw.textbbox((0, 0), test_line, font=font)
        w = bbox[2] - bbox[0]
        
        if w <= max_width:
            current_line = test_line
        else:
            lines.append(current_line)
            current_line = word
    lines.append(current_line)
    return lines

# === НАСТРОЙКИ ===
PORT = 8090
BG_COLOR = "#0f172a" 
ACCENT_COLOR = "#28a745" # Зеленый акцент

ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("green")

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args): pass
    def handle_one_request(self):
        try: super().handle_one_request()
        except (ConnectionResetError, BrokenPipeError): pass

class ThreadedHTTPServer(ThreadingTCPServer):
    allow_reuse_address = True

class PromoGeneratorApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("PRISMA Promo Generator V3 (Auto-Wrap & Style) 🌟")
        self.geometry("950x750")
        
        self.grid_columnconfigure(0, weight=1)
        self.grid_columnconfigure(1, weight=2)
        self.grid_rowconfigure(2, weight=1)

        self.project_dir = ctk.StringVar()
        self.app_checkboxes = {}
        self.server_thread = None
        self.httpd = None

        self.create_widgets()

    def create_widgets(self):
        # ВЕРХНЯЯ ПАНЕЛЬ
        self.frame_top = ctk.CTkFrame(self)
        self.frame_top.grid(row=0, column=0, columnspan=2, padx=20, pady=20, sticky="ew")
        
        self.btn_dir = ctk.CTkButton(self.frame_top, text="📂 Выбрать папку проекта", command=self.select_dir)
        self.btn_dir.pack(side="left", padx=10, pady=10)
        self.lbl_dir = ctk.CTkLabel(self.frame_top, text="Папка не выбрана", text_color="gray")
        self.lbl_dir.pack(side="left", padx=10)

        # ЛЕВАЯ ПАНЕЛЬ
        self.frame_left = ctk.CTkFrame(self)
        self.frame_left.grid(row=1, column=0, rowspan=2, padx=(20, 10), pady=(0, 20), sticky="nsew")
        
        ctk.CTkLabel(self.frame_left, text="Сервисы:", font=("Arial", 14, "bold")).pack(pady=10)
        
        self.frame_btns = ctk.CTkFrame(self.frame_left, fg_color="transparent")
        self.frame_btns.pack(fill="x", padx=10)
        ctk.CTkButton(self.frame_btns, text="Все", width=60, command=self.select_all).pack(side="left", padx=2)
        ctk.CTkButton(self.frame_btns, text="Ничего", width=60, fg_color="#555", command=self.deselect_all).pack(side="left", padx=2)

        self.scroll_apps = ctk.CTkScrollableFrame(self.frame_left)
        self.scroll_apps.pack(fill="both", expand=True, padx=10, pady=10)

        # ПРАВАЯ ПАНЕЛЬ
        self.frame_right = ctk.CTkFrame(self)
        self.frame_right.grid(row=1, column=1, rowspan=2, padx=(10, 20), pady=(0, 20), sticky="nsew")
        
        self.log_box = ctk.CTkTextbox(self.frame_right, font=("Consolas", 11))
        self.log_box.pack(fill="both", expand=True, padx=10, pady=10)
        
        self.btn_run = ctk.CTkButton(self.frame_right, text="📸 СОЗДАТЬ ПРЕВЬЮ (PRO STYLE)", height=50, font=("Arial", 14, "bold"), command=self.start_thread)
        self.btn_run.pack(fill="x", padx=10, pady=20)

    def log(self, msg):
        self.log_box.insert("end", msg + "\n")
        self.log_box.see("end")

    def select_dir(self):
        path = filedialog.askdirectory()
        if path:
            self.project_dir.set(path)
            self.lbl_dir.configure(text=path)
            self.scan_apps(path)

    def scan_apps(self, path):
        for cb in self.app_checkboxes.values(): cb.destroy()
        self.app_checkboxes.clear()
        found = []
        if os.path.exists(os.path.join(path, "index.html")): found.append("home")
        try:
            for item in os.listdir(path):
                if os.path.isdir(os.path.join(path, item)) and os.path.exists(os.path.join(path, item, "index.html")):
                    if item not in ['assets', '.git']: found.append(item)
        except Exception: pass

        for app_id in sorted(found):
            cb = ctk.CTkCheckBox(self.scroll_apps, text=app_id.upper())
            cb.pack(anchor="w", pady=2)
            cb.select()
            self.app_checkboxes[app_id] = cb
        self.log(f"🔎 Найдено: {len(found)}")

    def select_all(self):
        for cb in self.app_checkboxes.values(): cb.select()
    def deselect_all(self):
        for cb in self.app_checkboxes.values(): cb.deselect()

    def start_thread(self):
        if not self.project_dir.get(): return messagebox.showwarning("Ошибка", "Выберите папку!")
        selected = [aid for aid, cb in self.app_checkboxes.items() if cb.get() == 1]
        if not selected: return messagebox.showwarning("Ошибка", "Ничего не выбрано!")
        
        self.btn_run.configure(state="disabled", text="⏳ РАБОТАЮ...")
        threading.Thread(target=self.run_process, args=(selected,), daemon=True).start()

    def run_process(self, apps):
        root_path = self.project_dir.get()
        out_dir = os.path.join(root_path, "promo_materials_v3")
        if not os.path.exists(out_dir): os.makedirs(out_dir)

        # 1. Запуск сервера
        if not self.httpd:
            self.log("🌍 Старт сервера...")
            try:
                os.chdir(root_path)
                self.httpd = ThreadedHTTPServer(('localhost', PORT), QuietHandler)
                threading.Thread(target=self.httpd.serve_forever, daemon=True).start()
                time.sleep(1)
            except Exception as e:
                self.log(f"❌ Ошибка сервера: {e}")
                self.btn_run.configure(state="normal", text="📸 ПОПРОБОВАТЬ СНОВА")
                return

        # 2. Playwright
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page(viewport={'width': 1200, 'height': 630}) 
                base_url = f"http://localhost:{PORT}"
                page.route("**/*.(mp3|wav|mp4)", lambda route: route.abort())

                for app_id in apps:
                    self.log(f"🎨 Обработка: {app_id.upper()}...")
                    url = f"{base_url}/index.html" if app_id == 'home' else f"{base_url}/{app_id}/index.html"
                    
                    try:
                        page.goto(url)
                        page.evaluate("""() => { 
                            localStorage.setItem('theme', 'dark'); 
                            document.documentElement.setAttribute('data-theme', 'dark');
                            document.querySelectorAll('.ad-slot, footer').forEach(el => el.style.display = 'none');
                            document.body.style.overflow = 'hidden';
                        }""")
                        
                        data = page.evaluate("""() => {
                            const h1 = document.querySelector('h1')?.innerText || document.title;
                            const p = document.querySelector('p')?.innerText || 
                                      document.querySelector('meta[property="og:description"]')?.content || 
                                      "Web Utility Tool";
                            return { title: h1, desc: p };
                        }""")

                        time.sleep(1)
                        screenshot_bytes = page.screenshot()
                        self.process_image(screenshot_bytes, app_id, data, out_dir)

                    except Exception as e:
                        self.log(f"❌ Ошибка {app_id}: {e}")

                browser.close()
                self.log(f"✅ Готово! Папка: {out_dir}")
                os.startfile(out_dir) if os.name == 'nt' else None

        except Exception as e:
            self.log(f"❌ Playwright Error: {e}")

        self.btn_run.configure(state="normal", text="📸 СОЗДАТЬ ПРЕВЬЮ")

    def process_image(self, img_bytes, app_name, text_data, out_dir):
        # 1. Создаем временный файл
        temp_path = os.path.join(out_dir, "temp.png")
        with open(temp_path, "wb") as f: f.write(img_bytes)
        
        # 2. Открываем в Pillow
        with Image.open(temp_path) as img:
            img = img.convert("RGBA")
            width, height = img.size

            # === СЛОЙ 1: ТЕМНЫЙ ГРАДИЕНТ ===
            gradient = Image.new('RGBA', (width, height), (0,0,0,0))
            draw = ImageDraw.Draw(gradient)
            
            # Делаем градиент более высоким (с 40%), чтобы текст читался лучше
            start_y = int(height * 0.4)
            for y in range(start_y, height):
                # Более плавное затемнение
                alpha = int(250 * ((y - start_y) / (height - start_y))**1.5)
                draw.line([(0, y), (width, y)], fill=(15, 23, 42, min(alpha, 240)))
            
            out = Image.alpha_composite(img, gradient)

            # === СЛОЙ 2: ТЕКСТ ===
            draw_txt = ImageDraw.Draw(out)
            
            safe_title = clean_text(text_data['title']).upper()
            safe_desc = clean_text(text_data['desc'])

            # Шрифты
            script_dir = os.path.dirname(os.path.abspath(__file__))
            try:
                font_title = ImageFont.truetype(os.path.join(script_dir, "Montserrat-Bold.ttf"), 60)
                font_desc = ImageFont.truetype(os.path.join(script_dir, "Inter-Medium.ttf"), 30)
            except OSError:
                font_title = ImageFont.load_default()
                font_desc = ImageFont.load_default()

            # Параметры отступов
            margin_left = 80
            margin_bottom = 80
            max_text_width = width - (margin_left * 2)

            # 1. Подготовка описания
            desc_text = safe_desc[:90] + "..." if len(safe_desc) > 90 else safe_desc
            
            # Вычисляем высоту описания
            if hasattr(font_desc, 'getbbox'):
                desc_bbox = draw_txt.textbbox((0, 0), desc_text, font=font_desc)
                desc_h = desc_bbox[3] - desc_bbox[1]
            else:
                desc_h = 20

            # 2. Подготовка заголовка (Перенос строк!)
            title_lines = wrap_text(safe_title, font_title, max_text_width, draw_txt)
            
            # Вычисляем общую высоту блока заголовка
            line_height = 0
            if hasattr(font_title, 'getbbox'):
                # Берем высоту буквы "A" как эталон строки
                bbox = draw_txt.textbbox((0, 0), "A", font=font_title)
                line_height = (bbox[3] - bbox[1]) * 1.3 # 1.3 - межстрочный интервал
            else:
                line_height = 50

            total_title_h = line_height * len(title_lines)

            # === КООРДИНАТЫ ===
            # Считаем снизу вверх
            y_desc_start = height - margin_bottom - desc_h
            y_title_start = y_desc_start - total_title_h - 20 # 20px отступ заголовка от описания

            # === РИСОВАНИЕ С ТЕНЬЮ (Фишка 1) ===
            shadow_offset = 4
            shadow_color = (0, 0, 0, 180) # Полупрозрачный черный

            # Рисуем заголовок построчно
            current_y = y_title_start
            for line in title_lines:
                # Тень
                draw_txt.text((margin_left + shadow_offset, current_y + shadow_offset), line, font=font_title, fill=shadow_color)
                # Сам текст
                draw_txt.text((margin_left, current_y), line, font=font_title, fill="#ffffff")
                current_y += line_height

            # Рисуем описание (с легкой тенью)
            draw_txt.text((margin_left + 2, y_desc_start + 2), desc_text, font=font_desc, fill=shadow_color)
            draw_txt.text((margin_left, y_desc_start), desc_text, font=font_desc, fill="#cbd5e1") # Светло-серый

            # === АКЦЕНТНАЯ ПОЛОСКА (Фишка 2) ===
            # Рисуем вертикальную зеленую линию слева от текста
            bar_x = margin_left - 30
            bar_top = y_title_start + 5
            bar_bottom = y_desc_start + desc_h
            
            # Рисуем линию
            draw_txt.rectangle(
                [(bar_x, bar_top), (bar_x + 8, bar_bottom)], 
                fill=ACCENT_COLOR
            )

            # Сохраняем
            final_path = os.path.join(out_dir, f"{app_name}_og.jpg")
            out.convert("RGB").save(final_path, quality=95)
        
        os.remove(temp_path)

if __name__ == "__main__":
    app = PromoGeneratorApp()
    app.mainloop()