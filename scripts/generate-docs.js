
/**
 * Complete automated documentation generation script for Enmap TypeScript project
 * 
 * This script:
 * 1. Compiles TypeScript to JavaScript (preserving JSDoc comments)
 * 2. Generates API documentation using jsdoc-to-markdown
 * 3. Formats and saves the documentation to docs/api.md
 */

import { execSync } from 'child_process';
import jsdoc2md from 'jsdoc-to-markdown';
import { writeFile } from 'node:fs/promises';
import { existsSync } from 'fs';

const apiDocsHeader = `---
description: >-
  The complete and unadultered API documentation for every single method and
  property accessible in Enmap.
---

# Full Documentation

The following is the complete list of methods available in Enmap. As it is auto-generated from the source code and its comments, it's a little more "raw" than the Usage docs. However, it has the benefit of being more complete and usually more up to date than the manually written docs.

{% hint style="warning" %}
If you're doing a PR on the docs github, please do not manually edit the below contents, as it will be overwritten. Check the src/index.ts source code and change the comments there instead!
{% endhint %}

<a name="enmap"></a>

## Enmap Class

The Enmap class provides a simple, synchronous, fast key/value storage built around better-sqlite3.
Contains extra utility methods for managing arrays and objects.

`;

async function generateDocumentation() {
  try {
    console.log('🔄 Starting automated documentation generation...\n');

    // Step 1: Compile TypeScript
    console.log('📦 Compiling TypeScript to JavaScript...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ TypeScript compilation completed\n');

    // Step 2: Check if compiled JS exists
    if (!existsSync('./dist/index.js')) {
      throw new Error('Compiled JavaScript file not found at ./dist/index.js');
    }

    // Step 3: Generate JSDoc markdown
    console.log('📚 Generating JSDoc documentation...');
    const rendered = await jsdoc2md.render({ 
      files: './dist/index.js',
    });

    if (!rendered || rendered.trim().length === 0) {
      console.warn('⚠️  Warning: JSDoc generated empty output. This might mean no JSDoc comments were found.');
      console.log('💡 Tip: Add more JSDoc comments to your TypeScript source files for better documentation.');
    }

    // Step 4: Process and format the documentation
    console.log('🎨 Processing and formatting documentation...');
    const processedOutput = rendered
      .replace(/## Members/g, '## Properties')
      .replace(/## Functions/g, '## Methods')
      // Fix references to make them appear as instance methods/properties
      .replace(/\*\*Kind\*\*: global function/g, '**Kind**: instance method of <code>Enmap</code>')
      .replace(/\*\*Kind\*\*: global variable/g, '**Kind**: instance property of <code>Enmap</code>')
      // Clean up any extra whitespace
      .replace(/\n{3,}/g, '\n\n');

    const finalOutput = apiDocsHeader + processedOutput;

    // Step 5: Save the documentation
    await writeFile('./docs/api.md', finalOutput, 'utf8');
    console.log('✅ Documentation processing completed\n');

    // Step 6: Summary
    console.log('📄 Documentation Summary:');
    console.log(`   • Output file: ./docs/api.md`);
    console.log(`   • Content length: ${finalOutput.length} characters`);
    console.log(`   • Methods documented: ${(rendered.match(/## \w+\(/g) || []).length}`);
    console.log(`   • Properties documented: ${(rendered.match(/⇒ <code>\w+<\/code>/g) || []).length}`);
    
    console.log('\n🎉 Documentation generation completed successfully!');
    console.log('\n💡 Tips for better documentation:');
    console.log('   • Add more JSDoc comments to your TypeScript methods');
    console.log('   • Use @param, @returns, @example tags for detailed documentation');
    console.log('   • Run this script after making changes to regenerate docs');

  } catch (error) {
    console.error('❌ Error during documentation generation:');
    console.error(error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Ensure TypeScript compiles without errors');
    console.log('   • Check that JSDoc comments are properly formatted');
    console.log('   • Verify dist/index.js exists after compilation');
    process.exit(1);
  }
}

// Run the documentation generation
generateDocumentation();
