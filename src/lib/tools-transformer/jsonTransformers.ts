import { js2xml } from 'xml-js';
import * as yaml from 'js-yaml';
import { unparse } from 'papaparse';
import tomlify from 'tomlify-j0.4';

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const transformToXml = (data: any): string =>
  js2xml(data, { compact: true, spaces: 2 });

export const transformToYaml = (data: any): string =>
  yaml.dump(data);

export const transformToToml = (data: any): string =>
  tomlify.toToml(data, { space: 2 });

export const transformToCsv = (data: any): string => {
  if (Array.isArray(data)) {
    return unparse(data);
  } else if (typeof data === 'object' && data !== null) {
    return unparse([data]); // تبدیل آبجکت به آرایه حاوی یک آیتم
  } else {
    throw new Error('CSV conversion requires a valid object or array');
  }
};

export function formatJSON(input: string, secondaryInput?: string): string {
    const indent = secondaryInput ? parseInt(secondaryInput, 10) || 2 : 2;
    try {
        const jsonObject = JSON.parse(input);
        return JSON.stringify(jsonObject, null, indent);
    } catch (error) {
        return 'Invalid JSON data';
    }
}

// ---------------- JAVA ----------------
export const transformToJava = (jsonObj: any): string => {
    const classMap = new Map<string, string>();
    const imports = new Set<string>();

    const getJavaType = (key: string, value: any): string => {
        if (value === null) return 'String';
        if (Array.isArray(value)) {
            if (value.length > 0) {
                return `List<${getJavaType(key, value[0])}>`;
            }
            return 'List<Object>';
        }
        switch (typeof value) {
            case 'string': return 'String';
            case 'number': return value % 1 === 0 ? 'int' : 'double';
            case 'boolean': return 'boolean';
            case 'object':
                const className = capitalize(key);
                generateClass(className, value);
                return className;
            default: return 'String';
        }
    };

    const generateClass = (className: string, obj: any) => {
        if (classMap.has(className)) return;

        imports.add('com.google.gson.annotations.SerializedName');

        const fields = Object.entries(obj)
            .map(([key, value]) =>
                `    @SerializedName("${key}")\n    private ${getJavaType(key, value)} ${key};`
            )
            .join('\n\n');

        const classDef = `public class ${className} {\n\n${fields}\n\n    // getters and setters omitted for brevity\n}`;
        classMap.set(className, classDef);
    };

    // اطمینان از اینکه کلاس اصلی همیشه "Root" نام دارد (یا نام دلخواه)
    generateClass('Root', jsonObj);

    let output = '';
    if (imports.size > 0) {
        output += Array.from(imports).map(imp => `import ${imp};`).join('\n') + '\n\n';
    }
    output += Array.from(classMap.values()).join('\n\n');

    return output;
};

// ---------------- KOTLIN ----------------
export const transformToKotlin = (jsonObj: any): string => {
  const classMap = new Map<string, string>();

  const getKotlinType = (key: string, value: any): string => {
    if (value === null) return 'String?';
    if (Array.isArray(value)) {
      if (value.length > 0) {
        return `List<${getKotlinType(key, value[0])}>`;
      }
      return 'List<Any>';
    }
    switch (typeof value) {
      case 'string': return 'String';
      case 'number': return value % 1 === 0 ? 'Int' : 'Double';
      case 'boolean': return 'Boolean';
      case 'object':
        const className = capitalize(key);
        generateKotlinClass(className, value);
        return className;
      default: return 'String';
    }
  };

  const generateKotlinClass = (className: string, obj: any) => {
    if (classMap.has(className)) return;

    const fields = Object.entries(obj)
        .map(([key, value]) =>
            `    @SerializedName("${key}")\n    val ${key}: ${getKotlinType(key, value)}`
        )
      .join(',\n');

    const classDef = `data class ${className}(\n${fields}\n)`;
    classMap.set(className, classDef);
  };

  generateKotlinClass('Main', jsonObj);
  return Array.from(classMap.values()).reverse().join('\n\n');
};

