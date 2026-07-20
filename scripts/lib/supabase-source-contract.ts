import { createRequire } from "node:module";
import { isAbsolute, relative, resolve, sep } from "node:path";
import type {
  CallExpression,
  Diagnostic,
  Expression,
  Node,
  SourceFile,
  TypeChecker,
} from "typescript";

const require = createRequire(import.meta.url);
const ts = require("typescript") as typeof import("typescript");

type SupabaseSchemaMethod = "from" | "rpc";

function getSchemaMethod(call: CallExpression): SupabaseSchemaMethod | null {
  if (!ts.isPropertyAccessExpression(call.expression)) {
    return null;
  }

  const method = call.expression.name.text;
  return method === "from" || method === "rpc" ? method : null;
}

function getStaticString(expression: Expression | undefined): string | null {
  if (expression && (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression))) {
    return expression.text;
  }

  return null;
}

function getCallLocation(sourceFile: SourceFile, call: CallExpression): string {
  const { line } = sourceFile.getLineAndCharacterOfPosition(call.getStart(sourceFile));
  return `${sourceFile.fileName}:${line + 1}`;
}

function collectPathsFromSourceFile(
  sourceFile: SourceFile,
  isSupabaseCall: (call: CallExpression) => boolean
): Set<string> {
  const paths = new Set<string>();

  const visit = (node: Node): void => {
    if (ts.isCallExpression(node)) {
      const method = getSchemaMethod(node);
      if (method && isSupabaseCall(node)) {
        const name = getStaticString(node.arguments[0]);
        if (!name) {
          throw new Error(
            `Supabase .${method}() in ${getCallLocation(sourceFile, node)} must use a static string literal`
          );
        }

        paths.add(method === "rpc" ? `/rpc/${name}` : `/${name}`);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return paths;
}

export function collectStaticSupabasePathsFromSource(
  source: string,
  fileName = "inline-source.ts"
): Set<string> {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  return collectPathsFromSourceFile(sourceFile, () => true);
}

export function findMissingSupabaseContractPaths(
  runtimePaths: Iterable<string>,
  requiredPaths: readonly string[]
): string[] {
  const requiredPathSet = new Set(requiredPaths);
  return [...runtimePaths].filter((path) => !requiredPathSet.has(path)).sort();
}

function isApplicationSourceFile(fileName: string, sourceRoot: string): boolean {
  const relativePath = relative(sourceRoot, fileName);
  return (
    relativePath !== "" &&
    !relativePath.startsWith(`..${sep}`) &&
    !isAbsolute(relativePath) &&
    !/\.(?:test|spec)\.[cm]?tsx?$/.test(relativePath)
  );
}

function isSupabaseClientCall(call: CallExpression, checker: TypeChecker): boolean {
  if (!ts.isPropertyAccessExpression(call.expression)) {
    return false;
  }

  const signature = checker.getResolvedSignature(call);
  const symbol = checker.getSymbolAtLocation(call.expression.name);
  const declaration =
    signature?.declaration ?? symbol?.valueDeclaration ?? symbol?.declarations?.[0];
  const declarationFile = declaration?.getSourceFile().fileName.replaceAll("\\", "/");

  return declarationFile?.includes("/node_modules/@supabase/supabase-js/") ?? false;
}

function formatDiagnostic(diagnostic: Diagnostic): string {
  return ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
}

export function collectSupabaseSchemaPaths(projectRoot: string): Set<string> {
  const resolvedProjectRoot = resolve(projectRoot);
  const configPath = resolve(resolvedProjectRoot, "tsconfig.json");
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error) {
    throw new Error(`Could not read TypeScript config: ${formatDiagnostic(config.error)}`);
  }

  const parsedConfig = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    resolvedProjectRoot,
    { noEmit: true },
    configPath
  );
  if (parsedConfig.errors.length > 0) {
    throw new Error(
      `Could not parse TypeScript config: ${parsedConfig.errors.map(formatDiagnostic).join("; ")}`
    );
  }

  const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
  const checker = program.getTypeChecker();
  const sourceRoot = resolve(resolvedProjectRoot, "src");
  const paths = new Set<string>();
  let supabaseCallCount = 0;

  for (const sourceFile of program.getSourceFiles()) {
    if (!isApplicationSourceFile(sourceFile.fileName, sourceRoot)) {
      continue;
    }

    const sourcePaths = collectPathsFromSourceFile(sourceFile, (call) => {
      const isSupabaseCall = isSupabaseClientCall(call, checker);
      if (isSupabaseCall) {
        supabaseCallCount += 1;
      }
      return isSupabaseCall;
    });
    for (const path of sourcePaths) {
      paths.add(path);
    }
  }

  if (supabaseCallCount === 0) {
    throw new Error("Supabase source contract scan found no Supabase schema calls");
  }

  return paths;
}
