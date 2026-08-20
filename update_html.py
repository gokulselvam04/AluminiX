import os
import glob
import re

html_files = glob.glob('*.html')
for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace viewport meta
    if '<meta name="viewport"' in content:
        content = re.sub(
            r'<meta name="viewport" content="[^"]+">',
            '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">\n  <link rel="manifest" href="manifest.json">',
            content
        )
    else:
        # If no viewport meta, add it before </head>
        content = content.replace('</head>', '  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">\n  <link rel="manifest" href="manifest.json">\n</head>')
        
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
print(f'Updated {len(html_files)} HTML files.')