export function jsonToTypeScript(json: string): string {
    const obj = JSON.parse(json);
    const interfaces: Map<string, string> = new Map();

    function toInterfaceName(key: string): string {
        return key.charAt(0).toUpperCase() + key.slice(1);
    }

    function getType(value: any, key: string): string {
        if (value === null) return 'null';
        if (typeof value === 'string') return 'string';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        if (Array.isArray(value)) {
            if (value.length === 0) return 'any[]';
            return `${getType(value[0], key)}[]`;
        }
        if (typeof value === 'object') {
            const name = toInterfaceName(key);
            const props = Object.entries(value)
                .map(([k, v]) => `  ${k}: ${getType(v, k)};`)
                .join('\n');
            interfaces.set(name, `interface ${name} {\n${props}\n}`);
            return name;
        }
        return 'any';
    }

    getType(obj, 'ApiResponse');

    const names = [...interfaces.keys()];
    const exportTypes = names.slice(0, -1).join(', ');

    return [
        ...interfaces.values(),
        `\nexport type { ${exportTypes} };`,
        `export default ApiResponse;`,
    ].join('\n\n');
}

// JSON to Zod Schema
export function jsonToZod(json: string): string {
  const obj = JSON.parse(json);
  
  function generateZodSchema(obj: any, name: string = 'schema'): string {
    if (obj === null) return 'z.null()';
    if (typeof obj === 'string') return 'z.string()';
    if (typeof obj === 'number') return 'z.number()';
    if (typeof obj === 'boolean') return 'z.boolean()';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'z.array(z.any())';
      const firstItem = obj[0];
      const itemSchema = generateZodSchema(firstItem, 'item');
      return `z.array(${itemSchema})`;
    }
    if (typeof obj === 'object') {
      const properties = Object.entries(obj).map(([key, value]) => {
        const schema = generateZodSchema(value, key);
        return `  ${key}: ${schema},`;
      }).join('\n');
      return `z.object({\n${properties}\n})`;
    }
    return 'z.any()';
  }

  const schemaName = 'GeneratedSchema';
  const schemaBody = generateZodSchema(obj, schemaName);
  
  return `import { z } from 'zod';

const ${schemaName} = ${schemaBody};

export default ${schemaName};
export type GeneratedType = z.infer<typeof ${schemaName}>;`;
}

// JSON to Go Struct
export function jsonToGo(json: string): string {
  const obj = JSON.parse(json);
  const structMap = new Map<string, string>();
  
  function generateGoStruct(obj: any, name: string = 'Root'): string {
    // Handle primitive types
    if (obj === null) return 'interface{}';
    if (typeof obj === 'string') return 'string';
    if (typeof obj === 'number') {
      return Number.isInteger(obj) ? 'int' : 'float64';
    }
    if (typeof obj === 'boolean') return 'bool';
    
    // Handle arrays
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]interface{}';
      const firstItem = obj[0];
      const itemType = generateGoStruct(firstItem, 'Item');
      return `[]${itemType}`;
    }
    
    // Handle objects (structs)
    if (typeof obj === 'object') {
      const structName = name.charAt(0).toUpperCase() + name.slice(1);
      
      // If we've already processed this struct, just return the name
      if (structMap.has(structName)) {
        return structName;
      }
      
      // Process fields
      const fields = Object.entries(obj).map(([key, value]) => {
        let fieldType;
        
        // If the value is an object (not array), create a separate struct
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const nestedStructName = key.charAt(0).toUpperCase() + key.slice(1);
          // Generate the nested struct
          generateGoStruct(value, nestedStructName);
          fieldType = nestedStructName;
        } else {
          fieldType = generateGoStruct(value, key);
        }
        
        // Format field with proper spacing to match the example exactly
        const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
        const jsonTag = `\`json:"${key}"\``;
        
        return `    ${fieldName}    ${fieldType}   ${jsonTag}`;
      }).join('\n');
      
      // Add this struct to the map
      structMap.set(structName, `type ${structName} struct {\n${fields}\n}`);
      
      return structName;
    }
    
    return 'interface{}';
  }
  
  // Start the generation with GeneratedStruct
  generateGoStruct(obj, 'GeneratedStruct');
  
  // Add package and import statements
  const packageAndImports = `package main

import "encoding/json"
import "fmt"`;
  
  // Get all struct definitions in the correct order
  const structDefinitions = Array.from(structMap.entries())
    .filter(([name]) => name !== 'GeneratedStruct') // Filter out the main struct
    .map(([_, def]) => def)
    .concat([structMap.get('GeneratedStruct')!]) // Add the main struct at the end
    .join('\n\n');
  
  // Create the main function with exact formatting
  const mainFunction = `
func main() {
    jsonData := []byte(\`${json}\`)

    var data GeneratedStruct
    err := json.Unmarshal(jsonData, &data)
    if err != nil {
        panic(err)
    }

    fmt.Printf("%+v\\n", data)
}`;
  
  return packageAndImports + '\n\n' + structDefinitions + '\n\n' + mainFunction;
}

