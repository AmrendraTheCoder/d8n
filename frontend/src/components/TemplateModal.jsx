import React, { useState } from "react";
import { X, FileText, Play, Sparkles, Zap, Lock, Search, Star, ArrowRight, Info, TrendingUp, Cloud, Bot } from "lucide-react";
import { allTemplates } from "../constants/workflowTemplate";

const categories = [
  { id: "all", label: "All Templates", icon: <Sparkles size={16} /> },
  { id: "nexus", label: "Nexus x402", icon: <Lock size={16} />, accent: "purple" },
  { id: "defi", label: "DeFi", icon: <Zap size={16} />, accent: "amber" },
];

const difficultyColors = {
  Beginner: "bg-green-100 text-green-700",
  Intermediate: "bg-amber-100 text-amber-700",
  Advanced: "bg-red-100 text-red-700",
};

const categoryIcons = {
  nexus: <Lock size={20} className="text-violet-500" />,
  defi: <TrendingUp size={20} className="text-amber-500" />,
};

export default function TemplateModal({ isOpen, onClose, onLoadTemplate }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const handleLoadTemplate = (template) => {
    onLoadTemplate(template);
    onClose();
  };

  const filteredTemplates = allTemplates.filter((template) => {
    const matchesCategory = activeCategory === "all" || template.category === activeCategory;
    const matchesSearch = !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredTemplates = filteredTemplates.filter(t => t.featured);
  const regularTemplates = filteredTemplates.filter(t => !t.featured);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText className="text-white" size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Workflow Templates</h2>
                <p className="text-violet-200 text-sm">Start with a pre-built workflow or learn from examples</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              <X size={22} />
            </button>
          </div>

          {/* Search & Category Tabs */}
          <div className="mt-4 flex items-center gap-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div className="flex gap-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeCategory === cat.id
                      ? "bg-white text-violet-700"
                      : "text-white/80 hover:bg-white/10"
                    }`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex h-[60vh]">
          {/* Template List */}
          <div className="w-2/5 border-r border-slate-200 overflow-y-auto bg-slate-50 p-4">
            {/* Featured Templates */}
            {featuredTemplates.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Star size={14} className="text-amber-500" />
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Featured x402 Templates
                  </h3>
                </div>
                <div className="space-y-2">
                  {featuredTemplates.map((template, index) => (
                    <TemplateCard
                      key={index}
                      template={template}
                      isSelected={selectedTemplate === template}
                      onClick={() => setSelectedTemplate(template)}
                      featured
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Templates */}
            {regularTemplates.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  {featuredTemplates.length > 0 ? "More Templates" : "Available Templates"}
                </h3>
                <div className="space-y-2">
                  {regularTemplates.map((template, index) => (
                    <TemplateCard
                      key={index}
                      template={template}
                      isSelected={selectedTemplate === template}
                      onClick={() => setSelectedTemplate(template)}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredTemplates.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <p>No templates found</p>
              </div>
            )}
          </div>

          {/* Template Details */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            {selectedTemplate ? (
              <TemplateDetails
                template={selectedTemplate}
                onLoad={() => handleLoadTemplate(selectedTemplate)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText size={32} className="text-slate-300" />
                  </div>
                  <p className="text-lg font-medium">Select a template</p>
                  <p className="text-sm mt-1">Choose from the list to see details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ template, isSelected, onClick, featured }) {
  const icon = categoryIcons[template.category] || <FileText size={20} className="text-slate-400" />;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${isSelected
          ? "border-violet-400 bg-violet-50 shadow-md"
          : featured
            ? "border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 hover:border-purple-300"
            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
        }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${isSelected ? "scale-110" : ""} transition-transform`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-800 text-sm truncate">
              {template.name}
            </h4>
            {featured && <Star size={12} className="text-amber-500 fill-amber-500 flex-shrink-0" />}
          </div>
          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
            {template.description}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${difficultyColors[template.difficulty]}`}>
              {template.difficulty}
            </span>
            <span className="text-[10px] text-slate-400">
              {template.nodes.length} nodes
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function TemplateDetails({ template, onLoad }) {
  const icon = categoryIcons[template.category] || <FileText size={32} className="text-slate-400" />;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-xl flex items-center justify-center">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-slate-800">{template.name}</h3>
            <p className="text-slate-600 mt-1">{template.description}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${difficultyColors[template.difficulty]}`}>
                {template.difficulty}
              </span>
              <span className="text-sm text-slate-500">
                {template.nodes.length} nodes · {template.edges.length} connections
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Learn More (for x402 templates) */}
      {template.learnMore && (
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-purple-800 text-sm mb-1">How x402 Works</h4>
              <p className="text-sm text-purple-700">{template.learnMore}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nodes Overview */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Zap size={14} />
          Workflow Steps
        </h4>
        <div className="space-y-2">
          {template.nodes.map((node, index) => (
            <div
              key={node.id}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-medium text-slate-800 text-sm">{node.data.label}</h5>
                <p className="text-xs text-slate-500">
                  <span className="font-mono text-violet-600">{node.type}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow Flow */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <ArrowRight size={14} />
          Connections
        </h4>
        <div className="flex flex-wrap gap-2">
          {template.edges.map((edge) => {
            const sourceNode = template.nodes.find((n) => n.id === edge.source);
            const targetNode = template.nodes.find((n) => n.id === edge.target);
            return (
              <div
                key={edge.id}
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg"
              >
                <span className="font-medium truncate max-w-[100px]">{sourceNode?.data.label}</span>
                <ArrowRight size={12} className="text-slate-400" />
                <span className="font-medium truncate max-w-[100px]">{targetNode?.data.label}</span>
                {edge.label && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">
                    {edge.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Load Button */}
      <div className="pt-4 border-t border-slate-200">
        <button
          onClick={onLoad}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl"
        >
          <Play size={18} />
          Load This Template
        </button>
      </div>
    </div>
  );
}
