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

/** Resize base64 image if > 2MB to keep total payload under Edge Function 6MB limit */
async function resizeImageIfNeeded(base64: string, maxWidth = 1024): Promise<string> {
  if (base64.length < 2 * 1024 * 1024) return base64;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.width <= maxWidth) { resolve(base64); return; }
      const ratio = maxWidth / img.width;
      const canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const resized = canvas.toDataURL('image/jpeg', 0.85);
      console.log(`[ImageGen] Resized image: ${img.width}x${img.height} → ${canvas.width}x${canvas.height} (${Math.round(base64.length / 1024)}KB → ${Math.round(resized.length / 1024)}KB)`);
      resolve(resized);
    };
    img.onerror = () => resolve(base64); // fallback to original on error
    img.src = base64;
  });
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
      const isCompositionMode = node.data.mode === 'composition_visual';
      const isCloneV2 = node.data.mode === 'clone_creative_v2';

      // Find copy data from upstream Copy IA node (for composition_visual mode)
      const copyUp = findUpstreamByType(inputs, 'copy');

      console.log('[Studio:image_gen] Mode:', node.data.mode || 'default');

      // ── clone_creative_v2: use V2 engine (analyze-creative + generate-creative) ──
      if (isCloneV2) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
        if (!supabaseUrl || !supabaseKey) throw new Error('Supabase não configurado');

        const refData = findUpstreamByType(inputs, 'reference');
        const refImage = refData?.image || reference;
        const subImage = subject;
        const textData = findUpstreamByType(inputs, 'text');
        const analysisData = inputs.analysis;

        // Step 1: Analyze if we have analysis from upstream
        let v2Analysis = analysisData || null;
        if (!v2Analysis && refImage) {
          console.log('[Studio:clone_v2] Analyzing reference...');
          try {
            const analyzeResp = await fetch(`${supabaseUrl}/functions/v1/analyze-creative`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
              body: JSON.stringify({ image: refImage }),
            });
            if (analyzeResp.ok) {
              const analyzeResult = await analyzeResp.json();
              v2Analysis = analyzeResult.analysis;
              console.log('[Studio:clone_v2] Analysis OK');
            }
          } catch (e) {
            console.warn('[Studio:clone_v2] Analysis failed:', e);
          }
        }

        // Step 2: Generate
        console.log('[Studio:clone_v2] Generating with Nano Banana Pro...');
        const generateBody: Record<string, unknown> = {
          reference_image: refImage || subImage,
          model: 'nano-banana',
          variation: 10,
          format: '1:1',
        };
        if (subImage && refImage) generateBody.subject_image = subImage;
        if (v2Analysis) generateBody.analysis = v2Analysis;
        if (textData?.fields) {
          const fields = textData.fields as Record<string, string>;
          const replacements = Object.entries(fields)
            .filter(([, v]) => v)
            .map(([, v]) => ({ original: v, replacement: v }));
          if (replacements.length > 0) generateBody.text_replacements = replacements;
        }

        const genResp = await fetch(`${supabaseUrl}/functions/v1/generate-creative`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
          body: JSON.stringify(generateBody),
        });

        if (!genResp.ok) {
          const err = await genResp.text();
          throw new Error(`Clone V2 generation failed (${genResp.status}): ${err.slice(0, 200)}`);
        }

        const genResult = await genResp.json();
        let genImage: string;
        if (genResult.image?.startsWith('data:')) {
          genImage = genResult.image;
        } else if (genResult.image) {
          const imgResp = await fetch(genResult.image);
          const blob = await imgResp.blob();
          genImage = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } else {
          throw new Error('No image in generate-creative response');
        }

        return {
          image: genImage,
          generatedImage: genImage,
          type: 'generated',
          provider: genResult.model || 'nano-banana-pro',
          analysis: v2Analysis,
        };
      }
      console.log('[Studio:image_gen] Prompt length:', prompt.length);
      console.log('[Studio:image_gen] Subject:', subject ? `(${subject.length} chars)` : 'MISSING');
      console.log('[Studio:image_gen] Reference:', reference ? `(${reference.length} chars)` : 'none');
      console.log('[Studio:image_gen] Analysis:', analysis ? 'present' : 'none');
      console.log('[Studio:image_gen] CompositionMode:', isCompositionMode, '| CopyData:', copyUp?.copyData ? 'present' : 'none');

      // ── composition_visual: 2-layer pipeline (visual + Konva text) ──
      // Generate a VISUAL-ONLY image — NO text baked in. All text handled by text_overlay node.
      if (isCompositionMode && analysis) {
        const style = analysis.style || {};
        const layout = analysis.layout || {};
        const textLayout = analysis.textLayout || {};
        const scene = analysis.sceneDescription || analysis.composition?.description || '';

        prompt = `Create a professional product photography image for an advertisement.

CRITICAL — SUBJECT PRESERVATION:
- The uploaded photo contains the REAL product being advertised
- You MUST preserve the exact product from the photo with maximum fidelity
- Maintain the exact shape, texture, color, proportions of every detail
- Do NOT generate a new product, do NOT replace it with a generic version
- The product must be instantly recognizable as the SAME item from the photo

SCENE AND ENVIRONMENT:
${scene}
${style.backgroundDescription ? `Background: ${style.backgroundDescription}` : ''}
Mood: ${style.mood || 'professional'}
Color palette: ${(style.colorScheme || ['#1a1a1a', '#333333']).join(', ')}

PRODUCT PLACEMENT:
- Position the product ${layout.productPosition || 'center'}, ${layout.productSize || 'medium'} size
- Integrate the product naturally with proper lighting, shadows, and reflections
- The product is the HERO — it must be the focal point

ABSOLUTE RULES — ZERO TEXT IN IMAGE:
- DO NOT render ANY text, letters, numbers, words, typography, or watermarks
- DO NOT write headlines, prices, CTAs, brand names, or logos
- The image must contain ONLY visual elements (product, background, lighting, effects)
- Text will be added separately via Canvas 2D overlay — the image MUST be completely text-free

BREATHING SPACE FOR TEXT OVERLAY:
- Overall layout: ${textLayout.overallLayout || 'product centered, text at bottom'}
- Leave clean space at: ${textLayout.headlinePosition || 'bottom-left'} for the headline
- Breathing areas: ${(textLayout.breathingSpaceAreas || ['bottom strip']).join(', ')}
- These areas should have slightly darker/simpler background for text readability

Ultra high quality, 8K detail, proper depth of field, photorealistic.
${(node.data.customPrompt as string) ? `ADDITIONAL INSTRUCTIONS: ${node.data.customPrompt}` : ''}`;
      }

      // ── scene_with_subject: build rich prompt from analysis ──
      if (isSceneMode && analysis) {
        const style = analysis.style || {};
        const layout = analysis.layout || {};
        // Use sceneDescription (verbal, rich) as the core — much better than JSON fields
        const scene = analysis.sceneDescription || analysis.composition?.description || '';

        prompt = `Create a professional advertisement/banner image.

SCENE (recreate this exact style and atmosphere):
${scene}

${style.backgroundDescription ? `BACKGROUND: ${style.backgroundDescription}` : ''}
MOOD: ${style.mood || 'professional'}
COLOR PALETTE: ${(style.colorScheme || ['#1a1a1a', '#333333']).join(', ')}

PRODUCT PLACEMENT:
- Position the product/subject ${layout.productPosition || 'center'}, ${layout.productSize || 'medium'} size
- The product in the input image must be the HERO of the composition
- Maintain the product's EXACT appearance — do not alter its colors, shape, or details
- Integrate the product naturally into the scene with proper lighting, shadows, and reflections

CRITICAL RULES:
- DO NOT add ANY text, typography, numbers, letters, or watermarks
- DO NOT add logos or brand names
- Leave the bottom 25-30% of the image with a slightly darker/cleaner area for text overlay
- Ultra high quality, 8K detail, proper depth of field
- Natural integration of the product with the background

${(node.data.customPrompt as string) ? `ADDITIONAL INSTRUCTIONS: ${node.data.customPrompt}` : ''}`;
      }

      // ── thumbnail: bake the title TEXT into the image via OpenAI GPT Image ──
      // The title and style fields come from the upstream text_input. module
      // 'sys-img-thumbnail' (set on node.data) routes the request to the OpenAI
      // provider in the backend, which renders legible integrated typography.
      if (node.data.mode === 'thumbnail') {
        const textData = findUpstreamByType(inputs, 'text');
        const f = (textData?.fields || inputs.fields || {}) as Record<string, string>;
        const title = (f.title || '').trim();
        prompt = [
          'Professional YouTube/Reels thumbnail, 16:9, high-CTR, bold and eye-catching.',
          f.channel ? `Channel/topic context: ${f.channel}.` : '',
          f.style ? `Visual style: ${f.style}.` : '',
          f.lighting ? `Lighting: ${f.lighting}.` : '',
          f.assets ? `Scene elements: ${f.assets}.` : '',
          subject ? 'Feature the provided subject prominently and keep their identity.' : '',
          title
            ? `Render the title text "${title}" large and INTEGRATED into the design as bold graphic typography with strong outline/shadow for maximum legibility. Spell it EXACTLY as written. No other text.`
            : 'No text unless specified.',
          'Vivid saturated colors, dramatic depth, sharp focus, one clear focal point. The title text must be part of the rendered image.',
        ].filter(Boolean).join(' ');
      }

      console.log('[ImageGen] Final prompt being sent:', prompt.slice(0, 500));

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
        identityStrength: (isSceneMode || isCompositionMode) ? 95 : ((node.data.identityStrength as number) || 90),
        styleStrength: (isSceneMode || isCompositionMode) ? 75 : (reference ? 70 : 45),
        module: (isSceneMode || isCompositionMode) ? 'sys-img-banner' : ((node.data.module as string) || 'studio'),
      };

      // NOTE: compositionMode is intentionally NOT sent to the Edge Function.
      // Imagen 4 (compositionMode=true) bakes text INTO the generated image, producing
      // placeholder text like "(Headline)" and poor typography. Instead, we generate
      // a clean visual-only image here, and the text_overlay node renders all text
      // via Konva/html2canvas with perfect control over typography.
      if (isCompositionMode && copyUp?.copyData) {
        console.log('[Studio:image_gen] composition_visual mode — generating visual-only image (text via text_overlay node)');
        console.log('[Studio:image_gen] Copy data available — headline:', copyUp.copyData.headline?.slice(0, 40), '| cta:', copyUp.copyData.cta?.slice(0, 20));
      }

      if (subject) {
        payload.subjectBase64 = await resizeImageIfNeeded(subject, 1024);
      }
      // Only send styleReferenceBase64 when no analysis is available.
      // When reference_analyzer already ran, the prompt contains the full scene
      // description — sending the raw reference image again wastes ~4MB of payload.
      if (reference && !analysis) {
        payload.styleReferenceBase64 = await resizeImageIfNeeded(reference, 1024);
      } else if (reference && analysis) {
        console.log('[Studio:image_gen] Skipping styleReferenceBase64 — analysis already captured style (saves ~4MB payload)');
      }

      const url = `${supabaseUrl}/functions/v1/generate-image`;
      const bodyStr = JSON.stringify(payload);
      console.log('[Studio:image_gen] Payload keys:', Object.keys(payload));
      console.log('[Studio:image_gen] URL:', url, '| Payload size:', Math.round(bodyStr.length / 1024), 'KB');

      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: bodyStr,
        });
      } catch (fetchErr) {
        const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        console.error('[Studio:image_gen] Fetch failed:', msg, '| URL:', url, '| Payload size:', Math.round(bodyStr.length / 1024), 'KB');
        throw new Error(`Falha na conexão com o servidor de geração. Verifique sua internet e tente novamente. (${msg})`);
      }

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
      const compositionUp = findUpstreamByType(inputs, 'composition');
      const copyUp = findUpstreamByType(inputs, 'copy');
      const generatedUp = findUpstreamByType(inputs, 'generated');

      const composedImg: string | undefined =
        composedData?.image
        || compositionUp?.image
        || generatedUp?.image
        || inputs.image
        || Object.values(inputs).find((v: unknown) => (v as Record<string, unknown>)?.type === 'generated')?.image;

      // Prefer copy data from Copy IA node, fallback to text_input fields
      const rawCopyData = copyUp?.copyData || inputs.copyData;

      // Sanitize: strip placeholder markers that AI models sometimes inject
      function stripPlaceholders(text: string | undefined): string {
        if (!text) return '';
        return text
          .replace(/\(Headline\)/gi, '')
          .replace(/\(Subheadline\)/gi, '')
          .replace(/\(Price\)/gi, '')
          .replace(/\(CTA\)/gi, '')
          .replace(/\(Bluro?\)/gi, '')
          .replace(/\(Contact\)/gi, '')
          .trim();
      }

      const copyData = rawCopyData ? {
        ...rawCopyData,
        headline: stripPlaceholders(rawCopyData.headline),
        subheadline: stripPlaceholders(rawCopyData.subheadline),
        priceFormatted: stripPlaceholders(rawCopyData.priceFormatted),
        cta: stripPlaceholders(rawCopyData.cta),
      } : null;

      const texts = copyData
        ? {
            headline: copyData.headline || '',
            price: copyData.priceFormatted || '',
            cta: copyData.cta || '',
            contact: '',
          }
        : (inputs.fields || inputs.text || {});

      console.log('[Studio:text_overlay] Texts to render:', {
        headline: typeof texts === 'object' ? texts.headline?.slice(0, 40) : 'string',
        price: typeof texts === 'object' ? texts.price : '',
        cta: typeof texts === 'object' ? texts.cta : '',
        hasCopyData: Boolean(copyData),
      });
      const analysis = inputs.analysis
        || Object.values(inputs).find((v: unknown) => (v as Record<string, unknown>)?.analysis)?.analysis;

      if (!composedImg) throw new Error('Imagem não conectada ao overlay de texto');

      const { renderTypographyOverlay, renderCompositionOverlay } = await import('@/services/typographyRenderer');

      const w = (node.data.width as number) || composedData?.width || 1080;
      const h = (node.data.height as number) || composedData?.height || 1080;

      // If compositionData from Composição IA is available, use AI-driven layout
      const rawCompositionData = compositionUp?.compositionData || inputs.compositionData;

      // Clamp composition layout to canvas bounds — prevents text from rendering off-screen
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const compositionData = rawCompositionData ? (() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cd = JSON.parse(JSON.stringify(rawCompositionData)) as any;
        if (cd.layout) {
          cd.layout.textBlockX = Math.max(20, Math.min(cd.layout.textBlockX || 0, w * 0.7));
          cd.layout.textBlockY = Math.max(20, Math.min(cd.layout.textBlockY || 0, h * 0.85));
          cd.layout.textBlockMaxWidth = Math.max(200, Math.min(cd.layout.textBlockMaxWidth || w * 0.5, w * 0.9));
        }
        // Clamp font sizes to reasonable range
        if (cd.headline) cd.headline.fontSize = Math.max(24, Math.min(cd.headline.fontSize || 48, w * 0.08));
        if (cd.price) cd.price.fontSize = Math.max(16, Math.min(cd.price.fontSize || 32, w * 0.06));
        if (cd.cta) cd.cta.fontSize = Math.max(12, Math.min(cd.cta.fontSize || 18, w * 0.03));
        if (cd.subheadline) cd.subheadline.fontSize = Math.max(12, Math.min(cd.subheadline.fontSize || 20, w * 0.035));
        return cd;
      })() : null;

      if (compositionData && copyData) {
        console.log('[Studio:text_overlay] Using Konva renderer (AI composition layout)');
        try {
          const { renderWithKonva } = await import('@/services/konvaRenderer');
          const result = await renderWithKonva({
            generatedImageBase64: composedImg,
            compositionData,
            copyData,
            canvasWidth: w,
            canvasHeight: h,
            tone: (node.data.tone as string) || undefined,
          });
          return {
            image: result,
            type: 'final',
            templateUsed: 'konva-composition-ai',
          };
        } catch (konvaErr) {
          console.warn('[Studio:text_overlay] Konva renderer failed, falling back to html2canvas:', konvaErr);
          const result = await renderCompositionOverlay(composedImg, copyData, compositionData, w, h);
          return {
            image: result,
            type: 'final',
            templateUsed: 'composition-ai-fallback',
          };
        }
      }

      // Fallback: use template-based rendering
      const templateId = (node.data.templateId as string) || undefined;

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

    case 'copy_ai': {
      // Collect product info from upstream text_input (fields) or node.data
      const textData = findUpstreamByType(inputs, 'text');
      const analysisData = findUpstreamByType(inputs, 'analysis');

      const fields = textData?.fields || {};
      const productName = (node.data.productName as string)
        || (fields.headline as string)
        || (inputs.brandName as string)
        || '';
      const productPrice = (node.data.productPrice as string)
        || (fields.price as string)
        || '';

      if (!productName) throw new Error('Nome do produto não informado — conecte um Text Input ou preencha o campo');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      if (!supabaseUrl || !supabaseKey) throw new Error('Supabase não configurado');

      console.log('[Studio:copy_ai] Generating copy for:', productName, '| Price:', productPrice);

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-copy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          productName,
          productPrice: productPrice || undefined,
          currency: (node.data.currency as string) || 'BRL',
          targetAudience: (node.data.targetAudience as string) || undefined,
          tone: (node.data.tone as string) || 'premium',
          language: (node.data.language as string) || 'pt-BR',
          referenceAnalysis: analysisData?.analysis || undefined,
          additionalContext: (node.data.additionalContext as string) || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('[Studio:copy_ai] Failed:', response.status, err.slice(0, 300));
        throw new Error(`Copy generation failed (${response.status}): ${err.slice(0, 200)}`);
      }

      const result = await response.json();
      const copyData = result.copy;
      console.log('[Studio:copy_ai] OK — headline:', copyData.headline, '| cta:', copyData.cta);

      return {
        copyData,
        headline: copyData.headline,
        subheadline: copyData.subheadline,
        priceFormatted: copyData.priceFormatted,
        priceBadgeText: copyData.priceBadgeText,
        cta: copyData.cta,
        tagline: copyData.tagline,
        type: 'copy',
      };
    }

    case 'composition_ai': {
      // Collect generated image + copy data + reference analysis
      const generatedData = findUpstreamByType(inputs, 'generated');
      const copyUpstream = findUpstreamByType(inputs, 'copy');
      const analysisUp = findUpstreamByType(inputs, 'analysis');

      const generatedImage = generatedData?.image || inputs.image || inputs.generatedImage;
      const copyData = copyUpstream?.copyData || inputs.copyData;

      if (!generatedImage) throw new Error('Imagem gerada não conectada — conecte um node Image Gen');
      if (!copyData) throw new Error('Copy não conectado — conecte um node Copy IA');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      if (!supabaseUrl || !supabaseKey) throw new Error('Supabase não configurado');

      const canvasWidth = (node.data.width as number) || 1080;
      const canvasHeight = (node.data.height as number) || 1080;

      console.log('[Studio:composition_ai] Analyzing composition for', canvasWidth, 'x', canvasHeight);

      const response = await fetch(`${supabaseUrl}/functions/v1/analyze-composition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          generatedImageBase64: generatedImage,
          copyData,
          referenceAnalysis: analysisUp?.analysis || undefined,
          canvasWidth,
          canvasHeight,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('[Studio:composition_ai] Failed:', response.status, err.slice(0, 300));
        throw new Error(`Composition analysis failed (${response.status}): ${err.slice(0, 200)}`);
      }

      const result = await response.json();
      const compositionData = result.composition;
      console.log('[Studio:composition_ai] OK — position:', compositionData.layout?.textBlockPosition);

      return {
        compositionData,
        copyData,
        image: generatedImage,
        type: 'composition',
      };
    }

    case 'export': {
      // Prefer final (text_overlay) → color_grade → composed → generated → cutout (bg_removal) → any image
      const finalUp = findUpstreamByType(inputs, 'final');
      const colorUp = findUpstreamByType(inputs, 'color_grade');
      const composedUp = findUpstreamByType(inputs, 'composed');
      const generatedUp = findUpstreamByType(inputs, 'generated');
      const cutoutUp = findUpstreamByType(inputs, 'subject_cutout');

      const image = finalUp?.image
        || colorUp?.image
        || composedUp?.image
        || generatedUp?.image
        || cutoutUp?.image
        || inputs.generatedImage
        || inputs.image;

      if (!image) {
        console.warn('[Studio:export] No image found in upstream — check connections');
      }

      const format = (node.data.format as string) || 'png';
      console.log('[Studio:export] Format:', format, '| Image found:', Boolean(image));

      return {
        image,
        finalImage: image,
        format,
        type: 'export',
      };
    }

    case 'typography': {
      // Typography config node — passes through upstream data + adds typography config
      const typographyConfig = {
        fontFamily: (node.data.fontFamily as string) || 'Inter, sans-serif',
        fontWeight: (node.data.fontWeight as number) || 700,
        fontSize: (node.data.fontSize as number) || 48,
        color: (node.data.color as string) || '#FFFFFF',
        letterSpacing: (node.data.letterSpacing as number) || 0,
        textShadow: (node.data.textShadow as string) || 'none',
        textTransform: (node.data.textTransform as string) || 'none',
      };
      console.log('[Studio:typography] Config:', typographyConfig.fontFamily, typographyConfig.fontSize + 'px');
      return {
        ...inputs,
        typographyConfig,
        type: 'typography',
      };
    }

    case 'color_grade': {
      // Color grading node — applies CSS-like filters to upstream image
      const image = inputs.image || inputs.generatedImage;
      if (!image) {
        console.warn('[Studio:color_grade] No image to grade — passing through');
        return { ...inputs, type: 'color_grade' };
      }

      const mode = (node.data.mode as string) || 'warm';
      const filterMap: Record<string, string> = {
        warm: 'brightness(1.05) contrast(1.08) saturate(1.15) sepia(0.08)',
        cold: 'brightness(1.02) contrast(1.05) saturate(0.9) hue-rotate(10deg)',
        vivid: 'brightness(1.05) contrast(1.15) saturate(1.35)',
        muted: 'brightness(0.98) contrast(0.95) saturate(0.7)',
        dramatic: 'brightness(0.92) contrast(1.25) saturate(1.1)',
        vintage: 'brightness(1.05) contrast(0.9) saturate(0.8) sepia(0.2)',
      };
      const filterStr = filterMap[mode] || filterMap.warm;
      console.log('[Studio:color_grade] Applying mode:', mode, '→', filterStr);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image for color grading'));
        img.src = image;
      });

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.filter = filterStr;
      ctx.drawImage(img, 0, 0);

      const gradedImage = canvas.toDataURL('image/png');
      return {
        image: gradedImage,
        type: 'color_grade',
      };
    }

    default:
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
      case 'text_input': {
        const hasFields = node.data.fields && typeof node.data.fields === 'object';
        outputs[node.id] = hasFields
          ? { text: (node.data.text as string) || '', fields: node.data.fields, type: 'text' }
          : { text: (node.data.text as string) || '', type: 'text' };
        break;
      }
      case 'brand_input':
        outputs[node.id] = {
          brandName: (node.data.brandName as string) || '',
          description: (node.data.description as string) || '',
          type: 'brand',
        };
        break;
    }
  }
}

/**
 * Node types that are critical — if they fail, the flow must stop.
 * Non-critical nodes (like reference_analyzer) can fail and the flow continues.
 */
const CRITICAL_NODE_TYPES: readonly string[] = ['image_gen', 'background_gen', 'compositor', 'copy_ai', 'composition_ai'];

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
