/**
 * CODEBASE INDEXER
 * src/lib/code/codebase-indexer.ts
 * 
 * Local codebase indexing for context-aware queries.
 * Enables "Where is X defined?" queries against the connected repo.
 */

export interface CodeSymbol {
    name: string;
    type: 'function' | 'class' | 'interface' | 'variable' | 'type' | 'export';
    filePath: string;
    startLine: number;
    endLine: number;
    signature?: string;
    documentation?: string;
}

export interface FileIndex {
    path: string;
    relativePath: string;
    language: string;
    lastModified: string;
    symbols: CodeSymbol[];
    imports: string[];
    exports: string[];
}

export interface CodebaseIndex {
    projectId: string;
    rootPath: string;
    indexedAt: string;
    files: FileIndex[];
    symbolCount: number;
}

// Supported file extensions and their languages
const SUPPORTED_EXTENSIONS: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript-react',
    '.js': 'javascript',
    '.jsx': 'javascript-react',
    '.py': 'python',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.rb': 'ruby',
    '.cs': 'csharp',
};

// Patterns for extracting symbols (simplified regex-based)
const SYMBOL_PATTERNS: Record<string, RegExp[]> = {
    typescript: [
        /export\s+(?:async\s+)?function\s+(\w+)/g,
        /export\s+(?:default\s+)?class\s+(\w+)/g,
        /export\s+(?:default\s+)?interface\s+(\w+)/g,
        /export\s+type\s+(\w+)/g,
        /export\s+const\s+(\w+)/g,
        /export\s+enum\s+(\w+)/g,
    ],
    'typescript-react': [
        /export\s+(?:async\s+)?function\s+(\w+)/g,
        /export\s+(?:default\s+)?(?:const\s+)?(\w+)(?:\s*:\s*React\.FC)?/g,
        /export\s+(?:default\s+)?class\s+(\w+)/g,
        /export\s+interface\s+(\w+)/g,
        /export\s+type\s+(\w+)/g,
    ],
    javascript: [
        /export\s+(?:async\s+)?function\s+(\w+)/g,
        /export\s+(?:default\s+)?class\s+(\w+)/g,
        /export\s+const\s+(\w+)/g,
        /module\.exports\s*=\s*(\w+)/g,
    ],
    python: [
        /^def\s+(\w+)/gm,
        /^class\s+(\w+)/gm,
        /^(\w+)\s*=/gm,
    ],
};

/**
 * Extract symbols from file content
 */
export function extractSymbols(content: string, language: string, filePath: string): CodeSymbol[] {
    const symbols: CodeSymbol[] = [];
    const patterns = SYMBOL_PATTERNS[language] || SYMBOL_PATTERNS['typescript'];
    const lines = content.split('\n');
    
    for (const pattern of patterns) {
        const regex = new RegExp(pattern.source, pattern.flags);
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            const symbolName = match[1];
            if (!symbolName || symbolName.length < 2) continue; // Skip short names
            
            // Find line number
            const beforeMatch = content.substring(0, match.index);
            const lineNumber = beforeMatch.split('\n').length;
            
            // Determine type from match
            const matchText = match[0].toLowerCase();
            let type: CodeSymbol['type'] = 'export';
            if (matchText.includes('function')) type = 'function';
            else if (matchText.includes('class')) type = 'class';
            else if (matchText.includes('interface')) type = 'interface';
            else if (matchText.includes('type')) type = 'type';
            else if (matchText.includes('const') || matchText.includes('let')) type = 'variable';
            
            // Extract signature (next line or same line)
            const signature = lines[lineNumber - 1]?.trim();
            
            symbols.push({
                name: symbolName,
                type,
                filePath,
                startLine: lineNumber,
                endLine: lineNumber, // Would need AST for accurate end line
                signature,
            });
        }
    }
    
    return symbols;
}

/**
 * Extract imports from file content
 */
export function extractImports(content: string, language: string): string[] {
    const imports: string[] = [];
    
    if (language.includes('typescript') || language.includes('javascript')) {
        const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
    } else if (language === 'python') {
        const importRegex = /^(?:from\s+(\S+)|import\s+(\S+))/gm;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1] || match[2]);
        }
    }
    
    return imports;
}

/**
 * Get language from file extension
 */
export function getLanguage(filePath: string): string | null {
    const ext = filePath.substring(filePath.lastIndexOf('.'));
    return SUPPORTED_EXTENSIONS[ext] || null;
}

