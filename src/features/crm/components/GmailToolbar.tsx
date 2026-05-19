import React, { useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Undo2, Redo2, Bold, Italic, Underline, Baseline,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Outdent, Indent, Quote, Trash2
} from 'lucide-react';

interface GmailToolbarProps {
  editor: Editor | null;
}

export const GMAIL_FONTS = [
  { label: 'Sans Serif', value: 'sans-serif' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Serif', value: 'serif' },
  { label: 'Fixed Width', value: 'monospace' },
  { label: 'Wide', value: 'Arial Black' },
  { label: 'Narrow', value: 'Arial Narrow' },
  { label: 'Comic Sans MS', value: 'Comic Sans MS' },
  { label: 'Garamond', value: 'Garamond' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Tahoma', value: 'Tahoma' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS' },
  { label: 'Verdana', value: 'Verdana' }
];

export const GMAIL_SIZES = [
  { label: 'Small', value: '12px' },
  { label: 'Normal', value: '14px' },
  { label: 'Large', value: '18px' },
  { label: 'Huge', value: '24px' }
];

const TEXT_COLORS = [
  '#000000', '#444444', '#666666', '#999999', '#cccccc', '#ffffff',
  '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#9900ff', '#ff00ff',
  '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6fa8dc', '#8e7cc3', '#c27ba0',
  '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3d85c6', '#674ea7', '#a64d79'
];

const BG_COLORS = [
  '#ffffff', '#f3f3f3', '#e7e7e7', '#cccccc', '#b7b7b7', '#999999',
  '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6fa8dc', '#8e7cc3', '#c27ba0',
  '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3d85c6', '#674ea7', '#a64d79',
  '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#0b5394', '#351c75', '#741b47'
];

export const GmailToolbar: React.FC<GmailToolbarProps> = ({ editor }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 p-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-t-lg select-none text-gray-700 dark:text-gray-200">
      {/* Undo/Redo */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 rounded transition-colors"
        title="Undo"
      >
        <Undo2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 rounded transition-colors"
        title="Redo"
      >
        <Redo2 className="h-4 w-4" />
      </button>

      <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* Font Family Selector */}
      <select
        onChange={(e) => {
          if (e.target.value === 'default') {
            (editor.chain().focus() as any).unsetFontFamily().run();
          } else {
            (editor.chain().focus() as any).setFontFamily(e.target.value).run();
          }
        }}
        className="text-xs bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 border-none outline-none py-1 px-2 rounded cursor-pointer font-medium"
        title="Font Family"
      >
        <option value="default">Sans Serif</option>
        {GMAIL_FONTS.map(font => (
          <option key={font.value} value={font.value}>{font.label}</option>
        ))}
      </select>

      {/* Font Size Selector */}
      <select
        onChange={(e) => {
          if (e.target.value === 'default') {
            (editor.chain().focus() as any).unsetFontSize().run();
          } else {
            (editor.chain().focus() as any).setFontSize(e.target.value).run();
          }
        }}
        className="text-xs bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 border-none outline-none py-1 px-2 rounded cursor-pointer font-medium"
        title="Font Size"
      >
        <option value="default">Normal</option>
        {GMAIL_SIZES.map(size => (
          <option key={size.value} value={size.value}>{size.label}</option>
        ))}
      </select>

      <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* Bold, Italic, Underline */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700 font-extrabold text-blue-600' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700 text-blue-600' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('underline') ? 'bg-gray-200 dark:bg-gray-700 text-blue-600' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        title="Underline"
      >
        <Underline className="h-4 w-4" />
      </button>

      {/* Color Picker Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowColorPicker(!showColorPicker)}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-0.5 ${showColorPicker ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          title="Text color"
        >
          <Baseline className="h-4 w-4" />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
        </button>

        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 w-64 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="mb-2">
              <span className="text-[10px] uppercase font-bold text-gray-400">Text Color</span>
              <div className="grid grid-cols-8 gap-1 mt-1">
                {TEXT_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                      setShowColorPicker(false);
                    }}
                    style={{ backgroundColor: color }}
                    className="w-5 h-5 rounded-sm border border-gray-200 dark:border-gray-800 hover:scale-115 transition-transform"
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-2 mt-2">
              <span className="text-[10px] uppercase font-bold text-gray-400">Highlight Color</span>
              <div className="grid grid-cols-8 gap-1 mt-1">
                {BG_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setHighlight({ color }).run();
                      setShowColorPicker(false);
                    }}
                    style={{ backgroundColor: color }}
                    className="w-5 h-5 rounded-sm border border-gray-200 dark:border-gray-800 hover:scale-115 transition-transform"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* Alignments */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200 dark:bg-gray-700 text-blue-600' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        title="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200 dark:bg-gray-700 text-blue-600' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        title="Align Center"
      >
        <AlignCenter className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200 dark:bg-gray-700 text-blue-600' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        title="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200 dark:bg-gray-700 text-blue-600' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        title="Justify"
      >
        <AlignJustify className="h-4 w-4" />
      </button>

      <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* Lists */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700 text-blue-600' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700 text-blue-600' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </button>

      {/* Indentation */}
      <button
        type="button"
        onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
        disabled={!editor.can().sinkListItem('listItem')}
        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
        title="Indent"
      >
        <Indent className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().liftListItem('listItem').run()}
        disabled={!editor.can().liftListItem('listItem')}
        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
        title="Outdent"
      >
        <Outdent className="h-4 w-4" />
      </button>

      <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* Blockquote & Link */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-700 text-blue-600' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </button>

      {/* Clear Styles / Formatting */}
      <button
        type="button"
        onClick={() => {
          editor.chain().focus().clearNodes().unsetAllMarks().run();
        }}
        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors ml-auto"
        title="Remove formatting"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};
