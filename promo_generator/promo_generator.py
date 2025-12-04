import customtkinter as ctk
from tkinter import filedialog, messagebox, Canvas
import os
import threading
import time
from http.server import SimpleHTTPRequestHandler
from socketserver import ThreadingTCPServer
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageTk
import emoji
import re

# === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
def clean_text(text):
    if not text: return ""
    text = emoji.replace_emoji(str(text), replace='')
    return re.sub(r'\s+', ' ', text).strip()

def wrap_text(text, font, max_width, draw):
    lines = []
    if not text: return lines
    words = text.split()
    if not words: return lines
    current_line = words[0]
    for word in words[1:]:
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
PORT = 8092 
BG_COLOR = "#0f172a" 
ACCENT_COLOR = "#28a745"

ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("green")

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args): pass
    def handle_one_request(self):
        try: super().handle_one_request()
        except (ConnectionResetError, BrokenPipeError): pass

class ThreadedHTTPServer(ThreadingTCPServer):
    allow_reuse_address = True

# === УЛУЧШЕННЫЙ РЕДАКТОР (ZOOM + BOUNDS) ===
class CropEditor(ctk.CTkToplevel):
    def __init__(self, parent, image_path, size_name, target_size, out_path):
        super().__init__(parent)
        self.title(f"✂️ Crop: {size_name} ({target_size[0]}x{target_size[1]})")
        self.geometry("1000x800")
        self.minsize(800, 600)
        
        self.grab_set() 
        self.focus_force()

        self.out_path = out_path
        self.target_w, self.target_h = target_size
        
        # Загружаем оригинал
        self.original_image = Image.open(image_path).convert("RGB")
        self.orig_w, self.orig_h = self.original_image.size

        # Переменные состояния
        self.scale = 1.0 # Текущий зум (отображение / оригинал)
        self.min_scale = 0.1
        self.img_x = 0
        self.img_y = 0
        self.tk_image = None
        self.drag_data = {"x": 0, "y": 0}

        # UI Layout
        self.grid_rowconfigure(0, weight=1)
        self.grid_columnconfigure(0, weight=1)

        self.canvas_frame = ctk.CTkFrame(self)
        self.canvas_frame.grid(row=0, column=0, sticky="nsew", padx=10, pady=10)
        
        # Canvas
        self.canvas = Canvas(self.canvas_frame, bg="#1e1e1e", highlightthickness=0)
        self.canvas.pack(fill="both", expand=True)

        # Controls
        self.controls = ctk.CTkFrame(self, height=60)
        self.controls.grid(row=1, column=0, sticky="ew", padx=10, pady=(0, 10))
        
        ctk.CTkLabel(self.controls, text="🖱 Колесо: Зум | ✋ ЛКМ: Двигать", text_color="gray").pack(side="left", padx=20)
        self.btn_save = ctk.CTkButton(self.controls, text="✅ СОХРАНИТЬ", command=self.save_crop, font=("Arial", 14, "bold"), fg_color=ACCENT_COLOR)
        self.btn_save.pack(side="right", padx=20, pady=10)

        # Бинды
        self.canvas.bind("<ButtonPress-1>", self.on_drag_start)
        self.canvas.bind("<B1-Motion>", self.on_drag_motion)
        self.canvas.bind("<MouseWheel>", self.on_zoom) # Windows
        self.canvas.bind("<Button-4>", self.on_zoom)   # Linux scroll up
        self.canvas.bind("<Button-5>", self.on_zoom)   # Linux scroll down

        # Ждем инициализации окна для расчета размеров
        self.after(100, self.setup_editor)

    def setup_editor(self):
        cw = self.canvas.winfo_width()
        ch = self.canvas.winfo_height()
        if cw < 100: cw, ch = 960, 600

        # 1. Рамка Кропа (View Rect) - по центру экрана
        # Вычисляем максимальный размер рамки, который влезает в экран с отступами
        padding = 50
        scale_w = (cw - padding*2) / self.target_w
        scale_h = (ch - padding*2) / self.target_h
        view_scale = min(scale_w, scale_h)

        self.view_w = int(self.target_w * view_scale)
        self.view_h = int(self.target_h * view_scale)
        
        self.offset_x = (cw - self.view_w) // 2
        self.offset_y = (ch - self.view_h) // 2

        # 2. Начальный масштаб картинки (Cover)
        # Картинка должна покрывать рамку кропа
        ratio_w = self.view_w / self.orig_w
        ratio_h = self.view_h / self.orig_h
        self.min_scale = max(ratio_w, ratio_h) # Минимальный скейл, чтобы не было дыр
        self.scale = self.min_scale # Начинаем с минимального (fit/cover)

        # Центрируем картинку
        current_w = self.orig_w * self.scale
        current_h = self.orig_h * self.scale
        self.img_x = self.offset_x - (current_w - self.view_w) / 2
        self.img_y = self.offset_y - (current_h - self.view_h) / 2

        self.redraw_image()
        self.draw_overlay()

    def redraw_image(self):
        # Оптимизация: ресайз для отображения
        # Считаем текущий размер в пикселях экрана
        display_w = int(self.orig_w * self.scale)
        display_h = int(self.orig_h * self.scale)
        
        # Если картинка слишком огромная для превью, Pillow может тормозить.
        # Но для точности ресайзим оригинал.
        try:
            resized = self.original_image.resize((display_w, display_h), Image.Resampling.BILINEAR)
            self.tk_image = ImageTk.PhotoImage(resized)
            
            # Удаляем старую, рисуем новую
            self.canvas.delete("img")
            self.canvas.create_image(self.img_x, self.img_y, image=self.tk_image, anchor="nw", tags="img")
            
            # Поднимаем оверлей наверх
            self.canvas.tag_raise("overlay")
        except Exception as e:
            print(f"Error drawing: {e}")

    def draw_overlay(self):
        self.canvas.delete("overlay")
        cw = self.canvas.winfo_width()
        ch = self.canvas.winfo_height()

        # Затемнение (Mask)
        # Верх
        self.canvas.create_rectangle(0, 0, cw, self.offset_y, fill="#0f172a", stipple="gray50", outline="", tags="overlay")
        # Низ
        self.canvas.create_rectangle(0, self.offset_y + self.view_h, cw, ch, fill="#0f172a", stipple="gray50", outline="", tags="overlay")
        # Лево
        self.canvas.create_rectangle(0, self.offset_y, self.offset_x, self.offset_y + self.view_h, fill="#0f172a", stipple="gray50", outline="", tags="overlay")
        # Право
        self.canvas.create_rectangle(self.offset_x + self.view_w, self.offset_y, cw, self.offset_y + self.view_h, fill="#0f172a", stipple="gray50", outline="", tags="overlay")

        # Рамка
        self.canvas.create_rectangle(self.offset_x, self.offset_y, self.offset_x + self.view_w, self.offset_y + self.view_h, outline=ACCENT_COLOR, width=2, tags="overlay")

    def apply_constraints(self):
        # 1. Размер не меньше рамки
        if self.scale < self.min_scale:
            self.scale = self.min_scale

        current_w = self.orig_w * self.scale
        current_h = self.orig_h * self.scale

        # 2. Границы (Image edges cannot go inside the Crop View)
        # Left edge of image cannot be right of Left edge of view
        if self.img_x > self.offset_x:
            self.img_x = self.offset_x
        
        # Top edge of image cannot be below Top edge of view
        if self.img_y > self.offset_y:
            self.img_y = self.offset_y

        # Right edge of image cannot be left of Right edge of view
        if self.img_x + current_w < self.offset_x + self.view_w:
            self.img_x = (self.offset_x + self.view_w) - current_w

        # Bottom edge of image cannot be above Bottom edge of view
        if self.img_y + current_h < self.offset_y + self.view_h:
            self.img_y = (self.offset_y + self.view_h) - current_h

    def on_drag_start(self, event):
        self.drag_data["x"] = event.x
        self.drag_data["y"] = event.y

    def on_drag_motion(self, event):
        dx = event.x - self.drag_data["x"]
        dy = event.y - self.drag_data["y"]
        
        self.img_x += dx
        self.img_y += dy
        
        self.apply_constraints() # Магнит к краям
        
        # Просто двигаем текущий канвас айтем (быстрее чем перерисовка)
        self.canvas.coords("img", self.img_x, self.img_y)
        
        self.drag_data["x"] = event.x
        self.drag_data["y"] = event.y

    def on_zoom(self, event):
        # Определяем направление скролла
        if event.num == 5 or event.delta < 0:
            factor = 0.9 # Zoom Out
        else:
            factor = 1.1 # Zoom In

        # Центр зума - курсор мыши
        # Нужно сместить img_x/y так, чтобы точка под курсором осталась на месте
        
        # Координаты мыши относительно картинки до зума
        mouse_x_rel = (event.x - self.img_x) / self.scale
        mouse_y_rel = (event.y - self.img_y) / self.scale

        old_scale = self.scale
        self.scale *= factor
        
        # Проверка минимума
        if self.scale < self.min_scale:
            self.scale = self.min_scale

        # Вычисляем новый img_x/y
        # New Pos = Mouse Screen Pos - (Mouse Rel Pos * New Scale)
        self.img_x = event.x - (mouse_x_rel * self.scale)
        self.img_y = event.y - (mouse_y_rel * self.scale)

        self.apply_constraints()
        self.redraw_image()

    def save_crop(self):
        try:
            # 1. Определяем, какая часть картинки (в координатах оригинала) сейчас в рамке
            # Рамка начинается в self.offset_x. Картинка в self.img_x.
            # Смещение рамки внутри картинки (в экранных пикселях):
            crop_start_x_screen = self.offset_x - self.img_x
            crop_start_y_screen = self.offset_y - self.img_y
            
            # Переводим в координаты оригинала
            real_x = crop_start_x_screen / self.scale
            real_y = crop_start_y_screen / self.scale
            
            # Размер кропа в координатах оригинала
            real_w = self.view_w / self.scale
            real_h = self.view_h / self.scale
            
            box = (real_x, real_y, real_x + real_w, real_y + real_h)
            
            # Кропаем
            cropped = self.original_image.crop(box)
            
            # Ресайзим до целевого размера (финальное качество)
            final_img = cropped.resize((self.target_w, self.target_h), Image.Resampling.LANCZOS)
            
            final_img.save(self.out_path, quality=95)
            self.destroy()
            
        except Exception as e:
            messagebox.showerror("Error", str(e))


class PromoGeneratorApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("PRISMA Promo Generator V6 (Tabs) 🚀")
        self.geometry("1100x850")
        
        # Основной контейнер с табами
        self.tabview = ctk.CTkTabview(self)
        self.tabview.pack(fill="both", expand=True, padx=10, pady=10)

        # Создаем вкладки
        self.tab_web = self.tabview.add("📸 Web Preview")
        self.tab_ads = self.tabview.add("🖼️ Ad Resizer")

        # Инициализация переменных для Web Preview
        self.project_dir = ctk.StringVar()
        self.app_checkboxes = {}
        self.server_thread = None
        self.httpd = None
        
        self.resolutions = {
            "OpenGraph / Link Preview (1200x630)": (1200, 630),
            "Square / 1:1 Post (1080x1080)": (1080, 1080),
            "Portrait / Story (1080x1920)": (1080, 1920),
            "Full HD (1920x1080)": (1920, 1080)
        }
        self.selected_res_name = ctk.StringVar(value="OpenGraph / Link Preview (1200x630)")
        self.delay_var = ctk.IntVar(value=4)

        # Инициализация переменных для Ad Resizer
        self.ad_files = [] 
        self.ad_sizes = {
            "Banner Top (800x200)": (800, 200),
            "Banner Top HD (1200x300)": (1200, 300),
            "Sidebar Square (300x300)": (300, 300),
            "Sidebar Tall (300x500)": (300, 500)
        }
        self.selected_ad_sizes = {} 
        self.manual_mode_var = ctk.BooleanVar(value=False) 

        self.setup_web_tab()
        self.setup_ads_tab()

    def setup_web_tab(self):
        tab = self.tab_web
        tab.grid_columnconfigure(0, weight=1)
        tab.grid_columnconfigure(1, weight=2)
        tab.grid_rowconfigure(2, weight=1)

        frame_top = ctk.CTkFrame(tab)
        frame_top.grid(row=0, column=0, columnspan=2, padx=10, pady=10, sticky="ew")
        
        ctk.CTkButton(frame_top, text="📂 Выбрать папку проекта", command=self.select_dir).pack(side="left", padx=10, pady=10)
        self.lbl_dir = ctk.CTkLabel(frame_top, text="Папка не выбрана", text_color="gray")
        self.lbl_dir.pack(side="left", padx=10)

        frame_left = ctk.CTkFrame(tab)
        frame_left.grid(row=1, column=0, rowspan=2, padx=(10, 5), pady=(0, 10), sticky="nsew")
        
        ctk.CTkLabel(frame_left, text="Сервисы:", font=("Arial", 14, "bold")).pack(pady=5)
        
        frame_btns = ctk.CTkFrame(frame_left, fg_color="transparent")
        frame_btns.pack(fill="x", padx=5)
        ctk.CTkButton(frame_btns, text="Все", width=60, command=self.select_all).pack(side="left", padx=2)
        ctk.CTkButton(frame_btns, text="Сброс", width=60, fg_color="#555", command=self.deselect_all).pack(side="left", padx=2)

        self.scroll_apps = ctk.CTkScrollableFrame(frame_left)
        self.scroll_apps.pack(fill="both", expand=True, padx=5, pady=5)

        frame_right = ctk.CTkFrame(tab)
        frame_right.grid(row=1, column=1, rowspan=2, padx=(5, 10), pady=(0, 10), sticky="nsew")
        
        self.log_box = ctk.CTkTextbox(frame_right, font=("Consolas", 11))
        self.log_box.pack(fill="both", expand=True, padx=10, pady=10)
        
        settings_frame = ctk.CTkFrame(frame_right)
        settings_frame.pack(fill="x", padx=10, pady=10)

        ctk.CTkLabel(settings_frame, text="Формат:").grid(row=0, column=0, padx=5, pady=5)
        ctk.CTkOptionMenu(settings_frame, values=list(self.resolutions.keys()), variable=self.selected_res_name).grid(row=0, column=1, padx=5, pady=5, sticky="ew")

        ctk.CTkLabel(settings_frame, text="Ожидание (с):").grid(row=1, column=0, padx=5, pady=5)
        ctk.CTkSlider(settings_frame, from_=1, to=10, number_of_steps=9, variable=self.delay_var).grid(row=1, column=1, padx=5, pady=5, sticky="ew")
        
        settings_frame.grid_columnconfigure(1, weight=1)

        self.btn_run_web = ctk.CTkButton(frame_right, text="📸 ГЕНЕРИРОВАТЬ ПРЕВЬЮ", height=50, font=("Arial", 14, "bold"), command=self.start_web_thread)
        self.btn_run_web.pack(fill="x", padx=10, pady=10)

    def setup_ads_tab(self):
        tab = self.tab_ads
        tab.grid_columnconfigure(0, weight=1)
        tab.grid_rowconfigure(3, weight=1) 

        frame_files = ctk.CTkFrame(tab)
        frame_files.pack(fill="x", padx=20, pady=10)

        ctk.CTkButton(frame_files, text="📂 Загрузить изображения", command=self.select_images).pack(side="left", padx=10, pady=10)
        self.lbl_files_count = ctk.CTkLabel(frame_files, text="Файлов: 0", font=("Arial", 12, "bold"))
        self.lbl_files_count.pack(side="left", padx=10)
        self.lbl_files_list = ctk.CTkLabel(frame_files, text="(нет файлов)", text_color="gray", wraplength=500, justify="left")
        self.lbl_files_list.pack(side="left", padx=10, fill="x", expand=True)

        frame_sizes = ctk.CTkFrame(tab)
        frame_sizes.pack(fill="x", padx=20, pady=10)
        
        ctk.CTkLabel(frame_sizes, text="Выберите форматы:", font=("Arial", 14, "bold")).pack(anchor="w", padx=10, pady=5)
        
        grid_frame = ctk.CTkFrame(frame_sizes, fg_color="transparent")
        grid_frame.pack(fill="x", padx=10, pady=5)

        for i, (name, size) in enumerate(self.ad_sizes.items()):
            var = ctk.BooleanVar(value=True)
            self.selected_ad_sizes[name] = var
            chk = ctk.CTkCheckBox(grid_frame, text=f"{name}", variable=var)
            chk.grid(row=i//2, column=i%2, sticky="w", padx=20, pady=5)

        frame_mode = ctk.CTkFrame(tab, fg_color="transparent")
        frame_mode.pack(fill="x", padx=20, pady=5)
        
        switch = ctk.CTkSwitch(frame_mode, text="🖐 Ручной режим (Manual Move & Crop)", variable=self.manual_mode_var)
        switch.pack(anchor="w", padx=10)
        ctk.CTkLabel(frame_mode, text="Включите, чтобы вручную двигать каждую картинку перед сохранением.", text_color="gray", font=("Arial", 11)).pack(anchor="w", padx=45)

        self.btn_run_ads = ctk.CTkButton(tab, text="✂️ ОБРЕЗАТЬ И СОХРАНИТЬ", height=50, font=("Arial", 14, "bold"), fg_color="#E0a800", hover_color="#c69500", command=self.start_ads_processing)
        self.btn_run_ads.pack(fill="x", padx=20, pady=20)

        self.log_box_ads = ctk.CTkTextbox(tab, font=("Consolas", 11))
        self.log_box_ads.pack(fill="both", expand=True, padx=20, pady=20)

    def select_images(self):
        files = filedialog.askopenfilenames(filetypes=[("Images", "*.jpg *.jpeg *.png *.webp")])
        if files:
            self.ad_files = list(files)
            self.lbl_files_count.configure(text=f"Файлов: {len(files)}")
            preview = ", ".join([os.path.basename(f) for f in files[:3]])
            if len(files) > 3: preview += f" и еще {len(files)-3}..."
            self.lbl_files_list.configure(text=preview)
            self.log_ads(f"📂 Выбрано {len(files)} изображений.")

    def log_ads(self, msg):
        self.log_box_ads.insert("end", msg + "\n")
        self.log_box_ads.see("end")

    def start_ads_processing(self):
        if not self.ad_files: return messagebox.showwarning("Ошибка", "Выберите изображения!")
        
        active_sizes = {k: v for k, v in self.ad_sizes.items() if self.selected_ad_sizes[k].get()}
        if not active_sizes: return messagebox.showwarning("Ошибка", "Выберите хотя бы один формат!")

        self.btn_run_ads.configure(state="disabled", text="⏳ ОБРАБОТКА...")
        
        if self.manual_mode_var.get():
            self.after(100, lambda: self.process_ads_manual(active_sizes))
        else:
            threading.Thread(target=self.process_ads_auto, args=(active_sizes,), daemon=True).start()

    def process_ads_auto(self, sizes):
        out_dir = os.path.join(os.path.dirname(self.ad_files[0]), "resized_ads_auto")
        if not os.path.exists(out_dir): os.makedirs(out_dir)

        self.log_ads(f"⚙️ Старт АВТО обработки. Папка: {out_dir}")
        processed_count = 0
        
        for file_path in self.ad_files:
            try:
                original_name = os.path.splitext(os.path.basename(file_path))[0]
                with Image.open(file_path) as img:
                    if img.mode != 'RGB': img = img.convert('RGB')
                    for size_name, (w, h) in sizes.items():
                        new_img = ImageOps.fit(img, (w, h), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
                        safe_suffix = size_name.split(' (')[0].replace(' ', '_')
                        save_name = f"{original_name}_{safe_suffix}_{w}x{h}.jpg"
                        new_img.save(os.path.join(out_dir, save_name), quality=95)
                processed_count += 1
                self.log_ads(f"✅ {original_name} готов.")
            except Exception as e:
                self.log_ads(f"❌ Ошибка {os.path.basename(file_path)}: {e}")

        self.finish_ads(out_dir)

    def process_ads_manual(self, sizes):
        out_dir = os.path.join(os.path.dirname(self.ad_files[0]), "resized_ads_manual")
        if not os.path.exists(out_dir): os.makedirs(out_dir)
        
        self.log_ads(f"🖐 Старт РУЧНОЙ обработки. Папка: {out_dir}")
        
        for file_path in self.ad_files:
            for size_name, size_val in sizes.items():
                original_name = os.path.splitext(os.path.basename(file_path))[0]
                safe_suffix = size_name.split(' (')[0].replace(' ', '_')
                save_name = f"{original_name}_{safe_suffix}_{size_val[0]}x{size_val[1]}.jpg"
                out_path = os.path.join(out_dir, save_name)
                
                editor = CropEditor(self, file_path, size_name, size_val, out_path)
                self.wait_window(editor) 
                
                if os.path.exists(out_path):
                    self.log_ads(f"✅ Сохранено: {save_name}")
                else:
                    self.log_ads(f"⚠️ Пропущено: {save_name}")

        self.finish_ads(out_dir)

    def finish_ads(self, out_dir):
        self.log_ads(f"🎉 Все готово!")
        self.btn_run_ads.configure(state="normal", text="✂️ ОБРЕЗАТЬ И СОХРАНИТЬ")
        os.startfile(out_dir) if os.name == 'nt' else None

    # --- Функции WEB PREVIEW (Old) ---
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

    def start_web_thread(self):
        if not self.project_dir.get(): return messagebox.showwarning("Ошибка", "Выберите папку!")
        selected = [aid for aid, cb in self.app_checkboxes.items() if cb.get() == 1]
        if not selected: return messagebox.showwarning("Ошибка", "Ничего не выбрано!")
        
        res_name = self.selected_res_name.get()
        width, height = self.resolutions[res_name]
        wait_time = self.delay_var.get()

        self.btn_run_web.configure(state="disabled", text="⏳ РАБОТАЮ...")
        threading.Thread(target=self.run_web_process, args=(selected, width, height, wait_time), daemon=True).start()

    def run_web_process(self, apps, width, height, wait_time):
        root_path = self.project_dir.get()
        out_dir = os.path.join(root_path, "promo_materials_v6")
        if not os.path.exists(out_dir): os.makedirs(out_dir)

        self.log(f"⚙️ Формат: {width}x{height} | Ожидание: {wait_time}с")

        if not self.httpd:
            self.log("🌍 Старт сервера...")
            try:
                os.chdir(root_path)
                self.httpd = ThreadedHTTPServer(('localhost', PORT), QuietHandler)
                threading.Thread(target=self.httpd.serve_forever, daemon=True).start()
                time.sleep(1)
            except Exception as e:
                self.log(f"❌ Ошибка сервера: {e}")
                self.btn_run_web.configure(state="normal", text="📸 ПОПРОБОВАТЬ СНОВА")
                return

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True, args=["--autoplay-policy=no-user-gesture-required"])
                page = browser.new_page(viewport={'width': width, 'height': height})
                base_url = f"http://localhost:{PORT}"
                page.route("**/*.(mp3|wav)", lambda route: route.abort())

                for app_id in apps:
                    self.log(f"🎨 Обработка: {app_id.upper()}...")
                    url = f"{base_url}/index.html" if app_id == 'home' else f"{base_url}/{app_id}/index.html"
                    
                    try:
                        page.goto(url)
                        try: page.wait_for_load_state("networkidle", timeout=5000)
                        except: pass

                        page.evaluate("""() => { 
                            localStorage.setItem('theme', 'dark'); 
                            document.documentElement.setAttribute('data-theme', 'dark');
                            document.querySelectorAll('.ad-slot, footer').forEach(el => el.style.display = 'none');
                            document.body.style.overflow = 'hidden';
                            document.querySelectorAll('video').forEach(v => { v.muted = true; v.play(); });
                        }""")
                        
                        time.sleep(wait_time)

                        data = page.evaluate("""() => {
                            const h1 = document.querySelector('h1')?.innerText || document.title;
                            const p = document.querySelector('p')?.innerText || 
                                      document.querySelector('meta[property="og:description"]')?.content || "Web Utility Tool";
                            return { title: h1, desc: p };
                        }""")

                        screenshot_bytes = page.screenshot()
                        self.process_web_image(screenshot_bytes, app_id, data, out_dir, width, height)

                    except Exception as e:
                        self.log(f"❌ Ошибка {app_id}: {e}")

                browser.close()
                self.log(f"✅ Готово! Папка: {out_dir}")
                os.startfile(out_dir) if os.name == 'nt' else None

        except Exception as e:
            self.log(f"❌ Playwright Error: {e}")

        self.btn_run_web.configure(state="normal", text="📸 ГЕНЕРИРОВАТЬ ПРЕВЬЮ")

    def process_web_image(self, img_bytes, app_name, text_data, out_dir, width, height):
        temp_path = os.path.join(out_dir, "temp.png")
        with open(temp_path, "wb") as f: f.write(img_bytes)
        
        with Image.open(temp_path) as img:
            img = img.convert("RGBA")
            w, h = img.size 

            gradient = Image.new('RGBA', (w, h), (0,0,0,0))
            draw = ImageDraw.Draw(gradient)
            start_y = int(h * 0.4)
            for y in range(start_y, h):
                alpha = int(250 * ((y - start_y) / (h - start_y))**1.5)
                draw.line([(0, y), (w, y)], fill=(15, 23, 42, min(alpha, 240)))
            
            out = Image.alpha_composite(img, gradient)
            draw_txt = ImageDraw.Draw(out)
            
            safe_title = clean_text(text_data['title']).upper()
            safe_desc = clean_text(text_data['desc'])

            scale_factor = max(w / 1200, 0.7)
            title_size = int(60 * scale_factor)
            desc_size = int(30 * scale_factor)

            try:
                script_dir = os.path.dirname(os.path.abspath(__file__))
                font_title = ImageFont.truetype(os.path.join(script_dir, "Montserrat-Bold.ttf"), title_size)
                font_desc = ImageFont.truetype(os.path.join(script_dir, "Inter-Medium.ttf"), desc_size)
            except OSError:
                font_title = ImageFont.load_default()
                font_desc = ImageFont.load_default()

            margin_left = int(80 * scale_factor)
            margin_bottom = int(80 * scale_factor)
            max_text_width = w - (margin_left * 2)

            desc_lines = wrap_text(safe_desc, font_desc, max_text_width, draw_txt)
            bbox_d = draw_txt.textbbox((0, 0), "A", font=font_desc)
            desc_h = (bbox_d[3] - bbox_d[1]) * 1.4
            total_desc_h = desc_h * len(desc_lines)

            title_lines = wrap_text(safe_title, font_title, max_text_width, draw_txt)
            bbox_t = draw_txt.textbbox((0, 0), "A", font=font_title)
            title_h = (bbox_t[3] - bbox_t[1]) * 1.3
            total_title_h = title_h * len(title_lines)

            y_desc = h - margin_bottom - total_desc_h
            y_title = y_desc - total_title_h - (20 * scale_factor)

            for line in title_lines:
                draw_txt.text((margin_left+4, y_title+4), line, font=font_title, fill=(0,0,0,180))
                draw_txt.text((margin_left, y_title), line, font=font_title, fill="#ffffff")
                y_title += title_h

            for line in desc_lines:
                draw_txt.text((margin_left+2, y_desc+2), line, font=font_desc, fill=(0,0,0,180))
                draw_txt.text((margin_left, y_desc), line, font=font_desc, fill="#cbd5e1")
                y_desc += desc_h

            bar_x = margin_left - (30 * scale_factor)
            bar_top = h - margin_bottom - total_desc_h - total_title_h - (20 * scale_factor) + 5
            bar_bottom = h - margin_bottom + desc_h
            
            draw_txt.rectangle([(bar_x, bar_top), (bar_x + int(8*scale_factor), bar_bottom)], fill=ACCENT_COLOR)

            final_path = os.path.join(out_dir, f"{app_name}_{width}x{height}.jpg")
            out.convert("RGB").save(final_path, quality=95)
        
        os.remove(temp_path)

if __name__ == "__main__":
    app = PromoGeneratorApp()
    app.mainloop()