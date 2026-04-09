import re

file_path = r'c:\Users\Direct\Music\Nova pasta (2)\IMPRIME---AI-\src\renderer\src\components\EditorView.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find FIRST instance of processBackgroundRemovalInternal
start_match = re.search(r'const\s+processBackgroundRemovalInternal', content)
if not start_match:
    print("CRITICAL: procesFunc not found")
    exit(1)

# Find handleDeleteAction
end_match = re.search(r'const\s+handleDeleteAction', content)
if not end_match:
    print("CRITICAL: handleDeleteAction not found")
    exit(1)

if start_match.start() >= end_match.start():
    print("CRITICAL: order mismatch")
    exit(1)

# Extract everything BEFORE process... (Remove garbage comments above if any, but keep context)
# Actually, the view showed triple comments lines 364-367.
# We should probably strip those too if possible.
# But start_match points to 'const'.
# The comments are before it.
# Let's clean the comments manually by replacing `before` end.

before = content[:start_match.start()]
# Remove duplicated comments specific to this function if present right before
before = re.sub(r'(// Internal function for AI to use without opening modal\s*)+$', '', before)


# Extract everything AFTER handleDeleteAction (inclusive)
after = content[end_match.start():]

# Insert clean function
clean_func = r"""    // Internal function for AI to use without opening modal
    const processBackgroundRemovalInternal = async (img: ImageElement): Promise<{ success: boolean; newAttrs?: any }> => {
        try {
            const api = (window as any).electronAPI;
            if (!api?.removeBackgroundBase64) return { success: false };

            let src = img.src;
            if (imageSourceCache.current.has(img.id)) src = imageSourceCache.current.get(img.id)!;
            if (!src) return { success: false };

            const base64Data = src.includes('base64,') ? src.split('base64,')[1] : src;
            const result = await api.removeBackgroundBase64(base64Data, true);

            if (result.success && result.resultBase64) {
                let newSrc = `data:image/png;base64,${result.resultBase64}`;
                let updates: any = {};
                
                try {
                    const trimRes = await trimTransparentPixels(newSrc);
                    if (trimRes) {
                        newSrc = trimRes.src;
                        updates.x = img.x + (trimRes.x * img.scaleX);
                        updates.y = img.y + (trimRes.y * img.scaleY);
                        updates.width = trimRes.width;
                        updates.height = trimRes.height;
                        updates.srcRef = img.id; 
                    }
                } catch (trimErr) { console.warn("Trim failed", trimErr); }

                imageSourceCache.current.set(img.id, newSrc);
                setCacheVersion(v => v + 1);
                handleUpdateMany([{ id: img.id, attrs: updates }]);
                return { success: true, newAttrs: updates };
            }
            return { success: false };
        } catch (e) {
            console.error(e);
            return { success: false };
        }
    };"""

new_content = before + clean_func + "\n\n    " + after

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("SUCCESS: Rescued EditorView")
