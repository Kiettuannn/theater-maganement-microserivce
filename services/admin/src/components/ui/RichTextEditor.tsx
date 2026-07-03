import { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { Button } from "./button";
import { Label } from "./label";
import { Code2 } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  label?: string;
  height?: number;
  showVariableButtons?: boolean;
  variables?: { name: string; label: string }[];
  error?: string;
}

export function RichTextEditor({
  value,
  onChange,
  label,
  height = 400,
  showVariableButtons = true,
  variables = [
    { name: "customerName", label: "Customer Name" },
    { name: "movieName", label: "Movie Name" },
    { name: "bookingCode", label: "Booking Code" },
    { name: "showTime", label: "Show Time" },
    { name: "seatNumber", label: "Seat Number" },
    { name: "totalPrice", label: "Total Price" },
  ],
  error,
}: RichTextEditorProps) {
  const editorRef = useRef<any>(null);

  const insertVariable = (varName: string) => {
    if (editorRef.current) {
      editorRef.current.insertContent(`<strong>{{${varName}}}</strong>`);
    }
  };

  const toggleCodeView = () => {
    if (editorRef.current) {
      editorRef.current.execCommand("mceCodeEditor");
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      {showVariableButtons && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/30 border border-border rounded-md">
          <span className="text-sm text-muted-foreground font-medium self-center">
            Insert Variables:
          </span>
          {variables.map((variable) => (
            <Button
              key={variable.name}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => insertVariable(variable.name)}
              className="cursor-pointer"
            >
              {variable.label}
            </Button>
          ))}
          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleCodeView}
              className="cursor-pointer"
              title="View HTML Code"
            >
              <Code2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <Editor
        apiKey="n23k62m8xjyv2fkl0c4484hqbm0s6nd7tus1axohjrjeymrx"
        onInit={(_evt, editor) => (editorRef.current = editor)}
        value={value}
        init={{
          height: height,
          menubar: false,
          plugins: [
            // Core editing features
            "anchor",
            "autolink",
            "charmap",
            "codesample",
            "emoticons",
            "link",
            "lists",
            "media",
            "searchreplace",
            "table",
            "visualblocks",
            "wordcount",
            "code",
            "preview",
            "fullscreen",
            "help",
            // Premium features (trial until Jan 28, 2026)
            "checklist",
            "advtable",
            "powerpaste",
            "formatpainter",
          ],
          toolbar:
            "undo redo | blocks fontfamily fontsize | " +
            "bold italic underline strikethrough | forecolor backcolor | " +
            "alignleft aligncenter alignright alignjustify | " +
            "bullist numlist checklist outdent indent | " +
            "link media table | formatpainter | " +
            "emoticons charmap codesample | code preview | removeformat help",
          content_style: `
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
              font-size: 14px;
              line-height: 1.6;
              padding: 10px;
            }
            strong { color: #3b82f6; }
          `,
          skin: "oxide",
          content_css: "default",
          branding: false,
          promotion: false,
        }}
        onEditorChange={(content) => onChange(content)}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
