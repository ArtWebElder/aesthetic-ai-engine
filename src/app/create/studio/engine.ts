// src/app/create/studio/engine.ts
// CREATYNG Studio — Real execution engine (ComfyUI-style)
// Each node processes inputs and passes outputs to connected nodes.

import type { StudioNode, Connection } from './types';
import { analyzeReference, buildGenerationPrompt } from '@/services/referenceAnalyzer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NodeOutputs = Record<string, any>;

/**
 * Topological sort — nodes without dependencies execute first.
 */
export function getExecutionOrder(
  nodes: StudioNode[],
  connections: Connection[],
): string[] {
  const inDegree: Record<string, number> = {};
  const adj: Record<string, string[]> = {};

  nodes.forEach((n) => {
    inDegree[n.id] = 0;
    adj[n.id] = [];
  });
  connections.forEach((c) => {
    inDegree[c.toNode] = (inDegree[c.toNode] || 0) + 1;
    adj[c.fromNode] = [...(adj[c.fromNode] || []), c.toNode];
  });

  const queue = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
  const order: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);
    (adj[current] || []).forEach((next) => {
      inDegree[next]--;
      if (inDegree[next] === 0) queue.push(next);
    });
  }

  return order;
}

/**
 * Collect inputs for a node from connected upstream outputs.
 */
export function collectInputs(
  nodeId: string,
  connections: Connection[],
  outputs: NodeOutputs,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inputs: Record<string, any> = {};
  // Keep a list of all upstream outputs for multi-input merging
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allUpstream: any[] = [];

  const incomingConns = connections.filter((c) => c.toNode === nodeId);
  console.log('[Engine] collectInputs for', nodeId, 'connections:', incomingConns.map(c => `${c.fromNode}→${c.toNode}`), 'available outputs:', Object.keys(outputs));

  incomingConns
    .forEach((c) => {
      const sourceOutput = outputs[c.fromNode];
      if (sourceOutput !== undefined) {
        allUpstream.push(sourceOutput);
        if (typeof sourceOutput === 'object' && !Array.isArray(sourceOutput)) {
          Object.assign(inputs, sourceOutput);
        } else {
          inputs[c.fromNode] = sourceOutput;
        }
      }
    });

  inputs._allUpstream = allUpstream;
  return inputs;
}

/**
 * Find a value with a specific type tag from upstream inputs.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findUpstreamByType(inputs: Record<string, any>, type: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all = (inputs._allUpstream as any[]) || [];
  return all.find((v) => v?.type === type);
}

/**
 * Execute a single node with its collected inputs.
 */
