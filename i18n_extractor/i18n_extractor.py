import tkinter as tk
from tkinter import filedialog, messagebox
import json
import re
import os
from bs4 import BeautifulSoup

# ==========================================
# 🛠️ КОНФИГУРАЦИЯ
# ==========================================

DEFAULT_LANG = 'ru'
OUTPUT_JSON_FILE = 'translations_all_services.json'

# ==========================================
# 🔍 ЛОГИКА ИЗВЛЕЧЕНИЯ ФРАЗ
# ==========================================

def extract_strings_from_js(js_content):
    """
    Извлекает русские строки из JavaScript, игнорируя существующий словарь translations.
    """
    phrases = set()
    
    # 1. Вырезаем существующий блок 'translations' (если есть)
    js_block_regex = re.compile(r'const translations = \{[\s\S]*?\};', re.MULTILINE)
    clean_js_content = js_block_regex.sub('', js_content)
    
    # 2. Поиск строковых литералов в кавычках
    string_literals = re.findall(r'["\']([^"\']*)["\']', clean_js_content)
    
    for string in string_literals:
        # Фильтры: пропускаем короткие, технические, URL и т.п.
        if not string or len(string.strip()) < 3 or re.match(r'^[\W\d\s\s]+$', string):
            continue
        if any(ext in string.lower() for ext in ['.css', '.js', '.png', '.jpg', 'http', 'url', 'data:image']):
            continue
            
        # Если строка содержит кириллицу (это русский текст)
        if re.search(r'[а-яА-ЯёЁ]', string):
            clean_string = string.strip()
            # Генерируем ключ, заменяя небуквенные символы на _
            key = re.sub(r'[^\w]+', '_', clean_string).strip('_')
            phrases.add((key, clean_string))
            
    # Также извлекаем фразы из console.log, если они не содержат ключа 'nextCaptcha' (уже переводится)
    console_phrases = re.findall(r'console\.log\([`\']([^`\']*)[\'`]\)', js_content)
    for string in console_phrases:
         if re.search(r'[а-яА-ЯёЁ]', string):
            clean_string = string.strip()
            key = re.sub(r'[^\w]+', '_', clean_string).strip('_')
            phrases.add((key, clean_string))

    return dict(phrases)


def extract_strings_from_html(html_content):
    """
    Извлекает текстовые строки из HTML-тегов с помощью BeautifulSoup.
    """
    phrases = set()
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Теги, которые могут содержать текст
    tags = ['title', 'p', 'span', 'h1', 'h2', 'h3', 'label', 'button', 'a']
    
    for tag_name in tags:
        for tag in soup.find_all(tag_name):
            text = tag.get_text(strip=True)
            if re.search(r'[а-яА-ЯёЁ]', text) and len(text) > 2:
                # Дополнительная проверка на то, что это не код
                if not re.match(r'^[\W\d\s\s]+$', text):
                    clean_text = text.strip()
                    key = re.sub(r'[^\w]+', '_', clean_text).strip('_')
                    phrases.add((key, clean_text))
                    
    return dict(phrases)

# ==========================================
# ⚙️ ЛОГИКА ОБРАБОТКИ ПАПОК
# ==========================================

