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
