import { useState, useEffect } from 'react'
import { api } from '../api.js'

// Fallback model list when API is unavailable
const FALLBACK_MODELS = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic', label: 'Anthropic' },
  { id: 'claude-opus-4-5',          name: 'Claude Opus 4',   provider: 'anthropic', label: 'Anthropic' },
  { id: 'gpt-4o',                   name: 'GPT-4o',          provider: 'openai',    label: 'OpenAI'    },
  { id: 'gpt-4o-mini',              name: 'GPT-4o Mini',     provider: 'openai',    label: 'OpenAI'    },
  { id: 'gemini-1.5-pro',           name: 'Gemini 1.5 Pro',  provider: 'google',    label: 'Google'    },
  { id: 'gemini-1.5-flash',         name: 'Gemini 1.5 Flash',provider: 'google',    label: 'Google'    },
  { id: 'meta-llama/Llama-3-70b-chat-hf', name: 'Llama 3 70B', provider: 'together', label: 'Together AI' },
]

const PROVIDER_ORDER = ['anthropic', 'openai', 'google', 'together']
const PROVIDER_LABELS = {
  anthropic: 'Anthropic (Claude)',
  openai:    'OpenAI',
  google:    'Google (Gemini)',
  together:  'Together AI (Llama)',
}

export default function ModelSelector({ value, onChange, defaultProvider, defaultModel }) {
  const [models, setModels] = useState(FALLBACK_MODELS)
  const [selectedProvider, setSelectedProvider] = useState(defaultProvider || 'anthropic')
  const [selectedModel, setSelectedModel] = useState(value || defaultModel || 'claude-sonnet-4-20250514')

  useEffect(() => {
    api.getModels()
      .then(data => { if (Array.isArray(data) && data.length) setModels(data) })
      .catch(() => {}) // silently fall back to hardcoded list
  }, [])

  const grouped = PROVIDER_ORDER.reduce((acc, p) => {
    const list = models.filter(m => m.provider === p)
    if (list.length) acc[p] = list
    return acc
  }, {})

  function handleChange(e) {
    const modelId = e.target.value
    const m = models.find(m => m.id === modelId)
    setSelectedModel(modelId)
    if (m) setSelectedProvider(m.provider)
    onChange?.({ model: modelId, provider: m?.provider || selectedProvider })
  }

  return (
    <div className="model-selector-wrap">
      <label>AI Model</label>
      <select value={selectedModel} onChange={handleChange}>
        {Object.entries(grouped).map(([provider, list]) => (
          <optgroup key={provider} label={PROVIDER_LABELS[provider] || provider}>
            {list.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