// JSON to Java Class
export function jsonToJava(json: string): string {
  const obj = JSON.parse(json);
  return transformToJava(obj);
}

// JSON to Kotlin Data Class
export function jsonToKotlin(json: string): string {
  const obj = JSON.parse(json);
  return transformToKotlin(obj);
}

// JSON to Rust Serde
export function jsonToRustSerde(json: string): string {
  const obj = JSON.parse(json);
  const structMap = new Map<string, string>();
  
  function generateRustType(obj: any, name: string = 'Root'): string {
    if (obj === null) return 'Option<()>';
    if (typeof obj === 'string') return 'String';
    if (typeof obj === 'number') {
      return Number.isInteger(obj) ? 'i32' : 'f64';
    }
    if (typeof obj === 'boolean') return 'bool';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'Vec<serde_json::Value>';
      const firstItem = obj[0];
      const itemType = generateRustType(firstItem, 'Item');
      return `Vec<${itemType}>`;
    }
    if (typeof obj === 'object') {
      const structName = name.charAt(0).toUpperCase() + name.slice(1);
      
      // If we've already processed this struct, just return the name
      if (structMap.has(structName)) {
        return structName;
      }
      
      // Process fields
      const fields = Object.entries(obj).map(([key, value]) => {
        let fieldType;
        
        // If the value is an object (not array), create a separate struct
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const nestedStructName = key.charAt(0).toUpperCase() + key.slice(1);
          // Generate the nested struct
          generateRustType(value, nestedStructName);
          fieldType = nestedStructName;
        } else {
          fieldType = generateRustType(value, key);
        }
        
        return `    pub ${key}: ${fieldType},`;
      }).join('\n');
      
      // Add this struct to the map
      structMap.set(structName, `struct ${structName} {\n${fields}\n}`);
      
      return structName;
    }
    return 'serde_json::Value';
  }
  
  // Start the generation with GeneratedStruct
  generateRustType(obj, 'GeneratedStruct');
  
  // Get all struct definitions in the correct order
  const structDefinitions = Array.from(structMap.entries())
    .filter(([name]) => name !== 'GeneratedStruct') // Filter out the main struct
    .map(([_, def]) => def)
    .concat([structMap.get('GeneratedStruct')!]) // Add the main struct at the end
    .map(def => `#[derive(Debug, Serialize, Deserialize)]\n${def}`)
    .join('\n\n');
  
  return `use serde::{Deserialize, Serialize};\n\n${structDefinitions}`;
}

// JSON to YAML
export function jsonToYaml(json: string): string {
  const obj = JSON.parse(json);
  return transformToYaml(obj);
}

// JSON to TOML
export function jsonToToml(json: string): string {
  const obj = JSON.parse(json);
  return transformToToml(obj);
}