def process_service_folder(folder_path, service_name):
    """
    Сканирует index.html и script.js в папке сервиса и возвращает словарь фраз.
    """
    html_path = os.path.join(folder_path, 'index.html')
    js_path = os.path.join(folder_path, 'script.js')
    
    service_phrases = {}
    
    # 1. Обработка HTML
    if os.path.exists(html_path):
        try:
            with open(html_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            service_phrases.update(extract_strings_from_html(html_content))
            print(f"   [HTML] Обработано {html_path}")
        except Exception as e:
            print(f"   [HTML] Ошибка чтения/парсинга {html_path}: {e}")

    # 2. Обработка JavaScript
    if os.path.exists(js_path):
        try:
            with open(js_path, 'r', encoding='utf-8') as f:
                js_content = f.read()
            # Объединяем, при этом JS переопределяет HTML, если ключи совпадут (что маловероятно)
            service_phrases.update(extract_strings_from_js(js_content)) 
            print(f"   [JS] Обработано {js_path}")
        except Exception as e:
            print(f"   [JS] Ошибка чтения/парсинга {js_path}: {e}")

    return service_phrases


def process_root_folder(root_dir):
    """
    Сканирует все подпапки в root_dir как сервисы.
    """
    all_translations = {}
    service_count = 0
    
    # Проход по всем элементам в корневой папке
    for item in os.listdir(root_dir):
        service_path = os.path.join(root_dir, item)
        
        # Проверяем, что это папка
        if os.path.isdir(service_path):
            service_name = item
            print(f"--- 📂 Начинаем обработку сервиса: {service_name} ---")
            
            phrases = process_service_folder(service_path, service_name)
            
            if phrases:
                all_translations[service_name] = phrases
                service_count += 1
                print(f"--- ✅ Сервис {service_name}: Извлечено {len(phrases)} фраз. ---")
            else:
                print(f"--- ⚠️ Сервис {service_name}: Фразы не найдены. Пропуск. ---")
                
    if not all_translations:
        messagebox.showinfo("Готово", "Сканирование завершено, но ни в одной папке не найдены фразы для перевода.")
        return None
        
    # Формируем финальный словарь с иерархией: {"ru": {"service_name": {...}}}
    final_json_structure = {
        DEFAULT_LANG: all_translations
    }
    
    # Сохраняем результат
    try:
        output_path = os.path.join(root_dir, OUTPUT_JSON_FILE)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(final_json_structure, f, ensure_ascii=False, indent=4)
            
        messagebox.showinfo("Готово", 
            f"✅ Сканирование успешно завершено!\n"
            f"Обработано сервисов: {service_count}\n"
            f"Файл создан: {output_path}")
            
    except Exception as e:
        messagebox.showerror("Ошибка", f"Не удалось сохранить JSON: {e}")
        
    return final_json_structure

# ==========================================
# 🖼️ ГРАФИЧЕСКИЙ ИНТЕРФЕЙС (TKINTER)
# ==========================================

class I18nExtractorApp:
    def __init__(self, master):
        self.master = master
        master.title("i18n Экстрактор (Tkinter)")
        master.geometry("450x200")
        master.resizable(False, False)

        self.root_dir = ""

        # Метка и поле для отображения пути
        self.label = tk.Label(master, text="1. Выберите корневую папку с сервисами:")
        self.label.pack(pady=10)

        self.path_entry = tk.Entry(master, width=50, state='readonly')
        self.path_entry.pack(padx=20)
        
        # Кнопка для выбора папки
        self.browse_button = tk.Button(master, text="Выбрать папку", command=self.browse_folder)
        self.browse_button.pack(pady=5)

        # Кнопка запуска
        self.process_button = tk.Button(master, 
                                        text="2. 🚀 Начать сканирование и создать JSON", 
                                        command=self.start_processing, 
                                        state=tk.DISABLED, 
                                        bg='#28a745', 
                                        fg='white', 
                                        font=('Arial', 10, 'bold'))
        self.process_button.pack(pady=15)

    def browse_folder(self):
        """Открывает диалог выбора папки."""
        folder = filedialog.askdirectory()
        if folder:
            self.root_dir = folder
            self.path_entry.config(state='normal')
            self.path_entry.delete(0, tk.END)
            self.path_entry.insert(0, self.root_dir)
            self.path_entry.config(state='readonly')
            self.process_button.config(state=tk.NORMAL)
            print(f"Выбрана папка: {self.root_dir}")

    def start_processing(self):
        """Запускает процесс обработки."""
        if not self.root_dir:
            messagebox.showwarning("Предупреждение", "Сначала выберите корневую папку.")
            return

        # Блокируем кнопки во время работы
        self.browse_button.config(state=tk.DISABLED)
        self.process_button.config(state=tk.DISABLED, text="Сканирование в процессе...")
        self.master.update()
        
        # Запуск основной логики
        result = process_root_folder(self.root_dir)

        # Разблокируем кнопки
        self.browse_button.config(state=tk.NORMAL)
        self.process_button.config(state=tk.NORMAL, text="2. 🚀 Начать сканирование и создать JSON")
        
        # Если результат None, значит была ошибка или ничего не найдено
        if result is None:
            pass # Сообщение об ошибке уже выведено внутри process_root_folder


# ==========================================
# 🏁 ЗАПУСК ПРИЛОЖЕНИЯ
# ==========================================
if __name__ == '__main__':
    root = tk.Tk()
    app = I18nExtractorApp(root)
    root.mainloop()