/**
 * Codebase Indexer Manager
 */
export class CodebaseIndexer {
    private index: CodebaseIndex | null = null;
    private storageKey: string;
    
    constructor(projectId: string) {
        this.storageKey = `codra:codebaseIndex:${projectId}`;
        this.loadIndex();
    }
    
    /**
     * Index a file
     */
    indexFile(path: string, relativePath: string, content: string, lastModified: string): FileIndex | null {
        const language = getLanguage(path);
        if (!language) return null;
        
        const symbols = extractSymbols(content, language, relativePath);
        const imports = extractImports(content, language);
        const exports = symbols.filter(s => s.type !== 'variable').map(s => s.name);
        
        return {
            path,
            relativePath,
            language,
            lastModified,
            symbols,
            imports,
            exports,
        };
    }
    
    /**
     * Add or update file in index
     */
    addFile(fileIndex: FileIndex): void {
        if (!this.index) {
            this.index = {
                projectId: this.storageKey.replace('codra:codebaseIndex:', ''),
                rootPath: '',
                indexedAt: new Date().toISOString(),
                files: [],
                symbolCount: 0,
            };
        }
        
        // Remove existing entry for this file
        this.index.files = this.index.files.filter(f => f.relativePath !== fileIndex.relativePath);
        
        // Add new entry
        this.index.files.push(fileIndex);
        this.index.symbolCount = this.index.files.reduce((sum, f) => sum + f.symbols.length, 0);
        this.index.indexedAt = new Date().toISOString();
        
        this.saveIndex();
    }
    
    /**
     * Search for symbol by name
     */
    findSymbol(name: string): CodeSymbol[] {
        if (!this.index) return [];
        
        const results: CodeSymbol[] = [];
        const lowerName = name.toLowerCase();
        
        for (const file of this.index.files) {
            for (const symbol of file.symbols) {
                if (symbol.name.toLowerCase().includes(lowerName)) {
                    results.push(symbol);
                }
            }
        }
        
        return results;
    }
    
    /**
     * Get all symbols of a type
     */
    getSymbolsByType(type: CodeSymbol['type']): CodeSymbol[] {
        if (!this.index) return [];
        
        const results: CodeSymbol[] = [];
        for (const file of this.index.files) {
            for (const symbol of file.symbols) {
                if (symbol.type === type) {
                    results.push(symbol);
                }
            }
        }
        
        return results;
    }
    
    /**
     * Find files that import a given module
     */
    findImporters(moduleName: string): FileIndex[] {
        if (!this.index) return [];
        
        return this.index.files.filter(f => 
            f.imports.some(i => i.includes(moduleName))
        );
    }
    
    /**
     * Get file by path
     */
    getFile(relativePath: string): FileIndex | null {
        return this.index?.files.find(f => f.relativePath === relativePath) || null;
    }
    
    /**
     * Get index stats
     */
    getStats(): { fileCount: number; symbolCount: number; indexedAt: string | null } {
        return {
            fileCount: this.index?.files.length || 0,
            symbolCount: this.index?.symbolCount || 0,
            indexedAt: this.index?.indexedAt || null,
        };
    }
    
    /**
     * Generate context for AI query
     */
    generateContext(query: string): string {
        const relevantSymbols = this.findSymbol(query);
        
        if (relevantSymbols.length === 0) {
            return `No symbols matching "${query}" found in the codebase.`;
        }
        
        const sections: string[] = ['## Relevant Code Locations'];
        
        for (const symbol of relevantSymbols.slice(0, 10)) {
            sections.push(`- **${symbol.name}** (${symbol.type}) in \`${symbol.filePath}:${symbol.startLine}\``);
            if (symbol.signature) {
                sections.push(`  \`\`\`\n  ${symbol.signature}\n  \`\`\``);
            }
        }
        
        return sections.join('\n');
    }
    
    /**
     * Load index from localStorage
     */
    private loadIndex(): void {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.index = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load codebase index:', e);
        }
    }
    
    /**
     * Save index to localStorage
     */
    private saveIndex(): void {
        if (this.index) {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.index));
            } catch (e) {
                console.error('Failed to save codebase index:', e);
            }
        }
    }
    
    /**
     * Clear index
     */
    clear(): void {
        this.index = null;
        localStorage.removeItem(this.storageKey);
    }
}

/**
 * Create codebase indexer instance
 */
export function createCodebaseIndexer(projectId: string): CodebaseIndexer {
    return new CodebaseIndexer(projectId);
}
