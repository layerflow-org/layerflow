/**
 * CST to LFF AST Converter
 * @fileoverview Converts Chevrotain CST to LFF AST with discriminated unions and strict typing
 * @public
 */

import type { LFFQ, LFFNodeDef, LFFEdgeDef, LFFDirectiveDef, ParseError, SourceLocation } from './types';

// ============================================================================
// Result Types for Error Handling
// ============================================================================

/**
 * Result type for safe error handling with explicit success/failure states
 */
type Result<T, E = ParseError> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * CST Node type representing Chevrotain's concrete syntax tree structure
 */
interface CSTNode {
  children?: Record<string, any[]>;
  image?: string;
  startLine?: number;
  endLine?: number;
  startColumn?: number;
  endColumn?: number;
}

/**
 * Conversion context for error tracking and source information
 */
interface ConversionContext {
  sourceText: string;
  lines: string[];
  errors: ParseError[];
}

// ============================================================================
// Core Converter Class
// ============================================================================

/**
 * Modular CST to LFF AST converter with discriminated union support
 */
class CSTToLFFConverter {
  private context: ConversionContext;

  constructor(sourceText: string) {
    this.context = {
      sourceText,
      lines: sourceText.split('\n'),
      errors: []
    };
  }

  /**
   * Main conversion entry point
   */
  convert(cst: CSTNode): LFFQ {
    const result: LFFQ = {
      nodes: [],
      edges: [],
      directives: [],
      errors: this.context.errors,
      sourceInfo: {
        text: this.context.sourceText,
        lines: this.context.lines
      }
    };

    if (!cst?.children) {
      return result;
    }

    this.convertDocument(cst, result);
    return result;
  }

  /**
   * Convert document-level CST
   */
  private convertDocument(cst: CSTNode, result: LFFQ): void {
    const { children } = cst;
    if (!children) return;

    // Process directives
    if (children.directive) {
      children.directive.forEach(directiveCst => {
        const directiveResult = DirectiveConverter.convert(directiveCst, this.context);
        if (directiveResult.success) {
          result.directives.push(directiveResult.data);
        }
      });
    }

    // Process nodes
    if (children.node) {
      children.node.forEach(nodeCst => {
        const nodeResult = NodeConverter.convert(nodeCst, this.context);
        if (nodeResult.success) {
          result.nodes.push(nodeResult.data);
        }
      });
    }

    // Process edges
    if (children.edge) {
      children.edge.forEach(edgeCst => {
        const edgeResult = EdgeConverter.convert(edgeCst, this.context);
        if (edgeResult.success) {
          result.edges.push(edgeResult.data);
        }
      });
    }
  }
}

// ============================================================================
// Directive Converter Module
// ============================================================================

class DirectiveConverter {
  static convert(cst: CSTNode, context: ConversionContext): Result<LFFDirectiveDef> {
    try {
      const { children } = cst;
      
      if (!children?.Directive?.[0] || !children?.value?.[0]) {
        return this.createError('Invalid directive structure: missing directive token or value', cst, context);
      }

      const directiveToken = children.Directive[0];
      const name = this.extractDirectiveName(directiveToken);
      
      const valueResult = ValueConverter.convert(children.value[0], context);
      if (!valueResult.success) {
        return { success: false, error: valueResult.error };
      }

      return {
        success: true,
        data: {
          type: 'directive', // Discriminator field
          name,
          value: valueResult.data,
          location: LocationHelper.getLocation(directiveToken)
        }
      };
    } catch (error) {
      return this.createError(`Directive conversion failed: ${error}`, cst, context);
    }
  }

  private static extractDirectiveName(token: CSTNode): string {
    const image = token.image || '';
    return image.startsWith('@') ? image.substring(1) : image;
  }

  private static createError(message: string, cst: CSTNode, context: ConversionContext): Result<LFFDirectiveDef> {
    const error: ParseError = {
      message,
      location: LocationHelper.getLocation(cst),
      severity: 'error'
    };
    context.errors.push(error);
    return { success: false, error };
  }
}

// ============================================================================
// Node Converter Module
// ============================================================================