export async function executeNode(
  node: StudioNode,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputs: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  switch (node.type) {
    case 'image_upload': {
      return {
        image: (node.data.imageBase64 as string) || null,
        type: 'subject',
      };
    }

    case 'reference_upload': {
      return {
        image: (node.data.imageBase64 as string) || null,
        type: 'reference',
      };
    }

    case 'text_input': {
      // If the node has fields (banner mode), return structured object
      if (node.data.fields && typeof node.data.fields === 'object') {
        return {
          text: (node.data.text as string) || '',
          fields: node.data.fields,
          type: 'text',
        };
      }
      return { text: (node.data.text as string) || '', type: 'text' };
    }

    case 'brand_input': {
      return {
        brandName: (node.data.brandName as string) || '',
        description: (node.data.description as string) || '',
      };
    }

    case 'reference_analyzer': {
      const allUp = (inputs._allUpstream || []) as Array<Record<string, unknown>>;
      console.log('[Studio:reference_analyzer] Upstream count:', allUp.length);
      console.log('[Studio:reference_analyzer] Upstream types:', allUp.map(u => u?.type));
      console.log('[Studio:reference_analyzer] Input keys:', Object.keys(inputs).filter(k => k !== '_allUpstream'));

      const refData = findUpstreamByType(inputs, 'reference');
      const subData = findUpstreamByType(inputs, 'subject');

      console.log('[Studio:reference_analyzer] refData found:', Boolean(refData), refData?.image ? `(${String(refData.image).slice(0, 30)}... ${String(refData.image).length} chars)` : 'NO IMAGE');
      console.log('[Studio:reference_analyzer] subData found:', Boolean(subData), subData?.image ? `(${String(subData.image).slice(0, 30)}... ${String(subData.image).length} chars)` : 'NO IMAGE');

      const refImage = refData?.image as string | undefined;
      const subImage = subData?.image as string | undefined;
      const text = (inputs.text as string) || (inputs.brandName as string) || '';

      if (!refImage) throw new Error('Referência não conectada — suba uma imagem no node "Referência Visual"');
      if (!subImage) throw new Error('Subject não conectado — suba uma imagem no node "Image Upload"');

      console.log('[Studio:reference_analyzer] Calling analyzeReference...');
      const analysis = await analyzeReference(refImage, subImage, {
        headline: text,
      });

      const prompt = buildGenerationPrompt(analysis, { headline: text });
      console.log('[Studio:reference_analyzer] Analysis OK, prompt length:', prompt.length);

      return {
        analysis,
        prompt,
        // Pass through upstream images so downstream nodes can access them
        _refImage: refImage,
        _subImage: subImage,
        type: 'analysis',
      };
    }

    case 'prompt_builder': {
      const parts: string[] = [];
      if (inputs.prompt) parts.push(inputs.prompt as string);
      if (inputs.text) parts.push(inputs.text as string);
      if (inputs.brandName) parts.push(`Brand: ${inputs.brandName as string}`);
      if (inputs.description) parts.push(inputs.description as string);
      if (node.data.customPrompt) parts.push(node.data.customPrompt as string);

      // Fallback: if no upstream prompt arrived (analyzer failed), use custom prompt or default
      let finalPrompt = parts.filter(Boolean).join('\n\n');
      if (!finalPrompt.trim()) {
        finalPrompt = 'Professional product photography. Cinematic lighting, high quality, sharp focus, 8K detail. Agency-grade commercial creative.';
        console.log('[Studio:prompt_builder] No upstream prompt — using default fallback');
      }

      console.log('[Studio:prompt_builder] Final prompt length:', finalPrompt.length);

      // Pass through any upstream images for downstream nodes
      return {
        prompt: finalPrompt,
        analysis: inputs.analysis,
        _refImage: inputs._refImage,
        _subImage: inputs._subImage,
        image: inputs.image,
        type: 'prompt',
      };
    }

    case 'image_gen': {
      let prompt = (inputs.prompt as string) || (node.data.customPrompt as string) || '';
      const analysis = inputs.analysis
        || Object.values(inputs).find((v: any) => v?.analysis)?.analysis;

      // Find subject image
      const subData = findUpstreamByType(inputs, 'subject');
      const subject: string | undefined =
        subData?.image ||
        (inputs._subImage as string) ||
        (inputs.image as string) ||
        undefined;

      // Find reference image
      const refData = findUpstreamByType(inputs, 'reference');
      const reference: string | undefined =
        refData?.image ||
        (inputs._refImage as string) ||
        undefined;

      const isSceneMode = node.data.mode === 'scene_with_subject';

      console.log('[Studio:image_gen] Mode:', node.data.mode || 'default');
      console.log('[Studio:image_gen] Prompt length:', prompt.length);
      console.log('[Studio:image_gen] Subject:', subject ? `(${subject.length} chars)` : 'MISSING');
      console.log('[Studio:image_gen] Reference:', reference ? `(${reference.length} chars)` : 'none');
      console.log('[Studio:image_gen] Analysis:', analysis ? 'present' : 'none');

      // ── scene_with_subject: build rich prompt from analysis ──
      if (isSceneMode && analysis) {
        const style = analysis.style || {};
        const composition = analysis.composition || {};
        const layout = analysis.layout || {};

        prompt = `Create a professional advertisement/banner image.

COMPOSITION REFERENCE: ${composition.description || 'Professional product photography'}

STYLE:
- Mood: ${style.mood || 'professional'}
- Lighting: ${style.lighting || 'studio'}
- Background: ${style.backgroundDescription || 'clean professional background'}
- Color palette: ${(style.colorScheme || ['#1a1a1a', '#333333']).join(', ')}

PRODUCT PLACEMENT:
- Position the product/subject ${layout.productPosition || 'center'}, ${layout.productSize || 'medium'} size
- The product in the input image must be the HERO of the composition
- Maintain the product's EXACT appearance — do not alter its colors, shape, or details
- Integrate the product naturally into the scene with proper lighting, shadows, and reflections

CRITICAL RULES:
- DO NOT add ANY text, typography, numbers, letters, or watermarks
- DO NOT add logos or brand names
- Leave the bottom 25-30% of the image with a slightly darker/cleaner area for text overlay
- The image should look like a professional product photography composition
- Ultra high quality, 8K detail, proper depth of field
- Natural integration of the product with the background

${(node.data.customPrompt as string) ? `ADDITIONAL INSTRUCTIONS: ${node.data.customPrompt}` : ''}`;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase não configurado (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = {
        prompt,
        negativePrompt: 'text, typography, watermark, logo, words, letters, numbers, blurry, low quality, distorted, deformed',
        width: (node.data.width as number) || 1080,
        height: (node.data.height as number) || 1080,
        strictIdentity: Boolean(subject),
        identityStrength: isSceneMode ? 95 : ((node.data.identityStrength as number) || 90),
        styleStrength: isSceneMode ? 75 : (reference ? 70 : 45),
        module: isSceneMode ? 'sys-img-banner' : ((node.data.module as string) || 'studio'),
      };

      if (subject) {
        payload.subjectBase64 = subject;
      }
      if (reference) {
        payload.styleReferenceBase64 = reference;
      }

      console.log('[Studio:image_gen] Payload keys:', Object.keys(payload));

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('[Studio:image_gen] Generation failed:', response.status, err.slice(0, 500));
        throw new Error(`Generation failed (${response.status}): ${err.slice(0, 200)}`);
      }

      const result = await response.json();
      console.log('[Studio:image_gen] Provider:', result.provider || result.meta?.providerName);

      // Handle signedUrl or imageBase64 response
      let imageBase64: string;
      if (result.signedUrl) {
        const imgResp = await fetch(result.signedUrl);
        const blob = await imgResp.blob();
        imageBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } else if (result.imageBase64) {
        imageBase64 = result.imageBase64.startsWith('data:')
          ? result.imageBase64
          : `data:image/png;base64,${result.imageBase64}`;
      } else {
        console.error('[Studio:image_gen] No image in response:', JSON.stringify(result).slice(0, 300));
        throw new Error('Resposta sem imagem — verifique os logs da Edge Function');
      }

      return {
        image: imageBase64,
        generatedImage: imageBase64,
        type: 'generated',
        provider: result.provider || result.meta?.providerName || 'unknown',
        analysis,
      };
    }

    case 'scene_gen': {
      // Same as image_gen for now (scene generation uses the same backend)
      return executeNode({ ...node, type: 'image_gen' }, inputs);
    }

    case 'bg_removal': {
      const image = inputs.image || inputs.generatedImage;
      if (!image) throw new Error('Imagem não conectada');

      const { removeSubjectBackground } = await import(
        '@/features/editor/engine/bgRemoval'
      );
      const result = await removeSubjectBackground(image);
      return { image: result, type: 'subject_cutout' };
    }

    case 'background_gen': {
      let prompt = (inputs.prompt as string) || '';
      const instruction = (node.data.instruction as string) || '';
      const productPosition = inputs.analysis?.layout?.productPosition || 'center';

      // Fallback: if no analysis/prompt arrived, use a generic professional background prompt
      if (!prompt.trim()) {
        console.warn('[Studio:background_gen] No upstream prompt — using generic fallback');
        prompt = 'Professional product photography background. Clean, modern studio environment with subtle gradient lighting. Dark elegant tones. High quality, 8K detail.';
      }

      const bgPrompt = `${prompt}\n\nCRITICAL INSTRUCTIONS: ${instruction}\n- Generate ONLY the background scene/environment\n- DO NOT include any product, person, food item or main subject\n- DO NOT include any text, typography, logos or watermarks\n- Leave clear space where the product would be placed (${productPosition})\n- The background should complement a product that will be composited on top\n- Ultra high quality, 8K detail, professional photography lighting`;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      if (!supabaseUrl || !supabaseKey) throw new Error('Supabase não configurado');

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          prompt: bgPrompt,
          negativePrompt: 'product, person, people, food, text, typography, watermark, logo, letters, words, main subject',
          width: (node.data.width as number) || 1080,
          height: (node.data.height as number) || 1080,
          strictIdentity: false,
          styleStrength: 60,
          module: 'sys-img-background',
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Falha ao gerar fundo (${response.status}): ${err.slice(0, 200)}`);
      }

      const result = await response.json();
      let bgImage: string;
      if (result.signedUrl) {
        const imgResp = await fetch(result.signedUrl);
        const blob = await imgResp.blob();
        bgImage = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } else if (result.imageBase64) {
        bgImage = result.imageBase64.startsWith('data:')
          ? result.imageBase64
          : `data:image/png;base64,${result.imageBase64}`;
      } else {
        throw new Error('Resposta sem imagem do backend');
      }

      return {
        backgroundImage: bgImage,
        image: bgImage,
        type: 'background',
        analysis: inputs.analysis,
      };
    }

    case 'compositor': {
      const subjectData = findUpstreamByType(inputs, 'subject_cutout');
      const bgData = findUpstreamByType(inputs, 'background');
      const subjectImg: string | undefined = subjectData?.image;
      const bgImg: string | undefined = bgData?.backgroundImage || bgData?.image;

      if (!subjectImg) throw new Error('Subject recortado não conectado');
      if (!bgImg) throw new Error('Fundo gerado não conectado');

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const width = (node.data.width as number) || 1080;
      const height = (node.data.height as number) || 1080;
      canvas.width = width;
      canvas.height = height;

      // Draw background
      const bgImage = new Image();
      bgImage.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        bgImage.onload = () => resolve();
        bgImage.onerror = () => reject(new Error('Failed to load background'));
        bgImage.src = bgImg;
      });
      ctx.drawImage(bgImage, 0, 0, width, height);

      // Shadow
      if (node.data.shadowEnabled) {
        ctx.shadowColor = `rgba(0,0,0,${(node.data.shadowOpacity as number) || 0.3})`;
        ctx.shadowBlur = (node.data.shadowBlur as number) || 20;
        ctx.shadowOffsetY = 8;
      }

      // Draw subject
      const subImg = new Image();
      subImg.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        subImg.onload = () => resolve();
        subImg.onerror = () => reject(new Error('Failed to load subject'));
        subImg.src = subjectImg;
      });

      const scale = (node.data.subjectScale as number) || 0.65;
      const subW = width * scale;
      const subH = (subImg.height / subImg.width) * subW;
      const position = (node.data.subjectPosition as string) || 'center';

      let x = (width - subW) / 2;
      let y = (height - subH) / 2;
      if (position === 'left') { x = width * 0.05; y = height - subH - height * 0.05; }
      if (position === 'right') { x = width - subW - width * 0.05; y = height - subH - height * 0.05; }
      if (position === 'bottom-center') { x = (width - subW) / 2; y = height - subH; }

      ctx.drawImage(subImg, x, y, subW, subH);
      ctx.shadowColor = 'transparent';

      return {
        image: canvas.toDataURL('image/png'),
        type: 'composed',
        width,
        height,
      };
    }

    case 'text_overlay': {
      const composedData = findUpstreamByType(inputs, 'composed');
      const composedImg: string | undefined = composedData?.image || inputs.image
        || Object.values(inputs).find((v: any) => v?.type === 'generated')?.image;
      const texts = inputs.fields || inputs.text || {};
      const analysis = inputs.analysis
        || Object.values(inputs).find((v: any) => v?.analysis)?.analysis;

      if (!composedImg) throw new Error('Imagem não conectada ao overlay de texto');

      const { renderTypographyOverlay } = await import('@/services/typographyRenderer');

      const templateId = (node.data.templateId as string) || undefined;
      const w = (node.data.width as number) || composedData?.width || 1080;
      const h = (node.data.height as number) || composedData?.height || 1080;

      const result = await renderTypographyOverlay(
        composedImg,
        {
          headline: typeof texts === 'string' ? texts : (texts.headline || ''),
          price: typeof texts === 'object' ? texts.price : '',
          cta: typeof texts === 'object' ? texts.cta : '',
          contact: typeof texts === 'object' ? texts.contact : '',
        },
        analysis,
        templateId,
        w,
        h,
      );

      return {
        image: result,
        type: 'final',
        templateUsed: templateId || 'auto',
      };
    }

    case 'export': {
      const image = inputs.generatedImage || inputs.image;
      return {
        image,
        finalImage: image,
        format: (node.data.format as string) || 'png',
        type: 'export',
      };
    }

    case 'typography':
    case 'color_grade':
    default:
      // Pass-through for nodes not yet implemented
      return { ...inputs, type: node.type };
  }
}

/**
 * Input node types that hold data directly (no upstream dependencies).
 * Their outputs are pre-populated before the flow runs so downstream
 * nodes can always find them — even when running a single node.
 */
const INPUT_NODE_TYPES: readonly string[] = [
  'image_upload',
  'reference_upload',
  'text_input',
  'brand_input',
];

/**
 * Pre-populate outputs for all input nodes from their node.data.
 * Input nodes don't depend on upstream — their data is already in node.data
 * (set by the UI when the user uploads an image or types text).
 */
export function prePopulateInputOutputs(
  nodes: StudioNode[],
  outputs: NodeOutputs,
): void {
  for (const node of nodes) {
    if (!INPUT_NODE_TYPES.includes(node.type)) continue;
    // Don't overwrite if already executed
    if (outputs[node.id] !== undefined) continue;

    switch (node.type) {
      case 'image_upload':
        if (node.data.imageBase64) {
          outputs[node.id] = {
            image: node.data.imageBase64 as string,
            type: 'subject',
          };
          console.log(`[Engine:prePopulate] ${node.id} (image_upload) → subject image (${String(node.data.imageBase64).length} chars)`);
        }
        break;
      case 'reference_upload':
        if (node.data.imageBase64) {
          outputs[node.id] = {
            image: node.data.imageBase64 as string,
            type: 'reference',
          };
          console.log(`[Engine:prePopulate] ${node.id} (reference_upload) → reference image (${String(node.data.imageBase64).length} chars)`);
        }
        break;
      case 'text_input':
        outputs[node.id] = { text: (node.data.text as string) || '' };
        break;
      case 'brand_input':
        outputs[node.id] = {
          brandName: (node.data.brandName as string) || '',
          description: (node.data.description as string) || '',
        };
        break;
    }
  }
}

/**
 * Node types that are critical — if they fail, the flow must stop.
 * Non-critical nodes (like reference_analyzer) can fail and the flow continues.
 */
const CRITICAL_NODE_TYPES: readonly string[] = ['image_gen', 'background_gen', 'compositor'];

/**
 * Execute entire flow sequentially in topological order.
 */
export async function executeFlow(
  nodes: StudioNode[],
  connections: Connection[],
  onNodeStart: (nodeId: string) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onNodeDone: (nodeId: string, output: any) => void,
  onNodeError: (nodeId: string, error: string) => void,
): Promise<NodeOutputs> {
  const order = getExecutionOrder(nodes, connections);
  const outputs: NodeOutputs = {};

  // Pre-populate input node outputs from node.data
  // so downstream nodes always find their data.
  prePopulateInputOutputs(nodes, outputs);

  console.log('[Engine:executeFlow] Pre-populated outputs:', Object.keys(outputs));
  console.log('[Engine:executeFlow] Execution order:', order);

  for (const nodeId of order) {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    onNodeStart(nodeId);

    try {
      const inputs = collectInputs(nodeId, connections, outputs);
      console.log(`[Engine:executeFlow] Node ${nodeId} (${node.type}) inputs:`, Object.keys(inputs).filter(k => k !== '_allUpstream'));
      const output = await executeNode(node, inputs);
      outputs[nodeId] = output;
      onNodeDone(nodeId, output);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Execution failed';
      console.error(`[Studio] Node ${nodeId} (${node.type}) failed:`, error);
      onNodeError(nodeId, msg);

      // Only stop the flow for critical nodes (image_gen).
      // Non-critical nodes (reference_analyzer) can fail — downstream
      // nodes have fallback logic (e.g. prompt_builder uses default prompt).
      if (CRITICAL_NODE_TYPES.includes(node.type)) {
        console.warn(`[Engine] Critical node ${node.type} failed — stopping flow.`);
        break;
      }
      console.warn(`[Engine] Non-critical node ${node.type} failed — continuing flow.`);
    }
  }

  return outputs;
}
