import os
import re

pages_dir = 'pages/tab'
count = 0

for root, dirs, files in os.walk(pages_dir):
    for f in files:
        if f.endswith('.js') and 'request' not in f:
            filepath = os.path.join(root, f)
            
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # 替换 import 语句
            content = re.sub(
                r"const\s+\{[^}]+\}\s*=\s*await\s+import\(['\"].*?request\.js['\"]\)",
                'const app = getApp()',
                content
            )
            
            # 替换函数调用
            content = re.sub(r'\bmpGetAuth\s*\(', 'app.mpGetAuth(', content)
            content = re.sub(r'\bmpPostAuth\s*\(', 'app.mpPostAuth(', content)
            content = re.sub(r'\bmpPutAuth\s*\(', 'app.mpPutAuth(', content)
            content = re.sub(r'\bmpUploadFile\s*\(', 'app.mpUploadFile(', content)
            content = re.sub(r'\bmpDownloadFile\s*\(', 'app.mpDownloadFile(', content)
            content = re.sub(r'\bmpGet\s*\(', 'app.mpGet(', content)
            content = re.sub(r'\bmpPost\s*\(', 'app.mpPost(', content)
            
            with open(filepath, 'w', encoding='utf-8') as file:
                file.write(content)
            
            count += 1
            print(f'已处理: {f}')

print(f'\n总共处理了 {count} 个文件')