class NodeConverter {
  static convert(cst: CSTNode, context: ConversionContext): Result<LFFNodeDef> {
    try {
      const { children } = cst;
      
      if (!children?.nodeIdentifier?.[0]) {
        return this.createError('Node must have identifier', cst, context);
      }

      const nameResult = this.extractNodeName(children.nodeIdentifier[0]);
      if (!nameResult.success) {
        return { success: false, error: nameResult.error };
      }

      const node: LFFNodeDef = {
        type: 'node', // Discriminator field
        name: nameResult.data.name,
        location: nameResult.data.location,
        children: []
      };

      // Handle anchor definition
      if (children.anchorDef?.[0]) {
        const anchorResult = this.extractAnchor(children.anchorDef[0]);
        if (anchorResult.success) {
          node.anchor = anchorResult.data;
        }
      }

      // Handle type list
      if (children.typeList?.[0]) {
        const typesResult = TypeListConverter.convert(children.typeList[0], context);
        if (typesResult.success) {
          node.types = typesResult.data;
        }
      }

      // Handle level specification (only for nodes)
      if (children.levelSpec?.[0]) {
        const levelResult = this.extractLevelSpec(children.levelSpec[0]);
        if (levelResult.success) {
          node.levelSpec = levelResult.data;
        }
      }

      // Handle node block (properties and children)
      if (children.nodeBlock?.[0]) {
        const blockResult = NodeBlockConverter.convert(children.nodeBlock[0], context);
        if (blockResult.success) {
          if (blockResult.data.properties) {
            node.properties = blockResult.data.properties;
          }
          if (blockResult.data.children.length > 0) {
            node.children = blockResult.data.children;
          }
        }
      }

      return { success: true, data: node };
    } catch (error) {
      return this.createError(`Node conversion failed: ${error}`, cst, context);
    }
  }

  private static extractNodeName(cst: CSTNode): Result<{ name: string; location: SourceLocation }> {
    try {
      const token = TokenExtractor.getTokenFromRule(cst);
      if (!token?.image) {
        throw new Error('Node identifier token not found');
      }

      const name = StringHelper.cleanValue(token.image);
      if (!name) {
        throw new Error('Empty node name');
      }

      return {
        success: true,
        data: {
          name,
          location: LocationHelper.getLocation(token)
        }
      };
    } catch (error) {
      const errorObj: ParseError = {
        message: `Invalid node name: ${error}`,
        location: LocationHelper.getLocation(cst),
        severity: 'error'
      };
      return { success: false, error: errorObj };
    }
  }

  private static extractAnchor(cst: CSTNode): Result<string> {
    try {
      const token = TokenExtractor.getTokenFromAnchorDef(cst);
      if (!token?.image) {
        throw new Error('Anchor definition token not found');
      }

      const anchor = token.image.replace(/^&/, '');
      if (!this.isValidAnchorName(anchor)) {
        throw new Error(`Invalid anchor name: ${anchor}`);
      }

      return { success: true, data: anchor };
    } catch (error) {
      const errorObj: ParseError = {
        message: `Invalid anchor definition: ${error}`,
        location: LocationHelper.getLocation(cst),
        severity: 'error'
      };
      return { success: false, error: errorObj };
    }
  }

  private static extractLevelSpec(cst: CSTNode): Result<string> {
    try {
      const token = TokenExtractor.getTokenFromLevelSpec(cst);
      if (!token?.image) {
        throw new Error('Level specification token not found');
      }

      const levelSpec = token.image;
      if (!this.isValidLevelSpec(levelSpec)) {
        throw new Error(`Invalid level specification: ${levelSpec}`);
      }

      return { success: true, data: levelSpec };
    } catch (error) {
      const errorObj: ParseError = {
        message: `Invalid level specification: ${error}`,
        location: LocationHelper.getLocation(cst),
        severity: 'error'
      };
      return { success: false, error: errorObj };
    }
  }

  private static isValidAnchorName(name: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name);
  }

  private static isValidLevelSpec(spec: string): boolean {
    return /^@\d+(?:\+|\-\d+)?$/.test(spec);
  }

  private static createError(message: string, cst: CSTNode, context: ConversionContext): Result<LFFNodeDef> {
    const error: ParseError = {
      message,
      location: LocationHelper.getLocation(cst),
      severity: 'error'
    };
    context.errors.push(error);
    return { success: false, error };
  }
}

// ============================================================================
// Edge Converter Module
// ============================================================================