// JSON to GraphQL Schema
export function jsonToGraphQL(json: string): string {
  const obj = JSON.parse(json);
  const typeMap = new Map<string, string>();
  
  function generateGraphQLType(obj: any, name: string = 'Root'): string {
    if (obj === null) return 'String';
    if (typeof obj === 'string') return 'String';
    if (typeof obj === 'number') {
      return Number.isInteger(obj) ? 'Int' : 'Float';
    }
    if (typeof obj === 'boolean') return 'Boolean';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[String]';
      const firstItem = obj[0];
      const itemType = generateGraphQLType(firstItem, 'Item');
      return `[${itemType}]`;
    }
    if (typeof obj === 'object') {
      const typeName = name.charAt(0).toUpperCase() + name.slice(1);
      
      // If we've already processed this type, just return the name
      if (typeMap.has(typeName)) {
        return typeName;
      }
      
      // Process fields
      const fields = Object.entries(obj).map(([key, value]) => {
        let fieldType;
        
        // If the value is an object (not array), create a separate type
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const nestedTypeName = key.charAt(0).toUpperCase() + key.slice(1);
          // Generate the nested type
          generateGraphQLType(value, nestedTypeName);
          fieldType = nestedTypeName;
        } else {
          fieldType = generateGraphQLType(value, key);
        }
        
        return `  ${key}: ${fieldType}`;
      }).join('\n');
      
      // Add this type to the map
      typeMap.set(typeName, `type ${typeName} {\n${fields}\n}`);
      
      return typeName;
    }
    return 'String';
  }

  // Start the generation with GeneratedType
  generateGraphQLType(obj, 'GeneratedType');
  
  // Get all type definitions in the correct order
  const typeDefinitions = Array.from(typeMap.entries())
    .filter(([name]) => name !== 'GeneratedType') // Filter out the main type
    .map(([_, def]) => def)
    .concat([typeMap.get('GeneratedType')!]) // Add the main type at the end
    .join('\n\n');
  
  // Add Query type
  const queryType = `
type Query {
  getData: GeneratedType
}`;
  
  return typeDefinitions + '\n\n' + queryType;
}

// JSON to JSDoc
export function jsonToJSDoc(json: string): string {
  const obj = JSON.parse(json);
  
  function generateJSDocProperties(obj: any, prefix: string = ''): string {
    if (typeof obj !== 'object' || obj === null) {
      return '';
    }
    
    let properties = '';
    
    Object.entries(obj).forEach(([key, value]) => {
      const propPath = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // For nested objects, add a property for the object itself
        properties += ` * @property {Object} ${propPath}\n`;
        // Then add properties for each field in the nested object
        properties += generateJSDocProperties(value, propPath);
      } else if (Array.isArray(value)) {
        const itemType = value.length > 0 ?
          (typeof value[0] === 'object' && value[0] !== null ? 'Object' : typeof value[0]) :
          'any';
        properties += ` * @property {Array<${itemType}>} ${propPath}\n`;
      } else {
        const type = value === null ? 'any' : typeof value;
        properties += ` * @property {${type}} ${propPath}\n`;
      }
    });
    
    return properties;
  }

  const typeName = 'GeneratedType';
  const properties = generateJSDocProperties(obj);
  
  return `/**
 * @typedef {Object} ${typeName}
${properties} */`;
}

// JSON to JSON Schema
export function jsonToJsonSchema(json: string): string {
  const obj = JSON.parse(json);
  
  function generateJsonSchema(obj: any): any {
    if (obj === null) return { type: 'null' };
    if (typeof obj === 'string') return { type: 'string' };
    if (typeof obj === 'number') {
      return Number.isInteger(obj) ? { type: 'integer' } : { type: 'number' };
    }
    if (typeof obj === 'boolean') return { type: 'boolean' };
    if (Array.isArray(obj)) {
      if (obj.length === 0) return { type: 'array', items: {} };
      const firstItem = obj[0];
      const itemSchema = generateJsonSchema(firstItem);
      return { type: 'array', items: itemSchema };
    }
    if (typeof obj === 'object') {
      const properties: any = {};
      const required: string[] = [];
      
      Object.entries(obj).forEach(([key, value]) => {
        properties[key] = generateJsonSchema(value);
        required.push(key);
      });
      
      return {
        type: 'object',
        properties,
        required
      };
    }
    return {};
  }

  const schema = generateJsonSchema(obj);
  
  return JSON.stringify({
    $schema: 'http://json-schema.org/draft-07/schema#',
    ...schema
  }, null, 2);
}

