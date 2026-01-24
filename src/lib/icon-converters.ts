import type { IconData } from "@/types/icon";

/**
 * Convert icon name to PascalCase for component names.
 */
function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

/**
 * Convert icon to specified format with optional props.
 */
export async function convertIconToFormat(
  icon: IconData,
  format: "svg" | "react" | "vue" | "svelte" | "json",
  props?: {
    size?: number;
    strokeWidth?: number;
    color?: string;
  }
): Promise<string> {
  switch (format) {
    case "svg":
      return generateSVG(icon, props);
    case "react":
      return generateReactComponent(icon, props);
    case "vue":
      return generateVueComponent(icon, props);
    case "svelte":
      return generateSvelteComponent(icon, props);
    case "json":
      return JSON.stringify(icon, null, 2);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Generate standalone SVG string.
 */
function generateSVG(icon: IconData, props?: { size?: number; strokeWidth?: number; color?: string }): string {
  const size = props?.size || 24;
  const strokeWidth = props?.strokeWidth || (icon.strokeWidth ? parseFloat(icon.strokeWidth) : 2);
  const color = props?.color || "currentColor";

  const attributes = [
    `xmlns="http://www.w3.org/2000/svg"`,
    `width="${size}"`,
    `height="${size}"`,
    `viewBox="${icon.viewBox}"`,
  ];

  // Add stroke/fill based on icon type
  if (icon.defaultStroke) {
    attributes.push(`fill="none"`);
    attributes.push(`stroke="${color}"`);
    attributes.push(`stroke-width="${strokeWidth}"`);
    attributes.push(`stroke-linecap="round"`);
    attributes.push(`stroke-linejoin="round"`);
  } else if (icon.defaultFill) {
    attributes.push(`fill="${color}"`);
  } else {
    // Default to stroke for most icon libraries
    attributes.push(`fill="none"`);
    attributes.push(`stroke="${color}"`);
    attributes.push(`stroke-width="${strokeWidth}"`);
  }

  return `<svg ${attributes.join(" ")}>\n  ${icon.content}\n</svg>`;
}

/**
 * Generate React component.
 */
function generateReactComponent(
  icon: IconData,
  props?: { size?: number; strokeWidth?: number }
): string {
  // Use normalizedName (kebab-case like "check-circle-2") for consistent PascalCase conversion
  const componentName = toPascalCase(icon.normalizedName);
  const defaultSize = props?.size || 24;
  const defaultStrokeWidth = props?.strokeWidth || (icon.strokeWidth ? parseFloat(icon.strokeWidth) : 2);

  let svgAttributes = `viewBox="${icon.viewBox}"`;

  if (icon.defaultStroke) {
    svgAttributes += `\n      fill="none"\n      stroke="currentColor"\n      strokeWidth={strokeWidth}\n      strokeLinecap="round"\n      strokeLinejoin="round"`;
  } else if (icon.defaultFill) {
    svgAttributes += `\n      fill="currentColor"`;
  } else {
    // Default to stroke
    svgAttributes += `\n      fill="none"\n      stroke="currentColor"\n      strokeWidth={strokeWidth}\n      strokeLinecap="round"\n      strokeLinejoin="round"`;
  }

  const propsInterface = icon.defaultStroke || !icon.defaultFill
    ? `export interface ${componentName}Props extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
}`
    : `export interface ${componentName}Props extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}`;

  const defaultProps = icon.defaultStroke || !icon.defaultFill
    ? `  const { size = ${defaultSize}, strokeWidth = ${defaultStrokeWidth}, ...props } = iconProps;`
    : `  const { size = ${defaultSize}, ...props } = iconProps;`;

  return `import React from 'react';

${propsInterface}

export function ${componentName}(iconProps: ${componentName}Props) {
${defaultProps}
  
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      ${svgAttributes}
      {...props}
    >
      ${icon.content}
    </svg>
  );
}

${componentName}.displayName = '${componentName}';
`;
}

/**
 * Generate Vue component.
 */
function generateVueComponent(
  icon: IconData,
  props?: { size?: number; strokeWidth?: number }
): string {
  // Use normalizedName (kebab-case like "check-circle-2") for consistent PascalCase conversion
  const componentName = toPascalCase(icon.normalizedName);
  const defaultSize = props?.size || 24;
  const defaultStrokeWidth = props?.strokeWidth || (icon.strokeWidth ? parseFloat(icon.strokeWidth) : 2);

  let svgAttributes = `:viewBox="viewBox"`;

  if (icon.defaultStroke) {
    svgAttributes += `\n    fill="none"\n    stroke="currentColor"\n    :stroke-width="strokeWidth"\n    stroke-linecap="round"\n    stroke-linejoin="round"`;
  } else if (icon.defaultFill) {
    svgAttributes += `\n    fill="currentColor"`;
  } else {
    svgAttributes += `\n    fill="none"\n    stroke="currentColor"\n    :stroke-width="strokeWidth"\n    stroke-linecap="round"\n    stroke-linejoin="round"`;
  }

  const scriptSetup = icon.defaultStroke || !icon.defaultFill
    ? `<script setup lang="ts">
interface Props {
  size?: number | string;
  strokeWidth?: number | string;
}

const props = withDefaults(defineProps<Props>(), {
  size: ${defaultSize},
  strokeWidth: ${defaultStrokeWidth},
});

const viewBox = '${icon.viewBox}';
</script>`
    : `<script setup lang="ts">
interface Props {
  size?: number | string;
}

const props = withDefaults(defineProps<Props>(), {
  size: ${defaultSize},
});

const viewBox = '${icon.viewBox}';
</script>`;

  return `${scriptSetup}

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    ${svgAttributes}
    v-bind="$attrs"
  >
    ${icon.content}
  </svg>
</template>

<script lang="ts">
export default {
  name: '${componentName}',
  inheritAttrs: false,
};
</script>
`;
}

/**
 * Generate Svelte component.
 */
function generateSvelteComponent(
  icon: IconData,
  props?: { size?: number; strokeWidth?: number }
): string {
  // Use normalizedName (kebab-case like "check-circle-2") for consistent PascalCase conversion
  const componentName = toPascalCase(icon.normalizedName);
  const defaultSize = props?.size || 24;
  const defaultStrokeWidth = props?.strokeWidth || (icon.strokeWidth ? parseFloat(icon.strokeWidth) : 2);

  let svgAttributes = `viewBox="${icon.viewBox}"`;

  if (icon.defaultStroke) {
    svgAttributes += `\n  fill="none"\n  stroke="currentColor"\n  stroke-width={strokeWidth}\n  stroke-linecap="round"\n  stroke-linejoin="round"`;
  } else if (icon.defaultFill) {
    svgAttributes += `\n  fill="currentColor"`;
  } else {
    svgAttributes += `\n  fill="none"\n  stroke="currentColor"\n  stroke-width={strokeWidth}\n  stroke-linecap="round"\n  stroke-linejoin="round"`;
  }

  const scriptContent = icon.defaultStroke || !icon.defaultFill
    ? `<script lang="ts">
  export let size: number | string = ${defaultSize};
  export let strokeWidth: number | string = ${defaultStrokeWidth};
</script>`
    : `<script lang="ts">
  export let size: number | string = ${defaultSize};
</script>`;

  return `${scriptContent}

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  ${svgAttributes}
  {...$$restProps}
>
  ${icon.content}
</svg>

<!--
  @component ${componentName}
  Icon from ${icon.sourceId}
-->
`;
}

// ============================================================================
// Bundle Generators - Single file output for multiple icons (70% smaller)
// ============================================================================

/**
 * Generate a single React file containing all icons as compact arrow functions.
 * Much smaller output than individual components - shared imports and types.
 * Handles name collisions by appending source (e.g., HomePhosphor for phosphor:home).
 */
export function generateReactBundle(
  icons: IconData[],
  props?: { size?: number; strokeWidth?: number }
): string {
  if (icons.length === 0) {
    return `// icons.tsx - Generated by Unicon MCP\n// No icons in bundle\n`;
  }

  const defaultSize = props?.size || 24;
  const defaultStrokeWidth = props?.strokeWidth || 2;

  // Check if any icons need strokeWidth prop
  const hasStrokeIcons = icons.some((icon) => icon.defaultStroke || !icon.defaultFill);

  const typeDefinition = hasStrokeIcons
    ? `type IconProps = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number };`
    : `type IconProps = SVGProps<SVGSVGElement> & { size?: number };`;

  // Track component names to handle collisions
  const nameCount = new Map<string, number>();
  const usedNames = new Set<string>();

  // First pass: count occurrences of each base name
  for (const icon of icons) {
    const baseName = toPascalCase(icon.normalizedName);
    nameCount.set(baseName, (nameCount.get(baseName) || 0) + 1);
  }

  // Generate components with unique names
  const componentData: Array<{ name: string; code: string }> = [];

  for (const icon of icons) {
    const baseName = toPascalCase(icon.normalizedName);
    const isStroke = icon.defaultStroke || !icon.defaultFill;
    const strokeWidth = icon.strokeWidth ? parseFloat(icon.strokeWidth) : defaultStrokeWidth;

    // If name collision, append source ID (e.g., HomePhosphor)
    let componentName = baseName;
    if ((nameCount.get(baseName) || 0) > 1) {
      const sourcePrefix = toPascalCase(icon.sourceId);
      componentName = `${baseName}${sourcePrefix}`;
    }

    // Handle edge case of still-duplicate names (shouldn't happen but be safe)
    if (usedNames.has(componentName)) {
      let counter = 2;
      while (usedNames.has(`${componentName}${counter}`)) {
        counter++;
      }
      componentName = `${componentName}${counter}`;
    }
    usedNames.add(componentName);

    // Build inline SVG attributes
    let svgAttrs = `viewBox="${icon.viewBox}"`;
    if (isStroke) {
      svgAttrs += ` fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"`;
    } else {
      svgAttrs += ` fill="currentColor"`;
    }

    // Compact arrow function format
    const destructure = isStroke
      ? `{ size = ${defaultSize}, strokeWidth = ${strokeWidth}, ...props }`
      : `{ size = ${defaultSize}, ...props }`;

    const code = `export const ${componentName} = (${destructure}: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} ${svgAttrs} {...props}>${icon.content}</svg>
);`;

    componentData.push({ name: componentName, code });
  }

  const exportNames = componentData.map((c) => c.name);

  return `// icons.tsx - Generated by Unicon MCP
// Usage: import { ${exportNames.slice(0, 3).join(", ")}${exportNames.length > 3 ? ", ..." : ""} } from "./icons"
import type { SVGProps } from "react";

${typeDefinition}

${componentData.map((c) => c.code).join("\n\n")}
`;
}

/**
 * Generate a single SVG bundle (all SVGs concatenated with comments).
 */
export function generateSvgBundle(
  icons: IconData[],
  props?: { size?: number; strokeWidth?: number }
): string {
  if (icons.length === 0) {
    return `<!-- No icons in bundle -->`;
  }

  return icons
    .map((icon) => {
      const svg = generateSVG(icon, props);
      return `<!-- ${icon.normalizedName} -->\n${svg}`;
    })
    .join("\n\n");
}

/**
 * Generate a JSON bundle (array of icon data).
 */
export function generateJsonBundle(icons: IconData[]): string {
  if (icons.length === 0) {
    return JSON.stringify({ icons: [], message: "No icons in bundle" }, null, 2);
  }

  return JSON.stringify(
    icons.map((icon) => ({
      id: icon.id,
      name: icon.normalizedName,
      source: icon.sourceId,
      viewBox: icon.viewBox,
      content: icon.content,
    })),
    null,
    2
  );
}