class EdgeConverter {
  static convert(cst: CSTNode, context: ConversionContext): Result<LFFEdgeDef> {
    try {
      const { children } = cst;
      
      if (!children?.from?.[0] || !children?.arrow?.[0] || !children?.to?.[0]) {
        return this.createError('Edge must have from, arrow, and to components', cst, context);
      }

      const fromResult = NodeReferenceConverter.convert(children.from[0], context);
      if (!fromResult.success) {
        return { success: false, error: fromResult.error };
      }

      const arrowResult = ArrowConverter.convert(children.arrow[0], context);
      if (!arrowResult.success) {
        return { success: false, error: arrowResult.error };
      }

      const toResult = NodeReferenceConverter.convert(children.to[0], context);
      if (!toResult.success) {
        return { success: false, error: toResult.error };
      }

      const edge: LFFEdgeDef = {
        type: 'edge', // Discriminator field
        from: fromResult.data,
        to: toResult.data,
        arrow: arrowResult.data,
        location: LocationHelper.getLocation(cst)
      };

      // Handle optional label
      if (children.label?.[0]) {
        const labelToken = TokenExtractor.getTokenFromRule(children.label[0]);
        if (labelToken?.image) {
          edge.label = StringHelper.cleanValue(labelToken.image);
        }
      }

      return { success: true, data: edge };
    } catch (error) {
      return this.createError(`Edge conversion failed: ${error}`, cst, context);
    }
  }

  private static createError(message: string, cst: CSTNode, context: ConversionContext): Result<LFFEdgeDef> {
    const error: ParseError = {
      message,
      location: LocationHelper.getLocation(cst),
      severity: 'error'
    };
    context.errors.push(error);
    return { success: false, error };
  }
}

// ============================================================================
// Supporting Converter Modules
// ============================================================================

class NodeReferenceConverter {
  static convert(cst: CSTNode, _context: ConversionContext): Result<string> {
    try {
      const token = TokenExtractor.getTokenFromRule(cst);
      if (!token?.image) {
        throw new Error('Node reference token not found');
      }

      const reference = StringHelper.cleanValue(token.image);
      if (!reference) {
        throw new Error('Empty node reference');
      }

      return { success: true, data: reference };
    } catch (error) {
      const errorObj: ParseError = {
        message: `Invalid node reference: ${error}`,
        location: LocationHelper.getLocation(cst),
        severity: 'error'
      };
      return { success: false, error: errorObj };
    }
  }
}

class ArrowConverter {
  static convert(cst: CSTNode, _context: ConversionContext): Result<string> {
    try {
      const token = TokenExtractor.getTokenFromRule(cst);
      if (!token?.image) {
        throw new Error('Arrow token not found');
      }

      const arrow = token.image;
      if (!arrow) {
        throw new Error('Empty arrow');
      }

      return { success: true, data: arrow };
    } catch (error) {
      const errorObj: ParseError = {
        message: `Invalid arrow: ${error}`,
        location: LocationHelper.getLocation(cst),
        severity: 'error'
      };
      return { success: false, error: errorObj };
    }
  }
}

class TypeListConverter {
  static convert(cst: CSTNode, _context: ConversionContext): Result<string[]> {
    try {
      const { children } = cst;
      if (!children?.type) {
        return { success: true, data: [] };
      }

      const types: string[] = [];
      children.type.forEach(typeCst => {
        const token = TokenExtractor.getTokenFromRule(typeCst);
        if (token?.image) {
          types.push(StringHelper.cleanValue(token.image));
        }
      });

      return { success: true, data: types };
    } catch (error) {
      const errorObj: ParseError = {
        message: `Invalid type list: ${error}`,
        location: LocationHelper.getLocation(cst),
        severity: 'error'
      };
      return { success: false, error: errorObj };
    }
  }
}

class NodeBlockConverter {
  static convert(cst: CSTNode, context: ConversionContext): Result<{ properties?: Record<string, any>; children: LFFNodeDef[] }> {
    try {
      const { children } = cst;
      const result: { properties?: Record<string, any>; children: LFFNodeDef[] } = {
        children: []
      };

      // Process properties
      if (children?.property) {
        const properties: Record<string, any> = {};
        children.property.forEach(propCst => {
          const propResult = PropertyConverter.convert(propCst, context);
          if (propResult.success) {
            properties[propResult.data.key] = propResult.data.value;
          }
        });
        if (Object.keys(properties).length > 0) {
          result.properties = properties;
        }
      }

      // Process child nodes
      if (children?.node) {
        children.node.forEach(nodeCst => {
          const nodeResult = NodeConverter.convert(nodeCst, context);
          if (nodeResult.success) {
            result.children.push(nodeResult.data);
          }
        });
      }

      return { success: true, data: result };
    } catch (error) {
      const errorObj: ParseError = {
        message: `Invalid node block: ${error}`,
        location: LocationHelper.getLocation(cst),
        severity: 'error'
      };
      return { success: false, error: errorObj };
    }
  }
}