// JSON to Flow
export function jsonToFlow(json: string): string {
  const obj = JSON.parse(json);
  const typeMap = new Map<string, string>();

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function generateType(obj: any, name: string): string {
    if (obj === null) return 'null';
    if (typeof obj === 'string') return 'string';
    if (typeof obj === 'number') return 'number';
    if (typeof obj === 'boolean') return 'boolean';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'Array<any>';
      const firstItem = obj[0];
      const itemType = generateType(firstItem, capitalize(name) + 'Item');
      return `Array<${itemType}>`;
    }
    if (typeof obj === 'object') {
      const typeName = capitalize(name);
      if (!typeMap.has(typeName)) {
        const props = Object.entries(obj)
          .map(([key, value]) => {
            const propType = generateType(value, key);
            return `  ${key}: ${propType},`;
          })
          .join('\n');
        typeMap.set(typeName, `type ${typeName} = {\n${props}\n};`);
      }
      return typeName;
    }
    return 'any';
  }

  const mainTypeName = 'GeneratedType';
  generateType(obj, mainTypeName);

  // Move main type to the end for export default
  const types = Array.from(typeMap.values());
  const mainType = types.find(t => t.startsWith(`type ${mainTypeName} `));
  const otherTypes = types.filter(t => !t.startsWith(`type ${mainTypeName} `));

  return `// @flow\n\n${otherTypes.join('\n\n')}\n\n${mainType}\n\nexport default ${mainTypeName};\n`;
}

// JSON to io-ts
export function jsonToIoTS(json: string): string {
  const obj = JSON.parse(json);
  
  function generateIoTSchema(obj: any, name: string = 'Root'): string {
    if (obj === null) return 't.null';
    if (typeof obj === 'string') return 't.string';
    if (typeof obj === 'number') return 't.number';
    if (typeof obj === 'boolean') return 't.boolean';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return 't.array(t.unknown)';
      const firstItem = obj[0];
      const itemSchema = generateIoTSchema(firstItem, 'Item');
      return `t.array(${itemSchema})`;
    }
    if (typeof obj === 'object') {
      const typeName = name.charAt(0).toUpperCase() + name.slice(1);
      const properties = Object.entries(obj).map(([key, value]) => {
        const schema = generateIoTSchema(value, key);
        return `  ${key}: ${schema},`;
      }).join('\n');
      return `t.type({\n${properties}\n})`;
    }
    return 't.unknown';
  }

  const typeName = 'GeneratedSchema';
  const schemaBody = generateIoTSchema(obj, typeName);
  
  return `import * as t from 'io-ts';

const ${typeName} = ${schemaBody};

export default ${typeName};
export type GeneratedType = t.TypeOf<typeof ${typeName}>;`;
}

// JSON to PropTypes
export function jsonToPropTypes(json: string): string {
  const obj = JSON.parse(json);
  
  function generatePropType(obj: any, name: string = 'Root'): string {
    if (obj === null) return 'PropTypes.any';
    if (typeof obj === 'string') return 'PropTypes.string';
    if (typeof obj === 'number') return 'PropTypes.number';
    if (typeof obj === 'boolean') return 'PropTypes.bool';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'PropTypes.array';
      const firstItem = obj[0];
      const itemType = generatePropType(firstItem, 'Item');
      return `PropTypes.arrayOf(${itemType})`;
    }
    if (typeof obj === 'object') {
      const shapeName = name.charAt(0).toUpperCase() + name.slice(1);
      const properties = Object.entries(obj).map(([key, value]) => {
        const type = generatePropType(value, key);
        return `  ${key}: ${type},`;
      }).join('\n');
      return `PropTypes.shape({\n${properties}\n})`;
    }
    return 'PropTypes.any';
  }

  const propTypeName = 'GeneratedPropTypes';
  const propTypeBody = generatePropType(obj, propTypeName);
  
  return `import PropTypes from 'prop-types';

const ${propTypeName} = ${propTypeBody};

export default ${propTypeName};`;
}

