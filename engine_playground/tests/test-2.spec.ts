import { test, expect } from "@playwright/test";
import { assert } from "console";

// test("verify WebGL2 and extensions", async ({ page }) => {
//   await page.goto('about:blank');

//   const capabilities = await page.evaluate(() => {
//     const canvas = document.createElement('canvas');
//     const gl1 = canvas.getContext('webgl');
//     const gl2 = canvas.getContext('webgl2');

//     return {
//       webgl2Supported: !!gl2,
//       webgl1Supported: !!gl1,
//       maxTextureSize: gl1!.getParameter(gl1!.MAX_TEXTURE_SIZE),
//       // Critical extensions for Babylon.js
//       extensions: {
//         textureFloat: gl1!.getExtension('OES_texture_float'),
//         standardDerivatives: gl1!.getExtension('OES_standard_derivatives'),
//         depthTexture: gl1!.getExtension('WEBGL_depth_texture'),
//       }
//     };
//   });

//   console.log('Capabilities:', capabilities);
//   // expect(capabilities.webgl2Supported).toBeTruthy();
// });

// test("verify WebGL2 and extensions2", async ({ page, browser }) => {
//   // create a canvas element
//   await page.setContent(`<canvas id="canvas"></canvas>`);
//   const canvas = await page.$("#canvas");

//   // get the WebGL2 context
//   const context = await canvas?.evaluateHandle((canvas) => {
//     const gl = (canvas as HTMLCanvasElement).getContext("webgl2");
//     return gl;
//   });

//   // check, if we have hardware acceleration
//   const hardwareAcceleration = await context?.evaluate(() => {
//     const gl = (window as any).gl;
//     const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
//     return debugInfo?.UNMASKED_RENDERER_WEBGL;
//   });

//   // check, if we have the required extensions
//   const extensions = await context?.evaluate(() => {
//     const gl = (window as any).gl;
//     return {
//       textureFloat: gl.getExtension("OES_texture_float"),
//       standardDerivatives: gl.getExtension("OES_standard_derivatives"),
//       depthTexture: gl.getExtension("WEBGL_depth_texture"),
//     };
//   });
  
// });
