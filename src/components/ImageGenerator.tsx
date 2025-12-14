/**
 * src/components/ImageGenerator.tsx
 * Component for generating images with advanced options
 */

import React, { useState } from 'react';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { ImageGenerationRequest } from '@/lib/ai/types-image';

const availableModels = [
  { id: 'dall-e-3', name: 'DALL-E 3', cost: '$0.020' },
  { id: 'flux-pro', name: 'Flux Pro', cost: '$0.014' },
  { id: 'stable-diffusion-xl', name: 'Stable Diffusion XL', cost: '$0.004' },
  { id: 'deepdream', name: 'Deep Dream', cost: '$0.003' },
  { id: 'text2img', name: 'DeepAI Text2Img', cost: '$0.002' },
];

interface ImageGeneratorProps {
  onSuccess?: (url: string) => void;
  workspaceId?: string;
}

export function ImageGenerator({ onSuccess }: ImageGeneratorProps) {
  const { isLoading, isProcessing, error, result, cost, estimatedWaitTime, generate, reset } =
    useImageGeneration();

  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [model, setModel] = useState('dall-e-3');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [steps, setSteps] = useState(30);
  const [guidance, setGuidance] = useState(7.5);
  const [seed, setSeed] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      return;
    }

    const request: ImageGenerationRequest = {
      prompt,
      negativePrompt: negativePrompt || undefined,
      model,
      width,
      height,
      steps: model.includes('dall-e') ? undefined : steps,
      guidance: model.includes('dall-e') ? undefined : guidance,
      seed: seed ? parseInt(seed) : undefined,
    };

    await generate(request);
  };

  const handleRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000).toString());
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-zinc-950 rounded-lg border border-zinc-800">
      <h2 className="text-2xl font-bold text-white mb-6">Image Generator</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Prompt */}
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-zinc-300 mb-2">
            Prompt *
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            rows={4}
            disabled={isLoading || isProcessing}
          />
          <p className="mt-1 text-xs text-zinc-400">
            {prompt.length} characters
          </p>
        </div>

        {/* Negative Prompt */}
        <div>
          <label htmlFor="negative-prompt" className="block text-sm font-medium text-zinc-300 mb-2">
            Negative Prompt (optional)
          </label>
          <textarea
            id="negative-prompt"
            value={negativePrompt}
            onChange={e => setNegativePrompt(e.target.value)}
            placeholder="What to avoid in the image..."
            className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            rows={2}
            disabled={isLoading || isProcessing}
          />
        </div>

        {/* Model Selection */}
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-zinc-300 mb-2">
            Model
          </label>
          <select
            id="model"
            value={model}
            onChange={e => setModel(e.target.value)}
            className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            disabled={isLoading || isProcessing}
          >
            {availableModels.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.cost})
              </option>
            ))}
          </select>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="width" className="block text-sm font-medium text-zinc-300 mb-2">
              Width
            </label>
            <select
              id="width"
              value={width}
              onChange={e => setWidth(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              disabled={isLoading || isProcessing}
            >
              <option value={512}>512px</option>
              <option value={768}>768px</option>
              <option value={1024}>1024px</option>
              <option value={1440}>1440px</option>
              <option value={1792}>1792px</option>
            </select>
          </div>

          <div>
            <label htmlFor="height" className="block text-sm font-medium text-zinc-300 mb-2">
              Height
            </label>
            <select
              id="height"
              value={height}
              onChange={e => setHeight(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              disabled={isLoading || isProcessing}
            >
              <option value={512}>512px</option>
              <option value={768}>768px</option>
              <option value={1024}>1024px</option>
              <option value={1440}>1440px</option>
              <option value={1792}>1792px</option>
            </select>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="border-t border-zinc-800 pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-2"
          >
            {showAdvanced ? '▼' : '▶'} Advanced Options
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              {!model.includes('dall-e') && (
                <>
                  <div>
                    <label htmlFor="steps" className="block text-sm font-medium text-zinc-300 mb-2">
                      Steps: {steps}
                    </label>
                    <input
                      id="steps"
                      type="range"
                      min={10}
                      max={50}
                      value={steps}
                      onChange={e => setSteps(parseInt(e.target.value))}
                      className="w-full"
                      disabled={isLoading || isProcessing}
                    />
                  </div>

                  <div>
                    <label htmlFor="guidance" className="block text-sm font-medium text-zinc-300 mb-2">
                      Guidance: {guidance.toFixed(1)}
                    </label>
                    <input
                      id="guidance"
                      type="range"
                      min={0}
                      max={20}
                      step={0.5}
                      value={guidance}
                      onChange={e => setGuidance(parseFloat(e.target.value))}
                      className="w-full"
                      disabled={isLoading || isProcessing}
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="seed" className="block text-sm font-medium text-zinc-300 mb-2">
                  Seed (for reproducibility)
                </label>
                <div className="flex gap-2">
                  <input
                    id="seed"
                    type="text"
                    value={seed}
                    onChange={e => setSeed(e.target.value)}
                    placeholder="Leave empty for random"
                    className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                    disabled={isLoading || isProcessing}
                  />
                  <button
                    type="button"
                    onClick={handleRandomSeed}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                    disabled={isLoading || isProcessing}
                  >
                    Random
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading || isProcessing}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-700 text-white font-semibold rounded-lg transition-all"
          >
            {isLoading ? 'Generating...' : isProcessing ? 'Processing...' : 'Generate Image'}
          </button>
          {result && (
            <button
              type="button"
              onClick={reset}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Cost Display */}
        {cost > 0 && (
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
            <p className="text-sm text-zinc-300">
              Estimated cost: <span className="text-indigo-400 font-semibold">${cost.toFixed(4)}</span>
            </p>
            {estimatedWaitTime && estimatedWaitTime > 0 && (
              <p className="text-sm text-zinc-400 mt-1">
                Estimated wait time: {(estimatedWaitTime / 1000).toFixed(1)}s
              </p>
            )}
          </div>
        )}
      </form>

      {/* Result Display */}
      {result && (
        <div className="mt-6 border-t border-zinc-800 pt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Generated Image</h3>
          <div className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
            <img
              src={result.url}
              alt="Generated"
              className="w-full"
            />
          </div>
          <div className="mt-4 space-y-2 text-sm text-zinc-300">
            <p><span className="text-zinc-400">Model:</span> {result.model}</p>
            <p><span className="text-zinc-400">Size:</span> {result.dimensions.width}x{result.dimensions.height}</p>
            <p><span className="text-zinc-400">Generation time:</span> {result.generationTime}ms</p>
            {result.metadata.revisedPrompt && (
              <p><span className="text-zinc-400">Revised prompt:</span> {result.metadata.revisedPrompt}</p>
            )}
          </div>
          {onSuccess && (
            <button
              onClick={() => onSuccess(result.url)}
              className="mt-4 w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
            >
              Use This Image
            </button>
          )}
        </div>
      )}
    </div>
  );
}



