import { useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Voer tekst in...",
  className = "",
  readOnly = false
}: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);
  const [htmlDialogOpen, setHtmlDialogOpen] = useState(false);
  const [htmlInput, setHtmlInput] = useState('');
  const [isRawHtmlMode, setIsRawHtmlMode] = useState(false);
  const [rawHtmlValue, setRawHtmlValue] = useState(value || '');

  // Sync rawHtmlValue when value prop changes and detect complex HTML
  useEffect(() => {
    const newValue = value || '';
    setRawHtmlValue(newValue);

    // Auto-switch to HTML mode if content contains table elements
    if (newValue.includes('<table') && !isRawHtmlMode) {
      setIsRawHtmlMode(true);
    }
  }, [value, isRawHtmlMode]);

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean']
      ]
    }
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'align',
    'list', 'bullet',
    'blockquote', 'code-block',
    'link', 'image'
  ];

  // Add tooltips to toolbar buttons
  useEffect(() => {
    const addTooltips = () => {
      const toolbarButtons = {
        '.ql-header[value="1"]': 'Kop 1',
        '.ql-header[value="2"]': 'Kop 2',
        '.ql-header[value="3"]': 'Kop 3',
        '.ql-header[value="false"]': 'Normale tekst',
        '.ql-bold': 'Vetgedrukt',
        '.ql-italic': 'Cursief',
        '.ql-underline': 'Onderstreept',
        '.ql-strike': 'Doorgehaald',
        '.ql-color .ql-picker-label': 'Tekstkleur',
        '.ql-background .ql-picker-label': 'Achtergrondkleur',
        '.ql-align[value=""]': 'Links uitlijnen',
        '.ql-align[value="center"]': 'Centreren',
        '.ql-align[value="right"]': 'Rechts uitlijnen',
        '.ql-align[value="justify"]': 'Uitvullen',
        '.ql-list[value="ordered"]': 'Genummerde lijst',
        '.ql-list[value="bullet"]': 'Ongenummerde lijst',
        '.ql-blockquote': 'Citaat',
        '.ql-code-block': 'Code blok',
        '.ql-link': 'Link invoegen',
        '.ql-image': 'Afbeelding invoegen',
        '.ql-clean': 'Opmaak wissen'
      };

      Object.entries(toolbarButtons).forEach(([selector, title]) => {
        const element = document.querySelector(selector);
        if (element) {
          element.setAttribute('title', title);
        }
      });
    };

    // Add tooltips after a short delay to ensure the toolbar is rendered
    const timer = setTimeout(addTooltips, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleHtmlInsert = () => {
    if (quillRef.current && htmlInput.trim()) {
      const quill = quillRef.current.getEditor();

      // Get current content as HTML
      const currentHTML = quill.root.innerHTML;

      // Create new content by appending the HTML
      const newHTML = currentHTML + '\n\n' + htmlInput;

      // Disable the editor temporarily to prevent formatting
      quill.disable();

      // Set the raw HTML
      quill.root.innerHTML = newHTML;

      // Re-enable editor
      quill.enable();

      // Manually trigger onChange with the raw HTML
      onChange(newHTML);

      // Clear the input and close dialog
      setHtmlInput('');
      setHtmlDialogOpen(false);
    }
  };

  const handleOpenHtmlDialog = () => {
    setHtmlInput('');
    setHtmlDialogOpen(true);
  };

  const toggleHtmlMode = () => {
    if (isRawHtmlMode) {
      // Switching from Raw HTML to Rich Text
      onChange(rawHtmlValue);
      setIsRawHtmlMode(false);
    } else {
      // Switching from Rich Text to Raw HTML
      setRawHtmlValue(value);
      setIsRawHtmlMode(true);
    }
  };

  const handleRawHtmlChange = (newValue: string) => {
    setRawHtmlValue(newValue);
    onChange(newValue);
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      {/* Mode Toggle */}
      <div className="mb-2 flex justify-between items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleHtmlMode}
          className="text-xs"
        >
          {isRawHtmlMode ? '📝 Rich Text Mode' : '💻 HTML Mode'}
        </Button>
        {!isRawHtmlMode && (
          <span className="text-xs text-gray-600">💡 Gebruik HTML Mode voor tabellen</span>
        )}
      </div>

      {!isRawHtmlMode ? (
        <ReactQuill
          ref={quillRef}
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={readOnly}
          theme="snow"
          preserveWhitespace
          style={{
            backgroundColor: 'white',
            borderRadius: '6px'
          }}
        />
      ) : (
        <Textarea
          value={rawHtmlValue}
          onChange={(e) => handleRawHtmlChange(e.target.value)}
          placeholder="Plak hier je HTML code..."
          className="min-h-[200px] font-mono text-sm"
          style={{
            backgroundColor: 'white',
            borderRadius: '6px'
          }}
        />
      )}

      {/* HTML Insert Button - only show in Rich Text mode */}
      <div className="mt-2 flex justify-end">
        {!isRawHtmlMode && (
        <Dialog open={htmlDialogOpen} onOpenChange={setHtmlDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenHtmlDialog}
              className="text-xs"
            >
              📝 HTML invoegen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>HTML Code Invoegen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">HTML Code:</label>
                <Textarea
                  value={htmlInput}
                  onChange={(e) => setHtmlInput(e.target.value)}
                  placeholder="Plak hier je HTML code, bijvoorbeeld:
<table border='1'>
  <tr>
    <td>Cel 1</td>
    <td>Cel 2</td>
  </tr>
</table>

Of andere HTML elementen zoals divs, spans, etc."
                  className="mt-2 font-mono text-sm"
                  rows={10}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setHtmlDialogOpen(false)}
                >
                  Annuleren
                </Button>
                <Button
                  type="button"
                  onClick={handleHtmlInsert}
                  disabled={!htmlInput.trim()}
                >
                  HTML Invoegen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <style jsx global>{`
        .ql-editor {
          min-height: 150px;
          font-family: inherit;
        }

        .ql-editor table {
          border-collapse: collapse;
          width: 100%;
          margin: 10px 0;
        }

        .ql-editor table td,
        .ql-editor table th {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
          vertical-align: top;
        }

        .ql-editor table th {
          background-color: #f2f2f2;
          font-weight: bold;
        }

        .ql-editor table tr:nth-child(even) {
          background-color: #f9f9f9;
        }

        /* Enhanced styling for custom HTML tables */
        .ql-editor table[border],
        .ql-editor table[style*="border"] {
          border-collapse: collapse !important;
        }

        .ql-editor table[border] td,
        .ql-editor table[border] th,
        .ql-editor table[style*="border"] td,
        .ql-editor table[style*="border"] th {
          border: 1px solid #ddd !important;
        }

        /* Preserve inline styles for custom tables */
        .ql-editor table td[style],
        .ql-editor table th[style] {
          border: inherit !important;
          padding: inherit !important;
          background-color: inherit !important;
          text-align: inherit !important;
        }

        .ql-editor blockquote {
          border-left: 4px solid #ccc;
          margin-left: 0;
          padding-left: 16px;
          font-style: italic;
        }

        .ql-editor pre {
          background-color: #f4f4f4;
          padding: 12px;
          border-radius: 4px;
          overflow-x: auto;
        }

        .ql-editor img {
          max-width: 100%;
          height: auto;
        }

        .ql-toolbar.ql-snow {
          border-top-left-radius: 6px;
          border-top-right-radius: 6px;
          border-bottom: 1px solid #ccc;
        }

        .ql-container.ql-snow {
          border-bottom-left-radius: 6px;
          border-bottom-right-radius: 6px;
        }

        .ql-snow .ql-tooltip {
          z-index: 1000;
        }

        /* Enhanced tooltips for toolbar buttons */
        .ql-toolbar button:hover,
        .ql-toolbar .ql-picker-label:hover {
          position: relative;
        }

        .ql-toolbar button:hover:after,
        .ql-toolbar .ql-picker-label:hover:after {
          content: attr(title);
          position: absolute;
          bottom: -30px;
          left: 50%;
          transform: translateX(-50%);
          background: #333;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 1001;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}