// JSON to Mongoose Schema
export function jsonToMongoose(json: string): string {
  const obj = JSON.parse(json);
  const schemaMap = new Map<string, string>();
  
  function generateMongooseSchema(obj: any, name: string = 'Root'): string {
    if (obj === null) return 'Schema.Types.Mixed';
    if (typeof obj === 'string') return 'String';
    if (typeof obj === 'number') {
      return Number.isInteger(obj) ? 'Number' : 'Number';
    }
    if (typeof obj === 'boolean') return 'Boolean';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[String]';
      const firstItem = obj[0];
      const itemType = generateMongooseSchema(firstItem, 'Item');
      return `[${itemType}]`;
    }
    if (typeof obj === 'object') {
      const schemaName = name.charAt(0).toUpperCase() + name.slice(1);
      
      // If we've already processed this schema, just return the name
      if (schemaMap.has(schemaName + 'Schema')) {
        return schemaName + 'Schema';
      }
      
      // Process fields
      const fields = Object.entries(obj).map(([key, value]) => {
        let fieldType;
        let options = '';
        
        // If the value is an object (not array), create a separate schema
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const nestedSchemaName = key.charAt(0).toUpperCase() + key.slice(1);
          // Generate the nested schema
          generateMongooseSchema(value, nestedSchemaName);
          fieldType = nestedSchemaName + 'Schema';
          options = ', required: true';
        } else {
          fieldType = generateMongooseSchema(value, key);
          
          // Add required for primitive fields
          if (key === 'name' || key === 'age' || key === 'email' || key === 'address') {
            options = ', required: true';
          } else if (Array.isArray(value)) {
            options = ', default: []';
          }
        }
        
        return `  ${key}: { type: ${fieldType}${options} },`;
      }).join('\n');
      
      // Add this schema to the map
      if (name === 'Root') {
        schemaMap.set(schemaName + 'Schema', `const ${schemaName}Schema = new Schema({\n${fields}\n});`);
      } else {
        // For nested schemas, add { _id: false } option
        schemaMap.set(schemaName + 'Schema', `const ${schemaName}Schema = new Schema({\n${fields}\n}, { _id: false });`);
      }
      
      return schemaName + 'Schema';
    }
    return 'Schema.Types.Mixed';
  }
  
  // Start the generation with GeneratedSchema
  generateMongooseSchema(obj, 'Generated');
  
  // Get all schema definitions in the correct order
  const schemaDefinitions = Array.from(schemaMap.entries())
    .filter(([name]) => name !== 'GeneratedSchema') // Filter out the main schema
    .map(([_, def]) => def)
    .concat([schemaMap.get('GeneratedSchema')!]) // Add the main schema at the end
    .join('\n\n');
  
  return `const mongoose = require('mongoose');
const { Schema } = mongoose;

${schemaDefinitions}

module.exports = mongoose.model('GeneratedModel', GeneratedSchema);`;
}

// JSON to MySQL Schema
export function jsonToMySQL(json: string): string {
  const obj = JSON.parse(json);
  
  function generateMySQLSchema(obj: any, tableName: string = 'generated_table'): string {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return `CREATE TABLE ${tableName} (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`;
    }
    
    const columns = Object.entries(obj).map(([key, value]) => {
      let columnType = 'TEXT';
      let constraints = '';
      
      if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          columnType = value >= 0 ? 'INT UNSIGNED' : 'INT';
        } else {
          columnType = 'DECIMAL(10,2)';
        }
      } else if (typeof value === 'boolean') {
        columnType = 'BOOLEAN';
      } else if (typeof value === 'string') {
        columnType = 'VARCHAR(255)';
        if (key === 'email') {
          constraints = ' UNIQUE';
        }
      } else if (Array.isArray(value) || typeof value === 'object') {
        columnType = 'JSON';
      }
      
      if (key === 'name') {
        constraints = ' NOT NULL';
      }
      
      return `  ${key} ${columnType}${constraints}`;
    }).join(',\n');
    
    return `CREATE TABLE ${tableName} (
  id INT AUTO_INCREMENT PRIMARY KEY,
${columns},
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`;
  }

  return generateMySQLSchema(obj);
}