class PropertyConverter {
  static convert(cst: CSTNode, context: ConversionContext): Result<{ key: string; value: any }> {
    try {
      const { children } = cst;
      
      if (!children?.key?.[0] || !children?.value?.[0]) {
        throw new Error('Property must have key and value');
      }

      const keyToken = TokenExtractor.getTokenFromRule(children.key[0]);
      if (!keyToken?.image) {
        throw new Error('Property key token not found');
      }

      const key = StringHelper.cleanValue(keyToken.image);
      
      const valueResult = ValueConverter.convert(children.value[0], context);
      if (!valueResult.success) {
        return { success: false, error: valueResult.error };
      }

      return {
        success: true,
        data: { key, value: valueResult.data }
      };
    } catch (error) {
      const errorObj: ParseError = {
        message: `Invalid property: ${error}`,
        location: LocationHelper.getLocation(cst),
        severity: 'error'
      };
      return { success: false, error: errorObj };
    }
  }
}

class ValueConverter {
  static convert(cst: CSTNode, context: ConversionContext): Result<any> {
    try {
      const { children } = cst;
      
      if (children?.string?.[0]) {
        const token = TokenExtractor.getTokenFromRule(children.string[0]);
        return { success: true, data: StringHelper.cleanValue(token?.image || '') };
      }
      
      if (children?.number?.[0]) {
        const token = TokenExtractor.getTokenFromRule(children.number[0]);
        const num = parseFloat(token?.image || '0');
        return { success: true, data: isNaN(num) ? 0 : num };
      }
      
      if (children?.boolean?.[0]) {
        const token = TokenExtractor.getTokenFromRule(children.boolean[0]);
        return { success: true, data: token?.image === 'true' };
      }
      
      if (children?.array?.[0]) {
        return ArrayLiteralConverter.convert(children.array[0], context);
      }

      return { success: true, data: null };
    } catch (error) {
      const errorObj: ParseError = {
        message: `Invalid value: ${error}`,
        location: LocationHelper.getLocation(cst),
        severity: 'error'
      };
      return { success: false, error: errorObj };
    }
  }
}

class ArrayLiteralConverter {
  static convert(cst: CSTNode, context: ConversionContext): Result<any[]> {
    try {
      const { children } = cst;
      if (!children?.value) {
        return { success: true, data: [] };
      }

      const values: any[] = [];
      children.value.forEach(valueCst => {
        const valueResult = ValueConverter.convert(valueCst, context);
        if (valueResult.success) {
          values.push(valueResult.data);
        }
      });

      return { success: true, data: values };
    } catch (error) {
      const errorObj: ParseError = {
        message: `Invalid array literal: ${error}`,
        location: LocationHelper.getLocation(cst),
        severity: 'error'
      };
      return { success: false, error: errorObj };
    }
  }
}

// ============================================================================
// Utility Classes
// ============================================================================

class TokenExtractor {
  static getTokenFromRule(cst: CSTNode): CSTNode | null {
    return cst?.children ? Object.values(cst.children)[0]?.[0] || null : cst;
  }

  static getTokenFromAnchorDef(cst: CSTNode): CSTNode | null {
    return cst?.children?.AnchorDef?.[0] || null;
  }

  static getTokenFromAnchorRef(cst: CSTNode): CSTNode | null {
    return cst?.children?.AnchorRef?.[0] || null;
  }

  static getTokenFromLevelSpec(cst: CSTNode): CSTNode | null {
    return cst?.children?.LevelSpec?.[0] || null;
  }
}

class StringHelper {
  static cleanValue(value: string): string {
    return value
      .replace(/^["']|["']$/g, '') // Remove quotes
      .replace(/\\n/g, '\n')       // Unescape newlines
      .replace(/\\t/g, '\t')       // Unescape tabs
      .replace(/\\"/g, '"')        // Unescape quotes
      .replace(/\\\\/g, '\\');     // Unescape backslashes
  }
}

class LocationHelper {
  static getLocation(token: CSTNode): SourceLocation {
    return {
      startLine: token.startLine || 0,
      endLine: token.endLine || token.startLine || 0,
      startColumn: token.startColumn || 0,
      endColumn: token.endColumn || token.startColumn || 0,
      indent: 0 // TODO: Calculate actual indentation
    };
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Convert Chevrotain CST to LFF AST with discriminated unions
 * 
 * @param cst - Chevrotain concrete syntax tree
 * @param sourceText - Original source text for error reporting
 * @returns LFF AST with type-safe discriminated unions
 * 
 * @public
 */
export function convertCSTToLFF(cst: any, sourceText: string): LFFQ {
  const converter = new CSTToLFFConverter(sourceText);
  return converter.convert(cst);
} 