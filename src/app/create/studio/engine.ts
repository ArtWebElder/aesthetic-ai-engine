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

  connections
    .filter((c) => c.toNode === nodeId)
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
      return { text: (node.data.text as string) || '' };
    }

    case 'brand_input': {
      return {
        brandName: (node.data.brandName as string) || '',
        description: (node.data.description as string) || '',
      };
    }

    case 'reference_analyzer': {
      const refData = findUpstreamByType(inputs, 'reference');
      const subData = findUpstreamByType(inputs, 'subject');
      const refImage = refData?.image;
      const subImage = subData?.image;
      const text = inputs.text || inputs.brandName || '';

      if (!refImage) throw new Error('Referência não conectada');
      if (!subImage) throw new Error('Subject não conectado');

      const analysis = await analyzeReference(refImage, subImage, {
        headline: text,
      });

      return {
        analysis,
        prompt: buildGenerationPrompt(analysis, { headline: text }),
        type: 'analysis',
      };
    }

    case 'prompt_builder': {
      const parts: string[] = [];
      if (inputs.prompt) parts.push(inputs.prompt);
      if (inputs.text) parts.push(inputs.text);
      if (inputs.brandName) parts.push(`Brand: ${inputs.brandName}`);
      if (inputs.description) parts.push(inputs.description);
      if (node.data.customPrompt) parts.push(node.data.customPrompt as string);

      const finalPrompt = parts.filter(Boolean).join('\n\n');
      return { prompt: finalPrompt, analysis: inputs.analysis, type: 'prompt' };
    }

    case 'image_gen': {
      const prompt = inputs.prompt || (node.data.customPrompt as string) || '';
      const subData = findUpstreamByType(inputs, 'subject');
      const refData = findUpstreamByType(inputs, 'reference');
      const subject = subData?.image || inputs.subjectBase64;
      const reference = refData?.image || inputs.styleReferenceBase64;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase não configurado (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
      }

      const payload = {
        prompt,
        negativePrompt: 'text, typography, watermark, logo, words, letters, blurry, low quality',
        width: (node.data.width as number) || 1080,
        height: (node.data.height as number) || 1080,
        subjectBase64: subject,
        styleReferenceBase64: reference,
        strictIdentity: Boolean(subject),
        identityStrength: (node.data.identityStrength as number) || 90,
        styleStrength: reference ? 70 : 45,
        module: (node.data.module as string) || 'studio',
      };

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
        throw new Error(`Generation failed: ${err}`);
      }

      const result = await response.json();

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
        throw new Error('Resposta sem imagem');
      }

      return {
        image: imageBase64,
        generatedImage: imageBase64,
        type: 'generated',
        provider: result.provider || result.meta?.providerName || 'unknown',
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
      return { image: result, type: 'subject' };
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

  for (const nodeId of order) {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    onNodeStart(nodeId);

    try {
      const inputs = collectInputs(nodeId, connections, outputs);
      const output = await executeNode(node, inputs);
      outputs[nodeId] = output;
      onNodeDone(nodeId, output);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Execution failed';
      console.error(`[Studio] Node ${nodeId} (${node.type}) failed:`, error);
      onNodeError(nodeId, msg);
      break; // Stop flow on first error
    }
  }

  return outputs;
}