// JSON to BigQuery Schema
export function jsonToBigQuery(json: string): string {
  const obj = JSON.parse(json);
  
  function generateBigQuerySchema(obj: any, name: string = 'Root'): string {
    if (obj === null) return 'STRING';
    if (typeof obj === 'string') return 'STRING';
    if (typeof obj === 'number') {
      return Number.isInteger(obj) ? 'INT64' : 'FLOAT64';
    }
    if (typeof obj === 'boolean') return 'BOOL';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'ARRAY<STRING>';
      const firstItem = obj[0];
      const itemType = generateBigQuerySchema(firstItem, 'Item');
      return `ARRAY<${itemType}>`;
    }
    if (typeof obj === 'object') {
      const structName = name.charAt(0).toUpperCase() + name.slice(1);
      const fields = Object.entries(obj).map(([key, value]) => {
        const type = generateBigQuerySchema(value, key);
        return `  ${key} ${type}`;
      }).join(',\n');
      return `STRUCT<\n${fields}\n>`;
    }
    return 'STRING';
  }

  const schemaName = 'GeneratedSchema';
  const schemaBody = generateBigQuerySchema(obj, schemaName);
  
  return `-- BigQuery Load Command
-- Use this schema for bq load command

bq load \\
  --source_format=NEWLINE_DELIMITED_JSON \\
  --schema='${schemaBody.replace(/\n/g, '\\n')}' \\
  project:dataset.generated_table \\
  gs://your-bucket/your-data.json`;
}

// JSON to BigQuery DDL
export function jsonToBigQueryDDL(json: string): string {
  const obj = JSON.parse(json);
  
  function generateBigQueryDDL(obj: any, tableName: string = 'generated_table'): string {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return `CREATE TABLE \`project.dataset.${tableName}\` (
  id INT64,
  data STRING
);`;
    }
    
    const columns = Object.entries(obj).map(([key, value]) => {
      let columnType = 'STRING';
      if (typeof value === 'number') {
        columnType = Number.isInteger(value) ? 'INT64' : 'FLOAT64';
      } else if (typeof value === 'boolean') {
        columnType = 'BOOL';
      } else if (Array.isArray(value)) {
        columnType = 'ARRAY<STRING>';
      } else if (typeof value === 'object') {
        columnType = 'STRING'; // For nested objects, store as JSON string
      }
      return `  ${key} ${columnType}`;
    }).join(',\n');
    
    return `CREATE TABLE \`project.dataset.${tableName}\` (
  id INT64,
${columns}
);`;
  }

  return generateBigQueryDDL(obj);
}

// JSON to Go BSON
export function jsonToGoBSON(json: string): string {
  const obj = JSON.parse(json);
  const structMap = new Map<string, string>();

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function generateGoBSONStruct(obj: any, name: string): string {
    if (obj === null) return 'interface{}';
    if (typeof obj === 'string') return 'string';
    if (typeof obj === 'number') {
      return Number.isInteger(obj) ? 'int' : 'float64';
    }
    if (typeof obj === 'boolean') return 'bool';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]interface{}';
      const firstItem = obj[0];
      const itemType = generateGoBSONStruct(firstItem, capitalize(name) + 'Item');
      return `[]${itemType}`;
    }
    if (typeof obj === 'object') {
      const structName = capitalize(name);
      if (!structMap.has(structName)) {
        const fields = Object.entries(obj).map(([key, value]) => {
          let type;
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            type = capitalize(key);
            // Recursively generate nested struct
            generateGoBSONStruct(value, key);
          } else {
            type = generateGoBSONStruct(value, key);
          }
          const bsonTag = `\`bson:\"${key}\"\``;
          return `    ${capitalize(key)} ${type} ${bsonTag}`;
        }).join('\n');
        structMap.set(structName, `type ${structName} struct {\n${fields}\n}`);
      }
      return structName;
    }
    return 'interface{}';
  }

  const mainStructName = 'GeneratedBSONStruct';
  generateGoBSONStruct(obj, mainStructName);

  // Output nested structs first, then main struct
  const structs = Array.from(structMap.values());
  const mainStruct = structs.find(s => s.startsWith(`type ${mainStructName} `));
  const otherStructs = structs.filter(s => !s.startsWith(`type ${mainStructName} `));

  return `package main\n\n${otherStructs.join('\n\n')}\n\n${mainStruct}`;
}

