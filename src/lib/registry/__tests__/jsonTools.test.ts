// __tests__/registry/jsonTools.test.ts
import { describe, it, expect } from 'vitest';
import {JsonToolsList, samples} from "@/lib/registry";

describe('JSON Converters', () => {
    // تست اختصاصی برای هر ابزار
    it('formatJSON: should prettify a JSON string', () => {
        const result = JsonToolsList.formatJSON.transformFunction(samples.json.simple);
        expect(result).toBeTruthy();
        expect(() => JSON.parse(result)).not.toThrow(); // خروجی باید JSON معتبر باشد
    });

    it('jsonToBigQuery: should produce a BigQuery load command', () => {
        const result = JsonToolsList.jsonToBigQuery.transformFunction(samples.json.complex);
        expect(result).toBeTruthy();
        expect(result).toContain('bq load');
    });

    it('jsonToFlow: should generate Flow type annotations', () => {
        const result = JsonToolsList.jsonToFlow.transformFunction(samples.json.complex);
        expect(result).toBeTruthy();
        expect(result).toContain('export default');
    });

    it('jsonToGo: should produce a Go struct', () => {
        const result = JsonToolsList.jsonToGo.transformFunction(samples.json.complex);
        expect(result).toBeTruthy();
        expect(result).toContain('type ');
        expect(result).toContain('struct {');
    });

    it('jsonToGoBson: should produce a Go struct with BSON tags', () => {
        const result = JsonToolsList.jsonToGoBson.transformFunction(samples.json.complex);
        expect(result).toBeTruthy();
        expect(result).toContain('bson:"');
    });

    it('jsonToGraphQl: should create a GraphQL schema', () => {
        const result = JsonToolsList.jsonToGraphQl.transformFunction(samples.json.complex);
        expect(result).toBeTruthy();
        expect(result).toContain('type ');
    });

    it('jsonToIoTs: should generate io-ts codec definitions', () => {
        const result = JsonToolsList.jsonToIoTs.transformFunction(samples.json.complex);
        expect(result).toBeTruthy();
        expect(result).toContain('import * as t from');
    });

    it('jsonToJava: should build a Java POJO class', () => {
        const result = JsonToolsList.jsonToJava.transformFunction(samples.json.complex);
        expect(result).toBeTruthy();
        expect(result).toContain('class ');
        expect(result).toContain('public ');
    });

    it('jsonToJsdoc: should output JSDoc typedefs', () => {
        const result = JsonToolsList.jsonToJsdoc.transformFunction(samples.json.complex);
        expect(result).toBeTruthy();
        expect(result).toContain('@typedef');
    });

    it('jsonToJsonSchema: should produce a valid JSON Schema', () => {
        const result = JsonToolsList.jsonToJsonSchema.transformFunction(samples.json.complex);
        expect(result).toBeTruthy();
        expect(result).toContain('"$schema"');
    });

    it('jsonToKotlin: should emit Kotlin data classes', () => {
        const result = JsonToolsList.jsonToKotlin.transformFunction(samples.json.complex);
        expect(result).toBeTruthy();
        expect(result).toContain('data class ');
    });

    it('jsonToMobxStateTree: should produce MST model definitions', () => {
        const result = JsonToolsList.jsonToMobxStateTree.transformFunction(samples.json.complex);
        expect(result).toBeTruthy();
        expect(result).toContain('types.');
    });

    it('jsonToMongoose: should create a Mongoose schema', () => {
        const result = JsonToolsList.jsonToMongoose.transformFunction(samples.json.complex);
        expect(result).toBeTruthy();
        expect(result).toContain('new Schema(');
    });

    it('jsonToMysql: should output a MySQL CREATE TABLE statement', () => {
        const result = JsonToolsList.jsonToMysql.transformFunction(samples.json.complex);
        expect(result).toBeTruthy();
        expect(result).toContain('CREATE TABLE');
    });

    it('jsonToPropTypes: should generate React PropTypes', () => {
        const result = JsonToolsList.jsonToPropTypes.transformFunction(samples.json.complex);
        expect(result).toBeTruthy();
        expect(result).toContain('PropTypes.');
    });

    it('jsonToRustSerde: should create a Rust struct with Serde attributes', () => {
        const result = JsonToolsList.jsonToRustSerde.transformFunction(samples.json.complex);
        expect(result).toBeTruthy();
        expect(result).toContain('struct ');
        expect(result).toContain('#[derive(');
    });

    it('jsonToSarcastic: should not throw on any input', () => {
        const result = JsonToolsList.jsonToSarcastic.transformFunction(samples.json.complex);
        expect(result).toBeTruthy();
    });

    it('jsonToScalaCaseClass: should produce a Scala case class', () => {
        const result = JsonToolsList.jsonToScalaCaseClass.transformFunction(samples.json.complex);
        expect(result).toBeTruthy();
        expect(result).toContain('case class ');
    });

    it('jsonToToml: should convert JSON to valid TOML', () => {
        const result = JsonToolsList.jsonToToml.transformFunction(samples.json.complex);
        expect(result).toBeTruthy();
        expect(result).toContain('[');
    });

    it('jsonToTypeScript: should emit TypeScript interfaces', () => {
        const result = JsonToolsList.jsonToTypeScript.transformFunction(samples.json.complex);
        expect(result).toBeTruthy();
        expect(result).toContain('interface ');
    });

    it('jsonToYaml: should produce YAML output', () => {
        const result = JsonToolsList.jsonToYaml.transformFunction(samples.json.complex);
        expect(result).toBeTruthy();
        // YAML معمولاً شامل `:` و تورفتگی است
        expect(result).toContain(':');
    });

    it('jsonToZod: should generate Zod schemas', () => {
        const result = JsonToolsList.jsonToZod.transformFunction(samples.json.complex);
        expect(result).toBeTruthy();
        expect(result).toContain('z.');
    });
});

// تست جامع برای تمام ابزارهای JSON که حداقل با sample ساده کار کنند
describe('All JSON tools smoke test', () => {
    Object.entries(JsonToolsList).forEach(([type, tool]) => {
        it(`${type}: should not throw with sample code`, () => {
            expect(() => {
                const input = samples.json.simple;
                tool.transformFunction(input);
            }).not.toThrow();
        });
    });
});