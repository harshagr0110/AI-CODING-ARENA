"use client"

import { Editor } from "@monaco-editor/react"
import { useTheme } from "next-themes"

interface MonacoCodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  height?: string
  readOnly?: boolean
}

export function MonacoCodeEditor({ 
  value, 
  onChange, 
  language, 
  height = "300px",
  readOnly = false 
}: MonacoCodeEditorProps) {
  const { theme } = useTheme()

  const getMonacoLanguage = (lang: string) => {
    switch (lang) {
      case 'javascript': return 'javascript'
      case 'python': return 'python'
      case 'cpp': return 'cpp'
      case 'java': return 'java'
      case 'c': return 'c'
      default: return 'javascript'
    }
  }

  const getDefaultCode = (lang: string) => {
    switch (lang) {
      case 'javascript':
        return `// Write your JavaScript solution here
function solution() {
    // Your code here
}

console.log(solution());`
      case 'python':
        return `# Write your Python solution here
def solution():
    # Your code here
    pass

print(solution())`
      case 'cpp':
        return `#include <iostream>
using namespace std;

int main() {
    // Write your C++ solution here
    
    return 0;
}`
      case 'java':
        return `public class Solution {
    public static void main(String[] args) {
        // Write your Java solution here
        
    }
}`
      case 'c':
        return `#include <stdio.h>

int main() {
    // Write your C solution here
    
    return 0;
}`
      default:
        return '// Write your code here'
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Editor
        height={height}
        language={getMonacoLanguage(language)}
        value={value || getDefaultCode(language)}
        onChange={(val) => onChange(val || "")}
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          contextmenu: true,
          selectOnLineNumbers: true,
          glyphMargin: false,
          folding: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
        }}
      />
    </div>
  )
}