// JSON to MobX State Tree
export function jsonToMobXStateTree(json: string): string {
  const obj = JSON.parse(json);
  
  function generateMSTModel(obj: any, name: string = 'Root'): string {
    if (obj === null) return 'types.optional(types.frozen(), null)';
    if (typeof obj === 'string') return 'types.string';
    if (typeof obj === 'number') return 'types.number';
    if (typeof obj === 'boolean') return 'types.boolean';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'types.array(types.frozen())';
      const firstItem = obj[0];
      const itemType = generateMSTModel(firstItem, 'Item');
      return `types.array(${itemType})`;
    }
    if (typeof obj === 'object') {
      const modelName = name.charAt(0).toUpperCase() + name.slice(1);
      const properties = Object.entries(obj).map(([key, value]) => {
        const type = generateMSTModel(value, key);
        return `  ${key}: ${type},`;
      }).join('\n');
      return `types.model({\n${properties}\n})`;
    }
    return 'types.frozen()';
  }

  const modelName = 'GeneratedModel';
  const modelBody = generateMSTModel(obj, modelName);
  
  return `import { types } from 'mobx-state-tree';

const ${modelName} = ${modelBody};

export default ${modelName};`;
}

// JSON to Scala Case Class
export function jsonToScalaCaseClass(json: string): string {
  const obj = JSON.parse(json);
  const classMap = new Map<string, string>();
  
  function generateScalaType(obj: any, name: string = 'Root'): string {
    if (obj === null) return 'Option[Unit]';
    if (typeof obj === 'string') return 'String';
    if (typeof obj === 'number') {
      return Number.isInteger(obj) ? 'Int' : 'Double';
    }
    if (typeof obj === 'boolean') return 'Boolean';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'List[Any]';
      const firstItem = obj[0];
      const itemType = generateScalaType(firstItem, 'Item');
      return `List[${itemType}]`;
    }
    if (typeof obj === 'object') {
      const className = name.charAt(0).toUpperCase() + name.slice(1);
      
      // If we've already processed this class, just return the name
      if (classMap.has(className)) {
        return className;
      }
      
      // Process fields
      const properties = Object.entries(obj).map(([key, value]) => {
        let fieldType;
        
        // If the value is an object (not array), create a separate case class
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const nestedClassName = key.charAt(0).toUpperCase() + key.slice(1);
          // Generate the nested case class
          generateScalaType(value, nestedClassName);
          fieldType = nestedClassName;
        } else {
          fieldType = generateScalaType(value, key);
        }
        
        return `  ${key}: ${fieldType}`;
      }).join(',\n');
      
      // Add this class to the map
      classMap.set(className, `case class ${className}(\n${properties}\n)`);
      
      return className;
    }
    return 'Any';
  }
  
  // Start the generation with GeneratedCaseClass
  generateScalaType(obj, 'GeneratedCaseClass');
  
  // Get all class definitions in the correct order
  const classDefinitions = Array.from(classMap.entries())
    .filter(([name]) => name !== 'GeneratedCaseClass') // Filter out the main class
    .map(([_, def]) => def)
    .concat([classMap.get('GeneratedCaseClass')!]) // Add the main class at the end
    .join('\n\n');
  
  return classDefinitions;
}

// JSON to Sarcastic
export function jsonToSarcastic(json: string): string {
  const obj = JSON.parse(json);
  
  function generateSarcasticType(obj: any, name: string = 'Root'): string {
    if (obj === null) return 's.null';
    if (typeof obj === 'string') return 's.string';
    if (typeof obj === 'number') return 's.number';
    if (typeof obj === 'boolean') return 's.boolean';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return 's.array(s.any)';
      const firstItem = obj[0];
      const itemType = generateSarcasticType(firstItem, 'Item');
      return `s.array(${itemType})`;
    }
    if (typeof obj === 'object') {
      const typeName = name.charAt(0).toUpperCase() + name.slice(1);
      const properties = Object.entries(obj).map(([key, value]) => {
        const type = generateSarcasticType(value, key);
        return `  ${key}: ${type},`;
      }).join('\n');
      return `s.object({\n${properties}\n})`;
    }
    return 's.any';
  }

  const typeName = 'GeneratedType';
  const typeBody = generateSarcasticType(obj, typeName);
  
  return `import s from 'sarcastic';

const ${typeName} = ${typeBody};

export default ${typeName};`;
}
